# API Testing Examples

Complete examples for testing all endpoints using curl, Postman, or any HTTP client.

---

## 1. Office Locations

### Create Office Location
```bash
POST /office-locations
Content-Type: application/json

{
  "name": "Thimphu District Office"
}
```

### Get All Office Locations (Paginated)
```bash
GET /office-locations?page=1&take=10&order=ASC
```

### Filter Office Locations
```bash
GET /office-locations/search/filter?name=Thimphu
```

### Get Office Location by ID
```bash
GET /office-locations/550e8400-e29b-41d4-a716-446655440000
```

### Update Office Location
```bash
PATCH /office-locations/550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json

{
  "name": "Updated Thimphu District Office"
}
```

### Delete Office Location
```bash
DELETE /office-locations/550e8400-e29b-41d4-a716-446655440000
```

---

## 2. Agencies

### Create Agency
```bash
POST /agencies
Content-Type: application/json

{
  "name": "Department of Immigration",
  "code": "DOI",
  "description": "Handles immigration and census data collection"
}
```

### Get All Agencies
```bash
GET /agencies?page=1&take=10
```

### Filter Agencies
```bash
GET /agencies/search/filter?code=DOI
GET /agencies/search/filter?name=Immigration
```

### Get Agency by ID
```bash
GET /agencies/550e8400-e29b-41d4-a716-446655440001
```

### Update Agency
```bash
PATCH /agencies/550e8400-e29b-41d4-a716-446655440001
Content-Type: application/json

{
  "description": "Updated description"
}
```

---

## 3. Permissions

### Create Permission
```bash
POST /permissions
Content-Type: application/json

{
  "name": "manage-users",
  "description": "Can create, read, update and delete users",
  "actions": ["create", "read", "update", "delete"],
  "subjects": ["User", "Citizen"]
}
```

### Create Multiple Permissions
```bash
# Data Entry Permission
POST /permissions
{
  "name": "enter-census-data",
  "description": "Can enter census data",
  "actions": ["create", "read", "update"],
  "subjects": ["CensusData"]
}

# View Reports Permission
POST /permissions
{
  "name": "view-reports",
  "description": "Can view census reports",
  "actions": ["read"],
  "subjects": ["Report", "Dashboard"]
}

# Manage Admins Permission
POST /permissions
{
  "name": "manage-admins",
  "description": "Can manage admin users",
  "actions": ["create", "read", "update", "delete"],
  "subjects": ["Admin", "AdminRole"]
}
```

### Get All Permissions
```bash
GET /permissions?page=1&take=20
```

### Filter Permissions by Action
```bash
GET /permissions/search/filter?action=create
```

### Filter Permissions by Subject
```bash
GET /permissions/search/filter?subject=User
```

### Get Permission by ID
```bash
GET /permissions/550e8400-e29b-41d4-a716-446655440002
```

---

## 4. Roles

### Create Role
```bash
POST /roles
Content-Type: application/json

{
  "name": "Data Entry Operator",
  "description": "Can enter and modify census data"
}
```

### Create Multiple Roles
```bash
# Super Admin Role
POST /roles
{
  "name": "Super Admin",
  "description": "Full system access"
}

# Data Viewer Role
POST /roles
{
  "name": "Data Viewer",
  "description": "Can only view data and reports"
}

# Field Officer Role
POST /roles
{
  "name": "Field Officer",
  "description": "Can collect and enter field data"
}
```

### Assign Permission to Role
```bash
POST /roles/550e8400-e29b-41d4-a716-446655440003/assign-permission
Content-Type: application/json

{
  "permissionId": "550e8400-e29b-41d4-a716-446655440002"
}
```

### Remove Permission from Role
```bash
DELETE /roles/550e8400-e29b-41d4-a716-446655440003/remove-permission/550e8400-e29b-41d4-a716-446655440002
```

### Get All Roles
```bash
GET /roles?page=1&take=10
```

### Filter Roles
```bash
GET /roles/search/filter?name=Admin
GET /roles/search/filter?hasPermissions=true
```

### Get Role by ID (with Permissions)
```bash
GET /roles/550e8400-e29b-41d4-a716-446655440003
```

---

## 5. Users (Citizens)

### Create User
```bash
POST /users
Content-Type: application/json

{
  "cidNo": "11234567890123",
  "password": "SecurePassword@123"
}
```

### Create User without Password (NDI Auth)
```bash
POST /users
Content-Type: application/json

{
  "cidNo": "11987654321098",
  "ndiDeeplink": "https://ndi.example.com/auth/..."
}
```

### Get All Users
```bash
GET /users?page=1&take=20&order=DESC
```

### Search Users by CID
```bash
GET /users?cidNo=112345
```

