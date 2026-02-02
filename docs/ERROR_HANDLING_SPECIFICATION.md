# Error Handling Specification - All Modules

This document defines the error handling standards for all modules in the Census Auth Service.

## HTTP Status Code Standards

| Status Code | Exception                      | Use Case                                          |
| ----------- | ------------------------------ | ------------------------------------------------- |
| **200**     | -                              | Successful GET/PATCH                              |
| **201**     | -                              | Successful POST                                   |
| **204**     | -                              | Successful DELETE                                 |
| **400**     | `BadRequestException`          | Invalid format/structure, business rule violation |
| **401**     | `UnauthorizedException`        | Not authenticated, invalid credentials            |
| **403**     | `ForbiddenException`           | Not authorized, insufficient permissions          |
| **404**     | `NotFoundException`            | Resource not found                                |
| **409**     | `ConflictException`            | Duplicate resource, unique constraint violation   |
| **500**     | `InternalServerErrorException` | Server error                                      |

---

## 1. Auth Module (Login/Authentication)

### Admin Login

**Endpoint:** `POST /auth/admin/login`

#### Status Code Mapping

| Validation Type         | Status Code | Error Type   | When It Occurs                   |
| ----------------------- | ----------- | ------------ | -------------------------------- |
| **CID Format**          | 400         | Bad Request  | CID format is invalid            |
| **CID Required**        | 400         | Bad Request  | CID is missing                   |
| **Password Required**   | 400         | Bad Request  | Password is missing              |
| **Invalid Credentials** | 401         | Unauthorized | CID or password is incorrect     |
| **Admin Not Found**     | 401         | Unauthorized | Admin account doesn't exist      |
| **Account Locked**      | 403         | Forbidden    | Admin account is locked/disabled |

**Implementation:**

```typescript
// DTO Level (400)
- @IsString() for cidNo
- @IsNotEmpty() for cidNo
- @IsString() for password
- @IsNotEmpty() for password

// Service Level
- 401: Invalid username/password combination
- 401: Admin not found
- 403: Account is locked or disabled
```

---

### User Login

**Endpoint:** `POST /auth/user/login`

#### Status Code Mapping

| Validation Type         | Status Code | Error Type   | When It Occurs                   |
| ----------------------- | ----------- | ------------ | -------------------------------- |
| **CID Format**          | 400         | Bad Request  | CID format is invalid            |
| **CID Length**          | 400         | Bad Request  | CID not between 11-20 characters |
| **CID Required**        | 400         | Bad Request  | CID is missing                   |
| **Invalid Credentials** | 401         | Unauthorized | CID or password is incorrect     |
| **User Not Found**      | 401         | Unauthorized | User account doesn't exist       |
| **Account Locked**      | 403         | Forbidden    | User account is locked/disabled  |
| **NDI Auth Failed**     | 401         | Unauthorized | NDI authentication failed        |

**Implementation:**

```typescript
// DTO Level (400)
- @IsString() for cidNo
- @MinLength(11) for cidNo
- @MaxLength(20) for cidNo
- @IsNotEmpty() for cidNo
- @IsOptional() for password
- @IsOptional() for ndiDeeplink

// Service Level
- 401: Invalid credentials
- 401: User not found
- 403: Account locked/disabled
- 401: NDI authentication failed
```

---

## 2. Admin Module

### Create Admin

**Endpoint:** `POST /admin`

#### Status Code Mapping

| Validation Type            | Status Code | Error Type  | When It Occurs                     |
| -------------------------- | ----------- | ----------- | ---------------------------------- |
| **CID Format**             | 400         | Bad Request | CID is not exactly 11 digits       |
| **CID Uniqueness**         | 409         | Conflict    | Admin with same CID exists         |
| **Password Length**        | 400         | Bad Request | Password less than 11 chars        |
| **Office Location Format** | 400         | Bad Request | Not a valid UUID                   |
| **Office Location Exists** | 404         | Not Found   | UUID valid but doesn't exist in DB |
| **Agency Format**          | 400         | Bad Request | Not a valid UUID                   |
| **Agency Exists**          | 404         | Not Found   | UUID valid but doesn't exist in DB |
| **Email Format**           | 400         | Bad Request | Invalid email format               |
| **Mobile Format**          | 400         | Bad Request | Doesn't match +975XXXXXXXX         |

