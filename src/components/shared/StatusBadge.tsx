import { cn } from '@/lib/utils'

type BadgeVariant = 'success' | 'warning' | 'danger' | 'muted' | 'primary' | 'default'

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-success/15 text-success',
  warning: 'bg-amber-500/15 text-amber-500 dark:text-amber-400',
  danger: 'bg-danger/15 text-danger',
  muted: 'bg-muted text-muted-foreground',
  primary: 'bg-primary/10 text-primary',
  default: 'bg-secondary text-secondary-foreground',
}

interface StatusBadgeProps {
  variant?: BadgeVariant
  label: string
  className?: string
}

export function StatusBadge({ variant = 'default', label, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className
      )}
    >
      {label}
    </span>
  )
}
