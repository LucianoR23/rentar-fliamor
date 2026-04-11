import { notFound } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { groups, groupCostConfig } from '@/lib/schema'
import { PageHeader } from '@/components/shared/PageHeader'
import { CostDistributionForm } from '@/components/groups/CostDistributionForm'
import type { CostDistributionFormData } from '@/lib/validations/group'

type Props = { params: Promise<{ id: string }> }

export default async function GroupCostsPage({ params }: Props) {
  const { id } = await params
  const group = await db.query.groups.findFirst({ where: eq(groups.id, id) })
  if (!group) notFound()

  const config = await db
    .select()
    .from(groupCostConfig)
    .where(eq(groupCostConfig.groupId, id))

  const defaultValues = config.reduce<Partial<CostDistributionFormData>>((acc, c) => {
    acc[c.unitType as keyof CostDistributionFormData] = Number(c.percentage)
    return acc
  }, {})

  return (
    <div>
      <PageHeader
        title="Distribución de gastos"
        description={group.name}
        backHref={`/groups/${id}?tab=config`}
      />

      <CostDistributionForm groupId={id} defaultValues={defaultValues} />
    </div>
  )
}
