"use client";

import {
	createContext,
	useContext,
	useState,
	useEffect,
	type ReactNode,
} from "react";
import type { User } from "./types";
import {
	adminLogin,
	staffLogin,
	getAccessToken,
	setAccessToken,
	getStoredUser,
	setStoredUser,
} from "./api-client";

interface SessionContextType {
	user: User | null;
	loading: boolean;
	login: (
		email: string,
		password: string,
		role: "admin" | "employee",
	) => Promise<boolean>;
	logout: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);

	const mapBackendUser = (backendUser: any, role: string): User => ({
		id: backendUser.id,
		username: backendUser.email,
		password: "",
		role: role as "admin" | "employee",
		name: backendUser.name,
		email: backendUser.email,
		employeeId: backendUser.employeeId || undefined, // ✅ use employeeId
		department: backendUser.department || undefined,
	});

	useEffect(() => {
		const restoreSession = () => {
			setLoading(true);
			const token = getAccessToken();
			const storedUser = getStoredUser();

			console.log(
				"Restoring session, token exists:",
				!!token,
				"storedUser exists:",
				!!storedUser,
			);

			if (token && storedUser) {
				// Restore user from stored data
				const role = storedUser.role === "admin" ? "admin" : "employee";
				const restoredUser = mapBackendUser(storedUser, role);
				setUser(restoredUser);
				console.log("Session restored from stored user:", restoredUser);
			} else {
				// No valid session – clear everything
				if (token) {
					// Token exists but no stored user – clear token
					setAccessToken(null);
				}
				setStoredUser(null);
				setUser(null);
				console.log("No valid session found");
			}
			setLoading(false);
		};

		restoreSession();
	}, []);

	const login = async (
		email: string,
		password: string,
		role: "admin" | "employee",
	): Promise<boolean> => {
		try {
			console.log(`Attempting ${role} login for:`, email);
			let data;
			if (role === "admin") {
				data = await adminLogin(email, password);
			} else {
				data = await staffLogin(email, password);
			}
			console.log("Login response data:", data);
			const backendUser = data.user;
			const frontendUser = mapBackendUser(backendUser, role);
			setUser(frontendUser);
			console.log("Login successful for", role, "user:", frontendUser);
			console.log("Token should be set:", !!getAccessToken());
			return true;
		} catch (error) {
			console.error("Login error:", error);
			return false;
		}
	};

	const logout = () => {
		setAccessToken(null);
		setStoredUser(null);
		setUser(null);
	};

	return (
		<SessionContext.Provider value={{ user, loading, login, logout }}>
			{children}
		</SessionContext.Provider>
	);
}

export function useSession() {
	const ctx = useContext(SessionContext);
	if (!ctx) throw new Error("useSession must be used within SessionProvider");
	return ctx;
}
