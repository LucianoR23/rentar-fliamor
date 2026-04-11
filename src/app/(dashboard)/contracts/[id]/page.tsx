import { notFound } from 'next/navigation'
import Link from 'next/link'
import { eq, desc, and } from 'drizzle-orm'
import { Pencil } from 'lucide-react'
import { db } from '@/lib/db'
import { contracts, units, tenants, contractUpdates, files } from '@/lib/schema'
import { PageHeader } from '@/components/shared/PageHeader'
import { FilesSection } from '@/components/files/FilesSection'
import { Button } from '@/components/ui/button'
import { ContractStatusBadge } from '@/components/contracts/ContractStatusBadge'
import { ContractTimeline } from '@/components/contracts/ContractTimeline'
import { UpdateCalculator } from '@/components/contracts/UpdateCalculator'
import { UPDATE_TYPE_LABELS } from '@/lib/validations/contract'
import { formatDate } from '@/lib/utils'

type Props = { params: Promise<{ id: string }> }

function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium mt-0.5">{value ?? '—'}</dd>
    </div>
  )
}

function formatARS(value: string | number) {
  return Number(value).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default async function ContractDetailPage({ params }: Props) {
  const { id } = await params

  const [row] = await db
    .select({ contract: contracts, unit: units, tenant: tenants })
    .from(contracts)
    .leftJoin(units, eq(contracts.unitId, units.id))
    .leftJoin(tenants, eq(contracts.tenantId, tenants.id))
    .where(eq(contracts.id, id))
    .limit(1)

  if (!row) notFound()

  const { contract, unit, tenant } = row

  const updates = await db
    .select()
    .from(contractUpdates)
    .where(eq(contractUpdates.contractId, id))
    .orderBy(desc(contractUpdates.updateDate))

  const contractFiles = await db
    .select()
    .from(files)
    .where(and(eq(files.entityType, 'contract'), eq(files.entityId, id)))
    .orderBy(files.createdAt)

  const title = unit && tenant
    ? `${unit.identifier} — ${tenant.lastName}, ${tenant.firstName}`
    : `Contrato`

  return (
    <div>
      <PageHeader title={title} description={`Contrato ${formatDate(contract.startDate)} → ${formatDate(contract.endDate)}`} backHref="/contracts">
        <Button asChild size="sm">
          <Link href={`/contracts/${id}/edit`}><Pencil className="h-4 w-4" />Editar</Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 max-w-6xl">
        {/* Left column */}
        <div className="space-y-4">
          {/* Details */}
          <section className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Datos del contrato
            </h2>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-4">
              <div className="flex flex-col gap-0.5">
                <dt className="text-xs text-muted-foreground">Estado</dt>
                <dd className="mt-0.5"><ContractStatusBadge status={contract.status} /></dd>
              </div>
              <Row label="Tipo de actualización" value={UPDATE_TYPE_LABELS[contract.updateType]} />
              <Row
                label="Precio actual"
                value={<span className="font-mono tabular-nums">${formatARS(contract.currentPrice)}</span>}
              />
              <Row
                label="Precio inicial"
                value={<span className="font-mono tabular-nums">${formatARS(contract.firstMonthPrice)}</span>}
              />
              {contract.depositAmount && (
                <Row
                  label="Depósito"
                  value={<span className="font-mono tabular-nums">${formatARS(contract.depositAmount)}</span>}
                />
              )}
              <Row label="Frecuencia" value={`${contract.updateFrequencyMonths} meses`} />
              {contract.updateValue && (
                <Row
                  label={contract.updateType === 'fixed_amount' ? 'Monto fijo' : 'Porcentaje fijo'}
                  value={
                    <span className="font-mono tabular-nums">
                      {contract.updateType === 'fixed_amount'
                        ? `$${formatARS(contract.updateValue)}`
                        : `${contract.updateValue}%`}
                    </span>
                  }
                />
              )}
              <Row label="Próx. actualización" value={
                <span className="font-mono text-sm">{formatDate(contract.nextUpdateDate)}</span>
              } />
              {unit && (
                <div className="col-span-2">
                  <dt className="text-xs text-muted-foreground">Unidad</dt>
                  <dd className="mt-0.5">
                    <Link href={`/units/${unit.id}`} className="text-sm font-medium text-primary hover:underline">
                      {unit.identifier}
                    </Link>
                  </dd>
                </div>
              )}
              {tenant && (
                <div className="col-span-2">
                  <dt className="text-xs text-muted-foreground">Inquilino</dt>
                  <dd className="mt-0.5">
                    <Link href={`/tenants/${tenant.id}`} className="text-sm font-medium text-primary hover:underline">
                      {tenant.lastName}, {tenant.firstName}
                    </Link>
                  </dd>
                </div>
              )}
            </dl>
          </section>

          {/* UpdateCalculator — only for active contracts */}
          {contract.status === 'active' && (
            <UpdateCalculator
              contractId={contract.id}
              currentPrice={Number(contract.currentPrice)}
              updateType={contract.updateType}
              updateValue={contract.updateValue != null ? Number(contract.updateValue) : undefined}
              updateFrequencyMonths={contract.updateFrequencyMonths}
              nextUpdateDate={contract.nextUpdateDate}
            />
          )}

          <FilesSection
            entityType="contract"
            entityId={contract.id}
            initialFiles={contractFiles}
            canUpload
            canDelete
          />
        </div>

        {/* Right column — timeline */}
        <div>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Historial de actualizaciones
          </h2>
          {updates.length === 0 && contract.status === 'active' ? (
            <p className="text-sm text-muted-foreground">Sin actualizaciones todavía.</p>
          ) : (
            <ContractTimeline contract={contract} updates={updates} />
          )}
        </div>
      </div>
    </div>
  )
}
