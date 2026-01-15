# Password Hashing Fix - Admin Service

## Issue Fixed

Admin passwords were being stored in **plain text** during creation, but the login process was comparing them with bcrypt, causing authentication failures.

## Changes Made

### 1. **Admin Creation** - Hash password before saving

**File**: `src/modules/admin/admin.service.ts`

**Added**:

```typescript
import * as bcrypt from 'bcrypt';

const BCRYPT_ROUNDS = 12;
```

**Updated `create()` method**:

```typescript
// 10. Hash the password before saving
const hashedPassword = await bcrypt.hash(createAdminDto.password, BCRYPT_ROUNDS);

const admin = this.adminRepository.create({
  ...createAdminDto,
  password: hashedPassword,
});
return this.adminRepository.save(admin);
```

### 2. **Admin Update** - Hash password if being changed

**Updated `update()` method**:

```typescript
// Hash password if it's being updated
if (updateAdminDto.password) {
  updateAdminDto.password = await bcrypt.hash(updateAdminDto.password, BCRYPT_ROUNDS);
}

Object.assign(admin, updateAdminDto);
return this.adminRepository.save(admin);
```

## How It Works Now

### Before (❌ Broken)

```
Create Admin:
  Input: password = "MyPassword123"
  Saved: password = "MyPassword123" (plain text)

Login:
  Input: password = "MyPassword123"
  Compare: bcrypt.compare("MyPassword123", "MyPassword123")
  Result: ❌ FAIL (comparing plain with plain using bcrypt)
```

### After (✅ Fixed)

```
Create Admin:
  Input: password = "MyPassword123"
  Hash: bcrypt.hash("MyPassword123", 12)
  Saved: password = "$2b$12$xyz...abc" (hashed)

Login:
  Input: password = "MyPassword123"
  Compare: bcrypt.compare("MyPassword123", "$2b$12$xyz...abc")
  Result: ✅ SUCCESS
```

## Security Best Practices Applied

1. ✅ **Bcrypt rounds**: 12 (industry standard, balances security and performance)
2. ✅ **Hash on create**: Password never stored in plain text
3. ✅ **Hash on update**: Password changes are also hashed
4. ✅ **Consistent with User service**: Same hashing algorithm and rounds as citizen login

## Testing

### Create Admin

```bash
POST /admin
{
  "cidNo": "12345678901",
  "password": "SecurePassword123!",
  "officeLocationId": "uuid-here"
}
```

**Database Result**:

```sql
SELECT password FROM admin WHERE cid_no = '12345678901';
-- Returns: $2b$12$... (hashed, not "SecurePassword123!")
```

### Login Admin

```bash
POST /auth/login/admin
{
  "cidNo": "12345678901",
  "password": "SecurePassword123!"
}
```

**Result**: ✅ Login successful with JWT token

### Update Admin Password

```bash
PATCH /admin/:id
{
  "password": "NewPassword456!"
}
```

**Database Result**: Password is re-hashed with new value

## Migration Note

⚠️ **Existing admins with plain text passwords will NOT be able to login** after this fix is deployed.

**Solution**: Reset passwords for existing admins:

```bash
# Option 1: Update via API (will auto-hash)
PATCH /admin/:id
{
  "password": "NewSecurePassword123!"
}

# Option 2: Direct database update
UPDATE admin
SET password = crypt('NewPassword123', gen_salt('bf', 12))
WHERE id = 'admin-uuid';
```

Or create a migration script to hash all existing plain text passwords.
