// components/employee/StatsCard.tsx
import { Card, CardContent } from "@/components/ui/card"
import { ReactNode } from "react"

interface StatsCardProps {
  icon: ReactNode
  label: string
  value: string | number
  subValue?: string
  color?: string
}

export function StatsCard({ icon, label, value, subValue, color = "slate" }: StatsCardProps) {
  const colorClasses = {
    emerald: "text-emerald-600",
    blue: "text-blue-600",
    amber: "text-amber-600",
    purple: "text-purple-600",
    slate: "text-slate-600"
  }
  
  return (
    <div className="p-2 bg-slate-50 rounded-lg border border-slate-100/50">
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{label}</p>
      <p className={`text-sm font-black ${colorClasses[color as keyof typeof colorClasses] || colorClasses.slate}`}>
        {value}
      </p>
      {subValue && <p className="text-[9px] text-slate-400">{subValue}</p>}
    </div>
  )
}