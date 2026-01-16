# Refresh Token Implementation

## Overview

Implemented a secure refresh token system with automatic token rotation following industry best practices (Auth0/Okta pattern).

## Token Strategy

### Access Token

- **Expiry:** 15 minutes
- **Purpose:** Short-lived token for API authentication
- **Storage:** Client stores in memory (not localStorage)
- **Contains:** User ID, CID, role type, permissions, office location

### Refresh Token

- **Expiry:** 3 months (90 days)
- **Purpose:** Long-lived token to obtain new access tokens
- **Storage:** Securely stored in database with metadata
- **Rotation:** New refresh token issued on each use, old one revoked
- **Contains:** User ID, user type (CITIZEN/ADMIN), unique token ID (jti)

## Database Schema

### refresh_tokens table

```sql
CREATE TABLE refresh_tokens (
  id uuid PRIMARY KEY,
  token varchar(500) UNIQUE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  admin_id uuid REFERENCES admin(id) ON DELETE CASCADE,
  expires_at TIMESTAMP NOT NULL,
  is_revoked boolean DEFAULT false,
  ip_address varchar(50),
  user_agent text,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_refresh_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_admin_id ON refresh_tokens(admin_id);
CREATE INDEX idx_refresh_expires_at ON refresh_tokens(expires_at);
```

## API Endpoints

### 1. Citizen Login

**POST** `/auth/citizen/login`

**Request:**

```json
{
  "cidNo": "11234567890",
  "password": "SecurePass123",
  "ndiDeeplink": "optional_deeplink"
}
```

**Response:**

```json
{
  "message": "Logged in successfully as Citizen",
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "cidNo": "11234567890",
    "roleType": "CITIZEN"
  }
}
```

### 2. Admin Login

**POST** `/auth/admin/login`

**Request:**

```json
{
  "cidNo": "11234567890",
  "password": "AdminPass123",
  "ndiDeeplink": "optional_deeplink"
}
```

**Response:**

```json
{
  "message": "Logged in successfully as Admin",
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "cidNo": "11234567890",
    "roleType": "ADMIN",
    "roles": ["ADMIN_MANAGER", "USER_VIEWER"]
  },
  "ability": [
    {
      "name": "Create Admin",
      "action": "CREATE",
      "subject": "ADMIN"
    }
  ]
}
```

### 3. Refresh Access Token

**POST** `/auth/refresh`

**Request:**

```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response:**

```json
{
  "accessToken": "eyJhbGc... (new 15min token)",
  "refreshToken": "eyJhbGc... (new 90day token)"
}
```

**Notes:**

- Old refresh token is automatically revoked
- New refresh token is issued (rotation)
- Fresh permissions are loaded from database
- IP address and user agent are captured

### 4. Logout

**POST** `/auth/logout`

**Request:**

```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response:**

```json
{
  "message": "Logged out successfully"
}
```

**Notes:**

- Revokes the specified refresh token
- User must re-login to get new tokens

## Security Features

### 1. Token Rotation

Every time a refresh token is used:

1. Validate the refresh token (signature, expiry, not revoked)
2. Load fresh user permissions from database
3. Generate new access token (15 minutes)
4. Generate new refresh token (3 months)
5. **Revoke old refresh token** (set `isRevoked = true`)
6. Store new refresh token with metadata
7. Return both new tokens

**Benefits:**

- Prevents long-term token theft
- Stolen tokens become invalid after one use
- Allows logout from all devices
- Maintains security even if refresh token is compromised

### 2. Metadata Tracking

Each refresh token stores:

- **IP Address:** Track where token was issued
- **User Agent:** Track device/browser
- **Expiry:** Automatic cleanup of old tokens
- **Revocation Flag:** Instant invalidation

### 3. Permission Refresh

When refreshing access token:

- Fresh permissions loaded from database
- Role changes take effect immediately
- Permission updates applied without re-login

## Client-Side Implementation

### Recommended Flow

```javascript
// 1. Login
const { accessToken, refreshToken } = await login(credentials);

// Store refresh token securely (httpOnly cookie recommended)
// Store access token in memory (NOT localStorage)
let currentAccessToken = accessToken;

// 2. API Calls
async function apiCall(endpoint, options) {
  try {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        Authorization: `Bearer ${currentAccessToken}`,
        ...options.headers,
      },
    });

    if (response.status === 401) {
      // Token expired, refresh it
      const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await refreshAccessToken(refreshToken);

      currentAccessToken = newAccessToken;
      // Update refresh token storage

      // Retry original request
      return fetch(endpoint, {
        ...options,
        headers: {
          Authorization: `Bearer ${newAccessToken}`,
          ...options.headers,
        },
      });
    }

    return response;
  } catch (error) {
    // Handle refresh token expiry -> redirect to login
    throw error;
  }
}

// 3. Refresh Token Function
async function refreshAccessToken(refreshToken) {
  const response = await fetch('/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    // Refresh token expired or revoked -> redirect to login
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  return response.json();
}

// 4. Logout
async function logout() {
  await fetch('/auth/logout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  // Clear tokens
  currentAccessToken = null;
  // Clear refresh token storage

  window.location.href = '/login';
}
```

