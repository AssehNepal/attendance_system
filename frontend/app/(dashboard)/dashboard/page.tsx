"use client";
import { useState, useEffect } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { dataStore } from "@/lib/data-store";
import type {
	Employee,
	AttendanceRecord,
	DailyStats,
	OutingRequest,
} from "@/lib/types";
import {
	Users,
	UserCheck,
	UserX,
	CalendarX,
	TrendingUp,
	ArrowLeftRight,
	DoorOpen,
	Clock,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	PieChart,
	Pie,
	Cell,
	Legend,
} from "recharts";

export default function DashboardPage() {
	const [employees, setEmployees] = useState<Employee[]>([]);
	const [employeeMap, setEmployeeMap] = useState<Map<string, Employee>>(
		new Map(),
	);
	const [stats, setStats] = useState<DailyStats | null>(null);
	const [recentAttendance, setRecentAttendance] = useState<
		AttendanceRecord[]
	>([]);
	const [weeklyData, setWeeklyData] = useState<
		{ day: string; present: number; absent: number; leave: number }[]
	>([]);
	const [outingRequests, setOutingRequests] = useState<OutingRequest[]>([]);

	const today = new Date().toISOString().split("T")[0];

	useEffect(() => {
		dataStore.init();
		loadData();

		const interval = setInterval(loadData, 30000);
		return () => clearInterval(interval);
	}, []);

	const loadData = () => {
		const emps = dataStore
			.getEmployees()
			.filter((e) => e.status === "Active");
		const todayAttendance = dataStore.getAttendanceByDate(today);
		const todayOutings = dataStore.getTodayOutingRequests();

		setEmployees(emps);

		const map = new Map();
		emps.forEach((emp) => {
			map.set(emp.id, emp);
			map.set(emp.employeeId, emp);
		});
		setEmployeeMap(map);

		const validAttendance = todayAttendance.filter((record) =>
			emps.some((emp) => emp.id === record.employeeId),
		);

		setRecentAttendance(validAttendance);
		setOutingRequests(todayOutings);

		const accurateStats = calculateAccurateStats(emps, validAttendance);
		setStats(accurateStats);

		const weekly: {
			day: string;
			present: number;
			absent: number;
			leave: number;
		}[] = [];

		for (let i = 6; i >= 0; i--) {
			const date = new Date();
			date.setDate(date.getDate() - i);
			const dayOfWeek = date.getDay();
			if (dayOfWeek === 0 || dayOfWeek === 6) continue;

			const dateStr = date.toISOString().split("T")[0];
			const dayAttendance = dataStore.getAttendanceByDate(dateStr);

			let present = 0,
				absent = 0,
				leave = 0;

			emps.forEach((emp) => {
				const record = dayAttendance.find(
					(a) => a.employeeId === emp.id,
				);
				if (record) {
					if (record.status === "Present" || record.status === "Late")
						present++;
					else if (record.status === "Leave") leave++;
					else if (record.status === "Absent") absent++;
				} else {
					absent++;
				}
			});

			weekly.push({
				day: date.toLocaleDateString("en-US", { weekday: "short" }),
				present: Math.max(0, present),
				absent: Math.max(0, absent),
				leave: Math.max(0, leave),
			});
		}
		setWeeklyData(weekly);
	};

	const calculateAccurateStats = (
		emps: Employee[],
		todayAttendance: AttendanceRecord[],
	): DailyStats => {
		let present = 0,
			late = 0,
			onLeave = 0,
			absent = 0;

		emps.forEach((emp) => {
			const record = todayAttendance.find((a) => a.employeeId === emp.id);

			if (record) {
				switch (record.status) {
					case "Present":
						present++;
						break;
					case "Late":
						late++;
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
			date: today,
			totalEmployees: emps.length,
			present,
			absent,
			late,
			onLeave,
		};
	};

	const getEmployeeName = (employeeId: string) => {
		let employee = employeeMap.get(employeeId);
		if (!employee)
			employee = employees.find(
				(e) => e.id === employeeId || e.employeeId === employeeId,
			);
		return employee?.name ?? "Unknown";
	};

	const currentlyOutStaff = outingRequests.filter(
		(r) => r.status === "approved" && !r.actualReturnTime,
	);

	const totalPresent = (stats?.present ?? 0) + (stats?.late ?? 0);
	const totalAbsent = Math.max(
		0,
		employees.length - totalPresent - (stats?.onLeave ?? 0),
	);

	const pieData = [
		{ name: "Present", value: totalPresent, color: "#10b981" },
		{ name: "Leave", value: stats?.onLeave ?? 0, color: "#8b5cf6" },
		{ name: "Absent", value: totalAbsent, color: "#ef4444" },
	].filter((item) => item.value > 0);

	const renderLegend = (props: any) => {
		const { payload } = props;
		return (
			<div className="flex justify-center gap-6 mt-2">
				{payload.map((entry: any, index: number) => (
					<div
						key={`item-${index}`}
						className="flex items-center gap-2"
					>
						<div
							className="h-3 w-3 rounded-full"
							style={{ backgroundColor: entry.color }}
						/>
						<span className="text-xs text-muted-foreground">
							{entry.value}
						</span>
					</div>
				))}
			</div>
		);
	};

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold text-foreground">
					Dashboard
				</h1>
				<p className="text-muted-foreground">
					Overview of today&apos;s attendance -{" "}
					{new Date().toLocaleDateString("en-US", {
						weekday: "long",
						year: "numeric",
						month: "long",
						day: "numeric",
					})}
				</p>
			</div>

			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
				<StatsCard
					icon={<Users className="h-6 w-6 text-slate-600" />}
					label="Total Employees"
					value={employees.length}
				/>
				<StatsCard
					icon={<UserCheck className="h-6 w-6 text-emerald-600" />}
					label="Present Today"
					value={totalPresent}
				/>
				<StatsCard
					icon={<UserX className="h-6 w-6 text-rose-600" />}
					label="Absent Today"
					value={totalAbsent}
				/>
				<StatsCard
					icon={<CalendarX className="h-6 w-6 text-purple-600" />}
					label="On Leave"
					value={stats?.onLeave ?? 0}
				/>
			</div>

			<div className="grid gap-4 lg:grid-cols-2">
				<Card className="border-0 shadow-sm">
					<CardHeader className="pb-2">
						<CardTitle className="flex items-center gap-2 text-base">
							<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
								<TrendingUp className="h-4 w-4 text-primary" />
							</div>
							Weekly Attendance
						</CardTitle>
						<CardDescription>
							Attendance trend for the last 7 days (Present,
							Absent, Leave)
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="h-[320px] w-full">
							<ResponsiveContainer width="100%" height="100%">
								<BarChart
									data={weeklyData}
									margin={{
										top: 20,
										right: 30,
										left: 20,
										bottom: 5,
									}}
								>
									<CartesianGrid
										strokeDasharray="3 3"
										opacity={0.3}
									/>
									<XAxis
										dataKey="day"
										tick={{ fontSize: 12 }}
										axisLine={false}
										tickLine={false}
									/>
									<YAxis
										tick={{ fontSize: 12 }}
										axisLine={false}
										tickLine={false}
										domain={[0, "dataMax + 2"]}
										allowDecimals={false}
									/>
									<Tooltip
										content={({
											active,
											payload,
											label,
										}: any) => {
											if (!active || !payload?.length)
												return null;
											return (
												<div className="rounded-lg border bg-white p-3 shadow-xl min-w-[160px]">
													<p className="mb-2 font-semibold text-gray-900">
														{label}
													</p>
													{payload.map(
														(
															entry: any,
															i: number,
														) => (
															<div
																key={i}
																className="flex items-center justify-between gap-4 text-sm mb-1"
															>
																<div className="flex items-center gap-2">
																	<div
																		className="h-2 w-2 rounded-full"
																		style={{
																			backgroundColor:
																				entry.color,
																		}}
																	/>
																	<span className="text-gray-600">
																		{
																			entry.name
																		}
																	</span>
																</div>
																<span className="font-semibold text-gray-900">
																	{
																		entry.value
																	}
																</span>
															</div>
														),
													)}
												</div>
											);
										}}
									/>
									<Legend content={renderLegend} />
									<Bar
										dataKey="present"
										name="Present"
										fill="#10b981"
										radius={[6, 6, 0, 0]}
										maxBarSize={40}
									/>
									<Bar
										dataKey="absent"
										name="Absent"
										fill="#ef4444"
										radius={[6, 6, 0, 0]}
										maxBarSize={40}
									/>
									<Bar
										dataKey="leave"
										name="Leave"
										fill="#8b5cf6"
										radius={[6, 6, 0, 0]}
										maxBarSize={40}
									/>
								</BarChart>
							</ResponsiveContainer>
						</div>
					</CardContent>
				</Card>

				<Card className="border-0 shadow-sm">
					<CardHeader className="pb-2">
						<CardTitle className="flex items-center gap-2 text-base">
							<div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
								<Users className="h-4 w-4 text-emerald-500" />
							</div>
							Today&apos;s Distribution
						</CardTitle>
						<CardDescription>
							Attendance breakdown for today
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="h-[320px] w-full">
							<ResponsiveContainer width="100%" height="100%">
								<PieChart>
									<Pie
										data={pieData}
										cx="50%"
										cy="50%"
										innerRadius={60}
										outerRadius={100}
										paddingAngle={3}
										dataKey="value"
										labelLine={false}
										label={({ name, percent }) =>
											`${name} ${(percent * 100).toFixed(0)}%`
										}
									>
										{pieData.map((entry, index) => (
											<Cell
												key={index}
												fill={entry.color}
											/>
										))}
									</Pie>
									<Tooltip
										content={({ active, payload }: any) => {
											if (!active || !payload?.length)
												return null;
											return (
												<div className="rounded-lg border bg-white p-3 shadow-xl">
													<div className="flex items-center justify-between gap-6 text-sm">
														<div className="flex items-center gap-2">
															<div
																className="h-2 w-2 rounded-full"
																style={{
																	backgroundColor:
																		payload[0]
																			.payload
																			.color,
																}}
															/>
															<span className="text-gray-600">
																{
																	payload[0]
																		.name
																}
															</span>
														</div>
														<span className="font-semibold text-gray-900">
															{payload[0].value}
														</span>
													</div>
												</div>
											);
										}}
									/>
								</PieChart>
							</ResponsiveContainer>
						</div>
						<div className="mt-4 text-center text-xs text-muted-foreground">
							Total accounted:{" "}
							{pieData.reduce((sum, item) => sum + item.value, 0)}{" "}
							/ {employees.length} employees
						</div>
					</CardContent>
				</Card>
			</div>

			<Card className="border-0 shadow-sm">
				<CardHeader className="pb-2">
					<CardTitle className="flex items-center gap-2 text-base">
						<div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
							<Clock className="h-4 w-4 text-blue-500" />
						</div>
						Today's Staff Status
					</CardTitle>
					<CardDescription>
						Current status of all staff members
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{recentAttendance.length === 0 &&
						employees.length > 0 ? (
							<div className="text-center py-12">
								<Clock className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
								<p className="text-muted-foreground">
									No attendance records for today yet
								</p>
							</div>
						) : (
							employees.slice(0, 10).map((employee) => {
								const record = recentAttendance.find(
									(a) => a.employeeId === employee.id,
								);
								const isOut = currentlyOutStaff.some(
									(o) => o.employeeId === employee.id,
								);
								let displayStatus = "Not Checked In";
								let statusColor = "bg-slate-100 text-slate-700";

								if (record?.status === "Leave") {
									displayStatus = "On Leave";
									statusColor =
										"bg-purple-100 text-purple-700";
								} else if (isOut) {
									displayStatus = "Currently Out";
									statusColor = "bg-amber-100 text-amber-700";
								} else if (record?.checkIn) {
									displayStatus = record.checkOut
										? "Checked Out"
										: "In Office";
									statusColor = record.checkOut
										? "bg-blue-100 text-blue-700"
										: "bg-emerald-100 text-emerald-700";
								}

								return (
									<div
										key={employee.id}
										className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
									>
										<div className="flex items-center gap-3">
											<div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0B2E4F] text-white text-sm font-semibold">
												{employee.name.charAt(0)}
											</div>
											<div>
												<p className="font-medium text-foreground">
													{employee.name}
												</p>
												<p className="text-sm text-muted-foreground">
													{employee.department}
												</p>
											</div>
										</div>
										<Badge
											className={cn(
												"rounded-full px-3 py-1 text-xs font-medium",
												statusColor,
											)}
										>
											{displayStatus}
										</Badge>
									</div>
								);
							})
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

function StatsCard({
	icon,
	label,
	value,
}: {
	icon: React.ReactNode;
	label: string;
	value: number;
}) {
	return (
		<Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200">
			<CardContent className="p-4">
				<div className="flex items-center justify-between gap-2">
					<div className="space-y-1 min-w-0">
						<p className="text-sm font-medium text-slate-500 truncate">
							{label}
						</p>
						<p className="text-2xl font-bold text-slate-900">
							{Math.max(0, value)}
						</p>
					</div>
					<div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 shrink-0">
						{icon}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
