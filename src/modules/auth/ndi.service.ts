import { Injectable, Logger } from '@nestjs/common';
import type { OnModuleInit } from '@nestjs/common';
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

@Injectable()
export class NdiService implements OnModuleInit {
  private readonly logger = new Logger(NdiService.name);
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;
  private tokenType: string = 'Bearer';
  private natsConnection: NatsConnection | null = null;

  // Store login context (ADMIN or CITIZEN) and timestamp for each thread
  private verificationContexts: Map<
    string,
    { type: 'ADMIN' | 'CITIZEN'; timestamp: number }
  > = new Map();

  // Cleanup settings
  private readonly VERIFICATION_TTL_MS = 10 * 60 * 1000; // 10 minutes
  private readonly CLEANUP_INTERVAL_MS = 60 * 1000; // 1 minute
  private readonly MAX_ENTRIES = 1000;

  // Concurrency protection
  private tokenRefreshPromise: Promise<string> | null = null;

  // Internal NATS for multi-pod synchronization
  private internalNats: NatsConnection | null = null;
  private readonly INTERNAL_BROADCAST_CHANNEL = 'auth.ndi.verification';

  // Lazily injected property
  private authService!: AuthService;

  constructor(
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
    private moduleRef: ModuleRef,
  ) {}

  onModuleInit() {
    this.authService = this.moduleRef.get(AuthService, { strict: false });
    this.startCleanupInterval();
    this.connectToInternalNats().catch((err) =>
      this.logger.warn(
        `Failed to connect to internal NATS for multi-pod sync: ${err.message}`,
      ),
    );
  }

  private startCleanupInterval() {
    setInterval(() => {
      const now = Date.now();
      let cleaned = 0;
      for (const [threadId, context] of this.verificationContexts.entries()) {
        if (now - context.timestamp > this.VERIFICATION_TTL_MS) {
          this.verificationContexts.delete(threadId);
          cleaned++;
        }
      }
      if (cleaned > 0) {
        this.logger.log(`🧹 Cleaned up ${cleaned} stale verification contexts`);
      }
    }, this.CLEANUP_INTERVAL_MS);
  }

  private async connectToInternalNats() {
    const natsEnabled =
      this.configService.get<string>('NATS_ENABLED') === 'true';
    const natsHost = this.configService.get<string>('NATS_HOST');
    const natsPort = this.configService.get<string>('NATS_PORT');

    if (!natsEnabled || !natsHost || !natsPort) return;

    try {
      this.internalNats = await connect({
        servers: [`${natsHost}:${natsPort}`],
        name: `auth-service-internal-${process.pid}`,
      });
      this.logger.log(
        '✅ Connected to internal NATS for multi-pod synchronization',
      );

      // Listen for broadcasts from other pods
      const sc = StringCodec();
      const sub = this.internalNats.subscribe(this.INTERNAL_BROADCAST_CHANNEL);
      (async () => {
        for await (const msg of sub) {
          try {
            const data = JSON.parse(sc.decode(msg.data));
            this.handleInternalBroadcast(data);
          } catch (e) {
            this.logger.error('Failed to parse internal NATS message', e);
          }
        }
      })();
    } catch (err) {
      this.logger.error('Failed to connect to internal NATS', err);
    }
  }

  private handleInternalBroadcast(data: any) {
    const { threadId, ndiData, loginData, status, error } = data;

    this.logger.log(`📢 Received internal broadcast for thread: ${threadId}`);

    this.eventEmitter.emit(`ndi.verification.${threadId}`, {
      status,
      cidNo: ndiData?.cidNo,
      loginData,
      error,
    });

    // Cleanup local context if it exists
    this.verificationContexts.delete(threadId);
  }

  /**
   * Authenticate with NDI to get Bearer token
   */
  async authenticate(): Promise<string> {
    // Return cached token if valid
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    // DOG-PILING PROTECTION: If a refresh is already in progress, wait for it
    if (this.tokenRefreshPromise) {
      this.logger.log('⏳ Waiting for existing NDI token refresh...');
      return this.tokenRefreshPromise;
    }

    this.tokenRefreshPromise = this.fetchNewToken();
    try {
      return await this.tokenRefreshPromise;
    } finally {
      this.tokenRefreshPromise = null;
    }
  }

