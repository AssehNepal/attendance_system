import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  connect,
  type NatsConnection,
  StringCodec,
  nkeyAuthenticator,
} from 'nats';

import { CreateProofRequestDto } from '../dto/create-proof-request.dto';

@Injectable()
export class NdiService {
  private readonly logger = new Logger(NdiService.name);
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;
  private tokenType: string = 'Bearer';
  private natsConnection: NatsConnection | null = null;

  constructor(private configService: ConfigService) {}

  /**
   * Authenticate with NDI using OAuth 2.0 Client Credentials
   * Caches the token with a 5-minute buffer before expiry
   * @returns The access token string
   */
  async authenticate(): Promise<string> {
    // Check if we have a valid cached token
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const authUrl = this.configService.get<string>('NDI_AUTH_URL');
    const clientId = this.configService.get<string>('NDI_CLIENT_ID');
    const clientSecret = this.configService.get<string>('NDI_CLIENT_SECRET');
    const grantType = this.configService.get<string>(
      'NDI_GRANT_TYPE',
      'client_credentials',
    );

    // Validate required environment variables
    if (!authUrl) {
      throw new Error(
        'NDI_AUTH_URL is not configured in environment variables',
      );
    }
    if (!clientId) {
      throw new Error(
        'NDI_CLIENT_ID is not configured in environment variables',
      );
    }
    if (!clientSecret) {
      throw new Error(
        'NDI_CLIENT_SECRET is not configured in environment variables',
      );
    }

    const params = new URLSearchParams({
      grant_type: grantType,
      client_id: clientId,
      client_secret: clientSecret,
    });

    this.logger.log('='.repeat(80));
    this.logger.log('NDI OAuth Authentication Request');
    this.logger.log('='.repeat(80));
    this.logger.log(`URL: ${authUrl}`);
    this.logger.log(`Grant Type: ${grantType}`);
    this.logger.log(`Client ID: ${clientId}`);
    this.logger.log(`Body: ${params.toString()}`);
    this.logger.log('='.repeat(80));

    try {
      const response = await fetch(authUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      this.logger.log(
        `OAuth Response Status: ${response.status} ${response.statusText}`,
      );

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error('OAuth Error Response:', errorText);
        throw new Error(
          `OAuth authentication failed: ${response.status} - ${errorText}`,
        );
      }

      const data = (await response.json()) as {
        access_token: string;
        expires_in: number;
        token_type: string;
      };

      this.accessToken = data.access_token;
      this.tokenType = data.token_type || 'Bearer';

      // Cache token with 5-minute buffer
      const expiresIn = data.expires_in || 86400; // Default 24 hours if not provided
      this.tokenExpiry = Date.now() + (expiresIn - 300) * 1000;

      this.logger.log(
        `Successfully authenticated with NDI OAuth (expires in ${expiresIn}s)`,
      );
      return this.accessToken;
    } catch (error) {
      this.logger.error('Failed to authenticate with NDI', error);
      throw error;
    }
  }

  /**
   * Get the current NDI access token (will authenticate if needed)
   * Use this method to get the token for calling other NDI protected services
   * @returns Object with access token and token type
   */
  async getAccessToken(): Promise<{ accessToken: string; tokenType: string }> {
    const token = await this.authenticate();
    return {
      accessToken: token,
      tokenType: this.tokenType,
    };
  }

  /**
   * Get authorization header value for NDI API calls
   * @returns Authorization header string (e.g., "Bearer eyJraWQ...")
   */
  async getAuthorizationHeader(): Promise<string> {
    const token = await this.authenticate();
    return `${this.tokenType} ${token}`;
  }

