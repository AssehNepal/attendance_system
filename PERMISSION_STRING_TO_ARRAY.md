# Permission Actions and Subjects - String to Array Conversion

## Issue

TypeScript compilation errors occurred because the `actions` and `subjects` fields in the Permission entity are stored as strings in the database, but the JWT payload and permission system expects them as arrays.

## Root Cause

- **Database Schema**: `actions` and `subjects` are stored as `VARCHAR` (comma-separated strings)
- **JWT Payload**: Expects `actions: string[]` and `subjects: string[]`
- **Mismatch**: Direct assignment from entity to payload caused type errors

## Solution

Updated `getAdminRolesAndPermissions()` method in `auth.service.ts` to convert comma-separated strings to arrays.

### Code Changes

**Before:**

```typescript
permissionsMap.set(key, {
  actions: rp.permission.actions, // string (error!)
  subjects: rp.permission.subjects, // string (error!)
});
```

**After:**

```typescript
// Convert comma-separated strings to arrays
const actionsArray = rp.permission.actions
  .split(',')
  .map((a) => a.trim())
  .filter(Boolean);
const subjectsArray = rp.permission.subjects
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

permissionsMap.set(key, {
  actions: actionsArray, // string[] ✅
  subjects: subjectsArray, // string[] ✅
});
```

## How It Works

### String Splitting

- `.split(',')` - Splits the comma-separated string into an array
- `.map((a) => a.trim())` - Removes whitespace from each item
- `.filter(Boolean)` - Removes empty strings

### Example Transformation

**Input (from database):**

```typescript
actions: 'CREATE, READ, UPDATE, DELETE';
subjects: 'birth Registration, death Registration';
```

**Output (in JWT payload):**

```typescript
actions: ['CREATE', 'READ', 'UPDATE', 'DELETE'];
subjects: ['birth Registration', 'death Registration'];
```

## Database Storage Format

The permissions are stored in the database as comma-separated strings:

```sql
INSERT INTO permissions (name, actions, subjects)
VALUES (
  'manage-birth-registration',
  'CREATE,READ,UPDATE,DELETE',
  'birth Registration'
);
```

## JWT Payload Structure

After conversion, the JWT contains properly typed arrays:

```typescript
{
  userId: "uuid",
  cidNo: "12345678",
  roleType: "ADMIN",
  roles: ["Data Entry Officer", "Verifier"],
  permissions: [
    {
      actions: ["CREATE", "READ", "UPDATE"],
      subjects: ["birth Registration"]
    },
    {
      actions: ["APPROVE"],
      subjects: ["birth Registration", "death Registration"]
    }
  ]
}
```

## Files Modified

1. **auth.service.ts** - `getAdminRolesAndPermissions()` method
   - Added string-to-array conversion logic
   - Applied to both `permissionsMap` and `permissionDetailsMap`

## Files NOT Modified (Intentionally)

1. **permission.entity.ts** - Keeps `actions` and `subjects` as `string`
2. **permission.dto.ts** - Keeps `actions` and `subjects` as `string`
3. **create-permission.dto.ts** - Keeps `actions` and `subjects` as `string`

These files work with the database representation (strings) and should remain unchanged.

## Testing

Verify that:

1. ✅ TypeScript compilation succeeds without errors
2. ✅ Admin login returns proper JWT with array permissions
3. ✅ Permission checking works correctly in guards
4. ✅ Ability array in login response has proper structure

Example login response:

```json
{
  "accessToken": "...",
  "user": {
    "roles": ["Verifier"]
  },
  "ability": [
    {
      "name": "verify-births",
      "action": ["APPROVE"],
      "subject": ["birth Registration"]
    }
  ]
}
```

## Edge Cases Handled

1. **Empty strings** - Filtered out with `.filter(Boolean)`
2. **Whitespace** - Trimmed with `.map((a) => a.trim())`
3. **Single values** - Still converted to array `["value"]`
4. **Multiple values** - Properly split `["value1", "value2"]`

## Future Considerations

If you need to change the database schema to store arrays directly (JSON or array type):

1. Update migration to change column type
2. Update entity definition to use array type
3. Remove the string-to-array conversion in `getAdminRolesAndPermissions()`
4. Update DTOs to accept/return arrays

But for now, the string storage with runtime conversion works perfectly! ✅
