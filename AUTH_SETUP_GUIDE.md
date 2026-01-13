# Census Auth Service - Setup Guide

## Overview

This authentication service provides:

- **Auto-registration for Citizens**: Users are automatically created on first login
- **Pre-registration for Admins**: Admins must be created beforehand
- **Role-Based Access Control (RBAC)**: Default "User" role with citizen permissions
- **Permission-Based Authorization**: Granular permissions for different actions

## Initial Setup

### 1. Run Database Migration

```bash
yarn migration:run
```

This creates all necessary tables:

- users
- admin
- roles
- permissions
- role_permission
- user_role
- admin_role
- audit_log
- refresh_token
- office_location
- user_settings
- posts
- comments

### 2. Seed Initial Data

```bash
yarn seed
```

This will create:

- **Roles**: User, Super Admin, Admin, Dzongkhag Admin, Gewog Admin
- **Permissions**:
  - birth_registration
  - death_registration
  - update_information
  - movein_moveout
  - relationship_application
  - adoption_application
  - cid_print_application
  - admin_full_access
- **Super Admin Account**:
  - CID: `11111111111111`
  - Password: `SuperAdmin@123`

### 3. Start the Application

```bash
yarn start:dev
```

Access Swagger UI: http://localhost:5001/documentation

## Authentication Flow

### Citizen Login (Auto-Registration)

**Endpoint**: `POST /auth/login`

**First-Time Login** (Auto-creates user):

```json
{
  "cidNo": "10101010101010",
  "password": "citizen123"
}
```

**What happens**:

1. System checks if user exists with this CID
2. If not found, automatically creates user
3. Assigns default "User" role
4. User gets all citizen permissions:
   - birth_registration
   - death_registration
   - update_information
   - movein_moveout
   - relationship_application
   - adoption_application
   - cid_print_application
5. Returns JWT access token

**Response**:

```json
{
  "accessToken": "eyJhbGciOiJSUzI1Ni...",
  "refreshToken": "eyJhbGciOiJSUzI1Ni...",
  "expiresIn": 3600,
  "tokenType": "Bearer",
  "user": {
    "id": "uuid",
    "cidNo": "10101010101010",
    "roleType": "CITIZEN",
    "roles": ["User"],
    "permissions": [
      { "action": "CREATE", "subject": "BIRTH" },
      { "action": "READ", "subject": "BIRTH" },
      ...
    ]
  }
}
```

**Subsequent Logins**:
Same endpoint, but password is verified against stored hash.

### Admin Login (Pre-registered Only)

**Endpoint**: `POST /auth/admin/login`

**Request**:

```json
{
  "cidNo": "11111111111111",
  "password": "SuperAdmin@123"
}
```

**What happens**:

1. System checks if admin exists
2. If not found, returns "Invalid credentials" (no auto-creation)
3. If found, verifies password
4. Checks account lock status (5 failed attempts = 30min lock)
5. Returns JWT with admin permissions

**Response**:

```json
{
  "accessToken": "eyJhbGciOiJSUzI1Ni...",
  "refreshToken": "eyJhbGciOiJSUzI1Ni...",
  "expiresIn": 3600,
  "tokenType": "Bearer",
  "user": {
    "id": "uuid",
    "cidNo": "11111111111111",
    "roleType": "SUPER_ADMIN",
    "roles": ["Super Admin"],
    "permissions": [
      { "action": "CREATE", "subject": "ADMIN" },
      { "action": "APPROVE", "subject": "BIRTH" },
      ...
    ]
  }
}
```

## Creating Admins

Admins cannot auto-register. They must be created through the API or database.

### Using API (Requires Super Admin Token)

**Endpoint**: `POST /auth/admins`

**Headers**:

```
Authorization: Bearer <super_admin_token>
```

**Request**:

```json
{
  "cidNo": "20202020202020",
  "password": "Admin@123",
  "email": "admin@dzongkhag.gov.bt",
  "mobileNo": "+97517123456",
  "officeLocationId": "office-uuid",
  "agencyId": "DZONGKHAG_001"
}
```

### Assigning Roles to Admin

**Endpoint**: `POST /auth/admins/{adminId}/roles`

**Request**:

```json
{
  "roleIds": ["role-uuid-1", "role-uuid-2"]
}
```

## Default Permissions

### User Role (Citizens)

| Permission               | Actions              | Subjects          | Description                     |
| ------------------------ | -------------------- | ----------------- | ------------------------------- |
| birth_registration       | CREATE, READ, UPDATE | BIRTH             | Register and view birth records |
| death_registration       | CREATE, READ         | BIRTH             | Register death records          |
| update_information       | UPDATE, READ         | PERSON            | Update personal information     |
| movein_moveout           | CREATE, READ, UPDATE | HOUSEHOLD         | Register household movements    |
| relationship_application | CREATE, READ         | PERSON, HOUSEHOLD | Apply for relationship changes  |
| adoption_application     | CREATE, READ         | PERSON, HOUSEHOLD | Apply for adoption              |
| cid_print_application    | CREATE, READ         | PERSON            | Request CID printing            |

