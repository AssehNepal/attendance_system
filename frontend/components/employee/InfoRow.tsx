// components/employee/InfoRow.tsx
import { ReactNode } from "react"

interface InfoRowProps {
  icon: ReactNode
  label: string
  value: string
  monospace?: boolean
}

export function InfoRow({ icon, label, value, monospace }: InfoRowProps) {
  return (
    <div>
      <p className="text-[9px] font-bold text-slate-400 uppercase">{label}</p>
      <div className="flex items-center gap-2 mt-1">
        {icon}
        <p className={`text-xs font-semibold text-slate-700 ${monospace ? "font-mono" : ""}`}>
          {value || "Not available"}
        </p>
      </div>
    </div>
  )
}