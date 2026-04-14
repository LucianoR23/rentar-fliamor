import { type LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface KpiCardProps {
  title: string
  value: string
  description?: string
  icon?: LucideIcon
  className?: string
}

export function KpiCard({ title, value, description, icon: Icon, className }: KpiCardProps) {
  return (
    <Card className={cn('group hover:shadow-md hover:shadow-black/10 hover:border-border/80', className)}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {Icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 transition-colors duration-150 group-hover:bg-primary/15">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        )}
      </div>
      <p className="mt-1 font-mono text-2xl font-bold tabular-nums tracking-tight text-foreground">
        {value}
      </p>
      {description && (
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      )}
    </Card>
  )
}
