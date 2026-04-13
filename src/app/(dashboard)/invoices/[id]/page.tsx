import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Download } from 'lucide-react'
import { db } from '@/lib/db'
import { invoices, contracts, units, tenants } from '@/lib/schema'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { InvoiceTypeBadge } from '@/components/invoices/InvoiceTypeBadge'
import { formatCurrency } from '@/lib/utils'
import { TAX_CONDITION_LABELS } from '@/lib/validations/invoice'

type Props = { params: Promise<{ id: string }> }

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function fmtAfipDate(d: string): string {
  if (d.length !== 8) return d
  return `${d.slice(6, 8)}/${d.slice(4, 6)}/${d.slice(0, 4)}`
}

function padPv(n: number): string {
  return String(n).padStart(5, '0')
}

function padCbte(n: number): string {
  return String(n).padStart(8, '0')
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm ${mono ? 'font-mono tabular-nums' : ''}`}>{value}</span>
    </div>
  )
}

export default async function InvoiceDetailPage({ params }: Props) {
  const { id } = await params

  const rows = await db
    .select({ invoice: invoices, contract: contracts, unit: units, tenant: tenants })
    .from(invoices)
    .innerJoin(contracts, eq(invoices.contractId, contracts.id))
    .innerJoin(units, eq(contracts.unitId, units.id))
    .innerJoin(tenants, eq(contracts.tenantId, tenants.id))
    .where(eq(invoices.id, id))
    .limit(1)

  if (rows.length === 0) notFound()

  const { invoice, unit, tenant } = rows[0]
  const period = `${MONTHS[invoice.periodMonth - 1]} ${invoice.periodYear}`
  const compNro = `${padPv(invoice.puntoVenta)}-${padCbte(invoice.cbteNro)}`
  const taxLabel = TAX_CONDITION_LABELS[invoice.recipientTaxCondition as keyof typeof TAX_CONDITION_LABELS] ?? invoice.recipientTaxCondition

  return (
    <div>
      <PageHeader
        title={`Factura ${invoice.invoiceType} ${compNro}`}
        description={`Emitida el ${fmtAfipDate(invoice.cbteFch)}`}
        backHref="/invoices"
      >
        <Button asChild size="sm" variant="outline">
          <a href={`/api/invoices/${invoice.id}/pdf`} target="_blank" rel="noopener noreferrer">
            <Download className="h-4 w-4" />
            Descargar PDF
          </a>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        {/* Comprobante */}
        <div className="rounded-lg border border-border p-5 space-y-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Comprobante
          </h2>
          <div className="flex items-center gap-2 mb-2">
            <InvoiceTypeBadge type={invoice.invoiceType} />
            <span className="text-sm font-medium">Factura {invoice.invoiceType}</span>
          </div>
          <InfoRow label="Número" value={compNro} mono />
          <InfoRow label="Punto de venta" value={padPv(invoice.puntoVenta)} mono />
          <InfoRow label="Fecha" value={fmtAfipDate(invoice.cbteFch)} />
          <InfoRow label="Período" value={period} />
          <InfoRow label="Servicio desde" value={fmtAfipDate(invoice.fchServDesde)} />
          <InfoRow label="Servicio hasta" value={fmtAfipDate(invoice.fchServHasta)} />
        </div>

        {/* Receptor */}
        <div className="rounded-lg border border-border p-5 space-y-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Receptor
          </h2>
          <InfoRow label="Nombre" value={invoice.recipientName} />
          <InfoRow label="CUIT/DNI" value={tenant.cuitDni} mono />
          <InfoRow label="Condición fiscal" value={taxLabel} />
          <InfoRow label="Unidad" value={unit.identifier} mono />
          <div className="pt-2 mt-2 border-t border-border">
            <Link href={`/contracts/${invoice.contractId}`} className="text-sm text-primary hover:underline">
              Ver contrato
            </Link>
          </div>
        </div>

        {/* Montos */}
        <div className="rounded-lg border border-border p-5 space-y-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Importes
          </h2>
          {Number(invoice.impNeto) > 0 && (
            <InfoRow label="Subtotal Neto" value={formatCurrency(invoice.impNeto)} mono />
          )}
          {Number(invoice.impIva) > 0 && (
            <InfoRow label="IVA 21%" value={formatCurrency(invoice.impIva)} mono />
          )}
          {Number(invoice.impOpEx) > 0 && (
            <InfoRow label="Op. Exentas" value={formatCurrency(invoice.impOpEx)} mono />
          )}
          <div className="flex justify-between py-2 border-t border-primary/20 mt-2">
            <span className="text-base font-bold text-primary">TOTAL</span>
            <span className="text-base font-bold font-mono tabular-nums text-primary">
              {formatCurrency(invoice.impTotal)}
            </span>
          </div>
        </div>

        {/* CAE */}
        <div className="rounded-lg border border-border p-5 space-y-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Autorización AFIP
          </h2>
          <InfoRow label="CAE" value={invoice.cae} mono />
          <InfoRow label="Vto. CAE" value={fmtAfipDate(invoice.caeFchVto)} />
        </div>

        {/* Descripción */}
        <div className="rounded-lg border border-border p-5 md:col-span-2">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Descripción
          </h2>
          <p className="text-sm">{invoice.description}</p>
        </div>
      </div>
    </div>
  )
}
