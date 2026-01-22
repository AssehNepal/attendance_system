# NDI (National Digital Identity) Service Integration

## Overview

The NDI Service integrates with Bhutan's National Digital Identity authentication system. It provides a clean HTTP client for authenticating and obtaining access tokens from the NDI service.

## Location

- **Service**: `src/modules/auth/services/ndi.service.ts`
- **Controller**: `src/modules/auth/auth.controller.ts` (endpoints: `/auth/ndi/*`)
- **DTO**: `src/modules/auth/dto/ndi-auth-response.dto.ts`

## Configuration

### Environment Variables

Add these variables to your `.env` file:

```env
# NDI Configuration
BHUTAN_NDI_AUTH_URL=https://staging.bhutanndi.com/authentication
BHUTAN_NDI_CLIENT_ID=your-client-id-here
BHUTAN_NDI_CLIENT_SECRET=your-client-secret-here
BHUTAN_NDI_WEBHOOK_GRANT_TYPE=client_credentials
```

### Configuration Loading

The service loads configuration from:

1. `ConfigService` (recommended for NestJS apps)
2. `process.env` (fallback)

## Features

### 1. **Automatic Configuration Loading** ✅

- Reads credentials from ConfigService or environment variables
- Validates configuration on service initialization
- Logs configuration status (without exposing secrets)

### 2. **Default Authentication** ✅

```typescript
// Authenticate using configured credentials
const response = await ndiService.authenticate();
console.log(response.access_token);
```

### 3. **Custom Credentials Authentication** ✅

```typescript
// Authenticate with custom credentials
const response = await ndiService.authenticateWithCredentials('custom-client-id', 'custom-client-secret', 'client_credentials');
```

### 4. **Quick Token Access** ✅

```typescript
// Get just the access token
const token = await ndiService.getAccessToken();
```

### 5. **Comprehensive Error Handling** ✅

- Catches and transforms Axios errors
- Provides detailed error messages
- Logs errors for debugging
- Returns appropriate HTTP status codes

## API Endpoints

### POST `/auth/ndi/authenticate`

Authenticate with Bhutan NDI service using configured credentials.

**Authentication Required**: Yes (Admin or Super Admin)
**Permission Required**: `create` on `Admin`

**Response**:

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "read write"
}
```

**cURL Example**:

```bash
curl -X POST http://localhost:5001/auth/ndi/authenticate \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

### GET `/auth/ndi/token`

Get only the NDI access token (convenience endpoint).

**Authentication Required**: Yes (Admin or Super Admin)
**Permission Required**: `read` on `Admin`

**Response**:

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**cURL Example**:

```bash
curl -X GET http://localhost:5001/auth/ndi/token \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Usage Examples

### In a Controller

```typescript
import { NdiService } from './services/ndi.service';

@Controller('my-controller')
export class MyController {
  constructor(private readonly ndiService: NdiService) {}

