import Link from 'next/link'
import { Plus, Building2 } from 'lucide-react'
import { desc, eq, and } from 'drizzle-orm'
import { db } from '@/lib/db'
import { units, groups, contracts } from '@/lib/schema'
import { requireRole } from '@/lib/auth'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { UnitsTable } from '@/components/units/UnitsTable'
import { EmptyState } from '@/components/shared/EmptyState'

export default async function UnitsPage() {
  const dbUser = await requireRole('viewer')

  const rows = await db
    .select({
      unit: units,
      group: groups,
      activeContract: contracts,
    })
    .from(units)
    .leftJoin(groups, eq(units.groupId, groups.id))
    .leftJoin(
      contracts,
      and(eq(contracts.unitId, units.id), eq(contracts.status, 'active'))
    )
    .where(eq(units.active, true))
    .orderBy(desc(units.createdAt))

  const data = rows.map(({ unit, group, activeContract }) => ({
    ...unit,
    group: group ?? null,
    hasActiveContract: !!activeContract,
  }))

  return (
    <div>
      <PageHeader
        title="Unidades"
        description={`${data.length} registrada${data.length !== 1 ? 's' : ''}`}
      >
        <Button asChild size="sm">
          <Link href="/units/new">
            <Plus className="h-4 w-4" />
            Nueva unidad
          </Link>
        </Button>
      </PageHeader>

      {data.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Sin unidades"
          description="Agregá tu primera unidad para empezar."
        >
          <Button asChild size="sm">
            <Link href="/units/new">
              <Plus className="h-4 w-4" />
              Nueva unidad
            </Link>
          </Button>
        </EmptyState>
      ) : (
        <UnitsTable data={data} userRole={dbUser.role} />
      )}
    </div>
  )
}
