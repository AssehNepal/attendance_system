# DTO Issues and Database Schema Corrections

## ❌ Issues Found Based on Migration File

### 1. Office Location Module - INCORRECT in Previous Spec

**Database Schema (from migration):**

```sql
"office_location" (
  "id" uuid,
  "created_at" TIMESTAMP,
  "updated_at" TIMESTAMP,
  "name" character varying(255) NOT NULL
)
```

**✅ CORRECT Fields:**

- `id` (auto-generated)
- `created_at` (auto-generated)
- `updated_at` (auto-generated)
- `name` (required, string, max 255 chars)

**❌ NO agency_id field in office_location table!**

**DTO Should Be:**

```typescript
// create-office-location.dto.ts
export class CreateOfficeLocationDto {
  @ApiProperty({ example: 'Thimphu District Office' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(255)
  name!: string;
}
```

---

### 2. Agency Module - Verify DTO

**Database Schema:**

```sql
"agency" (
  "id" uuid,
  "created_at" TIMESTAMP,
  "updated_at" TIMESTAMP,
  "name" character varying(255) NOT NULL,
  "code" character varying(50) NOT NULL,
  CONSTRAINT "UQ_agency_code" UNIQUE ("code")
)
```

**✅ CORRECT Fields:**

- `name` (required, unique constraint recommended, max 255)
- `code` (required, unique, max 50)

**Current DTO Status:** ✅ Correct (already has name and code only)

---

### 3. Users Module - Verify DTO

**Database Schema:**

```sql
"users" (
  "id" uuid,
  "created_at" TIMESTAMP,
  "updated_at" TIMESTAMP,
  "role_type" character varying(20) DEFAULT 'CITIZEN',
  "cid_no" character varying(20) UNIQUE NOT NULL,
  "password" character varying (nullable),
  "ndi_deeplink" text (nullable)
)
```

**✅ CORRECT Fields:**

- `cidNo` (required, unique, max 20 chars)
- `password` (optional, no max length specified in DB)
- `ndiDeeplink` (optional, text)
- `roleType` (defaults to 'CITIZEN', might not be in DTO)

**⚠️ Current DTO Issue:**

```typescript
// Current CreateUserDto
export class CreateUserDto {
  cidNo!: string; // ✅ Correct
  password?: string; // ✅ Correct (optional)
  ndiDeeplink?: string; // ✅ Correct (optional)
}
```

**Needs validation decorators!**

---

### 4. Admin Module - Verify Against DB

**Database Schema:**

```sql
"admin" (
  "id" uuid,
  "created_at" TIMESTAMP,
  "updated_at" TIMESTAMP,
  "cid_no" character varying(20) UNIQUE NOT NULL,
  "role_type" character varying(20) DEFAULT 'ADMIN',
  "password" character varying(255) NOT NULL,
  "office_location_id" uuid (nullable),
  "agency_id" uuid (nullable),
  "mobile_no" character varying(20) (nullable),
  "email" character varying(255) (nullable),
  "ndi_deeplink" character varying(255) (nullable)
)
```

**✅ Admin DTO is CORRECT** - matches DB schema perfectly

---

### 5. Roles Module - Verify DTO

**Database Schema:**

```sql
"roles" (
  "id" uuid,
  "created_at" TIMESTAMP,
  "updated_at" TIMESTAMP,
  "name" character varying(100) NOT NULL,
  "description" text (nullable),
  CONSTRAINT "UQ_roles_name" UNIQUE ("name")
)
```

**✅ CORRECT Fields:**

- `name` (required, unique, max 100)
- `description` (optional, text - no limit)

**Current DTO Status:** ✅ Correct

---

### 6. Permissions Module - Verify DTO

**Database Schema:**

```sql
"permissions" (
  "id" uuid,
  "created_at" TIMESTAMP,
  "updated_at" TIMESTAMP,
  "name" character varying(100) NOT NULL,
  "description" text (nullable),
  "actions" jsonb NOT NULL,
  "subjects" jsonb NOT NULL,
  CONSTRAINT "UQ_permissions_name" UNIQUE ("name")
)
```

