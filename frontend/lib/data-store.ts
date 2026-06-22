import type {
	Employee,
	AttendanceRecord,
	User,
	DailyStats,
	OutingRequest,
	LeaveRequest,
} from "./types";

// Sample departments for Thimphu Dzongkhag Administration
export const DEPARTMENTS = [
	"Administration",
	"Finance",
	"Human Resources",
	"Planning",
	"Engineering",
	"Agriculture",
	"Education",
	"Health",
	"Environment",
	"ICT",
];

// Sample designations
export const DESIGNATIONS = [
	"Dzongdag",
	"Dzongrab",
	"Administrative Officer",
	"Finance Officer",
	"Planning Officer",
	"Engineer",
	"Accountant",
	"HR Officer",
	"IT Officer",
	"Driver",
	"Office Assistant",
	"Receptionist",
];

// Default admin user
const DEFAULT_USERS: User[] = [
	{
		id: "1",
		username: "admin",
		password: "P@ssw0rd123",
		role: "admin",
		name: "System Administrator",
		email: "admin@gmail.com",
	},
	{
		id: "2",
		username: "operator",
		password: "operator123",
		role: "operator",
		name: "Front Desk Operator",
		email: "operator@thimphu.gov.bt",
	},
	{
		id: "102",
		username: "TDA002",
		password: "1234",
		role: "employee",
		name: "Pema Wangmo",
		email: "pema.wangmo@thimphu.gov.bt",
		employeeId: "TDA002",
		department: "Administrative",
	},
];

