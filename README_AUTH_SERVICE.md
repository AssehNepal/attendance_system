# 🏛️ Government-Grade Authentication & Authorization Service

### Census National System - Auth Microservice

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)

---

## 📋 Overview

A **production-ready, government-grade authentication and authorization microservice** designed for national census and civil registration systems. Built with enterprise security standards, comprehensive RBAC, and full audit trails.

### ✨ Key Features

- ✅ **Dual Authentication**: Citizens (CID + Password / NDI) and Admin users
- ✅ **Role-Based Access Control (RBAC)**: Multi-role support with granular permissions
- ✅ **Permission-Based Authorization**: Actions (CREATE, READ, UPDATE, DELETE, APPROVE) on Subjects (BIRTH, CENSUS, HOUSEHOLD, etc.)
- ✅ **JWT Authentication**: RS256 algorithm with access and refresh tokens
- ✅ **Security Features**: Account lockout, rate limiting, password hashing (bcrypt)
- ✅ **Audit Logging**: Complete trail of all security-relevant events
- ✅ **NDI Integration**: OAuth-like deep link authentication (ready for implementation)
- ✅ **Swagger Documentation**: Auto-generated API documentation

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    API Gateway / Client                  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Auth Service (NestJS)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Controllers  │  │   Services   │  │  Repositories│  │
│  │              │  │              │  │              │  │
│  │ - Auth       │──│ - Enhanced   │──│ - TypeORM    │  │
│  │ - User       │  │   Auth       │  │ - User       │  │
│  │ - Admin      │  │ - Audit      │  │ - Admin      │  │
│  │ - Role       │  │ - Token      │  │ - Role       │  │
│  └──────────────┘  └──────────────┘  └──────┬───────┘  │
│                                              │          │
│  ┌──────────────┐  ┌──────────────┐         │          │
│  │   Guards     │  │  Decorators  │         │          │
│  │              │  │              │         │          │
│  │ - Auth Guard │  │ - Permission │         │          │
│  │ - Permission │  │ - Roles      │         │          │
│  │ - Roles      │  │ - Public     │         │          │
│  └──────────────┘  └──────────────┘         │          │
└─────────────────────────────────────────────┼──────────┘
                                              │
                                              ▼
                                    ┌─────────────────┐
                                    │   PostgreSQL    │
                                    │                 │
                                    │ - users         │
                                    │ - admin         │
                                    │ - roles         │
                                    │ - permissions   │
                                    │ - audit_log     │
                                    └─────────────────┘
```

---

## 🗄️ Database Schema

### Core Tables

```sql
-- Users (Citizens)
users (id, cid_no, password, role_type, ndi_deeplink)

-- Admins (Government Officials)
admin (id, cid_no, password, office_location_id, email, mobile_no)

-- Roles
roles (id, name, description, is_active)

-- Permissions
permissions (id, name, actions[], subjects[], is_active)

-- Relationships
user_role (user_id, role_id)
admin_role (admin_id, role_id)
role_permission (role_id, permission_id)

-- Security
audit_log (action, entity_type, user_id, admin_id, ip_address, metadata)
refresh_token (token, user_id, admin_id, expires_at, is_revoked)
office_location (id, name, code)
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js >= 22.0.0
- PostgreSQL >= 13
- npm or yarn

### Installation

```bash
# Clone repository
git clone <repository-url>
cd auth_service

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Generate RSA keys for JWT
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -outform PEM -pubout -out public.pem

# Run migrations
npm run migration:run

# Seed database (optional)
npm run seed

# Start development server
npm run start:dev
```

### Default Test Credentials (After Seeding)

```
Super Admin:
  CID: 11111111111111
  Password: SuperAdmin@123

Registry Admin:
  CID: 22222222222222
  Password: RegAdmin@123

Citizen:
  CID: 33333333333333
  Password: Citizen@123
```

---

## 📡 API Endpoints

### Authentication

| Method | Endpoint             | Description         | Auth Required |
| ------ | -------------------- | ------------------- | ------------- |
| POST   | `/auth/login`        | Citizen login       | No            |
| POST   | `/auth/admin/login`  | Admin login         | No            |
| POST   | `/auth/ndi/callback` | NDI OAuth callback  | No            |
| POST   | `/auth/logout`       | Logout              | Yes           |
| GET    | `/auth/me`           | Get current user    | Yes           |
| POST   | `/auth/validate`     | Validate permission | Yes           |

### User Management

| Method | Endpoint       | Description    | Permission   |
| ------ | -------------- | -------------- | ------------ |
| POST   | `/auth/users`  | Create citizen | CREATE:USER  |
| POST   | `/auth/admins` | Create admin   | CREATE:ADMIN |

### Role & Permission Management

| Method | Endpoint                      | Description                | Permission        |
| ------ | ----------------------------- | -------------------------- | ----------------- |
| POST   | `/auth/roles`                 | Create role                | CREATE:ROLE       |
| POST   | `/auth/permissions`           | Create permission          | CREATE:PERMISSION |
| POST   | `/auth/roles/:id/permissions` | Assign permissions to role | UPDATE:ROLE       |
| POST   | `/auth/users/:id/roles`       | Assign roles to user       | UPDATE:USER       |
| POST   | `/auth/admins/:id/roles`      | Assign roles to admin      | UPDATE:ADMIN      |

---

## 🔐 Security Features

