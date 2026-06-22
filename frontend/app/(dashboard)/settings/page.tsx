"use client";

import { useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { useAuth } from "@/lib/auth-context";
import {
	Settings,
	User,
	Building2,
	Clock,
	AlertCircle,
	CheckCircle,
} from "lucide-react";

export default function SettingsPage() {
	const { user } = useAuth();
	const [isSaving, setIsSaving] = useState(false);
	const [message, setMessage] = useState<{
		type: "success" | "error";
		text: string;
	} | null>(null);

	const [officeSettings, setOfficeSettings] = useState({
		name: "Thimphu Dzongkhag Administration",
		address: "Thimphu, Bhutan",
		phone: "+975-2-322288",
		email: "admin@thimphu.gov.bt",
		workStartTime: "09:00",
		workEndTime: "17:00",
		lateThreshold: "09:30",
	});

	const handleSave = async () => {
		setIsSaving(true);
		setMessage(null);

		// Simulate saving
		await new Promise((resolve) => setTimeout(resolve, 1000));

		// Save to localStorage
		localStorage.setItem("tda_settings", JSON.stringify(officeSettings));

		setMessage({ type: "success", text: "Settings saved successfully" });
		setIsSaving(false);

		setTimeout(() => setMessage(null), 3000);
	};

	const handleResetData = () => {
		if (
			window.confirm(
				"Are you sure you want to reset all data? This cannot be undone.",
			)
		) {
			localStorage.removeItem("tda_employees");
			localStorage.removeItem("tda_attendance");
			localStorage.removeItem("tda_settings");
			window.location.reload();
		}
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-3xl font-bold text-foreground">Settings</h1>
				<p className="text-muted-foreground">
					Configure system settings and preferences
				</p>
			</div>

			{/* Message */}
			{message && (
				<div
					className={`flex items-center gap-2 rounded-lg p-4 ${
						message.type === "success"
							? "bg-chart-1/10 text-chart-1"
							: "bg-destructive/10 text-destructive"
					}`}
				>
					{message.type === "success" ? (
						<CheckCircle className="h-5 w-5" />
					) : (
						<AlertCircle className="h-5 w-5" />
					)}
					{message.text}
				</div>
			)}

			<div className="grid gap-6 lg:grid-cols-2">
				{/* Profile Settings */}
				<Card className="border-0 shadow-sm">
					<CardHeader>
						<div className="flex items-center gap-2">
							<div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100">
								<User className="h-4 w-4 text-violet-500" />
							</div>
							<CardTitle className="text-base">Profile</CardTitle>
						</div>
						<CardDescription>
							Your account information
						</CardDescription>
					</CardHeader>
					<CardContent>
						<FieldGroup>
							<Field>
								<FieldLabel>Name</FieldLabel>
								<Input value={user?.name ?? ""} disabled />
							</Field>
							<Field>
								<FieldLabel>Username</FieldLabel>
								<Input value={user?.username ?? ""} disabled />
							</Field>
							<Field>
								<FieldLabel>Email</FieldLabel>
								<Input value={user?.email ?? ""} disabled />
							</Field>
							<Field>
								<FieldLabel>Role</FieldLabel>
								<Input
									value={user?.role ?? ""}
									disabled
									className="capitalize"
								/>
							</Field>
						</FieldGroup>
					</CardContent>
				</Card>

				{/* Office Settings */}
				<Card className="border-0 shadow-sm">
					<CardHeader>
						<div className="flex items-center gap-2">
							<div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
								<Building2 className="h-4 w-4 text-blue-500" />
							</div>
							<CardTitle className="text-base">
								Office Information
							</CardTitle>
						</div>
						<CardDescription>Organization details</CardDescription>
					</CardHeader>
					<CardContent>
						<FieldGroup>
							<Field>
								<FieldLabel>Office Name</FieldLabel>
								<Input
									value={officeSettings.name}
									onChange={(e) =>
										setOfficeSettings({
											...officeSettings,
											name: e.target.value,
										})
									}
								/>
							</Field>
							<Field>
								<FieldLabel>Address</FieldLabel>
								<Input
									value={officeSettings.address}
									onChange={(e) =>
										setOfficeSettings({
											...officeSettings,
											address: e.target.value,
										})
									}
								/>
							</Field>
							<div className="grid grid-cols-2 gap-4">
								<Field>
									<FieldLabel>Phone</FieldLabel>
									<Input
										value={officeSettings.phone}
										onChange={(e) =>
											setOfficeSettings({
												...officeSettings,
												phone: e.target.value,
											})
										}
									/>
								</Field>
								<Field>
									<FieldLabel>Email</FieldLabel>
									<Input
										value={officeSettings.email}
										onChange={(e) =>
											setOfficeSettings({
												...officeSettings,
												email: e.target.value,
											})
										}
									/>
								</Field>
							</div>
						</FieldGroup>
					</CardContent>
				</Card>

				{/* Time Settings */}
				<Card className="border-0 shadow-sm">
					<CardHeader>
						<div className="flex items-center gap-2">
							<div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
								<Clock className="h-4 w-4 text-amber-500" />
							</div>
							<CardTitle className="text-base">
								Working Hours
							</CardTitle>
						</div>
						<CardDescription>
							Define office working hours
						</CardDescription>
					</CardHeader>
					<CardContent>
						<FieldGroup>
							<div className="grid grid-cols-2 gap-4">
								<Field>
									<FieldLabel>Work Start Time</FieldLabel>
									<Input
										type="time"
										value={officeSettings.workStartTime}
										onChange={(e) =>
											setOfficeSettings({
												...officeSettings,
												workStartTime: e.target.value,
											})
										}
									/>
								</Field>
								<Field>
									<FieldLabel>Work End Time</FieldLabel>
									<Input
										type="time"
										value={officeSettings.workEndTime}
										onChange={(e) =>
											setOfficeSettings({
												...officeSettings,
												workEndTime: e.target.value,
											})
										}
									/>
								</Field>
							</div>
							<Field>
								<FieldLabel>Late Threshold</FieldLabel>
								<Input
									type="time"
									value={officeSettings.lateThreshold}
									onChange={(e) =>
										setOfficeSettings({
											...officeSettings,
											lateThreshold: e.target.value,
										})
									}
								/>
								<p className="text-sm text-muted-foreground mt-1">
									Employees arriving after this time will be
									marked as late
								</p>
							</Field>
						</FieldGroup>
					</CardContent>
				</Card>

				{/* System Settings */}
				<Card className="border-0 shadow-sm">
					<CardHeader>
						<div className="flex items-center gap-2">
							<div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
								<Settings className="h-4 w-4 text-gray-500" />
							</div>
							<CardTitle className="text-base">System</CardTitle>
						</div>
						<CardDescription>
							System maintenance options
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="rounded-lg border border-border p-4">
							<h4 className="font-medium text-foreground">
								Data Storage
							</h4>
							<p className="text-sm text-muted-foreground mt-1">
								This demo uses localStorage for data
								persistence. Data will be preserved until
								browser data is cleared.
							</p>
						</div>
						<div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
							<h4 className="font-medium text-destructive">
								Danger Zone
							</h4>
							<p className="text-sm text-muted-foreground mt-1 mb-3">
								Reset all data including employees and
								attendance records.
							</p>
							<Button
								variant="destructive"
								size="sm"
								onClick={handleResetData}
								className="gap-2 bg-[#ba0f0f] text-white shadow-sm h-10 px-5 shrink-0 self-start sm:self-auto border-2 border-transparent hover:bg-white hover:text-[#ba0f0f] hover:border-[#ba0f0f] transition-colors"
							>
								Reset All Data
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Save Button */}
			<div className="flex justify-end">
				<Button
					onClick={handleSave}
					disabled={isSaving}
					className="gap-2 bg-[#0b2e4f] text-white shadow-sm h-10 px-5 shrink-0 self-start sm:self-auto border-2 border-transparent hover:bg-white hover:text-[#0b2e4f] hover:border-[#0b2e4f] transition-colors"
				>
					{isSaving ? "Saving..." : "Save Settings"}
				</Button>
			</div>
		</div>
	);
}
