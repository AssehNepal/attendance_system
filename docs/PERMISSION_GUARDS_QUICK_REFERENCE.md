# 🚀 Quick Reference: Permission Guards

## 🔐 SUPER_ADMIN Behavior

### ✅ What SUPER_ADMIN Can Do:

```
✅ Access ALL endpoints without restriction
✅ Bypass ALL role checks
✅ Bypass ALL permission checks
✅ Create/Read/Update/Delete any resource
✅ Login returns empty ability array: []
```

### How to Create SUPER_ADMIN:

```bash
yarn create-superadmin
```

### How to Login:

```bash
curl -X POST http://localhost:5001/auth/admin/login \
  -H 'Content-Type: application/json' \
  -d '{"cidNo": "10304001084", "password": "Jeewanlal@12"}'
```

---

## 🔑 Regular ADMIN Behavior

### ✅ What Regular ADMIN Can Do:

```
✅ Access endpoints based on assigned permissions
✅ Login returns ability array with permissions
✅ Guards check ability array for each request
❌ Denied if permission not in ability array
```

### Example Ability Array:

```json
{
  "ability": [
    {
      "name": "Manage Admins",
      "action": ["CREATE", "READ", "UPDATE"],
      "subject": "ADMIN"
    },
    {
      "name": "View Roles",
      "action": "READ",
      "subject": "ROLE"
    }
  ]
}
```

---

## 📋 Permission Structure

### Actions:

- `CREATE` - Create new resources
- `READ` - View/list resources
- `UPDATE` - Modify resources
- `DELETE` - Remove resources
- `APPROVE` - Approve items

### Subjects:

- `ADMIN` - Admin management, office locations
- `ROLE` - Roles and role-permission assignments
- `PERMISSION` - Permission management
- `BIRTH`, `PERSON`, `HOUSEHOLD` - Future subjects

---

## 🛡️ Protected Endpoints

### Admin Management (`/admin`):

```
POST /admin              → CREATE + ADMIN
GET /admin               → READ + ADMIN
GET /admin/:id           → READ + ADMIN
PATCH /admin/:id         → UPDATE + ADMIN
DELETE /admin/:id        → DELETE + ADMIN
POST /admin/:id/assign   → UPDATE + ADMIN
```

### Roles (`/roles`):

```
POST /roles              → CREATE + ROLE
GET /roles               → READ + ROLE
PATCH /roles/:id         → UPDATE + ROLE
DELETE /roles/:id        → DELETE + ROLE
```

### Permissions (`/permissions`):

```
POST /permissions        → CREATE + PERMISSION
GET /permissions         → READ + PERMISSION
PATCH /permissions/:id   → UPDATE + PERMISSION
DELETE /permissions/:id  → DELETE + PERMISSION
```

### Office Locations (`/office-locations`):

```
POST /office-locations   → CREATE + ADMIN
GET /office-locations    → READ + ADMIN
PATCH /office-locations/:id → UPDATE + ADMIN
DELETE /office-locations/:id → DELETE + ADMIN
```

### Admin-Role Assignments (`/admin-role`):

```
POST /admin-role         → UPDATE + ADMIN
GET /admin-role          → READ + ADMIN
DELETE /admin-role/:id   → DELETE + ADMIN
```

### Role-Permission Assignments (`/role-permission`):

```
POST /role-permission    → UPDATE + ROLE
GET /role-permission     → READ + ROLE
DELETE /role-permission/:id → DELETE + ROLE
```

---

## 🌐 Public Endpoints (No Guards)

### Auth:

```
✅ POST /auth/admin/login
✅ POST /auth/user/login
```

### Users:

```
✅ All /users endpoints (currently public)
```

### Health:

```
✅ GET /health
```

---

## 🧪 Testing

### Test SUPER_ADMIN Access:

```bash
# 1. Login
TOKEN=$(curl -X POST http://localhost:5001/auth/admin/login \
  -H 'Content-Type: application/json' \
  -d '{"cidNo": "10304001084", "password": "Jeewanlal@12"}' \
  | jq -r '.accessToken')

# 2. Test any endpoint (should succeed)
curl -X GET http://localhost:5001/admin \
  -H "Authorization: Bearer $TOKEN"
```

### Test Regular ADMIN Access:

```bash
# 1. Login as regular admin
TOKEN=$(curl -X POST http://localhost:5001/auth/admin/login \
  -H 'Content-Type: application/json' \
  -d '{"cidNo": "12345678901", "password": "password"}' \
  | jq -r '.accessToken')

# 2. Test endpoint (success depends on permissions)
curl -X GET http://localhost:5001/admin \
  -H "Authorization: Bearer $TOKEN"
# Returns 200 if has READ + ADMIN permission
# Returns 403 if missing permission
```

### Test Without Token:

```bash
curl -X GET http://localhost:5001/admin
# Returns 401 Unauthorized
```

---

## 🎯 Swagger Testing

### 1. Open Swagger UI:

```
http://localhost:5001/api-docs
```

### 2. Authorize:

1. Click **"Authorize"** button (top right)
2. Enter: `Bearer <your-access-token>`
3. Click **"Authorize"**
4. Click **"Close"**

### 3. Test Endpoints:

- Protected endpoints show 🔒 icon
- All requests automatically include your token
- SUPER_ADMIN can access everything
- Regular ADMIN gets 403 if missing permission

---

## 📊 Decision Tree

```
Request → Has Token?
          ├─ No → 401 Unauthorized ❌
          └─ Yes → User Type?
                   ├─ SUPER_ADMIN → Allow ✅
                   ├─ ADMIN → Has Permission?
                   │          ├─ Yes → Allow ✅
                   │          └─ No → 403 Forbidden ❌
                   └─ CITIZEN → Public endpoint?
                              ├─ Yes → Allow ✅
                              └─ No → 403 Forbidden ❌
```

---

## 🔧 Common Tasks

### Add Permission to New Endpoint:

```typescript
@Post()
@Roles([RoleType.SUPER_ADMIN, RoleType.ADMIN])
@RequirePermission('CREATE', 'BIRTH')
createBirth() { ... }
```

### Make Endpoint Public:

```typescript
// Don't add guards - leave controller as is
@Controller('public-route')
export class PublicController { ... }
```

### Create Permission in Database:

```sql
INSERT INTO permissions (name, description, actions, subjects)
VALUES (
  'Manage Births',
  'Create, read, update births',
  '["CREATE", "READ", "UPDATE"]',
  '["BIRTH"]'
);
```

---

## 📝 Key Points

1. **SUPER_ADMIN** bypasses everything ✅
2. **Regular ADMIN** requires permissions in ability array
3. **Auth & User modules** remain public (no guards)
4. **Permissions checked** via ability array from JWT
5. **Roles Guard** checks roleType field
6. **Permissions Guard** checks ability array

---

## 🎉 Implementation Complete!

✅ JWT Authentication  
✅ Role-based Access Control  
✅ Permission-based Access Control  
✅ SUPER_ADMIN Bypass Logic  
✅ All Controllers Protected  
✅ Swagger Integration  
✅ Zero TypeScript Errors

**Ready to use! 🚀**
