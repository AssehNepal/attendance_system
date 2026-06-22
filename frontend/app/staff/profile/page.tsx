"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { EmployeeAvatar } from "@/components/employee/employee-avatar";
import {
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Calendar,
  ArrowLeft,
  Edit2,
  X,
  User,
  Clock,
  Camera,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Key,
  Save,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  fetchEmployeeProfile,
  updateStaffProfile,
  updateStaffPassword,
  fetchEmployeeStats,
  getValidHeaders,
  type EmployeeProfile,
  type UpdateProfileData,
} from "@/lib/employee-api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:9003";

interface ExtendedUser {
  id?: string;
  employee_id?: string;
  employeeId?: string;
  cid_no?: string;
  cidNo?: string;
  name?: string;
  contact_no?: string;
  contactNo?: string;
  email?: string;
  employment_type?: string;
  created_at?: string;
  address?: string;
  role?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, getAuthHeaders, refreshAccessToken } = useAuth();
  const extendedUser = user as ExtendedUser | null;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [employee, setEmployee] = useState<EmployeeProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [headers, setHeaders] = useState<Record<string, string> | null>(null);
  const [avatarRefreshKey, setAvatarRefreshKey] = useState(0);

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);

  const [stats, setStats] = useState({
    attendanceRate: 0,
    leaveBalance: 18,
    yearsOfService: 0,
    approvedOutings: 0,
  });

  const [formData, setFormData] = useState<UpdateProfileData>({
    name: "",
    email: "",
    contact_no: "",
    address: "",
  });

  // Helper functions for localStorage
  const savePhotoToLocalStorage = (
    employeeId: string,
    photoDataUrl: string,
  ) => {
    try {
      // Compress the photo if it's too large
      localStorage.setItem(`staff_photo_${employeeId}`, photoDataUrl);
      console.log("Photo saved to localStorage for employee:", employeeId);
    } catch (e) {
      console.error("Failed to save photo to localStorage", e);
      // If storage is full, try to compress or show error
      if (e instanceof DOMException && e.name === "QuotaExceededError") {
        setError("Photo is too large. Please try a smaller image.");
      }
    }
  };

  const loadPhotoFromLocalStorage = (employeeId: string): string | null => {
    try {
      const photo = localStorage.getItem(`staff_photo_${employeeId}`);
      if (photo) {
        console.log("Photo loaded from localStorage for employee:", employeeId);
      }
      return photo;
    } catch (e) {
      console.error("Failed to load photo from localStorage", e);
      return null;
    }
  };

  const deletePhotoFromLocalStorage = (employeeId: string) => {
    try {
      localStorage.removeItem(`staff_photo_${employeeId}`);
      console.log("Photo deleted from localStorage for employee:", employeeId);
    } catch (e) {
      console.error("Failed to delete photo from localStorage", e);
    }
  };

  useEffect(() => {
    if (!user) {
      router.push("/");
      return;
    }
    if (extendedUser?.role !== "employee") {
      router.push("/dashboard");
      return;
    }
    init();
  }, [user, router, extendedUser?.role]);

  // Load saved photo from localStorage on component mount
  useEffect(() => {
    if (employee?.id) {
      const savedPhoto = loadPhotoFromLocalStorage(employee.id);
      if (savedPhoto) {
        setPhotoPreview(savedPhoto);
      }
    }
  }, [employee?.id]);

  const init = async () => {
    const authHeaders = await getValidHeaders(
      getAuthHeaders,
      refreshAccessToken,
      router,
    );
    if (authHeaders) {
      setHeaders(authHeaders);
      await loadProfile(authHeaders);
    } else {
      setLoading(false);
      setError("Could not authenticate");
    }
  };

  const loadProfile = async (authHeaders: Record<string, string>) => {
    setLoading(true);
    setError("");

    try {
      const staffId = extendedUser?.id || "";

      if (!staffId) {
        setError("User ID not available. Please log in again.");
        setLoading(false);
        return;
      }

      const profile = await fetchEmployeeProfile(authHeaders, staffId);

      if (profile) {
        setEmployee(profile);
        setFormData({
          name: profile.name || "",
          email: profile.email || "",
          contact_no: profile.contact_no || "",
          address: profile.address || "",
        });

        setAvatarRefreshKey((prev) => prev + 1);

        let yearsOfService = 0;
        if (profile.created_at) {
          const joinedDate = new Date(profile.created_at);
          yearsOfService = Math.floor(
            (new Date().getTime() - joinedDate.getTime()) /
              (1000 * 60 * 60 * 24 * 365),
          );
        }

        const employeeStats = await fetchEmployeeStats(authHeaders);

        setStats({
          attendanceRate: employeeStats.attendanceRate,
          leaveBalance: employeeStats.leaveBalance,
          yearsOfService: yearsOfService,
          approvedOutings: employeeStats.approvedOutings,
        });
      } else {
        setError("Failed to load profile data");
      }
    } catch (err) {
      console.error("Error loading profile:", err);
      setError("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (JPEG, PNG, etc.)");
      return;
    }

    setUploadingPhoto(true);
    setError("");
    setSuccess("");

    try {
      if (employee) {
        // Convert to base64 for localStorage
        const reader = new FileReader();

        reader.onloadend = () => {
          const base64Data = reader.result as string;

          // Save to localStorage
          savePhotoToLocalStorage(employee.id, base64Data);
          setPhotoPreview(base64Data);
          setAvatarRefreshKey((prev) => prev + 1);

          setSuccess("Profile photo updated successfully!");
          setTimeout(() => setSuccess(""), 3000);
        };

        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error("Error processing photo:", err);
      setError("Error processing photo. Please try again.");
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleProfileSave = async () => {
    if (!formData.email?.trim()) {
      setError("Email is required");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }
    if (!formData.contact_no?.trim()) {
      setError("Contact number is required");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (headers && employee) {
        const result = await updateStaffProfile(headers, employee.id, formData);

        if (result.success) {
          setIsEditing(false);
          setSuccess(result.message || "Profile updated successfully!");
          await loadProfile(headers);
          setTimeout(() => {
            setSuccess("");
          }, 3000);
        } else {
          setError(result.message || "Failed to update profile");
        }
      }
    } catch (err) {
      console.error("Save error:", err);
      setError("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordData.currentPassword) {
      setError("Current password is required");
      return;
    }
    if (!passwordData.newPassword) {
      setError("New password is required");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    setChangingPassword(true);
    setError("");
    setSuccess("");

    try {
      if (headers && employee) {
        const result = await updateStaffPassword(
          headers,
          employee.id,
          passwordData,
        );

        if (result.success) {
          setSuccess(result.message || "Password updated successfully!");
          setPasswordData({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          });
          setShowPasswordForm(false);
          setTimeout(() => setSuccess(""), 3000);
        } else {
          setError(result.message || "Failed to update password");
        }
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleChange = (field: keyof UpdateProfileData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
    setSuccess("");
  };

  const handlePasswordChange = (
    field: keyof typeof passwordData,
    value: string,
  ) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
    setError("");
    setSuccess("");
  };

  const handleCancel = () => {
    setIsEditing(false);
    setShowPasswordForm(false);
    if (employee) {
      setFormData({
        name: employee.name || "",
        email: employee.email || "",
        contact_no: employee.contact_no || "",
        address: employee.address || "",
      });
    }
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setError("");
    setSuccess("");
  };

  const getEmployeeName = (): string => employee?.name || "";
  const getEmployeeId = (): string => employee?.employee_id || "N/A";
  const getCidNo = (): string => employee?.cid_no || "N/A";
  const getEmploymentType = (): string => {
    const type = employee?.employment_type || "regular";
    return type.charAt(0).toUpperCase() + type.slice(1);
  };
  const getJoinDate = (): string => {
    if (employee?.created_at) {
      return new Date(employee.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
    return "Not available";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#0B2E4F] mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!employee || !headers) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-2xl shadow-lg">
          <div className="bg-red-100 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-10 w-10 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Profile Not Found
          </h2>
          <p className="text-slate-600 mb-6">
            {error || "Unable to load employee profile data"}
          </p>
          <Button
            onClick={() => router.push("/staff")}
            className="bg-[#0B2E4F] hover:bg-[#1a5a92]"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-12">
      <nav className="w-full bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/staff")}
            className="hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="flex gap-2">
            {!isEditing && !showPasswordForm ? (
              <Button
                size="sm"
                onClick={() => setIsEditing(true)}
                className="bg-[#0B2E4F] hover:bg-[#1a5a92]"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={saving || uploadingPhoto || changingPassword}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 flex gap-3 shadow-sm">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4 flex gap-3 shadow-sm">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-green-700 text-sm">{success}</p>
          </div>
        )}

        {/* Profile Header */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="h-24 w-full bg-gradient-to-r from-[#0B2E4F] to-[#1a5a92]"></div>
          <CardContent className="px-6 pb-6 relative">
            <div className="flex flex-col md:flex-row gap-6 -mt-16">
              <div className="relative group">
                {uploadingPhoto ? (
                  <div className="h-32 w-32 rounded-2xl bg-gradient-to-br from-[#0B2E4F] to-[#1a5a92] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                ) : (
                  <EmployeeAvatar
                    name={employee.name}
                    size="lg"
                    className="rounded-2xl"
                    photoPreview={photoPreview}
                  />
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="absolute bottom-0 right-0 bg-[#0B2E4F] hover:bg-[#1a5a92] disabled:bg-gray-400 text-white rounded-full p-2 shadow-lg transition transform hover:scale-105"
                >
                  <Camera className="h-4 w-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,image/gif"
                  onChange={handlePhotoChange}
                  className="hidden"
                  disabled={uploadingPhoto}
                />
              </div>

              <div className="flex-1 pt-4 md:pt-0">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white">
                      {getEmployeeName()}
                    </h1>
                    <p className="text-slate-600 text-sm mt-1">
                      {getEmploymentType()} Employee
                    </p>
                  </div>
                  <Badge
                    className={
                      employee.is_active
                        ? "bg-green-100 text-green-800 border-green-200"
                        : "bg-red-100 text-red-800 border-red-200"
                    }
                    variant="secondary"
                  >
                    {employee.is_active ? "● Active" : "● Inactive"}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                  <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100">
                    <p className="text-xs text-slate-600 font-semibold uppercase tracking-wide">
                      Attendance
                    </p>
                    <p className="text-2xl font-bold text-slate-900">
                      {stats.attendanceRate}%
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100">
                    <p className="text-xs text-slate-600 font-semibold uppercase tracking-wide">
                      Leave Balance
                    </p>
                    <p className="text-2xl font-bold text-slate-900">
                      {stats.leaveBalance}{" "}
                      <span className="text-sm font-normal">days</span>
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100">
                    <p className="text-xs text-slate-600 font-semibold uppercase tracking-wide">
                      Service
                    </p>
                    <p className="text-2xl font-bold text-slate-900">
                      {stats.yearsOfService}{" "}
                      <span className="text-sm font-normal">yrs</span>
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100">
                    <p className="text-xs text-slate-600 font-semibold uppercase tracking-wide">
                      Outings
                    </p>
                    <p className="text-2xl font-bold text-slate-900">
                      {stats.approvedOutings}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Form */}
        {isEditing ? (
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <User className="h-5 w-5 text-[#0B2E4F]" />
                Edit Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-500" />
                    Full Name
                  </Label>
                  <Input
                    type="text"
                    value={formData.name || ""}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="Enter your full name"
                    className="border-slate-200 focus:border-[#0B2E4F]"
                    disabled={saving}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-slate-500" />
                    Email Address
                  </Label>
                  <Input
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="Enter your email"
                    className="border-slate-200 focus:border-[#0B2E4F]"
                    disabled={saving}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-500" />
                    Contact Number
                  </Label>
                  <Input
                    type="tel"
                    value={formData.contact_no || ""}
                    onChange={(e) => handleChange("contact_no", e.target.value)}
                    placeholder="Enter your contact number"
                    className="border-slate-200 focus:border-[#0B2E4F]"
                    disabled={saving}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-500" />
                    Residential Address
                  </Label>
                  <textarea
                    value={formData.address || ""}
                    onChange={(e) => handleChange("address", e.target.value)}
                    placeholder="Enter your address"
                    rows={3}
                    className="w-full text-sm p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2E4F] focus:border-transparent resize-none"
                    disabled={saving}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleProfileSave}
                    disabled={saving}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : showPasswordForm ? (
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Key className="h-5 w-5 text-[#0B2E4F]" />
                Change Password
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Current Password</Label>
                  <div className="relative">
                    <Input
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        handlePasswordChange("currentPassword", e.target.value)
                      }
                      placeholder="Enter current password"
                      className="pr-10"
                      disabled={changingPassword}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>New Password</Label>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        handlePasswordChange("newPassword", e.target.value)
                      }
                      placeholder="Enter new password (min 6 characters)"
                      className="pr-10"
                      disabled={changingPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        handlePasswordChange("confirmPassword", e.target.value)
                      }
                      placeholder="Confirm new password"
                      className="pr-10"
                      disabled={changingPassword}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={changingPassword}
                    className="bg-[#0B2E4F] hover:bg-[#1a5a92]"
                  >
                    {changingPassword ? "Updating..." : "Update Password"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={changingPassword}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-[#0B2E4F]" />
                  Employment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div>
                  <p className="text-xs text-slate-600 font-semibold">
                    CID Number
                  </p>
                  <p className="text-sm font-mono bg-slate-50 p-2 rounded">
                    {getCidNo()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 font-semibold">
                    Employee ID
                  </p>
                  <p className="text-sm font-mono bg-slate-50 p-2 rounded">
                    {getEmployeeId()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 font-semibold">
                    Employment Type
                  </p>
                  <p className="text-sm bg-slate-50 p-2 rounded">
                    {getEmploymentType()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 font-semibold">
                    Joining Date
                  </p>
                  <p className="text-sm bg-slate-50 p-2 rounded flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    {getJoinDate()}
                  </p>
                </div>
                {employee.last_login_at && (
                  <div>
                    <p className="text-xs text-slate-600 font-semibold">
                      Last Login
                    </p>
                    <p className="text-sm bg-slate-50 p-2 rounded flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      {new Date(employee.last_login_at).toLocaleString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="lg:col-span-2 space-y-6">
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-3 border-b border-slate-100">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <User className="h-4 w-4 text-[#0B2E4F]" />
                    Contact Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5 pt-4">
                  <div>
                    <p className="text-xs text-slate-600 font-semibold flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Address
                    </p>
                    <div className="bg-slate-50 p-3 rounded border">
                      <p className="text-sm">
                        {employee.email || "Not provided"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 font-semibold flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Contact Number
                    </p>
                    <div className="bg-slate-50 p-3 rounded border">
                      <p className="text-sm">
                        {employee.contact_no || "Not provided"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 font-semibold flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Residential Address
                    </p>
                    <div className="bg-slate-50 p-3 rounded border">
                      <p className="text-sm whitespace-pre-wrap">
                        {employee.address || "Not provided"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-3 border-b border-slate-100">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Key className="h-4 w-4 text-[#0B2E4F]" />
                    Security
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <Button
                    onClick={() => setShowPasswordForm(true)}
                    variant="outline"
                    className="border-[#0B2E4F] text-[#0B2E4F] hover:bg-[#0B2E4F] hover:text-white"
                  >
                    Change Password
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
