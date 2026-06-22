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
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { Field, FieldLabel } from "@/components/ui/field";
import {
	Plus,
	Search,
	Pencil,
	Trash2,
	Building2,
	CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
	fetchDepartments,
	createDepartment,
	updateDepartment,
	deleteDepartment,
	type Department,
} from "@/lib/services/departmentApi";

type DepartmentFormData = Omit<
	Department,
	"id" | "createdAt" | "updatedAt" | "officeId" | "isActive"
>;

const emptyFormData: DepartmentFormData = {
	name: "",
	code: "",
};

type ValidationErrors = {
	name?: string;
	code?: string;
};

export default function DepartmentsPage() {
	const [departments, setDepartments] = useState<Department[]>([]);
	const [filteredDepartments, setFilteredDepartments] = useState<
		Department[]
	>([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [loading, setLoading] = useState(true);
	const [apiError, setApiError] = useState<string | null>(null);

	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [editingDepartment, setEditingDepartment] =
		useState<Department | null>(null);
	const [deletingDepartment, setDeletingDepartment] =
		useState<Department | null>(null);
	const [formData, setFormData] = useState<DepartmentFormData>(emptyFormData);
	const [errors, setErrors] = useState<ValidationErrors>({});
	const [touched, setTouched] = useState<Record<string, boolean>>({});

	// Load departments from API on mount
	useEffect(() => {
		const loadDepartments = async () => {
			try {
				setLoading(true);
				const data = await fetchDepartments();
				setDepartments(data);
				setApiError(null);
			} catch (err) {
				setApiError(
					err instanceof Error
						? err.message
						: "Failed to load departments",
				);
			} finally {
				setLoading(false);
			}
		};
		loadDepartments();
	}, []);

	// Filter departments based on search query
	useEffect(() => {
		if (!searchQuery.trim()) {
			setFilteredDepartments(departments);
		} else {
			const query = searchQuery.toLowerCase();
			const filtered = departments.filter(
				(dept) =>
					dept.name.toLowerCase().includes(query) ||
					dept.code.toLowerCase().includes(query),
			);
			setFilteredDepartments(filtered);
		}
	}, [departments, searchQuery]);

	// Helper: check if department code is unique (case-insensitive) among current departments
	const isDepartmentCodeUnique = (code: string, excludeId?: string) => {
		return !departments.some(
			(dept) =>
				dept.code.toLowerCase() === code.toLowerCase() &&
				dept.id !== excludeId,
		);
	};

	// Validation functions
	const validateName = (name: string): string | undefined => {
		if (!name.trim()) return "Department name is required.";
		if (name.trim().length < 2)
			return "Name must be at least 2 characters.";
		return undefined;
	};

	const validateCode = (
		code: string,
		isEditing: boolean,
		currentId?: string,
	): string | undefined => {
		if (!code.trim()) return "Department code is required.";
		if (code.trim().length < 2)
			return "Code must be at least 2 characters.";
		if (!/^[A-Za-z0-9]+$/.test(code.trim()))
			return "Code can only contain letters and numbers.";
		if (!isDepartmentCodeUnique(code.trim(), currentId)) {
			return "Department code must be unique (case-insensitive).";
		}
		return undefined;
	};

	const validateForm = (
		form: DepartmentFormData,
		isEditing: boolean,
		currentId?: string,
	): boolean => {
		const newErrors: ValidationErrors = {};
		const nameError = validateName(form.name);
		if (nameError) newErrors.name = nameError;
		const codeError = validateCode(form.code, isEditing, currentId);
		if (codeError) newErrors.code = codeError;
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const updateFormData = (field: keyof DepartmentFormData, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		setTouched((prev) => ({ ...prev, [field]: true }));
		if (field === "name") {
			const error = validateName(value);
			setErrors((prev) => ({ ...prev, name: error }));
		} else if (field === "code") {
			const error = validateCode(
				value,
				!!editingDepartment,
				editingDepartment?.id,
			);
			setErrors((prev) => ({ ...prev, code: error }));
		}
	};

	const handleBlur = (field: keyof DepartmentFormData) => {
		setTouched((prev) => ({ ...prev, [field]: true }));
		if (field === "name") {
			const error = validateName(formData.name);
			setErrors((prev) => ({ ...prev, name: error }));
		} else if (field === "code") {
			const error = validateCode(
				formData.code,
				!!editingDepartment,
				editingDepartment?.id,
			);
			setErrors((prev) => ({ ...prev, code: error }));
		}
	};

	const handleAdd = () => {
		setEditingDepartment(null);
		setFormData(emptyFormData);
		setErrors({});
		setTouched({});
		setIsDialogOpen(true);
	};

	const handleEdit = (department: Department) => {
		setEditingDepartment(department);
		setFormData({
			name: department.name,
			code: department.code,
		});
		setErrors({});
		setTouched({});
		setIsDialogOpen(true);
	};

	const handleDelete = (department: Department) => {
		setDeletingDepartment(department);
		setIsDeleteDialogOpen(true);
	};

	const confirmDelete = async () => {
		if (deletingDepartment) {
			try {
				await deleteDepartment(deletingDepartment.id);
				setDepartments((prev) =>
					prev.filter((d) => d.id !== deletingDepartment.id),
				);
				setIsDeleteDialogOpen(false);
				setDeletingDepartment(null);
				toast.success("Department deleted successfully");
			} catch (err) {
				const errorMsg =
					err instanceof Error ? err.message : "Delete failed";
				toast.error(errorMsg);
			}
		}
	};

	const handleSave = async () => {
		const isValid = validateForm(
			formData,
			!!editingDepartment,
			editingDepartment?.id,
		);
		if (!isValid) {
			setTouched({ name: true, code: true });
			return;
		}

		try {
			if (editingDepartment) {
				const updated = await updateDepartment(editingDepartment.id, {
					name: formData.name.trim(),
					code: formData.code.trim().toUpperCase(),
				});
				setDepartments((prev) =>
					prev.map((dept) =>
						dept.id === editingDepartment.id ? updated : dept,
					),
				);
				toast.success("Department updated successfully");
			} else {
				const created = await createDepartment({
					name: formData.name.trim(),
					code: formData.code.trim().toUpperCase(),
				});
				setDepartments((prev) => [...prev, created]);
				toast.success("Department added successfully");
			}
			setIsDialogOpen(false);
			setEditingDepartment(null);
			setFormData(emptyFormData);
			setErrors({});
			setTouched({});
		} catch (err) {
			const errorMsg =
				err instanceof Error ? err.message : "Operation failed";
			toast.error(errorMsg);
		}
	};

	// Stats
	const totalDepartments = departments.length;
	const currentMonth = new Date().getMonth();
	const currentYear = new Date().getFullYear();
	const newThisMonth = departments.filter((dept) => {
		const createdDate = new Date(dept.createdAt);
		return (
			createdDate.getMonth() === currentMonth &&
			createdDate.getFullYear() === currentYear
		);
	}).length;

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="text-slate-500">Loading departments...</div>
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
							Departments
						</h1>
						<p className="text-sm sm:text-base text-slate-500">
							Manage department records and structure
						</p>
					</div>
					<Button
						onClick={handleAdd}
						className="gap-2 bg-[#0b2e4f] text-white shadow-sm h-10 px-5 shrink-0 
            self-start sm:self-auto border-2 border-transparent hover:bg-white hover:text-[#0b2e4f] 
            border border-[#0B2E4F] transition-colors"
					>
						<Plus className="h-4 w-4" /> Add Department
					</Button>
				</div>

				{/* Stats Cards */}
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
					<Card className="border-0 shadow-sm">
						<CardContent className="p-3 sm:p-4">
							<div className="flex items-center justify-between gap-2">
								<div className="space-y-1 min-w-0">
									<p className="text-xs sm:text-sm font-medium text-slate-500 truncate">
										Total Departments
									</p>
									<p className="text-xl sm:text-2xl font-bold text-slate-900">
										{totalDepartments}
									</p>
								</div>
								<div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
									<Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600" />
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="border-0 shadow-sm">
						<CardContent className="p-3 sm:p-4">
							<div className="flex items-center justify-between gap-2">
								<div className="space-y-1 min-w-0">
									<p className="text-xs sm:text-sm font-medium text-slate-500 truncate">
										New This Month
									</p>
									<p className="text-xl sm:text-2xl font-bold text-emerald-600">
										{newThisMonth}
									</p>
								</div>
								<div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
									<CalendarDays className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Search Filter */}
				<Card className="border border-slate-200 shadow-none bg-white mb-6">
					<CardContent className="p-3 sm:p-4">
						<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
							<div className="relative flex-1 min-w-0">
								<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
								<Input
									placeholder="Search by department name or code..."
									value={searchQuery}
									onChange={(e) =>
										setSearchQuery(e.target.value)
									}
									className="pl-10 h-9 sm:h-10 border-slate-200 focus:border-slate-400 w-full text-sm"
								/>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Departments Table */}
				<div className="w-full overflow-x-auto rounded-lg border border-slate-200">
					<div className="min-w-[500px]">
						<div className="grid grid-cols-[1fr_1fr_100px] gap-0 border-b border-slate-200 bg-[#0B2E4F] text-white text-xs font-semibold uppercase tracking-wider">
							<div className="py-3 px-4">Department Name</div>
							<div className="py-3 px-4">Department Code</div>
							<div className="py-3 px-4 text-center">Actions</div>
						</div>

						{filteredDepartments.length === 0 ? (
							<div className="h-32 flex flex-col items-center justify-center text-slate-400 bg-white">
								<Building2 className="h-8 w-8 mb-2 opacity-50" />
								<p className="text-sm font-medium">
									No departments found
								</p>
								{searchQuery && (
									<p className="text-xs text-slate-400 mt-1">
										Try adjusting your search query
									</p>
								)}
							</div>
						) : (
							filteredDepartments.map((department, index) => (
								<div
									key={department.id}
									className={cn(
										"grid grid-cols-[1fr_1fr_100px] gap-0 items-center border-b border-slate-200 last:border-0",
										index % 2 === 0
											? "bg-[#FDFDFD]"
											: "bg-[#F6F6F6]",
									)}
								>
									<div className="py-3 px-4 text-sm font-medium truncate">
										{department.name}
									</div>
									<div className="py-3 px-4">
										<span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-mono font-medium text-slate-700">
											{department.code}
										</span>
									</div>
									<div className="py-3 px-4 flex justify-center gap-2">
										<Button
											variant="ghost"
											size="icon"
											onClick={() =>
												handleEdit(department)
											}
											className="h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-[#0B2E4F] hover:text-white"
										>
											<Pencil className="h-4 w-4" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											onClick={() =>
												handleDelete(department)
											}
											className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								</div>
							))
						)}
					</div>
				</div>

				{/* Add/Edit Dialog */}
				<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
					<DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto p-0">
						<DialogHeader className="p-6 pb-0">
							<DialogTitle>
								{editingDepartment
									? "Edit Department"
									: "Add New Department"}
							</DialogTitle>
							<DialogDescription>
								{editingDepartment
									? "Update the department information below."
									: "Enter the department details below."}
							</DialogDescription>
						</DialogHeader>
						<div className="p-6 space-y-4">
							<Field>
								<FieldLabel>
									Department Name{" "}
									<span className="text-red-500">*</span>
								</FieldLabel>
								<Input
									value={formData.name}
									onChange={(e) =>
										updateFormData("name", e.target.value)
									}
									onBlur={() => handleBlur("name")}
									placeholder="e.g., Human Resources"
									className={cn(
										errors.name &&
											touched.name &&
											"border-red-500",
									)}
									autoComplete="off"
								/>
								{errors.name && touched.name && (
									<p className="text-xs text-red-500 mt-1">
										{errors.name}
									</p>
								)}
							</Field>

							<Field>
								<FieldLabel>
									Department Code{" "}
									<span className="text-red-500">*</span>
								</FieldLabel>
								<Input
									value={formData.code}
									onChange={(e) =>
										updateFormData(
											"code",
											e.target.value.toUpperCase(),
										)
									}
									onBlur={() => handleBlur("code")}
									placeholder="e.g., HR"
									className={cn(
										"font-mono uppercase",
										errors.code &&
											touched.code &&
											"border-red-500",
									)}
									autoComplete="off"
								/>
								{errors.code && touched.code && (
									<p className="text-xs text-red-500 mt-1">
										{errors.code}
									</p>
								)}
								<p className="text-xs text-slate-400 mt-1">
									Unique identifier (letters and numbers
									only). Will be automatically capitalized.
								</p>
							</Field>
						</div>
						<DialogFooter className="p-6 pt-0 gap-2">
							<Button
								variant="outline"
								onClick={() => setIsDialogOpen(false)}
								className="bg-white text-slate-700 hover:bg-slate-50 border-slate-200"
							>
								Cancel
							</Button>
							<Button
								onClick={handleSave}
								className="bg-[#0b2e4f] text-white hover:bg-white hover:text-[#0b2e4f] hover:border hover:border-[#0b2e4f]"
							>
								{editingDepartment ? "Update" : "Save"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{/* Delete Confirmation Dialog */}
				<Dialog
					open={isDeleteDialogOpen}
					onOpenChange={setIsDeleteDialogOpen}
				>
					<DialogContent className="sm:max-w-md">
						<DialogHeader>
							<DialogTitle>Confirm Delete</DialogTitle>
							<DialogDescription>
								Are you sure you want to delete the department "
								{deletingDepartment?.name}"?
								<br />
								<span className="text-red-500 text-sm">
									This action cannot be undone.
								</span>
							</DialogDescription>
						</DialogHeader>
						<DialogFooter className="gap-2">
							<Button
								variant="outline"
								onClick={() => setIsDeleteDialogOpen(false)}
								className="border-slate-200"
							>
								Cancel
							</Button>
							<Button
								variant="destructive"
								onClick={confirmDelete}
							>
								Delete Department
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>
		</TooltipProvider>
	);
}
