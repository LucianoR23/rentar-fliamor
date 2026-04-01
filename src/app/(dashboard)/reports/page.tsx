import Link from 'next/link'
import { db } from '@/lib/db'
import { units } from '@/lib/schema'
import { PageHeader } from '@/components/shared/PageHeader'
import { cn } from '@/lib/utils'
import {
  MonthlyReportForm,
  UnitReportForm,
  CompleteReportForm,
  type UnitOption,
} from './ReportForms'

type Props = { searchParams: Promise<{ tab?: string }> }

const TABS = [
  { key: 'monthly', label: 'Mensual' },
  { key: 'unit', label: 'Por Unidad' },
  { key: 'complete', label: 'Completo' },
]

export default async function ReportsPage({ searchParams }: Props) {
  const { tab = 'monthly' } = await searchParams

  const allUnits: UnitOption[] = await db
    .select({ id: units.id, identifier: units.identifier, type: units.type, floor: units.floor })
    .from(units)
    .orderBy(units.identifier)

  return (
    <div>
      <PageHeader
        title="Reportes PDF"
        description="Generá y descargá reportes del sistema"
      />

      <nav className="flex gap-1 border-b border-border mb-6">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/reports?tab=${t.key}`}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === t.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {tab === 'monthly' && <MonthlyReportForm />}
      {tab === 'unit' && <UnitReportForm units={allUnits} />}
      {tab === 'complete' && <CompleteReportForm />}
    </div>
  )
}
