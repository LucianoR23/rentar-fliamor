import { desc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { groups } from '@/lib/schema'
import { PageHeader } from '@/components/shared/PageHeader'
import { UnitForm } from '@/components/units/UnitForm'

export default async function NewUnitPage() {
  const allGroups = await db
    .select({ id: groups.id, name: groups.name })
    .from(groups)
    .orderBy(desc(groups.name))

  return (
    <div>
      <PageHeader title="Nueva unidad" description="Completá los datos de la unidad" />
      <UnitForm groups={allGroups} />
    </div>
  )
}