**Implementation:**

```typescript
// DTO Level (400)
- @Matches(/^\d{11}$/) for cidNo
- @MinLength(11) for password
- @IsUUID('4') for officeLocationId
- @IsUUID('4') for agencyId
- @IsEmail() for email
- @Matches(/^\+975\d{8}$/) for mobileNo

// Service Level
- 409: CID already exists
- 404: Office location not found
- 404: Agency not found
```

---

### Update Admin

**Endpoint:** `PATCH /admin/:id`

#### Status Code Mapping

| Validation Type     | Status Code | Error Type  | When It Occurs                     |
| ------------------- | ----------- | ----------- | ---------------------------------- |
| **Admin ID Format** | 400         | Bad Request | Not a valid UUID                   |
| **Admin Not Found** | 404         | Not Found   | Admin with ID doesn't exist        |
| **CID Format**      | 400         | Bad Request | CID is not exactly 11 digits       |
| **CID Uniqueness**  | 409         | Conflict    | Another admin with same CID exists |
| **Email Format**    | 400         | Bad Request | Invalid email format               |
| **Mobile Format**   | 400         | Bad Request | Doesn't match +975XXXXXXXX         |

---

### Get Admin by ID

**Endpoint:** `GET /admin/:id`

#### Status Code Mapping

| Validation Type     | Status Code | Error Type  | When It Occurs                              |
| ------------------- | ----------- | ----------- | ------------------------------------------- |
| **Admin ID Format** | 400         | Bad Request | Not a valid UUID (handled by ParseUUIDPipe) |
| **Admin Not Found** | 404         | Not Found   | Admin with ID doesn't exist                 |

---

### Delete Admin

**Endpoint:** `DELETE /admin/:id`

#### Status Code Mapping

| Validation Type        | Status Code | Error Type  | When It Occurs                   |
| ---------------------- | ----------- | ----------- | -------------------------------- |
| **Admin ID Format**    | 400         | Bad Request | Not a valid UUID                 |
| **Admin Not Found**    | 404         | Not Found   | Admin with ID doesn't exist      |
| **Cannot Delete Self** | 403         | Forbidden   | Attempting to delete own account |
| **Has Dependencies**   | 409         | Conflict    | Admin has assigned roles/data    |

---

## 3. Users Module

### Create User

**Endpoint:** `POST /users`

#### Status Code Mapping

| Validation Type      | Status Code | Error Type  | When It Occurs                           |
| -------------------- | ----------- | ----------- | ---------------------------------------- |
| **CID Format**       | 400         | Bad Request | CID format is invalid                    |
| **CID Required**     | 400         | Bad Request | CID is missing                           |
| **CID Uniqueness**   | 409         | Conflict    | User with same CID exists                |
| **Password Length**  | 400         | Bad Request | Password less than 8 chars (if provided) |
| **Email Format**     | 400         | Bad Request | Invalid email format                     |
| **Email Uniqueness** | 409         | Conflict    | Email already exists                     |
| **Mobile Format**    | 400         | Bad Request | Doesn't match +975XXXXXXXX               |

**Implementation:**

```typescript
// DTO Level (400)
- @IsString() for cidNo
- @IsNotEmpty() for cidNo
- @Matches(/^\d{11}$/) for cidNo (if strict format needed)
- @IsOptional() for password
- @MinLength(8) for password
- @IsOptional() for email
- @IsEmail() for email
- @IsOptional() for mobileNo
- @Matches(/^\+975\d{8}$/) for mobileNo

// Service Level
- 409: CID already exists
- 409: Email already exists
```

---

### Update User

**Endpoint:** `PATCH /users/:id`

#### Status Code Mapping

| Validation Type      | Status Code | Error Type  | When It Occurs                      |
| -------------------- | ----------- | ----------- | ----------------------------------- |
| **User ID Format**   | 400         | Bad Request | Not a valid UUID                    |
| **User Not Found**   | 404         | Not Found   | User with ID doesn't exist          |
| **Email Format**     | 400         | Bad Request | Invalid email format                |
| **Email Uniqueness** | 409         | Conflict    | Another user with same email exists |
| **Mobile Format**    | 400         | Bad Request | Doesn't match +975XXXXXXXX          |

---

## 4. Agency Module

### Create Agency

**Endpoint:** `POST /agency`

