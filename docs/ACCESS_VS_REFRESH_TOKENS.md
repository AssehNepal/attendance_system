# 🔑 Access Tokens vs Refresh Tokens - Complete Guide

## 📊 Quick Comparison

| Feature       | Access Token                  | Refresh Token            |
| ------------- | ----------------------------- | ------------------------ |
| **Purpose**   | Authenticate API requests     | Get new access tokens    |
| **Lifetime**  | Short (15min - 1hr)           | Long (7-30 days)         |
| **Stored**    | Memory/localStorage           | HttpOnly cookie (secure) |
| **Size**      | Larger (contains permissions) | Smaller (just user ID)   |
| **Security**  | Lower risk (short-lived)      | Higher risk (long-lived) |
| **Usage**     | Every API call                | Only for token refresh   |
| **Revocable** | No (expires naturally)        | Yes (can be blacklisted) |

---

## 🎯 **BEST PRACTICE: Use BOTH Together**

### Why Use Both?

✅ **Security** - Access tokens expire quickly (stolen token is useless after 15min)  
✅ **User Experience** - Users don't have to login every 15 minutes  
✅ **Revocability** - Can revoke refresh tokens (logout everywhere)  
✅ **Scalability** - Access tokens are stateless (no DB lookup)

---

## 🔐 How the Dual-Token System Works

### Flow Diagram:

```
┌─────────────────────────────────────────────────────────────┐
│  1. User Login                                              │
│     POST /auth/login                                        │
│     { "cidNo": "123", "password": "pass" }                  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  2. Server Response                                         │
│     {                                                       │
│       "accessToken": "eyJhbG..." (15min expiry),            │
│       "refreshToken": "xyz..." (7 days expiry)              │
│     }                                                       │
│     Set-Cookie: refreshToken=xyz...; HttpOnly; Secure       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  3. Client Makes API Requests (for 15 minutes)              │
│     GET /admin                                              │
│     Authorization: Bearer eyJhbG...                         │
│     → ✅ Success (token valid)                              │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  4. Access Token Expires (after 15min)                      │
│     GET /admin                                              │
│     Authorization: Bearer eyJhbG... (expired)               │
│     → ❌ 401 Unauthorized                                   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  5. Client Refreshes Token Automatically                    │
│     POST /auth/refresh                                      │
│     Cookie: refreshToken=xyz...                             │
│     OR                                                      │
│     { "refreshToken": "xyz..." }                            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  6. Server Validates Refresh Token                          │
│     - Check if token exists in database                     │
│     - Check if not revoked/blacklisted                      │
│     - Check if not expired                                  │
│     - Load user's current permissions                       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  7. New Access Token Issued                                 │
│     {                                                       │
│       "accessToken": "newToken..." (15min expiry)           │
│     }                                                       │
│     → Client retries failed request with new token          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  8. User Logout (Revoke Refresh Token)                      │
│     POST /auth/logout                                       │
│     - Mark refresh token as revoked in database             │
│     - Clear cookies                                         │
│     - User must login again                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Implementation Example

### Database Schema for Refresh Tokens:

```sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token VARCHAR(500) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES admin(id) ON DELETE CASCADE,
  expires_at TIMESTAMP NOT NULL,
  revoked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  ip_address VARCHAR(50),
  user_agent TEXT
);

CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
```

### JWT Payloads:

```typescript
// Access Token (fat - contains permissions)
{
  userId: "uuid",
  cidNo: "10304001084",
  roleType: "SUPER_ADMIN",
  type: "ACCESS_TOKEN",
  roles: ["Admin Manager"],
  permissions: [
    { actions: ["CREATE", "READ"], subjects: ["ADMIN"] }
  ],
  officeLocationId: "uuid",
  iat: 1234567890,
  exp: 1234568790  // 15 minutes later
}

// Refresh Token (thin - just user ID)
{
  userId: "uuid",
  type: "REFRESH_TOKEN",
  jti: "unique-token-id",  // Token ID for revocation
  iat: 1234567890,
  exp: 1235172690  // 7 days later
}
```

---

## 💻 Code Implementation

### 1. Generate Both Tokens on Login:

```typescript
// auth.service.ts

