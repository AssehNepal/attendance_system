# Create Admin User - API Example

## Endpoint

```
POST /auth/admin/create
```

## Description

Creates a new admin user with the following features:

- Auto-creates or uses existing office location
- Assigns multiple roles to the admin
- Automatically populates `admin_role` table with admin-role mappings
- Returns all effective permissions from assigned roles (via `role_permission` table)
- Sets `role_type` to 'ADMIN' by default
- Hashes password with bcrypt (12 rounds)

## Request Body

### Option 1: Using Existing Office Location

```json
{
  "cidNo": "22222222222222",
  "password": "SecurePassword@123",
  "email": "admin.thimphu@example.com",
  "mobileNo": "17654321",
  "agencyId": "NSB",
  "officeLocationId": "uuid-of-existing-office",
  "roleIds": ["uuid-of-admin-role", "uuid-of-dzongkhag-admin-role"]
}
```

### Option 2: Creating New Office Location

```json
{
  "cidNo": "33333333333333",
  "password": "AnotherPassword@456",
  "email": "admin.paro@example.com",
  "mobileNo": "17111222",
  "agencyId": "DOT",
  "officeLocationName": "Paro Regional Office",
  "roleIds": ["uuid-of-gewog-admin-role"]
}
```

## Field Descriptions

| Field                | Type   | Required      | Description                           |
| -------------------- | ------ | ------------- | ------------------------------------- |
| `cidNo`              | string | Yes           | Citizen ID Number (11-20 characters)  |
| `password`           | string | Yes           | Admin password (minimum 8 characters) |
| `email`              | string | Yes           | Admin email address                   |
| `mobileNo`           | string | Yes           | Mobile number                         |
| `agencyId`           | string | Yes           | Agency ID (e.g., NSB, DOT)            |
| `officeLocationId`   | UUID   | Conditional\* | Existing office location ID           |
| `officeLocationName` | string | Conditional\* | New office location name              |
| `roleIds`            | UUID[] | Yes           | Array of role IDs to assign           |

\*Note: You must provide EITHER `officeLocationId` OR `officeLocationName` (not both)

## What Happens Internally

1. **Validation**:

   - Checks if CID already exists (throws 409 Conflict if duplicate)
   - Validates all role IDs exist in database
   - Validates office location exists (if using ID)

2. **Office Location**:

   - If `officeLocationId` provided: Uses existing office
   - If `officeLocationName` provided:
     - Checks if office with same name exists
     - Creates new office if doesn't exist
     - Reuses existing office if name matches

3. **Admin Creation**:

   - Hashes password with bcrypt (12 rounds)
   - Creates admin record in `admin` table
   - Sets `role_type` = 'ADMIN' automatically
   - Links to office location via `office_location_id`

4. **Role Assignment** (`admin_role` table):

   - For each role in `roleIds`:
     - Creates entry in `admin_role` table
     - Links `admin_id` to `role_id`
   - Example entries created:
     ```
     admin_role:
     | id   | admin_id | role_id |
     |------|----------|---------|
     | uuid | uuid-A   | uuid-R1 |
     | uuid | uuid-A   | uuid-R2 |
     ```

5. **Permission Lookup**:
   - Queries `role_permission` table for all assigned roles
   - Retrieves unique permissions from all roles
   - Returns aggregated list of effective permissions

## Response

### Success (201 Created)

```json
{
  "message": "Admin user created successfully",
  "admin": {
    "id": "uuid-admin-123",
    "cidNo": "22222222222222",
    "roleType": "ADMIN",
    "email": "admin.thimphu@example.com",
    "mobileNo": "17654321",
    "agencyId": "NSB",
    "officeLocation": {
      "id": "uuid-office-1",
      "name": "Thimphu Regional Office"
    },
    "createdAt": "2026-01-13T12:00:00.000Z",
    "updatedAt": "2026-01-13T12:00:00.000Z"
  },
  "assignedRoles": [
    {
      "id": "uuid-role-1",
      "name": "Admin",
      "description": "System administrator role"
    },
    {
      "id": "uuid-role-2",
      "name": "Dzongkhag Admin",
      "description": "District level administrator"
    }
  ],
  "effectivePermissions": [
    {
      "id": "uuid-perm-1",
      "name": "user_management",
      "description": "Manage system users",
      "actions": ["CREATE", "READ", "UPDATE", "DELETE"],
      "subjects": ["User"]
    },
    {
      "id": "uuid-perm-2",
      "name": "census_data_management",
      "description": "Manage census data",
      "actions": ["READ", "UPDATE"],
      "subjects": ["CensusData"]
    },
    {
      "id": "uuid-perm-3",
      "name": "report_generation",
      "description": "Generate and view reports",
      "actions": ["READ"],
      "subjects": ["Report"]
    }
  ]
}
```