#### Status Code Mapping

| Validation Type     | Status Code | Error Type  | When It Occurs               |
| ------------------- | ----------- | ----------- | ---------------------------- |
| **Name Required**   | 400         | Bad Request | Name is missing              |
| **Name Length**     | 400         | Bad Request | Name too short or too long   |
| **Name Uniqueness** | 409         | Conflict    | Agency with same name exists |
| **Code Required**   | 400         | Bad Request | Code is missing              |
| **Code Format**     | 400         | Bad Request | Code format is invalid       |
| **Code Uniqueness** | 409         | Conflict    | Agency with same code exists |

**Implementation:**

```typescript
// DTO Level (400)
- @IsString() for name
- @IsNotEmpty() for name
- @MinLength(3) for name
- @MaxLength(255) for name
- @IsString() for code
- @IsNotEmpty() for code
- @MinLength(2) for code
- @MaxLength(50) for code
- @Matches(/^[A-Z0-9_]+$/) for code (uppercase, numbers, underscores only)

// Service Level
- 409: Agency name already exists
- 409: Agency code already exists
```

---

### Update Agency

**Endpoint:** `PATCH /agency/:id`

#### Status Code Mapping

| Validation Type      | Status Code | Error Type  | When It Occurs                       |
| -------------------- | ----------- | ----------- | ------------------------------------ |
| **Agency ID Format** | 400         | Bad Request | Not a valid UUID                     |
| **Agency Not Found** | 404         | Not Found   | Agency with ID doesn't exist         |
| **Name Uniqueness**  | 409         | Conflict    | Another agency with same name exists |
| **Code Uniqueness**  | 409         | Conflict    | Another agency with same code exists |

---

## 5. Office Location Module

**⚠️ Database Schema Note:** Office location table ONLY contains `id`, `name`, `created_at`, and `updated_at`. NO agency_id or address fields!

### Create Office Location

**Endpoint:** `POST /office-location`

#### Status Code Mapping

| Validation Type     | Status Code | Error Type  | When It Occurs                           |
| ------------------- | ----------- | ----------- | ---------------------------------------- |
| **Name Required**   | 400         | Bad Request | Name is missing                          |
| **Name Length**     | 400         | Bad Request | Name too short (< 3) or too long (> 255) |
| **Name Uniqueness** | 409         | Conflict    | Office location with same name exists    |

**Implementation:**

```typescript
// DTO Level (400)
- @IsString() for name
- @IsNotEmpty() for name
- @MinLength(3) for name
- @MaxLength(255) for name

// Service Level
- 409: Office location name already exists (recommended)
```

**Note:** Office location is a simple table with only a name field. Admins reference office locations via `office_location_id` in the admin table.

---

### Update Office Location

**Endpoint:** `PATCH /office-location/:id`

#### Status Code Mapping

| Validation Type      | Status Code | Error Type  | When It Occurs                           |
| -------------------- | ----------- | ----------- | ---------------------------------------- |
| **Office ID Format** | 400         | Bad Request | Not a valid UUID                         |
| **Office Not Found** | 404         | Not Found   | Office location with ID doesn't exist    |
| **Name Length**      | 400         | Bad Request | Name too short (< 3) or too long (> 255) |
| **Name Uniqueness**  | 409         | Conflict    | Another office with same name exists     |

---

## 6. Roles Module

### Create Role

**Endpoint:** `POST /roles`

#### Status Code Mapping

| Validation Type        | Status Code | Error Type  | When It Occurs             |
| ---------------------- | ----------- | ----------- | -------------------------- |
| **Name Required**      | 400         | Bad Request | Name is missing            |
| **Name Length**        | 400         | Bad Request | Name too short or too long |
| **Name Uniqueness**    | 409         | Conflict    | Role with same name exists |
| **Description Length** | 400         | Bad Request | Description too long       |

**Implementation:**

```typescript
// DTO Level (400)
- @IsString() for name
- @IsNotEmpty() for name
- @MinLength(3) for name
- @MaxLength(100) for name
- @IsOptional() for description
- @IsString() for description
- @MaxLength(500) for description

// Service Level
- 409: Role name already exists
```

---

### Update Role

**Endpoint:** `PATCH /roles/:id`

#### Status Code Mapping

