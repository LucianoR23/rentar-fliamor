import { notFound } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { units, groups } from '@/lib/schema'
import { PageHeader } from '@/components/shared/PageHeader'
import { UnitForm } from '@/components/units/UnitForm'
import { UNIT_TYPE_LABELS } from '@/lib/validations/unit'

type Props = { params: Promise<{ id: string }> }

export default async function EditUnitPage({ params }: Props) {
  const { id } = await params
  const unit = await db.query.units.findFirst({ where: eq(units.id, id) })
  if (!unit) notFound()

  const allGroups = await db
    .select({ id: groups.id, name: groups.name })
    .from(groups)
    .orderBy(groups.name)

  return (
    <div>
      <PageHeader
        title="Editar unidad"
        description={`${unit.identifier} — ${UNIT_TYPE_LABELS[unit.type] ?? unit.type}`}
      />
      <UnitForm
        unitId={unit.id}
        groups={allGroups}
        defaultValues={{
          type: unit.type,
          identifier: unit.identifier,
          groupId: unit.groupId ?? '',
          floor: unit.floor ?? '',
          description: unit.description ?? '',
        }}
      />
    </div>
  )
}
