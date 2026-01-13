# Government-Grade Authentication & Authorization Service

## Complete Implementation Guide

---

## 📚 TABLE OF CONTENTS

1. [System Overview](#system-overview)
2. [Database Schema & Relationships](#database-schema--relationships)
3. [Authentication Flows](#authentication-flows)
4. [Authorization Model](#authorization-model)
5. [JWT Token Structure](#jwt-token-structure)
6. [API Endpoints](#api-endpoints)
7. [Security Features](#security-features)
8. [Code Examples](#code-examples)
9. [Deployment Guide](#deployment-guide)
10. [Best Practices](#best-practices)

---

## 1. SYSTEM OVERVIEW

### Purpose

A standalone microservice providing government-grade authentication and role-based access control (RBAC) for the national census system.

### Key Features

- ✅ Dual authentication (Citizens & Admins)
- ✅ Password-based & NDI deep link authentication
- ✅ Multi-role support with granular permissions
- ✅ JWT-based stateless authentication
- ✅ Audit logging for compliance
- ✅ Account security (rate limiting, auto-lock)
- ✅ Refresh token support

### Technology Stack

- **Framework**: NestJS (TypeScript)
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT (RS256)
- **Password Hashing**: bcrypt (12 rounds)
- **API Documentation**: Swagger/OpenAPI

---

## 2. DATABASE SCHEMA & RELATIONSHIPS

### Entity Relationship Diagram

```
┌─────────────┐
│    USER     │
│             │
│ - id (PK)   │
│ - cid_no    │◄────────┐
│ - password  │         │
│ - role_type │         │
│ - ndi_link  │         │
└─────────────┘         │
                        │
                   ┌────┴─────┐
                   │USER_ROLE │
                   │          │
                   │ - id     │
                   │ - user_id│
                   │ - role_id│
                   └────┬─────┘
                        │
┌─────────────┐         │
│    ADMIN    │         │
│             │         │
│ - id (PK)   │         │
│ - cid_no    │◄────────┤
│ - password  │         │
│ - office_id │         │
│ - email     │         │
└─────┬───────┘         │
      │                 │
      │            ┌────┴──────┐
      │            │   ROLE    │
      │            │           │
      └───────────►│ - id (PK) │
                   │ - name    │
                   └────┬──────┘
                        │
                   ┌────┴──────────┐
                   │ROLE_PERMISSION│
                   │               │
                   │ - role_id     │
                   │ - permission  │
                   └────┬──────────┘
                        │
                   ┌────┴──────┐
                   │PERMISSION │
                   │           │
                   │ - id      │
                   │ - name    │
                   │ - actions │
                   │ - subjects│
                   └───────────┘
```

### Database Tables

#### USERS Table

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cid_no VARCHAR(20) UNIQUE NOT NULL,
    password VARCHAR(255),
    role_type VARCHAR(20) DEFAULT 'CITIZEN',
    ndi_deeplink TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### ADMIN Table

```sql
CREATE TABLE admin (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cid_no VARCHAR(20) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role_type VARCHAR(20) DEFAULT 'ADMIN',
    office_location_id UUID REFERENCES office_location(id),
    agency_id VARCHAR(100),
    mobile_no VARCHAR(20),
    email VARCHAR(255),
    failed_login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### ROLES Table

```sql
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### PERMISSIONS Table

```sql
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    actions TEXT[], -- ['CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE']
    subjects TEXT[], -- ['BIRTH', 'PERSON', 'HOUSEHOLD', 'CENSUS']
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### ROLE_PERMISSION Table

```sql
CREATE TABLE role_permission (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);
```

#### USER_ROLE Table

```sql
CREATE TABLE user_role (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, role_id)
);
```

#### ADMIN_ROLE Table

```sql
CREATE TABLE admin_role (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES admin(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(admin_id, role_id)
);
```

#### AUDIT_LOG Table

```sql
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    user_id UUID REFERENCES users(id),
    admin_id UUID REFERENCES admin(id),
    ip_address VARCHAR(45),
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_admin ON audit_log(admin_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_created ON audit_log(created_at);
```

#### OFFICE_LOCATION Table

```sql
CREATE TABLE office_location (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### REFRESH_TOKEN Table

```sql
CREATE TABLE refresh_token (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token TEXT NOT NULL,
    user_id UUID REFERENCES users(id),
    admin_id UUID REFERENCES admin(id),
    expires_at TIMESTAMP NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_refresh_token ON refresh_token(token);
```

### Relationship Explanation

1. **USER ↔ ROLE** (Many-to-Many via USER_ROLE)

   - A user can have multiple roles
   - A role can be assigned to multiple users

2. **ADMIN ↔ ROLE** (Many-to-Many via ADMIN_ROLE)

   - An admin can have multiple roles
   - A role can be assigned to multiple admins

3. **ROLE ↔ PERMISSION** (Many-to-Many via ROLE_PERMISSION)

   - A role can have multiple permissions
   - A permission can belong to multiple roles

4. **ADMIN → OFFICE_LOCATION** (Many-to-One)

   - Each admin belongs to one office location
   - One office location can have multiple admins

5. **USER/ADMIN → AUDIT_LOG** (One-to-Many)
   - Each user/admin can have multiple audit logs
   - Each audit log belongs to one user or admin

---

## 3. AUTHENTICATION FLOWS

### 3.1 Citizen Login Flow

```
┌────────┐           ┌──────────┐           ┌──────────┐
│ Client │           │  Server  │           │ Database │
└───┬────┘           └────┬─────┘           └────┬─────┘
    │                     │                      │
    │ POST /auth/login    │                      │
    │ {cid, password}     │                      │
    ├────────────────────►│                      │
    │                     │                      │
    │                     │ Find user by CID     │
    │                     ├─────────────────────►│
    │                     │                      │
    │                     │◄─────────────────────┤
    │                     │ User data            │
    │                     │                      │
    │                     │ Verify password      │
    │                     │ (bcrypt.compare)     │
    │                     │                      │
    │                     │ Get roles & perms    │
    │                     ├─────────────────────►│
    │                     │                      │
    │                     │◄─────────────────────┤
    │                     │ Roles & Permissions  │
    │                     │                      │
    │                     │ Generate JWT tokens  │
    │                     │ (Access + Refresh)   │
    │                     │                      │
    │                     │ Save refresh token   │
    │                     ├─────────────────────►│
    │                     │                      │
    │                     │ Log audit (LOGIN)    │
    │                     ├─────────────────────►│
    │                     │                      │
    │◄────────────────────┤                      │
    │ { accessToken,      │                      │
    │   refreshToken,     │                      │
    │   user }            │                      │
    │                     │                      │
```

### 3.2 Admin Login Flow (with Account Locking)

```
┌────────┐           ┌──────────┐           ┌──────────┐
│ Client │           │  Server  │           │ Database │
└───┬────┘           └────┬─────┘           └────┬─────┘
    │                     │                      │
    │ POST /auth/admin/login                     │
    │ {cid, password}     │                      │
    ├────────────────────►│                      │
    │                     │                      │
    │                     │ Find admin by CID    │
    │                     ├─────────────────────►│
    │                     │                      │
    │                     │◄─────────────────────┤
    │                     │ Admin data           │
    │                     │                      │
    │                     │ Check if locked      │
    │                     │ (lockedUntil > now)  │
    │                     │                      │
    │                     │ [IF LOCKED]          │
    │◄────────────────────┤                      │
    │ 403 Forbidden       │                      │
    │ "Account locked"    │                      │
    │                     │                      │
    │                     │ [IF NOT LOCKED]      │
    │                     │ Verify password      │
    │                     │                      │
    │                     │ [WRONG PASSWORD]     │
    │                     │ failedAttempts++     │
    │                     ├─────────────────────►│
    │                     │                      │
    │                     │ [IF attempts >= 5]   │
    │                     │ Lock account (30min) │
    │                     ├─────────────────────►│
    │                     │                      │
    │                     │ Log ACCOUNT_LOCKED   │
    │                     ├─────────────────────►│
    │                     │                      │
    │◄────────────────────┤                      │
    │ 403 Forbidden       │                      │
    │                     │                      │
    │                     │ [CORRECT PASSWORD]   │
    │                     │ Reset failedAttempts │
    │                     │ Set lastLoginAt      │
    │                     ├─────────────────────►│
    │                     │                      │
    │                     │ Get roles & perms    │
    │                     ├─────────────────────►│
    │                     │                      │
    │                     │ Generate tokens      │
    │                     │ Log audit (LOGIN)    │
    │                     ├─────────────────────►│
    │                     │                      │
    │◄────────────────────┤                      │
    │ { accessToken,      │                      │
    │   refreshToken,     │                      │
    │   user }            │                      │
    │                     │                      │
```

### 3.3 NDI Deep Link Flow

```
┌────────┐     ┌──────────┐     ┌──────────┐     ┌────────────┐
│ Client │     │   Auth   │     │ Database │     │ NDI Server │
└───┬────┘     └────┬─────┘     └────┬─────┘     └─────┬──────┘
    │               │                │                  │
    │ Click NDI Link│                │                  │
    ├──────────────►│                │                  │
    │               │                │                  │
    │               │ Redirect to NDI                   │
    │               ├──────────────────────────────────►│
    │               │                │                  │
    │◄──────────────┴────────────────┴──────────────────┤
    │ NDI Login Page                                    │
    │                                                   │
    │ User authenticates with NDI                       │
    ├──────────────────────────────────────────────────►│
    │                                                   │
    │◄──────────────────────────────────────────────────┤
    │ Redirect to /auth/ndi/callback?code=XXX&state=YYY │
    │                                                   │
    │ POST /auth/ndi/callback                          │
    ├──────────────►│                                  │
    │               │                                  │
    │               │ Exchange code for token          │
    │               ├─────────────────────────────────►│
    │               │                                  │
    │               │◄─────────────────────────────────┤
    │               │ Access token + User info         │
    │               │                                  │
    │               │ Find/Create user                 │
    │               ├──────────────►│                  │
    │               │                │                  │
    │               │ Generate JWT   │                  │
    │               │                │                  │
    │◄──────────────┤                │                  │
    │ { accessToken }                │                  │
    │                                │                  │
```

---

## 4. AUTHORIZATION MODEL

### Permission Structure

Each permission consists of:

- **Actions**: CREATE, READ, UPDATE, DELETE, APPROVE, REJECT, VERIFY, EXPORT
- **Subjects**: BIRTH, PERSON, HOUSEHOLD, ADMIN, USER, CENSUS, REPORT, ROLE, PERMISSION

### Permission Examples

```json
{
  "name": "birth-approval",
  "description": "Can approve birth registrations",
  "actions": ["APPROVE", "REJECT"],
  "subjects": ["BIRTH"]
}

{
  "name": "census-management",
  "description": "Full census data management",
  "actions": ["CREATE", "READ", "UPDATE", "DELETE"],
  "subjects": ["CENSUS", "HOUSEHOLD", "PERSON"]
}
```

### Role Hierarchy

```
┌─────────────────────────────────────────┐
│          SUPER_ADMIN                    │
│  All permissions on all subjects        │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
┌───────┴────────┐  ┌───────┴────────┐
│ REGISTRY_ADMIN │  │  CENSUS_ADMIN  │
│                │  │                │
│ - BIRTH: CRUD  │  │ - CENSUS: CRUD │
│ - BIRTH:APPROVE│  │ - HOUSEHOLD:*  │
└────────────────┘  └────────────────┘
        │
┌───────┴────────┐
│ REGISTRY_CLERK │
│                │
│ - BIRTH: CR    │
│ - BIRTH: READ  │
└────────────────┘
```

### Authorization Decision Logic

```typescript
function canAccess(user, action, subject) {
  // 1. Get all user roles
  const roles = getUserRoles(user.id);

  // 2. Get all permissions for those roles
  const permissions = [];
  for (const role of roles) {
    permissions.push(...getRolePermissions(role.id));
  }

  // 3. Check if any permission matches
  return permissions.some((permission) => permission.actions.includes(action) && permission.subjects.includes(subject));
}
```

### Using Permission Guards

```typescript
@Post('births/:id/approve')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@RequirePermission(PermissionAction.APPROVE, PermissionSubject.BIRTH)
async approveBirth(@Param('id') birthId: string) {
  // Only users with APPROVE permission on BIRTH subject can access
  return this.birthService.approve(birthId);
}
```

---

## 5. JWT TOKEN STRUCTURE

### Access Token Payload

```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "cidNo": "10101234567890",
  "roleType": "ADMIN",
  "roles": ["REGISTRY_ADMIN", "BIRTH_APPROVER"],
  "permissions": [
    {
      "action": "CREATE",
      "subject": "BIRTH"
    },
    {
      "action": "APPROVE",
      "subject": "BIRTH"
    },
    {
      "action": "READ",
      "subject": "REPORT"
    }
  ],
  "officeLocationId": "660e8400-e29b-41d4-a716-446655440000",
  "type": "access",
  "iat": 1705075200,
  "exp": 1705078800
}
```

### Token Configuration

```typescript
// JWT Configuration
{
  algorithm: 'RS256',          // RSA with SHA-256
  accessTokenExpiry: '1h',     // 1 hour
  refreshTokenExpiry: '7d',    // 7 days
  issuer: 'census-auth-service',
  audience: 'census-system'
}
```

### Token Generation

```typescript
const accessToken = jwt.sign(
  {
    userId: user.id,
    cidNo: user.cidNo,
    roleType: user.roleType,
    roles: ['ADMIN'],
    permissions: [...],
    type: 'access'
  },
  privateKey,
  {
    algorithm: 'RS256',
    expiresIn: '1h'
  }
);
```

### Token Verification

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ApiConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.authConfig.publicKey,
      algorithms: ['RS256'],
    });
  }

  async validate(payload: any) {
    return {
      userId: payload.userId,
      cidNo: payload.cidNo,
      roleType: payload.roleType,
      roles: payload.roles,
      permissions: payload.permissions,
      officeLocationId: payload.officeLocationId,
    };
  }
}
```

---

## 6. API ENDPOINTS

### Authentication Endpoints

#### POST /auth/login

**Citizen Login**

Request:

```json
{
  "email": "10101234567890", // CID number
  "password": "SecurePass123!"
}
```

Response:

```json
{
  "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600,
  "tokenType": "Bearer",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "cidNo": "10101234567890",
    "roleType": "CITIZEN",
    "roles": ["CITIZEN_USER"],
    "permissions": [
      { "action": "READ", "subject": "CENSUS" },
      { "action": "CREATE", "subject": "BIRTH" }
    ]
  }
}
```

#### POST /auth/admin/login

**Admin Login**

Request:

```json
{
  "cidNo": "10101234567890",
  "password": "AdminSecure123!"
}
```

Response: Same as citizen login

#### POST /auth/ndi/callback

**NDI OAuth Callback**

Request:

```json
{
  "code": "AUTHORIZATION_CODE_FROM_NDI",
  "state": "RANDOM_STATE_STRING"
}
```

Response: Same as login

#### POST /auth/logout

**Logout**

Headers:

```
Authorization: Bearer {accessToken}
```

Response: 204 No Content

---

### User Management Endpoints

#### POST /auth/users

**Create Citizen User**

Request:

```json
{
  "cidNo": "10101234567890",
  "password": "SecurePass123!",
  "ndiDeeplink": "ndi://auth?user=..."
}
```

Response:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "cidNo": "10101234567890",
  "roleType": "CITIZEN",
  "createdAt": "2026-01-12T10:00:00Z"
}
```

#### POST /auth/admins

**Create Admin User**

Request:

```json
{
  "cidNo": "10101234567890",
  "password": "AdminSecure123!",
  "officeLocationId": "660e8400-e29b-41d4-a716-446655440000",
  "agencyId": "AGENCY001",
  "mobileNo": "+97517123456",
  "email": "admin@census.gov.bt"
}
```

---

### Role & Permission Management

#### POST /auth/roles

**Create Role**

Request:

```json
{
  "name": "BIRTH_APPROVER",
  "description": "Can approve birth registrations"
}
```

#### POST /auth/permissions

**Create Permission**

Request:

```json
{
  "name": "birth-approval",
  "description": "Approve/reject birth registrations",
  "actions": ["APPROVE", "REJECT"],
  "subjects": ["BIRTH"]
}
```

#### POST /auth/roles/:id/permissions

**Assign Permissions to Role**

Request:

```json
{
  "permissionIds": ["770e8400-e29b-41d4-a716-446655440000", "880e8400-e29b-41d4-a716-446655440000"]
}
```

#### POST /auth/users/:id/roles

**Assign Roles to User**

Request:

```json
{
  "roleIds": ["990e8400-e29b-41d4-a716-446655440000"]
}
```

#### POST /auth/admins/:id/roles

**Assign Roles to Admin**

Request: Same as user roles

---

### Authorization Endpoints

#### GET /auth/me

**Get Current User Info**

Headers:

```
Authorization: Bearer {accessToken}
```

Response:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "cidNo": "10101234567890",
  "roleType": "ADMIN",
  "email": "admin@census.gov.bt",
  "officeLocation": "Thimphu Dzongkhag",
  "roles": ["REGISTRY_ADMIN", "BIRTH_APPROVER"],
  "permissions": [
    { "action": "CREATE", "subject": "BIRTH" },
    { "action": "APPROVE", "subject": "BIRTH" }
  ]
}
```

#### POST /auth/validate

**Validate Permission**

Request:

```json
{
  "action": "APPROVE",
  "subject": "BIRTH"
}
```

Response:

```json
{
  "hasPermission": true
}
```

---

## 7. SECURITY FEATURES

### Password Security

```typescript
// Hashing (on create/update)
const hashedPassword = await bcrypt.hash(password, 12);

// Verification (on login)
const isValid = await bcrypt.compare(plainPassword, hashedPassword);
```

**Requirements:**

- Minimum 8 characters
- Never logged or stored in plain text
- bcrypt with 12 rounds
- Password change logged in audit

### Rate Limiting

```typescript
// Login attempts tracking
- Max 5 failed attempts
- 30-minute lockout period
- Automatic unlock after timeout
- Audit log on lock/unlock
```

### Account Locking

```typescript
if (admin.failedLoginAttempts >= 5) {
  admin.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
  await logAudit({ action: 'ACCOUNT_LOCKED', ... });
}
```

### Audit Logging

All security-relevant events are logged:

```typescript
const auditEvents = ['LOGIN', 'LOGIN_FAILED', 'LOGOUT', 'ACCOUNT_LOCKED', 'PASSWORD_CHANGED', 'ROLE_ASSIGNED', 'ROLE_REMOVED', 'PERMISSION_CHANGED', 'USER_CREATED', 'USER_UPDATED', 'USER_DELETED'];
```

### Token Security

- RS256 algorithm (asymmetric)
- Short-lived access tokens (1 hour)
- Refresh tokens (7 days, revocable)
- No sensitive data in tokens
- Token revocation support

---

## 8. CODE EXAMPLES

### Example 1: Protected Route with Permission

```typescript
@Controller('births')
export class BirthController {
  @Post(':id/approve')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermission(PermissionAction.APPROVE, PermissionSubject.BIRTH)
  async approveBirth(@Param('id') birthId: string, @Req() req: any) {
    const adminId = req.user.userId;
    return this.birthService.approve(birthId, adminId);
  }
}
```

### Example 2: Manual Permission Check

```typescript
async processBirthApplication(userId: string, birthData: any) {
  const hasPermission = await this.authService.validatePermission(
    userId,
    PermissionAction.CREATE,
    PermissionSubject.BIRTH,
  );

  if (!hasPermission) {
    throw new ForbiddenException('No permission to create birth records');
  }

  // Process birth application
}
```

### Example 3: Seeding Initial Data

```typescript
async seed() {
  // Create office locations
  const thimphu = await this.officeLocationRepo.save({
    name: 'Thimphu Dzongkhag',
    code: 'THU',
  });

  // Create permissions
  const birthCreate = await this.permissionRepo.save({
    name: 'birth-create',
    actions: ['CREATE'],
    subjects: ['BIRTH'],
  });

  const birthApprove = await this.permissionRepo.save({
    name: 'birth-approve',
    actions: ['APPROVE', 'REJECT'],
    subjects: ['BIRTH'],
  });

  // Create roles
  const registryAdmin = await this.roleRepo.save({
    name: 'REGISTRY_ADMIN',
    description: 'Birth registry administrator',
  });

  // Assign permissions to role
  await this.rolePermissionRepo.save([
    { roleId: registryAdmin.id, permissionId: birthCreate.id },
    { roleId: registryAdmin.id, permissionId: birthApprove.id },
  ]);

  // Create admin user
  const admin = await this.adminRepo.save({
    cidNo: '10101234567890',
    password: await bcrypt.hash('Admin@123', 12),
    email: 'admin@census.gov.bt',
    mobileNo: '+97517123456',
    officeLocationId: thimphu.id,
  });

  // Assign role to admin
  await this.adminRoleRepo.save({
    adminId: admin.id,
    roleId: registryAdmin.id,
  });
}
```

---

## 9. DEPLOYMENT GUIDE

### Environment Variables

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=census
DB_PASSWORD=secure_password
DB_DATABASE=census_auth

# JWT
JWT_PRIVATE_KEY=<RS256 private key>
JWT_PUBLIC_KEY=<RS256 public key>
JWT_EXPIRATION_TIME=3600

# Application
PORT=3000
NODE_ENV=production

# NDI Integration
NDI_CLIENT_ID=your_client_id
NDI_CLIENT_SECRET=your_client_secret
NDI_REDIRECT_URI=https://census.gov.bt/auth/ndi/callback
```

### Generate RSA Keys

```bash
# Generate private key
openssl genrsa -out private.pem 2048

# Extract public key
openssl rsa -in private.pem -outform PEM -pubout -out public.pem
```

### Database Migration

```bash
# Generate migration
npm run migration:generate -- -n InitialSetup

# Run migrations
npm run migration:run
```

### Docker Deployment

```dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
```

---

## 10. BEST PRACTICES

### For Government Systems

1. **Compliance**

   - Enable audit logging for all critical operations
   - Retain logs for minimum 7 years
   - Regular security audits

2. **Data Protection**

   - Never log passwords or tokens
   - Encrypt sensitive data at rest
   - Use TLS for all communications

3. **Access Control**

   - Principle of least privilege
   - Regular permission audits
   - Mandatory role reviews

4. **Monitoring**

   - Alert on failed login patterns
   - Monitor token usage
   - Track permission changes

5. **Disaster Recovery**
   - Regular database backups
   - Key rotation procedures
   - Incident response plan

### Code Quality

1. Use TypeScript strictly
2. Write unit tests (>80% coverage)
3. Integration tests for auth flows
4. API documentation (Swagger)
5. Code reviews mandatory

---

## CONCLUSION

This authentication service provides enterprise-grade security suitable for government census systems with:

✅ **Dual authentication** (Citizens + Admins)  
✅ **Granular RBAC** with permissions  
✅ **Complete audit trail**  
✅ **Account security** (locking, rate limiting)  
✅ **JWT-based** stateless auth  
✅ **Production-ready** with best practices

For questions or support, contact the development team.

---

**Document Version**: 1.0  
**Last Updated**: January 12, 2026  
**Author**: Census Backend Team
