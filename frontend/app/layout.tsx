import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { AuthProvider } from "@/lib/auth-context";
import { BackgroundPattern } from "@/components/background-pattern";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
	title: "Thimphu Dzongkhag Attendance System",
	description:
		"Attendance Management System for ThimphuDzongkhag Administration",
	icons: {
		icon: [{ url: "/icon.png", sizes: "512x512", type: "image/png" }],
		shortcut: "/icon.png",
		apple: "/icon.png",
	},
};

export const viewport: Viewport = {
	themeColor: "#1a1f36",
	width: "device-width",
	initialScale: 1,
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className="bg-background">
			<body className="font-sans antialiased">
				<BackgroundPattern />
				<AuthProvider>
					<div className="bg-pattern-container min-h-screen">
						{children}
					</div>
					<Toaster richColors position="top-right" /> {/* 👈 added */}
				</AuthProvider>
				{process.env.NODE_ENV === "production" && <Analytics />}
			</body>
		</html>
	);
}
