# Migration Checklist for Existing Modules

This checklist helps you update existing modules to use proper error handling.

## 📋 Quick Reference

| Module          | Status      | Notes                    |
| --------------- | ----------- | ------------------------ |
| Admin           | ✅ Complete | Reference implementation |
| Admin Role      | ⏳ Pending  | -                        |
| Agency          | ⏳ Pending  | -                        |
| Auth            | ⏳ Pending  | -                        |
| Health Checker  | ✅ N/A      | No validation needed     |
| Office Location | ⏳ Pending  | -                        |
| Permissions     | ⏳ Pending  | -                        |
| Role Permission | ⏳ Pending  | -                        |
| Roles           | ⏳ Pending  | -                        |
| Users           | ⏳ Pending  | -                        |

## 🔄 Step-by-Step Migration for Each Module

### Step 1: Update DTOs

For each DTO file (create, update):

```typescript
// Before
import { IsString, IsOptional } from 'class-validator';

export class CreateDto {
  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  email?: string;
}

// After
import { IsString, IsOptional, IsEmail, MinLength, MaxLength, Matches, IsUUID } from 'class-validator';

export class CreateDto {
  @IsString({ message: 'Name must be a string' })
  @MinLength(3, { message: 'Name must be at least 3 characters' })
  @MaxLength(100, { message: 'Name cannot exceed 100 characters' })
  name!: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email?: string;
}
```

### Step 2: Update Service

Remove format validations, keep only business logic:

```typescript
// Before
async create(createDto: CreateDto): Promise<Entity> {
  // ❌ Remove format validations (now in DTO)
  if (!createDto.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createDto.email)) {
    throw new BadRequestException('Invalid email format');
  }

  // ✅ Keep business logic validations
  const existing = await this.repository.findOne({ where: { email: createDto.email } });
  if (existing) {
    throw new ConflictException(`Email already exists`);
  }

  return this.repository.save(this.repository.create(createDto));
}

// After
async create(createDto: CreateDto): Promise<Entity> {
  // ✅ Only business logic validations
  const existing = await this.repository.findOne({ where: { email: createDto.email } });
  if (existing) {
    throw new ConflictException(`Email "${createDto.email}" already exists`);
  }

  return this.repository.save(this.repository.create(createDto));
}
```

### Step 3: Update Controller

Add proper API documentation:

```typescript
// Before
@Post()
@ApiOperation({ summary: 'Create new entity' })
create(@Body() createDto: CreateDto) {
  return this.service.create(createDto);
}

// After
@Post()
@ApiOperation({ summary: 'Create new entity' })
@ApiResponse({ status: 201, description: 'Entity created successfully' })
@ApiResponse({ status: 400, description: 'Bad Request - Invalid format' })
@ApiResponse({ status: 404, description: 'Not Found - Related resource not found' })
@ApiResponse({ status: 409, description: 'Conflict - Duplicate entry' })
create(@Body() createDto: CreateDto) {
  return this.service.create(createDto);
}
```

## 📝 Module-Specific Checklist

### Admin Module ✅ (DONE - Reference Implementation)

- [x] DTOs updated with validation decorators
- [x] Service cleaned up (only business logic)
- [x] Controller documented with API responses

### Admin Role Module

**DTOs to Check:**

- [ ] `create-admin-role.dto.ts`
- [ ] `update-admin-role.dto.ts`

**Common Validations:**

- [ ] `adminId` → `@IsUUID()`
- [ ] `roleId` → `@IsUUID()`

**Business Logic:**

- [ ] Check if admin exists → 404
- [ ] Check if role exists → 404
- [ ] Check if assignment already exists → 409

### Agency Module

**DTOs to Check:**

- [ ] `create-agency.dto.ts`
- [ ] `update-agency.dto.ts`

**Common Validations:**

- [ ] `name` → `@MinLength()`, `@MaxLength()`
- [ ] `code` → `@Matches()` (if specific format)
- [ ] `parentAgencyId` → `@IsUUID()` (if exists)

**Business Logic:**

- [ ] Check if agency name exists → 409
- [ ] Check if agency code exists → 409
- [ ] Check if parent agency exists → 404

### Auth Module

**DTOs to Check:**

- [ ] `login.dto.ts`
- [ ] `register.dto.ts`
- [ ] `reset-password.dto.ts`
- [ ] `change-password.dto.ts`

**Common Validations:**

- [ ] `email` → `@IsEmail()`
- [ ] `password` → `@MinLength(11)`
- [ ] `cidNo` → `@Matches(/^\d{11}$/)`

**Business Logic:**

- [ ] Invalid credentials → 401 (not 400!)
- [ ] Account locked → 403
- [ ] User not found → 404

### Office Location Module

**DTOs to Check:**

- [ ] `create-office-location.dto.ts`
- [ ] `update-office-location.dto.ts`

**Common Validations:**

- [ ] `name` → `@MinLength()`, `@MaxLength()`
- [ ] `address` → `@IsString()`, `@IsOptional()`
- [ ] `agencyId` → `@IsUUID()`

**Business Logic:**

- [ ] Check if office name exists → 409
- [ ] Check if agency exists → 404

### Permissions Module

**DTOs to Check:**