**✅ CORRECT Fields:**

- `name` (required, unique, max 100)
- `description` (optional, text)
- `actions` (required, array - stored as jsonb)
- `subjects` (required, array - stored as jsonb)

**Current DTO Status:** ✅ Correct

---

### 7. Admin Role Module - Verify DTO

**Database Schema:**

```sql
"admin_role" (
  "id" uuid,
  "created_at" TIMESTAMP,
  "updated_at" TIMESTAMP,
  "admin_id" uuid NOT NULL,
  "role_id" uuid NOT NULL,
  CONSTRAINT "UQ_admin_role" UNIQUE ("admin_id", "role_id")
)
```

**✅ CORRECT Fields:**

- `adminId` (required, UUID)
- `roleId` (required, UUID)
- Unique constraint on combination

**Current DTO Status:** ✅ Correct

---

### 8. Role Permission Module - Verify

**Database Schema:**

```sql
"role_permission" (
  "id" uuid,
  "created_at" TIMESTAMP,
  "updated_at" TIMESTAMP,
  "role_id" uuid NOT NULL,
  "permission_id" uuid NOT NULL,
  CONSTRAINT "UQ_role_permission" UNIQUE ("role_id", "permission_id")
)
```

**✅ CORRECT Fields:**

- `roleId` (required, UUID)
- `permissionId` (required, UUID)
- Unique constraint on combination

---

## 🔧 Required DTO Fixes

### 1. ❌ CreateOfficeLocationDto - REMOVE Agency References

**Current (WRONG):**

```typescript
export class CreateOfficeLocationDto {
  name!: string;
  agencyId?: string; // ❌ This field doesn't exist in DB!
  address?: string; // ❌ This field doesn't exist in DB!
}
```

**Should Be (CORRECT):**

```typescript
export class CreateOfficeLocationDto {
  @ApiProperty({ example: 'Thimphu District Office', description: 'Office location name' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Name must be at least 3 characters' })
  @MaxLength(255, { message: 'Name cannot exceed 255 characters' })
  name!: string;
}
```

### 2. ⚠️ CreateUserDto - ADD Validations

**Current (Incomplete):**

```typescript
export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  cidNo!: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  ndiDeeplink?: string;
}
```

**Should Be (Complete):**

```typescript
export class CreateUserDto {
  @ApiProperty({ example: '11234567890', description: 'CID Number (11-20 chars)' })
  @IsString()
  @IsNotEmpty()
  @MinLength(11, { message: 'CID must be at least 11 characters' })
  @MaxLength(20, { message: 'CID cannot exceed 20 characters' })
  cidNo!: string;

  @ApiPropertyOptional({ example: 'Password@123', description: 'User password' })
  @IsString()
  @IsOptional()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password?: string;

  @ApiPropertyOptional({ description: 'NDI Deeplink URL' })
  @IsString()
  @IsOptional()
  ndiDeeplink?: string;
}
```

### 3. ⚠️ CreateAgencyDto - ADD Validations

**Current (Incomplete):**

```typescript
export class CreateAgencyDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  code!: string;
}
```

**Should Be (Complete):**

```typescript
export class CreateAgencyDto {
  @ApiProperty({ example: 'Department of Immigration', description: 'Agency name' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Name must be at least 3 characters' })
  @MaxLength(255, { message: 'Name cannot exceed 255 characters' })
  name!: string;

  @ApiProperty({ example: 'DOI', description: 'Agency code (uppercase, numbers, underscores)' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'Code must be at least 2 characters' })
  @MaxLength(50, { message: 'Code cannot exceed 50 characters' })
  @Matches(/^[A-Z0-9_]+$/, {
    message: 'Code must contain only uppercase letters, numbers, and underscores',
  })
  code!: string;
}
```

### 4. ⚠️ CreateRoleDto - ADD Validations

**Current (Incomplete):**

