# Role Assignment Endpoints - Understanding the Difference

## 🔴 Your Error Explained

You sent:

```json
{
  "adminId": "5a41fe63-8f66-41da-97fb-abd9eac8a349",
  "roleId": "5a41fe63-8f66-41da-97fb-abd9eac8a349"
}
```

To the **wrong endpoint**. This caused a 500 Internal Server Error because:

- You're using the `/role-permission` endpoint (for assigning **permissions to roles**)
- But sending `adminId` instead of `permissionId`

---

## 📋 Two Different Assignment Types

### 1️⃣ **Admin-Role Assignment** (Assign Roles to Admins)

**Endpoint**: `POST /admin-role`

**Purpose**: Give an admin user a specific role

**Request Body**:

```json
{
  "adminId": "5a41fe63-8f66-41da-97fb-abd9eac8a349",
  "roleId": "7b52ge74-9g77-52eb-a8gc-bce0fbd9b450"
}
```

**Use Case**:

- "Make John Doe a Data Entry Operator"
- "Assign Super Admin role to Jane Smith"

**What it does**: Creates a link between an **Admin** and a **Role**

---

### 2️⃣ **Role-Permission Assignment** (Assign Permissions to Roles)

**Endpoint**: `POST /role-permission`

**Purpose**: Define what actions a role can perform

**Request Body**:

```json
{
  "roleId": "7b52ge74-9g77-52eb-a8gc-bce0fbd9b450",
  "permissionId": "9c63hf85-0h88-63fc-b9hd-cdf1gce0c561"
}
```

**Use Case**:

- "Give the 'Data Entry Operator' role permission to 'manage-users'"
- "Allow 'Super Admin' role to 'manage-agencies'"

**What it does**: Creates a link between a **Role** and a **Permission**

---

## 🔄 How They Work Together

```
Admin → Admin-Role → Role → Role-Permission → Permission
```

**Example Flow**:

1. Create a **Permission**: "manage-users" (CRUD operations on users)
2. Create a **Role**: "User Manager"
3. **Assign permission to role**: Link "manage-users" to "User Manager"
4. Create an **Admin**: John Doe
5. **Assign role to admin**: Link "User Manager" to John Doe

**Result**: John Doe can now manage users!

---

## ✅ Correct Request Examples

### Assigning a Role to an Admin

```bash
POST /admin-role
Content-Type: application/json

{
  "adminId": "5a41fe63-8f66-41da-97fb-abd9eac8a349",
  "roleId": "7b52ge74-9g77-52eb-a8gc-bce0fbd9b450"
}
```

**Response** (201 Created):

```json
{
  "id": "new-assignment-uuid",
  "adminId": "5a41fe63-8f66-41da-97fb-abd9eac8a349",
  "roleId": "7b52ge74-9g77-52eb-a8gc-bce0fbd9b450",
  "createdAt": "2026-01-15T10:30:00.000Z",
  "updatedAt": "2026-01-15T10:30:00.000Z"
}
```

---

### Assigning a Permission to a Role

```bash
POST /role-permission
Content-Type: application/json

{
  "roleId": "7b52ge74-9g77-52eb-a8gc-bce0fbd9b450",
  "permissionId": "9c63hf85-0h88-63fc-b9hd-cdf1gce0c561"
}
```

**Response** (201 Created):

```json
{
  "id": "new-assignment-uuid",
  "roleId": "7b52ge74-9g77-52eb-a8gc-bce0fbd9b450",
  "permissionId": "9c63hf85-0h88-63fc-b9hd-cdf1gce0c561",
  "createdAt": "2026-01-15T10:30:00.000Z",
  "updatedAt": "2026-01-15T10:30:00.000Z"
}
```

---

## 🚨 Error Responses (After Validation Enhancement)

### 404 Not Found - Role doesn't exist

```json
{
  "statusCode": 404,
  "message": "Role with ID \"7b52ge74-9g77-52eb-a8gc-bce0fbd9b450\" not found",
  "error": "Not Found"
}
```

### 404 Not Found - Permission doesn't exist

```json
{
  "statusCode": 404,
  "message": "Permission with ID \"9c63hf85-0h88-63fc-b9hd-cdf1gce0c561\" not found",
  "error": "Not Found"
}
```

### 409 Conflict - Assignment already exists

```json
{
  "statusCode": 409,
  "message": "Permission \"manage-users\" is already assigned to role \"User Manager\"",
  "error": "Conflict"
}
```

---

## 📊 Database Schema Reference

From `1705075200000-InitialAuthSchema.ts`:

### admin_role table

```sql
CREATE TABLE "admin_role" (
  "id" uuid PRIMARY KEY,
  "admin_id" uuid NOT NULL,      -- References admin table
  "role_id" uuid NOT NULL         -- References roles table
)
```

### role_permission table

```sql
CREATE TABLE "role_permission" (
  "id" uuid PRIMARY KEY,
  "role_id" uuid NOT NULL,        -- References roles table
  "permission_id" uuid NOT NULL   -- References permissions table
)
```

---

## 🎯 Quick Reference

| Endpoint                | Field 1   | Field 2        | Purpose                |
| ----------------------- | --------- | -------------- | ---------------------- |
| `POST /admin-role`      | `adminId` | `roleId`       | Give admin a role      |
| `POST /role-permission` | `roleId`  | `permissionId` | Give role a permission |

---

## 🔧 Validation Enhancements Applied

The `role-permission.service.ts` now includes:

1. ✅ **Validates role exists** (404 if not found)
2. ✅ **Validates permission exists** (404 if not found)
3. ✅ **Checks for duplicate assignments** (409 if already assigned)
4. ✅ **Provides descriptive error messages** (includes role/permission names)

This prevents the 500 Internal Server Error you experienced!
