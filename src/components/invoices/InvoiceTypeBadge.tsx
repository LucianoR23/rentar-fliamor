'use client'

import { cn } from '@/lib/utils'

const styles = {
  A: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  B: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
}

export function InvoiceTypeBadge({ type }: { type: 'A' | 'B' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-semibold',
        styles[type]
      )}
    >
      {type}
    </span>
  )
}
