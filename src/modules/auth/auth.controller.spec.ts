import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { AuthController } from './auth.controller.ts';
import { AuthService } from './auth.service.ts';
import { NdiService } from './ndi.service.ts';

describe('AuthController', () => {
  let app: TestingModule;
  let authController: AuthController;
  let authService: AuthService;
  let ndiService: NdiService;

  const mockAuthService = {
    loginCitizen: jest.fn(),
    loginAdmin: jest.fn(),
    authenticateViaNDI: jest.fn(),
    refreshAccessToken: jest.fn(),
    logout: jest.fn(),
  };

  const mockNdiService = {
    createProofRequest: jest.fn(),
    authenticate: jest.fn(),
    listenForNatsResponse: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
    on: jest.fn(),
  };

  beforeAll(async () => {
    app = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: NdiService,
          useValue: mockNdiService,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
      imports: [],
    }).compile();

    authController = app.get<AuthController>(AuthController);
    authService = app.get<AuthService>(AuthService);
    ndiService = app.get<NdiService>(NdiService);
  });

  describe('AuthController', () => {
    it('should be defined', () => {
      expect(authController).toBeDefined();
    });

    it('should have authService injected', () => {
      expect(authService).toBeDefined();
    });

    it('should have ndiService injected', () => {
      expect(ndiService).toBeDefined();
    });
  });
});
