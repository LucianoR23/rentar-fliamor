import { type LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface KpiCardProps {
  title: string
  value: string
  description?: string
  icon?: LucideIcon
  className?: string
}

export function KpiCard({ title, value, description, icon: Icon, className }: KpiCardProps) {
  return (
    <Card className={className}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {Icon && <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />}
      </div>
      <p className="mt-2 font-mono text-2xl font-bold tabular-nums tracking-tight text-foreground">
        {value}
      </p>
      {description && (
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      )}
    </Card>
  )
}
