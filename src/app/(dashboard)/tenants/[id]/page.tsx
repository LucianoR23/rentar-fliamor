import { notFound } from 'next/navigation'
import Link from 'next/link'
import { eq } from 'drizzle-orm'
import { Pencil } from 'lucide-react'
import { db } from '@/lib/db'
import { tenants } from '@/lib/schema'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'

type Props = { params: Promise<{ id: string }> }

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium mt-0.5">{value || '—'}</dd>
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
        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Datos personales
          </h2>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-4">
            <Row label="Nombre completo" value={`${tenant.firstName} ${tenant.lastName}`} />
            <Row label="CUIT/CUIL/DNI" value={tenant.cuitDni} />
            <Row label="Teléfono" value={tenant.phone} />
            <Row label="Email" value={tenant.email} />
            {tenant.address && (
              <div className="col-span-2">
                <Row label="Dirección" value={tenant.address} />
              </div>
            )}
          </dl>
        </section>

        {/* Garante */}
        {tenant.guarantorName && (
          <section className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Garante
            </h2>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-4">
              <Row label="Nombre" value={tenant.guarantorName} />
              <Row label="CUIT/CUIL/DNI" value={tenant.guarantorCuitDni} />
              <Row label="Teléfono" value={tenant.guarantorPhone} />
            </dl>
          </section>
        )}

        {/* Notas */}
        {tenant.notes && (
          <section className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Notas
            </h2>
            <p className="text-sm text-foreground whitespace-pre-wrap">{tenant.notes}</p>
          </section>
        )}
      </div>
    </div>
  )
}
