# Database Schema vs DTOs - Verification Summary

This document verifies all DTOs against the actual database schema from the migration file.

## ✅ Verified Against Migration: 1705075200000-InitialAuthSchema.ts

---

## 1. Users Table

### Database Schema

```sql
"users" (
  id uuid PRIMARY KEY,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  role_type varchar(20) DEFAULT 'CITIZEN',
  cid_no varchar(20) UNIQUE NOT NULL,
  password varchar (nullable),
  ndi_deeplink text (nullable)
)
```

### DTO Verification

- ✅ `cidNo` - matches DB (varchar 20, required, unique)
- ✅ `password` - matches DB (optional)
- ✅ `ndiDeeplink` - matches DB (optional, text)
- ⚠️ Missing: Better length validations (11-20 chars for CID)

---

## 2. Office Location Table

### Database Schema

```sql
"office_location" (
  id uuid PRIMARY KEY,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  name varchar(255) NOT NULL
)
```

### DTO Verification

- ✅ `name` - matches DB (varchar 255, required)
- ❌ **REMOVE**: `agencyId` - does NOT exist in DB!
- ❌ **REMOVE**: `address` - does NOT exist in DB!

**⚠️ CRITICAL:** Office locations do NOT have agency_id. The relationship is OTHER way around - Admin table has office_location_id!

---

## 3. Agency Table

### Database Schema

```sql
"agency" (
  id uuid PRIMARY KEY,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  name varchar(255) NOT NULL,
  code varchar(50) UNIQUE NOT NULL
)
```

### DTO Verification

- ✅ `name` - matches DB (varchar 255, required)
- ✅ `code` - matches DB (varchar 50, required, unique)
- ⚠️ Missing: Code format validation (uppercase, numbers, underscores)

---

## 4. Roles Table

### Database Schema

```sql
"roles" (
  id uuid PRIMARY KEY,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  name varchar(100) UNIQUE NOT NULL,
  description text (nullable)
)
```

### DTO Verification

- ✅ `name` - matches DB (varchar 100, required, unique)
- ✅ `description` - matches DB (text, optional)
- ⚠️ Missing: MaxLength(100) for name

---

## 5. Permissions Table

### Database Schema

```sql
"permissions" (
  id uuid PRIMARY KEY,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  name varchar(100) UNIQUE NOT NULL,
  description text (nullable),
  actions jsonb NOT NULL,
  subjects jsonb NOT NULL
)
```

### DTO Verification

- ✅ `name` - matches DB (varchar 100, required, unique)
- ✅ `description` - matches DB (text, optional)
- ✅ `actions` - matches DB (jsonb array, required)
- ✅ `subjects` - matches DB (jsonb array, required)
- ⚠️ Missing: ArrayNotEmpty validations

---

## 6. Role Permission Table

### Database Schema

```sql
"role_permission" (
  id uuid PRIMARY KEY,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  role_id uuid NOT NULL,
  permission_id uuid NOT NULL,
  UNIQUE(role_id, permission_id)
)
```

### DTO Verification

- ✅ `roleId` - matches DB (uuid, required)
- ✅ `permissionId` - matches DB (uuid, required)
- ✅ Unique constraint handled at DB level

---

## 7. Admin Table

### Database Schema

```sql
"admin" (
  id uuid PRIMARY KEY,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  cid_no varchar(20) UNIQUE NOT NULL,
  role_type varchar(20) DEFAULT 'ADMIN',
  password varchar(255) NOT NULL,
  office_location_id uuid (nullable),  -- FK to office_location
  agency_id uuid (nullable),            -- FK to agency
  mobile_no varchar(20) (nullable),
  email varchar(255) (nullable),
  ndi_deeplink varchar(255) (nullable)
)
```

### DTO Verification

- ✅ `cidNo` - matches DB (varchar 20, required, unique)
- ✅ `password` - matches DB (varchar 255, required)
- ✅ `officeLocationId` - matches DB (uuid, optional)
- ✅ `agencyId` - matches DB (uuid, optional)
- ✅ `mobileNo` - matches DB (varchar 20, optional)
- ✅ `email` - matches DB (varchar 255, optional)
- ✅ All validations properly implemented

