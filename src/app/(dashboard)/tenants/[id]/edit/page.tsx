import { notFound } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { tenants } from '@/lib/schema'
import { PageHeader } from '@/components/shared/PageHeader'
import { TenantForm } from '@/components/tenants/TenantForm'

type Props = { params: Promise<{ id: string }> }

export default async function EditTenantPage({ params }: Props) {
  const { id } = await params
  const tenant = await db.query.tenants.findFirst({ where: eq(tenants.id, id) })
  if (!tenant) notFound()

  return (
    <div>
      <PageHeader
        title="Editar inquilino"
        description={`${tenant.firstName} ${tenant.lastName}`}
        backHref={`/tenants/${tenant.id}`}
      />
      <TenantForm
        tenantId={tenant.id}
        defaultValues={{
          firstName: tenant.firstName,
          lastName: tenant.lastName,
          cuitDni: tenant.cuitDni,
          phone: tenant.phone,
          email: tenant.email ?? '',
          address: tenant.address ?? '',
          guarantorName: tenant.guarantorName ?? '',
          guarantorPhone: tenant.guarantorPhone ?? '',
          guarantorCuitDni: tenant.guarantorCuitDni ?? '',
          notes: tenant.notes ?? '',
        }}
      />
    </div>
  )
}