### Filter Users
```bash
GET /users/search/filter?cidNo=112
GET /users/search/filter?hasPassword=true
GET /users/search/filter?roleType=CITIZEN
```

### Get User by ID
```bash
GET /users/550e8400-e29b-41d4-a716-446655440004
```

### Update User
```bash
PATCH /users/550e8400-e29b-41d4-a716-446655440004
Content-Type: application/json

{
  "password": "NewPassword@456"
}
```

### Delete User
```bash
DELETE /users/550e8400-e29b-41d4-a716-446655440004
```

---

## 6. Admin

### Create Admin
```bash
POST /admin
Content-Type: application/json

{
  "cidNo": "11234567890124",
  "password": "AdminPass@123",
  "email": "admin@census.gov.bt",
  "mobileNo": "17123456",
  "officeLocationId": "550e8400-e29b-41d4-a716-446655440000",
  "agencyId": "550e8400-e29b-41d4-a716-446655440001"
}
```

### Create Admin without Office/Agency
```bash
POST /admin
Content-Type: application/json

{
  "cidNo": "11234567890125",
  "password": "AdminPass@123",
  "email": "admin2@census.gov.bt"
}
```

### Get All Admins
```bash
GET /admin?page=1&take=10
```

### Filter Admins by Office Location
```bash
GET /admin?officeLocationId=550e8400-e29b-41d4-a716-446655440000
```

### Filter Admins by Agency
```bash
GET /admin?agencyId=550e8400-e29b-41d4-a716-446655440001
```

### Advanced Filter
```bash
GET /admin/search/filter?cidNo=112
GET /admin/search/filter?email=admin@census
GET /admin/search/filter?mobileNo=171
```

### Get Admin by ID (with Relations)
```bash
GET /admin/550e8400-e29b-41d4-a716-446655440005
# Returns admin with office location, agency, and roles
```

### Update Admin
```bash
PATCH /admin/550e8400-e29b-41d4-a716-446655440005
Content-Type: application/json

{
  "email": "newemail@census.gov.bt",
  "mobileNo": "17654321"
}
```

### Assign Role to Admin
```bash
POST /admin/550e8400-e29b-41d4-a716-446655440005/assign-role
Content-Type: application/json

{
  "roleId": "550e8400-e29b-41d4-a716-446655440003"
}
```

### Assign Multiple Roles
```bash
# Assign first role
POST /admin/550e8400-e29b-41d4-a716-446655440005/assign-role
{
  "roleId": "role-uuid-1"
}

# Assign second role
POST /admin/550e8400-e29b-41d4-a716-446655440005/assign-role
{
  "roleId": "role-uuid-2"
}
```

### Remove Role from Admin
```bash
DELETE /admin/550e8400-e29b-41d4-a716-446655440005/remove-role/550e8400-e29b-41d4-a716-446655440003
```

### Delete Admin
```bash
DELETE /admin/550e8400-e29b-41d4-a716-446655440005
```

---

## Complete Workflow Example

### Step 1: Setup Basic Data
```bash
# 1. Create Office Location
POST /office-locations
{
  "name": "Thimphu District Office"
}
# Response: { "id": "office-uuid-1", "name": "Thimphu District Office", ... }

# 2. Create Agency
POST /agencies
{
  "name": "Department of Immigration",
  "code": "DOI"
}
# Response: { "id": "agency-uuid-1", "name": "Department of Immigration", ... }
```

### Step 2: Create Permissions
```bash
# Create permissions
POST /permissions
{
  "name": "manage-users",
  "actions": ["create", "read", "update", "delete"],
  "subjects": ["User"]
}
# Response: { "id": "permission-uuid-1", ... }

POST /permissions
{
  "name": "enter-data",
  "actions": ["create", "read", "update"],
  "subjects": ["CensusData"]
}
# Response: { "id": "permission-uuid-2", ... }
```

### Step 3: Create Roles
```bash
# Create Super Admin role
POST /roles
{
  "name": "Super Admin",
  "description": "Full system access"
}
# Response: { "id": "role-uuid-1", ... }

# Create Data Entry role
POST /roles
{
  "name": "Data Entry Operator",
  "description": "Can enter census data"
}
# Response: { "id": "role-uuid-2", ... }
```

### Step 4: Assign Permissions to Roles
```bash
# Assign all permissions to Super Admin
POST /roles/role-uuid-1/assign-permission
{
  "permissionId": "permission-uuid-1"
}

POST /roles/role-uuid-1/assign-permission
{
  "permissionId": "permission-uuid-2"
}

# Assign data entry permission to Data Entry role
POST /roles/role-uuid-2/assign-permission
{
  "permissionId": "permission-uuid-2"
}
```