### Error Responses

#### 409 Conflict - Duplicate CID

```json
{
  "statusCode": 409,
  "message": "Admin with CID 22222222222222 already exists",
  "error": "Conflict"
}
```

#### 400 Bad Request - Invalid Role IDs

```json
{
  "statusCode": 400,
  "message": "One or more role IDs are invalid",
  "error": "Bad Request"
}
```

#### 400 Bad Request - Missing Office Location

```json
{
  "statusCode": 400,
  "message": "Either officeLocationId or officeLocationName must be provided",
  "error": "Bad Request"
}
```

#### 404 Not Found - Office Location Not Found

```json
{
  "statusCode": 404,
  "message": "Office location with ID uuid-xyz not found",
  "error": "Not Found"
}
```

## Database Tables Affected

### 1. `admin` table

```sql
INSERT INTO admin (id, cid_no, password, email, mobile_no, agency_id, role_type, office_location_id)
VALUES ('uuid-1', '22222222222222', '$2b$12$...', 'admin@example.com', '17654321', 'NSB', 'ADMIN', 'uuid-office');
```

### 2. `admin_role` table (automatically populated)

```sql
INSERT INTO admin_role (id, admin_id, role_id)
VALUES
  ('uuid-ar-1', 'uuid-admin-1', 'uuid-role-1'),
  ('uuid-ar-2', 'uuid-admin-1', 'uuid-role-2');
```

### 3. `office_location` table (if creating new)

```sql
INSERT INTO office_location (id, name)
VALUES ('uuid-office-1', 'Paro Regional Office');
```

## Example cURL Commands

### Get All Roles First (to get role IDs)

```bash
# You might need an endpoint to list roles - placeholder
curl -X GET http://localhost:5001/auth/roles \
  -H "Content-Type: application/json"
```

### Create Admin with Existing Office

```bash
curl -X POST http://localhost:5001/auth/admin/create \
  -H "Content-Type: application/json" \
  -d '{
    "cidNo": "22222222222222",
    "password": "SecurePassword@123",
    "email": "admin.thimphu@example.com",
    "mobileNo": "17654321",
    "agencyId": "NSB",
    "officeLocationId": "uuid-of-existing-office",
    "roleIds": ["uuid-role-1", "uuid-role-2"]
  }'
```

### Create Admin with New Office

```bash
curl -X POST http://localhost:5001/auth/admin/create \
  -H "Content-Type: application/json" \
  -d '{
    "cidNo": "33333333333333",
    "password": "AnotherPassword@456",
    "email": "admin.paro@example.com",
    "mobileNo": "17111222",
    "agencyId": "DOT",
    "officeLocationName": "Paro Regional Office",
    "roleIds": ["uuid-gewog-admin"]
  }'
```

## Testing in Swagger

1. Navigate to: http://localhost:5001/documentation
2. Find the `POST /auth/admin/create` endpoint under "auth" tag
3. Click "Try it out"
4. Fill in the request body with sample data
5. Click "Execute"
6. View the response with created admin details

## Permission Flow Diagram

```
Admin Created
    ↓
admin_role entries created (roleIds → admin_id + role_id)
    ↓
Query role_permission table (role_id → permission_id)
    ↓
Load permission details
    ↓
Return effectivePermissions in response
```

## Notes

- **Password Security**: Passwords are hashed with bcrypt (12 rounds) before storage
- **Role Type**: Always set to 'ADMIN' (cannot be CITIZEN)
- **Duplicate Office**: If office name already exists, reuses existing office instead of creating duplicate
- **Unique Permissions**: If multiple roles grant the same permission, it's only returned once
- **Transaction Safety**: All database operations should be wrapped in a transaction (consider adding @Transactional decorator)

## Future Enhancements

1. Add endpoint to list all available roles: `GET /auth/roles`
2. Add endpoint to list all available permissions: `GET /auth/permissions`
3. Add endpoint to list all office locations: `GET /auth/office-locations`
4. Add authentication guard (only Super Admin can create admins)
5. Add transaction rollback if any step fails
