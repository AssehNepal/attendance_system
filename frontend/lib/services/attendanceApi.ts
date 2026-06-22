// lib/services/attendanceApi.ts
import { request } from "../api-client";

export interface AttendanceStaff {
  staff: {
    id: string;
    employeeId: string;
    name: string;
    email: string;
    contactNo: string;
    cidNo: string;
    officeId: string;
    departmentId: string;
    employmentType: string;
    photo?: string;
    isActive: boolean;
  };
  status: "present" | "absent" | "late" | "leave";
}

export interface DailySummary {
  date: string;
  isHoliday: boolean;
  staff: AttendanceStaff[];
  totalStaff?: number;
  presentCount?: number;
  absentCount?: number;
  leaveCount?: number;
  holidayCount?: number;
}

export async function fetchDailySummary(
  date: string,
  departmentId?: string,
): Promise<DailySummary> {
  // Validate and normalize date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    console.error(
      "[Attendance API] Invalid date format. Expected YYYY-MM-DD, got:",
      date,
    );
    throw new Error(`Invalid date format: ${date}. Expected YYYY-MM-DD`);
  }

  const queryParams = new URLSearchParams();
  if (departmentId && departmentId !== "all") {
    queryParams.append("departmentId", departmentId);
  }

  // Primary endpoint
  const primaryUrl = `/attendance/daily-summary/${date}${queryParams.toString() ? `?${queryParams}` : ""}`;

  console.log("[Attendance API] Attempting to fetch daily summary", {
    date,
    departmentId,
    url: primaryUrl,
  });

  try {
    console.log(`[Attendance API] Trying primary endpoint: GET ${primaryUrl}`);
    const result = await request<DailySummary>(primaryUrl, {
      method: "GET",
    });
    console.log("[Attendance API] Successfully fetched daily summary");
    return result;
  } catch (primaryError) {
    console.warn(
      "[Attendance API] Primary endpoint failed, trying alternatives...",
      primaryError,
    );

    // Fallback endpoint 1: Try with /api prefix
    const fallback1 = `/api/attendance/daily-summary/${date}${queryParams.toString() ? `?${queryParams}` : ""}`;
    try {
      console.log(`[Attendance API] Trying fallback 1: GET ${fallback1}`);
      const result = await request<DailySummary>(fallback1, {
        method: "GET",
      });
      console.log("[Attendance API] Fallback 1 succeeded");
      return result;
    } catch (err1) {
      console.warn("[Attendance API] Fallback 1 failed", err1);

      // Fallback endpoint 2: Try POST instead of GET
      const fallback2 = `/attendance/daily-summary`;
      try {
        console.log(`[Attendance API] Trying fallback 2: POST ${fallback2}`);
        const result = await request<DailySummary>(fallback2, {
          method: "POST",
          body: JSON.stringify({
            date,
            departmentId:
              departmentId && departmentId !== "all" ? departmentId : undefined,
          }),
        });
        console.log("[Attendance API] Fallback 2 succeeded");
        return result;
      } catch (err2) {
        console.warn("[Attendance API] Fallback 2 failed", err2);

        // Fallback endpoint 3: Try /v1 versioned endpoint
        const fallback3 = `/v1/attendance/daily-summary/${date}${queryParams.toString() ? `?${queryParams}` : ""}`;
        try {
          console.log(`[Attendance API] Trying fallback 3: GET ${fallback3}`);
          const result = await request<DailySummary>(fallback3, {
            method: "GET",
          });
          console.log("[Attendance API] Fallback 3 succeeded");
          return result;
        } catch (err3) {
          console.error("[Attendance API] All endpoints failed", {
            primaryError,
            fallback1Error: err1,
            fallback2Error: err2,
            fallback3Error: err3,
          });

          // Provide helpful error message with suggestions
          const errorSummary = `
Failed to fetch daily summary for date: ${date}

Tried the following endpoints:
1. GET /attendance/daily-summary/${date} → ${primaryError instanceof Error ? primaryError.message : String(primaryError)}
2. GET /api/attendance/daily-summary/${date} → ${err1 instanceof Error ? err1.message : String(err1)}
3. POST /attendance/daily-summary → ${err2 instanceof Error ? err2.message : String(err2)}
4. GET /v1/attendance/daily-summary/${date} → ${err3 instanceof Error ? err3.message : String(err3)}

Please verify:
- Backend is running on http://localhost:9003
- Endpoint path is correct
- Date format is YYYY-MM-DD
- You have proper authentication
- CORS is properly configured`;

          console.error(errorSummary);
          throw new Error(errorSummary);
        }
      }
    }
  }
}
