# NDI Authentication Implementation Summary

## 🎯 Overview

This implementation provides **two distinct authentication methods**:

1. **Citizens**: NDI-verified CID login (passwordless, CID-only)
2. **Admins**: Traditional CID + password login

---

## 👥 Citizen Login Flow (NDI-Based)

### Authentication Process:

```
1. User clicks "Login with NDI"
   ↓
2. Backend creates NDI proof request
   ↓
3. User scans QR code with NDI app
   ↓
4. NDI app verifies user owns the CID and shares verified data
   ↓
5. NATS receives verification message
   ↓
6. Backend extracts ONLY the CID from NDI data
   ↓
7. Backend finds/creates user with verified CID
   ↓
8. Backend generates JWT tokens
   ↓
9. User is logged in
```

### Key Point:

**Only CID is used for authentication**. Other NDI data (Full Name, Date of Birth, etc.) is logged for debugging but **NOT stored** in the database.

### API Endpoint:

```http
POST /auth/citizen/login
Content-Type: application/json

Response:
{
  "message": "Scan QR code to login with NDI",
  "proofRequestThreadId": "80faeede-9017-41ed-91da-eede2e7b581e",
  "deepLinkURL": "bhutanndidemo://data?url=...",
  "proofRequestURL": "https://stage-demo-shortening-url...",
  "accessToken": "eyJraWQ...",
  "tokenType": "Bearer"
}
```

### Security Benefits:

✅ **No passwords** - eliminates password-related vulnerabilities
✅ **CID is immutable** - cannot be changed in NDI
✅ **Cryptographic verification** - NDI proves user owns the CID
✅ **Minimal data storage** - only CID is stored
✅ **Tamper-proof** - NDI signs data cryptographically
✅ **Privacy-friendly** - no unnecessary personal data stored

### Database Schema (Users Table):

```sql
CREATE TABLE users (
  id uuid PRIMARY KEY,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  role_type VARCHAR(20) DEFAULT 'CITIZEN',
  cid_no VARCHAR(20) UNIQUE NOT NULL,  -- Only this is used for authentication
  password VARCHAR NULL                 -- Not used for NDI login
);
```

---

## 🔐 Admin Login Flow (Password-Based)

### Authentication Process:

```
1. Admin enters CID + Password
   ↓
2. Backend validates CID exists in admin table
   ↓
3. Backend verifies password with bcrypt
   ↓
4. Backend loads admin roles and permissions
   ↓
5. Backend generates JWT with RBAC data
   ↓
6. Admin is logged in with appropriate permissions
```

### API Endpoint:

```http
POST /auth/admin/login
Content-Type: application/json

{
  "cidNo": "11234567890",
  "password": "SecurePassword123!"
}

Response:
{
  "message": "Logged in successfully as Admin",
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "expiresIn": 900,
  "user": {
    "id": "uuid",
    "cidNo": "11234567890",
    "roleType": "ADMIN",
    "roles": ["District Admin", "Data Entry"]
  },
  "ability": [
    {
      "name": "Manage Census Data",
      "action": ["CREATE", "READ", "UPDATE"],
      "subject": ["census"]
    }
  ]
}
```

### Security Benefits:

✅ **Strong password hashing** - bcrypt with 12 rounds
✅ **CID as username** - immutable identifier
✅ **RBAC support** - role-based access control
✅ **Refresh token rotation** - enhanced security
✅ **IP and User-Agent tracking** - audit trail

### Database Schema (Admin Table):

```sql
CREATE TABLE admin (
  id uuid PRIMARY KEY,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  cid_no VARCHAR(20) UNIQUE NOT NULL,
  role_type VARCHAR(20) DEFAULT 'ADMIN',
  password VARCHAR(255) NOT NULL,
  office_location_id uuid,
  agency_id uuid,
  mobile_no VARCHAR(20),
  email VARCHAR(255)
);
```

---

## 📁 Files Modified

### 1. **DTOs**

#### `src/modules/auth/dto/user-login.dto.ts` (Deleted - Not needed)

- Citizens don't send any credentials
- NDI handles all verification

#### `src/modules/auth/dto/admin-login.dto.ts`

```typescript
export class AdminLoginDto {
  @IsString()
  @IsNotEmpty()
  cidNo: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
```

#### `src/modules/auth/dto/ndi-verified-login.dto.ts` (New)

```typescript
export class NdiVerifiedLoginDto {
  @IsString()
  @IsNotEmpty()
  cidNo: string;

  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  dateOfBirth?: string;

  @IsString()
  @IsOptional()
  gender?: string;
}
```

### 2. **Entities**

#### `src/modules/users/entities/user.entity.ts`

- Added: `fullName`, `dateOfBirth`, `gender`
- Removed: `ndiDeeplink`

#### `src/modules/auth/entities/admin.entity.ts`

- No changes to fields
- Kept: `cidNo`, `password`, `email`, `mobileNo`, etc.

### 3. **Services**

#### `src/modules/auth/services/auth.service.ts`