### Super Admin Role

| Permission        | Actions                               | Subjects | Description        |
| ----------------- | ------------------------------------- | -------- | ------------------ |
| admin_full_access | CREATE, READ, UPDATE, DELETE, APPROVE | ALL      | Full system access |

## Security Features

### Account Lockout

- **Failed Attempts**: 5 consecutive failures
- **Lockout Duration**: 30 minutes
- **Applies to**: Admins only (citizens auto-create, so no lockout)

### Password Requirements

- Minimum 8 characters (recommended)
- Hashed using bcrypt (12 rounds)

### Token Security

- **Algorithm**: RS256 (asymmetric encryption)
- **Access Token Expiry**: 1 hour
- **Refresh Token Expiry**: 7 days
- Tokens stored in database for revocation capability

### Audit Logging

All authentication events are logged:

- LOGIN
- LOGIN_FAILED
- USER_AUTO_CREATED
- USER_CREATED
- ADMIN_CREATED
- PASSWORD_CHANGED
- ROLE_ASSIGNED
- PERMISSION_GRANTED

## Testing the System

### 1. Test Citizen Auto-Registration

```bash
curl -X POST http://localhost:5001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "cidNo": "10101010101010",
    "password": "test123"
  }'
```

First time: User is created automatically
Second time: Password is verified

### 2. Test Admin Login

```bash
curl -X POST http://localhost:5001/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "cidNo": "11111111111111",
    "password": "SuperAdmin@123"
  }'
```

### 3. Get Current User Info

```bash
curl -X GET http://localhost:5001/auth/me \
  -H "Authorization: Bearer <your_access_token>"
```

## Database Schema

### Key Tables

**users**

- id (UUID)
- cid_no (unique)
- password (bcrypt hash)
- role_type (CITIZEN)
- created_at, updated_at

**admin**

- id (UUID)
- cid_no (unique)
- password (bcrypt hash)
- role_type (ADMIN, SUPER_ADMIN, etc.)
- failed_login_attempts
- locked_until
- office_location_id
- email, mobile_no
- created_at, updated_at

**roles**

- id (UUID)
- name (unique)
- description
- is_active

**permissions**

- id (UUID)
- name (unique)
- actions (jsonb array)
- subjects (jsonb array)
- is_active

## Troubleshooting

### "Invalid credentials" for citizen

**Cause**: Using admin login endpoint
**Solution**: Use `/auth/login` (not `/auth/admin/login`)

### Admin can't login

**Cause**: Admin not created yet
**Solution**: Run seed command or create admin via API

### "Account locked"

**Cause**: Too many failed login attempts
**Solution**: Wait 30 minutes or reset in database:

```sql
UPDATE admin SET failed_login_attempts = 0, locked_until = NULL WHERE cid_no = '<cid>';
```

### No permissions for user

**Cause**: Seed not run
**Solution**: Run `yarn seed`

## Environment Variables

Required in `.env`:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=census_auth

# JWT Keys (generate with openssl)
JWT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
```

Generate RSA keys:

```bash
# Private key
openssl genrsa -out private.pem 2048

# Public key
openssl rsa -in private.pem -pubout -out public.pem
```

## Next Steps

1. ✅ Run migrations: `yarn migration:run`
2. ✅ Seed initial data: `yarn seed`
3. ✅ Start application: `yarn start:dev`
4. 🔧 Integrate with NDI OAuth (optional)
5. 🔧 Add email notifications
6. 🔧 Implement 2FA (optional)
7. 🔧 Create additional admin management endpoints

## API Endpoints Summary

| Endpoint               | Method | Auth Required | Description                       |
| ---------------------- | ------ | ------------- | --------------------------------- |
| /auth/login            | POST   | No            | Citizen login (auto-creates user) |
| /auth/admin/login      | POST   | No            | Admin login (pre-registered only) |
| /auth/me               | GET    | Yes           | Get current user info             |
| /auth/refresh          | POST   | Yes           | Refresh access token              |
| /auth/users            | POST   | Super Admin   | Create user manually              |
| /auth/admins           | POST   | Super Admin   | Create admin                      |
| /auth/roles            | POST   | Super Admin   | Create role                       |
| /auth/permissions      | POST   | Super Admin   | Create permission                 |
| /auth/users/:id/roles  | POST   | Super Admin   | Assign roles to user              |
| /auth/admins/:id/roles | POST   | Super Admin   | Assign roles to admin             |

---

**Support**: For issues, check logs in `audit_log` table or contact system administrator.
