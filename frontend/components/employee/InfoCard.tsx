// components/employee/InfoCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ReactNode } from "react"

interface InfoCardProps {
  title: string
  children: ReactNode
}

export function InfoCard({ title, children }: InfoCardProps) {
  return (
    <Card className="rounded-xl border-none shadow-sm ring-1 ring-slate-200/60">
      <CardHeader className="py-3 px-4 border-b border-slate-50">
        <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {children}
      </CardContent>
    </Card>
  )
}