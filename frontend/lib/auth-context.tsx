"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { User } from "./types";
import { setAccessToken as setApiAccessToken } from "./api-client";

interface Session {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  user: User;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (
    username: string,
    password: string,
    role?: "admin" | "employee" | "operator",
  ) => Promise<boolean>;
  logout: () => void;
  refreshAccessToken: () => Promise<boolean>;
  getAuthHeaders: () => Record<string, string> | undefined;
  hasSession: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:9003";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("auth_session");
      if (stored) {
        const parsedSession = JSON.parse(stored);
        const expiresAt = parsedSession.expiresIn
          ? new Date(parsedSession.expiresIn).getTime()
          : null;
        const isValid = !expiresAt || expiresAt > Date.now();

        if (isValid) {
          setSession(parsedSession);
          setApiAccessToken(parsedSession.accessToken);
          console.log("Session restored for user:", parsedSession.user?.name);
        } else {
          console.log("Session expired, clearing");
          localStorage.removeItem("auth_session");
          setApiAccessToken(null);
        }
      }
    } catch (error) {
      console.error("Failed to restore session", error);
      localStorage.removeItem("auth_session");
      setApiAccessToken(null);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (session) {
      localStorage.setItem("auth_session", JSON.stringify(session));
      setApiAccessToken(session.accessToken);
      console.log("Session saved for user:", session.user?.name);
    } else {
      localStorage.removeItem("auth_session");
      setApiAccessToken(null);
      console.log("Session cleared from storage");
    }
  }, [session]);

  const login = async (
    username: string,
    password: string,
    role: "admin" | "employee" | "operator" = "employee",
  ): Promise<boolean> => {
    console.log("=== LOGIN ATTEMPT START ===");
    console.log("Clearing existing session before login");
    setSession(null);
    localStorage.removeItem("auth_session");
    sessionStorage.clear();
    await new Promise((resolve) => setTimeout(resolve, 100));

    const endpoint =
      role === "admin" ? "/auth/admin/login" : "/auth/staff/login";
    const requestBody =
      role === "admin"
        ? { email: username, password }
        : { cidNo: username, password };

    try {
      console.log(
        `Attempting ${role} login with:`,
        role === "admin" ? username : `CID: ${username}`,
      );
      console.log("Request body:", requestBody);
      console.log("API Base URL:", API_BASE);
      console.log("Full endpoint:", `${API_BASE}${endpoint}`);

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log("Login response status:", response.status);
      console.log("Login response status text:", response.statusText);

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error("Failed to parse response as JSON", parseError);
        data = { error: "Invalid JSON response from server" };
      }

      console.log("Login response data:", JSON.stringify(data, null, 2));

      if (!response.ok) {
        console.error(
          "Auth login failed with status",
          response.status,
          ":",
          data,
        );
        return false;
      }

      if (!data?.accessToken || !data?.refreshToken || !data?.user) {
        console.error("Auth login returned invalid session payload", data);
        return false;
      }

      console.log("Raw user data from backend:", data.user);

      const normalizedUser: User = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email || "",
        role: role === "admin" ? "admin" : "employee",
        employeeId: data.user.employeeId || data.user.employee_id,
        employee_id: data.user.employee_id || data.user.employeeId,
        cidNo: data.user.cidNo || data.user.cid_no,
        cid_no: data.user.cid_no || data.user.cidNo,
        contactNumber: data.user.contactNumber || data.user.contact_no,
        contact_no: data.user.contact_no || data.user.contactNumber,
        employmentType: data.user.employmentType || data.user.employment_type,
        employment_type: data.user.employment_type || data.user.employmentType,
        department: data.user.department,
        designation: data.user.designation,
        is_active: data.user.is_active,
        created_at: data.user.created_at,
        last_login_at: data.user.last_login_at,
        address: data.user.address,
      };

      console.log("Normalized user:", {
        id: normalizedUser.id,
        name: normalizedUser.name,
        employee_id: normalizedUser.employee_id,
        cid_no: normalizedUser.cid_no,
        role: normalizedUser.role,
      });

      setSession({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresIn: data.expiresIn,
        tokenType: data.tokenType,
        user: normalizedUser,
      });

      console.log("=== LOGIN SUCCESSFUL ===");
      return true;
    } catch (error) {
      console.error("Login request failed", error);
      return false;
    }
  };

  const logout = useCallback(() => {
    console.log("Logging out, clearing session");
    setSession(null);
    localStorage.removeItem("auth_session");
    setApiAccessToken(null);
    sessionStorage.clear();
  }, []);

  const refreshAccessToken = async (): Promise<boolean> => {
    if (!session?.refreshToken) {
      console.log("No refresh token available");
      return false;
    }

    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken: session.refreshToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Refresh token failed", data);
        logout();
        return false;
      }

      if (!data?.accessToken || !data?.refreshToken) {
        console.error("Refresh token returned invalid payload", data);
        logout();
        return false;
      }

      setSession((current) =>
        current
          ? {
              ...current,
              accessToken: data.accessToken,
              refreshToken: data.refreshToken,
              expiresIn: data.expiresIn,
              tokenType: data.tokenType,
            }
          : null,
      );

      return true;
    } catch (error) {
      console.error("Refresh request failed", error);
      logout();
      return false;
    }
  };

  const getAuthHeaders = useCallback(() => {
    if (!session?.accessToken) {
      return undefined;
    }
    return { Authorization: `Bearer ${session.accessToken}` };
  }, [session?.accessToken]);

  const user = session?.user ?? null;
  const hasSession = Boolean(session);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        refreshAccessToken,
        getAuthHeaders,
        hasSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
