# Census Auth API Collection

## Complete API Examples with cURL

## to create super admin run:

## yarn create-superadmin

to login as super admin run:

## yarn create-superadmin

## Authentication Endpoints

### 1. Citizen Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "33333333333333",
    "password": "Citizen@123"
  }'
```

**Response:**

```json
{
  "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600,
  "tokenType": "Bearer",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "cidNo": "33333333333333",
    "roleType": "CITIZEN",
    "roles": ["CITIZEN_USER"],
    "permissions": [
      { "action": "CREATE", "subject": "BIRTH" },
      { "action": "READ", "subject": "BIRTH" }
    ]
  }
}
```

### 2. Admin Login

```bash
curl -X POST http://localhost:3000/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "cidNo": "11111111111111",
    "password": "SuperAdmin@123"
  }'
```

**Response:**

```json
{
  "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600,
  "tokenType": "Bearer",
  "user": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "cidNo": "11111111111111",
    "roleType": "ADMIN",
    "roles": ["SUPER_ADMIN"],
    "permissions": [
      { "action": "CREATE", "subject": "BIRTH" },
      { "action": "APPROVE", "subject": "BIRTH" },
      { "action": "CREATE", "subject": "USER" },
      { "action": "UPDATE", "subject": "ROLE" }
    ],
    "officeLocationId": "770e8400-e29b-41d4-a716-446655440000"
  }
}
```

### 3. Get Current User Info

```bash
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "cidNo": "11111111111111",
  "roleType": "ADMIN",
  "email": "superadmin@census.gov.bt",
  "mobileNo": "+97517111111",
  "officeLocation": "Thimphu Dzongkhag",
  "roles": ["SUPER_ADMIN", "REGISTRY_ADMIN"],
  "permissions": [
    { "action": "CREATE", "subject": "BIRTH" },
    { "action": "APPROVE", "subject": "BIRTH" },
    { "action": "CREATE", "subject": "USER" },
    { "action": "UPDATE", "subject": "ADMIN" }
  ]
}
```

### 4. Validate Permission

```bash
curl -X POST http://localhost:3000/auth/validate \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "APPROVE",
    "subject": "BIRTH"
  }'
```

**Response:**

```json
{
  "hasPermission": true
}
```

### 5. Logout

```bash
curl -X POST http://localhost:3000/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:** 204 No Content

---

## User Management Endpoints

### 6. Create Citizen User

```bash
curl -X POST http://localhost:3000/auth/users \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cidNo": "99999999999999",
    "password": "NewUser@123",
    "ndiDeeplink": "ndi://auth?user=99999999999999"
  }'
```

**Response:**

```json
{
  "id": "880e8400-e29b-41d4-a716-446655440000",
  "cidNo": "99999999999999",
  "roleType": "CITIZEN",
  "createdAt": "2026-01-12T10:30:00Z",
  "updatedAt": "2026-01-12T10:30:00Z"
}
```

### 7. Create Admin User

```bash
curl -X POST http://localhost:3000/auth/admins \
  -H "Authorization: Bearer YOUR_SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cidNo": "88888888888888",
    "password": "NewAdmin@123",
    "officeLocationId": "770e8400-e29b-41d4-a716-446655440000",
    "agencyId": "REGISTRY",
    "mobileNo": "+97517888888",
    "email": "newadmin@census.gov.bt"
  }'
```

**Response:**

```json
{
  "id": "990e8400-e29b-41d4-a716-446655440000",
  "cidNo": "88888888888888",
  "roleType": "ADMIN",
  "email": "newadmin@census.gov.bt",
  "mobileNo": "+97517888888",
  "officeLocationId": "770e8400-e29b-41d4-a716-446655440000",
  "createdAt": "2026-01-12T10:35:00Z"
}
```

---

## Role Management Endpoints

### 8. Create Role

```bash
curl -X POST http://localhost:3000/auth/roles \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "DATA_ANALYST",
    "description": "Can view and export census data reports"
  }'
```

**Response:**

```json
{
  "id": "aa0e8400-e29b-41d4-a716-446655440000",
  "name": "DATA_ANALYST",
  "description": "Can view and export census data reports",
  "isActive": true,
  "createdAt": "2026-01-12T10:40:00Z"
}
```

### 9. Create Permission

```bash
curl -X POST http://localhost:3000/auth/permissions \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "household-census",
    "description": "Manage household census data",
    "actions": ["CREATE", "READ", "UPDATE"],
    "subjects": ["HOUSEHOLD", "PERSON"]
  }'
```

**Response:**

```json
{
  "id": "bb0e8400-e29b-41d4-a716-446655440000",
  "name": "household-census",
  "description": "Manage household census data",
  "actions": ["CREATE", "READ", "UPDATE"],
  "subjects": ["HOUSEHOLD", "PERSON"],
  "isActive": true,
  "createdAt": "2026-01-12T10:45:00Z"
}
```

### 10. Assign Permissions to Role

```bash
curl -X POST http://localhost:3000/auth/roles/aa0e8400-e29b-41d4-a716-446655440000/permissions \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "permissionIds": [
      "bb0e8400-e29b-41d4-a716-446655440000",
      "cc0e8400-e29b-41d4-a716-446655440000"
    ]
  }'
```

**Response:** 204 No Content

### 11. Assign Roles to User

```bash
curl -X POST http://localhost:3000/auth/users/880e8400-e29b-41d4-a716-446655440000/roles \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "roleIds": [
      "aa0e8400-e29b-41d4-a716-446655440000"
    ]
  }'
```

