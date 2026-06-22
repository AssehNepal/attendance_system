/**
 * Debug Attendance API
 * Run this in the browser console to test the attendance endpoint
 * Copy and paste any of these functions into the browser console to test
 */

import { getAccessToken, API_BASE } from "./api-client";

/**
 * Test the primary attendance endpoint
 * Usage: testAttendanceEndpoint("2026-05-18")
 */
export async function testAttendanceEndpoint(
	date: string = new Date().toISOString().split("T")[0],
	departmentId?: string,
) {
	const token = getAccessToken();
	if (!token) {
		console.error("❌ No access token found. Please log in first.");
		return;
	}

	console.log("🔍 Testing Attendance Endpoint");
	console.log("========================================");
	console.log("Date:", date);
	console.log("Department ID:", departmentId || "none");
	console.log("API Base URL:", API_BASE);
	console.log("Access Token:", token?.substring(0, 20) + "...");
	console.log("========================================\n");

	// Build URL
	const url = `/attendance/daily-summary/${date}${departmentId ? `?departmentId=${departmentId}` : ""}`;
	const fullUrl = `${API_BASE}${url}`;

	console.log("📍 Endpoint URL:", fullUrl);
	console.log("\n");

	// Try primary endpoint
	console.log("1️⃣ Testing PRIMARY endpoint (GET /attendance/daily-summary/{date})");
	try {
		const response = await fetch(fullUrl, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			credentials: "include",
		});

		console.log(`Status: ${response.status} ${response.statusText}`);
		console.log("Headers:", {
			contentType: response.headers.get("content-type"),
			contentLength: response.headers.get("content-length"),
		});

		if (response.ok) {
			const data = await response.json();
			console.log("✅ SUCCESS! Response:", data);
			return data;
		} else {
			const errorText = await response.text();
			console.log(`❌ FAILED (${response.status})`);
			console.log("Response body:", errorText);
		}
	} catch (error) {
		console.error("❌ Network error:", error);
	}

	console.log("\n");

	// Try fallback 1: /api prefix
	console.log("2️⃣ Testing FALLBACK 1 (GET /api/attendance/daily-summary/{date})");
	const fallback1 = `/api/attendance/daily-summary/${date}${departmentId ? `?departmentId=${departmentId}` : ""}`;
	const fallback1Url = `${API_BASE}${fallback1}`;
	try {
		const response = await fetch(fallback1Url, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			credentials: "include",
		});

		console.log(`Status: ${response.status} ${response.statusText}`);
		if (response.ok) {
			const data = await response.json();
			console.log("✅ SUCCESS! Response:", data);
			return data;
		} else {
			console.log(`❌ FAILED (${response.status})`);
		}
	} catch (error) {
		console.error("❌ Network error:", error);
	}

	console.log("\n");

	// Try fallback 2: POST
	console.log("3️⃣ Testing FALLBACK 2 (POST /attendance/daily-summary)");
	const fallback2 = `/attendance/daily-summary`;
	const fallback2Url = `${API_BASE}${fallback2}`;
	try {
		const response = await fetch(fallback2Url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({
				date,
				departmentId,
			}),
			credentials: "include",
		});

		console.log(`Status: ${response.status} ${response.statusText}`);
		if (response.ok) {
			const data = await response.json();
			console.log("✅ SUCCESS! Response:", data);
			return data;
		} else {
			console.log(`❌ FAILED (${response.status})`);
		}
	} catch (error) {
		console.error("❌ Network error:", error);
	}

	console.log("\n");

	// Try fallback 3: v1
	console.log("4️⃣ Testing FALLBACK 3 (GET /v1/attendance/daily-summary/{date})");
	const fallback3 = `/v1/attendance/daily-summary/${date}${departmentId ? `?departmentId=${departmentId}` : ""}`;
	const fallback3Url = `${API_BASE}${fallback3}`;
	try {
		const response = await fetch(fallback3Url, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			credentials: "include",
		});

		console.log(`Status: ${response.status} ${response.statusText}`);
		if (response.ok) {
			const data = await response.json();
			console.log("✅ SUCCESS! Response:", data);
			return data;
		} else {
			console.log(`❌ FAILED (${response.status})`);
		}
	} catch (error) {
		console.error("❌ Network error:", error);
	}

	console.log("\n========================================");
	console.log(
		"If all endpoints failed with 404, the endpoint may not exist on your backend.",
	);
	console.log(
		"Check your backend logs or controller for the correct endpoint path.",
	);
}

/**
 * List all available endpoints to help you understand the backend structure
 * Usage: listAllAvailableEndpoints()
 */
export async function listAvailableEndpoints() {
	const token = getAccessToken();
	if (!token) {
		console.error("❌ No access token. Please log in first.");
		return;
	}

	console.log("📋 Checking available endpoints...\n");

	const endpointsToTry = [
		// Attendance endpoints
		{ method: "GET", path: "/attendance" },
		{ method: "GET", path: "/attendance/summary" },
		{ method: "GET", path: "/attendance/today" },
		{ method: "GET", path: "/attendance/daily-summary" },
		{ method: "GET", path: "/attendance/stats" },

		// Alternative API structures
		{ method: "GET", path: "/api/attendance" },
		{ method: "GET", path: "/v1/attendance" },

		// Health check
		{ method: "GET", path: "/health" },
		{ method: "GET", path: "/api/health" },
	];

	const results: any[] = [];

	for (const endpoint of endpointsToTry) {
		try {
			const response = await fetch(`${API_BASE}${endpoint.path}`, {
				method: endpoint.method,
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				credentials: "include",
			});

			results.push({
				endpoint: endpoint.path,
				method: endpoint.method,
				status: response.status,
				found: response.status !== 404,
			});
		} catch (error) {
			results.push({
				endpoint: endpoint.path,
				method: endpoint.method,
				status: "error",
				found: false,
			});
		}
	}

	// Display results
	console.log("Available endpoints:\n");
	results
		.filter((r) => r.found)
		.forEach((r) => {
			console.log(`✅ ${r.method} ${r.endpoint} (${r.status})`);
		});

	console.log("\nNot found (404):\n");
	results
		.filter((r) => !r.found)
		.forEach((r) => {
			console.log(`❌ ${r.method} ${r.endpoint} (${r.status})`);
		});
}

/**
 * Export debugging info to help troubleshoot
 */
export function getDiagnostics() {
	const token = getAccessToken();
	return {
		apiBase: API_BASE,
		hasToken: !!token,
		tokenPreview: token ? token.substring(0, 20) + "..." : null,
		currentDate: new Date().toISOString().split("T")[0],
		browser: typeof window !== "undefined" ? navigator.userAgent : "N/A",
	};
}
