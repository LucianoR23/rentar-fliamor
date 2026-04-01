import * as React from 'react'
import { Input } from './input'
import { cn } from '@/lib/utils'

type CurrencyInputProps = React.InputHTMLAttributes<HTMLInputElement>

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-mono pointer-events-none select-none">
          $
        </span>
        <Input
          type="number"
          min="0"
          step="0.01"
          ref={ref}
          className={cn('pl-7 font-mono tabular-nums', className)}
          {...props}
        />
      </div>
    )
  }
)
CurrencyInput.displayName = 'CurrencyInput'
