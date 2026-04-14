import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { invoices, settings } from '@/lib/schema'
import { requireRole } from '@/lib/auth'
import { generateInvoicePdf, type InvoicePdfData } from '@/lib/pdf/invoice'
import { isExempt } from '@/lib/afip'
import type { UnitType } from '@/types'

type Params = { params: Promise<{ id: string }> }

async function getSettingValue(key: string, fallback: string): Promise<string> {
  const row = await db.query.settings.findFirst({ where: eq(settings.key, key) })
  return row?.value ?? fallback
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await requireRole('viewer')
    const { id } = await params

    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, id),
      with: {
        contract: {
          with: { tenant: true },
        },
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 })
    }

    const [emitterName, emitterAddress, emitterActivityStart, cuitEmisor] = await Promise.all([
      getSettingValue('emitter_legal_name', 'Fliamor Propiedades S.A.'),
      getSettingValue('emitter_address', ''),
      getSettingValue('emitter_activity_start', ''),
      Promise.resolve(process.env.AFIP_CUIT ?? ''),
    ])

    const pdfData: InvoicePdfData = {
      invoiceType: invoice.invoiceType,
      cbteTipo: invoice.cbteTipo,
      puntoVenta: invoice.puntoVenta,
      cbteNro: invoice.cbteNro,
      cbteFch: invoice.cbteFch,
      cae: invoice.cae,
      caeFchVto: invoice.caeFchVto,
      cuitEmisor,
      emitterName,
      emitterAddress,
      emitterActivityStart,
      recipientName: invoice.recipientName,
      recipientCuitDni: invoice.contract.tenant.cuitDni,
      recipientTaxCondition: invoice.recipientTaxCondition,
      periodMonth: invoice.periodMonth,
      periodYear: invoice.periodYear,
      fchServDesde: invoice.fchServDesde,
      fchServHasta: invoice.fchServHasta,
      description: invoice.description,
      impNeto: Number(invoice.impNeto),
      impIva: Number(invoice.impIva),
      impOpEx: Number(invoice.impOpEx),
      impTotal: Number(invoice.impTotal),
      exempt: isExempt(invoice.unitType as UnitType),
      paymentMethod: invoice.paymentMethod ?? 'Contado',
    }

    const buffer = await generateInvoicePdf(pdfData)
    const pv = String(invoice.puntoVenta).padStart(5, '0')
    const nro = String(invoice.cbteNro).padStart(8, '0')
    const filename = `Factura_${invoice.invoiceType}_${pv}-${nro}.pdf`

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
      },
    })
  } catch (e) {
    const err = e as Error
    console.error('Error generando PDF factura:', err)
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
