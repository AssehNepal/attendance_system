# SUPER_ADMIN Creation Guide

## Overview

This guide explains how to create a SUPER_ADMIN user for your authentication system. The SUPER_ADMIN has unrestricted access to all system features and bypasses all permission checks.

---

## Prerequisites

Before creating a SUPER_ADMIN, ensure you have:

1. ✅ **Database running** and accessible
2. ✅ **Environment variables** configured (`.env` file)
3. ✅ **Office Location** created in the database
4. ✅ **Agency** created in the database

---

## Quick Start

### Step 1: Run the Script

```bash
npm run create-superadmin
```

or

```bash
yarn create-superadmin
```

### Step 2: Follow the Interactive Prompts

The script will ask you for the following information:

```
╔════════════════════════════════════════════════════╗
║                                                    ║
║         SUPER ADMIN CREATION SCRIPT               ║
║                                                    ║
╚════════════════════════════════════════════════════╝

📡 Connecting to database...
✅ Database connected!

📝 Enter SUPER_ADMIN details:

Enter CID (exactly 11 digits): 12345678901
Enter Password (min 11 characters): SuperSecurePass123!
Enter Office Location ID (UUID): 017bbad6-2d8d-49d3-9473-f473874cefbc
Enter Agency ID (UUID): 123e4567-e89b-12d3-a456-426614174000
Enter Email (optional, press Enter to skip): superadmin@census.gov.bt
Enter Mobile (+975XXXXXXXX, optional, press Enter to skip): +97517123456

⏳ Creating SUPER_ADMIN...

╔════════════════════════════════════════════════════╗
║                                                    ║
║   ✅ SUPER_ADMIN CREATED SUCCESSFULLY!            ║
║                                                    ║
╚════════════════════════════════════════════════════╝

📋 Admin Details:
   ID: 88d8b748-0162-4550-83e1-c526e7811b3f
   CID: 12345678901
   Role Type: SUPER_ADMIN
   Created At: 2026-01-15T10:30:00.000Z

🎉 You can now login with CID: 12345678901
```

---

## Input Validation

### CID (Citizenship ID)

- **Format**: Exactly 11 digits
- **Example**: `12345678901`
- **Validation**: Must be numeric and unique

### Password

- **Minimum Length**: 11 characters
- **Example**: `SuperSecure123!`
- **Security**: Automatically hashed with bcrypt (12 rounds)

### Office Location ID

- **Format**: Valid UUID v4
- **Example**: `017bbad6-2d8d-49d3-9473-f473874cefbc`
- **Validation**: Must exist in `office_location` table

### Agency ID

- **Format**: Valid UUID v4
- **Example**: `123e4567-e89b-12d3-a456-426614174000`
- **Validation**: Must exist in `agency` table

### Email (Optional)

- **Format**: Valid email address
- **Example**: `superadmin@census.gov.bt`
- **Can be skipped**: Press Enter to skip

### Mobile (Optional)

- **Format**: `+975XXXXXXXX` (Bhutan format)
- **Example**: `+97517123456`
- **Can be skipped**: Press Enter to skip

---

## Getting Required UUIDs

### Get Office Location ID

```sql
-- List all office locations
SELECT id, name FROM office_location;

-- Example output:
-- id                                   | name
-- ------------------------------------ | ---------------------
-- 017bbad6-2d8d-49d3-9473-f473874cefbc | Thimphu District Office
```

### Get Agency ID

```sql
-- List all agencies
SELECT id, name, code FROM agency;

-- Example output:
-- id                                   | name          | code
-- ------------------------------------ | ------------- | ------
-- 123e4567-e89b-12d3-a456-426614174000 | Census Bureau | CENSUS
```

---

## Safety Features

### 1. Duplicate Detection

- ✅ Checks if SUPER_ADMIN already exists
- ✅ Warns you before creating a second one
- ✅ Prevents duplicate CIDs

### 2. Foreign Key Validation

- ✅ Verifies Office Location exists before creation
- ✅ Verifies Agency exists before creation
- ✅ Prevents orphaned records

### 3. Password Security

- ✅ Minimum length enforcement (11 characters)
- ✅ Bcrypt hashing with 12 rounds (4,096 iterations)
- ✅ Never stored in plain text