```typescript
export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;
}
```

**Should Be (Complete):**

```typescript
export class CreateRoleDto {
  @ApiProperty({ example: 'Data Entry Operator', description: 'Role name' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Name must be at least 3 characters' })
  @MaxLength(100, { message: 'Name cannot exceed 100 characters' })
  name!: string;

  @ApiPropertyOptional({ example: 'Can enter and modify data', description: 'Role description' })
  @IsString()
  @IsOptional()
  @MaxLength(1000, { message: 'Description cannot exceed 1000 characters' })
  description?: string;
}
```

### 5. ⚠️ CreatePermissionDto - ADD String Array Validation

**Current (Incomplete):**

```typescript
export class CreatePermissionDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsNotEmpty()
  actions!: string[];

  @IsArray()
  @IsNotEmpty()
  subjects!: string[];
}
```

**Should Be (Complete):**

```typescript
export class CreatePermissionDto {
  @ApiProperty({ example: 'manage-users', description: 'Permission name' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Name must be at least 3 characters' })
  @MaxLength(100, { message: 'Name cannot exceed 100 characters' })
  name!: string;

  @ApiPropertyOptional({
    example: 'Can create, read, update and delete users',
    description: 'Permission description',
  })
  @IsString()
  @IsOptional()
  @MaxLength(1000, { message: 'Description cannot exceed 1000 characters' })
  description?: string;

  @ApiProperty({
    example: ['create', 'read', 'update', 'delete'],
    description: 'Allowed actions',
  })
  @IsArray({ message: 'Actions must be an array' })
  @ArrayNotEmpty({ message: 'Actions must not be empty' })
  @IsString({ each: true, message: 'Each action must be a string' })
  actions!: string[];

  @ApiProperty({
    example: ['User', 'Admin'],
    description: 'Subjects the permission applies to',
  })
  @IsArray({ message: 'Subjects must be an array' })
  @ArrayNotEmpty({ message: 'Subjects must not be empty' })
  @IsString({ each: true, message: 'Each subject must be a string' })
  subjects!: string[];
}
```

---

## 📋 Summary of Issues

| Module              | DTO File                        | Issue                                                   | Priority  |
| ------------------- | ------------------------------- | ------------------------------------------------------- | --------- |
| **Office Location** | `create-office-location.dto.ts` | ❌ Remove agencyId & address fields (don't exist in DB) | 🔴 HIGH   |
| **Office Location** | `create-office-location.dto.ts` | ⚠️ Add proper validations (MinLength, MaxLength)        | 🟡 MEDIUM |
| **Users**           | `create-user.dto.ts`            | ⚠️ Add MinLength/MaxLength for cidNo                    | 🟡 MEDIUM |
| **Users**           | `create-user.dto.ts`            | ⚠️ Add MinLength for password                           | 🟡 MEDIUM |
| **Agency**          | `create-agency.dto.ts`          | ⚠️ Add MinLength/MaxLength validations                  | 🟡 MEDIUM |
| **Agency**          | `create-agency.dto.ts`          | ⚠️ Add Matches for code format                          | 🟡 MEDIUM |
| **Roles**           | `create-role.dto.ts`            | ⚠️ Add MinLength/MaxLength validations                  | 🟡 MEDIUM |
| **Permissions**     | `create-permission.dto.ts`      | ⚠️ Add ArrayNotEmpty, length validations                | 🟡 MEDIUM |

---

## ✅ Correct DTOs (No Changes Needed)

- ✅ `create-admin.dto.ts` - Already correct and complete
- ✅ `create-admin-role.dto.ts` - Already correct
- ✅ `assign-permission.dto.ts` - Already correct

---

## 🎯 Action Items

1. **CRITICAL**: Fix `create-office-location.dto.ts` - remove non-existent fields
2. **HIGH**: Add validations to all DTOs as specified above
3. **MEDIUM**: Update error handling specification to match actual DB schema
4. **LOW**: Add missing imports (ArrayNotEmpty, etc.) where needed
