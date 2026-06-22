"use client"

interface EmployeeAvatarProps {
  cidNo: string
  name: string
  size?: "sm" | "md" | "lg"
  className?: string
  refreshKey?: number
  photoPreview?: string | null
}

export function EmployeeAvatar({ 
  name, 
  size = "md", 
  className = "", 
  photoPreview 
}: EmployeeAvatarProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-32 w-32"
  }

  const fontSize = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-4xl"
  }

  const getInitials = () => {
    return name?.charAt(0)?.toUpperCase() || "?"
  }

  // If there's a photo preview (newly uploaded or from localStorage), display it
  if (photoPreview) {
    return (
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-slate-100 ${className}`}>
        <img 
          src={photoPreview} 
          alt={name} 
          className="w-full h-full object-cover"
        />
      </div>
    )
  }

  // Fallback to initials if no photo
  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-[#0B2E4F] to-[#1a5a92] flex items-center justify-center text-white font-bold ${className}`}>
      <span className={fontSize[size]}>{getInitials()}</span>
    </div>
  )
}