async loginAdmin(loginDto: AdminLoginDto) {
  // ... validate credentials ...

  // Generate access token (short-lived, contains permissions)
  const accessToken = await this.generateAccessToken({
    userId: admin.id,
    cidNo: admin.cidNo,
    roleType: admin.roleType,
    type: TokenType.ACCESS_TOKEN,
    roles,
    permissions,
    officeLocationId: admin.officeLocationId,
  });

  // Generate refresh token (long-lived, minimal data)
  const refreshToken = await this.generateRefreshToken(admin.id);

  // Store refresh token in database
  await this.storeRefreshToken(refreshToken, admin.id, {
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'],
  });

  return {
    message: 'Logged in successfully',
    accessToken,
    refreshToken,  // Return to client
    user: { ... },
    ability: [ ... ],
  };
}

private async generateAccessToken(payload: JwtPayload): Promise<string> {
  return this.jwtService.signAsync(payload, {
    expiresIn: '15m',  // Short-lived
  });
}

private async generateRefreshToken(userId: Uuid): Promise<string> {
  return this.jwtService.signAsync(
    {
      userId,
      type: TokenType.REFRESH_TOKEN,
      jti: uuidv4(),  // Unique token ID
    },
    {
      expiresIn: '7d',  // Long-lived
    }
  );
}
```

### 2. Refresh Token Endpoint:

```typescript
// auth.controller.ts
@Post('refresh')
@Public()  // No auth guard
async refreshToken(
  @Body('refreshToken') refreshToken: string,
  @Req() request: Request,
) {
  return this.authService.refreshAccessToken(refreshToken, request);
}

