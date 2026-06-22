import { Label } from "@/components/ui/label"
import { ReactNode } from "react"

interface ReadOnlyFieldProps {
  icon: ReactNode
  label: string
  value: string
  monospace?: boolean
}

export function ReadOnlyField({ icon, label, value, monospace }: ReadOnlyFieldProps) {
  return (
    <div className="space-y-2.5">
      <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">
        {label}
      </Label>
      <div className="flex items-center gap-3 border-b border-slate-100 pb-1">
        <div className="h-4 w-4 text-slate-400">{icon}</div>
        <span className={`text-sm font-semibold text-slate-700 ${monospace ? "font-mono" : ""}`}>
          {value || "Not provided"}
        </span>
      </div>
    </div>
  )
}