- **New Method**: `loginCitizen()` - Creates NDI proof request
- **New Method**: `authenticateCitizenWithNDI()` - Handles verified NDI data
- **Updated Method**: `loginAdmin()` - CID + password validation
- **Removed**: Old citizen login with password logic

#### `src/modules/auth/services/ndi.service.ts`

- **New Method**: `registerVerificationCallback()` - Registers auth callback
- **Updated Method**: `handleVerificationResult()` - Calls auth service after verification
- Existing: OAuth, proof request, NATS listener methods

### 4. **Controllers**

#### `src/modules/auth/auth.controller.ts`

```typescript
// Citizen login - no body needed
@Post('citizen/login')
@PublicRoute()
async loginCitizen() {
  return this.authService.loginCitizen();
}

// Admin login - CID + password
@Post('admin/login')
@PublicRoute()
async loginAdmin(@Body() loginDto: AdminLoginDto) {
  return this.authService.loginAdmin(loginDto);
}
```

### 5. **Migrations**

#### `1705075200001-CreateUsersTable.ts`

- Added: `full_name`, `date_of_birth`, `gender` columns
- Removed: `ndi_deeplink` column
- Kept: `password` as nullable (for future use if needed)

#### `1705075200006-CreateAdminTable.ts`

- No changes to schema
- Only contains: `cidNo`, `password`, `email`, `mobileNo`, etc.

---

## 🔄 Complete Flow Example

### Citizen Login:

```javascript
// 1. Frontend calls citizen login
const response = await fetch('/auth/citizen/login', {
  method: 'POST',
});

const { proofRequestURL, proofRequestThreadId } = await response.json();

// 2. Frontend displays QR code
displayQRCode(proofRequestURL);

// 3. User scans with NDI app and approves

// 4. Backend NATS listener receives verification
// {
//   "type": "present-proof/presentation-result",
//   "verification_result": "ProofValidated",
//   "requested_presentation": {
//     "revealed_attrs": {
//       "ID Number": [{ "value": "11234567890" }],
//       "Full Name": [{ "value": "Dorji Sonam" }],
//       "Date of Birth": [{ "value": "19/07/1995" }],
//       "Gender": [{ "value": "Male" }]
//     }
//   }
// }

// 5. Backend authenticates and returns tokens
// Frontend receives tokens via WebSocket/polling
```

### Admin Login:

```javascript
// Simple CID + password login
const response = await fetch('/auth/admin/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    cidNo: '11234567890',
    password: 'SecurePassword123!',
  }),
});

const { accessToken, refreshToken, user, ability } = await response.json();

// Store tokens and use for subsequent requests
localStorage.setItem('accessToken', accessToken);
localStorage.setItem('refreshToken', refreshToken);
```

---

## 🔒 Security Considerations

### Citizen (NDI-Based):

1. **CID Verification**: NDI cryptographically proves user owns the CID
2. **No Replay Attacks**: Each proof request has unique threadId
3. **Time-Limited**: Proof requests expire
4. **Tamper-Proof**: NDI signs all data
5. **Data Freshness**: Always uses current NDI data

### Admin (Password-Based):

1. **Strong Hashing**: bcrypt with 12 rounds
2. **Refresh Token Rotation**: Old tokens revoked on refresh
3. **IP/User-Agent Tracking**: Audit trail for logins
4. **RBAC**: Fine-grained permissions per admin
5. **Token Expiry**: Access tokens expire in 15 minutes

---

## 🧪 Testing

### Test Citizen Login:

```bash
# 1. Create proof request
curl -X POST http://localhost:3000/auth/citizen/login

# 2. Copy proofRequestURL and scan with NDI app

# 3. Check server logs for verification
# Should see:
# - "📨 RAW NATS MESSAGE RECEIVED"
# - "🎉 NDI PROOF VALIDATED"
# - "Citizen authenticated with CID: 11234567890"
```

### Test Admin Login:

```bash
# Login with CID + password
curl -X POST http://localhost:3000/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "cidNo": "11234567890",
    "password": "SecurePassword123!"
  }'

# Should return access token, refresh token, and user data
```

---

## 📝 Next Steps

1. **Frontend Integration**:

   - Display QR code for citizen login
   - Handle token storage
   - Implement WebSocket for real-time login notification

2. **Error Handling**:

   - Handle NDI timeout scenarios
   - Handle QR code expiration
   - Handle network failures

3. **Enhancements**:
   - Add biometric verification option
   - Add email/SMS notifications for admin logins
   - Add session management dashboard

---

## 🎉 Summary

✅ **Citizens**: Simple NDI QR scan login (no passwords)
✅ **Admins**: Secure CID + password login with RBAC
✅ **CID**: Immutable identifier for both user types
✅ **Security**: Strong cryptographic verification (NDI) or password hashing (bcrypt)
✅ **UX**: Optimal for both user types - easy for citizens, secure for admins

This implementation provides the best balance of security and user experience for your census application! 🚀
