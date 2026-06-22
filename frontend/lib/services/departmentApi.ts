// lib/services/departmentApi.ts
import { request } from "../api-client";

export interface Department {
	id: string;
	name: string;
	code: string;
	createdAt: string;
	updatedAt: string;
	officeId?: string;
	isActive?: boolean;
}

export async function fetchDepartments(): Promise<Department[]> {
	const data = await request<
		Department[] | { data: Department[]; total: number }
	>("/departments");
	// If the backend returns paginated { data: [], total }
	if (
		data &&
		typeof data === "object" &&
		"data" in data &&
		Array.isArray(data.data)
	) {
		return data.data;
	}
	// If it returns array directly
	if (Array.isArray(data)) {
		return data;
	}
	return [];
}

export async function createDepartment(department: {
	name: string;
	code: string;
}): Promise<Department> {
	return request<Department>("/departments", {
		method: "POST",
		body: JSON.stringify(department),
	});
}

export async function updateDepartment(
	id: string,
	department: Partial<{ name: string; code: string }>,
): Promise<Department> {
	return request<Department>(`/departments/${id}`, {
		method: "PATCH",
		body: JSON.stringify(department),
	});
}

export async function deleteDepartment(id: string): Promise<void> {
	await request<void>(`/departments/${id}`, { method: "DELETE" });
}

export async function fetchDepartment(id: string): Promise<Department> {
	const data = await request<Department>(`/departments/${id}`);
	return data;
}
