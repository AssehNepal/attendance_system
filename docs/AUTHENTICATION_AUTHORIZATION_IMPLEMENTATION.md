# 🔐 Authentication & Authorization Implementation Guide

## Overview

This document describes the complete authentication and authorization system implemented in the Census Auth Service. The system provides **role-based access control (RBAC)** with **permission-based fine-grained access control**, and **SUPER_ADMIN bypass** for unrestricted access.

---

## 🏗️ Architecture

### Three-Layer Security Model

```
Request → JWT Guard → Roles Guard → Permissions Guard → Controller → Service
          ↓           ↓              ↓
      Validates    Checks         Checks
      token        role_type      ability array
```

---

## 🔑 Role Types

### 1. **CITIZEN** (Users)

- Regular users who login via citizen endpoints
- No permissions or roles
- Access to user-specific endpoints only

### 2. **ADMIN**

- Admin users with assigned roles and permissions
- Permissions checked via `ability` array returned from login
- Role-permission based access control

### 3. **SUPER_ADMIN** 🔓

- **BYPASSES ALL GUARDS**
- Full unrestricted access to all endpoints
- No role or permission checks performed
- Created via `yarn create-superadmin` script

---

## 🛡️ Guards Implementation

### 1. **AuthGuard** (`src/guards/auth.guard.ts`)

- **Purpose**: Validates JWT token
- **Flow**:
  - Extracts Bearer token from Authorization header
  - Validates signature with public key
  - Calls JwtStrategy to load user data
  - Attaches user object to `request.user`

### 2. **RolesGuard** (`src/guards/roles.guard.ts`)

- **Purpose**: Checks if user has required role
- **SUPER_ADMIN Bypass**: ✅

```typescript
// If SUPER_ADMIN, bypass role check
if (user.roleType === 'SUPER_ADMIN') {
  return true;
}

// Otherwise check if user has required role
return roles.includes(user.roleType);
```

### 3. **PermissionsGuard** (`src/guards/permissions.guard.ts`)

- **Purpose**: Checks if user has required permission
- **SUPER_ADMIN Bypass**: ✅

```typescript
// If SUPER_ADMIN, bypass permission check
if (user.roleType === 'SUPER_ADMIN') {
  return true;
}

// Otherwise check ability array
return user.ability.some((ability) => hasAction && hasSubject);
```

---

## 🎯 Decorators

### 1. **@Roles([...roleTypes])**

```typescript
@Roles([RoleType.SUPER_ADMIN, RoleType.ADMIN])
```

- Specifies which roles can access the endpoint
- Applied at controller or method level
- SUPER_ADMIN automatically bypasses

### 2. **@RequirePermission(action, subject)**

```typescript
@RequirePermission('CREATE', 'ADMIN')
@RequirePermission('READ', 'ROLE')
@RequirePermission('UPDATE', 'PERMISSION')
@RequirePermission('DELETE', 'ADMIN')
```

- Specifies required permission (action + subject)
- Checked against user's `ability` array
- SUPER_ADMIN automatically bypasses

### 3. **@ApiBearerAuth()**

```typescript
@ApiBearerAuth()
```

- Swagger documentation decorator
- Shows 🔒 lock icon on protected endpoints
- Enables "Authorize" button in Swagger UI

---

## 📋 Protected Controllers

### Controllers with Full Guards Applied:

#### ✅ **Admin Controller** (`/admin`)

- Requires: `SUPER_ADMIN` or `ADMIN` role
- Permissions:
  - `CREATE` + `ADMIN` - Create admin
  - `READ` + `ADMIN` - List/view admins
  - `UPDATE` + `ADMIN` - Update admin, assign roles
  - `DELETE` + `ADMIN` - Delete admin

#### ✅ **Roles Controller** (`/roles`)

- Requires: `SUPER_ADMIN` or `ADMIN` role
- Permissions:
  - `CREATE` + `ROLE` - Create role
  - `READ` + `ROLE` - List/view roles
  - `UPDATE` + `ROLE` - Update role
  - `DELETE` + `ROLE` - Delete role

#### ✅ **Permissions Controller** (`/permissions`)

- Requires: `SUPER_ADMIN` or `ADMIN` role
- Permissions:
  - `CREATE` + `PERMISSION` - Create permission
  - `READ` + `PERMISSION` - List/view permissions
  - `UPDATE` + `PERMISSION` - Update permission
  - `DELETE` + `PERMISSION` - Delete permission

#### ✅ **Office Location Controller** (`/office-locations`)

