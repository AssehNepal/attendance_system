"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
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
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Field, FieldLabel } from "@/components/ui/field";
import type { Employee } from "@/lib/services/employeeApi";
import {
	fetchEmployees,
	fetchEmployeesByOffice,
	createEmployee,
	updateEmployee,
	deleteEmployee,
	deleteStaffPhoto,
	type EmployeeFormData,
} from "@/lib/services/employeeApi";
import { fetchDepartments } from "@/lib/services/departmentApi";
import {
	Plus,
	Search,
	Pencil,
	Trash2,
	Users,
	Building2,
	Calendar,
	UserCircle,
	Upload,
	X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const emptyFormData: EmployeeFormData = {
	employeeId: "",
	cidNo: "",
	name: "",
	contactNo: "",
	email: "",
	departmentId: "",
	employmentType: "regular",
	photo: null,
	isActive: true,
};

type ValidationErrors = {
	employeeId?: string;
	cidNo?: string;
	name?: string;
	email?: string;
	departmentId?: string;
	contactNo?: string;
	employmentType?: string;
};

export default function EmployeesPage() {
	const [employees, setEmployees] = useState<Employee[]>([]);
	const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [departmentFilter, setDepartmentFilter] = useState<string>("all");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [loading, setLoading] = useState(true);
	const [apiError, setApiError] = useState<string | null>(null);

	const [departments, setDepartments] = useState<
		{ id: string; name: string }[]
	>([]);

	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [editingEmployee, setEditingEmployee] = useState<Employee | null>(
		null,
	);
	const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(
		null,
	);
	const [formData, setFormData] = useState<EmployeeFormData>(emptyFormData);
	const [errors, setErrors] = useState<ValidationErrors>({});
	const [touched, setTouched] = useState<Record<string, boolean>>({});
	const [photoPreview, setPhotoPreview] = useState<string | null>(null);
	const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(
		null,
	);
	const [removePhoto, setRemovePhoto] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

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

	// Load employees based on department filter (calls backend)
	const loadEmployees = async (departmentId?: string) => {
		try {
			setLoading(true);
			let emps: Employee[];
			if (departmentId && departmentId !== "all") {
				emps = await fetchEmployeesByOffice(departmentId);
			} else {
				emps = await fetchEmployees();
			}
			setEmployees(emps);
			setApiError(null);
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : "Failed to load employees";
			setApiError(errorMsg);
			console.error("Error loading employees:", err);
			if (errorMsg.includes("Authentication required")) {
				// Silently fail if auth is not ready yet
				setEmployees([]);
			} else {
				toast.error(errorMsg);
			}
		} finally {
			setLoading(false);
		}
	};

	// Reload when department filter changes
	useEffect(() => {
		if (departmentFilter === "all") {
			loadEmployees();
		} else {
			loadEmployees(departmentFilter);
		}
	}, [departmentFilter]);

	// Client-side filtering for search and status (after employees are loaded)
	useEffect(() => {
		let filtered = [...employees];
		if (searchQuery) {
			const q = searchQuery.toLowerCase();
			filtered = filtered.filter(
				(e) =>
					e.name.toLowerCase().includes(q) ||
					e.employeeId.toLowerCase().includes(q) ||
					e.email.toLowerCase().includes(q) ||
					e.cidNo.includes(q),
			);
		}
		if (statusFilter !== "all") {
			const active = statusFilter === "Active";
			filtered = filtered.filter((e) => e.isActive === active);
		}
		setFilteredEmployees(filtered);
	}, [employees, searchQuery, statusFilter]);

	// Helper: generate unique employee ID (TDA + 6 digits)
	const generateEmployeeId = () => {
		let newId: string;
		do {
			const num = Math.floor(Math.random() * 1000000)
				.toString()
				.padStart(6, "0");
			newId = `TDA${num}`;
		} while (employees.some((e) => e.employeeId === newId));
		return newId;
	};

	// Validation
	const validateField = (
		field: keyof EmployeeFormData,
		value: string,
		form: EmployeeFormData,
		isEditing: boolean,
		currentId?: string,
	): string | undefined => {
		switch (field) {
			case "employeeId":
				if (!value.trim()) return "Employee ID required";
				if (!isEditing && employees.some((e) => e.employeeId === value))
					return "Employee ID must be unique";
				return undefined;
			case "cidNo":
				if (!value.trim()) return "CID number required";
				if (!/^\d{11}$/.test(value)) return "CID must be 11 digits";
				if (!isEditing && employees.some((e) => e.cidNo === value))
					return "CID already exists";
				return undefined;
			case "name":
				if (!value.trim()) return "Full name required";
				return undefined;
			case "email":
				if (!value.trim()) return "Email required";
				if (!/^[^\s@]+@([^\s@]+\.)+[^\s@]+$/.test(value))
					return "Invalid email format";
				return undefined;
			case "departmentId":
				if (!value) return "Please select department";
				return undefined;
			case "contactNo":
				if (!value.trim()) return "Contact number required";
				if (!/^\d{8}$/.test(value)) return "Must be 8 digits";
				return undefined;
			case "employmentType":
				if (!value) return "Select employment type";
				return undefined;
			default:
				return undefined;
		}
	};

	const validateForm = (
		form: EmployeeFormData,
		isEditing: boolean,
	): boolean => {
		const newErrors: ValidationErrors = {};
		const fields: (keyof EmployeeFormData)[] = [
			"employeeId",
			"cidNo",
			"name",
			"email",
			"departmentId",
			"contactNo",
			"employmentType",
		];
		for (const field of fields) {
			const err = validateField(
				field,
				form[field] as string,
				form,
				isEditing,
				editingEmployee?.id,
			);
			if (err) newErrors[field] = err;
		}
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const updateFormData = (field: keyof EmployeeFormData, value: any) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		setTouched((prev) => ({ ...prev, [field]: true }));
		const err = validateField(
			field,
			value,
			{ ...formData, [field]: value },
			!!editingEmployee,
			editingEmployee?.id,
		);
		setErrors((prev) => ({ ...prev, [field]: err }));
	};

	const handleBlur = (field: keyof EmployeeFormData) => {
		setTouched((prev) => ({ ...prev, [field]: true }));
		const err = validateField(
			field,
			formData[field] as string,
			formData,
			!!editingEmployee,
			editingEmployee?.id,
		);
		setErrors((prev) => ({ ...prev, [field]: err }));
	};

	const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			if (file.size > 2 * 1024 * 1024) {
				toast.error("Photo must be less than 2MB");
				return;
			}
			updateFormData("photo", file);
			setRemovePhoto(false);
			setExistingPhotoUrl(null);
			const reader = new FileReader();
			reader.onloadend = () => setPhotoPreview(reader.result as string);
			reader.readAsDataURL(file);
		}
	};

	const handleAdd = () => {
		setEditingEmployee(null);
		setFormData({
			...emptyFormData,
			employeeId: generateEmployeeId(),
			isActive: true,
		});
		setPhotoPreview(null);
		setExistingPhotoUrl(null);
		setRemovePhoto(false);
		setErrors({});
		setTouched({});
		setIsDialogOpen(true);
	};

	const handleEdit = (employee: Employee) => {
		setEditingEmployee(employee);
		setFormData({
			employeeId: employee.employeeId,
			cidNo: employee.cidNo,
			name: employee.name,
			contactNo: employee.contactNo,
			email: employee.email,
			departmentId: employee.departmentId,
			employmentType: employee.employmentType,
			photo: null,
			isActive: employee.isActive,
		});
		setExistingPhotoUrl(employee.photo || null);
		setPhotoPreview(null);
		setRemovePhoto(false);
		setErrors({});
		setTouched({});
		setIsDialogOpen(true);
	};

	const handleDelete = (employee: Employee) => {
		setDeletingEmployee(employee);
		setIsDeleteDialogOpen(true);
	};

	const confirmDelete = async () => {
		if (!deletingEmployee) return;
		try {
			await deleteEmployee(deletingEmployee.id);
			if (departmentFilter === "all") {
				await loadEmployees();
			} else {
				await loadEmployees(departmentFilter);
			}
			toast.success("Employee deleted successfully");
			setIsDeleteDialogOpen(false);
			setDeletingEmployee(null);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Delete failed");
		}
	};

	const handleSave = async () => {
		const isValid = validateForm(formData, !!editingEmployee);
		if (!isValid) {
			setTouched({
				employeeId: true,
				cidNo: true,
				name: true,
				email: true,
				departmentId: true,
				contactNo: true,
				employmentType: true,
			});
			return;
		}

		setIsSubmitting(true);
		try {
			if (editingEmployee) {
				await updateEmployee(editingEmployee.id, formData);
				if (removePhoto) {
					try {
						await deleteStaffPhoto(editingEmployee.id);
					} catch (err) {
						toast.warning(
							"Failed to remove photo, but other info updated",
						);
					}
				}
				toast.success("Employee updated successfully");
			} else {
				await createEmployee(formData);
				toast.success("Employee added successfully");
			}
			if (departmentFilter === "all") {
				await loadEmployees();
			} else {
				await loadEmployees(departmentFilter);
			}
			setIsDialogOpen(false);
			setEditingEmployee(null);
			setFormData(emptyFormData);
			setPhotoPreview(null);
			setExistingPhotoUrl(null);
			setRemovePhoto(false);
			setErrors({});
			setTouched({});
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Operation failed",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const stats = {
		total: employees.length,
		active: employees.filter((e) => e.isActive).length,
		departments: new Set(employees.map((e) => e.departmentId)).size,
		newHires: employees.filter((e) => {
			const date = new Date(e.createdAt);
			const now = new Date();
			return (
				date.getMonth() === now.getMonth() &&
				date.getFullYear() === now.getFullYear()
			);
		}).length,
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="text-slate-500">Loading employees...</div>
			</div>
		);
	}

	if (apiError) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="text-red-600">Error: {apiError}</div>
			</div>
		);
	}

	return (
		<TooltipProvider>
			<div className="w-full min-w-0 overflow-hidden">
				{/* Header */}
				<div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
					<div className="space-y-1">
						<h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
							Employees
						</h1>
						<p className="text-sm sm:text-base text-slate-500">
							Manage employee records and information
						</p>
					</div>
					<Button
						onClick={handleAdd}
						className="gap-2 bg-[#0b2e4f] text-white shadow-sm h-10 px-5 shrink-0 self-start sm:self-auto hover:bg-white hover:text-[#0b2e4f] hover:border hover:border-[#0b2e4f] transition-colors"
					>
						<Plus className="h-4 w-4" /> Add Employee
					</Button>
				</div>

				{/* Stats Cards */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
					<Card className="border-0 shadow-sm">
						<CardContent className="p-3 sm:p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-xs sm:text-sm font-medium text-slate-500">
										Total Employees
									</p>
									<p className="text-xl sm:text-2xl font-bold text-slate-900">
										{stats.total}
									</p>
								</div>
								<div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-slate-100 flex items-center justify-center">
									<Users className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600" />
								</div>
							</div>
						</CardContent>
					</Card>
					<Card className="border-0 shadow-sm">
						<CardContent className="p-3 sm:p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-xs sm:text-sm font-medium text-slate-500">
										Active
									</p>
									<p className="text-xl sm:text-2xl font-bold text-emerald-600">
										{stats.active}
									</p>
								</div>
								<div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-emerald-50 flex items-center justify-center">
									<UserCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
								</div>
							</div>
						</CardContent>
					</Card>
					<Card className="border-0 shadow-sm">
						<CardContent className="p-3 sm:p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-xs sm:text-sm font-medium text-slate-500">
										Departments
									</p>
									<p className="text-xl sm:text-2xl font-bold text-slate-900">
										{stats.departments}
									</p>
								</div>
								<div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-blue-50 flex items-center justify-center">
									<Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
								</div>
							</div>
						</CardContent>
					</Card>
					<Card className="border-0 shadow-sm">
						<CardContent className="p-3 sm:p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-xs sm:text-sm font-medium text-slate-500">
										New Hires
									</p>
									<p className="text-xl sm:text-2xl font-bold text-slate-900">
										{stats.newHires}
									</p>
								</div>
								<div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-amber-50 flex items-center justify-center">
									<Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Filters */}
				<Card className="border border-slate-200 shadow-none bg-white mb-6">
					<CardContent className="p-3 sm:p-4">
						<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
							<div className="relative flex-1">
								<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
								<Input
									placeholder="Search by name, ID, CID, email..."
									value={searchQuery}
									onChange={(e) =>
										setSearchQuery(e.target.value)
									}
									className="pl-10 h-9 sm:h-10"
								/>
							</div>
							<div className="flex gap-2 sm:gap-3">
								{/* Department filter dropdown with updated colors */}
								<Select
									value={departmentFilter}
									onValueChange={setDepartmentFilter}
								>
									<SelectTrigger className="w-full sm:w-[160px] h-9 sm:h-10 focus:ring-[#0B2E4F] focus:border-[#0B2E4F]">
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
								{/* Status filter dropdown with updated colors */}
								<Select
									value={statusFilter}
									onValueChange={setStatusFilter}
								>
									<SelectTrigger className="w-full sm:w-[140px] h-9 sm:h-10 focus:ring-[#0B2E4F] focus:border-[#0B2E4F]">
										<UserCircle className="h-4 w-4 mr-2 text-slate-500" />
										<SelectValue placeholder="Status" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem
											value="all"
											className="cursor-pointer hover:bg-[#0B2E4F] hover:text-white focus:bg-[#0B2E4F] focus:text-white"
										>
											All Status
										</SelectItem>
										<SelectItem
											value="Active"
											className="cursor-pointer hover:bg-[#0B2E4F] hover:text-white focus:bg-[#0B2E4F] focus:text-white"
										>
											Active
										</SelectItem>
										<SelectItem
											value="Inactive"
											className="cursor-pointer hover:bg-[#0B2E4F] hover:text-white focus:bg-[#0B2E4F] focus:text-white"
										>
											Inactive
										</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Employees Table */}
				<div className="w-full overflow-x-auto rounded-lg border border-slate-200">
					<div className="min-w-[1000px]">
						<div className="grid grid-cols-[100px_150px_200px_1fr_120px_100px_80px] gap-0 border-b bg-[#0B2E4F] text-white text-xs font-semibold uppercase">
							<div className="py-3 px-4">ID</div>
							<div className="py-3 px-4">CID</div>
							<div className="py-3 px-4">Name</div>
							<div className="py-3 px-4">Email</div>
							<div className="py-3 px-4 text-center">Contact</div>
							<div className="py-3 px-4 text-center">Status</div>
							<div className="py-3 px-4 text-center">Actions</div>
						</div>
						{filteredEmployees.length === 0 ? (
							<div className="h-32 flex flex-col items-center justify-center text-slate-400 bg-white">
								<Users className="h-8 w-8 mb-2 opacity-50" />
								<p className="text-sm font-medium">
									No employees found
								</p>
							</div>
						) : (
							filteredEmployees.map((emp, idx) => (
								<div
									key={emp.id}
									className={cn(
										"grid grid-cols-[100px_150px_200px_1fr_120px_100px_80px] gap-0 items-center border-b last:border-0",
										idx % 2 === 0
											? "bg-white"
											: "bg-slate-50",
									)}
								>
									<div className="py-3 px-4 text-xs font-mono">
										{emp.employeeId}
									</div>
									<div className="py-3 px-4 text-xs font-mono">
										{emp.cidNo}
									</div>
									<div className="py-3 px-4 text-sm font-medium truncate">
										{emp.name}
									</div>
									<div className="py-3 px-4 text-sm text-slate-600 truncate">
										{emp.email}
									</div>
									<div className="py-3 px-4 text-sm text-center">
										{emp.contactNo}
									</div>
									<div className="py-3 px-4 flex justify-center">
										<Badge
											className={cn(
												"text-xs border-0",
												emp.isActive
													? "bg-emerald-50 text-emerald-700"
													: "bg-slate-100 text-slate-600",
											)}
										>
											{emp.isActive
												? "Active"
												: "Inactive"}
										</Badge>
									</div>
									<div className="py-3 px-4 flex justify-center gap-1">
										<Tooltip>
											<TooltipTrigger asChild>
												<Button
													variant="ghost"
													size="icon"
													onClick={() =>
														handleEdit(emp)
													}
													className="h-8 w-8 text-slate-400 hover:text-white hover:bg-[#0B2E4F]"
												>
													<Pencil className="h-4 w-4" />
												</Button>
											</TooltipTrigger>
											<TooltipContent>
												Edit
											</TooltipContent>
										</Tooltip>
										<Tooltip>
											<TooltipTrigger asChild>
												<Button
													variant="ghost"
													size="icon"
													onClick={() =>
														handleDelete(emp)
													}
													className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</TooltipTrigger>
											<TooltipContent>
												Delete
											</TooltipContent>
										</Tooltip>
									</div>
								</div>
							))
						)}
					</div>
				</div>

				{/* Add/Edit Dialog */}
				<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
					<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle>
								{editingEmployee
									? "Edit Employee"
									: "Add New Employee"}
							</DialogTitle>
							<DialogDescription>
								Fill in the employee details below.
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-4">
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								{/* Employee ID */}
								<Field>
									<FieldLabel>
										Employee ID{" "}
										<span className="text-red-500">*</span>
									</FieldLabel>
									<Input
										value={formData.employeeId}
										onChange={(e) =>
											updateFormData(
												"employeeId",
												e.target.value,
											)
										}
										onBlur={() => handleBlur("employeeId")}
										disabled={!!editingEmployee}
										className={cn(
											errors.employeeId &&
												touched.employeeId &&
												"border-red-500",
											editingEmployee &&
												"bg-slate-50 text-slate-600",
										)}
									/>
									{errors.employeeId &&
										touched.employeeId && (
											<p className="text-xs text-red-500 mt-1">
												{errors.employeeId}
											</p>
										)}
								</Field>

								{/* CID No */}
								<Field>
									<FieldLabel>
										CID No{" "}
										<span className="text-red-500">*</span>
									</FieldLabel>
									<Input
										value={formData.cidNo}
										onChange={(e) =>
											updateFormData(
												"cidNo",
												e.target.value,
											)
										}
										onBlur={() => handleBlur("cidNo")}
										disabled={!!editingEmployee}
										className={cn(
											errors.cidNo &&
												touched.cidNo &&
												"border-red-500",
											editingEmployee &&
												"bg-slate-50 text-slate-600",
										)}
									/>
									{errors.cidNo && touched.cidNo && (
										<p className="text-xs text-red-500 mt-1">
											{errors.cidNo}
										</p>
									)}
								</Field>

								{/* Full Name */}
								<Field>
									<FieldLabel>
										Full Name{" "}
										<span className="text-red-500">*</span>
									</FieldLabel>
									<Input
										value={formData.name}
										onChange={(e) =>
											updateFormData(
												"name",
												e.target.value,
											)
										}
										onBlur={() => handleBlur("name")}
										className={cn(
											errors.name &&
												touched.name &&
												"border-red-500",
										)}
									/>
									{errors.name && touched.name && (
										<p className="text-xs text-red-500">
											{errors.name}
										</p>
									)}
								</Field>

								{/* Email */}
								<Field>
									<FieldLabel>
										Email{" "}
										<span className="text-red-500">*</span>
									</FieldLabel>
									<Input
										type="email"
										value={formData.email}
										onChange={(e) =>
											updateFormData(
												"email",
												e.target.value,
											)
										}
										onBlur={() => handleBlur("email")}
										className={cn(
											errors.email &&
												touched.email &&
												"border-red-500",
										)}
									/>
									{errors.email && touched.email && (
										<p className="text-xs text-red-500">
											{errors.email}
										</p>
									)}
								</Field>

								{/* Department */}
								<Field>
									<FieldLabel>
										Department{" "}
										<span className="text-red-500">*</span>
									</FieldLabel>
									<Select
										value={formData.departmentId}
										onValueChange={(v) =>
											updateFormData("departmentId", v)
										}
									>
										<SelectTrigger
											className={cn(
												errors.departmentId &&
													touched.departmentId &&
													"border-red-500",
												"focus:ring-[#0B2E4F] focus:border-[#0B2E4F]",
											)}
										>
											<SelectValue placeholder="Select department" />
										</SelectTrigger>
										<SelectContent>
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
									{errors.departmentId &&
										touched.departmentId && (
											<p className="text-xs text-red-500">
												{errors.departmentId}
											</p>
										)}
								</Field>

								{/* Contact Number */}
								<Field>
									<FieldLabel>
										Contact Number{" "}
										<span className="text-red-500">*</span>
									</FieldLabel>
									<div className="flex">
										<span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-200 bg-slate-50 text-slate-600">
											+975
										</span>
										<Input
											value={formData.contactNo}
											onChange={(e) => {
												const digits = e.target.value
													.replace(/\D/g, "")
													.slice(0, 8);
												updateFormData(
													"contactNo",
													digits,
												);
											}}
											onBlur={() =>
												handleBlur("contactNo")
											}
											className="rounded-l-none"
										/>
									</div>
									{errors.contactNo && touched.contactNo && (
										<p className="text-xs text-red-500">
											{errors.contactNo}
										</p>
									)}
								</Field>

								{/* Employment Type */}
								<Field>
									<FieldLabel>
										Employment Type{" "}
										<span className="text-red-500">*</span>
									</FieldLabel>
									<Select
										value={formData.employmentType}
										onValueChange={(v: any) =>
											updateFormData("employmentType", v)
										}
									>
										<SelectTrigger
											className={cn(
												errors.employmentType &&
													touched.employmentType &&
													"border-red-500",
												"focus:ring-[#0B2E4F] focus:border-[#0B2E4F]",
											)}
										>
											<SelectValue placeholder="Select type" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem
												value="regular"
												className="cursor-pointer hover:bg-[#0B2E4F] hover:text-white focus:bg-[#0B2E4F] focus:text-white"
											>
												Regular
											</SelectItem>
											<SelectItem
												value="contract"
												className="cursor-pointer hover:bg-[#0B2E4F] hover:text-white focus:bg-[#0B2E4F] focus:text-white"
											>
												Contract
											</SelectItem>
											<SelectItem
												value="deputation"
												className="cursor-pointer hover:bg-[#0B2E4F] hover:text-white focus:bg-[#0B2E4F] focus:text-white"
											>
												Deputation
											</SelectItem>
										</SelectContent>
									</Select>
									{errors.employmentType &&
										touched.employmentType && (
											<p className="text-xs text-red-500">
												{errors.employmentType}
											</p>
										)}
								</Field>

								{/* Status */}
								<Field>
									<FieldLabel>Status</FieldLabel>
									<Select
										value={
											formData.isActive
												? "Active"
												: "Inactive"
										}
										onValueChange={(v) =>
											updateFormData(
												"isActive",
												v === "Active",
											)
										}
									>
										<SelectTrigger className="focus:ring-[#0B2E4F] focus:border-[#0B2E4F]">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem
												value="Active"
												className="cursor-pointer hover:bg-[#0B2E4F] hover:text-white focus:bg-[#0B2E4F] focus:text-white"
											>
												Active
											</SelectItem>
											<SelectItem
												value="Inactive"
												className="cursor-pointer hover:bg-[#0B2E4F] hover:text-white focus:bg-[#0B2E4F] focus:text-white"
											>
												Inactive
											</SelectItem>
										</SelectContent>
									</Select>
								</Field>

								{/* Photo Upload */}
								<Field className="col-span-full">
									<FieldLabel>Photo</FieldLabel>
									<div className="flex items-center gap-4">
										{(photoPreview || existingPhotoUrl) &&
											!removePhoto && (
												<div className="relative w-12 h-12 rounded-full overflow-hidden border">
													<img
														src={
															photoPreview ||
															existingPhotoUrl ||
															""
														}
														alt="Preview"
														className="w-full h-full object-cover"
													/>
													<button
														type="button"
														onClick={() => {
															setRemovePhoto(
																true,
															);
															setPhotoPreview(
																null,
															);
															updateFormData(
																"photo",
																null,
															);
														}}
														className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
													>
														<X className="h-3 w-3" />
													</button>
												</div>
											)}
										<Button
											type="button"
											variant="outline"
											onClick={() =>
												document
													.getElementById(
														"photo-upload",
													)
													?.click()
											}
											className="gap-2"
										>
											<Upload className="h-4 w-4" />
											{existingPhotoUrl && !removePhoto
												? "Replace Photo"
												: "Upload Photo"}
										</Button>
										<input
											id="photo-upload"
											type="file"
											accept="image/*"
											onChange={handlePhotoChange}
											className="hidden"
										/>
									</div>
									{removePhoto && (
										<p className="text-xs text-amber-600 mt-1">
											Photo will be removed
										</p>
									)}
								</Field>
							</div>
						</div>
						<DialogFooter className="gap-2 mt-4">
							<Button
								variant="outline"
								onClick={() => setIsDialogOpen(false)}
							>
								Cancel
							</Button>
							<Button
								onClick={handleSave}
								disabled={isSubmitting}
								className="bg-[#0b2e4f] text-white hover:bg-white hover:text-[#0b2e4f] hover:border hover:border-[#0b2e4f] transition-colors"
							>
								{isSubmitting
									? "Saving..."
									: editingEmployee
										? "Update"
										: "Save"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{/* Delete Confirmation Dialog */}
				<Dialog
					open={isDeleteDialogOpen}
					onOpenChange={setIsDeleteDialogOpen}
				>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Confirm Delete</DialogTitle>
							<DialogDescription>
								Are you sure you want to delete{" "}
								{deletingEmployee?.name}? This action cannot be
								undone.
							</DialogDescription>
						</DialogHeader>
						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => setIsDeleteDialogOpen(false)}
							>
								Cancel
							</Button>
							<Button
								variant="destructive"
								onClick={confirmDelete}
							>
								Delete
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>
		</TooltipProvider>
	);
}
