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
import {
  AlertCircle,
  ArrowLeft,
  Lock,
  Mail,
  IdCard,
  CheckCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const router = useRouter();

  // Step 1: Request OTP
  const [step, setStep] = useState<"request" | "reset">("request");
  const [role, setRole] = useState<"admin" | "employee">("employee");
  const [email, setEmail] = useState("");
  const [cidNo, setCidNo] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [resendDisabled, setResendDisabled] = useState(false);

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:9003";

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else {
      setResendDisabled(false);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Email validation function
  const isValidEmail = (email: string) => {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // API 1: Request OTP - Send only email field
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    // Get the email based on role
    let userEmail = "";
    if (role === "employee") {
      userEmail = email;
      if (!userEmail || !isValidEmail(userEmail)) {
        setError("Please enter a valid email address");
        setIsLoading(false);
        return;
      }
    } else {
      userEmail = email;
      if (!userEmail || !isValidEmail(userEmail)) {
        setError("Please enter a valid email address");
        setIsLoading(false);
        return;
      }
    }

    // Prepare request body - ONLY email field as per backend requirement
    const requestBody = {
      email: userEmail,
    };

    console.log(
      "Sending request to:",
      `${API_BASE_URL}/forgot-password/request-otp`,
    );
    console.log("Request body:", requestBody);

    try {
      const response = await fetch(
        `${API_BASE_URL}/forgot-password/request-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(requestBody),
        },
      );

      console.log("Response status:", response.status);

      let data;
      const responseText = await response.text();
      console.log("Response text:", responseText);

      try {
        data = JSON.parse(responseText);
      } catch (e) {
        data = { message: responseText };
      }

      if (response.ok) {
        setStep("reset");
        setSuccess(
          data.message || data.msg || "OTP sent to your email address",
        );
        setCountdown(60);
        setResendDisabled(true);
      } else {
        const errorMessage =
          data.message || data.error || data.msg || `Failed to send OTP`;
        // Handle array error messages
        if (Array.isArray(errorMessage)) {
          setError(errorMessage.join(", "));
        } else {
          setError(errorMessage);
        }
      }
    } catch (error) {
      console.error("Network error:", error);
      setError(
        "Network error. Please check if the server is running and try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // API 2: Reset Password with OTP - Send email, otp, and newPassword
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    // Get the email based on role
    const userEmail = email;

    // Validation
    if (!userEmail || !isValidEmail(userEmail)) {
      setError("Invalid email address");
      setIsLoading(false);
      return;
    }

    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      setIsLoading(false);
      return;
    }

    // Prepare request body - email, otp, and newPassword
    const requestBody = {
      email: userEmail,
      otp: otp,
      newPassword: newPassword,
    };

    console.log(
      "Sending reset request to:",
      `${API_BASE_URL}/forgot-password/reset-password`,
    );
    console.log("Request body:", { ...requestBody, newPassword: "***" });

    try {
      const response = await fetch(
        `${API_BASE_URL}/forgot-password/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(requestBody),
        },
      );

      console.log("Reset response status:", response.status);

      let data;
      const responseText = await response.text();
      console.log("Reset response text:", responseText);

      try {
        data = JSON.parse(responseText);
      } catch (e) {
        data = { message: responseText };
      }

      if (response.ok) {
        setSuccess(
          data.message ||
            data.msg ||
            "Password reset successfully! Redirecting to login page...",
        );
        setTimeout(() => {
          // Redirect to root (homepage/login page)
          router.push("/");
        }, 2000);
      } else {
        const errorMessage =
          data.message || data.error || data.msg || "Failed to reset password";
        if (Array.isArray(errorMessage)) {
          setError(errorMessage.join(", "));
        } else {
          setError(errorMessage);
        }
      }
    } catch (error) {
      console.error("Network error:", error);
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendDisabled) return;

    setIsLoading(true);
    setError("");
    setSuccess("");

    const userEmail = email;

    const requestBody = {
      email: userEmail,
    };

    try {
      const response = await fetch(
        `${API_BASE_URL}/forgot-password/request-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(requestBody),
        },
      );

      let data;
      const responseText = await response.text();
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        data = { message: responseText };
      }

      if (response.ok) {
        setSuccess(data.message || data.msg || "New OTP sent to your email");
        setCountdown(60);
        setResendDisabled(true);
      } else {
        const errorMessage =
          data.message || data.error || data.msg || "Failed to resend OTP";
        if (Array.isArray(errorMessage)) {
          setError(errorMessage.join(", "));
        } else {
          setError(errorMessage);
        }
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

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
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex flex-1 items-center justify-center p-4">
        <Card className="w-full max-w-md border border-white/20 shadow-2xl bg-white/95 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-2 pt-4">
            <Link
              href="/"
              className="absolute left-4 top-4 text-slate-500 hover:text-slate-700 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="mx-auto mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-[#0B2E4F]/10">
              <Lock className="h-6 w-6 text-[#0B2E4F]" />
            </div>
            <CardTitle className="text-xl font-bold text-center text-slate-900">
              {step === "request" ? "Forgot Password" : "Reset Password"}
            </CardTitle>
            <CardDescription className="text-center text-slate-500 text-sm">
              {step === "request"
                ? "Enter your email address to receive an OTP"
                : "Enter the OTP and create a new password"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Error and Success Messages */}
            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-600">
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {/* Step 1: Request OTP */}
            {step === "request" && (
              <form onSubmit={handleRequestOtp}>
                <div className="space-y-4">
                  {/* Role Selection - Just for UI, backend uses email only */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">
                      Account Type
                    </Label>
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          setRole("employee");
                          setError("");
                        }}
                        className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                          role === "employee"
                            ? "border-[#0B2E4F] bg-[#0B2E4F]/5 text-[#0B2E4F]"
                            : "border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        Employee
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRole("admin");
                          setError("");
                        }}
                        className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                          role === "admin"
                            ? "border-[#0B2E4F] bg-[#0B2E4F]/5 text-[#0B2E4F]"
                            : "border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        Admin
                      </button>
                    </div>
                  </div>

                  {/* Email Field - For both roles */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-sm font-medium text-slate-700"
                    >
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your registered email address"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (error.includes("email")) {
                            setError("");
                          }
                        }}
                        className="pl-10"
                        required
                      />
                    </div>
                    <p className="text-xs text-slate-500">
                      Enter the email address associated with your {role}{" "}
                      account
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-[#0B2E4F] hover:bg-[#1a456b]"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Sending OTP...
                      </div>
                    ) : (
                      "Send OTP"
                    )}
                  </Button>
                </div>
              </form>
            )}

            {/* Step 2: Reset Password with OTP */}
            {step === "reset" && (
              <form onSubmit={handleResetPassword}>
                <div className="space-y-4">
                  {/* Display which email is being reset */}
                  <div className="rounded-lg bg-slate-50 p-3 text-center">
                    <p className="text-xs text-slate-600">
                      Resetting password for:{" "}
                      <span className="font-semibold text-slate-900">
                        {email}
                      </span>
                    </p>
                  </div>

                  {/* OTP Input */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="otp"
                      className="text-sm font-medium text-slate-700"
                    >
                      One-Time Password (OTP)
                    </Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(e) =>
                        setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      maxLength={6}
                      required
                      className="text-center text-2xl tracking-widest font-mono"
                    />
                    <p className="text-xs text-slate-500 text-center">
                      Please check your email for the OTP
                    </p>
                  </div>

                  {/* New Password */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="newPassword"
                      className="text-sm font-medium text-slate-700"
                    >
                      New Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                    <p className="text-xs text-slate-500">
                      Password must be at least 6 characters long
                    </p>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="confirmPassword"
                      className="text-sm font-medium text-slate-700"
                    >
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setStep("request");
                        setError("");
                        setSuccess("");
                        setOtp("");
                        setNewPassword("");
                        setConfirmPassword("");
                      }}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-[#0B2E4F] hover:bg-[#1a456b]"
                      disabled={isLoading || otp.length !== 6}
                    >
                      {isLoading ? "Resetting..." : "Reset Password"}
                    </Button>
                  </div>

                  {/* Resend OTP Link */}
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendDisabled}
                      className={`text-sm ${
                        resendDisabled
                          ? "text-slate-400 cursor-not-allowed"
                          : "text-[#0B2E4F] hover:underline"
                      }`}
                    >
                      {resendDisabled
                        ? `Resend OTP in ${countdown}s`
                        : "Resend OTP"}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </CardContent>

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