### Storage Recommendations

| Token Type                  | Recommended Storage          | Reason                                |
| --------------------------- | ---------------------------- | ------------------------------------- |
| Access Token                | Memory (JavaScript variable) | Short-lived, doesn't need persistence |
| Refresh Token               | httpOnly Cookie              | Most secure, immune to XSS            |
| Refresh Token (Alternative) | Secure localStorage          | If httpOnly cookie not possible       |

**⚠️ NEVER store access token in localStorage** - it's vulnerable to XSS attacks.

## Service Methods

### `loginCitizen(dto, ipAddress, userAgent)`

- Validates credentials
- Generates 15min access token
- Generates 90day refresh token
- Stores refresh token in database
- Returns both tokens

### `loginAdmin(dto, ipAddress, userAgent)`

- Validates credentials
- Loads roles and permissions
- Generates 15min access token (with permissions)
- Generates 90day refresh token
- Stores refresh token in database
- Returns both tokens + ability array

### `refreshAccessToken(refreshToken, ipAddress, userAgent)`

- Validates refresh token signature
- Checks token not revoked
- Checks token not expired
- Loads fresh user data and permissions
- Generates new access token (15min)
- Generates new refresh token (90 days)
- **Revokes old refresh token** (rotation)
- Stores new refresh token
- Returns both new tokens

### `logout(refreshToken)`

- Finds refresh token in database
- Sets `isRevoked = true`
- User must re-login

### `logoutAllDevices(userId, userType)`

- Revokes all refresh tokens for user
- Forces re-login on all devices

## Migration Details

Migration file: `src/database/migrations/1705075200000-InitialAuthSchema.ts`

**Added:**

- `refresh_tokens` table with all columns
- Foreign keys to `users` and `admin` tables
- CASCADE delete (when user/admin deleted, refresh tokens deleted)
- Indexes for performance (token, user_id, admin_id, expires_at)

**Rollback:**
Down migration drops refresh_tokens table and all constraints.

## Testing

### Test Login Flow

```bash
# 1. Login as admin
curl -X POST http://localhost:3000/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "cidNo": "11234567890",
    "password": "password123"
  }'

# Response: { accessToken, refreshToken, user, ability }

# 2. Use access token for API calls
curl -X GET http://localhost:3000/api/admin \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# 3. After 15 minutes, access token expires
# Refresh it:
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'

# Response: { accessToken (new), refreshToken (new) }

# 4. Logout
curl -X POST http://localhost:3000/auth/logout \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

## Future Enhancements

### 1. Cleanup Job (Recommended)

Add a cron job to delete expired tokens:

```typescript
@Cron('0 0 * * *') // Daily at midnight
async cleanupExpiredTokens() {
  await this.refreshTokenRepository.delete({
    expiresAt: LessThan(new Date()),
  });
}
```

### 2. Rate Limiting

Add rate limiting to `/auth/refresh` endpoint to prevent brute force:

- Max 10 refresh requests per minute per IP
- Exponential backoff on failures

### 3. Token Fingerprinting

Store device fingerprint with refresh token:

- Browser version
- OS version
- Screen resolution
- Prevents token use from different device

### 4. Suspicious Activity Detection

- Alert user if refresh from new IP/location
- Require 2FA for refresh from new device
- Email notification on new device login

### 5. Grace Period

- Allow old refresh token to work for 5 seconds after rotation
- Handles race conditions in distributed systems
- Prevents "refresh loop" issues

## Summary

✅ **Implemented:**

- 15 minute access tokens
- 3 month refresh tokens
- Automatic token rotation
- Refresh token storage with metadata
- Login endpoints return both tokens
- Refresh endpoint with rotation
- Logout endpoint

✅ **Security:**

- Old refresh tokens revoked on use
- IP address and user agent tracking
- Database-backed revocation
- Fresh permissions on refresh

✅ **Build Status:** All files compile successfully, 0 errors

✅ **Migration:** `refresh_tokens` table created with all indexes and constraints
