import { notFound } from 'next/navigation'
import Link from 'next/link'
import { eq, and } from 'drizzle-orm'
import { Pencil, FileText } from 'lucide-react'
import { db } from '@/lib/db'
import { units, groups, contracts, tenants, files } from '@/lib/schema'
import { PageHeader } from '@/components/shared/PageHeader'
import { FilesSection } from '@/components/files/FilesSection'
import { ManualChargesSection } from '@/components/manual-charges/ManualChargesSection'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { UnitStatusBadge } from '@/components/units/UnitStatusBadge'
import { ContractStatusBadge } from '@/components/contracts/ContractStatusBadge'
import { UpdateCalculator } from '@/components/contracts/UpdateCalculator'
import { UNIT_TYPE_LABELS } from '@/lib/validations/unit'
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

export default async function UnitDetailPage({ params }: Props) {
  const { id } = await params

  const [row] = await db
    .select({ unit: units, group: groups, activeContract: contracts })
    .from(units)
    .leftJoin(groups, eq(units.groupId, groups.id))
    .leftJoin(contracts, and(eq(contracts.unitId, units.id), eq(contracts.status, 'active')))
    .where(eq(units.id, id))
    .limit(1)

  if (!row) notFound()

  const { unit, group, activeContract } = row

  // Fetch tenant for active contract
  const activeTenant = activeContract
    ? await db.query.tenants.findFirst({ where: eq(tenants.id, activeContract.tenantId) })
    : null

  const unitFiles = await db
    .select()
    .from(files)
    .where(and(eq(files.entityType, 'unit'), eq(files.entityId, id)))
    .orderBy(files.createdAt)

  return (
    <div>
      <PageHeader title={unit.identifier} description={UNIT_TYPE_LABELS[unit.type] ?? unit.type} backHref="/units">
        <Button asChild size="sm">
          <Link href={`/units/${unit.id}/edit`}><Pencil className="h-4 w-4" />Editar</Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_650px] gap-6 max-w-7xl">
        {/* Left — unit info */}
        <div className="space-y-4">
          <Card>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Datos de la unidad
            </h2>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-4">
              <Row label="Identificador" value={<span className="font-mono">{unit.identifier}</span>} />
              <Row label="Tipo" value={UNIT_TYPE_LABELS[unit.type] ?? unit.type} />
              <Row label="Piso" value={unit.floor} />
              <Row label="Dirección" value={unit.address} />
              <div className="flex flex-col gap-0.5">
                <dt className="text-xs text-muted-foreground">Estado</dt>
                <dd className="mt-0.5"><UnitStatusBadge hasActiveContract={!!activeContract} /></dd>
              </div>
              {group && (
                <div className="col-span-2">
                  <dt className="text-xs text-muted-foreground">Grupo</dt>
                  <dd className="mt-0.5">
                    <Link href={`/groups/${group.id}`} className="text-sm font-medium text-primary hover:underline">
                      {group.name}
                    </Link>
                  </dd>
                </div>
              )}
              {unit.description && (
                <div className="col-span-2">
                  <Row label="Descripción" value={unit.description} />
                </div>
              )}
            </dl>
          </Card>

          {/* Active contract */}
          {activeContract ? (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Contrato activo
                </h2>
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/contracts/${activeContract.id}`}>
                    <FileText className="h-3.5 w-3.5" />Ver contrato
                  </Link>
                </Button>
              </div>
              <dl className="grid grid-cols-2 gap-x-8 gap-y-4">
                {activeTenant && (
                  <div className="col-span-2">
                    <dt className="text-xs text-muted-foreground">Inquilino</dt>
                    <dd className="mt-0.5">
                      <Link href={`/tenants/${activeTenant.id}`} className="text-sm font-medium text-primary hover:underline">
                        {activeTenant.lastName}, {activeTenant.firstName}
                      </Link>
                    </dd>
                  </div>
                )}
                <Row label="Vigencia" value={`${formatDate(activeContract.startDate)} → ${formatDate(activeContract.endDate)}`} />
                <div className="flex flex-col gap-0.5">
                  <dt className="text-xs text-muted-foreground">Estado</dt>
                  <dd className="mt-0.5"><ContractStatusBadge status={activeContract.status} /></dd>
                </div>
                <Row
                  label="Precio actual"
                  value={<span className="font-mono tabular-nums">${formatARS(activeContract.currentPrice)}</span>}
                />
                <Row label="Tipo actualización" value={UPDATE_TYPE_LABELS[activeContract.updateType]} />
                <Row label="Próx. actualización" value={
                  <span className="font-mono text-sm">{formatDate(activeContract.nextUpdateDate)}</span>
                } />
              </dl>
            </Card>
          ) : (
            <section className="rounded-lg border border-dashed border-border p-5 text-center">
              <p className="text-sm text-muted-foreground mb-3">Esta unidad no tiene contrato activo.</p>
              <Button asChild size="sm" variant="outline">
                <Link href={`/contracts/new`}><FileText className="h-4 w-4" />Nuevo contrato</Link>
              </Button>
            </section>
          )}

          <ManualChargesSection unitId={unit.id} unitIdentifier={unit.identifier} />

          <FilesSection
            entityType="unit"
            entityId={unit.id}
            initialFiles={unitFiles}
            canUpload
            canDelete
          />
        </div>

        {/* Right — UpdateCalculator */}
        {activeContract && (
          <div>
            <UpdateCalculator
              contractId={activeContract.id}
              currentPrice={Number(activeContract.currentPrice)}
              updateType={activeContract.updateType}
              updateValue={activeContract.updateValue != null ? Number(activeContract.updateValue) : undefined}
              updateFrequencyMonths={activeContract.updateFrequencyMonths}
              nextUpdateDate={activeContract.nextUpdateDate}
            />
          </div>
        )}
      </div>
    </div>
  )
}
