import { NextRequest, NextResponse } from 'next/server'
import { desc, eq, and } from 'drizzle-orm'
import { db } from '@/lib/db'
import { invoices, contracts, units, tenants } from '@/lib/schema'
import { requireRole } from '@/lib/auth'
import { createInvoiceSchema } from '@/lib/validations/invoice'
import {
  createAfipClient,
  resolveInvoiceType,
  buildVoucherData,
  getAfipErrorMessage,
} from '@/lib/afip'
import type { TaxCondition, UnitType } from '@/types'

export const maxDuration = 30

export async function GET() {
  try {
    await requireRole('viewer')

    const all = await db
      .select({
        invoice: invoices,
        contract: contracts,
        unit: units,
        tenant: tenants,
      })
      .from(invoices)
      .innerJoin(contracts, eq(invoices.contractId, contracts.id))
      .innerJoin(units, eq(contracts.unitId, units.id))
      .innerJoin(tenants, eq(contracts.tenantId, tenants.id))
      .orderBy(desc(invoices.createdAt))

    return NextResponse.json(all)
  } catch (e) {
    const err = e as Error
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole('admin')
    const body: unknown = await request.json()
    const data = createInvoiceSchema.parse(body)

    // Fetch contract with unit and tenant
    const contract = await db.query.contracts.findFirst({
      where: eq(contracts.id, data.contractId),
      with: { unit: true, tenant: true },
    })

    if (!contract) {
      return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 })
    }

    if (contract.status !== 'active') {
      return NextResponse.json({ error: 'El contrato no está activo' }, { status: 400 })
    }

    // Check for duplicate invoice (same contract + period)
    const existing = await db.query.invoices.findFirst({
      where: and(
        eq(invoices.contractId, data.contractId),
        eq(invoices.periodMonth, data.periodMonth),
        eq(invoices.periodYear, data.periodYear),
      ),
    })

    if (existing) {
      return NextResponse.json(
        { error: `Ya existe una factura para este contrato en ${data.periodMonth}/${data.periodYear}` },
        { status: 409 }
      )
    }

    const taxCondition = data.taxCondition as TaxCondition
    const unitType = contract.unit.type as UnitType
    const { invoiceType, cbteTipo } = resolveInvoiceType(taxCondition)

    // Create AFIP client and get next voucher number
    const { afip, ptoVta } = createAfipClient()
    const lastVoucher = await afip.ElectronicBilling.getLastVoucher(ptoVta, cbteTipo)
    const cbteNro = lastVoucher + 1

    // Build and send voucher
    const voucher = buildVoucherData({
      amount: data.amount,
      taxCondition,
      unitType,
      cuitDni: contract.tenant.cuitDni,
      periodMonth: data.periodMonth,
      periodYear: data.periodYear,
      puntoVenta: ptoVta,
      cbteNro,
      paymentMethod: data.paymentMethod,
    })

    console.log('AFIP voucher data:', JSON.stringify(voucher.data, null, 2))
    const res = await afip.ElectronicBilling.createVoucher(voucher.data)

    // Save to database
    const [invoice] = await db
      .insert(invoices)
      .values({
        contractId: data.contractId,
        invoiceType,
        cbteTipo,
        puntoVenta: ptoVta,
        cbteNro,
        cae: res.CAE,
        caeFchVto: res.CAEFchVto,
        cbteFch: voucher.cbteFch,
        impNeto: String(voucher.amounts.impNeto),
        impIva: String(voucher.amounts.impIva),
        impOpEx: String(voucher.amounts.impOpEx),
        impTotal: String(voucher.amounts.impTotal),
        docTipo: voucher.docTipo,
        docNro: voucher.docNro,
        recipientName: `${contract.tenant.lastName}, ${contract.tenant.firstName}`,
        recipientTaxCondition: taxCondition,
        condicionIvaReceptorId: voucher.condicionIvaReceptorId,
        periodMonth: data.periodMonth,
        periodYear: data.periodYear,
        fchServDesde: voucher.fchServDesde,
        fchServHasta: voucher.fchServHasta,
        description: data.description,
        paymentMethod: data.paymentMethod,
        unitType,
        issuedBy: user.id,
      })
      .returning()

    return NextResponse.json(invoice, { status: 201 })
  } catch (e) {
    const err = e as Error
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (err.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const afipMsg = getAfipErrorMessage(e)
    console.error('Error facturación AFIP:', afipMsg)
    return NextResponse.json({ error: 'Error al facturar', details: afipMsg }, { status: 500 })
  }
}