**Response:** 204 No Content

### 12. Assign Roles to Admin

```bash
curl -X POST http://localhost:3000/auth/admins/990e8400-e29b-41d4-a716-446655440000/roles \
  -H "Authorization: Bearer YOUR_SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "roleIds": [
      "dd0e8400-e29b-41d4-a716-446655440000"
    ]
  }'
```

**Response:** 204 No Content

---

## Common Error Responses

### 401 Unauthorized - Invalid Credentials

```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

### 403 Forbidden - Account Locked

```json
{
  "statusCode": 403,
  "message": "Account locked. Try again in 25 minutes",
  "error": "Forbidden"
}
```

### 403 Forbidden - Insufficient Permissions

```json
{
  "statusCode": 403,
  "message": "Insufficient permissions",
  "error": "Forbidden"
}
```

### 400 Bad Request - Validation Error

```json
{
  "statusCode": 400,
  "message": ["password must be at least 8 characters", "email must be a valid email address"],
  "error": "Bad Request"
}
```

### 409 Conflict - Duplicate Resource

```json
{
  "statusCode": 409,
  "message": "User with this CID already exists",
  "error": "Conflict"
}
```

---

## Testing Workflows

### Workflow 1: Complete User Creation Flow

```bash
# 1. Login as Super Admin
TOKEN=$(curl -s -X POST http://localhost:3000/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"cidNo": "11111111111111", "password": "SuperAdmin@123"}' \
  | jq -r '.accessToken')

# 2. Create a new role
ROLE_ID=$(curl -s -X POST http://localhost:3000/auth/roles \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "FIELD_WORKER", "description": "Census field worker"}' \
  | jq -r '.id')

# 3. Create a new permission
PERM_ID=$(curl -s -X POST http://localhost:3000/auth/permissions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "field-data", "actions": ["CREATE", "READ"], "subjects": ["HOUSEHOLD"]}' \
  | jq -r '.id')

# 4. Assign permission to role
curl -X POST http://localhost:3000/auth/roles/$ROLE_ID/permissions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"permissionIds\": [\"$PERM_ID\"]}"

# 5. Create new user
USER_ID=$(curl -s -X POST http://localhost:3000/auth/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"cidNo": "77777777777777", "password": "FieldWorker@123"}' \
  | jq -r '.id')

# 6. Assign role to user
curl -X POST http://localhost:3000/auth/users/$USER_ID/roles \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"roleIds\": [\"$ROLE_ID\"]}"

# 7. Login as new user
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "77777777777777", "password": "FieldWorker@123"}'
```

### Workflow 2: Permission Validation

```bash
# 1. Login
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "33333333333333", "password": "Citizen@123"}' \
  | jq -r '.accessToken')

# 2. Get my info
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer $TOKEN"

# 3. Validate permission to create birth record
curl -X POST http://localhost:3000/auth/validate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "CREATE", "subject": "BIRTH"}'

# 4. Validate permission to approve (should fail for citizen)
curl -X POST http://localhost:3000/auth/validate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "APPROVE", "subject": "BIRTH"}'
```

### Workflow 3: Account Lockout Test

```bash
# Try to login with wrong password 5 times
for i in {1..5}; do
  echo "Attempt $i:"
  curl -X POST http://localhost:3000/auth/admin/login \
    -H "Content-Type: application/json" \
    -d '{"cidNo": "22222222222222", "password": "WrongPassword"}'
  echo ""
done

# 6th attempt should return account locked
curl -X POST http://localhost:3000/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"cidNo": "22222222222222", "password": "RegAdmin@123"}'
```

---

## Postman Collection

Import this JSON to Postman:

```json
{
  "info": {
    "name": "Census Auth API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000"
    },
    {
      "key": "accessToken",
      "value": ""
    }
  ],
  "item": [
    {
      "name": "Authentication",
      "item": [
        {
          "name": "Citizen Login",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": ["pm.collectionVariables.set('accessToken', pm.response.json().accessToken);"]
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [],
            "body": {
              "mode": "raw",
              "raw": "{\"email\": \"33333333333333\", \"password\": \"Citizen@123\"}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": "{{baseUrl}}/auth/login"
          }
        },
        {
          "name": "Admin Login",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": ["pm.collectionVariables.set('accessToken', pm.response.json().accessToken);"]
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [],
            "body": {
              "mode": "raw",
              "raw": "{\"cidNo\": \"11111111111111\", \"password\": \"SuperAdmin@123\"}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": "{{baseUrl}}/auth/admin/login"
          }
        },
        {
          "name": "Get Me",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{accessToken}}"
              }
            ],
            "url": "{{baseUrl}}/auth/me"
          }
        }
      ]
    }
  ]
}
```

---

## Environment Setup

### Development Environment

```bash
# .env.development
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=census
DB_PASSWORD=census_dev
DB_DATABASE=census_auth_dev

JWT_PRIVATE_KEY=<your_private_key>
JWT_PUBLIC_KEY=<your_public_key>
JWT_EXPIRATION_TIME=3600

PORT=3000
NODE_ENV=development
```

### Testing with Docker

```bash
# Start database
docker-compose up -d postgres

# Run migrations
npm run migration:run

# Seed database
npm run seed

# Start server
npm run start:dev
```

---

**Last Updated**: January 12, 2026  
**API Version**: 1.0
