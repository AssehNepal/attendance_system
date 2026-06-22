"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
	Plus,
	Pencil,
	Trash2,
	CalendarDays,
	CalendarRange,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
	fetchWeeklyHolidays,
	createWeeklyHoliday,
	updateWeeklyHoliday,
	deleteWeeklyHoliday,
	fetchDateHolidays,
	createDateHoliday,
	updateDateHoliday,
	deleteDateHoliday,
	type WeeklyHoliday,
	type DateHoliday,
} from "@/lib/services/holidayApi";
import { format } from "date-fns";

import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

const daysOfWeek = [
	{ value: 1, label: "Monday" },
	{ value: 2, label: "Tuesday" },
	{ value: 3, label: "Wednesday" },
	{ value: 4, label: "Thursday" },
	{ value: 5, label: "Friday" },
	{ value: 6, label: "Saturday" },
	{ value: 7, label: "Sunday" },
];

const holidayTypeOptions = [
	{ value: "public", label: "Public" },
	{ value: "optional", label: "Optional" },
	{ value: "company", label: "Company Holiday" },
];

export default function HolidaysPage() {
	// ----- Weekly state -----
	const [weeklyHolidays, setWeeklyHolidays] = useState<WeeklyHoliday[]>([]);
	const [weeklyLoading, setWeeklyLoading] = useState(true);
	const [isWeeklyDialogOpen, setIsWeeklyDialogOpen] = useState(false);
	const [editingWeekly, setEditingWeekly] = useState<WeeklyHoliday | null>(
		null,
	);
	const [selectedDay, setSelectedDay] = useState<number>(7);
	const [weeklyActive, setWeeklyActive] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// ----- Date state -----
	const [dateHolidays, setDateHolidays] = useState<DateHoliday[]>([]);
	const [dateLoading, setDateLoading] = useState(true);
	const [isDateDialogOpen, setIsDateDialogOpen] = useState(false);
	const [editingDate, setEditingDate] = useState<DateHoliday | null>(null);
	const [selectedDate, setSelectedDate] = useState("");
	const [dateName, setDateName] = useState("");
	const [dateType, setDateType] = useState<"public" | "optional" | "company">(
		"public",
	);

	// Delete confirmation
	const [deletingWeeklyId, setDeletingWeeklyId] = useState<string | null>(
		null,
	);
	const [deletingDateId, setDeletingDateId] = useState<string | null>(null);

	useEffect(() => {
		loadWeeklyHolidays();
		loadDateHolidays();
	}, []);

	const loadWeeklyHolidays = async () => {
		try {
			setWeeklyLoading(true);
			const data = await fetchWeeklyHolidays();
			setWeeklyHolidays(data);
		} catch (err) {
			toast.error("Failed to load weekly holidays");
		} finally {
			setWeeklyLoading(false);
		}
	};

	const loadDateHolidays = async () => {
		try {
			setDateLoading(true);
			const data = await fetchDateHolidays();
			setDateHolidays(data);
		} catch (err) {
			toast.error("Failed to load date holidays");
		} finally {
			setDateLoading(false);
		}
	};

	const resetWeeklyForm = () => {
		setEditingWeekly(null);
		setSelectedDay(7);
		setWeeklyActive(true);
	};

	const handleSaveWeekly = async () => {
		// Check if the selected day already exists (when creating a new holiday)
		if (!editingWeekly) {
			const alreadyExists = weeklyHolidays.some(
				(h) => h.dayOfWeek === selectedDay,
			);
			if (alreadyExists) {
				const dayName = daysOfWeek.find(
					(d) => d.value === selectedDay,
				)?.label;
				toast.error(
					`${dayName} already has a weekly holiday. Please edit it instead.`,
				);
				return;
			}
		}

		setIsSubmitting(true);
		try {
			if (editingWeekly) {
				await updateWeeklyHoliday(
					editingWeekly.id,
					selectedDay,
					weeklyActive,
				);
				toast.success("Weekly holiday updated");
			} else {
				await createWeeklyHoliday(selectedDay, weeklyActive);
				toast.success("Weekly holiday added");
			}
			setIsWeeklyDialogOpen(false);
			resetWeeklyForm();
			await loadWeeklyHolidays();
		} catch (err: any) {
			console.error("Full error:", err);
			// Try to extract the backend error message
			let errorMsg =
				err?.message ||
				(editingWeekly ? "Failed to update" : "Failed to add");
			// If the error contains a JSON string, parse it
			if (err?.responseBody) {
				try {
					const parsed = JSON.parse(err.responseBody);
					errorMsg = parsed.message || errorMsg;
				} catch (e) {}
			}
			toast.error(errorMsg);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDeleteWeekly = async (id: string) => {
		try {
			await deleteWeeklyHoliday(id);
			toast.success("Weekly holiday deleted");
			await loadWeeklyHolidays();
		} catch (err) {
			toast.error("Failed to delete");
		} finally {
			setDeletingWeeklyId(null);
		}
	};

	const resetDateForm = () => {
		setEditingDate(null);
		setSelectedDate("");
		setDateName("");
		setDateType("public");
	};

	const handleSaveDate = async () => {
		if (!selectedDate) {
			toast.error("Please select a date");
			return;
		}
		if (!dateName.trim()) {
			toast.error("Please enter a holiday name");
			return;
		}
		setIsSubmitting(true);
		try {
			if (editingDate) {
				await updateDateHoliday(
					editingDate.id,
					selectedDate,
					dateName.trim(),
					dateType,
				);
				toast.success("Date holiday updated");
			} else {
				await createDateHoliday(
					selectedDate,
					dateName.trim(),
					dateType,
				);
				toast.success("Date holiday added");
			}
			setIsDateDialogOpen(false);
			resetDateForm();
			await loadDateHolidays();
		} catch (err: any) {
			toast.error(
				err?.message ||
					(editingDate ? "Failed to update" : "Failed to add"),
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDeleteDate = async (id: string) => {
		try {
			await deleteDateHoliday(id);
			toast.success("Date holiday deleted");
			await loadDateHolidays();
		} catch (err) {
			toast.error("Failed to delete");
		} finally {
			setDeletingDateId(null);
		}
	};

	return (
		<div className="w-full min-w-0 overflow-hidden">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
				<div className="space-y-1">
					<h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
						Holidays
					</h1>
					<p className="text-sm sm:text-base text-slate-500">
						Manage weekly recurring holidays and fixed‑date holidays
					</p>
				</div>
			</div>

			<Tabs defaultValue="weekly" className="w-full">
				<TabsList className="grid w-full max-w-md grid-cols-2 bg-slate-100">
					<TabsTrigger
						value="weekly"
						className="data-[state=active]:bg-white data-[state=active]:text-[#0B2E4F]"
					>
						<CalendarRange className="h-4 w-4 mr-2" />
						Weekly Holidays
					</TabsTrigger>
					<TabsTrigger
						value="date"
						className="data-[state=active]:bg-white data-[state=active]:text-[#0B2E4F]"
					>
						<CalendarDays className="h-4 w-4 mr-2" />
						Date Holidays
					</TabsTrigger>
				</TabsList>

				{/* ========== WEEKLY HOLIDAYS ========== */}
				<TabsContent value="weekly" className="mt-4">
					<Card className="border border-slate-200 shadow-none bg-white">
						<CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-3">
							<CardTitle className="text-lg font-semibold text-slate-900">
								Recurring Weekly Holidays
							</CardTitle>
							<Button
								onClick={() => {
									resetWeeklyForm();
									setIsWeeklyDialogOpen(true);
								}}
								className="gap-2 bg-[#0b2e4f] text-white h-9 px-4 hover:bg-white hover:text-[#0b2e4f] hover:border hover:border-[#0b2e4f] transition-colors"
							>
								<Plus className="h-4 w-4" /> Add Weekly Holiday
							</Button>
						</CardHeader>
						<CardContent className="p-0">
							{weeklyLoading ? (
								<div className="py-12 text-center text-slate-500">
									Loading...
								</div>
							) : weeklyHolidays.length === 0 ? (
								<div className="py-12 text-center text-slate-400">
									<CalendarRange className="h-12 w-12 mx-auto mb-3 opacity-50" />
									<p className="text-sm font-medium">
										No weekly holidays defined
									</p>
									<p className="text-xs mt-1">
										Click "Add Weekly Holiday" to create
										one.
									</p>
								</div>
							) : (
								<div className="w-full overflow-x-auto">
									<div className="min-w-[500px]">
										{/* Table Header */}
										<div className="grid grid-cols-[1fr_1fr_80px] gap-0 border-b border-slate-200 bg-[#0B2E4F] rounded-t-lg px-4">
											<div className="py-3 text-xs font-semibold text-white uppercase tracking-wider">
												Day
											</div>
											<div className="py-3 text-xs font-semibold text-white uppercase tracking-wider">
												Status
											</div>
											<div className="py-3 text-xs font-semibold text-white uppercase tracking-wider text-center">
												Actions
											</div>
										</div>

										{weeklyHolidays.map((holiday, idx) => {
											const dayName = daysOfWeek.find(
												(d) =>
													d.value ===
													holiday.dayOfWeek,
											)?.label;
											return (
												<div
													key={holiday.id}
													className={cn(
														"grid grid-cols-[1fr_1fr_80px] gap-0 items-center border-l border-r border-b border-slate-200 px-4",
														idx % 2 === 0
															? "bg-[#FDFDFD]"
															: "bg-[#F6F6F6]",
														idx === 0 && "border-t",
														idx ===
															weeklyHolidays.length -
																1 &&
															"rounded-b-lg",
													)}
												>
													<div className="py-3 text-sm text-slate-700">
														{dayName}
													</div>
													<div className="py-3">
														<Badge
															className={cn(
																"text-xs border-0",
																holiday.isActive
																	? "bg-emerald-50 text-emerald-700"
																	: "bg-slate-100 text-slate-600",
															)}
														>
															{holiday.isActive
																? "Active"
																: "Inactive"}
														</Badge>
													</div>
													<div className="py-3 flex justify-center gap-2">
														<Button
															variant="ghost"
															size="icon"
															onClick={() => {
																setEditingWeekly(
																	holiday,
																);
																setSelectedDay(
																	holiday.dayOfWeek,
																);
																setWeeklyActive(
																	holiday.isActive,
																);
																setIsWeeklyDialogOpen(
																	true,
																);
															}}
															className="h-8 w-8 text-slate-400 hover:text-[#0B2E4F] hover:bg-[#0B2E4F]/10"
														>
															<Pencil className="h-4 w-4" />
														</Button>
														<Button
															variant="ghost"
															size="icon"
															onClick={() =>
																setDeletingWeeklyId(
																	holiday.id,
																)
															}
															className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
														>
															<Trash2 className="h-4 w-4" />
														</Button>
													</div>
												</div>
											);
										})}
									</div>
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* ========== DATE HOLIDAYS ========== */}
				<TabsContent value="date" className="mt-4">
					<Card className="border border-slate-200 shadow-none bg-white">
						<CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-3">
							<CardTitle className="text-lg font-semibold text-slate-900">
								Fixed Date Holidays
							</CardTitle>
							<Button
								onClick={() => {
									resetDateForm();
									setIsDateDialogOpen(true);
								}}
								className="gap-2 bg-[#0b2e4f] text-white h-9 px-4 hover:bg-white hover:text-[#0b2e4f] hover:border hover:border-[#0b2e4f] transition-colors"
							>
								<Plus className="h-4 w-4" /> Add Date Holiday
							</Button>
						</CardHeader>
						<CardContent className="p-0">
							{dateLoading ? (
								<div className="py-12 text-center text-slate-500">
									Loading...
								</div>
							) : dateHolidays.length === 0 ? (
								<div className="py-12 text-center text-slate-400">
									<CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-50" />
									<p className="text-sm font-medium">
										No date holidays defined
									</p>
									<p className="text-xs mt-1">
										Click "Add Date Holiday" to create one.
									</p>
								</div>
							) : (
								<div className="w-full overflow-x-auto">
									<div className="min-w-[700px]">
										<div className="grid grid-cols-[1.2fr_2fr_1.2fr_80px] gap-0 border-b border-slate-200 bg-[#0B2E4F] rounded-t-lg px-4">
											<div className="py-3 text-xs font-semibold text-white uppercase tracking-wider">
												Date
											</div>
											<div className="py-3 text-xs font-semibold text-white uppercase tracking-wider">
												Name
											</div>
											<div className="py-3 text-xs font-semibold text-white uppercase tracking-wider">
												Type
											</div>
											<div className="py-3 text-xs font-semibold text-white uppercase tracking-wider text-center">
												Actions
											</div>
										</div>

										{dateHolidays.map((holiday, idx) => (
											<div
												key={holiday.id}
												className={cn(
													"grid grid-cols-[1.2fr_2fr_1.2fr_80px] gap-0 items-center border-l border-r border-b border-slate-200 px-4",
													idx % 2 === 0
														? "bg-[#FDFDFD]"
														: "bg-[#F6F6F6]",
													idx === 0 && "border-t",
													idx ===
														dateHolidays.length -
															1 && "rounded-b-lg",
												)}
											>
												<div className="py-3 text-sm text-slate-700">
													{new Date(
														holiday.holidayDate,
													).toLocaleDateString()}
												</div>
												<div className="py-3 text-sm font-medium text-slate-900">
													{holiday.name}
												</div>
												<div className="py-3">
													<Badge
														variant="secondary"
														className="bg-slate-100 text-slate-700"
													>
														{holiday.type}
													</Badge>
												</div>
												<div className="py-3 flex justify-center gap-2">
													<Button
														variant="ghost"
														size="icon"
														onClick={() => {
															setEditingDate(
																holiday,
															);
															setSelectedDate(
																holiday.holidayDate,
															);
															setDateName(
																holiday.name,
															);
															setDateType(
																holiday.type,
															);
															setIsDateDialogOpen(
																true,
															);
														}}
														className="h-8 w-8 text-slate-400 hover:text-[#0B2E4F] hover:bg-[#0B2E4F]/10"
													>
														<Pencil className="h-4 w-4" />
													</Button>
													<Button
														variant="ghost"
														size="icon"
														onClick={() =>
															setDeletingDateId(
																holiday.id,
															)
														}
														className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
													>
														<Trash2 className="h-4 w-4" />
													</Button>
												</div>
											</div>
										))}
									</div>
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			{/* --- Dialog: Add/Edit Weekly Holiday --- */}
			<Dialog
				open={isWeeklyDialogOpen}
				onOpenChange={setIsWeeklyDialogOpen}
			>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>
							{editingWeekly
								? "Edit Weekly Holiday"
								: "Add Weekly Holiday"}
						</DialogTitle>
						<DialogDescription>
							{editingWeekly
								? "Update the day and status."
								: "Select a day of the week that will be a weekly holiday."}
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-2">
						<div>
							<label className="text-sm font-medium text-slate-700 mb-1 block">
								Day of Week
							</label>
							<Select
								value={selectedDay.toString()}
								onValueChange={(v) =>
									setSelectedDay(parseInt(v))
								}
							>
								<SelectTrigger className="focus:ring-[#0B2E4F] focus:border-[#0B2E4F]">
									<SelectValue placeholder="Select day" />
								</SelectTrigger>
								<SelectContent>
									{daysOfWeek.map((day) => (
										<SelectItem
											key={day.value}
											value={day.value.toString()}
											className="cursor-pointer hover:bg-[#0B2E4F] hover:text-white focus:bg-[#0B2E4F] focus:text-white"
										>
											{day.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="flex items-center justify-between">
							<label className="text-sm font-medium text-slate-700">
								Active
							</label>
							<Switch
								checked={weeklyActive}
								onCheckedChange={setWeeklyActive}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsWeeklyDialogOpen(false)}
						>
							Cancel
						</Button>
						<Button
							onClick={handleSaveWeekly}
							disabled={isSubmitting}
							className="bg-[#0b2e4f] text-white hover:bg-white hover:text-[#0b2e4f] hover:border hover:border-[#0b2e4f]"
						>
							{isSubmitting
								? "Saving..."
								: editingWeekly
									? "Update"
									: "Add"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* --- Dialog: Add/Edit Date Holiday --- */}
			<Dialog open={isDateDialogOpen} onOpenChange={setIsDateDialogOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>
							{editingDate
								? "Edit Date Holiday"
								: "Add Date Holiday"}
						</DialogTitle>
						<DialogDescription>
							{editingDate
								? "Update the date, name, or type."
								: "Enter a fixed date holiday."}
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-2">
						{/* New date picker */}
						{/* Date picker – native input with consistent styling */}
						<div>
							<label className="text-sm font-medium text-slate-700 mb-1 block">
								Date
							</label>
							<Input
								type="date"
								value={selectedDate}
								onChange={(e) =>
									setSelectedDate(e.target.value)
								}
								className="w-full border-slate-200 focus:border-[#0B2E4F] focus:ring-[#0B2E4F]"
							/>
						</div>

						{/* Holiday Name */}
						<div>
							<label className="text-sm font-medium text-slate-700 mb-1 block">
								Holiday Name
							</label>
							<Input
								placeholder="e.g., National Day"
								value={dateName}
								onChange={(e) => setDateName(e.target.value)}
							/>
						</div>

						{/* Type */}
						<div>
							<label className="text-sm font-medium text-slate-700 mb-1 block">
								Type
							</label>
							<Select
								value={dateType}
								onValueChange={(v: any) => setDateType(v)}
							>
								<SelectTrigger className="focus:ring-[#0B2E4F] focus:border-[#0B2E4F]">
									<SelectValue placeholder="Select type" />
								</SelectTrigger>
								<SelectContent>
									{holidayTypeOptions.map((opt) => (
										<SelectItem
											key={opt.value}
											value={opt.value}
											className="cursor-pointer hover:bg-[#0B2E4F] hover:text-white focus:bg-[#0B2E4F] focus:text-white"
										>
											{opt.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsDateDialogOpen(false)}
						>
							Cancel
						</Button>
						<Button
							onClick={handleSaveDate}
							disabled={isSubmitting}
							className="bg-[#0b2e4f] text-white hover:bg-white hover:text-[#0b2e4f] hover:border hover:border-[#0b2e4f]"
						>
							{isSubmitting
								? "Saving..."
								: editingDate
									? "Update"
									: "Add"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* --- Delete Confirmation Dialog --- */}
			<Dialog
				open={!!deletingWeeklyId || !!deletingDateId}
				onOpenChange={() => {
					setDeletingWeeklyId(null);
					setDeletingDateId(null);
				}}
			>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Confirm Delete</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete this holiday? This
							action cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setDeletingWeeklyId(null);
								setDeletingDateId(null);
							}}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={() => {
								if (deletingWeeklyId)
									handleDeleteWeekly(deletingWeeklyId);
								if (deletingDateId)
									handleDeleteDate(deletingDateId);
							}}
						>
							Delete
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