### Password Security

- **bcrypt** hashing with 12 rounds
- Minimum 8 characters
- Never logged or exposed
- Password change audit

### Account Protection

- Maximum 5 failed login attempts
- 30-minute automatic lockout
- Lockout audit logging
- Automatic unlock after timeout

### Token Security

- **RS256** asymmetric encryption
- Access tokens: 1 hour expiry
- Refresh tokens: 7 days expiry
- Token revocation support
- No sensitive data in tokens

### Audit Trail

All security events logged:

- LOGIN, LOGIN_FAILED, LOGOUT
- ACCOUNT_LOCKED
- PASSWORD_CHANGED
- ROLE_ASSIGNED, ROLE_REMOVED
- PERMISSION_CHANGED
- USER_CREATED, USER_UPDATED, USER_DELETED

---

## 🎭 Authorization Model

### Permission Structure

Each permission defines:

- **Actions**: CREATE, READ, UPDATE, DELETE, APPROVE, REJECT, VERIFY, EXPORT
- **Subjects**: BIRTH, PERSON, HOUSEHOLD, ADMIN, USER, CENSUS, REPORT, ROLE, PERMISSION

### Example Permission

```json
{
  "name": "birth-approval",
  "description": "Can approve birth registrations",
  "actions": ["APPROVE", "REJECT"],
  "subjects": ["BIRTH"]
}
```

### Using Permissions in Code

```typescript
@Post('births/:id/approve')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@RequirePermission(PermissionAction.APPROVE, PermissionSubject.BIRTH)
async approveBirth(@Param('id') birthId: string) {
  // Only users with APPROVE permission on BIRTH can access
  return this.birthService.approve(birthId);
}
```

---

## 🔑 JWT Token Structure

### Access Token Payload

```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "cidNo": "10101234567890",
  "roleType": "ADMIN",
  "roles": ["REGISTRY_ADMIN", "BIRTH_APPROVER"],
  "permissions": [
    { "action": "CREATE", "subject": "BIRTH" },
    { "action": "APPROVE", "subject": "BIRTH" }
  ],
  "officeLocationId": "660e8400-e29b-41d4-a716-446655440000",
  "type": "access",
  "iat": 1705075200,
  "exp": 1705078800
}
```

---

## 📚 Documentation

Comprehensive documentation available in `/docs`:

1. **[Complete Implementation Guide](docs/AUTH_COMPLETE_IMPLEMENTATION_GUIDE.md)**

   - System overview
   - Database schemas
   - Authentication flows
   - Authorization model
   - Security features
   - Best practices

2. **[API Examples](docs/API_EXAMPLES.md)**

   - cURL examples
   - Postman collection
   - Testing workflows
   - Error responses

3. **[Development Guide](docs/development.md)**
   - Setup instructions
   - Code generation
   - Testing guide
   - Deployment

---

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov

# Test specific file
npm run test -- auth.service.spec.ts
```

### Example Test

```bash
# Login as citizen
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "33333333333333", "password": "Citizen@123"}'

# Get user info
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📦 Project Structure

```
src/
├── modules/
│   ├── auth/
│   │   ├── entities/          # Database entities
│   │   ├── dto/               # Data transfer objects
│   │   ├── services/          # Business logic
│   │   ├── controllers/       # API controllers
│   │   └── auth.module.ts
│   └── user/
├── guards/                     # Authentication guards
├── decorators/                 # Custom decorators
├── filters/                    # Exception filters
├── interceptors/               # Request interceptors
├── database/
│   ├── migrations/            # Database migrations
│   └── seed.service.ts        # Data seeding
└── main.ts                    # Application entry
```

---

## 🚢 Deployment

### Docker

```bash
# Build image
docker build -t census-auth .

# Run container
docker run -p 3000:3000 census-auth
```

### Docker Compose

```bash
docker-compose up -d
```

### Environment Variables

```bash
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=census
DB_PASSWORD=secure_password
DB_DATABASE=census_auth

JWT_PRIVATE_KEY=<RS256 private key>
JWT_PUBLIC_KEY=<RS256 public key>
JWT_EXPIRATION_TIME=3600

PORT=3000
NODE_ENV=production
```

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📄 License

MIT License - see LICENSE file for details

---

## 🆘 Support

For issues and questions:

- Create an issue on GitHub
- Contact: dev@census.gov.bt
- Documentation: `/docs`

---

## 📊 System Status

- ✅ **Authentication**: Complete
- ✅ **Authorization (RBAC)**: Complete
- ✅ **Audit Logging**: Complete
- ✅ **Security Features**: Complete
- ✅ **API Documentation**: Complete
- ⏳ **NDI Integration**: Ready for implementation
- ✅ **Database Migrations**: Complete
- ✅ **Seed Data**: Complete
- ✅ **Testing**: In Progress

---

## 🎯 Roadmap

- [x] Core authentication (Citizens & Admins)
- [x] RBAC with permissions
- [x] Audit logging
- [x] Account security (lockout, rate limiting)
- [x] JWT token management
- [ ] NDI OAuth integration
- [ ] Two-factor authentication (2FA)
- [ ] Session management
- [ ] Email notifications
- [ ] Mobile app support

---

**Built with ❤️ for Bhutan's National Census System**

**Version**: 1.0.0  
**Last Updated**: January 12, 2026  
**Status**: Production Ready ✅
