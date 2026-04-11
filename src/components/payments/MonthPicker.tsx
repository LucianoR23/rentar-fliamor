'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

interface MonthPickerProps {
  month: number
  year: number
  status?: string
}

export function MonthPicker({ month, year, status }: MonthPickerProps) {
  const router = useRouter()
  const pathname = usePathname()

  const navigate = useCallback(
    (m: number, y: number) => {
      const params = new URLSearchParams()
      params.set('month', String(m))
      params.set('year', String(y))
      if (status && status !== 'all') params.set('status', status)
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, status]
  )

  function prev() {
    if (month === 1) navigate(12, year - 1)
    else navigate(month - 1, year)
  }

  function next() {
    if (month === 12) navigate(1, year + 1)
    else navigate(month + 1, year)
  }

  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon-sm" onClick={prev} aria-label="Mes anterior">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="font-medium text-sm min-w-[150px] text-center tabular-nums">
        {MONTHS[month - 1]} {year}
      </span>
      <Button variant="ghost" size="icon-sm" onClick={next} aria-label="Mes siguiente">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
