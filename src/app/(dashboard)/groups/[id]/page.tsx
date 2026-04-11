import { notFound } from 'next/navigation'
import Link from 'next/link'
import { eq, and, desc } from 'drizzle-orm'
import { Pencil, Plus } from 'lucide-react'
import { db } from '@/lib/db'
import { groups, units, contracts, groupExpenses, groupExpenseUnits, groupCostConfig } from '@/lib/schema'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { UnitStatusBadge } from '@/components/units/UnitStatusBadge'
import { GroupExpensesList, type GroupExpenseWithUnits } from '@/components/groups/GroupExpensesList'
import { UNIT_TYPE_LABELS } from '@/lib/validations/unit'
import { cn } from '@/lib/utils'

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}

const TABS = [
  { key: 'units', label: 'Unidades' },
  { key: 'expenses', label: 'Gastos' },
  { key: 'config', label: 'Configuración' },
]

export default async function GroupDetailPage({ params, searchParams }: Props) {
  const { id } = await params
  const { tab = 'units' } = await searchParams

  const group = await db.query.groups.findFirst({ where: eq(groups.id, id) })
  if (!group) notFound()

  // Load data for all tabs
  const unitRows = await db
    .select({ unit: units, activeContract: contracts })
    .from(units)
    .leftJoin(
      contracts,
      and(eq(contracts.unitId, units.id), eq(contracts.status, 'active'))
    )
    .where(eq(units.groupId, id))
    .orderBy(units.identifier)

  const expenseRows = await db
    .select()
    .from(groupExpenses)
    .where(eq(groupExpenses.groupId, id))
    .orderBy(desc(groupExpenses.createdAt))

  // Load scoped unit identifiers for expenses in this group
  const scopedRows = await db
    .select({
      groupExpenseId: groupExpenseUnits.groupExpenseId,
      unitIdentifier: units.identifier,
    })
    .from(groupExpenseUnits)
    .innerJoin(units, eq(groupExpenseUnits.unitId, units.id))
    .innerJoin(groupExpenses, eq(groupExpenseUnits.groupExpenseId, groupExpenses.id))
    .where(eq(groupExpenses.groupId, id))

  const scopedMap = new Map<string, string[]>()
  for (const row of scopedRows) {
    const arr = scopedMap.get(row.groupExpenseId) ?? []
    arr.push(row.unitIdentifier)
    scopedMap.set(row.groupExpenseId, arr)
  }

  const expenses: GroupExpenseWithUnits[] = expenseRows.map((e) => ({
    ...e,
    scopedUnitIdentifiers: scopedMap.get(e.id),
  }))

  const costConfig = await db
    .select()
    .from(groupCostConfig)
    .where(eq(groupCostConfig.groupId, id))

  return (
    <div>
      <PageHeader title={group.name} description={group.address} backHref="/groups">
        <Button asChild size="sm">
          <Link href={`/groups/${id}/edit`}>
            <Pencil className="h-4 w-4" />
            Editar
          </Link>
        </Button>
      </PageHeader>

      {/* Tabs */}
      <nav className="flex gap-1 border-b border-border mb-6">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/groups/${id}?tab=${t.key}`}
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

      {/* Units tab */}
      {tab === 'units' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {unitRows.length} unidad{unitRows.length !== 1 ? 'es' : ''}
            </p>
            <Button asChild size="sm">
              <Link href={`/units/new`}>
                <Plus className="h-4 w-4" />
                Nueva unidad
              </Link>
            </Button>
          </div>
          {unitRows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Este grupo no tiene unidades aún.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {unitRows.map(({ unit, activeContract }) => (
                <Link
                  key={unit.id}
                  href={`/units/${unit.id}`}
                  className="rounded-lg border border-border bg-card p-4 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium font-mono tabular-nums text-sm">{unit.identifier}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {UNIT_TYPE_LABELS[unit.type] ?? unit.type}
                        {unit.floor ? ` · ${unit.floor}` : ''}
                      </p>
                    </div>
                    <UnitStatusBadge hasActiveContract={!!activeContract} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Expenses tab */}
      {tab === 'expenses' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {expenses.length} gasto{expenses.length !== 1 ? 's' : ''}
            </p>
            <Button asChild size="sm">
              <Link href={`/groups/${id}/expenses/new`}>
                <Plus className="h-4 w-4" />
                Nuevo gasto
              </Link>
            </Button>
          </div>
          <GroupExpensesList expenses={expenses} />
        </div>
      )}

      {/* Config tab */}
      {tab === 'config' && (
        <div className="max-w-lg space-y-4">
          {group.description && (
            <section className="rounded-lg border border-border bg-card p-5">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Descripción
              </h2>
              <p className="text-sm whitespace-pre-wrap">{group.description}</p>
            </section>
          )}

          <section className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Distribución de gastos
              </h2>
              <Button asChild size="sm" variant="outline">
                <Link href={`/groups/${id}/costs`}>Configurar</Link>
              </Button>
            </div>
            {costConfig.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin configuración de distribución.</p>
            ) : (
              <dl className="space-y-2">
                {costConfig.map((c) => (
                  <div key={c.id} className="flex justify-between text-sm">
                    <dt className="text-muted-foreground">{UNIT_TYPE_LABELS[c.unitType] ?? c.unitType}</dt>
                    <dd className="font-mono tabular-nums font-medium">{c.percentage}%</dd>
                  </div>
                ))}
              </dl>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
