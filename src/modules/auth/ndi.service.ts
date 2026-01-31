import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  connect,
  type NatsConnection,
  StringCodec,
  nkeyAuthenticator,
} from 'nats';

import { CreateProofRequestDto } from './dto/create-proof-request.dto';

import { ModuleRef } from '@nestjs/core';
import { AuthService } from './auth.service';

// ... existing imports

@Injectable()
export class NdiService {
  private readonly logger = new Logger(NdiService.name);
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;
  private tokenType: string = 'Bearer';
  private natsConnection: NatsConnection | null = null;

  // Store login context (ADMIN or CITIZEN) for each thread
  private verificationContexts: Map<string, 'ADMIN' | 'CITIZEN'> = new Map();
  
  // Lazily injected property
  private authService!: AuthService;

  constructor(
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
    private moduleRef: ModuleRef,
  ) {}

  onModuleInit() {
    this.authService = this.moduleRef.get(AuthService, { strict: false });
  }

  /**
   * Authenticate with NDI to get Bearer token
   */
  async authenticate(): Promise<string> {
    const authUrl = this.configService.get<string>('NDI_AUTH_URL');
    const clientId = this.configService.get<string>('NDI_CLIENT_ID');
    const clientSecret = this.configService.get<string>('NDI_CLIENT_SECRET');

    if (!authUrl || !clientId || !clientSecret) {
      throw new Error('NDI Authentication configuration missing');
    }

    // Return cached token if valid
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      // Handle potential double path if Env var includes the path already
      const url = authUrl.endsWith('/authenticate') 
        ? authUrl 
        : `${authUrl}/authentication/v1/authenticate`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'client_credentials',
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Authentication failed: ${response.status} - ${text}`);
      }

      const data = await response.json() as any;
      this.accessToken = data.access_token;
      // Expires in seconds (usually 3600), buffer 60s
      this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
      
      return this.accessToken as string;
    } catch (err) {
      this.logger.error('Failed to authenticate with NDI', err);
      throw err;
    }
  }

  /**
   * Get formatted access token (used by controller test endpoint)
   */
  async getAccessToken(): Promise<{ accessToken: string; tokenType: string }> {
    const token = await this.authenticate();
    return {
      accessToken: token,
      tokenType: this.tokenType,
    };
  }

  /**
   * Create a proof request for digital identity verification
   * Returns threadId, deepLinkURL, proofRequestURL (QR code), and access token for other NDI API calls
   */
  async createProofRequest(
    dto: CreateProofRequestDto,
    loginType: 'ADMIN' | 'CITIZEN' = 'CITIZEN',
  ): Promise<{
    proofRequestThreadId: string;
    deepLinkURL: string;
    proofRequestURL: string;
    accessToken: string;
    tokenType: string;
  }> {
    const token = await this.authenticate();
    const verifierUrl = this.configService.get<string>('NDI_VERIFIER_URL');
    const schemaName = this.configService.get<string>('NDI_SCHEMA_NAME');

    if (!verifierUrl) throw new Error('NDI_VERIFIER_URL not configured');
    if (!schemaName) throw new Error('NDI_SCHEMA_NAME not configured');

    const proofName = dto.proofName || 'Verify Foundational ID';
    const attributes = dto.attributes || ['ID Number', 'Full Name'];

    const requestBody = {
      proofName,
      proofAttributes: attributes.map((attr) => ({
        name: attr,
        restrictions: [{ schema_name: schemaName }],
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
        throw new Error(`Proof request failed: ${response.status} - ${errorText}`);
      }

      const response_data = await response.json();
      const data = (response_data as any).data || response_data;

      // Extract threadId
      const threadId =
        data.proofRequestThreadId ||
        data.thread_id ||
        data.threadId ||
        data.id ||
        data.proofRequestId ||
        data.requestId;

      this.logger.log(`Extracted ThreadId: ${threadId}`);
      
      // Store context for this thread
      this.verificationContexts.set(threadId, loginType);
      this.logger.log(`📝 Set login context to ${loginType} for thread ${threadId}`);

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
      this.logger.log(
        `🔌 Connection status: ${this.natsConnection.isClosed() ? 'CLOSED' : 'OPEN'}`,
      );
      this.logger.log(
        `🔌 Server info: ${JSON.stringify(this.natsConnection.info, null, 2)}`,
      );

      // Handle connection closure
      this.natsConnection.closed().then((err) => {
        if (err) {
          this.logger.error(
            `NATS connection closed with error: ${err.message}`,
          );
        } else {
          this.logger.log('NATS connection closed normally');
        }
      });

      const sc = StringCodec();
      const subject = threadId; // Subscribe directly to threadId as per nats.md
      const subscription = this.natsConnection.subscribe(subject);

      this.logger.log(`📡 Subscribed to subject: ${subject}`);
      this.logger.log(`📡 Subscription object created: ${!!subscription}`);
      this.logger.log(`📡 Is subscription closed: ${subscription.isClosed()}`);
      this.logger.log('Waiting for NDI verification response...');
      this.logger.log('⏳ Listening for messages on NATS...');

      // Listen for messages in background (async iterator pattern)
      (async () => {
        try {
          this.logger.log('🔄 Starting async iterator loop...');
          let messageCount = 0;
          for await (const msg of subscription) {
            messageCount++;
            this.logger.log(`📬 Message #${messageCount} received!`);
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
                  const ndiData = this.handleVerificationResult(data);


                  if (ndiData) {
                    this.logger.log(`✅ Emitting verification event for ${threadId}`);
                    
                    const loginType = this.verificationContexts.get(threadId) || 'CITIZEN';
                    this.logger.log(`🔍 Processing login for context: ${loginType}`);

                    // ---------------------------------------------------------
                    // AUTO-LOGIN LOGIC
                    // ---------------------------------------------------------
                    try {
                      this.logger.log(`⏳ Auto-logging in user with CID: ${ndiData.cidNo}`);
                      
                      const loginData = await this.authService.authenticateViaNDI(
                         { cidNo: ndiData.cidNo }, 
                         loginType,
                         '0.0.0.0', 
                         'NDI-Background-Verification'
                      );
                      
                      this.logger.log(`🎉 Auto-Login (${loginType}) Successful!`);
                      
                      // Emit specific event with FULL login data
                      this.eventEmitter.emit(`ndi.verification.${threadId}`, {
                        status: 'verified',
                        cidNo: ndiData.cidNo,
                        loginData: loginData
                      });
                      
                      // Clean up context
                       this.verificationContexts.delete(threadId);
                      
                    } catch (err: any) {
                       this.logger.error(`❌ Auto-Login (${loginType}) Failed:`, err);
                       this.eventEmitter.emit(`ndi.verification.${threadId}`, {
                          status: 'failed',
                          error: err.message || 'Auto-login failed after verification'
                       });
                       this.verificationContexts.delete(threadId);
                    }
                  } else {
                    this.eventEmitter.emit(`ndi.verification.${threadId}`, {
                      status: 'failed',
                      error: 'CID not found in proof',
                    });
                  }
                } else {
                  this.logger.warn('❌ Proof request was rejected by user');
                  this.eventEmitter.emit(`ndi.verification.${threadId}`, {
                    status: 'rejected',
                  });
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
          this.logger.log('🔚 Async iterator loop ended (no more messages)');
        } catch (err) {
          this.logger.error('❌ Subscription error:', err);
          this.logger.error(
            'Error stack:',
            err instanceof Error ? err.stack : 'No stack',
          );
        }
        this.logger.log('🏁 NATS listener function completed');
      })();
    } catch (error) {
      this.logger.error('Failed to listen for NATS response', error);
      // Don't throw - this is a background operation
    }
  }

  /**
   * Handle verification result from NDI
   * Extracts CID for authentication
   */
  private handleVerificationResult(data: any): {
    cidNo: string;
  } | null {
    this.logger.log('='.repeat(80));
    this.logger.log('🎉 NDI PROOF VALIDATED');
    this.logger.log('='.repeat(80));

    if (data.verification_result === 'ProofValidated') {
      const attributes = data.requested_presentation?.revealed_attrs;

      if (attributes) {
        this.logger.log('📝 Revealed Attributes:');
        this.logger.log('='.repeat(80));

        // Extract CID - the only attribute we need for authentication
        const cidNo = attributes['ID Number']?.[0]?.value;

        if (cidNo) {
          this.logger.log(`✅ Verified CID Number: ${cidNo}`);
        } else {
          this.logger.error('❌ CID Number not found in NDI response');
          return null;
        }

        // Log all attributes for debugging
        this.logger.log('='.repeat(80));
        this.logger.log('All Attributes (Raw):');
        this.logger.log(JSON.stringify(attributes, null, 2));
        this.logger.log('='.repeat(80));

        // Return only CID for authentication
        return {
          cidNo,
        };
      } else {
        this.logger.warn('No revealed attributes found in response');
      }
    } else {
      this.logger.warn(`Verification result: ${data.verification_result}`);
    }

    this.logger.log('='.repeat(80));
    return null;
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
