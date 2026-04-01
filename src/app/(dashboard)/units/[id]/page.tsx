import { notFound } from 'next/navigation'
import Link from 'next/link'
import { eq, and } from 'drizzle-orm'
import { Pencil, ArrowLeft } from 'lucide-react'
import { db } from '@/lib/db'
import { units, groups, contracts } from '@/lib/schema'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { UnitStatusBadge } from '@/components/units/UnitStatusBadge'
import { UNIT_TYPE_LABELS } from '@/lib/validations/unit'

type Props = { params: Promise<{ id: string }> }

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium mt-0.5">{value || '—'}</dd>
    </div>
  )
}

export default async function UnitDetailPage({ params }: Props) {
  const { id } = await params

  const [row] = await db
    .select({ unit: units, group: groups, activeContract: contracts })
    .from(units)
    .leftJoin(groups, eq(units.groupId, groups.id))
    .leftJoin(
      contracts,
      and(eq(contracts.unitId, units.id), eq(contracts.status, 'active'))
    )
    .where(eq(units.id, id))
    .limit(1)

  if (!row) notFound()

  const { unit, group, activeContract } = row

  return (
    <div>
      <PageHeader
        title={unit.identifier}
        description={UNIT_TYPE_LABELS[unit.type] ?? unit.type}
      >
        <Button asChild variant="ghost" size="sm">
          <Link href="/units">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
        </Button>
        <Button asChild size="sm">
          <Link href={`/units/${unit.id}/edit`}>
            <Pencil className="h-4 w-4" />
            Editar
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 max-w-2xl">
        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Datos de la unidad
          </h2>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-4">
            <Row label="Identificador" value={unit.identifier} />
            <Row label="Tipo" value={UNIT_TYPE_LABELS[unit.type] ?? unit.type} />
            <Row label="Piso" value={unit.floor} />
            <div className="flex flex-col gap-0.5">
              <dt className="text-xs text-muted-foreground">Estado</dt>
              <dd className="mt-0.5">
                <UnitStatusBadge hasActiveContract={!!activeContract} />
              </dd>
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
        </section>
      </div>
    </div>
  )
}
