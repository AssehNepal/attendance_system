"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  CalendarDays,
  DoorOpen,
  Send,
  History,
  User,
  ChevronDown,
  Menu,
  LayoutDashboard,
  User2,
  AlertCircle,
  CalendarX,
  Clock,
  Briefcase,
  Phone,
  Mail,
  IdCard,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { EmployeeAvatar } from "@/components/employee/employee-avatar";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:9003";
const navItems = [
  { title: "Dashboard", url: "/staff", icon: LayoutDashboard },
  { title: "My Profile", url: "/staff/profile", icon: User },
];

interface EmployeeData {
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
  department?: string;
  designation?: string;
}

export default function StaffDashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, getAuthHeaders, refreshAccessToken, logout } = useAuth();
  const [employee, setEmployee] = useState<EmployeeData | null>(null);
  const [outingRequests, setOutingRequests] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [avatarRefreshKey, setAvatarRefreshKey] = useState(0);
  const [dataMismatch, setDataMismatch] = useState(false);

  const previousUserIdRef = useRef<string | null>(null);
  const isInitialMount = useRef(true);

  const [outingDialogOpen, setOutingDialogOpen] = useState(false);
  const [outingPurpose, setOutingPurpose] = useState<"official" | "personal">(
    "official",
  );
  const [outingReason, setOutingReason] = useState("");
  const [outingWillReturn, setOutingWillReturn] = useState(true);
  const [outingExpectedReturnTime, setOutingExpectedReturnTime] = useState("");
  const [outingError, setOutingError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [leaveStartDate, setLeaveStartDate] = useState("");
  const [leaveEndDate, setLeaveEndDate] = useState("");
  const [leaveReason, setLeaveReason] = useState("");
  const [leaveError, setLeaveError] = useState("");
  const [submittingLeave, setSubmittingLeave] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const clearAllData = useCallback(() => {
    console.log("Clearing all employee data");
    setEmployee(null);
    setOutingRequests([]);
    setLeaveRequests([]);
    setFetchError(null);
    setDataMismatch(false);
    setAvatarRefreshKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const currentUserId =
      (user as any)?.id || (user as any)?.employee_id || (user as any)?.cid_no;

    if (isInitialMount.current) {
      isInitialMount.current = false;
      previousUserIdRef.current = currentUserId;
      return;
    }

    if (
      previousUserIdRef.current &&
      previousUserIdRef.current !== currentUserId
    ) {
      console.log(
        "User changed from",
        previousUserIdRef.current,
        "to",
        currentUserId,
      );
      clearAllData();
      setLoading(true);
    }

    previousUserIdRef.current = currentUserId;
  }, [user, isMounted, clearAllData]);

  useEffect(() => {
    if (!isMounted) return;

    if (!user) {
      router.push("/");
      return;
    }

    if (user.role !== "employee") {
      router.push("/dashboard");
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setFetchError(null);
      setDataMismatch(false);
      await new Promise((resolve) => setTimeout(resolve, 100));
      await Promise.all([
        fetchEmployeeData(),
        fetchOutingRequests(),
        fetchLeaveRequests(),
      ]);
    };

    loadData();
  }, [(user as any)?.id, router, isMounted]);

  const getValidHeaders = async () => {
    let headers = getAuthHeaders();
    if (!headers) {
      const refreshed = await refreshAccessToken();
      if (!refreshed) {
        router.push("/");
        return null;
      }
      headers = getAuthHeaders();
    }
    return headers;
  };

  const fetchEmployeeData = async () => {
    try {
      const headers = await getValidHeaders();
      if (!headers) return;

      console.log("=== FETCHING EMPLOYEE DATA ===");
      console.log("Auth headers present:", !!headers);
      console.log("User ID from auth:", (user as any)?.id);

      const userId = (user as any)?.id;
      if (!userId) {
        console.error("No user ID found in auth context");
        setFetchError("User ID not found. Please login again.");
        return;
      }

      const response = await fetch(
        `${API_BASE}/staff/${userId}?_=${Date.now()}`,
        {
          headers,
          cache: "no-store",
        },
      );

      console.log("Profile API Response Status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log(
          "FULL EMPLOYEE API RESPONSE:",
          JSON.stringify(data, null, 2),
        );
        console.log(
          "Fetched employee data:",
          data.name,
          "CID:",
          data.cid_no,
          "Employee ID:",
          data.employee_id,
        );

        // Validate that the returned data matches the logged-in user
        const expectedCid = (user as any)?.cid_no || (user as any)?.cidNo;
        const actualCid = data.cid_no;

        console.log("Expected CID from auth:", expectedCid);
        console.log("Actual CID from API:", actualCid);

        if (expectedCid && actualCid && expectedCid !== actualCid) {
          console.error("=== CID MISMATCH DETECTED! ===");
          console.error("Expected:", expectedCid, "Got:", actualCid);
          console.error("This means the backend returned wrong user data!");
          setDataMismatch(true);
          setFetchError(
            `Data mismatch! Logged in as CID: ${expectedCid} but API returned data for CID: ${actualCid}. Please logout and login again.`,
          );
          setEmployee(null);
          return;
        }

        setEmployee(data);
        setAvatarRefreshKey((prev) => prev + 1);
      } else if (response.status === 401) {
        console.log("Token expired, attempting refresh");
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          const retryHeaders = getAuthHeaders();
          if (retryHeaders) {
            const retryResponse = await fetch(
              `${API_BASE}/staff/${userId}?_=${Date.now()}`,
              {
                headers: retryHeaders,
                cache: "no-store",
              },
            );
            if (retryResponse.ok) {
              const data = await retryResponse.json();
              console.log("Retry successful:", data.name);
              setEmployee(data);
              setAvatarRefreshKey((prev) => prev + 1);
              return;
            }
          }
        }
        setFetchError("Session expired. Please login again.");
        setTimeout(() => router.push("/"), 2000);
      } else {
        console.error("Failed to fetch employee profile:", response.status);
        setFetchError("Unable to load profile data. Please refresh the page.");
      }
    } catch (error) {
      console.error("Error fetching employee:", error);
      setFetchError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const fetchOutingRequests = async () => {
    try {
      const headers = await getValidHeaders();
      if (!headers) return;

      const response = await fetch(
        `${API_BASE}/attendance/outings/my?_=${Date.now()}`,
        {
          headers,
          cache: "no-store",
        },
      );

      if (response.ok) {
        const data = await response.json();
        setOutingRequests(
          data.sort(
            (a: any, b: any) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          ),
        );
      } else if (response.status !== 404) {
        console.error("Failed to fetch outings:", response.status);
        setOutingRequests([]);
      }
    } catch (error) {
      console.error("Error fetching outings:", error);
      setOutingRequests([]);
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      const headers = await getValidHeaders();
      if (!headers) return;

      const response = await fetch(
        `${API_BASE}/attendance/leaves/my?_=${Date.now()}`,
        {
          headers,
          cache: "no-store",
        },
      );

      if (response.ok) {
        const data = await response.json();
        setLeaveRequests(
          data.sort(
            (a: any, b: any) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          ),
        );
      } else if (response.status !== 404) {
        console.error("Failed to fetch leaves:", response.status);
        setLeaveRequests([]);
      }
    } catch (error) {
      console.error("Error fetching leaves:", error);
      setLeaveRequests([]);
    }
  };

  const refreshAllData = async () => {
    console.log("Refreshing all data");
    setLoading(true);
    setFetchError(null);
    setDataMismatch(false);
    await Promise.all([
      fetchEmployeeData(),
      fetchOutingRequests(),
      fetchLeaveRequests(),
    ]);
    setLoading(false);
    setAvatarRefreshKey((prev) => prev + 1);
  };

  const getCurrentTime24 = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  };

  const getMinReturnTime = (): string => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 15);
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  };

  const parseTime = (timeStr: string): number => {
    let hours = 0,
      minutes = 0;
    const parts = timeStr.split(":");
    if (parts.length >= 2) {
      hours = parseInt(parts[0], 10);
      minutes = parseInt(parts[1], 10);
    }
    return hours * 60 + minutes;
  };

  const isTimeAfter = (time1: string, time2: string): boolean => {
    return parseTime(time1) > parseTime(time2);
  };

  const handleSubmitOutingRequest = async () => {
    if (!employee) return;

    if (isOnLeaveToday()) {
      setOutingError("You cannot request an outing while on leave.");
      return;
    }

    if (!outingReason.trim()) {
      setOutingError("Please provide a reason for the outing");
      return;
    }

    if (outingWillReturn) {
      if (!outingExpectedReturnTime.trim()) {
        setOutingError("Please specify expected return time");
        return;
      }
      const minReturnTime = getMinReturnTime();
      if (!isTimeAfter(outingExpectedReturnTime, minReturnTime)) {
        setOutingError(
          `Expected return time must be at least 15 minutes from now (minimum: ${minReturnTime})`,
        );
        return;
      }
    }

    setSubmitting(true);
    setOutingError("");

    try {
      const headers = await getValidHeaders();
      if (!headers) return;

      const response = await fetch(`${API_BASE}/attendance/outings`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: today,
          purpose: outingPurpose,
          reason: outingReason,
          willReturn: outingWillReturn,
          expectedReturnTime: outingWillReturn
            ? outingExpectedReturnTime
            : null,
        }),
      });

      if (response.ok) {
        setOutingPurpose("official");
        setOutingReason("");
        setOutingWillReturn(true);
        setOutingExpectedReturnTime("");
        setOutingError("");
        setOutingDialogOpen(false);
        await fetchOutingRequests();
      } else {
        const error = await response.json();
        setOutingError(error.message || "Failed to submit outing request");
      }
    } catch (error) {
      console.error("Error submitting outing:", error);
      setOutingError("Failed to submit request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkReturn = async (requestId: string) => {
    try {
      const headers = await getValidHeaders();
      if (!headers) return;

      const response = await fetch(
        `${API_BASE}/attendance/outings/${requestId}/return`,
        {
          method: "PATCH",
          headers: {
            ...headers,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            returnTime: getCurrentTime24(),
          }),
        },
      );

      if (response.ok) {
        await fetchOutingRequests();
      } else {
        alert("Failed to mark return");
      }
    } catch (error) {
      console.error("Error marking return:", error);
      alert("Error marking return");
    }
  };

  const handleSubmitLeaveRequest = async () => {
    const start = leaveStartDate.trim();
    const end = leaveEndDate.trim();
    const reason = leaveReason.trim();

    if (!start || !end || !reason) {
      setLeaveError("Please fill all fields");
      return;
    }

    if (start > end) {
      setLeaveError("Start date cannot be after end date");
      return;
    }

    if (start < today) {
      setLeaveError("Leave cannot start in the past");
      return;
    }

    setSubmittingLeave(true);
    setLeaveError("");

    try {
      const headers = await getValidHeaders();
      if (!headers) return;

      const response = await fetch(`${API_BASE}/attendance/leaves`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startDate: start,
          endDate: end,
          reason: reason,
        }),
      });

      if (response.ok) {
        setLeaveStartDate("");
        setLeaveEndDate("");
        setLeaveReason("");
        setLeaveError("");
        setLeaveDialogOpen(false);
        await fetchLeaveRequests();
      } else {
        const error = await response.json();
        setLeaveError(error.message || "Failed to submit leave request");
      }
    } catch (error) {
      console.error("Error submitting leave:", error);
      setLeaveError("Failed to submit request. Please try again.");
    } finally {
      setSubmittingLeave(false);
    }
  };

  const handleLogout = async () => {
    clearAllData();
    logout();
    router.push("/");
  };

  const currentOuting = outingRequests.find(
    (r: any) =>
      r.date === today && r.status === "approved" && !r.actualReturnTime,
  );

  const isOnLeaveToday = () => {
    const todayStr = today;
    return leaveRequests.some(
      (leave: any) => leave.startDate <= todayStr && leave.endDate >= todayStr,
    );
  };

  const canRequestOuting = !currentOuting && !isOnLeaveToday();

  const getEmployeeName = () =>
    employee?.name || (user as any)?.name || "Employee";
  const getEmployeeId = () =>
    employee?.employee_id ||
    (user as any)?.employee_id ||
    (user as any)?.employeeId ||
    "N/A";
  const getEmployeeEmail = () => employee?.email || user?.email || "";
  const getEmployeeContact = () =>
    employee?.contact_no ||
    (user as any)?.contact_no ||
    (user as any)?.contactNumber ||
    "N/A";
  const getEmployeeCid = () =>
    employee?.cid_no || (user as any)?.cid_no || (user as any)?.cidNo || "N/A";
  const getEmploymentType = () => {
    const type =
      employee?.employment_type ||
      (user as any)?.employment_type ||
      (user as any)?.employmentType ||
      "regular";
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  if (!isMounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B2E4F] mx-auto mb-4"></div>
          <div className="text-slate-500">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (dataMismatch) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-2xl shadow-lg">
          <div className="bg-red-100 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-10 w-10 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Data Mismatch Detected!
          </h2>
          <p className="text-slate-600 mb-4">{fetchError}</p>
          <p className="text-sm text-slate-500 mb-6">
            This usually happens when the backend API returns data for a
            different user than the one logged in. Please logout and login
            again.
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700"
            >
              Logout Now
            </Button>
            <Button onClick={refreshAllData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!employee && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-2xl shadow-lg">
          <div className="bg-red-100 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-10 w-10 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            No Employee Data
          </h2>
          <p className="text-slate-600 mb-6">
            {fetchError || "Unable to load employee data"}
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={refreshAllData}
              className="bg-[#0B2E4F] hover:bg-[#1a5a92]"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
            <Button onClick={handleLogout} variant="outline">
              Logout
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="relative flex min-h-screen flex-col">
        <div
          className="fixed inset-0 bg-repeat opacity-10 -z-10"
          style={{ backgroundImage: "url('/images/bg-pattern.png')" }}
        />

        <div className="relative z-10">
          <header className="flex items-center justify-between bg-white shadow-sm px-6 md:px-10 py-3 border-b border-slate-200 sticky top-0 z-50">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center">
                <Image
                  src="/icon.png"
                  alt="Logo"
                  width={48}
                  height={48}
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-800">
                  Staff Portal
                </h1>
                <p className="text-xs text-slate-500">
                  Thimphu Dzongkhag Administration
                </p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={refreshAllData}
                className="hover:bg-slate-100"
                title="Refresh data"
              >
                <RefreshCw className="h-4 w-4 text-slate-500" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 hover:bg-slate-100">
                    <EmployeeAvatar
                      cidNo={getEmployeeCid()}
                      name={getEmployeeName()}
                      size="sm"
                      refreshKey={avatarRefreshKey}
                    />
                    <span className="font-medium text-slate-700">
                      {getEmployeeName().split(" ")[0]}
                    </span>
                    <ChevronDown className="h-4 w-4 text-slate-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <div className="p-3 border-b flex items-center gap-3">
                    <EmployeeAvatar
                      cidNo={getEmployeeCid()}
                      name={getEmployeeName()}
                      size="sm"
                      refreshKey={avatarRefreshKey}
                    />
                    <div>
                      <p className="font-semibold text-slate-900">
                        {getEmployeeName()}
                      </p>
                      <p className="text-sm text-slate-500">
                        {getEmploymentType()}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {getEmployeeEmail()}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuItem
                    className="gap-2 cursor-pointer hover:!bg-[#0B2E4F] hover:text-white"
                    onClick={() => router.push("/staff/profile")}
                  >
                    <User className="h-4 w-4" />
                    My Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="gap-2 cursor-pointer hover:!bg-red-600 hover:text-white"
                    onClick={() => setLogoutDialogOpen(true)}
                  >
                    <User2 className="h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5 text-slate-700" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] sm:w-[350px] p-0">
                <div className="flex flex-col h-full bg-white">
                  <div className="border-b border-slate-200 p-4">
                    <Link
                      href="/staff"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg">
                        <Image
                          src="/icon.png"
                          alt="Logo"
                          width={40}
                          height={40}
                          className="object-contain"
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-800">
                          Thimphu Dzongkhag
                        </span>
                        <span className="text-xs text-slate-500">
                          Attendance System
                        </span>
                      </div>
                    </Link>
                  </div>
                  <div className="flex-1 py-4">
                    <div className="px-3 mb-2">
                      <p className="text-xs font-semibold text-slate-400 px-3 py-2">
                        Navigation
                      </p>
                    </div>
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.url;
                      return (
                        <Link
                          key={item.url}
                          href={item.url}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-6 py-2.5 mx-2 rounded-lg transition-colors ${
                            isActive
                              ? "bg-[#0B2E4F] text-white"
                              : "text-slate-600 hover:bg-[#0B2E4F] hover:text-white"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="text-sm">{item.title}</span>
                        </Link>
                      );
                    })}
                  </div>
                  <div className="border-t border-slate-200 p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <EmployeeAvatar
                        cidNo={getEmployeeCid()}
                        name={getEmployeeName()}
                        size="sm"
                        refreshKey={avatarRefreshKey}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-800">
                          {getEmployeeName()}
                        </p>
                        <p className="text-xs text-slate-500 capitalize">
                          {getEmploymentType()}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => {
                        setLogoutDialogOpen(true);
                        setMobileMenuOpen(false);
                      }}
                    >
                      <User2 className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </header>

          <main className="px-6 md:px-10 lg:px-14 py-8 max-w-7xl mx-auto">
            {fetchError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="h-5 w-5" />
                  <span>{fetchError}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshAllData}
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  Retry
                </Button>
              </div>
            )}

            <div className="bg-gradient-to-r from-[#0B2E4F] to-[#1a456b] rounded-lg p-5 md:p-7 mb-8 text-white shadow-xl">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <EmployeeAvatar
                    cidNo={getEmployeeCid()}
                    name={getEmployeeName()}
                    size="md"
                    refreshKey={avatarRefreshKey}
                  />

                  <div>
                    <h2 className="text-xl md:text-3xl font-bold">
                      Welcome back, {getEmployeeName().split(" ")[0]}!
                    </h2>
                    <p className="text-white/80 text-base md:text-lg mt-1">
                      {getEmploymentType()} Employee
                    </p>
                    <p className="text-white/60 text-sm mt-1">
                      ID: {getEmployeeId()} | CID: {getEmployeeCid()}
                    </p>
                  </div>
                </div>
                <div className="flex flex-row md:flex-col items-center md:items-end gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100/20">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-white/60 tracking-widest">
                      Current Status
                    </span>
                    {isOnLeaveToday() ? (
                      <Badge className="bg-purple-500/30 text-white border-purple-500/50">
                        On Leave Today
                      </Badge>
                    ) : currentOuting ? (
                      <Badge className="bg-amber-500/30 text-white border-amber-500/50">
                        Currently Out
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-500/30 text-white border-emerald-500/50">
                        In Office
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Email</p>
                    <p className="text-sm font-medium truncate max-w-[200px]">
                      {getEmployeeEmail()}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Phone className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Contact Number</p>
                    <p className="text-sm font-medium">
                      {getEmployeeContact()}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <IdCard className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Employment Type</p>
                    <p className="text-sm font-medium">{getEmploymentType()}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CalendarX className="h-5 w-5 text-purple-600" />
                    Request Leave
                  </CardTitle>
                  <CardDescription>Submit a leave request</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => setLeaveDialogOpen(true)}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <CalendarDays className="h-4 w-4 mr-2" />
                    Request Leave
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <DoorOpen className="h-5 w-5 text-blue-600" />
                    Request Outing
                  </CardTitle>
                  <CardDescription>Submit an outing request</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {currentOuting ? (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleMarkReturn(currentOuting.id)}
                          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          Mark Return
                        </Button>
                        <Button variant="outline" className="flex-1" disabled>
                          Currently Out
                        </Button>
                      </div>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="w-full">
                            <Button
                              onClick={() => {
                                if (isOnLeaveToday()) {
                                  alert(
                                    "You cannot request an outing while on leave.",
                                  );
                                  return;
                                }
                                setOutingDialogOpen(true);
                              }}
                              disabled={!canRequestOuting}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              <DoorOpen className="h-4 w-4 mr-2" />
                              Request Outing
                            </Button>
                          </span>
                        </TooltipTrigger>
                        {!canRequestOuting && (
                          <TooltipContent>
                            {isOnLeaveToday()
                              ? "You are on leave today and cannot request an outing"
                              : "You already have an active outing today"}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <h3 className="text-base font-semibold text-slate-900 mb-4">
                History & Records
              </h3>
              <Tabs defaultValue="leaves" className="space-y-4">
                <TabsList className="bg-white border">
                  <TabsTrigger
                    value="leaves"
                    className="gap-2 data-[state=active]:bg-[#0B2E4F] data-[state=active]:text-white"
                  >
                    <CalendarDays className="h-4 w-4" />
                    Leave History
                  </TabsTrigger>
                  <TabsTrigger
                    value="outings"
                    className="gap-2 data-[state=active]:bg-[#0B2E4F] data-[state=active]:text-white"
                  >
                    <History className="h-4 w-4" />
                    Outing History
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="leaves">
                  <Card className="border-0 shadow-md">
                    <CardHeader>
                      <CardTitle>Your Leave Requests</CardTitle>
                      <CardDescription>
                        All leave requests are automatically approved
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {leaveRequests.length === 0 ? (
                        <div className="text-center py-12">
                          <CalendarX className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                          <p className="text-slate-500">
                            No leave requests found
                          </p>
                        </div>
                      ) : (
                        <div className="border rounded-lg overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-[#0B2E4F]">
                                <tr>
                                  <th className="text-left text-white font-semibold py-3 px-4">
                                    Start Date
                                  </th>
                                  <th className="text-left text-white font-semibold py-3 px-4">
                                    End Date
                                  </th>
                                  <th className="text-left text-white font-semibold py-3 px-4">
                                    Reason
                                  </th>
                                  <th className="text-left text-white font-semibold py-3 px-4">
                                    Status
                                  </th>
                                  <th className="text-left text-white font-semibold py-3 px-4">
                                    Requested On
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {leaveRequests.map((request, index) => (
                                  <tr
                                    key={request.id}
                                    className={cn(
                                      "border-b border-slate-200",
                                      index % 2 === 0
                                        ? "bg-white"
                                        : "bg-slate-50/50",
                                    )}
                                  >
                                    <td className="py-3 px-4 text-sm text-slate-700">
                                      {new Date(
                                        request.startDate,
                                      ).toLocaleDateString()}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-slate-700">
                                      {new Date(
                                        request.endDate,
                                      ).toLocaleDateString()}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-slate-700">
                                      {request.reason}
                                    </td>
                                    <td className="py-3 px-4">
                                      <Badge className="bg-green-100 text-green-800">
                                        Approved
                                      </Badge>
                                    </td>
                                    <td className="py-3 px-4 text-sm text-slate-500">
                                      {new Date(
                                        request.createdAt,
                                      ).toLocaleDateString()}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="outings">
                  <Card className="border-0 shadow-md">
                    <CardHeader>
                      <CardTitle>Your Outing Requests</CardTitle>
                      <CardDescription>
                        All outing requests are automatically approved
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {outingRequests.length === 0 ? (
                        <div className="text-center py-12">
                          <DoorOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                          <p className="text-slate-500">
                            No outing requests found
                          </p>
                        </div>
                      ) : (
                        <div className="border rounded-lg overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-[#0B2E4F]">
                                <tr>
                                  <th className="text-left text-white font-semibold py-3 px-4">
                                    Date
                                  </th>
                                  <th className="text-left text-white font-semibold py-3 px-4">
                                    Request Time
                                  </th>
                                  <th className="text-left text-white font-semibold py-3 px-4">
                                    Purpose
                                  </th>
                                  <th className="text-left text-white font-semibold py-3 px-4">
                                    Reason
                                  </th>
                                  <th className="text-left text-white font-semibold py-3 px-4">
                                    Return Status
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {outingRequests.map((request, index) => (
                                  <tr
                                    key={request.id}
                                    className={cn(
                                      "border-b border-slate-200",
                                      index % 2 === 0
                                        ? "bg-white"
                                        : "bg-slate-50/50",
                                    )}
                                  >
                                    <td className="py-3 px-4 text-sm text-slate-700">
                                      {new Date(
                                        request.date,
                                      ).toLocaleDateString()}
                                    </td>
                                    <td className="py-3 px-4 text-sm font-mono text-slate-700">
                                      {request.requestTime}
                                    </td>
                                    <td className="py-3 px-4">
                                      <Badge
                                        className={
                                          request.purpose === "official"
                                            ? "bg-blue-100 text-blue-800"
                                            : "bg-purple-100 text-purple-800"
                                        }
                                      >
                                        {request.purpose === "official"
                                          ? "Official"
                                          : "Personal"}
                                      </Badge>
                                    </td>
                                    <td className="py-3 px-4 text-sm text-slate-700">
                                      {request.reason}
                                    </td>
                                    <td className="py-3 px-4">
                                      {request.actualReturnTime ? (
                                        <span className="text-sm text-green-600">
                                          Returned at {request.actualReturnTime}
                                        </span>
                                      ) : request.willReturn ? (
                                        <span className="text-sm text-yellow-600">
                                          Expected: {request.expectedReturnTime}
                                        </span>
                                      ) : (
                                        <span className="text-sm text-slate-400">
                                          No return
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>

        <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Logout</DialogTitle>
              <DialogDescription>
                Are you sure you want to logout?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setLogoutDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleLogout}>
                Logout
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={outingDialogOpen} onOpenChange={setOutingDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Request Outing Permission</DialogTitle>
              <DialogDescription>
                Your request will be automatically approved
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Purpose</Label>
                <Select
                  value={outingPurpose}
                  onValueChange={(v: "official" | "personal") =>
                    setOutingPurpose(v)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="official">Official Work</SelectItem>
                    <SelectItem value="personal">Personal Work</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Reason / Details</Label>
                <Textarea
                  value={outingReason}
                  onChange={(e) => setOutingReason(e.target.value)}
                  placeholder="Please describe the reason for going out..."
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label className="text-base">
                    Will you return to office?
                  </Label>
                  <p className="text-sm text-slate-500">
                    {outingWillReturn
                      ? "Yes, I will return today"
                      : "No, I will not return today"}
                  </p>
                </div>
                <Switch
                  checked={outingWillReturn}
                  onCheckedChange={setOutingWillReturn}
                />
              </div>

              {outingWillReturn && (
                <div className="space-y-2">
                  <Label>Expected Return Time</Label>
                  <Input
                    type="time"
                    value={outingExpectedReturnTime}
                    onChange={(e) =>
                      setOutingExpectedReturnTime(e.target.value)
                    }
                    min={getMinReturnTime()}
                  />
                  <p className="text-xs text-slate-500">
                    Must be at least 15 minutes from now (24‑hour format)
                  </p>
                </div>
              )}

              {outingError && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                  <AlertCircle className="h-4 w-4" />
                  {outingError}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setOutingDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitOutingRequest}
                disabled={submitting}
                className="bg-[#0B2E4F] hover:bg-[#1a456b]"
              >
                <Send className="h-4 w-4 mr-2" />
                {submitting ? "Submitting..." : "Submit Request"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Request Leave</DialogTitle>
              <DialogDescription>
                Leave requests are automatically approved
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={leaveStartDate}
                  onChange={(e) => setLeaveStartDate(e.target.value)}
                  min={today}
                />
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={leaveEndDate}
                  onChange={(e) => setLeaveEndDate(e.target.value)}
                  min={leaveStartDate || today}
                />
              </div>

              <div className="space-y-2">
                <Label>Reason</Label>
                <Textarea
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="Please provide reason for leave..."
                  rows={3}
                />
              </div>

              {leaveError && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                  <AlertCircle className="h-4 w-4" />
                  {leaveError}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setLeaveDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitLeaveRequest}
                disabled={submittingLeave}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Send className="h-4 w-4 mr-2" />
                {submittingLeave ? "Submitting..." : "Submit Leave"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
