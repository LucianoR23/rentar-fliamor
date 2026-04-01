import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { eq, and } from 'drizzle-orm'
import { db } from '@/lib/db'
import { groups, units, contracts, groupCostConfig } from '@/lib/schema'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { GroupExpenseForm } from '@/components/groups/GroupExpenseForm'
import type { DistributionUnit, DistributionConfig } from '@/lib/rent-calculator'

type Props = { params: Promise<{ id: string }> }

export default async function NewGroupExpensePage({ params }: Props) {
  const { id } = await params

  const group = await db.query.groups.findFirst({ where: eq(groups.id, id) })
  if (!group) notFound()

  const unitRows = await db
    .select({ unit: units })
    .from(units)
    .leftJoin(contracts, and(eq(contracts.unitId, units.id), eq(contracts.status, 'active')))
    .where(eq(units.groupId, id))

  const costConfigRows = await db
    .select()
    .from(groupCostConfig)
    .where(eq(groupCostConfig.groupId, id))

  const activeUnits: DistributionUnit[] = unitRows
    .filter((r) => r.unit !== null)
    .map((r) => ({
      id: r.unit.id,
      identifier: r.unit.identifier,
      type: r.unit.type,
    }))

  const costConfig: DistributionConfig[] = costConfigRows.map((c) => ({
    unitType: c.unitType,
    percentage: Number(c.percentage),
  }))

  return (
    <div>
      <PageHeader title="Nuevo gasto grupal" description={group.name}>
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/groups/${id}?tab=expenses`}>
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
        </Button>
      </PageHeader>

      <GroupExpenseForm
        groupId={id}
        activeUnits={activeUnits}
        costConfig={costConfig}
      />
    </div>
  )
}