- Requires: `SUPER_ADMIN` or `ADMIN` role
- Permissions:
  - `CREATE` + `ADMIN` - Create office location
  - `READ` + `ADMIN` - List/view office locations
  - `UPDATE` + `ADMIN` - Update office location
  - `DELETE` + `ADMIN` - Delete office location

#### ✅ **Admin-Role Controller** (`/admin-role`)

- Requires: `SUPER_ADMIN` or `ADMIN` role
- Permissions:
  - `UPDATE` + `ADMIN` - Assign role to admin
  - `READ` + `ADMIN` - View role assignments
  - `DELETE` + `ADMIN` - Remove role from admin

#### ✅ **Role-Permission Controller** (`/role-permission`)

- Requires: `SUPER_ADMIN` or `ADMIN` role
- Permissions:
  - `UPDATE` + `ROLE` - Assign permission to role
  - `READ` + `ROLE` - View permission assignments
  - `DELETE` + `ROLE` - Remove permission from role

### Controllers WITHOUT Guards (Public):

#### 🌐 **Auth Controller** (`/auth`)

- **All endpoints public** (login, register)
- No authentication required

#### 🌐 **Users Controller** (`/users`)

- **All endpoints public** (for now)
- User self-management

#### 🌐 **Health Controller** (`/health`)

- **Public** (for monitoring)

---

## 🔄 Login Flow

### SUPER_ADMIN Login:

```bash
POST /auth/admin/login
{
  "cidNo": "10304001084",
  "password": "Jeewanlal@12"
}

Response:
{
  "message": "Logged in successfully as Super Admin",
  "accessToken": "eyJhbG...",
  "user": {
    "id": "uuid",
    "cidNo": "10304001084",
    "roleType": "SUPER_ADMIN",
    "roles": []
  },
  "ability": []  // Empty - SUPER_ADMIN has no restrictions
}
```

### Regular ADMIN Login:

```bash
POST /auth/admin/login
{
  "cidNo": "12345678901",
  "password": "password123"
}

Response:
{
  "message": "Logged in successfully as Admin",
  "accessToken": "eyJhbG...",
  "user": {
    "id": "uuid",
    "cidNo": "12345678901",
    "roleType": "ADMIN",
    "roles": ["Data Entry", "Approver"]
  },
  "ability": [
    {
      "name": "Manage Births",
      "action": ["CREATE", "READ", "UPDATE"],
      "subject": "BIRTH"
    },
    {
      "name": "View Households",
      "action": "READ",
      "subject": "HOUSEHOLD"
    }
  ]
}
```

---

## 🔐 Making Authenticated Requests

### 1. Get Access Token from Login

```bash
# Login
curl -X POST http://localhost:5001/auth/admin/login \
  -H 'Content-Type: application/json' \
  -d '{"cidNo": "10304001084", "password": "Jeewanlal@12"}'

# Response contains: { "accessToken": "eyJhbG..." }
```

### 2. Use Token in Subsequent Requests

```bash
curl -X GET http://localhost:5001/admin \
  -H 'Authorization: Bearer eyJhbG...'
```

### 3. Swagger UI

1. Click **"Authorize"** button at top
2. Enter: `Bearer eyJhbG...` (include "Bearer " prefix)
3. Click **"Authorize"**
4. All requests now include the token

---

## ✅ Permission Examples

### Example 1: SUPER_ADMIN

```typescript
// SUPER_ADMIN bypasses ALL checks
roleType: 'SUPER_ADMIN'
ability: []

// Can access:
POST /admin          ✅ (bypasses CREATE + ADMIN check)
GET /roles           ✅ (bypasses READ + ROLE check)
DELETE /permissions  ✅ (bypasses DELETE + PERMISSION check)
```

### Example 2: Regular ADMIN with Limited Permissions

```typescript
// Regular ADMIN
roleType: 'ADMIN'
roles: ['Data Entry']
ability: [
  { action: 'CREATE', subject: 'BIRTH' },
  { action: 'READ', subject: 'BIRTH' }
]

// Access:
POST /admin          ❌ (no CREATE + ADMIN permission)
GET /roles           ❌ (no READ + ROLE permission)
POST /birth          ✅ (has CREATE + BIRTH permission)
GET /birth           ✅ (has READ + BIRTH permission)
DELETE /birth        ❌ (no DELETE + BIRTH permission)
```

### Example 3: ADMIN with Full Admin Permissions

