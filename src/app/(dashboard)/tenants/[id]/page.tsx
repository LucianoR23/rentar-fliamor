import { notFound } from 'next/navigation'
import Link from 'next/link'
import { eq } from 'drizzle-orm'
import { Pencil } from 'lucide-react'
import { db } from '@/lib/db'
import { tenants } from '@/lib/schema'
import { PageHeader } from '@/components/shared/PageHeader'
import { WhatsAppLink } from '@/components/shared/WhatsAppLink'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

type Props = { params: Promise<{ id: string }> }

function Row({ label, children }: { label: string; children?: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium mt-0.5">{children ?? '—'}</dd>
    </div>
  )
}

export default async function TenantDetailPage({ params }: Props) {
  const { id } = await params
  const tenant = await db.query.tenants.findFirst({ where: eq(tenants.id, id) })
  if (!tenant) notFound()

  return (
    <div>
      <PageHeader
        title={`${tenant.firstName} ${tenant.lastName}`}
        description={`CUIT/CUIL/DNI ${tenant.cuitDni}`}
        backHref="/tenants"
      >
        <Button asChild size="sm">
          <Link href={`/tenants/${tenant.id}/edit`}>
            <Pencil className="h-4 w-4" />
            Editar
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 max-w-2xl">
        {/* Personal */}
        <Card>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Datos personales
          </h2>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-4">
            <Row label="Nombre completo">{`${tenant.firstName} ${tenant.lastName}`}</Row>
            <Row label="CUIT/CUIL/DNI">{tenant.cuitDni}</Row>
            <Row label="Teléfono">
              {tenant.phone ? <WhatsAppLink phone={tenant.phone} /> : '—'}
            </Row>
            <Row label="Email">{tenant.email || '—'}</Row>
            {tenant.address && (
              <div className="col-span-2">
                <Row label="Dirección">{tenant.address}</Row>
              </div>
            )}
          </dl>
        </Card>

        {/* Garante */}
        {tenant.guarantorName && (
          <Card>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Garante
            </h2>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-4">
              <Row label="Nombre">{tenant.guarantorName}</Row>
              <Row label="CUIT/CUIL/DNI">{tenant.guarantorCuitDni || '—'}</Row>
              <Row label="Teléfono">
                {tenant.guarantorPhone ? <WhatsAppLink phone={tenant.guarantorPhone} /> : '—'}
              </Row>
            </dl>
          </Card>
        )}

        {/* Notas */}
        {tenant.notes && (
          <Card>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Notas
            </h2>
            <p className="text-sm text-foreground whitespace-pre-wrap">{tenant.notes}</p>
          </Card>
        )}
      </div>
    </div>
  )
}