| Validation Type     | Status Code | Error Type  | When It Occurs                     |
| ------------------- | ----------- | ----------- | ---------------------------------- |
| **Role ID Format**  | 400         | Bad Request | Not a valid UUID                   |
| **Role Not Found**  | 404         | Not Found   | Role with ID doesn't exist         |
| **Name Uniqueness** | 409         | Conflict    | Another role with same name exists |

---

### Assign Permission to Role

**Endpoint:** `POST /roles/:id/permissions`

#### Status Code Mapping

| Validation Type          | Status Code | Error Type  | When It Occurs                      |
| ------------------------ | ----------- | ----------- | ----------------------------------- |
| **Role ID Format**       | 400         | Bad Request | Not a valid UUID                    |
| **Permission ID Format** | 400         | Bad Request | Not a valid UUID                    |
| **Role Not Found**       | 404         | Not Found   | Role with ID doesn't exist          |
| **Permission Not Found** | 404         | Not Found   | Permission with ID doesn't exist    |
| **Already Assigned**     | 409         | Conflict    | Permission already assigned to role |

**Implementation:**

```typescript
// DTO Level (400)
- @IsUUID('4') for permissionId
- @IsNotEmpty() for permissionId

// Service Level
- 404: Role not found
- 404: Permission not found
- 409: Permission already assigned to this role
```

---

## 7. Permissions Module

### Create Permission

**Endpoint:** `POST /permissions`

#### Status Code Mapping

| Validation Type       | Status Code | Error Type  | When It Occurs                   |
| --------------------- | ----------- | ----------- | -------------------------------- |
| **Name Required**     | 400         | Bad Request | Name is missing                  |
| **Name Length**       | 400         | Bad Request | Name too short or too long       |
| **Name Uniqueness**   | 409         | Conflict    | Permission with same name exists |
| **Actions Required**  | 400         | Bad Request | Actions array is missing         |
| **Actions Empty**     | 400         | Bad Request | Actions array is empty           |
| **Subjects Required** | 400         | Bad Request | Subjects array is missing        |
| **Subjects Empty**    | 400         | Bad Request | Subjects array is empty          |

**Implementation:**

```typescript
// DTO Level (400)
- @IsString() for name
- @IsNotEmpty() for name
- @MinLength(3) for name
- @MaxLength(100) for name
- @IsArray() for actions
- @ArrayNotEmpty() for actions
- @IsString({ each: true }) for actions
- @IsArray() for subjects
- @ArrayNotEmpty() for subjects
- @IsString({ each: true }) for subjects
- @IsOptional() for description
- @IsString() for description

// Service Level
- 409: Permission name already exists
```

---

### Update Permission

**Endpoint:** `PATCH /permissions/:id`

#### Status Code Mapping

| Validation Type          | Status Code | Error Type  | When It Occurs                           |
| ------------------------ | ----------- | ----------- | ---------------------------------------- |
| **Permission ID Format** | 400         | Bad Request | Not a valid UUID                         |
| **Permission Not Found** | 404         | Not Found   | Permission with ID doesn't exist         |
| **Name Uniqueness**      | 409         | Conflict    | Another permission with same name exists |

---

## 8. Admin Role Module

### Assign Role to Admin

**Endpoint:** `POST /admin-role`

#### Status Code Mapping

| Validation Type       | Status Code | Error Type  | When It Occurs                 |
| --------------------- | ----------- | ----------- | ------------------------------ |
| **Admin ID Format**   | 400         | Bad Request | Not a valid UUID               |
| **Admin ID Required** | 400         | Bad Request | Admin ID is missing            |
| **Role ID Format**    | 400         | Bad Request | Not a valid UUID               |
| **Role ID Required**  | 400         | Bad Request | Role ID is missing             |
| **Admin Not Found**   | 404         | Not Found   | Admin with ID doesn't exist    |
| **Role Not Found**    | 404         | Not Found   | Role with ID doesn't exist     |
| **Already Assigned**  | 409         | Conflict    | Role already assigned to admin |

**Implementation:**

```typescript
// DTO Level (400)
- @IsUUID('4') for adminId
- @IsNotEmpty() for adminId
- @IsUUID('4') for roleId
- @IsNotEmpty() for roleId

// Service Level
- 404: Admin not found
- 404: Role not found
- 409: Role already assigned to this admin
```

---

### Remove Role from Admin

