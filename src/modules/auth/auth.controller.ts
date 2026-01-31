import { EventEmitter2 } from '@nestjs/event-emitter';
import type { Request, Response } from 'express';
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Get,
  Req,
  Res,
  Param,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';

import { AuthService } from './auth.service';
import type { LoginResponse } from './auth.service';
import { NdiService } from './ndi.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { CreateProofRequestDto } from './dto/create-proof-request.dto';
import { PublicRoute } from '../../decorators/public-route.decorator';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private ndiService: NdiService,
    private eventEmitter: EventEmitter2,
  ) {}

  @Post('ndi/user-login')
  @HttpCode(HttpStatus.OK)
  @PublicRoute()
  @ApiOperation({
    summary: 'Create NDI Proof Request - Returns QR Code and Deep Link',
    description:
      'Initiates NDI verification flow. User scans QR code or clicks deep link to approve in NDI app. Response will be logged in terminal once user approves.',
  })
  @ApiBody({
    type: CreateProofRequestDto,
    required: false,
    description:
      'Optional request body. If not provided, defaults will be used.',
    examples: {
      census: {
        summary: 'Census Identity Verification (Recommended)',
        value: {
          proofName: 'Verify Identity for Census',
          attributes: ['ID Number', 'Full Name', 'Date of Birth', 'Gender'],
        },
      },
      basic: {
        summary: 'Basic Verification',
        value: {
          proofName: 'Verify Foundational ID',
          attributes: ['ID Number', 'Full Name'],
        },
      },
      empty: {
        summary: 'Use Defaults (Empty body)',
        value: {},
      },
    },
  })
  @ApiOkResponse({
    description:
      'Proof request created successfully. Contains thread ID, deep link for mobile, QR code URL, and access token for subsequent API calls.',
    schema: {
      example: {
        proofRequestThreadId: 'abc123-def456-ghi789',
        deepLinkURL: 'bhutanndi://proof-request?threadId=abc123',
        proofRequestURL: 'https://staging.bhutanndi.com/qr/abc123',
        accessToken: 'eyJraWQiOiJzd3hhdGVQK1...',
        tokenType: 'Bearer',
      },
    },
  })
  async createNdiProofRequest(
    @Body() createProofRequestDto: CreateProofRequestDto,
  ): Promise<{
    proofRequestThreadId: string;
    deepLinkURL: string;
    proofRequestURL: string;
    accessToken: string;
    tokenType: string;
  }> {
    return this.ndiService.createProofRequest(createProofRequestDto);
  }

  @Post('ndi/admin-login')
  @HttpCode(HttpStatus.OK)
  @PublicRoute()
  @ApiOperation({
    summary: 'Admin NDI Login',
    description: 'Initiates NDI verification flow for administrators. Only existing admins can log in.',
  })
  async createAdminNdiProofRequest(
    @Body() createProofRequestDto: CreateProofRequestDto,
  ): Promise<{
    proofRequestThreadId: string;
    deepLinkURL: string;
    proofRequestURL: string;
    accessToken: string;
    tokenType: string;
  }> {
    return this.ndiService.createProofRequest(createProofRequestDto, 'ADMIN');
  }

  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  @PublicRoute()
  @ApiOkResponse({
    type: LoginResponseDto,
    description: 'Admin/Super Admin login - requires pre-registration',
  })
  async adminLogin(
    @Body() adminLoginDto: AdminLoginDto,
    @Req() req: Request,
  ): Promise<LoginResponse> {
    const ipAddress = this.getClientIp(req);
    const userAgent = req.headers['user-agent'] as string;
    return this.authService.loginAdmin(adminLoginDto, ipAddress, userAgent);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @PublicRoute()
  @ApiOkResponse({
    description:
      'Refresh access token using refresh token (with automatic rotation)',
  })
  async refreshToken(
    @Body('refreshToken') refreshToken: string,
    @Req() req: Request,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const ipAddress = this.getClientIp(req);
    const userAgent = req.headers['user-agent'] as string;
    return this.authService.refreshAccessToken(
      refreshToken,
      ipAddress,
      userAgent,
    );
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @PublicRoute()
  @ApiOkResponse({
    description: 'Logout (revoke refresh token)',
  })
  async logout(
    @Body('refreshToken') refreshToken: string,
  ): Promise<{ message: string }> {
    await this.authService.logout(refreshToken);
    return { message: 'Logged out successfully' };
  }

  @Get('ndi/health')
  @HttpCode(HttpStatus.OK)
  @PublicRoute()
  @ApiOperation({ summary: 'Check NDI service health status' })
  @ApiOkResponse({
    description: 'Returns NDI service health status',
  })
  async ndiHealthCheck(): Promise<{
    status: string;
    authenticated: boolean;
  }> {
    return this.ndiService.healthCheck();
  }

  @Get('ndi/test-auth')
  @HttpCode(HttpStatus.OK)
  @PublicRoute()
  @ApiOperation({ summary: 'Test NDI OAuth authentication only' })
  @ApiOkResponse({
    description: 'Returns access token info if authentication succeeds',
  })
  async testNdiAuth(): Promise<{
    accessToken: string;
    tokenType: string;
  }> {
    return this.ndiService.getAccessToken();
  }

  @Get('ndi/stream/:threadId')
  @PublicRoute()
  @ApiOperation({
    summary: 'Stream NDI verification status via Server-Sent Events',
  })
  @ApiOkResponse({
    description: 'SSE stream of verification status updates and login token',
  })
  streamNdiStatus(
    @Param('threadId') threadId: string,
    @Res() response: Response,
  ) {
    response.setHeader('Content-Type', 'text/event-stream');
    response.setHeader('Cache-Control', 'no-cache, no-transform');
    response.setHeader('Connection', 'keep-alive');
    response.flushHeaders();

    const eventName = `ndi.verification.${threadId}`;
    console.log(`🔌 [streamNdiStatus] Client connected to SSE stream for thread: ${threadId}`);
    
    const listener = (payload: any) => {
      response.write(`data: ${JSON.stringify(payload)}\n\n`);

      if (
        payload.status === 'verified' || 
        payload.status === 'failed' || 
        payload.status === 'rejected'
      ) {
        response.end();
      }
    };

    this.eventEmitter.on(eventName, listener);

    const interval = setInterval(() => {
      if (!response.writableEnded) {
        response.write(': keepalive\n\n');
      }
    }, 15000);

    response.on('close', () => {
      clearInterval(interval);
      this.eventEmitter.off(eventName, listener);
    });

    setTimeout(() => {
      if (!response.writableEnded) {
        response.write(`data: ${JSON.stringify({ status: 'timeout' })}\n\n`);
        response.end();
        this.eventEmitter.off(eventName, listener);
      }
    }, 300000);
  }

  private getClientIp(req: Request): string {
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor && typeof forwardedFor === 'string') {
      return forwardedFor.split(',')[0]?.trim() ?? '';
    }
    return req.ip ?? req.socket?.remoteAddress ?? 'unknown';
  }
}
