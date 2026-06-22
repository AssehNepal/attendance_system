"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
	Search,
	ChevronLeft,
	ChevronRight,
	Users,
	UserCheck,
	UserX,
	CalendarX,
	RefreshCw,
	Building2,
	UserCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchDepartments } from "@/lib/services/departmentApi";
import {
	fetchDailySummary,
	type DailySummary,
	type AttendanceStaff,
} from "@/lib/services/attendanceApi";

// Helper to format date to YYYY-MM-DD
const formatDate = (date: Date) => date.toISOString().split("T")[0];

export default function AttendancePage() {
	const [loading, setLoading] = useState(true);
	const [apiError, setApiError] = useState<string | null>(null);
	const [summary, setSummary] = useState<DailySummary | null>(null);
	const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
	const [searchQuery, setSearchQuery] = useState("");
	const [departmentFilter, setDepartmentFilter] = useState<string>("all");
	const [isRefreshing, setIsRefreshing] = useState(false);

	const [departments, setDepartments] = useState<
		{ id: string; name: string }[]
	>([]);

	const today = formatDate(new Date());
	const isFutureDate = selectedDate > today;

	// Load departments once
	useEffect(() => {
		const loadDepartments = async () => {
			try {
				const depts = await fetchDepartments();
				setDepartments(depts.map((d) => ({ id: d.id, name: d.name })));
			} catch (err) {
				toast.error("Failed to load departments");
			}
		};
		loadDepartments();
	}, []);

	// Fetch attendance data when date or department changes
	const fetchAttendance = useCallback(
		async (date: string, departmentId?: string) => {
			if (isFutureDate) {
				setSummary(null);
				setLoading(false);
				return;
			}
			try {
				setLoading(true);
				const data = await fetchDailySummary(date, departmentId);
				setSummary(data);
				setApiError(null);
			} catch (err) {
				setApiError(
					err instanceof Error
						? err.message
						: "Failed to load attendance",
				);
				toast.error("Failed to load attendance data");
				setSummary(null);
			} finally {
				setLoading(false);
			}
		},
		[isFutureDate],
	);

	// Trigger fetch when date or department filter changes
	useEffect(() => {
		if (!isFutureDate) {
			fetchAttendance(
				selectedDate,
				departmentFilter === "all" ? undefined : departmentFilter,
			);
		} else {
			setSummary(null);
			setLoading(false);
		}
	}, [selectedDate, departmentFilter, fetchAttendance, isFutureDate]);

	const refreshData = async () => {
		setIsRefreshing(true);
		await fetchAttendance(
			selectedDate,
			departmentFilter === "all" ? undefined : departmentFilter,
		);
		setIsRefreshing(false);
	};

	const changeDate = (days: number) => {
		const date = new Date(selectedDate);
		date.setDate(date.getDate() + days);
		setSelectedDate(formatDate(date));
	};

	// Stats computed from the full staff array (department‑filtered by API)
	const departmentStaff = summary?.staff || [];
	const totalStaff = departmentStaff.length;
	const presentCount = departmentStaff.filter(
		(s) => s.status === "present",
	).length;
	const absentCount = departmentStaff.filter(
		(s) => s.status === "absent",
	).length;
	const leaveCount = departmentStaff.filter(
		(s) => s.status === "leave",
	).length;

	// Table filtering by search query (client‑side)
	const filteredStaff = departmentStaff.filter((item) => {
		const staff = item.staff;
		const query = searchQuery.toLowerCase();
		return (
			staff.name.toLowerCase().includes(query) ||
			staff.employeeId.toLowerCase().includes(query)
		);
	});

	const getStatusBadge = (status: AttendanceStaff["status"]) => {
		const statusColors: Record<string, string> = {
			present: "bg-emerald-50 text-emerald-700",
			absent: "bg-red-50 text-red-700",
			late: "bg-amber-50 text-amber-700",
			leave: "bg-purple-50 text-purple-700",
		};
		const icons = {
			present: (
				<span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
			),
			absent: (
				<span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-red-500 inline-block" />
			),
			late: (
				<span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 inline-block" />
			),
			leave: (
				<span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-purple-500 inline-block" />
			),
		};
		return (
			<Badge
				variant="secondary"
				className={cn(
					"px-2 py-0.5 text-xs font-medium border-0",
					statusColors[status],
				)}
			>
				{icons[status]}
				{status.charAt(0).toUpperCase() + status.slice(1)}
			</Badge>
		);
	};

	return (
		<div className="w-full min-w-0 overflow-hidden">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
				<div className="space-y-1">
					<h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
						Attendance
					</h1>
					<p className="text-sm sm:text-base text-slate-500">
						View daily employee attendance records
					</p>
				</div>
				<Button
					onClick={refreshData}
					disabled={isRefreshing}
					variant="outline"
					className="gap-2 shrink-0 hover:bg-[#0B2E4F] hover:text-white transition-colors"
				>
					<RefreshCw
						className={cn(
							"h-4 w-4",
							isRefreshing && "animate-spin",
						)}
					/>
					{isRefreshing ? "Refreshing..." : "Refresh"}
				</Button>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
				<StatCard
					label="Total Staff"
					value={totalStaff}
					icon={<Users className="h-4 w-4 sm:h-5 sm:w-5" />}
					iconBgColor="bg-violet-100"
					iconColor="text-violet-600"
				/>
				<StatCard
					label="Present"
					value={presentCount}
					icon={<UserCheck className="h-4 w-4 sm:h-5 sm:w-5" />}
					iconBgColor="bg-emerald-100"
					iconColor="text-emerald-600"
				/>
				<StatCard
					label="Absent"
					value={absentCount}
					icon={<UserX className="h-4 w-4 sm:h-5 sm:w-5" />}
					iconBgColor="bg-red-100"
					iconColor="text-red-600"
				/>
				<StatCard
					label="On Leave"
					value={leaveCount}
					icon={<CalendarX className="h-4 w-4 sm:h-5 sm:w-5" />}
					iconBgColor="bg-purple-100"
					iconColor="text-purple-600"
				/>
			</div>

			{/* Date Navigation & Filters */}
			<Card className="border border-slate-200 shadow-none bg-white mb-4">
				<CardContent className="p-3 sm:p-4">
					<div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
						<div className="flex items-center gap-2 shrink-0">
							<Button
								variant="outline"
								size="icon"
								onClick={() => changeDate(-1)}
								className="h-9 w-9 border-slate-200 hover:bg-[#0B2E4F] hover:text-white transition-colors"
							>
								<ChevronLeft className="h-4 w-4" />
							</Button>
							<Input
								type="date"
								value={selectedDate}
								onChange={(e) =>
									setSelectedDate(e.target.value)
								}
								className="w-[160px] h-9 border-slate-200 focus:border-[#0B2E4F] focus:ring-[#0B2E4F]"
							/>
							<Button
								variant="outline"
								size="icon"
								onClick={() => changeDate(1)}
								className="h-9 w-9 border-slate-200 hover:bg-[#0B2E4F] hover:text-white transition-colors"
							>
								<ChevronRight className="h-4 w-4" />
							</Button>
							<Button
								variant="outline"
								onClick={() => setSelectedDate(today)}
								className="h-9 border-slate-200 hover:bg-[#0B2E4F] hover:text-white transition-colors"
							>
								Today
							</Button>
						</div>

						<div className="flex-1" />

						<div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
							{/* Search Input */}
							<div className="relative">
								<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
								<Input
									placeholder="Search employee..."
									value={searchQuery}
									onChange={(e) =>
										setSearchQuery(e.target.value)
									}
									className="pl-10 w-full sm:w-[200px] h-9 border-slate-200 focus:border-[#0B2E4F] focus:ring-[#0B2E4F]"
								/>
							</div>

							{/* Department Dropdown - using shadcn Select */}
							<Select
								value={departmentFilter}
								onValueChange={setDepartmentFilter}
							>
								<SelectTrigger className="w-full sm:w-[180px] h-9 border-slate-200 focus:ring-[#0B2E4F] focus:border-[#0B2E4F]">
									<Building2 className="h-4 w-4 mr-2 text-slate-500" />
									<SelectValue placeholder="Department" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem
										value="all"
										className="cursor-pointer hover:bg-[#0B2E4F] hover:text-white focus:bg-[#0B2E4F] focus:text-white"
									>
										All Departments
									</SelectItem>
									{departments.map((dept) => (
										<SelectItem
											key={dept.id}
											value={dept.id}
											className="cursor-pointer hover:bg-[#0B2E4F] hover:text-white focus:bg-[#0B2E4F] focus:text-white"
										>
											{dept.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Table */}
			<div className="w-full overflow-x-auto">
				<div className="min-w-[800px]">
					{/* Header */}
					<div className="grid grid-cols-[100px_1.5fr_1.2fr_1fr_1fr] gap-4 border-b border-slate-200 bg-[#0B2E4F] rounded-t-lg px-4">
						<div className="py-3 text-xs font-semibold text-white uppercase tracking-wider">
							ID
						</div>
						<div className="py-3 text-xs font-semibold text-white uppercase tracking-wider">
							Employee
						</div>
						<div className="py-3 text-xs font-semibold text-white uppercase tracking-wider">
							Department
						</div>
						<div className="py-3 text-xs font-semibold text-white uppercase tracking-wider">
							Status
						</div>
						<div className="py-3 text-xs font-semibold text-white uppercase tracking-wider">
							Remarks
						</div>
					</div>

					{/* Body */}
					{loading ? (
						<div className="h-32 flex items-center justify-center text-slate-500 border border-slate-200 rounded-b-lg mt-[-1px] bg-white">
							Loading attendance...
						</div>
					) : apiError ? (
						<div className="h-32 flex items-center justify-center text-red-600 border border-slate-200 rounded-b-lg mt-[-1px] bg-white">
							Error: {apiError}
						</div>
					) : isFutureDate ? (
						<div className="h-32 flex flex-col items-center justify-center text-slate-400 border border-slate-200 rounded-b-lg mt-[-1px] bg-white">
							<CalendarX className="h-8 w-8 mb-2 opacity-50" />
							<p className="text-sm font-medium">Future date</p>
							<p className="text-xs mt-1">
								Attendance data is not available for future
								dates.
							</p>
						</div>
					) : filteredStaff.length === 0 ? (
						<div className="h-32 flex flex-col items-center justify-center text-slate-400 border border-slate-200 rounded-b-lg mt-[-1px] bg-white">
							<Users className="h-8 w-8 mb-2 opacity-50" />
							<p className="text-sm font-medium">
								No attendance records found
							</p>
							<p className="text-xs mt-1">
								Try changing the date or department filter.
							</p>
						</div>
					) : (
						filteredStaff.map((item, index) => {
							const staff = item.staff;
							const departmentName =
								departments.find(
									(d) => d.id === staff.departmentId,
								)?.name || staff.departmentId;
							return (
								<div
									key={staff.id}
									className={cn(
										"grid grid-cols-[100px_1.5fr_1.2fr_1fr_1fr] gap-4 items-center border-l border-r border-b border-slate-200 px-4",
										index % 2 === 0
											? "bg-[#FDFDFD]"
											: "bg-[#F6F6F6]",
										index === 0 && "border-t",
										index === filteredStaff.length - 1 &&
											"rounded-b-lg",
									)}
								>
									<div className="py-3">
										<span className="inline-flex items-center px-2 py-0.5 text-xs font-mono font-medium text-slate-700">
											{staff.employeeId}
										</span>
									</div>
									<div className="py-3 min-w-0">
										<p className="text-sm text-slate-700 truncate">
											{staff.name}
										</p>
									</div>
									<div className="py-3">
										<span className="text-sm text-slate-700 truncate block">
											{departmentName}
										</span>
									</div>
									<div className="py-3">
										{getStatusBadge(item.status)}
									</div>
									<div className="py-3">
										<span className="text-sm text-slate-400 italic">
											Null
										</span>
									</div>
								</div>
							);
						})
					)}
				</div>
			</div>
		</div>
	);
}

function StatCard({
	label,
	value,
	iconBgColor,
	iconColor,
	icon,
}: {
	label: string;
	value: number;
	iconBgColor?: string;
	iconColor?: string;
	icon?: React.ReactNode;
}) {
	return (
		<Card className="border-0 shadow-sm">
			<CardContent className="p-3 sm:p-4">
				<div className="flex items-center justify-between gap-2">
					<div className="space-y-1 min-w-0">
						<p className="text-xs sm:text-sm font-medium text-slate-500 truncate">
							{label}
						</p>
						<p className="text-xl sm:text-2xl font-bold text-slate-900">
							{value.toLocaleString()}
						</p>
					</div>
					{icon && (
						<div
							className={cn(
								"h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center shrink-0",
								iconBgColor,
							)}
						>
							<div
								className={cn(
									"h-4 w-4 sm:h-5 sm:w-5",
									iconColor,
								)}
							>
								{icon}
							</div>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
