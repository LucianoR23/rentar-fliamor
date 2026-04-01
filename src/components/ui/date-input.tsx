'use client'

import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { Popover } from 'radix-ui'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]
const DAY_NAMES = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do']

function parseDate(value: string): { year: number; month: number; day: number } | null {
  if (!value) return null
  const parts = value.split('-').map(Number)
  if (parts.length !== 3 || parts.some(isNaN)) return null
  const [year, month, day] = parts
  return { year, month, day }
}

function formatDisplay(value: string): string {
  const p = parseDate(value)
  if (!p) return ''
  return `${String(p.day).padStart(2, '0')}/${String(p.month).padStart(2, '0')}/${p.year}`
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

// Monday = 0, Sunday = 6
function firstWeekday(year: number, month: number): number {
  const day = new Date(year, month - 1, 1).getDay()
  return day === 0 ? 6 : day - 1
}

type DateInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  ({ className, value, onChange, defaultValue, name, onBlur, disabled, ...props }, ref) => {
    const hiddenRef = useRef<HTMLInputElement>(null)
    useImperativeHandle(ref, () => hiddenRef.current!)

    const isControlled = value !== undefined
    const [internalValue, setInternalValue] = useState<string>((defaultValue as string) ?? '')
    const displayValue = isControlled ? (value as string) : internalValue

    const now = new Date()
    const parsed = parseDate(displayValue)
    const [navYear, setNavYear] = useState(parsed?.year ?? now.getFullYear())
    const [navMonth, setNavMonth] = useState(parsed?.month ?? now.getMonth() + 1)
    const [open, setOpen] = useState(false)

    function handleOpenChange(next: boolean) {
      if (next) {
        const p = parseDate(displayValue)
        setNavYear(p?.year ?? now.getFullYear())
        setNavMonth(p?.month ?? now.getMonth() + 1)
      }
      setOpen(next)
    }

    function selectDay(day: number) {
      const dateStr = `${navYear}-${String(navMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`

      // Update hidden input so RHF ref reads the correct value
      if (hiddenRef.current) {
        hiddenRef.current.value = dateStr
      }

      // Call onChange with a synthetic-like event (RHF reads e.target.value)
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

    function prevMonth() {
      if (navMonth === 1) { setNavMonth(12); setNavYear((y) => y - 1) }
      else setNavMonth((m) => m - 1)
    }

    function nextMonth() {
      if (navMonth === 12) { setNavMonth(1); setNavYear((y) => y + 1) }
      else setNavMonth((m) => m + 1)
    }

    const numDays = daysInMonth(navYear, navMonth)
    const startOffset = firstWeekday(navYear, navMonth)

    const selectedParsed = parseDate(displayValue)
    const isSelectedMonth =
      selectedParsed?.year === navYear && selectedParsed?.month === navMonth

    const todayDay = now.getDate()
    const isCurrentMonth =
      now.getFullYear() === navYear && now.getMonth() + 1 === navMonth

    return (
      <Popover.Root open={open} onOpenChange={handleOpenChange}>
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
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
          </button>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            align="start"
            sideOffset={4}
            className={cn(
              'z-50 w-[268px] rounded-lg border border-border bg-card p-3 shadow-lg',
              'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
            )}
          >
            {/* Navigation header */}
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={prevMonth}
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium select-none">
                {MONTH_NAMES[navMonth - 1]} {navYear}
              </span>
              <button
                type="button"
                onClick={nextMonth}
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Day-name row */}
            <div className="grid grid-cols-7 mb-1">
              {DAY_NAMES.map((d) => (
                <div
                  key={d}
                  className="flex h-8 items-center justify-center text-xs font-medium text-muted-foreground select-none"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 gap-y-0.5">
              {Array.from({ length: startOffset }).map((_, i) => (
                <div key={`pad-${i}`} />
              ))}
              {Array.from({ length: numDays }).map((_, i) => {
                const day = i + 1
                const isSelected = isSelectedMonth && selectedParsed?.day === day
                const isToday = isCurrentMonth && todayDay === day

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => selectDay(day)}
                    className={cn(
                      'flex h-8 w-full items-center justify-center rounded-md text-sm transition-colors select-none',
                      isSelected
                        ? 'bg-primary text-primary-foreground font-semibold'
                        : isToday
                        ? 'border border-primary/60 text-primary font-medium hover:bg-primary/10'
                        : 'text-foreground hover:bg-muted/60',
                    )}
                  >
                    {day}
                  </button>
                )
              })}
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    )
  },
)
DateInput.displayName = 'DateInput'
