import { PageHeader } from '@/components/shared/PageHeader'
import { TenantForm } from '@/components/tenants/TenantForm'

export default function NewTenantPage() {
  return (
    <div>
      <PageHeader
        title="Nuevo inquilino"
        description="Completá los datos del inquilino"
      />
      <TenantForm />
    </div>
  )
}