// Sample employees
const SAMPLE_EMPLOYEES: Employee[] = [
	{
		id: "1",
		employeeId: "TDA001",
		CID: "10607002234",
		name: "Minjur Dorji",
		gender: "Male",
		designation: "Dzongdag",
		contactNumber: "17123456",
		email: "minjur.dorji@thimphu.gov.bt",
		address: "Thimphu, Bhutan",
		department: "Administration",
		joiningDate: "2020-01-15",
		status: "Active",
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
	{
		id: "2",
		employeeId: "TDA002",
		CID: "10607002235",
		name: "Pema Wangmo",
		gender: "Female",
		designation: "Finance Officer",
		contactNumber: "17234567",
		email: "pema.wangmo@thimphu.gov.bt",
		address: "Thimphu, Bhutan",
		department: "Finance",
		joiningDate: "2021-03-20",
		status: "Active",
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
	{
		id: "3",
		employeeId: "TDA003",
		CID: "10607002236",
		name: "Karma Tenzin",
		gender: "Male",
		designation: "IT Officer",
		contactNumber: "17345678",
		email: "karma.tenzin@thimphu.gov.bt",
		address: "Thimphu, Bhutan",
		department: "ICT",
		joiningDate: "2022-06-01",
		status: "Active",
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
	{
		id: "4",
		employeeId: "TDA004",
		CID: "10607002237",
		name: "Sonam Deki",
		gender: "Female",
		designation: "HR Officer",
		contactNumber: "17456789",
		email: "sonam.deki@thimphu.gov.bt",
		address: "Thimphu, Bhutan",
		department: "Human Resources",
		joiningDate: "2021-09-15",
		status: "Active",
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
	{
		id: "5",
		employeeId: "TDA005",
		CID: "10607002238",
		name: "Dorji Wangchuk",
		gender: "Male",
		designation: "Engineer",
		contactNumber: "17567890",
		email: "dorji.wangchuk@thimphu.gov.bt",
		address: "Thimphu, Bhutan",
		department: "Engineering",
		joiningDate: "2020-11-01",
		status: "Active",
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
	{
		id: "6",
		employeeId: "TDA006",
		CID: "10607002239",
		name: "Dechen Yangzom",
		gender: "Female",
		designation: "Planning Officer",
		contactNumber: "17678901",
		email: "dechen.yangzom@thimphu.gov.bt",
		address: "Thimphu, Bhutan",
		department: "Planning",
		joiningDate: "2023-02-01",
		status: "Active",
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
	{
		id: "7",
		employeeId: "TDA007",
		CID: "10607002240",
		name: "Kinley Namgay",
		gender: "Male",
		designation: "Accountant",
		contactNumber: "17789012",
		email: "kinley.namgay@thimphu.gov.bt",
		address: "Thimphu, Bhutan",
		department: "Finance",
		joiningDate: "2022-04-15",
		status: "Active",
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
	{
		id: "8",
		employeeId: "TDA008",
		CID: "10607002241",
		name: "Chimi Dema",
		gender: "Female",
		designation: "Receptionist",
		contactNumber: "17890123",
		email: "chimi.dema@thimphu.gov.bt",
		address: "Thimphu, Bhutan",
		department: "Administration",
		joiningDate: "2023-07-01",
		status: "Active",
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
	{
		id: "9",
		employeeId: "TDA009",
		CID: "10607002242",
		name: "Ugyen Tshomo",
		gender: "Female",
		designation: "Administrative Officer",
		contactNumber: "17901234",
		email: "ugyen.tshomo@thimphu.gov.bt",
		address: "Thimphu, Bhutan",
		department: "Administration",
		joiningDate: "2021-01-10",
		status: "Active",
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
	{
		id: "10",
		employeeId: "TDA010",
		CID: "10607002243",
		name: "Sangay Dorji",
		gender: "Male",
		designation: "Driver",
		contactNumber: "17012345",
		email: "sangay.dorji@thimphu.gov.bt",
		address: "Thimphu, Bhutan",
		department: "Administration",
		joiningDate: "2019-05-20",
		status: "Active",
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
	{
		id: "11",
		employeeId: "TDA011",
		CID: "10607002244",
		name: "Jigme Choden",
		gender: "Female",
		designation: "ICT Officer",
		contactNumber: "17112345",
		email: "jigme.choden@thimphu.gov.bt",
		address: "Thimphu, Bhutan",
		department: "ICT",
		joiningDate: "2019-05-20",
		status: "Active",
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
];

// Generate sample attendance records (for initial data)
function generateSampleAttendance(): AttendanceRecord[] {
	const records: AttendanceRecord[] = [];
	const today = new Date();

	for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
		const date = new Date(today);
		date.setDate(date.getDate() - dayOffset);
		const dateStr = date.toISOString().split("T")[0];

		// Skip weekends
		if (date.getDay() === 0 || date.getDay() === 6) continue;

		SAMPLE_EMPLOYEES.forEach((emp, empIndex) => {
			const random = Math.random();
			let status: AttendanceRecord["status"] = "Present";
			let checkIn: string | null = null;
			let checkOut: string | null = null;
			let remarks = "";

			if (random < 0.7) {
				status = "Present";
				checkIn = `0${8 + Math.floor(Math.random() * 2)}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}`;
				checkOut = `1${6 + Math.floor(Math.random() * 2)}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}`;
			} else if (random < 0.8) {
				status = "Late";
				checkIn = `${9 + Math.floor(Math.random() * 2)}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}`;
				checkOut = `1${7 + Math.floor(Math.random() * 2)}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}`;
				remarks = "Arrived late";
			} else if (random < 0.9) {
				status = "Absent";
				remarks = "Did not report";
			} else {
				status = "Leave";
				remarks = "On approved leave";
			}

			records.push({
				id: `att-${dayOffset}-${empIndex}`,
				employeeId: emp.id,
				date: dateStr,
				checkIn,
				checkOut,
				status,
				remarks,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			});
		});
	}

	return records;
}

// Storage keys
const STORAGE_KEYS = {
	EMPLOYEES: "tda_employees",
	ATTENDANCE: "tda_attendance",
	USERS: "tda_users",
	OUTING_REQUESTS: "tda_outing_requests",
	LEAVE_REQUESTS: "tda_leave_requests",
};

// Data store functions
export const dataStore = {
	// Initialize data
	init() {
		if (typeof window === "undefined") return;

		if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
			localStorage.setItem(
				STORAGE_KEYS.USERS,
				JSON.stringify(DEFAULT_USERS),
			);
		} else {
			const users = this.getUsers();
			const hasEmployeeUsers = users.some((u) => u.role === "employee");
			if (!hasEmployeeUsers) {
				const employeeUsers = DEFAULT_USERS.filter(
					(u) => u.role === "employee",
				);
				localStorage.setItem(
					STORAGE_KEYS.USERS,
					JSON.stringify([...users, ...employeeUsers]),
				);
			}
		}

		if (!localStorage.getItem(STORAGE_KEYS.EMPLOYEES)) {
			localStorage.setItem(
				STORAGE_KEYS.EMPLOYEES,
				JSON.stringify(SAMPLE_EMPLOYEES),
			);
		}

		if (!localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) {
			localStorage.setItem(
				STORAGE_KEYS.ATTENDANCE,
				JSON.stringify(generateSampleAttendance()),
			);
		}

		if (!localStorage.getItem(STORAGE_KEYS.OUTING_REQUESTS)) {
			localStorage.setItem(
				STORAGE_KEYS.OUTING_REQUESTS,
				JSON.stringify([]),
			);
		}

		if (!localStorage.getItem(STORAGE_KEYS.LEAVE_REQUESTS)) {
			localStorage.setItem(
				STORAGE_KEYS.LEAVE_REQUESTS,
				JSON.stringify([]),
			);
		}
	},

	// ========== Users ==========
	getUsers(): User[] {
		if (typeof window === "undefined") return DEFAULT_USERS;
		const data = localStorage.getItem(STORAGE_KEYS.USERS);
		return data ? JSON.parse(data) : DEFAULT_USERS;
	},

	// MODIFIED: validateUser now supports role-based login
	validateUser(
		identifier: string,
		password: string,
		role?: string,
	): User | null {
		const users = this.getUsers();

		// Employee login: identifier is CID
		if (role === "employee") {
			const employee = this.getEmployeeByCID(identifier);
			if (!employee) return null;

			// Find the associated user account (by employeeId)
			const user = users.find(
				(u) =>
					u.employeeId === employee.employeeId &&
					u.password === password,
			);
			return user || null;
		}

		// Admin / Operator login: identifier is email
		return (
			users.find(
				(u) =>
					u.email === identifier &&
					u.password === password &&
					u.role === role,
			) || null
		);
	},

	// ========== Employees ==========
	getEmployees(): Employee[] {
		if (typeof window === "undefined") return SAMPLE_EMPLOYEES;
		const data = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
		return data ? JSON.parse(data) : SAMPLE_EMPLOYEES;
	},

	getEmployeeById(id: string): Employee | undefined {
		return this.getEmployees().find((e) => e.id === id);
	},

	// NEW: Get employee by CID
	getEmployeeByCID(cid: string): Employee | undefined {
		return this.getEmployees().find((e) => e.CID === cid);
	},

	addEmployee(
		employee: Omit<Employee, "id" | "createdAt" | "updatedAt">,
	): Employee {
		const employees = this.getEmployees();
		const newEmployee: Employee = {
			...employee,
			id: String(Date.now()),
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};
		employees.push(newEmployee);
		localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
		return newEmployee;
	},

	updateEmployee(id: string, updates: Partial<Employee>): Employee | null {
		const employees = this.getEmployees();
		const index = employees.findIndex((e) => e.id === id);
		if (index === -1) return null;

		employees[index] = {
			...employees[index],
			...updates,
			updatedAt: new Date().toISOString(),
		};
		localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
		return employees[index];
	},

	deleteEmployee(id: string): boolean {
		const employees = this.getEmployees();
		const filtered = employees.filter((e) => e.id !== id);
		if (filtered.length === employees.length) return false;

		localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(filtered));
		return true;
	},

	// ========== Attendance ==========
	getAttendance(): AttendanceRecord[] {
		if (typeof window === "undefined") return [];
		const data = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
		return data ? JSON.parse(data) : [];
	},

	getAttendanceByDate(date: string): AttendanceRecord[] {
		return this.getAttendance().filter((a) => a.date === date);
	},

	getAttendanceByEmployee(employeeId: string): AttendanceRecord[] {
		return this.getAttendance().filter((a) => a.employeeId === employeeId);
	},

	markAttendance(
		record: Omit<AttendanceRecord, "id" | "createdAt" | "updatedAt">,
	): AttendanceRecord {
		const attendance = this.getAttendance();
		const existingIndex = attendance.findIndex(
			(a) => a.employeeId === record.employeeId && a.date === record.date,
		);

		const newRecord: AttendanceRecord = {
			...record,
			id:
				existingIndex >= 0
					? attendance[existingIndex].id
					: String(Date.now()),
			createdAt:
				existingIndex >= 0
					? attendance[existingIndex].createdAt
					: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		if (existingIndex >= 0) {
			attendance[existingIndex] = newRecord;
		} else {
			attendance.push(newRecord);
		}

		localStorage.setItem(
			STORAGE_KEYS.ATTENDANCE,
			JSON.stringify(attendance),
		);
		return newRecord;
	},

	saveAttendance(attendance: AttendanceRecord[]) {
		localStorage.setItem(
			STORAGE_KEYS.ATTENDANCE,
			JSON.stringify(attendance),
		);
	},

	getDailyStats(date: string): DailyStats {
		const employees = this.getEmployees().filter(
			(e) => e.status === "Active",
		);
		const attendance = this.getAttendanceByDate(date);

		let present = 0;
		let late = 0;
		let onLeave = 0;
		let absent = 0;

		employees.forEach((emp) => {
			const record = attendance.find((a) => a.employeeId === emp.id);
			if (record) {
				switch (record.status) {
					case "Present":
						present++;
						break;
					case "Late":
						late++;
						present++;
						break;
					case "Leave":
						onLeave++;
						break;
					case "Absent":
						absent++;
						break;
				}
			} else {
				absent++;
			}
		});

		return {
			date,
			totalEmployees: employees.length,
			present,
			absent,
			late,
			onLeave,
		};
	},

	// ========== Outing Requests (Auto‑approved) ==========
	getOutingRequests(): OutingRequest[] {
		if (typeof window === "undefined") return [];
		const data = localStorage.getItem(STORAGE_KEYS.OUTING_REQUESTS);
		return data ? JSON.parse(data) : [];
	},

	saveOutingRequests(requests: OutingRequest[]) {
		localStorage.setItem(
			STORAGE_KEYS.OUTING_REQUESTS,
			JSON.stringify(requests),
		);
	},

	getOutingRequestsByDate(date: string): OutingRequest[] {
		return this.getOutingRequests().filter((r) => r.date === date);
	},

	getOutingRequestsByEmployee(employeeId: string): OutingRequest[] {
		return this.getOutingRequests().filter(
			(r) => r.employeeId === employeeId,
		);
	},

	getPendingOutingRequests(): OutingRequest[] {
		return this.getOutingRequests().filter((r) => r.status === "pending");
	},

	getTodayOutingRequests(): OutingRequest[] {
		const today = new Date().toISOString().split("T")[0];
		return this.getOutingRequestsByDate(today);
	},

	// Auto-approved outing request
	createOutingRequest(
		request: Omit<
			OutingRequest,
			| "id"
			| "status"
			| "reviewedBy"
			| "reviewedAt"
			| "reviewerRemarks"
			| "actualReturnTime"
			| "createdAt"
			| "updatedAt"
		>,
	): OutingRequest {
		const requests = this.getOutingRequests();
		const now = new Date().toISOString();
		const newRequest: OutingRequest = {
			...request,
			id: String(Date.now()),
			status: "approved",
			reviewedBy: null,
			reviewedAt: null,
			reviewerRemarks: "",
			actualReturnTime: null,
			createdAt: now,
			updatedAt: now,
		};
		requests.push(newRequest);
		this.saveOutingRequests(requests);
		return newRequest;
	},

	reviewOutingRequest(
		requestId: string,
		decision: "approved" | "denied",
		reviewerId: string,
		remarks: string = "",
	): OutingRequest | null {
		const requests = this.getOutingRequests();
		const index = requests.findIndex((r) => r.id === requestId);
		if (index === -1) return null;
		requests[index] = {
			...requests[index],
			status: decision,
			reviewedBy: reviewerId,
			reviewedAt: new Date().toISOString(),
			reviewerRemarks: remarks,
			updatedAt: new Date().toISOString(),
		};
		this.saveOutingRequests(requests);
		return requests[index];
	},

	markOutingReturn(requestId: string): OutingRequest | null {
		const requests = this.getOutingRequests();
		const index = requests.findIndex((r) => r.id === requestId);
		if (index === -1) return null;
		const now = new Date();
		const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
		requests[index] = {
			...requests[index],
			actualReturnTime: timeStr,
			updatedAt: new Date().toISOString(),
		};
		this.saveOutingRequests(requests);
		return requests[index];
	},

	// ========== Leave Requests ==========
	getLeaveRequests(): LeaveRequest[] {
		if (typeof window === "undefined") return [];
		const data = localStorage.getItem(STORAGE_KEYS.LEAVE_REQUESTS);
		return data ? JSON.parse(data) : [];
	},

	saveLeaveRequests(requests: LeaveRequest[]) {
		localStorage.setItem(
			STORAGE_KEYS.LEAVE_REQUESTS,
			JSON.stringify(requests),
		);
	},

	createLeaveRequest(
		leaveRequest: Omit<LeaveRequest, "id" | "createdAt">,
	): LeaveRequest {
		const requests = this.getLeaveRequests();
		const newRequest: LeaveRequest = {
			...leaveRequest,
			id: String(Date.now()),
			createdAt: new Date().toISOString(),
		};
		requests.push(newRequest);
		this.saveLeaveRequests(requests);

		// Automatically mark attendance as "Leave" for the entire date range
		const start = new Date(leaveRequest.startDate);
		const end = new Date(leaveRequest.endDate);
		const currentDate = new Date(start);

		while (currentDate <= end) {
			const dateStr = currentDate.toISOString().split("T")[0];
			const existingAttendance = this.getAttendanceByDate(dateStr);
			const existingRecord = existingAttendance.find(
				(a) => a.employeeId === leaveRequest.employeeId,
			);

			if (existingRecord) {
				// Update existing record to Leave
				const updatedRecord = {
					...existingRecord,
					status: "Leave" as const,
					checkIn: null,
					checkOut: null,
					remarks: `On leave: ${leaveRequest.reason}`,
					updatedAt: new Date().toISOString(),
				};
				const allAttendance = this.getAttendance();
				const index = allAttendance.findIndex(
					(a) => a.id === existingRecord.id,
				);
				if (index !== -1) {
					allAttendance[index] = updatedRecord;
					this.saveAttendance(allAttendance);
				}
			} else {
				// Create new leave record
				this.markAttendance({
					employeeId: leaveRequest.employeeId,
					date: dateStr,
					checkIn: null,
					checkOut: null,
					status: "Leave",
					remarks: `On leave: ${leaveRequest.reason}`,
				});
			}
			currentDate.setDate(currentDate.getDate() + 1);
		}
		return newRequest;
	},

	// ========== Helper for TV Dashboard ==========
	getEmployeeCurrentStatus(
		employeeId: string,
		date: string,
	): { status: string; remarks: string } {
		const attendance = this.getAttendanceByDate(date);
		const record = attendance.find((a) => a.employeeId === employeeId);
		const outings = this.getOutingRequestsByEmployee(employeeId);
		const activeOuting = outings.find(
			(o) =>
				o.date === date &&
				o.status === "approved" &&
				!o.actualReturnTime,
		);

		if (activeOuting) {
			if (activeOuting.purpose === "official") {
				return {
					status: "On Duty",
					remarks: `Official duty - ${activeOuting.reason}`,
				};
			}
			return {
				status: "Out of Office",
				remarks: `Personal outing - ${activeOuting.reason}`,
			};
		}

		if (record?.status === "Leave") {
			return {
				status: "Out of Office",
				remarks: `On leave - ${record.remarks}`,
			};
		}

		if (record?.status === "Present" || record?.status === "Late") {
			if (record?.checkOut) {
				return { status: "Out of Office", remarks: "Checked out" };
			}
			return {
				status: "In Office",
				remarks: record.status === "Late" ? "Late arrival" : "On time",
			};
		}

		return { status: "Out of Office", remarks: "Not checked in" };
	},
};
