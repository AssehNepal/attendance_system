import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { ReactNode } from "react"

interface EditableFieldProps {
  icon: ReactNode
  label: string
  value: string
  isEditing: boolean
  onChange: (value: string) => void
  placeholder?: string
  type?: "text" | "email" | "tel"
  monospace?: boolean
}

export function EditableField({
  icon,
  label,
  value,
  isEditing,
  onChange,
  placeholder = "Not provided",
  type = "text",
  monospace = false
}: EditableFieldProps) {
  return (
    <div className="space-y-2.5 group">
      <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] ml-0.5 group-focus-within:text-indigo-500 transition-colors">
        {label}
      </Label>
      <div className="flex items-center gap-3 border-b border-slate-100 pb-1 group-focus-within:border-indigo-500 transition-all">
        <div className={cn(
          "h-4 w-4 flex-shrink-0 transition-colors duration-300",
          isEditing ? "text-indigo-500" : "text-slate-400"
        )}>
          {icon}
        </div>
        <input
          type={type}
          readOnly={!isEditing}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "w-full bg-transparent text-sm font-semibold outline-none border-none p-0 h-7",
            isEditing ? "text-slate-900" : "text-slate-600 cursor-default",
            monospace && "font-mono"
          )}
        />
      </div>
    </div>
  )
}