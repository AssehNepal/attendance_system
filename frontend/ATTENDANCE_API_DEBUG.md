# Attendance API Debugging Guide

## 🔍 What I've Done

I've added comprehensive debugging and fallback mechanisms to help diagnose your 404 error:

### 1. **Enhanced API Request Logging** (`lib/api-client.ts`)
- Logs every request with method, URL, and auth status
- Logs detailed error information including 404 errors
- Shows full error messages from the backend

### 2. **Improved Attendance Service** (`lib/services/attendanceApi.ts`)
- Validates date format (must be YYYY-MM-DD)
- Tries 4 different endpoint variations:
  1. `GET /attendance/daily-summary/{date}` (primary)
  2. `GET /api/attendance/daily-summary/{date}` (with /api prefix)
  3. `POST /attendance/daily-summary` (POST instead of GET)
  4. `GET /v1/attendance/daily-summary/{date}` (versioned endpoint)
- Provides detailed error messages if all fail

### 3. **Debug Utilities** (`lib/debug-attendance.ts`)
- Functions you can run in the browser console to test endpoints
- Tests all 4 endpoint variations
- Lists available endpoints to discover correct paths

---

## 🛠️ How to Debug

### Step 1: Open Browser Developer Console
- Right-click → Inspect → Console tab
- OR press `F12` and click Console

### Step 2: Import and Run Debug Function
Copy this into the console:

```javascript
// First, import the debug module (this works if you're in a Next.js page)
// Then run:
import { testAttendanceEndpoint, listAvailableEndpoints, getDiagnostics } from '@/lib/debug-attendance';

// Get your current settings
console.log(getDiagnostics());

// Test the attendance endpoint
await testAttendanceEndpoint('2026-05-18');

// Or test with a department
await testAttendanceEndpoint('2026-05-18', 'dept-123');

// List all available endpoints to discover the correct one
await listAvailableEndpoints();
```

### Step 3: Check the Console Output
The debugging functions will show:
- ✅ Which endpoint worked (if any)
- ❌ Which endpoints failed and why
- Status codes and error messages
- Suggestions for fixing the issue

---

## 🐛 Common Issues and Solutions

### Issue 1: **404 Not Found**
**Likely causes:**
- Endpoint path doesn't match your backend
- Backend doesn't have this endpoint implemented
- Date format is wrong (should be YYYY-MM-DD)

**Solution:**
Run `await listAvailableEndpoints()` to find what endpoints exist, then update the endpoint path in `lib/services/attendanceApi.ts`

### Issue 2: **401 Unauthorized**
**Likely causes:**
- No access token
- Token expired
- Token format wrong

**Solution:**
- Make sure you're logged in
- Check `getDiagnostics()` to see if token exists
- Clear browser cache and log in again

### Issue 3: **CORS Error**
**Likely causes:**
- Backend CORS not configured for http://localhost:3000
- Origin mismatch

**Solution:**
- Check backend CORS configuration
- Verify `API_BASE` in `lib/api-client.ts` is correct

---

## 📝 What to Check on Your Backend

1. **Endpoint exists:**
   ```
   Is there a route for GET /attendance/daily-summary/{date}?
   Or is it POST /attendance/daily-summary?
   Or is it /api/attendance/daily-summary/{date}?
   ```

2. **Date parameter format:**
   ```
   Does backend expect YYYY-MM-DD?
   Or DD-MM-YYYY?
   Or as a query parameter instead of path param?
   ```

3. **HTTP method:**
   ```
   Is it GET or POST?
   Does it require specific headers?
   ```

4. **Authentication:**
   ```
   Does the route require Bearer token?
   Or cookies?
   Or both?
   ```

5. **Backend logs:**
   ```
   Check if request even reaches the backend
   Look for 404 errors in backend logs
   Check for any middleware errors
   ```

---

## 📊 Console Output Examples

### When endpoint works:
```
✅ SUCCESS! Response: {
  date: "2026-05-18",
  isHoliday: false,
  staff: [...],
  presentCount: 45,
  absentCount: 3
}
```

### When endpoint returns 404:
```
❌ FAILED (404)
Response body: {"message":"Not Found","error":"Route /attendance/daily-summary/2026-05-18 not found"}

Check your backend for the correct endpoint path.
```

---

## 🚀 Quick Fix Steps

1. **Open browser console** (F12)
2. **Run the test function:**
   ```javascript
   import { testAttendanceEndpoint } from '@/lib/debug-attendance';
   await testAttendanceEndpoint('2026-05-18');
   ```
3. **Check output** for which endpoint works
4. **Update** the working endpoint path in your code
5. **Verify** by checking the Network tab for successful requests

---

## 📱 How to Monitor in Network Tab

1. Open DevTools (F12)
2. Click "Network" tab
3. Reload the page or trigger the attendance load
4. Look for `/attendance/daily-summary/...` requests
5. Click on the request to see:
   - **Headers:** Authorization, Content-Type, etc.
   - **Response:** What the server returned
   - **Status:** 200, 404, 401, etc.

---

## 🔗 Reference: Updated Code

### Enhanced API Client Logging
- Location: `lib/api-client.ts`
- Logs all requests/responses with full details
- Special handling for 404 errors

### Improved Attendance Service
- Location: `lib/services/attendanceApi.ts`
- Tries multiple endpoint variations
- Provides helpful error messages

### Debug Utilities
- Location: `lib/debug-attendance.ts`
- Run tests directly in browser console
- Discover available endpoints
- Get diagnostic information

---

## ❓ Still Stuck?

1. Check backend logs for 404 errors
2. Verify the exact endpoint path on your backend
3. Test with curl or Postman:
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        http://localhost:9001/attendance/daily-summary/2026-05-18
   ```
4. Share the backend error message from browser console

Good luck! 🎯
