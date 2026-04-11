import { notFound } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { groups } from '@/lib/schema'
import { PageHeader } from '@/components/shared/PageHeader'
import { GroupForm } from '@/components/groups/GroupForm'

type Props = { params: Promise<{ id: string }> }

export default async function EditGroupPage({ params }: Props) {
  const { id } = await params
  const group = await db.query.groups.findFirst({ where: eq(groups.id, id) })
  if (!group) notFound()

  return (
    <div>
      <PageHeader title="Editar grupo" description={group.name} backHref={`/groups/${group.id}`} />
      <GroupForm
        groupId={group.id}
        defaultValues={{
          name: group.name,
          address: group.address,
          description: group.description ?? '',
        }}
      />
    </div>
  )
}
