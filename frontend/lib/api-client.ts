// lib/api-client.ts
export const API_BASE =
  process.env.NEXT_PUBLIC_Staff_Attendance_URL || "http://localhost:9003";

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (token) {
    localStorage.setItem("access_token", token);
  } else {
    localStorage.removeItem("access_token");
  }
}

export function getAccessToken(): string | null {
  if (accessToken) return accessToken;
  // Try to get from auth_session (used by auth-context)
  const authSession = localStorage.getItem("auth_session");
  if (authSession) {
    try {
      const session = JSON.parse(authSession);
      if (session?.accessToken) {
        accessToken = session.accessToken;
        return accessToken;
      }
    } catch (e) {
      // If parsing fails, try the old method
    }
  }
  // Fallback to old storage method
  const stored = localStorage.getItem("access_token");
  if (stored) accessToken = stored;
  return accessToken;
}

export function setStoredUser(user: any) {
  if (user) localStorage.setItem("tda_current_user", JSON.stringify(user));
  else localStorage.removeItem("tda_current_user");
}

export function getStoredUser(): any {
  const stored = localStorage.getItem("tda_current_user");
  return stored ? JSON.parse(stored) : null;
}

// lib/api-client.ts (partial)
export async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  const token = getAccessToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const fullUrl = `${API_BASE}${endpoint}`;
  const method = options.method || "GET";

  console.log(`[API Request] ${method} ${fullUrl}`, {
    hasToken: !!token,
    endpoint,
    method,
  });

  const response = await fetch(fullUrl, {
    ...options,
    headers,
    credentials: "include",
  });

  console.log(
    `[API Response] ${method} ${fullUrl} - Status: ${response.status}`,
  );

  if (!response.ok) {
    let errorData: any = {};
    let errorText = "";

    try {
      errorData = await response.json();
    } catch (e) {
      errorText = await response.text();
    }

    const errorMessage =
      errorData?.message ||
      errorText ||
      `Request failed with status ${response.status}`;

    // Log detailed error info for debugging
    if (response.status === 404) {
      console.error(`[API 404 Error] Endpoint not found`, {
        method,
        url: fullUrl,
        endpoint,
        status: response.status,
        errorData,
        errorText,
      });
    } else {
      console.error(`[API Error] ${method} ${fullUrl}`, {
        status: response.status,
        statusText: response.statusText,
        errorData,
        errorText,
      });
    }

    throw new Error(errorMessage);
  }

  // ✅ Handle 204 No Content or empty response
  if (
    response.status === 204 ||
    response.headers.get("content-length") === "0"
  ) {
    return null as T;
  }

  return response.json();
}

// Admin login
export async function adminLogin(email: string, password: string) {
  console.log("Making admin login request to:", `${API_BASE}/auth/admin/login`);
  const data = await request<{
    accessToken: string;
    refreshToken: string;
    user: any;
  }>("/auth/admin/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setAccessToken(data.accessToken);
  setStoredUser(data.user);
  return data;
}

// Staff login – now uses { cid, password }
// Staff login – send cidNo as required by backend
export async function staffLogin(cid: string, password: string) {
  console.log("Making staff login request to:", `${API_BASE}/auth/staff/login`);
  const data = await request<{
    accessToken: string;
    refreshToken: string;
    user: any;
  }>("/auth/staff/login", {
    method: "POST",
    // ✅ Changed from { cid, password } to { cidNo, password }
    body: JSON.stringify({ cidNo: cid, password }),
  });
  setAccessToken(data.accessToken);
  setStoredUser(data.user);
  return data;
}

// Get current user – only from stored user (no /auth/me call)
export async function getCurrentUser() {
  const storedUser = getStoredUser();
  if (storedUser) return storedUser;
  throw new Error("No valid session found");
}

export async function logout() {
  setAccessToken(null);
  setStoredUser(null);
  // Optionally call backend logout if needed
  // await request('/auth/logout', { method: 'POST' }).catch(() => {});
}
