// lib/employee-api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:9003";

export interface EmployeeProfile {
  id: string;
  employee_id: string;
  cid_no: string;
  name: string;
  contact_no: string;
  email: string;
  employment_type: string;
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
  photo?: string | null;
  address?: string;
  designation?: string;
  officeId?: string;
  departmentId?: string;
}

export interface OutingRequest {
  id: string;
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
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  createdAt: string;
}

export interface EmployeeStats {
  attendanceRate: number;
  leaveBalance: number;
  yearsOfService: number;
  approvedOutings: number;
  presentCount: number;
  totalDays: number;
}

export interface UpdateProfileData {
  name?: string;
  email?: string;
  contact_no?: string;
  address?: string;
  designation?: string;
  employmentType?: string;
}

export interface UpdatePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export async function getValidHeaders(
  getAuthHeaders: () => Record<string, string> | undefined,
  refreshAccessToken: () => Promise<boolean>,
  router: any,
): Promise<Record<string, string> | null> {
  let headers = getAuthHeaders();
  if (!headers) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      router.push("/");
      return null;
    }
    headers = getAuthHeaders();
  }
  return headers || null;
}

export async function fetchEmployeeProfile(
  headers: Record<string, string>,
  staffId: string,
): Promise<EmployeeProfile | null> {
  try {
    if (!staffId) {
      console.error("staffId is empty, cannot fetch profile");
      return null;
    }

    console.log("Fetching profile for staffId:", staffId);
    const response = await fetch(`${API_BASE}/staff/${staffId}`, {
      headers,
      credentials: "include",
    });

    if (!response.ok) {
      console.error("Profile fetch failed with status", response.status);
      const errorText = await response.text();
      console.error("Error response:", errorText);
      return null;
    }

    const data = await response.json();

    return {
      id: data.id || "",
      employee_id: data.employee_id || data.employeeId || data.staffId || "",
      cid_no: data.cid_no || data.cidNo || data.cid || "",
      name: data.name || "",
      contact_no: data.contact_no || data.contactNo || data.phone || "",
      email: data.email || "",
      employment_type: data.employment_type || data.employmentType || "regular",
      is_active: data.is_active !== undefined ? data.is_active : true,
      created_at:
        data.created_at ||
        data.createdAt ||
        data.joinDate ||
        new Date().toISOString(),
      last_login_at: data.last_login_at || data.lastLoginAt || null,
      photo: data.photo || null,
      address: data.address || "",
      designation: data.designation || "",
      officeId: data.officeId || "",
      departmentId: data.departmentId || "",
    };
  } catch (error) {
    console.error("Error fetching profile:", error);
    return null;
  }
}

// Update staff profile using the correct endpoint: PATCH /staff/{id}
export async function updateStaffProfile(
  headers: Record<string, string>,
  staffId: string,
  data: UpdateProfileData,
): Promise<{ success: boolean; message?: string }> {
  try {
    // Build the request body matching your backend schema
    const requestBody: any = {};

    // Only include fields that are provided
    if (data.name !== undefined) requestBody.name = data.name;
    if (data.email !== undefined) requestBody.email = data.email;
    if (data.contact_no !== undefined) requestBody.contactNo = data.contact_no;
    if (data.designation !== undefined)
      requestBody.designation = data.designation;
    if (data.employmentType !== undefined)
      requestBody.employmentType = data.employmentType;

    if (Object.keys(requestBody).length === 0) {
      return { success: true, message: "No changes to save" };
    }

    // Use the correct endpoint with staff ID
    const response = await fetch(`${API_BASE}/staff/${staffId}`, {
      method: "PATCH",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      credentials: "include",
    });

    if (response.ok) {
      return { success: true, message: "Profile updated successfully!" };
    }

    const errorText = await response.text();
    console.error("Update failed:", response.status, errorText);
    return {
      success: false,
      message: `Failed to update profile: ${response.status}`,
    };
  } catch (error) {
    console.error("Error updating profile:", error);
    return { success: false, message: "Error updating profile" };
  }
}