### Step 5: Create Admin Users
```bash
# Create Super Admin user
POST /admin
{
  "cidNo": "11234567890123",
  "password": "SuperAdmin@123",
  "email": "superadmin@census.gov.bt",
  "mobileNo": "17123456",
  "officeLocationId": "office-uuid-1",
  "agencyId": "agency-uuid-1"
}
# Response: { "id": "admin-uuid-1", ... }

# Create Data Entry admin
POST /admin
{
  "cidNo": "11234567890124",
  "password": "DataEntry@123",
  "email": "dataentry@census.gov.bt",
  "officeLocationId": "office-uuid-1",
  "agencyId": "agency-uuid-1"
}
# Response: { "id": "admin-uuid-2", ... }
```

### Step 6: Assign Roles to Admins
```bash
# Assign Super Admin role
POST /admin/admin-uuid-1/assign-role
{
  "roleId": "role-uuid-1"
}

# Assign Data Entry role
POST /admin/admin-uuid-2/assign-role
{
  "roleId": "role-uuid-2"
}
```

### Step 7: Create Citizens
```bash
# Create citizen user
POST /users
{
  "cidNo": "11987654321098",
  "password": "Citizen@123"
}
# Response: { "id": "user-uuid-1", ... }
```

### Step 8: Verify Everything
```bash
# Get admin with all relations
GET /admin/admin-uuid-1
# Response includes: office location, agency, roles, and permissions

# Get role with permissions
GET /roles/role-uuid-1
# Response includes: all assigned permissions

# List all admins
GET /admin?page=1&take=10

# Filter admins by office
GET /admin/search/filter?officeLocationId=office-uuid-1
```

---

## Pagination Examples

### Default Pagination
```bash
GET /users
# Returns first 10 items, ASC order
```

### Custom Page Size
```bash
GET /users?take=50
# Returns 50 items per page
```

### Navigate Pages
```bash
GET /users?page=1&take=20  # First page
GET /users?page=2&take=20  # Second page
GET /users?page=3&take=20  # Third page
```

### Descending Order
```bash
GET /users?order=DESC
# Newest items first
```

### Combined Parameters
```bash
GET /admin?page=1&take=25&order=DESC&cidNo=112
# Page 1, 25 items, DESC order, filtered by CID
```

---

## Response Examples

### Successful Create (201)
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "createdAt": "2026-01-14T10:30:00.000Z",
  "updatedAt": "2026-01-14T10:30:00.000Z",
  "name": "Thimphu District Office"
}
```

### Paginated Response (200)
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "cidNo": "11234567890123",
      "email": "admin@example.com"
    }
  ],
  "meta": {
    "page": 1,
    "take": 10,
    "itemCount": 1,
    "pageCount": 1,
    "hasPreviousPage": false,
    "hasNextPage": false
  }
}
```

### Not Found (404)
```json
{
  "statusCode": 404,
  "message": "Admin with ID \"550e8400-e29b-41d4-a716-446655440999\" not found",
  "error": "Not Found"
}
```

### Conflict (409)
```json
{
  "statusCode": 409,
  "message": "Admin with CID \"11234567890123\" already exists",
  "error": "Conflict"
}
```

### Validation Error (400)
```json
{
  "statusCode": 400,
  "message": [
    "cidNo should not be empty",
    "password must be longer than or equal to 8 characters"
  ],
  "error": "Bad Request"
}
```

---

## cURL Examples

### Create Admin
```bash
curl -X POST http://localhost:3000/admin \
  -H "Content-Type: application/json" \
  -d '{
    "cidNo": "11234567890123",
    "password": "Admin@123",
    "email": "admin@census.gov.bt"
  }'
```

### Get All Admins
```bash
curl -X GET "http://localhost:3000/admin?page=1&take=10"
```

### Assign Role to Admin
```bash
curl -X POST http://localhost:3000/admin/550e8400-e29b-41d4-a716-446655440005/assign-role \
  -H "Content-Type: application/json" \
  -d '{
    "roleId": "550e8400-e29b-41d4-a716-446655440003"
  }'
```

### Delete Admin
```bash
curl -X DELETE http://localhost:3000/admin/550e8400-e29b-41d4-a716-446655440005
```

---

## Testing Checklist

- [ ] Create office location
- [ ] Create agency
- [ ] Create permissions (at least 3)
- [ ] Create roles (at least 2)
- [ ] Assign permissions to roles
- [ ] Create admin users
- [ ] Assign roles to admins
- [ ] Create citizen users
- [ ] Test pagination on all endpoints
- [ ] Test filtering on all endpoints
- [ ] Test update operations
- [ ] Test delete operations
- [ ] Test error scenarios (404, 409, 400)
- [ ] Verify relations are loaded correctly
- [ ] Test removing roles from admins
- [ ] Test removing permissions from roles

---

**Tip:** Use Swagger UI at `http://localhost:3000/api/docs` for interactive testing!
