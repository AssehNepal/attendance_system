# SUPER_ADMIN Quick Reference

## 🚀 Quick Start

```bash
npm run create-superadmin
```

## 📋 Required Information

| Field                  | Format       | Example               | Required    |
| ---------------------- | ------------ | --------------------- | ----------- |
| **CID**                | 11 digits    | `12345678901`         | ✅ Yes      |
| **Password**           | Min 11 chars | `SuperSecure123!`     | ✅ Yes      |
| **Office Location ID** | UUID v4      | `017bbad6-...`        | ✅ Yes      |
| **Agency ID**          | UUID v4      | `123e4567-...`        | ✅ Yes      |
| **Email**              | Valid email  | `admin@census.gov.bt` | ❌ Optional |
| **Mobile**             | +975XXXXXXXX | `+97517123456`        | ❌ Optional |

## 📊 Get Required UUIDs

### Office Location

```sql
SELECT id, name FROM office_location LIMIT 5;
```

### Agency

```sql
SELECT id, name, code FROM agency LIMIT 5;
```

## ✅ Verification

### Check SUPER_ADMIN exists

```sql
SELECT id, cid_no, role_type, created_at
FROM admin
WHERE role_type = 'SUPER_ADMIN';
```

### Login Test

```bash
POST /auth/login/admin

{
  "cidNo": "12345678901",
  "password": "SuperSecure123!"
}
```

## 🎯 SUPER_ADMIN Powers

- ✅ Full system access (no restrictions)
- ✅ Bypass all permission checks
- ✅ Create/manage any user or admin
- ✅ Create other SUPER_ADMIN users
- ✅ Manage roles and permissions

## ⚠️ Important Notes

1. **Only create 1-2 SUPER_ADMIN accounts**
2. **Use strong passwords (min 11 characters)**
3. **Store credentials securely**
4. **Monitor SUPER_ADMIN activity in audit logs**
5. **Change password every 90 days**

## 🐛 Common Issues

| Error                      | Solution                             |
| -------------------------- | ------------------------------------ |
| Database connection failed | Check `.env` and database status     |
| Office Location not found  | Create office location first         |
| Agency not found           | Create agency first                  |
| CID already exists         | Use different CID or update existing |
| SUPER_ADMIN already exists | Choose to create another or cancel   |

## 📁 Files Updated

- ✅ `scripts/create-superadmin.ts` - Main script
- ✅ `src/constants/role-type.ts` - Added SUPER_ADMIN enum
- ✅ `package.json` - Added `create-superadmin` command
- ✅ `docs/SUPERADMIN_CREATION_GUIDE.md` - Full documentation

## 🔐 Security Features

- ✅ Password hashed with bcrypt (12 rounds = 4,096 iterations)
- ✅ Duplicate detection
- ✅ Foreign key validation
- ✅ Input validation (CID, UUID, email, mobile)
- ✅ Never stores plain text passwords