// auth.service.ts
async refreshAccessToken(
  refreshToken: string,
  request: Request,
): Promise<{ accessToken: string }> {
  try {
    // 1. Verify JWT signature
    const payload = await this.jwtService.verifyAsync(refreshToken);

    // 2. Check token type
    if (payload.type !== TokenType.REFRESH_TOKEN) {
      throw new UnauthorizedException('Invalid token type');
    }

    // 3. Check if token exists and not revoked in database
    const storedToken = await this.refreshTokenRepository.findOne({
      where: {
        token: refreshToken,
        revoked: false,
      },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Token revoked or not found');
    }

    // 4. Check if expired
    if (new Date() > storedToken.expiresAt) {
      throw new UnauthorizedException('Token expired');
    }

    // 5. Load fresh user data with current permissions
    const admin = await this.adminRepository.findOne({
      where: { id: payload.userId },
      relations: ['adminRoles', 'adminRoles.role', ...],
    });

    if (!admin) {
      throw new UnauthorizedException('User not found');
    }

    // 6. Get current permissions (important for RBAC)
    const { roles, permissions } = await this.getAdminRolesAndPermissions(
      admin.id,
    );

    // 7. Generate NEW access token with fresh permissions
    const accessToken = await this.generateAccessToken({
      userId: admin.id,
      cidNo: admin.cidNo,
      roleType: admin.roleType,
      type: TokenType.ACCESS_TOKEN,
      roles,
      permissions,  // Fresh permissions!
      officeLocationId: admin.officeLocationId,
    });

    return { accessToken };

  } catch (error) {
    throw new UnauthorizedException('Invalid refresh token');
  }
}
```

### 3. Logout (Revoke Refresh Token):

```typescript
// auth.controller.ts
@Post('logout')
@UseGuards(AuthGuard())
async logout(
  @Body('refreshToken') refreshToken: string,
  @CurrentUser() user: any,
) {
  return this.authService.logout(refreshToken, user.id);
}

// auth.service.ts
async logout(refreshToken: string, userId: Uuid): Promise<void> {
  // Mark refresh token as revoked
  await this.refreshTokenRepository.update(
    { token: refreshToken, userId },
    { revoked: true }
  );
}

// Optional: Logout from all devices
async logoutAllDevices(userId: Uuid): Promise<void> {
  await this.refreshTokenRepository.update(
    { userId },
    { revoked: true }
  );
}
```

### 4. Cleanup Expired Tokens (Cron Job):

```typescript
// auth.service.ts
@Cron('0 0 * * *')  // Run daily at midnight
async cleanupExpiredTokens() {
  await this.refreshTokenRepository.delete({
    expiresAt: LessThan(new Date()),
  });
}
```

---

## 🔒 Security Best Practices

### 1. **Access Token:**

```typescript
✅ Store in memory (React state) or sessionStorage
✅ Short expiry (15min - 1hr)
✅ Include in Authorization header
✅ No sensitive data (it's public)
❌ Don't store in localStorage (XSS risk)
```

### 2. **Refresh Token:**

```typescript
✅ Store in HttpOnly cookie (can't be accessed by JS)
✅ Secure flag (HTTPS only)
✅ SameSite=Strict (CSRF protection)
✅ Long expiry (7-30 days)
✅ Store in database (revocable)
❌ Don't expose in response body if using cookies
```

### 3. **Rotation Strategy:**

```typescript
// Rotate refresh token on each use (highest security)
async refreshAccessToken(refreshToken: string) {
  // ... validate old token ...

  // Revoke old refresh token
  await this.revokeRefreshToken(refreshToken);

  // Generate NEW refresh token
  const newRefreshToken = await this.generateRefreshToken(userId);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,  // Return new one
  };
}
```

---

## 🎯 Your Current Setup vs Recommended

### Current (Access Token Only):

```typescript
❌ Token lives for 24 hours
❌ If stolen, attacker has 24hr access
❌ Can't revoke until expiry
❌ Must re-login every 24 hours
```

### Recommended (Access + Refresh):

```typescript
✅ Access token lives 15 minutes
✅ If stolen, only 15min window
✅ Can revoke refresh token anytime
✅ User stays logged in for 7 days
✅ Permissions refreshed on token renewal
```

---

## 📝 Implementation Checklist

### Phase 1: Database

- [ ] Create `refresh_tokens` table
- [ ] Add indexes for performance
- [ ] Create RefreshToken entity

### Phase 2: Token Generation

- [ ] Update `generateAccessToken` to 15min expiry
- [ ] Create `generateRefreshToken` method
- [ ] Create `storeRefreshToken` method
- [ ] Return both tokens from login

### Phase 3: Refresh Endpoint

- [ ] Create `POST /auth/refresh` endpoint
- [ ] Validate refresh token
- [ ] Check database for revocation
- [ ] Load fresh user permissions
- [ ] Return new access token

### Phase 4: Revocation

- [ ] Create `POST /auth/logout` endpoint
- [ ] Mark refresh token as revoked
- [ ] Optional: Logout all devices

### Phase 5: Cleanup

- [ ] Add cron job for expired tokens
- [ ] Add token rotation (optional)

### Phase 6: Client-Side

- [ ] Detect 401 errors
- [ ] Auto-refresh token
- [ ] Retry failed request
- [ ] Handle refresh failure (redirect to login)

---

## 🚀 Quick Answer to Your Question

### **Which is best?**

**Answer: Use BOTH together!** 🎯

```
Access Token = Car Key 🔑
- Opens car doors (API access)
- Short-lived (lasts 15 minutes)
- Lose it? Only small window of risk

Refresh Token = Car Remote 📱
- Gets you a new key when yours expires
- Long-lived (lasts 7 days)
- Keep it safe (HttpOnly cookie)
- Can deactivate remotely (revoke)

Together = Perfect Security + UX ✅
```

### Current Industry Standard:

- **Google**: Access token (1hr) + Refresh token (6 months)
- **Facebook**: Access token (1-2hr) + Long-lived token (60 days)
- **GitHub**: Access token (1hr) + Refresh token (6 months)
- **Auth0/Okta**: Access token (15min-1hr) + Refresh token (30 days)

### Your Current Setup:

```typescript
// auth.service.ts - Line 351
private async generateAccessToken(payload: JwtPayload): Promise<string> {
  return this.jwtService.signAsync(payload, {
    expiresIn: '24h',  // ⚠️ Too long! Change to '15m'
  });
}
```

### Recommended Fix:

```typescript
// Change to 15 minutes
private async generateAccessToken(payload: JwtPayload): Promise<string> {
  return this.jwtService.signAsync(payload, {
    expiresIn: '15m',  // ✅ Much better!
  });
}

// Add refresh token method
private async generateRefreshToken(userId: Uuid): Promise<string> {
  return this.jwtService.signAsync(
    {
      userId,
      type: TokenType.REFRESH_TOKEN,
      jti: uuidv4(),
    },
    {
      expiresIn: '7d',  // 7 days
    }
  );
}
```

---

**Bottom Line:** Access tokens alone are okay for development, but **production apps should use refresh tokens** for better security and UX. 🔐
