import { PageHeader } from '@/components/shared/PageHeader'
import { GroupForm } from '@/components/groups/GroupForm'

export default function NewGroupPage() {
  return (
    <div>
      <PageHeader title="Nuevo grupo" description="Completá los datos del grupo" />
      <GroupForm />
    </div>
  )
}