### 4. Input Validation

- ✅ CID format validation (11 digits)
- ✅ UUID format validation
- ✅ Email format validation
- ✅ Mobile format validation

---

## Troubleshooting

### Error: "Database connection failed"

**Solution**: Check your `.env` file and ensure database is running

```bash
# Verify database is running
psql -U postgres -d auth_db -c "SELECT 1;"
```

### Error: "Office Location not found"

**Solution**: Create an office location first

```sql
INSERT INTO office_location (id, name, created_at, updated_at)
VALUES (
  '017bbad6-2d8d-49d3-9473-f473874cefbc',
  'Thimphu District Office',
  NOW(),
  NOW()
);
```

### Error: "Agency not found"

**Solution**: Create an agency first

```sql
INSERT INTO agency (id, name, code, created_at, updated_at)
VALUES (
  '123e4567-e89b-12d3-a456-426614174000',
  'Census Bureau',
  'CENSUS',
  NOW(),
  NOW()
);
```

### Error: "Admin with CID already exists"

**Solution**: Use a different CID or update the existing admin

```sql
-- Check existing admin
SELECT id, cid_no, role_type FROM admin WHERE cid_no = '12345678901';
```

---

## After Creation

### 1. Login as SUPER_ADMIN

```bash
POST /auth/login/admin
Content-Type: application/json

{
  "cidNo": "12345678901",
  "password": "SuperSecurePass123!"
}
```

**Response**:

```json
{
  "message": "Logged in successfully as Super Admin",
  "accessToken": "eyJhbGciOiJSUzI1NiIsInR5...",
  "user": {
    "id": "88d8b748-0162-4550-83e1-c526e7811b3f",
    "cidNo": "12345678901",
    "roleType": "SUPER_ADMIN",
    "roles": []
  },
  "ability": []
}
```

### 2. SUPER_ADMIN Capabilities

✅ **Full System Access**

- Create/Update/Delete any admin
- Create/Update/Delete any user
- Manage all roles and permissions
- Access all endpoints without permission checks
- Create other SUPER_ADMIN users

✅ **No Permission Restrictions**

- Bypasses all `@Permissions()` guards
- No need for role assignments
- No need for permission assignments

---

## Security Best Practices

### 1. Limit SUPER_ADMIN Accounts

- ⚠️ Create only 1-2 SUPER_ADMIN accounts
- ⚠️ Use strong, unique passwords
- ⚠️ Store credentials securely (password manager)

### 2. Audit SUPER_ADMIN Actions

- 📝 All actions are logged in audit_log table
- 📝 Monitor SUPER_ADMIN login activity
- 📝 Review SUPER_ADMIN changes regularly

### 3. Regular Password Rotation

- 🔄 Change SUPER_ADMIN password every 90 days
- 🔄 Use password manager for strong passwords
- 🔄 Never share SUPER_ADMIN credentials

### 4. Emergency Access

- 💾 Keep SUPER_ADMIN credentials in secure backup
- 💾 Document emergency access procedures
- 💾 Test recovery process regularly

---

## Database Schema

The script creates a record in the `admin` table:

```sql
INSERT INTO admin (
  cid_no,              -- Citizenship ID
  role_type,           -- 'SUPER_ADMIN'
  password,            -- Bcrypt hashed
  office_location_id,  -- FK to office_location
  agency_id,           -- FK to agency
  email,               -- Optional
  mobile_no,           -- Optional
  created_at,          -- Timestamp
  updated_at           -- Timestamp
) VALUES (...);
```

**Note**: SUPER_ADMIN does NOT need entries in:

- `admin_role` table (no role assignments)
- `role_permission` table (bypasses permissions)

---

## Script Source Code

The script is located at: `scripts/create-superadmin.ts`

**Key Features**:

- ✅ Interactive CLI with colored output
- ✅ Real-time validation
- ✅ Database connection management
- ✅ Error handling and rollback
- ✅ Duplicate prevention
- ✅ Foreign key verification

---

## Support

If you encounter issues:

1. Check `.env` configuration
2. Verify database connectivity
3. Ensure prerequisites are met
4. Review error messages carefully
5. Check database logs

For persistent issues, contact the development team.
