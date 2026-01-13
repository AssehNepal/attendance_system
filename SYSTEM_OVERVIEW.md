# Census Authentication Service - System Overview

## Database Schema

### Tables

```sql
-- Citizens (auto-created on first login)
users (
  id UUID PRIMARY KEY,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  role_type VARCHAR(20) DEFAULT 'CITIZEN',
  cid_no VARCHAR(20) UNIQUE NOT NULL,
  password VARCHAR NULL,
  ndi_deeplink TEXT NULL
)

-- Admin users (created by Super Admin only)
admin (
  id UUID PRIMARY KEY,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  cid_no VARCHAR(20) UNIQUE NOT NULL,
  role_type VARCHAR(20) DEFAULT 'ADMIN',
  password VARCHAR(255) NOT NULL,
  office_location_id UUID,
  agency_id VARCHAR(100),
  mobile_no VARCHAR(20),
  email VARCHAR(255)
)

-- Office locations
office_location (
  id UUID PRIMARY KEY,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  name VARCHAR(255) NOT NULL
)

-- Roles (for admin only)
roles (
  id UUID PRIMARY KEY,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT
)

-- Permissions (for admin only)
permissions (
  id UUID PRIMARY KEY,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  actions JSONB NOT NULL,
  subjects JSONB NOT NULL
)

-- Role-Permission junction
role_permission (
  id UUID PRIMARY KEY,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  UNIQUE(role_id, permission_id)
)

-- Admin-Role junction
admin_role (
  id UUID PRIMARY KEY,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  admin_id UUID NOT NULL REFERENCES admin(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  UNIQUE(admin_id, role_id)
)
```

## API Endpoints

### POST /auth/citizen/login

**Citizen Login** - Auto-creates user on first login

**Request Body:**

```json
{
  "cidNo": "11111111111111",
  "password": "optional",
  "ndiDeeplink": "optional"
}
```

**Response:**

```json
{
  "message": "Logged in successfully as Citizen",
  "accessToken": "eyJhbGci...",
  "user": {
    "id": "uuid",
    "cidNo": "11111111111111",
    "roleType": "CITIZEN"
  }
}
```

### POST /auth/admin/login

**Admin/Super Admin Login** - Requires pre-registration

**Request Body:**

```json
{
  "cidNo": "11111111111111",
  "password": "required"
}
```

**Response:**

```json
{
  "message": "Logged in successfully as Admin" | "Logged in successfully as Super Admin",
  "accessToken": "eyJhbGci...",
  "user": {
    "id": "uuid",
    "cidNo": "11111111111111",
    "roleType": "ADMIN",
    "roles": ["Super Admin"]
  }
}
```

## Authentication Flow

### Citizen Login

1. **First Time Login:**

   - User provides CID + password OR CID + NDI deeplink
   - System creates new user record
   - No roles or permissions assigned (citizens don't need them)
   - JWT token issued with `roleType: "CITIZEN"`

2. **Subsequent Login:**
   - User provides CID + password
   - System verifies password
   - If NDI deeplink provided, updates it
   - JWT token issued

### Admin Login

1. **Pre-requisite:** Admin must be registered by Super Admin
2. **Login Process:**
   - Admin provides CID + password
   - System verifies credentials
   - Loads admin's roles and permissions
   - JWT token issued with roles and permissions

## Authorization

### Citizens

- **No roles or permissions needed**
- Citizens only submit data (no approval/verification UI)
- All citizen data stored in `users` table
- JWT payload contains:
  ```json
  {
    "userId": "uuid",
    "cidNo": "11111111111111",
    "roleType": "CITIZEN"
  }
  ```

### Admins

- **Role-Based Access Control (RBAC)**
- Admins have roles (Super Admin, Admin, Dzongkhag Admin, Gewog Admin)
- Each role has permissions
- Permissions defined by:
  - `actions`: ["CREATE", "READ", "UPDATE", "DELETE", "APPROVE"]
  - `subjects`: ["BIRTH", "DEATH", "NAME_CHANGE", etc.]
- JWT payload contains:
  ```json
  {
    "userId": "uuid",
    "cidNo": "11111111111111",
    "roleType": "ADMIN",
    "roles": ["Super Admin"],
    "permissions": [
      {
        "actions": ["CREATE", "READ", "UPDATE", "DELETE"],
        "subjects": ["*"]
      }
    ],
    "officeLocationId": "uuid"
  }
  ```

### Super Admin

- Full access to everything (`subjects: ["*"]`)
- Can perform all CRUD operations on:
  - Roles
  - Permissions
  - Admin users
  - All census data

## Seeded Data

Run `yarn seed` to create:

### Roles

- Super Admin (full access)
- Admin (limited access)
- Dzongkhag Admin (district level)
- Gewog Admin (block level)

### Permissions

- birth_registration
- death_registration
- update_information
- movein_moveout
- relationship_application
- adoption_application
- cid_print_application
- admin_full_access

### Default Super Admin

- CID: `11111111111111`
- Password: `SuperAdmin@123`

## Database Commands

```bash
# Run migration
yarn migration:run

# Revert migration
yarn migration:revert

# Seed database
yarn seed

# Start application
yarn start:dev
```

## Environment Setup

Required environment variables:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=census_db
JWT_PRIVATE_KEY=<your-rsa-private-key>
JWT_PUBLIC_KEY=<your-rsa-public-key>
```

## Security Features

1. **Password Hashing:** bcrypt with 12 rounds
2. **JWT Algorithm:** RS256 (asymmetric)
3. **Token Expiry:** 24 hours
4. **Unique Constraints:** CID numbers for both users and admins
5. **Foreign Key Constraints:** Cascade deletes for cleanup

## Key Design Decisions

1. **No Roles for Citizens:** Citizens don't need role-based access since they only submit data
2. **Separate User Tables:** `users` for citizens, `admin` for admins
3. **Auto-Registration:** Citizens auto-created on first login
4. **Pre-Registration for Admins:** Only Super Admin can create admin users
5. **Dynamic Permissions:** Actions and subjects are dynamic (not enums) for frontend flexibility
6. **Simplified Schema:** Removed audit logs, refresh tokens, and account locking for simplicity