// Update staff password using PATCH /staff/{id} with password field
export async function updateStaffPassword(
  headers: Record<string, string>,
  staffId: string,
  data: UpdatePasswordData,
): Promise<{ success: boolean; message?: string }> {
  try {
    // Send password update as PATCH to /staff/{id} with just the password field
    const response = await fetch(`${API_BASE}/staff/${staffId}`, {
      method: "PATCH",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        password: data.newPassword,
      }),
      credentials: "include",
    });

    if (response.ok) {
      return {
        success: true,
        message: "Password updated successfully!",
      };
    }

    const errorText = await response.text();
    console.error("Password update failed:", response.status, errorText);
    return {
      success: false,
      message: "Failed to update password. Please contact admin.",
    };
  } catch (error) {
    console.error("Error updating password:", error);
    return { success: false, message: "Error updating password" };
  }
}

export async function fetchOutingRequests(
  headers: Record<string, string>,
  staffId?: string,
): Promise<OutingRequest[]> {
  return [];
}

export async function fetchLeaveRequests(
  headers: Record<string, string>,
  staffId?: string,
): Promise<LeaveRequest[]> {
  return [];
}

export async function createOutingRequest(
  headers: Record<string, string>,
  data: {
    date: string;
    purpose: "official" | "personal";
    reason: string;
    willReturn: boolean;
    expectedReturnTime: string | null;
  },
): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/attendance/outings`, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      credentials: "include",
    });
    return response.ok;
  } catch (error) {
    console.error("Error creating outing:", error);
    return false;
  }
}

export async function createLeaveRequest(
  headers: Record<string, string>,
  data: {
    startDate: string;
    endDate: string;
    reason: string;
  },
): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/attendance/leaves`, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      credentials: "include",
    });
    return response.ok;
  } catch (error) {
    console.error("Error creating leave:", error);
    return false;
  }
}

export async function markOutingReturn(
  headers: Record<string, string>,
  requestId: string,
  returnTime: string,
): Promise<boolean> {
  try {
    const response = await fetch(
      `${API_BASE}/attendance/outings/${requestId}/return`,
      {
        method: "PATCH",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ returnTime }),
        credentials: "include",
      },
    );
    return response.ok;
  } catch (error) {
    console.error("Error marking return:", error);
    return false;
  }
}

export async function fetchEmployeeStats(
  headers: Record<string, string>,
  staffId?: string,
): Promise<EmployeeStats> {
  return {
    attendanceRate: 0,
    leaveBalance: 18,
    yearsOfService: 0,
    approvedOutings: 0,
    presentCount: 0,
    totalDays: 0,
  };
}

export async function uploadProfilePhoto(
  headers: Record<string, string>,
  staffId: string,
  file: File,
): Promise<boolean> {
  try {
    const formData = new FormData();
    formData.append("photo", file);

    const response = await fetch(`${API_BASE}/staff/${staffId}/photo`, {
      method: "PATCH",
      headers: {
        Authorization: headers["Authorization"] || "",
      },
      body: formData,
      credentials: "include",
    });

    return response.ok;
  } catch (error) {
    console.error("Error uploading photo:", error);
    return false;
  }
}

export async function getProfilePhotoUrl(
  photoFilename: string | null | undefined,
): Promise<string> {
  if (!photoFilename) return "";
  return `${API_BASE}/shared/Image/${encodeURIComponent(photoFilename)}`;
}

export const getCurrentTime24 = (): string => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
};

export const getMinReturnTime = (): string => {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 15);
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
};

export const parseTime = (timeStr: string): number => {
  if (!timeStr) return 0;
  const parts = timeStr.split(":");
  if (parts.length >= 2) {
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  }
  return 0;
};

export const isTimeAfter = (time1: string, time2: string): boolean => {
  if (!time1 || !time2) return false;
  return parseTime(time1) > parseTime(time2);
};

export function createFallbackEmployee(userData: any): EmployeeProfile {
  return {
    id: userData?.id || "",
    employee_id: userData?.employee_id || userData?.employeeId || "N/A",
    cid_no: userData?.cid_no || userData?.cidNo || "N/A",
    name: userData?.name || "Employee",
    contact_no: userData?.contact_no || userData?.contactNo || "",
    email: userData?.email || "",
    employment_type: userData?.employment_type || "regular",
    is_active: true,
    created_at: userData?.created_at || new Date().toISOString(),
    last_login_at: userData?.last_login_at || null,
    photo: userData?.photo || null,
    address: userData?.address || "",
    designation: userData?.designation || "",
    officeId: userData?.officeId || "",
    departmentId: userData?.departmentId || "",
  };
}
