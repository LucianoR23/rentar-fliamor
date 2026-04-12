'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Popover } from 'radix-ui'
import { Calendar as CalendarIcon } from 'lucide-react'
import { es } from 'react-day-picker/locale'
import { cn } from '@/lib/utils'
import { Calendar } from '@/components/ui/calendar'

function formatDisplay(value: string): string {
  if (!value) return ''
  const parts = value.split('-').map(Number)
  if (parts.length !== 3 || parts.some(isNaN)) return ''
  const [year, month, day] = parts
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`
}

type DateInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  ({ className, value, onChange, defaultValue, name, onBlur, disabled, ...props }, ref) => {
    const hiddenRef = useRef<HTMLInputElement>(null)
    useImperativeHandle(ref, () => hiddenRef.current!)

    const isControlled = value !== undefined
    const [internalValue, setInternalValue] = useState<string>((defaultValue as string) ?? '')
    const displayValue = isControlled ? (value as string) : internalValue

    // Sync with value set via ref by react-hook-form after mount
    useEffect(() => {
      if (isControlled) return
      const id = requestAnimationFrame(() => {
        if (hiddenRef.current?.value && hiddenRef.current.value !== internalValue) {
          setInternalValue(hiddenRef.current.value)
        }
      })
      return () => cancelAnimationFrame(id)
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const [open, setOpen] = useState(false)

    const selectedDate = displayValue ? new Date(displayValue + 'T00:00:00') : undefined
    const defaultMonth = selectedDate ?? new Date()

    function handleSelect(date: Date | undefined) {
      if (!date) return
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

      if (hiddenRef.current) {
        hiddenRef.current.value = dateStr
      }

      if (onChange) {
        const syntheticEvent = {
          target: { value: dateStr, name: name ?? '' },
          currentTarget: { value: dateStr, name: name ?? '' },
          type: 'change',
          nativeEvent: new Event('change'),
          bubbles: true,
          cancelable: false,
          defaultPrevented: false,
          eventPhase: 0,
          isTrusted: false,
          preventDefault: () => {},
          stopPropagation: () => {},
          isPropagationStopped: () => false,
          persist: () => {},
          isDefaultPrevented: () => false,
          timeStamp: Date.now(),
        } as unknown as React.ChangeEvent<HTMLInputElement>
        onChange(syntheticEvent)
      }

      if (!isControlled) {
        setInternalValue(dateStr)
      }

      setOpen(false)
    }

    return (
      <Popover.Root open={open} onOpenChange={setOpen}>
        {/* Hidden native input — receives ref and register props for RHF */}
        <input
          ref={hiddenRef}
          type="date"
          name={name}
          onBlur={onBlur}
          disabled={disabled}
          tabIndex={-1}
          aria-hidden="true"
          readOnly
          style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0, overflow: 'hidden' }}
          {...props}
        />

        <Popover.Trigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              'flex h-9 w-full items-center justify-between rounded-md border border-border',
              'bg-background px-3 text-sm text-foreground',
              'focus:outline-none focus:ring-1 focus:ring-primary',
              'hover:bg-muted/50 transition-colors cursor-pointer',
              'disabled:pointer-events-none disabled:opacity-50',
              !displayValue && 'text-muted-foreground',
              className,
            )}
          >
            <span className={cn('font-mono', !displayValue && 'text-muted-foreground')}>
              {displayValue ? formatDisplay(displayValue) : 'DD/MM/AAAA'}
            </span>
            <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
          </button>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            align="start"
            sideOffset={4}
            className={cn(
              'z-50 rounded-lg border border-border bg-card shadow-lg',
              'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
            )}
          >
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleSelect}
              defaultMonth={defaultMonth}
              captionLayout="dropdown"
              startMonth={new Date(2015, 0)}
              endMonth={new Date(2035, 11)}
              locale={es}
              weekStartsOn={1}
            />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    )
  },
)
DateInput.displayName = 'DateInput'
