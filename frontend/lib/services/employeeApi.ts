// lib/services/employeeApi.ts
import { request, getAccessToken, API_BASE } from "../api-client";

export interface Employee {
	id: string;
	employeeId: string;
	cidNo: string;
	name: string;
	contactNo: string;
	email: string;
	departmentId: string;
	employmentType: "regular" | "contract" | "deputation";
	photo?: string; // will be URL to static proxy
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface EmployeeFormData {
	employeeId: string;
	cidNo: string;
	name: string;
	contactNo: string;
	email: string;
	departmentId: string;
	employmentType: "regular" | "contract" | "deputation";
	photo?: File | null;
	isActive: boolean;
}

// Build photo URL from the backend filename (uses static proxy)
function getPhotoUrl(photoFilename: string | undefined): string | undefined {
	if (!photoFilename) return undefined;
	return `/api/static/${photoFilename}`;
}

async function uploadStaffPhoto(id: string, file: File): Promise<void> {
	const token = getAccessToken();
	const formData = new FormData();
	formData.append("photo", file);
	const res = await fetch(`${API_BASE}/staff/${id}/photo`, {
		method: "PATCH",
		headers: token ? { Authorization: `Bearer ${token}` } : {},
		body: formData,
	});
	if (!res.ok) {
		const error = await res.text();
		throw new Error(error || "Photo upload failed");
	}
}

async function staffRequest<T>(
	endpoint: string,
	method: string,
	data?: any,
): Promise<T> {
	const token = getAccessToken();
	if (!token && method === "GET") {
		console.warn(`No access token available for ${method} ${endpoint}`);
		throw new Error("Authentication required. Please log in.");
	}
	
	return request<T>(endpoint, {
		method,
		body: data ? JSON.stringify(data) : undefined,
	});
}

export async function fetchEmployees(): Promise<Employee[]> {
	try {
		const token = getAccessToken();
		if (!token) {
			console.warn("No access token available for fetchEmployees, returning empty list");
			return [];
		}
		
		const data = await staffRequest<{ data: Employee[]; total: number }>(
			"/staff",
			"GET",
		);
		return data.data.map((emp) => ({
			...emp,
			photo: getPhotoUrl(emp.photo), // use the filename from backend
		}));
	} catch (error) {
		console.error("Error fetching employees:", error);
		throw error;
	}
}

export async function fetchEmployeesByOffice(
	officeId: string,
): Promise<Employee[]> {
	try {
		const token = getAccessToken();
		if (!token) {
			console.warn("No access token available for fetchEmployeesByOffice, returning empty list");
			return [];
		}
		
		const data = await staffRequest<any>(`/staff/office/${officeId}`, "GET");
		const employees = Array.isArray(data?.data)
			? data.data
			: Array.isArray(data)
				? data
				: [];
		return employees.map((emp: any) => ({
			...emp,
			photo: getPhotoUrl(emp.photo),
		}));
	} catch (error) {
		console.error("Error fetching employees by office:", error);
		throw error;
	}
}

export async function createEmployee(
	formData: EmployeeFormData,
): Promise<Employee> {
	const { photo, ...rest } = formData;
	const employee = await staffRequest<Employee>("/staff", "POST", rest);
	if (photo) {
		await uploadStaffPhoto(employee.id, photo);
		// After upload, the backend may have updated the employee's photo field; refetch to get the filename.
		const updated = await staffRequest<Employee>(
			`/staff/${employee.id}`,
			"GET",
		);
		return { ...updated, photo: getPhotoUrl(updated.photo) };
	}
	return { ...employee, photo: getPhotoUrl(employee.photo) };
}

export async function updateEmployee(
	id: string,
	formData: EmployeeFormData,
): Promise<Employee> {
	const { photo, employeeId, cidNo, ...updatable } = formData;
	const updatePayload = {
		name: updatable.name,
		contactNo: updatable.contactNo,
		email: updatable.email,
		departmentId: updatable.departmentId,
		employmentType: updatable.employmentType,
		isActive: updatable.isActive,
	};
	const updated = await staffRequest<Employee>(
		`/staff/${id}`,
		"PATCH",
		updatePayload,
	);
	if (photo) {
		await uploadStaffPhoto(id, photo);
		const refreshed = await staffRequest<Employee>(`/staff/${id}`, "GET");
		return { ...refreshed, photo: getPhotoUrl(refreshed.photo) };
	}
	return { ...updated, photo: getPhotoUrl(updated.photo) };
}

export async function deleteEmployee(id: string): Promise<void> {
	await staffRequest<void>(`/staff/${id}`, "DELETE");
}

export async function deleteStaffPhoto(id: string): Promise<void> {
	const token = getAccessToken();
	const res = await fetch(`${API_BASE}/staff/${id}/photo`, {
		method: "DELETE",
		headers: token ? { Authorization: `Bearer ${token}` } : {},
	});
	if (!res.ok) {
		const error = await res.text();
		throw new Error(error || "Photo deletion failed");
	}
}
