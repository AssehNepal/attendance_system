"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth-context";
import { PartyPopper } from "lucide-react";
import {
	Building2,
	LayoutDashboard,
	Users,
	CalendarCheck,
	FileText,
	Settings,
	ChevronUp,
	LogOut,
	Monitor,
	User2,
	ClipboardList,
	Menu,
} from "lucide-react";

const navItems = [
	{
		title: "Dashboard",
		url: "/dashboard",
		icon: LayoutDashboard,
	},
	{
		title: "Employees",
		url: "/employees",
		icon: Users,
	},
	{
		title: "Departments",
		url: "/department",
		icon: Building2,
	},
	{
		title: "Attendance",
		url: "/attendance",
		icon: CalendarCheck,
	},
	{
		title: "Holidays",
		url: "/holidays",
		icon: PartyPopper,
	},
	{
		title: "Reports",
		url: "/reports",
		icon: FileText,
	},
	{
		title: "Settings",
		url: "/settings",
		icon: Settings,
	},
];

export function AppSidebar() {
	const pathname = usePathname();
	const { user, logout } = useAuth();
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	// Function to close mobile menu
	const closeMobileMenu = () => {
		setMobileMenuOpen(false);
	};

	// Sidebar content component (reused for both desktop and mobile)
	const SidebarContentComponent = () => (
		<>
			<SidebarHeader className="border-b border-sidebar-border">
				<Link href="/dashboard" onClick={closeMobileMenu}>
					<div className="flex items-center gap-3 px-2 py-2">
						<div className="flex h-15 w-12 items-center justify-center rounded-lg">
							<Image
								src="/icon.png"
								alt="Logo"
								width={60}
								height={60}
								className="object-contain items-center justify-center"
							/>
						</div>
						<div className="flex flex-col">
							<span className="text-sm font-semibold text-sidebar-foreground">
								Thimphu Dzongkhag
							</span>
							<span className="text-xs text-sidebar-foreground/70">
								Attendance System
							</span>
						</div>
					</div>
				</Link>
			</SidebarHeader>

			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Navigation</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{navItems.map((item) => (
								<SidebarMenuItem key={item.title}>
									<SidebarMenuButton
										asChild
										isActive={pathname === item.url}
									>
										<Link
											href={item.url}
											onClick={closeMobileMenu}
										>
											<item.icon className="h-4 w-4" />
											<span>{item.title}</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>

				<SidebarGroup>
					<SidebarGroupLabel>Quick Access</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							<SidebarMenuItem>
								<SidebarMenuButton asChild>
									<Link
										href="/tv"
										target="_blank"
										onClick={closeMobileMenu}
									>
										<Monitor className="h-4 w-4" />
										<span>TV Display</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter className="border-t border-sidebar-border">
				<SidebarMenu>
					<SidebarMenuItem>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<SidebarMenuButton className="w-full">
									<div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent">
										<User2 className="h-4 w-4 text-sidebar-accent-foreground" />
									</div>
									<div className="flex flex-col items-start">
										<span className="text-sm font-medium">
											{user?.name}
										</span>
										<span className="text-xs text-sidebar-foreground/70 capitalize">
											{user?.role}
										</span>
									</div>
									<ChevronUp className="ml-auto h-4 w-4" />
								</SidebarMenuButton>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								side="top"
								className="w-(--radix-popper-anchor-width)"
							>
								<DropdownMenuItem
									asChild
									className="cursor-pointer hover:bg-[#0B2E4F] hover:text-white focus:bg-[#0B2E4F] focus:text-white transition-colors"
								>
									<Link
										href="/settings"
										onClick={closeMobileMenu}
									>
										<Settings className="mr-2 h-4 w-4" />
										Settings
									</Link>
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									onClick={() => {
										logout();
										closeMobileMenu();
									}}
									className="text-destructive focus:text-destructive cursor-pointer hover:bg-[#0B2E4F] hover:text-white focus:bg-[#0B2E4F] focus:text-white transition-colors"
								>
									<LogOut className="mr-2 h-4 w-4" />
									Sign Out
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
		</>
	);

	return (
		<>
			{/* Desktop Sidebar - Hidden on mobile */}
			<div className="hidden md:block">
				<Sidebar>
					<SidebarContentComponent />
				</Sidebar>
			</div>

			{/* Mobile Header with Hamburger - Same styling as desktop sidebar */}
			<div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-sidebar border-b border-sidebar-border">
				<div className="flex items-center justify-between px-4 h-16">
					<Link href="/dashboard" className="flex items-center gap-2">
						<div className="flex h-8 w-8 items-center justify-center rounded-lg">
							<Image
								src="/icon.png"
								alt="Logo"
								width={32}
								height={32}
								className="object-contain"
							/>
						</div>
						<div className="flex flex-col">
							<span className="text-sm font-semibold text-sidebar-foreground">
								Thimphu Dzongkhag
							</span>
							<span className="text-xs text-sidebar-foreground/70">
								Attendance System
							</span>
						</div>
					</Link>

					<Sheet
						open={mobileMenuOpen}
						onOpenChange={setMobileMenuOpen}
					>
						<SheetTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className="text-sidebar-foreground hover:bg-[#0B2E4F] hover:text-white transition-colors group"
							>
								<Menu className="h-5 w-5 group-hover:text-white transition-colors" />
							</Button>
						</SheetTrigger>
						<SheetContent
							side="left"
							className="w-[280px] sm:w-[350px] p-0 bg-sidebar border-r border-sidebar-border"
						>
							<div className="flex flex-col h-full">
								{/* Mobile Sidebar Header - Same as desktop */}
								<div className="border-b border-sidebar-border p-4">
									<Link
										href="/dashboard"
										onClick={closeMobileMenu}
									>
										<div className="flex items-center gap-3">
											<div className="flex h-10 w-10 items-center justify-center rounded-lg">
												<Image
													src="/icon.png"
													alt="Logo"
													width={40}
													height={40}
													className="object-contain"
												/>
											</div>
											<div className="flex flex-col">
												<span className="text-sm font-semibold text-sidebar-foreground">
													Thimphu Dzongkhag
												</span>
												<span className="text-xs text-sidebar-foreground/70">
													Attendance System
												</span>
											</div>
										</div>
									</Link>
								</div>

								{/* Navigation Links */}
								<div className="flex-1 py-4">
									{navItems.map((item) => {
										const Icon = item.icon;
										const isActive = pathname === item.url;
										return (
											<Link
												key={item.url}
												href={item.url}
												onClick={closeMobileMenu}
												className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg transition-colors ${
													isActive
														? "bg-sidebar-accent text-sidebar-accent-foreground"
														: "text-sidebar-foreground hover:bg-[#0B2E4F] hover:text-white"
												}`}
											>
												<Icon className="h-4 w-4" />
												<span className="text-sm">
													{item.title}
												</span>
											</Link>
										);
									})}

									{/* TV Display Link */}
									<Link
										href="/tv"
										target="_blank"
										onClick={closeMobileMenu}
										className="flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sidebar-foreground hover:bg-[#0B2E4F] hover:text-white transition-colors"
									>
										<Monitor className="h-4 w-4" />
										<span className="text-sm">
											TV Display
										</span>
									</Link>
								</div>

								{/* User Info & Logout - Same as desktop footer */}
								<div className="border-t border-sidebar-border p-4">
									<div className="flex items-center gap-3 mb-3 p-2 rounded-lg bg-sidebar-accent/50">
										<div className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-accent">
											<User2 className="h-5 w-5 text-sidebar-accent-foreground" />
										</div>
										<div className="flex-1">
											<p className="text-sm font-medium text-sidebar-foreground">
												{user?.name}
											</p>
											<p className="text-xs text-sidebar-foreground/70 capitalize">
												{user?.role}
											</p>
										</div>
									</div>
									<Button
										variant="ghost"
										className="w-full justify-start text-sidebar-foreground hover:bg-[#0B2E4F] hover:text-white transition-colors"
										onClick={() => {
											logout();
											closeMobileMenu();
										}}
									>
										<LogOut className="h-4 w-4 mr-2" />
										Sign Out
									</Button>
								</div>
							</div>
						</SheetContent>
					</Sheet>
				</div>
			</div>

			{/* Add padding top to main content on mobile to account for fixed header */}
			<div className="md:hidden h-16" />
		</>
	);
}