```typescript
roleType: 'ADMIN'
roles: ['Admin Manager']
ability: [
  { action: ['CREATE', 'READ', 'UPDATE', 'DELETE'], subject: 'ADMIN' },
  { action: ['CREATE', 'READ', 'UPDATE', 'DELETE'], subject: 'ROLE' }
]

// Access:
POST /admin          ✅ (has CREATE + ADMIN)
GET /admin           ✅ (has READ + ADMIN)
PATCH /admin/:id     ✅ (has UPDATE + ADMIN)
DELETE /admin/:id    ✅ (has DELETE + ADMIN)
POST /roles          ✅ (has CREATE + ROLE)
```

---

## 🧪 Testing Guards

### Test 1: Without Token (Should Fail)

```bash
curl -X GET http://localhost:5001/admin
# Expected: 401 Unauthorized
```

### Test 2: With SUPER_ADMIN Token (Should Succeed)

```bash
# Login as SUPER_ADMIN
TOKEN=$(curl -X POST http://localhost:5001/auth/admin/login \
  -H 'Content-Type: application/json' \
  -d '{"cidNo": "10304001084", "password": "Jeewanlal@12"}' \
  | jq -r '.accessToken')

# Access any endpoint
curl -X GET http://localhost:5001/admin \
  -H "Authorization: Bearer $TOKEN"
# Expected: 200 OK (list of admins)

curl -X GET http://localhost:5001/roles \
  -H "Authorization: Bearer $TOKEN"
# Expected: 200 OK (list of roles)
```

### Test 3: With Regular ADMIN Token (Permission Dependent)

```bash
# Login as regular admin
TOKEN=$(curl -X POST http://localhost:5001/auth/admin/login \
  -H 'Content-Type: application/json' \
  -d '{"cidNo": "12345678901", "password": "password123"}' \
  | jq -r '.accessToken')

# Try accessing endpoint
curl -X POST http://localhost:5001/admin \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"cidNo": "98765432109", ...}'
# Expected:
# - 200/201 if admin has CREATE + ADMIN permission
# - 403 Forbidden if admin lacks permission
```

---

## 📝 JWT Payload Structure

```typescript
{
  userId: "uuid",
  cidNo: "10304001084",
  roleType: "SUPER_ADMIN" | "ADMIN" | "CITIZEN",
  type: "ACCESS_TOKEN",
  roles: ["Data Entry", "Approver"],  // Empty for SUPER_ADMIN
  permissions: [
    {
      actions: ["CREATE", "READ"],
      subjects: ["BIRTH"]
    }
  ],
  officeLocationId: "uuid"
}
```

### JWT Strategy Processing:

1. **Token validated** - Signature checked with public key
2. **User loaded** - Admin/User fetched from database
3. **Ability array built** - Permissions converted to ability format
4. **User object attached** - To `request.user` for guards

---

## 🚀 Quick Reference

### Create SUPER_ADMIN:

```bash
yarn create-superadmin
```

### Login as SUPER_ADMIN:

```bash
POST /auth/admin/login
{
  "cidNo": "10304001084",
  "password": "Jeewanlal@12"
}
```

### Use Token in Swagger:

1. Click **"Authorize"**
2. Enter: `Bearer <your-token>`
3. Test protected endpoints

### Add Permission to Endpoint:

```typescript
@RequirePermission('CREATE', 'ADMIN')
@Post()
create() { ... }
```

### SUPER_ADMIN Behavior:

- ✅ Bypasses RolesGuard
- ✅ Bypasses PermissionsGuard
- ✅ Full access to all endpoints
- ✅ Empty `ability` array
- ✅ No role assignments needed

---

## 🎉 Summary

### ✅ Implemented:

1. **JWT Authentication** - Token-based auth
2. **Role-based Access Control** - SUPER_ADMIN, ADMIN, CITIZEN
3. **Permission-based Access Control** - Fine-grained via ability array
4. **SUPER_ADMIN Bypass** - Full unrestricted access
5. **Guards Applied** - Admin, Roles, Permissions, Office-Location, Admin-Role, Role-Permission controllers
6. **Swagger Integration** - Bearer auth with lock icons
7. **Public Routes** - Auth and User endpoints remain public

### 🔐 Security Flow:

```
SUPER_ADMIN → Always Allowed ✅
ADMIN → Check ability array → Allow/Deny
CITIZEN → Public endpoints only
No Token → 401 Unauthorized ❌
```

---

## 📚 Related Documentation

- [SUPERADMIN_CREATION_GUIDE.md](./SUPERADMIN_CREATION_GUIDE.md)
- [API_EXAMPLES.md](../API_EXAMPLES.md)
- [ROLE_ASSIGNMENT_GUIDE.md](./ROLE_ASSIGNMENT_GUIDE.md)
