import { cn } from '@/lib/utils'
import { UPDATE_TYPE_LABELS } from '@/lib/validations/contract'
import type { Contract, ContractUpdate } from '@/types'

interface ContractTimelineProps {
  contract: Contract
  updates: ContractUpdate[]
}

function formatARS(value: string | number) {
  return Number(value).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function ContractTimeline({ contract, updates }: ContractTimelineProps) {
  // Sort newest first
  const sorted = [...updates].sort(
    (a, b) => new Date(b.updateDate).getTime() - new Date(a.updateDate).getTime()
  )

  return (
    <div className="space-y-0">
      {/* Current state */}
      {sorted.length > 0 && (
        <TimelineItem
          date="Hoy"
          isFirst
          isLast={false}
          label="Precio vigente"
          content={
            <span className="font-mono tabular-nums font-semibold text-foreground">
              ${formatARS(contract.currentPrice)}
            </span>
          }
        />
      )}

      {/* Update history */}
      {sorted.map((update, i) => {
        const pct =
          Number(update.previousPrice) > 0
            ? (((Number(update.newPrice) - Number(update.previousPrice)) / Number(update.previousPrice)) * 100).toFixed(2)
            : '0.00'

        return (
          <TimelineItem
            key={update.id}
            date={formatDate(update.updateDate)}
            isFirst={sorted.length === 0}
            isLast={i === sorted.length - 1}
            label={UPDATE_TYPE_LABELS[update.updateType] ?? update.updateType}
            content={
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-mono tabular-nums text-sm text-muted-foreground line-through">
                  ${formatARS(update.previousPrice)}
                </span>
                <span className="text-muted-foreground text-xs">→</span>
                <span className="font-mono tabular-nums text-sm font-medium">
                  ${formatARS(update.newPrice)}
                </span>
                <span className="text-xs font-medium text-success">+{pct}%</span>
                {update.indexValue && (
                  <span className="text-xs text-muted-foreground">
                    índice: {Number(update.indexValue).toFixed(2)}%
                  </span>
                )}
              </div>
            }
          />
        )
      })}

      {/* Contract start */}
      <TimelineItem
        date={formatDate(contract.startDate)}
        isFirst={false}
        isLast
        label="Inicio del contrato"
        content={
          <span className="font-mono tabular-nums text-sm text-muted-foreground">
            Precio inicial: ${formatARS(contract.firstMonthPrice)}
          </span>
        }
        muted
      />
    </div>
  )
}

function TimelineItem({
  date,
  label,
  content,
  isFirst,
  isLast,
  muted,
}: {
  date: string
  label: string
  content: React.ReactNode
  isFirst: boolean
  isLast: boolean
  muted?: boolean
}) {
  return (
    <div className="flex gap-4">
      {/* Line + dot */}
      <div className="flex flex-col items-center">
        <div className={cn('w-px flex-1 bg-border', isFirst && 'invisible')} />
        <div className={cn(
          'h-2.5 w-2.5 shrink-0 rounded-full border-2',
          muted
            ? 'border-border bg-background'
            : 'border-primary bg-primary/20'
        )} />
        <div className={cn('w-px flex-1 bg-border', isLast && 'invisible')} />
      </div>

      {/* Content */}
      <div className={cn('pb-5 pt-0.5 min-w-0', isLast && 'pb-0')}>
        <p className={cn('text-xs mb-0.5', muted ? 'text-muted-foreground' : 'text-muted-foreground')}>
          {date}
        </p>
        <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
        <div>{content}</div>
      </div>
    </div>
  )
}
