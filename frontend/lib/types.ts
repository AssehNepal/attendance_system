export interface Employee {
  id: string
  employeeId: string
  name: string
  gender: "Male" | "Female" | "Other"
  designation: string
  contactNumber: string
  email: string
  address: string
  department: string
  joiningDate: string
  status: "Active" | "Inactive"
  inactiveReason?: string
  createdAt: string
  updatedAt: string
}

export interface AttendanceRecord {
  id: string
  employeeId: string
  date: string
  checkIn: string | null
  checkOut: string | null
  status: "Present" | "Absent" | "Late" | "Half-Day" | "Leave"
  remarks: string
  createdAt: string
  updatedAt: string
}

export interface User {
  id: string
  role: "admin" | "operator" | "employee"
  name: string
  email?: string
  username?: string
  password?: string
  employeeId?: string
  employee_id?: string
  cid_no?: string
  cidNo?: string
  contact_no?: string
  contactNumber?: string
  employment_type?: string
  employmentType?: string
  department?: string
  officeId?: string
  is_active?: boolean
  created_at?: string
  last_login_at?: string | null
  address?: string
  designation?: string
}

export interface DailyStats {
  date: string
  totalEmployees: number
  present: number
  absent: number
  late: number
  onLeave: number
}

export interface AttendanceFilter {
  startDate?: string
  endDate?: string
  employeeId?: string
  department?: string
  status?: AttendanceRecord["status"]
}

export interface ReportData {
  employee: Employee
  records: AttendanceRecord[]
  presentDays: number
  absentDays: number
  lateDays: number
  leaveDays: number
  attendancePercentage: number
}

export interface OutingRequest {
  id: string
  employeeId: string
  date: string
  requestTime: string
  purpose: "official" | "personal"
  reason: string
  willReturn: boolean
  expectedReturnTime: string | null
  actualReturnTime: string | null
  status: "pending" | "approved" | "denied"
  reviewedBy: string | null
  reviewedAt: string | null
  reviewerRemarks: string
  createdAt: string
  updatedAt: string
}

export interface LeaveRequest {
  id: string
  employeeId: string
  startDate: string
  endDate: string
  reason: string
  createdAt: string
}
