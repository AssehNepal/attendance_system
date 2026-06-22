// lib/services/holidayApi.ts
import { request } from "../api-client";

// ----- Weekly holidays -----
export interface WeeklyHoliday {
	id: string;
	dayOfWeek: number; // 1 (Mon) ... 7 (Sun)
	isActive: boolean;
	createdAt?: string;
	updatedAt?: string;
	officeId?: string;
	createdById?: string;
}

export async function fetchWeeklyHolidays(): Promise<WeeklyHoliday[]> {
	return request<WeeklyHoliday[]>("/holidays/weekly");
}

export async function createWeeklyHoliday(
	dayOfWeek: number,
	isActive: boolean,
): Promise<WeeklyHoliday> {
	return request<WeeklyHoliday>("/holidays/weekly", {
		method: "POST",
		body: JSON.stringify({ dayOfWeek, isActive }),
	});
}

export async function updateWeeklyHoliday(
	id: string,
	dayOfWeek: number,
	isActive: boolean,
): Promise<WeeklyHoliday> {
	return request<WeeklyHoliday>(`/holidays/weekly/${id}`, {
		method: "PATCH",
		body: JSON.stringify({ dayOfWeek, isActive }),
	});
}

export async function deleteWeeklyHoliday(id: string): Promise<void> {
	await request(`/holidays/weekly/${id}`, { method: "DELETE" });
}

// ----- Date-based holidays -----
export interface DateHoliday {
	id: string;
	holidayDate: string; // YYYY-MM-DD
	name: string;
	type: "public" | "optional" | "company";
	createdAt?: string;
	updatedAt?: string;
	officeId?: string;
	createdById?: string;
}

export async function fetchDateHolidays(): Promise<DateHoliday[]> {
	return request<DateHoliday[]>("/holidays");
}

export async function createDateHoliday(
	holidayDate: string,
	name: string,
	type: string,
): Promise<DateHoliday> {
	return request<DateHoliday>("/holidays", {
		method: "POST",
		body: JSON.stringify({ holidayDate, name, type }),
	});
}

export async function updateDateHoliday(
	id: string,
	holidayDate: string,
	name: string,
	type: string,
): Promise<DateHoliday> {
	return request<DateHoliday>(`/holidays/${id}`, {
		method: "PATCH",
		body: JSON.stringify({ holidayDate, name, type }),
	});
}

export async function deleteDateHoliday(id: string): Promise<void> {
	await request(`/holidays/${id}`, { method: "DELETE" });
}
