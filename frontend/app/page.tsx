"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth-context";
import {
  Building2,
  Lock,
  User,
  AlertCircle,
  Monitor,
  Users,
  Shield,
  UserCheck,
  Mail,
  IdCard,
  Eye,
  EyeOff,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [cidNo, setCidNo] = useState(""); // Changed from employeeId to cidNo
  const [pin, setPin] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [activeRole, setActiveRole] = useState<"admin" | "employee">(
    "employee",
  );
  const [showPassword, setShowPassword] = useState(false);
  const { login, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (!authLoading && !isRedirecting) {
      if (user) {
        setIsRedirecting(true);
        if (user.role === "employee") {
          router.replace("/staff");
        } else {
          router.replace("/dashboard");
        }
      }
    }
  }, [user, authLoading, router, isRedirecting]);

  const handleEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Use cidNo instead of employeeId, and password instead of pin
    const success = await login(cidNo, password, "employee");

    if (!success) {
      setError("Invalid CID number or password");
    }

    setIsLoading(false);
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const success = await login(email, password, "admin");

    if (!success) {
      setError("Invalid admin credentials");
    }

    setIsLoading(false);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="animate-pulse text-slate-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Background Pattern */}
      <div
        className="fixed inset-0 bg-repeat opacity-10 -z-10"
        style={{ backgroundImage: "url('/images/bg-pattern.png')" }}
      />
      {/* Header */}
      <header className="flex items-center justify-between bg-white/80 backdrop-blur-sm px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex h-10 w-10 sm:h-16 sm:w-16 items-center justify-center">
            <Image
              src="/icon.png"
              alt="Logo"
              width={100}
              height={100}
              className="object-contain w-full h-full"
            />
          </div>
          <div>
            <h1 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-slate-900 leading-tight sm:leading-normal">
              Thimphu Dzongkhag Administration
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Attendance Management System
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/tv">
            <Button
              variant="outline"
              className="gap-1 sm:gap-2 border-slate-200 text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2 h-auto sm:h-10"
            >
              <Monitor className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">TV Display</span>
              <span className="xs:hidden">TV</span>
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex flex-1 items-center justify-center p-4">
        <Card className="w-full max-w-md border border-white/20 shadow-2xl bg-white/95 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-2 pt-4">
            <div className="mx-auto mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-[#0B2E4F]/10">
              <Lock className="h-6 w-6 text-[#0B2E4F]" />
            </div>
            <CardTitle className="text-xl font-bold text-center text-slate-900">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-center text-slate-500 text-sm">
              Sign in to access the attendance management system
            </CardDescription>
          </CardHeader>

          {/* Role Tabs */}
          <div className="px-6">
            <Tabs
              defaultValue="employee"
              className="w-full"
              onValueChange={(value) =>
                setActiveRole(value as "admin" | "employee")
              }
            >
              <TabsList className="grid w-full grid-cols-2 bg-slate-100 h-9">
                <TabsTrigger
                  value="employee"
                  className="data-[state=active]:bg-white data-[state=active]:text-[#0B2E4F] gap-1 text-xs"
                >
                  <UserCheck className="h-3 w-3" />
                  Employee Login
                </TabsTrigger>
                <TabsTrigger
                  value="admin"
                  className="data-[state=active]:bg-white data-[state=active]:text-[#0B2E4F] gap-1 text-xs"
                >
                  <Shield className="h-3 w-3" />
                  Admin Login
                </TabsTrigger>
              </TabsList>

              {/* Employee Login Tab - Updated for CID */}
              <TabsContent value="employee" className="mt-3">
                <form onSubmit={handleEmployeeSubmit}>
                  {error && activeRole === "employee" && (
                    <div className="mb-3 flex items-center gap-2 rounded-lg bg-red-50 p-2 text-xs text-red-600">
                      <AlertCircle className="h-3 w-3" />
                      {error}
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label
                        htmlFor="cidNo"
                        className="text-xs font-medium text-slate-700"
                      >
                        CID Number
                      </Label>
                      <div className="relative">
                        <IdCard className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        <Input
                          id="cidNo"
                          type="text"
                          placeholder="Enter your 11-digit CID number"
                          value={cidNo}
                          onChange={(e) => setCidNo(e.target.value)}
                          className="h-9 pl-9 border-slate-200 focus:border-[#0B2E4F] focus:ring-[#0B2E4F] text-sm"
                          required
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label
                        htmlFor="password"
                        className="text-xs font-medium text-slate-700"
                      >
                        Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="h-9 pl-9 pr-9 border-slate-200 focus:border-[#0B2E4F] focus:ring-[#0B2E4F] text-sm"
                          required
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          tabIndex={-1}
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                        >
                          {showPassword ? (
                            <EyeOff className="h-3.5 w-3.5" />
                          ) : (
                            <Eye className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-0">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="remember-employee"
                          checked={rememberMe}
                          onCheckedChange={(checked) =>
                            setRememberMe(checked as boolean)
                          }
                          className="h-3 w-3 border-slate-300 data-[state=checked]:bg-[#0B2E4F] data-[state=checked]:border-[#0B2E4F]"
                        />
                        <Label
                          htmlFor="remember-employee"
                          className="text-xs font-normal text-slate-600 cursor-pointer"
                        >
                          Remember me
                        </Label>
                      </div>
                      <Link
                        href="/forgot-password"
                        className="text-xs text-slate-600 hover:text-[#0B2E4F] transition-colors"
                      >
                        Forgot password?
                      </Link>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-9 mt-4 bg-[#0B2E4F] hover:bg-[#1a456b] text-white text-sm"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Signing in...
                      </div>
                    ) : (
                      "Sign in as Employee"
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Admin Login Tab - Keep as is */}
              <TabsContent value="admin" className="mt-3">
                <form onSubmit={handleAdminSubmit}>
                  {error && activeRole === "admin" && (
                    <div className="mb-3 flex items-center gap-2 rounded-lg bg-red-50 p-2 text-xs text-red-600">
                      <AlertCircle className="h-3 w-3" />
                      {error}
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label
                        htmlFor="email"
                        className="text-xs font-medium text-slate-700"
                      >
                        Email
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-9 pl-9 border-slate-200 focus:border-[#0B2E4F] focus:ring-[#0B2E4F] text-sm"
                          required
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label
                        htmlFor="admin-password"
                        className="text-xs font-medium text-slate-700"
                      >
                        Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        <Input
                          id="admin-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="h-9 pl-9 pr-9 border-slate-200 focus:border-[#0B2E4F] focus:ring-[#0B2E4F] text-sm"
                          required
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          tabIndex={-1}
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                        >
                          {showPassword ? (
                            <EyeOff className="h-3.5 w-3.5" />
                          ) : (
                            <Eye className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-0">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="remember-admin"
                          checked={rememberMe}
                          onCheckedChange={(checked) =>
                            setRememberMe(checked as boolean)
                          }
                          className="h-3 w-3 border-slate-300 data-[state=checked]:bg-[#0B2E4F] data-[state=checked]:border-[#0B2E4F]"
                        />
                        <Label
                          htmlFor="remember-admin"
                          className="text-xs font-normal text-slate-600 cursor-pointer"
                        >
                          Remember me
                        </Label>
                      </div>
                      <Link
                        href="/forgot-password"
                        className="text-xs text-slate-600 hover:text-[#0B2E4F] transition-colors"
                      >
                        Forgot password?
                      </Link>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-9 mt-4 bg-[#0B2E4F] hover:bg-[#1a456b] text-white text-sm"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Signing in...
                      </div>
                    ) : (
                      "Sign in as Administrator"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>

          <CardFooter className="flex flex-col space-y-2 px-6 pb-4 pt-2">
            <div className="text-center text-xs text-slate-400">
              <p>
                © 2024 Thimphu Dzongkhag Administration. All rights reserved.
              </p>
            </div>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