  @Get('verify-ndi')
  async verifyWithNdi() {
    try {
      // Get NDI token
      const ndiToken = await this.ndiService.getAccessToken();

      // Use the token for further NDI API calls
      // ...

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
```

### In a Service

```typescript
import { NdiService } from './ndi.service';

@Injectable()
export class MyService {
  constructor(private readonly ndiService: NdiService) {}

  async doSomethingWithNdi() {
    // Authenticate and get full response
    const authResponse = await this.ndiService.authenticate();

    console.log('Token expires in:', authResponse.expires_in, 'seconds');

    // Use the token
    const token = authResponse.access_token;
    // Make authenticated requests to NDI APIs...
  }
}
```

## Request/Response Flow

```
┌─────────────────────────────────────────────────────────┐
│  Client Application                                     │
│  (Admin authenticated)                                  │
└─────────────────┬───────────────────────────────────────┘
                  │
                  │ POST /auth/ndi/authenticate
                  │ Authorization: Bearer <admin_token>
                  ▼
┌─────────────────────────────────────────────────────────┐
│  AuthController (NestJS)                                │
│  - Validates admin authentication                       │
│  - Checks permissions                                   │
└─────────────────┬───────────────────────────────────────┘
                  │
                  │ ndiService.authenticate()
                  ▼
┌─────────────────────────────────────────────────────────┐
│  NdiService                                             │
│  - Loads configuration                                  │
│  - Validates required config                            │
│  - Prepares request body                                │
└─────────────────┬───────────────────────────────────────┘
                  │
                  │ HTTP POST
                  │ {
                  │   client_id: "...",
                  │   client_secret: "...",
                  │   grant_type: "client_credentials"
                  │ }
                  ▼
┌─────────────────────────────────────────────────────────┐
│  Bhutan NDI Service                                     │
│  https://staging.bhutanndi.com/authentication          │
└─────────────────┬───────────────────────────────────────┘
                  │
                  │ Response
                  │ {
                  │   access_token: "...",
                  │   token_type: "Bearer",
                  │   expires_in: 3600
                  │ }
                  ▼
┌─────────────────────────────────────────────────────────┐
│  Client Application                                     │
│  Receives NDI access token                              │
└─────────────────────────────────────────────────────────┘
```

## Error Handling

### Configuration Errors

```typescript
// Missing configuration
{
  "statusCode": 500,
  "message": "Missing NDI configuration: BHUTAN_NDI_CLIENT_ID, BHUTAN_NDI_CLIENT_SECRET"
}
```

### Authentication Errors

```typescript
// Invalid credentials
{
  "statusCode": 401,
  "message": "Failed to authenticate with Bhutan NDI",
  "error": "Invalid client credentials",
  "details": { ... }
}
```

### Network Errors

```typescript
// Timeout or connection error
{
  "statusCode": 500,
  "message": "An unexpected error occurred during NDI authentication"
}
```

## Security Considerations

1. **Credentials Protection** ✅

   - Client secrets are never logged
   - Configuration logs show `***configured***` instead of actual values

2. **HTTPS Required** ✅

   - Production should use `https://` URLs only
   - Staging uses HTTPS by default

3. **Access Control** ✅

   - Endpoints require admin authentication
   - Permission guards enforce `create`/`read` on `Admin` resource

4. **Timeout Protection** ✅
   - 10-second timeout on all HTTP requests
   - Prevents hanging requests

## Testing

### Test Configuration

Create a `.env.test` file:

```env
BHUTAN_NDI_AUTH_URL=https://staging.bhutanndi.com/authentication
BHUTAN_NDI_CLIENT_ID=test-client-id
BHUTAN_NDI_CLIENT_SECRET=test-client-secret
BHUTAN_NDI_WEBHOOK_GRANT_TYPE=client_credentials
```

### Manual Testing with Swagger

1. Start the application
2. Navigate to `http://localhost:5001/documentation`
3. Authenticate as Admin
4. Test `/auth/ndi/authenticate` endpoint

### Testing with cURL

```bash
# First, login as admin
curl -X POST http://localhost:5001/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"cidNo":"10304001084","password":"your-password"}'

# Use the access token
curl -X POST http://localhost:5001/auth/ndi/authenticate \
  -H "Authorization: Bearer <ACCESS_TOKEN_FROM_LOGIN>"
```

## Troubleshooting

### Issue: "Missing NDI configuration"

**Solution**: Add all required environment variables to `.env`:

```env
BHUTAN_NDI_AUTH_URL=...
BHUTAN_NDI_CLIENT_ID=...
BHUTAN_NDI_CLIENT_SECRET=...
```

### Issue: "Cannot find module '@nestjs/axios'"

**Solution**: Install required packages:

```bash
yarn add @nestjs/axios axios rxjs
```

### Issue: "Timeout of 10000ms exceeded"

**Solution**:

- Check network connectivity
- Verify NDI service is running
- Increase timeout in service if needed

### Issue: 401 Unauthorized from NDI

**Solution**:

- Verify client ID and secret are correct
- Check grant type is `client_credentials`
- Contact NDI support for credential verification

## Dependencies

- `@nestjs/axios` - HTTP client module
- `axios` - Promise-based HTTP client
- `rxjs` - Reactive extensions for async operations
- `@nestjs/config` - Configuration management

## Future Enhancements

- [ ] Token caching (reduce redundant requests)
- [ ] Automatic token refresh before expiry
- [ ] Rate limiting protection
- [ ] Retry logic with exponential backoff
- [ ] Health check endpoint for NDI connectivity
- [ ] Metrics/monitoring integration

---

## Summary

The NDI Service provides a robust, production-ready integration with Bhutan's National Digital Identity system. It handles authentication, error management, and provides both default and custom credential support.

**Key Benefits**:

- ✅ Simple API - Just call `authenticate()` or `getAccessToken()`
- ✅ Automatic configuration loading
- ✅ Comprehensive error handling
- ✅ Security-focused (no credential leaks)
- ✅ Well-documented and tested
- ✅ Integrated with existing auth module
