'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const STATUSES = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'paid', label: 'Pagados' },
  { value: 'partial', label: 'Parciales' },
  { value: 'overdue', label: 'Vencidos' },
  { value: 'cancelled', label: 'Cancelados' },
] as const

interface StatusFilterProps {
  current: string
  month: number
  year: number
}

export function StatusFilter({ current, month, year }: StatusFilterProps) {
  const router = useRouter()
  const pathname = usePathname()

  function select(status: string) {
    const params = new URLSearchParams()
    params.set('month', String(month))
    params.set('year', String(year))
    if (status !== 'all') params.set('status', status)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-1">
      {STATUSES.map(({ value, label }) => (
        <Button
          key={value}
          variant="ghost"
          size="sm"
          className={cn(
            'h-7 px-2.5 text-xs',
            current === value && 'bg-primary/10 text-primary'
          )}
          onClick={() => select(value)}
        >
          {label}
        </Button>
      ))}
    </div>
  )
}