  private async fetchNewToken(): Promise<string> {
    const authUrl = this.configService.get<string>('NDI_AUTH_URL');
    const clientId = this.configService.get<string>('NDI_CLIENT_ID');
    const clientSecret = this.configService.get<string>('NDI_CLIENT_SECRET');

    if (!authUrl || !clientId || !clientSecret) {
      throw new Error('NDI Authentication configuration missing');
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

      const data = (await response.json()) as any;
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
        throw new Error(
          `Proof request failed: ${response.status} - ${errorText}`,
        );
      }

      const response_data = await response.json();
      const data = (response_data as any).data || response_data;

      const threadId =
        data.proofRequestThreadId || data.thread_id || data.threadId || data.id;

      this.logger.log(`Extracted ThreadId: ${threadId}`);

      if (this.verificationContexts.size >= this.MAX_ENTRIES) {
        const oldestKey = this.verificationContexts.keys().next().value;
        if (oldestKey) {
          this.verificationContexts.delete(oldestKey);
        }
      }

      this.verificationContexts.set(threadId, {
        type: loginType,
        timestamp: Date.now(),
      });
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

  async listenForNatsResponse(threadId: string): Promise<void> {
    try {
      const natsUrl = this.configService.get<string>('NDI_NATS_URL');
      const natsSeed = this.configService.get<string>('NDI_NATS_SEED');

      if (!natsUrl || !natsSeed || natsSeed === 'your_nkey_seed_here') return;

      this.natsConnection = await connect({
        servers: [natsUrl],
        authenticator: nkeyAuthenticator(new TextEncoder().encode(natsSeed)),
        name: 'census-auth-service',
      });

      const sc = StringCodec();
      const subscription = this.natsConnection.subscribe(threadId);

      (async () => {
        for await (const msg of subscription) {
          try {
            const data =
              JSON.parse(sc.decode(msg.data)).data ??
              JSON.parse(sc.decode(msg.data));

            if (
              data.type === 'present-proof/presentation-result' ||
              data.type === 'present-proof/rejected'
            ) {
              if (data.type === 'present-proof/presentation-result') {
                const ndiData = this.handleVerificationResult(data);
                if (ndiData) {
                  const context = this.verificationContexts.get(threadId);
                  const loginType = context?.type || 'CITIZEN';

                  try {
                    const loginData = await this.authService.authenticateViaNDI(
                      { cidNo: ndiData.cidNo },
                      loginType,
                      '0.0.0.0',
                      'NDI-Background-Verification',
                    );

                    this.logger.log(`✅ [NDI Login Response] Complete login data for CID ${ndiData.cidNo}:`, {
                      message: loginData.message,
                      accessToken: loginData.accessToken ? `${loginData.accessToken ?? 'N/A'}` : 'N/A',
                      refreshToken: loginData.refreshToken ? `${loginData.refreshToken ?? 'N/A'}` : 'N/A',
                      expiresIn: loginData.expiresIn,
                      user: loginData.user ? {
                        id: loginData.user.id,
                        cidNo: loginData.user.cidNo,
                        roleType: loginData.user.roleType,
                        roles: loginData.user.roles,
                      } : 'N/A',
                      ability: loginData.ability ? `${loginData.ability.length} abilities granted` : 'No abilities',
                    });

                    const result = {
                      status: 'verified',
                      cidNo: ndiData.cidNo,
                      loginData,
                    };
                    this.eventEmitter.emit(
                      `ndi.verification.${threadId}`,
                      result,
                    );
                    this.broadcastResult({
                      ...result,
                      threadId,
                      ndiData,
                      loginType,
                    });
                  } catch (err: any) {
                    const result = { status: 'failed', error: err.message };
                    this.eventEmitter.emit(
                      `ndi.verification.${threadId}`,
                      result,
                    );
                    this.broadcastResult({ ...result, threadId, loginType });
                  }
                }
              } else {
                this.eventEmitter.emit(`ndi.verification.${threadId}`, {
                  status: 'rejected',
                });
              }
              subscription.unsubscribe();
              await this.closeNatsConnection();
              break;
            }
          } catch (e) {
            this.logger.error('Error handling NDI NATS message', e);
          }
        }
      })();
    } catch (error) {
      this.logger.error('Failed to listen for NATS response', error);
    }
  }

  private broadcastResult(data: any) {
    if (this.internalNats) {
      const sc = StringCodec();
      this.internalNats.publish(
        this.INTERNAL_BROADCAST_CHANNEL,
        sc.encode(JSON.stringify(data)),
      );
    }
    this.verificationContexts.delete(data.threadId);
  }

  private handleVerificationResult(data: any): { cidNo: string } | null {
    if (data.verification_result === 'ProofValidated') {
      const cidNo =
        data.requested_presentation?.revealed_attrs?.['ID Number']?.[0]?.value;
      if (cidNo) return { cidNo };
    }
    return null;
  }

  async closeNatsConnection(): Promise<void> {
    if (this.natsConnection) {
      await this.natsConnection.close();
      this.natsConnection = null;
    }
  }

  async healthCheck(): Promise<{ status: string; authenticated: boolean }> {
    try {
      await this.authenticate();
      return { status: 'healthy', authenticated: true };
    } catch {
      return { status: 'unhealthy', authenticated: false };
    }
  }
}
