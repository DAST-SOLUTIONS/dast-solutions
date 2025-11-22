import { ReactNode } from "react"

type StatCardProps = {
  title: string
  value: number | string
  icon?: ReactNode
  subtitle?: string
  trend?: { text: string; positive?: boolean; danger?: boolean }
}

export function StatCard({ title, value, icon, subtitle, trend }: StatCardProps) {
  return (
    <div className="card p-5 flex gap-4 items-start">
      {icon && <div className="text-2xl opacity-70">{icon}</div>}
      <div className="flex-1">
        <div className="text-xs font-semibold text-gray-500 tracking-wide">{title}</div>
        <div className="text-3xl font-bold">
          {typeof value === "number" ? value.toLocaleString("fr-CA") : value}
        </div>
        {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
        {trend && (
          <div className={`text-xs mt-2 ${trend.danger ? "text-red-600" : trend.positive ? "text-teal-600" : "text-gray-500"}`}>
            {trend.text}
          </div>
        )}
      </div>
    </div>
  )
}
