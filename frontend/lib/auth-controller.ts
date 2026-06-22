// lib/auth-controller.ts

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:9003";

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    employee_id?: string;
    cid_no?: string;
    contact_no?: string;
    employment_type?: string;
    department?: string;
    designation?: string;
    is_active?: boolean;
    created_at?: string;
    last_login_at?: string | null;
    address?: string;
  };
}

export interface EmployeeProfile {
  id: string;
  employee_id: string;
  cid_no: string;
  name: string;
  email: string;
  contact_no: string;
  employment_type: string;
  is_active: boolean;
  department?: string;
  designation?: string;
  address?: string;
  created_at?: string;
  last_login_at?: string | null;
}

export interface OutingRequest {
  id: string;
  employee_id: string;
  date: string;
  requestTime: string;
  purpose: "official" | "personal";
  reason: string;
  willReturn: boolean;
  expectedReturnTime: string | null;
  actualReturnTime: string | null;
  status: string;
  createdAt: string;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  createdAt: string;
}

class AuthController {
  private static instance: AuthController;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  private constructor() {}

  static getInstance(): AuthController {
    if (!AuthController.instance) {
      AuthController.instance = new AuthController();
    }
    return AuthController.instance;
  }

  setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
    }
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    }
  }

  getAccessToken(): string | null {
    if (this.accessToken) return this.accessToken;
    if (typeof window !== "undefined") {
      return localStorage.getItem("accessToken");
    }
    return null;
  }

  private getRefreshToken(): string | null {
    if (this.refreshToken) return this.refreshToken;
    if (typeof window !== "undefined") {
      return localStorage.getItem("refreshToken");
    }
    return null;
  }

  private async getValidHeaders(): Promise<HeadersInit> {
    let token = this.getAccessToken();

    if (!token) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        token = this.getAccessToken();
      }
    }

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }

  async login(cidNo: string, password: string): Promise<LoginResponse | null> {
    try {
      console.log("=== LOGIN API CALL ===");
      console.log("CID:", cidNo);

      const response = await fetch(`${API_BASE}/auth/staff/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cidNo, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Login failed:", data);
        return null;
      }

      if (!data?.accessToken || !data?.user) {
        console.error("Invalid login response:", data);
        return null;
      }

      console.log("Login successful for:", data.user.name);

      this.setTokens(data.accessToken, data.refreshToken);

      return data;
    } catch (error) {
      console.error("Login error:", error);
      return null;
    }
  }

  async refreshAccessToken(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();

      if (!response.ok || !data?.accessToken) {
        this.clearTokens();
        return false;
      }

      this.setTokens(data.accessToken, data.refreshToken || refreshToken);
      return true;
    } catch (error) {
      console.error("Refresh token error:", error);
      this.clearTokens();
      return false;
    }
  }

  async getEmployeeProfile(userId: string): Promise<EmployeeProfile | null> {
    try {
      const headers = await this.getValidHeaders();

      console.log("Fetching employee profile...");

      const response = await fetch(
        `${API_BASE}/staff/${userId}?_=${Date.now()}`,
        {
          headers,
          cache: "no-store",
        },
      );

      if (!response.ok) {
        console.error("Failed to fetch profile:", response.status);
        return null;
      }

      const data = await response.json();
      console.log("Profile fetched for:", data.name);
      return data;
    } catch (error) {
      console.error("Get profile error:", error);
      return null;
    }
  }

  async getOutingRequests(): Promise<OutingRequest[]> {
    try {
      const headers = await this.getValidHeaders();

      const response = await fetch(
        `${API_BASE}/attendance/outings/my?_=${Date.now()}`,
        {
          headers,
          cache: "no-store",
        },
      );

      if (!response.ok) {
        console.error("Failed to fetch outings:", response.status);
        return [];
      }

      const data = await response.json();
      return data.sort(
        (a: OutingRequest, b: OutingRequest) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    } catch (error) {
      console.error("Get outings error:", error);
      return [];
    }
  }

  async getLeaveRequests(): Promise<LeaveRequest[]> {
    try {
      const headers = await this.getValidHeaders();

      const response = await fetch(
        `${API_BASE}/attendance/leaves/my?_=${Date.now()}`,
        {
          headers,
          cache: "no-store",
        },
      );

      if (!response.ok) {
        console.error("Failed to fetch leaves:", response.status);
        return [];
      }

      const data = await response.json();
      return data.sort(
        (a: LeaveRequest, b: LeaveRequest) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    } catch (error) {
      console.error("Get leaves error:", error);
      return [];
    }
  }

  async createOutingRequest(data: {
    date: string;
    purpose: "official" | "personal";
    reason: string;
    willReturn: boolean;
    expectedReturnTime: string | null;
  }): Promise<OutingRequest | null> {
    try {
      const headers = await this.getValidHeaders();

      const response = await fetch(`${API_BASE}/attendance/outings`, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Failed to create outing:", error);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error("Create outing error:", error);
      return null;
    }
  }

  async createLeaveRequest(data: {
    startDate: string;
    endDate: string;
    reason: string;
  }): Promise<LeaveRequest | null> {
    try {
      const headers = await this.getValidHeaders();

      const response = await fetch(`${API_BASE}/attendance/leaves`, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Failed to create leave:", error);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error("Create leave error:", error);
      return null;
    }
  }

  async markReturn(outingId: string, returnTime: string): Promise<boolean> {
    try {
      const headers = await this.getValidHeaders();

      const response = await fetch(
        `${API_BASE}/attendance/outings/${outingId}/return`,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify({ returnTime }),
        },
      );

      return response.ok;
    } catch (error) {
      console.error("Mark return error:", error);
      return false;
    }
  }

  async updateProfile(
    userId: string,
    profileData: Partial<EmployeeProfile>,
  ): Promise<boolean> {
    try {
      const headers = await this.getValidHeaders();

      const response = await fetch(`${API_BASE}/staff/${userId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(profileData),
      });

      return response.ok;
    } catch (error) {
      console.error("Update profile error:", error);
      return false;
    }
  }

  async uploadPhoto(userId: string, file: File): Promise<boolean> {
    try {
      const token = this.getAccessToken();
      if (!token) return false;

      const formData = new FormData();
      formData.append("photo", file);

      const response = await fetch(`${API_BASE}/staff/${userId}/photo`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      return response.ok;
    } catch (error) {
      console.error("Upload photo error:", error);
      return false;
    }
  }

  async requestPasswordResetOtp(
    token: string,
  ): Promise<{ message: string } | null> {
    try {
      const response = await fetch(`${API_BASE}/forgot-password/request-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Failed to request OTP:", data);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Request OTP error:", error);
      return null;
    }
  }

  async resetPasswordWithOtp(
    token: string,
    otp: string,
    newPassword: string,
  ): Promise<{ message: string } | null> {
    try {
      const response = await fetch(
        `${API_BASE}/forgot-password/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            otp,
            newPassword,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Failed to reset password:", data);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Reset password error:", error);
      return null;
    }
  }

  logout() {
    this.clearTokens();
    if (typeof window !== "undefined") {
      sessionStorage.clear();
    }
  }
}

export const authController = AuthController.getInstance();