- [ ] `create-permission.dto.ts`
- [ ] `update-permission.dto.ts`

**Common Validations:**

- [ ] `name` → `@MinLength()`, `@MaxLength()`
- [ ] `code` → `@Matches()` (if specific format)

**Business Logic:**

- [ ] Check if permission name exists → 409
- [ ] Check if permission code exists → 409

### Role Permission Module

**DTOs to Check:**

- [ ] `assign-permission.dto.ts`

**Common Validations:**

- [ ] `roleId` → `@IsUUID()`
- [ ] `permissionId` → `@IsUUID()`

**Business Logic:**

- [ ] Check if role exists → 404
- [ ] Check if permission exists → 404
- [ ] Check if assignment exists → 409

### Roles Module

**DTOs to Check:**

- [ ] `create-role.dto.ts`
- [ ] `update-role.dto.ts`

**Common Validations:**

- [ ] `name` → `@MinLength()`, `@MaxLength()`
- [ ] `type` → `@IsEnum(RoleType)`

**Business Logic:**

- [ ] Check if role name exists → 409
- [ ] Check if role type is valid → 400

### Users Module

**DTOs to Check:**

- [ ] `create-user.dto.ts`
- [ ] `update-user.dto.ts`

**Common Validations:**

- [ ] `cidNo` → `@Matches(/^\d{11}$/)`
- [ ] `email` → `@IsEmail()`
- [ ] `mobileNo` → `@Matches(/^\+975\d{8}$/)`
- [ ] `password` → `@MinLength(11)`
- [ ] `officeLocationId` → `@IsUUID()`

**Business Logic:**

- [ ] Check if CID exists → 409
- [ ] Check if email exists → 409
- [ ] Check if office location exists → 404

## 🧪 Testing Each Module After Migration

### 1. Test Format Validation (400)

```bash
# Test with invalid format
curl -X POST http://localhost:3000/{module} \
  -H "Content-Type: application/json" \
  -d '{"field": "invalid-format"}'

# Expected: 400 Bad Request
```

### 2. Test Not Found (404)

```bash
# Test with non-existent UUID
curl -X GET http://localhost:3000/{module}/123e4567-e89b-12d3-a456-426614174000

# Expected: 404 Not Found
```

### 3. Test Conflict (409)

```bash
# Test with duplicate entry
curl -X POST http://localhost:3000/{module} \
  -H "Content-Type: application/json" \
  -d '{"field": "existing-value"}'

# Expected: 409 Conflict
```

### 4. Test Success (201)

```bash
# Test with valid data
curl -X POST http://localhost:3000/{module} \
  -H "Content-Type: application/json" \
  -d '{"field": "valid-value"}'

# Expected: 201 Created
```

## 🎯 Common Patterns

### Pattern 1: UUID Validation

```typescript
// DTO
@IsUUID('4', { message: '{field} must be a valid UUID' })
fieldId!: string;

// Service
const entity = await this.repository.findOne({ where: { id: fieldId } });
if (!entity) {
  throw new NotFoundException(`{Entity} with ID ${fieldId} not found`);
}
```

### Pattern 2: Uniqueness Check

```typescript
// Service
const existing = await this.repository.findOne({ where: { field: value } });
if (existing) {
  throw new ConflictException(`{Entity} with {field} "${value}" already exists`);
}
```

### Pattern 3: Email Validation

```typescript
// DTO
@IsEmail({}, { message: 'Email must be a valid email address' })
email!: string;

// Service
const existing = await this.repository.findOne({ where: { email } });
if (existing) {
  throw new ConflictException(`Email "${email}" is already in use`);
}
```

### Pattern 4: CID Validation (Bhutan specific)

```typescript
// DTO
@Matches(/^\d{11}$/, { message: 'CID must be exactly 11 digits' })
cidNo!: string;

// Service
const existing = await this.repository.findOne({ where: { cidNo } });
if (existing) {
  throw new ConflictException(`User with CID "${cidNo}" already exists`);
}
```

### Pattern 5: Phone Validation (Bhutan specific)

```typescript
// DTO
@Matches(/^\+975\d{8}$/, { message: 'Mobile number must match format +975XXXXXXXX' })
mobileNo!: string;
```

## 📊 Progress Tracking

Update this as you complete each module:

```
Progress: 1/10 modules complete (10%)
[✅] Admin
[⏳] Admin Role
[⏳] Agency
[⏳] Auth
[N/A] Health Checker
[⏳] Office Location
[⏳] Permissions
[⏳] Role Permission
[⏳] Roles
[⏳] Users
```

## ⚠️ Important Notes

1. **Don't break existing APIs**: Test thoroughly before deploying
2. **Update API documentation**: Make sure Swagger docs are up-to-date
3. **Inform frontend team**: Status codes have changed from 422 to 400
4. **Test edge cases**: Empty strings, null values, very long strings
5. **Check database constraints**: Ensure they align with DTO validations

## 🚀 Quick Start

Pick any module and follow these steps:

1. Read the DTO files
2. Add validation decorators
3. Clean up service validations
4. Update controller documentation
5. Test with curl/Postman
6. Mark as complete in checklist
7. Move to next module

Good luck! 🎉