  /**
   * Create a proof request for digital identity verification
   * Returns threadId, deepLinkURL, proofRequestURL (QR code), and access token for other NDI API calls
   */
  async createProofRequest(dto: CreateProofRequestDto): Promise<{
    proofRequestThreadId: string;
    deepLinkURL: string;
    proofRequestURL: string;
    accessToken: string;
    tokenType: string;
  }> {
    const token = await this.authenticate();
    const verifierUrl = this.configService.get<string>('NDI_VERIFIER_URL');
    const schemaName = this.configService.get<string>('NDI_SCHEMA_NAME');

    // Validate required environment variables
    if (!verifierUrl) {
      throw new Error(
        'NDI_VERIFIER_URL is not configured in environment variables',
      );
    }
    if (!schemaName) {
      throw new Error(
        'NDI_SCHEMA_NAME is not configured in environment variables',
      );
    }

    const proofName = dto.proofName || 'Verify Foundational ID';
    const attributes = dto.attributes || ['ID Number', 'Full Name'];

    // Build request body with correct format
    const requestBody = {
      proofName,
      proofAttributes: attributes.map((attr) => ({
        name: attr,
        restrictions: [
          {
            schema_name: schemaName,
          },
        ],
      })),
    };

    try {
      const response = await fetch(`${verifierUrl}/verifier/v1/proof-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `${this.tokenType} ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Proof request creation failed: ${response.status} - ${errorText}`,
        );
      }

      const response_data = await response.json();

      // Log the complete API response for debugging
      this.logger.log('='.repeat(80));
      this.logger.log('📡 PROOF REQUEST API RESPONSE');
      this.logger.log('='.repeat(80));
      this.logger.log(`Response Status: ${response.status}`);
      this.logger.log('Response Body:');
      this.logger.log(JSON.stringify(response_data, null, 2));
      this.logger.log('='.repeat(80));

      // Extract the actual data from the nested response
      const data = (response_data as any).data || response_data;

      // Extract threadId - it's in data.proofRequestThreadId
      const threadId =
        data.proofRequestThreadId ||
        data.thread_id ||
        data.threadId ||
        data.id ||
        data.proofRequestId ||
        data.requestId;

      this.logger.log(`Extracted ThreadId: ${threadId}`);
      this.logger.log(`Request body: ${JSON.stringify(requestBody, null, 2)}`);

      // Start listening for NATS response in background
      void this.listenForNatsResponse(threadId);

      return {
        ...data,
        accessToken: token,
        tokenType: this.tokenType,
      };
    } catch (error) {
      this.logger.error('Failed to create proof request', error);
      throw error;
    }
  }

  /**
   * Listen for NATS response on the proof request thread
   * This runs in the background and logs the presentation when received
   */
  async listenForNatsResponse(threadId: string): Promise<void> {
    try {
      const natsUrl = this.configService.get<string>('NDI_NATS_URL');
      const natsSeed = this.configService.get<string>('NDI_NATS_SEED');

      // Validate NATS configuration
      if (!natsUrl) {
        this.logger.warn('NDI_NATS_URL not configured, skipping NATS listener');
        return;
      }
      if (!natsSeed || natsSeed === 'your_nkey_seed_here') {
        this.logger.warn(
          'NDI_NATS_SEED not configured or invalid, skipping NATS listener',
        );
        return;
      }

      this.logger.log('='.repeat(80));
      this.logger.log('NATS Connection Setup');
      this.logger.log('='.repeat(80));
      this.logger.log(`NATS URL: ${natsUrl}`);
      this.logger.log(`Thread ID: ${threadId}`);
      this.logger.log('='.repeat(80));

      // Connect to NATS with NKey authentication
      this.natsConnection = await connect({
        servers: [natsUrl],
        authenticator: nkeyAuthenticator(new TextEncoder().encode(natsSeed)),
        name: 'census-auth-service',
      });

      this.logger.log(`✅ Connected to NDI NATS for threadId: ${threadId}`);

      // Handle connection closure
      this.natsConnection.closed().then((err) => {
        if (err) {
          this.logger.error(`NATS connection closed: ${err.message}`);
        } else {
          this.logger.log('NATS connection closed normally');
        }
      });

      const sc = StringCodec();
      const subject = threadId; // Subscribe directly to threadId as per nats.md
      const subscription = this.natsConnection.subscribe(subject);

      this.logger.log(`📡 Subscribed to subject: ${subject}`);
      this.logger.log('Waiting for NDI verification response...');

      // Listen for messages in background (async iterator pattern)
      (async () => {
        try {
          for await (const msg of subscription) {
            const messageString = sc.decode(msg.data);
            this.logger.log('='.repeat(80));
            this.logger.log('📨 RAW NATS MESSAGE RECEIVED');
            this.logger.log('='.repeat(80));
            this.logger.log(messageString);
            this.logger.log('='.repeat(80));

            try {
              const parsed = JSON.parse(messageString);
              // Handle potential data wrapping (standard vs envelope)
              const data = parsed.data ?? parsed;

              this.logger.log('='.repeat(80));
              this.logger.log('📋 PARSED MESSAGE DATA');
              this.logger.log('='.repeat(80));
              this.logger.log(JSON.stringify(data, null, 2));
              this.logger.log('='.repeat(80));

              if (data.type) {
                this.logger.log(`Event Type: ${data.type}`);
              }

              // Check for terminal states (Success or Failure)
              if (
                data.type === 'present-proof/presentation-result' ||
                data.type === 'present-proof/rejected'
              ) {
                this.logger.log('='.repeat(80));
                this.logger.log('✅ TERMINAL EVENT RECEIVED');
                this.logger.log('='.repeat(80));

                if (data.type === 'present-proof/presentation-result') {
                  this.handleVerificationResult(data);
                } else {
                  this.logger.warn('❌ Proof request was rejected by user');
                }

                // Cleanup: Stop listening after terminal event
                subscription.unsubscribe();
                await this.closeNatsConnection();
                break;
              } else {
                this.logger.log(
                  `Intermediate event: ${data.type}, continuing to listen...`,
                );
              }
            } catch (parseError) {
              this.logger.error(
                'Failed to parse NATS message as JSON:',
                parseError,
              );
              this.logger.log('Raw message:', messageString);
            }
          }
        } catch (err) {
          this.logger.error('Subscription error:', err);
        }
      })();
    } catch (error) {
      this.logger.error('Failed to listen for NATS response', error);
      // Don't throw - this is a background operation
    }
  }

  /**
   * Handle verification result from NDI
   */
  private handleVerificationResult(data: any): void {
    this.logger.log('='.repeat(80));
    this.logger.log('🎉 NDI PROOF VALIDATED');
    this.logger.log('='.repeat(80));

    if (data.verification_result === 'ProofValidated') {
      const attributes = data.requested_presentation?.revealed_attrs;

      if (attributes) {
        this.logger.log('📝 Revealed Attributes:');
        this.logger.log('='.repeat(80));

        // Extract attributes - values are returned as arrays
        const idNumber = attributes['ID Number']?.[0]?.value;
        const fullName = attributes['Full Name']?.[0]?.value;
        const dateOfBirth = attributes['Date of Birth']?.[0]?.value;
        const gender = attributes['Gender']?.[0]?.value;

        if (idNumber) this.logger.log(`ID Number: ${idNumber}`);
        if (fullName) this.logger.log(`Full Name: ${fullName}`);
        if (dateOfBirth) this.logger.log(`Date of Birth: ${dateOfBirth}`);
        if (gender) this.logger.log(`Gender: ${gender}`);

        // Log all attributes
        this.logger.log('='.repeat(80));
        this.logger.log('All Attributes (Raw):');
        this.logger.log(JSON.stringify(attributes, null, 2));
      } else {
        this.logger.warn('No revealed attributes found in response');
      }
    } else {
      this.logger.warn(`Verification result: ${data.verification_result}`);
    }

    this.logger.log('='.repeat(80));
  }

  /**
   * Close NATS connection (cleanup)
   */
  async closeNatsConnection(): Promise<void> {
    if (this.natsConnection) {
      await this.natsConnection.close();
      this.natsConnection = null;
      this.logger.log('NATS connection closed');
    }
  }

  /**
   * Health check for NDI service
   */
  async healthCheck(): Promise<{ status: string; authenticated: boolean }> {
    try {
      await this.authenticate();
      return {
        status: 'healthy',
        authenticated: true,
      };
    } catch {
      return {
        status: 'unhealthy',
        authenticated: false,
      };
    }
  }
}
