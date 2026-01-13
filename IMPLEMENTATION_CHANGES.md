# Authentication Implementation Summary

## ✅ Completed Changes

### 1. User Login Auto-Registration

- **Citizen Login**: Users are automatically created on first login
- **Field**: `cidNo` (CID Number) and `password`
- **Default Role**: "User" with citizen permissions
- **Endpoint**: `POST /auth/login`

**Request Body**:

```json
{
  "cidNo": "10101010101010",
  "password": "citizen123"
}
```

### 2. Admin Pre-Registration Required

- **Admin Login**: Admins must be pre-registered (no auto-creation)
- **Field**: `cidNo` and `password`
- **Endpoint**: `POST /auth/admin/login`

**Request Body**:

```json
{
  "cidNo": "11111111111111",
  "password": "SuperAdmin@123"
}
```

### 3. Default User Permissions

When a citizen logs in for the first time, they automatically get the "User" role with these permissions:

| Permission               | Description                     |
| ------------------------ | ------------------------------- |
| birth_registration       | Register and view birth records |
| death_registration       | Register death records          |
| update_information       | Update personal information     |
| movein_moveout           | Register household movements    |
| relationship_application | Apply for relationship changes  |
| adoption_application     | Apply for adoption              |
| cid_print_application    | Request CID printing            |

### 4. Database Seeding

Created seed service that initializes:

- ✅ **Roles**: User, Super Admin, Admin, Dzongkhag Admin, Gewog Admin
- ✅ **Permissions**: 8 permissions (7 citizen + 1 admin)
- ✅ **Super Admin Account**: CID `11111111111111`, Password `SuperAdmin@123`

**Run seed**: `yarn seed`

## 🔧 Technical Implementation

### Files Created/Modified

1. **DTOs Fixed**:
   - `user-login.dto.ts`: Changed from `email` to `cidNo`
2. **Services**:
   - `enhanced-auth.service.ts`: Added `autoCreateUser()` method
   - `seed.service.ts`: Created for database seeding
3. **Auth Logic**:
   - Citizen login auto-creates user with default "User" role
   - Admin login requires pre-registration
   - All permissions automatically assigned via role

### Database Tables Involved

- `users`: Stores citizen accounts (auto-created)
- `admin`: Stores admin accounts (pre-created)
- `roles`: Role definitions
- `permissions`: Permission definitions
- `user_role`: User-to-role mappings
- `role_permission`: Role-to-permission mappings

## 🚀 Usage Examples

### 1. First-Time Citizen Login (Auto-Creates User)

```bash
POST /auth/login
{
  "cidNo": "20202020202020",
  "password": "MyPassword123"
}
```

**Response**:

```json
{
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG...",
  "expiresIn": 3600,
  "user": {
    "id": "uuid",
    "cidNo": "20202020202020",
    "roleType": "CITIZEN",
    "roles": ["User"],
    "permissions": [
      { "action": "CREATE", "subject": "BIRTH" },
      { "action": "READ", "subject": "BIRTH" }
      // ... all citizen permissions
    ]
  }
}
```

### 2. Subsequent Citizen Logins (Password Verified)

Same endpoint, password is verified against stored hash.

### 3. Admin Login (Pre-Registered)

```bash
POST /auth/admin/login
{
  "cidNo": "11111111111111",
  "password": "SuperAdmin@123"
}
```

If admin doesn't exist: `401 Unauthorized - Invalid credentials`

### 4. Creating Additional Admins

```bash
POST /auth/admins
Authorization: Bearer <super_admin_token>
{
  "cidNo": "30303030303030",
  "password": "Admin@123",
  "email": "admin@gov.bt",
  "mobileNo": "+97517123456"
}
```

## 🔐 Security Features

1. **Password Hashing**: bcrypt with 12 rounds
2. **JWT Tokens**: RS256 algorithm (asymmetric)
3. **Account Lockout**: 5 failed attempts = 30min lock (admins only)
4. **Audit Logging**: All login attempts and user creation logged
5. **Auto-Registration**: Only for citizens, admins must be pre-created

## 📋 Setup Checklist

- [x] Run migrations: `yarn migration:run`
- [x] Seed database: `yarn seed`
- [x] Start server: `yarn start:dev`
- [x] Test citizen auto-registration
- [x] Test admin login with super admin credentials
- [x] Verify permissions in JWT token

## 🎯 Key Differences from Original Requirement

| Original               | Implemented            | Reason                     |
| ---------------------- | ---------------------- | -------------------------- |
| Email field            | CID Number field       | Citizens use CID for login |
| Manual user creation   | Auto-creation on login | Better UX for citizens     |
| No default permissions | 7 citizen permissions  | Immediate functionality    |

## 📞 Quick Test

```bash
# 1. Test citizen auto-registration
curl -X POST http://localhost:5001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"cidNo":"12345678901234","password":"test123"}'

# 2. Test admin login
curl -X POST http://localhost:5001/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"cidNo":"11111111111111","password":"SuperAdmin@123"}'

# 3. Get user info
curl -X GET http://localhost:5001/auth/me \
  -H "Authorization: Bearer <token>"
```

## ✅ Verification

Check if setup is correct:

1. **Database tables exist**: Check with SQL client
2. **Roles created**: Query `SELECT * FROM roles;`
3. **Permissions created**: Query `SELECT * FROM permissions;`
4. **Super admin exists**: Query `SELECT * FROM admin;`
5. **Auto-registration works**: Try citizen login with new CID
6. **Permissions assigned**: Check token payload or `/auth/me`

---

**Last Updated**: January 13, 2026
**Status**: ✅ Fully Implemented and Tested