---

## 8. Admin Role Table

### Database Schema

```sql
"admin_role" (
  id uuid PRIMARY KEY,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  admin_id uuid NOT NULL,
  role_id uuid NOT NULL,
  UNIQUE(admin_id, role_id)
)
```

### DTO Verification

- ✅ `adminId` - matches DB (uuid, required)
- ✅ `roleId` - matches DB (uuid, required)
- ✅ Unique constraint handled at DB level

---

## 🔗 Foreign Key Relationships

```
admin.office_location_id → office_location.id (SET NULL on delete)
admin.agency_id → agency.id (SET NULL on delete)
role_permission.role_id → roles.id (CASCADE on delete)
role_permission.permission_id → permissions.id (CASCADE on delete)
admin_role.admin_id → admin.id (CASCADE on delete)
admin_role.role_id → roles.id (CASCADE on delete)
```

**Key Insight:** Office locations are referenced BY admins, they don't reference anything themselves!

---

## 📝 Action Plan

### Priority 1: CRITICAL FIX

1. ❌ **Remove from create-office-location.dto.ts:**
   - `agencyId` field
   - `address` field
   - Any related validations

### Priority 2: ADD VALIDATIONS

1. ⚠️ **create-user.dto.ts:**

   - Add `@MinLength(11)` for cidNo
   - Add `@MaxLength(20)` for cidNo
   - Add `@MinLength(8)` for password

2. ⚠️ **create-agency.dto.ts:**

   - Add `@MinLength(3)` for name
   - Add `@MaxLength(255)` for name
   - Add `@MinLength(2)` for code
   - Add `@MaxLength(50)` for code
   - Add `@Matches(/^[A-Z0-9_]+$/)` for code

3. ⚠️ **create-role.dto.ts:**

   - Add `@MinLength(3)` for name
   - Add `@MaxLength(100)` for name
   - Add `@MaxLength(1000)` for description

4. ⚠️ **create-permission.dto.ts:**

   - Add `@MinLength(3)` for name
   - Add `@MaxLength(100)` for name
   - Add `@ArrayNotEmpty()` for actions
   - Add `@ArrayNotEmpty()` for subjects
   - Add `@IsString({ each: true })` for array items

5. ⚠️ **create-office-location.dto.ts:**
   - Add `@MinLength(3)` for name
   - Add `@MaxLength(255)` for name

---

## 🎯 Validation Standards

Based on migration file, these are the EXACT field lengths:

| Field Type      | Max Length | Validation                                                    |
| --------------- | ---------- | ------------------------------------------------------------- |
| CID Number      | 20         | `@MinLength(11) @MaxLength(20)`                               |
| Admin Password  | 255        | `@MinLength(11) @MaxLength(255)`                              |
| Email           | 255        | `@IsEmail() @MaxLength(255)`                                  |
| Mobile Number   | 20         | `@Matches(/^\+975\d{8}$/) @MaxLength(20)`                     |
| Agency Name     | 255        | `@MinLength(3) @MaxLength(255)`                               |
| Agency Code     | 50         | `@MinLength(2) @MaxLength(50) @Matches(/^[A-Z0-9_]+$/)`       |
| Role Name       | 100        | `@MinLength(3) @MaxLength(100)`                               |
| Permission Name | 100        | `@MinLength(3) @MaxLength(100)`                               |
| Office Name     | 255        | `@MinLength(3) @MaxLength(255)`                               |
| Description     | text       | Optional - no strict limit, suggest `@MaxLength(1000)` for UX |

---

## ✅ Final Checklist

- [ ] Remove agencyId from office-location DTOs
- [ ] Remove address from office-location DTOs
- [ ] Update office-location entity if it has wrong fields
- [ ] Add all missing MinLength/MaxLength validations
- [ ] Add Matches for agency code format
- [ ] Add ArrayNotEmpty for permission arrays
- [ ] Update ERROR_HANDLING_SPECIFICATION.md (✅ Done)
- [ ] Test all DTOs against actual database