**Endpoint:** `DELETE /admin/:adminId/roles/:roleId`

#### Status Code Mapping

| Validation Type          | Status Code | Error Type  | When It Occurs                     |
| ------------------------ | ----------- | ----------- | ---------------------------------- |
| **Admin ID Format**      | 400         | Bad Request | Not a valid UUID                   |
| **Role ID Format**       | 400         | Bad Request | Not a valid UUID                   |
| **Admin Not Found**      | 404         | Not Found   | Admin with ID doesn't exist        |
| **Role Not Found**       | 404         | Not Found   | Role with ID doesn't exist         |
| **Assignment Not Found** | 404         | Not Found   | Role is not assigned to this admin |

---

## 9. Common Patterns Across All Modules

### GET by ID

**Endpoints:** `GET /{module}/:id`

#### Status Code Mapping

| Validation Type        | Status Code | Error Type  | When It Occurs                              |
| ---------------------- | ----------- | ----------- | ------------------------------------------- |
| **ID Format**          | 400         | Bad Request | Not a valid UUID (handled by ParseUUIDPipe) |
| **Resource Not Found** | 404         | Not Found   | Resource with ID doesn't exist              |

---

### DELETE by ID

**Endpoints:** `DELETE /{module}/:id`

#### Status Code Mapping

| Validation Type        | Status Code | Error Type  | When It Occurs                                     |
| ---------------------- | ----------- | ----------- | -------------------------------------------------- |
| **ID Format**          | 400         | Bad Request | Not a valid UUID                                   |
| **Resource Not Found** | 404         | Not Found   | Resource with ID doesn't exist                     |
| **Has Dependencies**   | 409         | Conflict    | Resource has related data that prevents deletion   |
| **Cannot Delete Self** | 403         | Forbidden   | Attempting to delete own record (where applicable) |

---

## Common Validation Patterns

### CID Validation (Bhutan Specific)

```typescript
@Matches(/^\d{2,}$/, { message: 'CID must be exactly 11 digits' })
```

### Mobile Number Validation (Bhutan Specific)

```typescript
@Matches(/^\+975\d{8}$/, { message: 'Mobile number must match format +975XXXXXXXX' })
```

### Email Validation

```typescript
@IsEmail({}, { message: 'Email must be a valid email address' })
```

### UUID Validation

```typescript
@IsUUID('4', { message: '{Field} must be a valid UUID' })
```

### Password Validation

```typescript
@MinLength(8, { message: 'Password must be at least 8 characters long' })
// Or for admin
@MinLength(11, { message: 'Password must be at least 11 characters long' })
```

### String Length Validation

```typescript
@MinLength(3, { message: '{Field} must be at least 3 characters' })
@MaxLength(255, { message: '{Field} cannot exceed 255 characters' })
```

### Required Fields

```typescript
@IsNotEmpty({ message: '{Field} is required' })
```

### Array Validation

```typescript
@IsArray({ message: '{Field} must be an array' })
@ArrayNotEmpty({ message: '{Field} must not be empty' })
@IsString({ each: true, message: 'Each item in {field} must be a string' })
```

---

## Implementation Priority

1. ✅ **Admin Module** (Completed)
2. 🔄 **Auth Module** (Login - High Priority)
3. ⏳ **Users Module** (High Priority)
4. ⏳ **Agency Module**
5. ⏳ **Office Location Module**
6. ⏳ **Roles Module**
7. ⏳ **Permissions Module**
8. ⏳ **Admin Role Module**

---

## Testing Checklist

For each endpoint, test:

- [ ] **400**: Invalid format (wrong type, too short, too long)
- [ ] **401**: Invalid credentials (for auth endpoints)
- [ ] **403**: Forbidden action (insufficient permissions)
- [ ] **404**: Resource not found
- [ ] **409**: Duplicate/conflict
- [ ] **201/200**: Success
- [ ] **204**: Successful deletion

---

## Notes

1. All format validations should be handled at the **DTO level** using class-validator decorators
2. All business logic validations should be handled at the **Service level** using NestJS exceptions
3. Use **ParseUUIDPipe** in controllers for automatic UUID validation on route parameters
4. Always include descriptive error messages that help the client understand what went wrong
5. For authentication endpoints, use **401** for invalid credentials, not **404** or **400**
6. For authorization (permissions), use **403**, not **401**
