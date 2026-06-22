// components/employee/HistoryTable.tsx
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { ReactNode } from "react"

interface Column {
  key: string
  header: string
  render?: (value: any, item: any) => ReactNode
}

interface HistoryTableProps {
  columns: Column[]
  data: any[]
  emptyMessage: string
  emptyIcon: ReactNode
}

export function HistoryTable({ columns, data, emptyMessage, emptyIcon }: HistoryTableProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="h-12 w-12 text-slate-300 mx-auto mb-4">{emptyIcon}</div>
        <p className="text-slate-500">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#0B2E4F]">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="text-left text-white font-semibold py-3 px-4">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={item.id} className={cn("border-b border-slate-200", index % 2 === 0 ? "bg-white" : "bg-slate-50/50")}>
                {columns.map((col) => (
                  <td key={col.key} className="py-3 px-4 text-sm">
                    {col.render ? col.render(item[col.key], item) : item[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}