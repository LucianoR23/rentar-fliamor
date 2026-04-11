import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { payments, contracts, units, tenants, paymentLineItems } from '@/lib/schema'
import { requireRole } from '@/lib/auth'
import { calculateVat } from '@/lib/vat'
import { generateReceiptPdf, type ReceiptData } from '@/lib/pdf/receipt'

type Params = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  try {
    await requireRole('viewer')
    const { id } = await params

    const [row] = await db
      .select({ payment: payments, contract: contracts, unit: units, tenant: tenants })
      .from(payments)
      .innerJoin(contracts, eq(payments.contractId, contracts.id))
      .innerJoin(units, eq(contracts.unitId, units.id))
      .innerJoin(tenants, eq(contracts.tenantId, tenants.id))
      .where(eq(payments.id, id))
      .limit(1)

    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { payment, contract, unit, tenant } = row
    const sp = req.nextUrl.searchParams
    const vatBreakdown = calculateVat(Number(contract.currentPrice), contract.appliesVat, Number(contract.vatPercentage))

    // Generate receipt number on first access and persist it
    let receiptNumber = payment.receiptNumber
    if (!receiptNumber) {
      receiptNumber = `REC-${payment.periodYear}${String(payment.periodMonth).padStart(2, '0')}-${payment.id.slice(0, 6).toUpperCase()}`
      await db
        .update(payments)
        .set({ receiptNumber, updatedAt: new Date() })
        .where(eq(payments.id, id))
    }

    const data: ReceiptData = {
      receiptNumber: sp.get('receiptNumber') ?? receiptNumber,
      tenant: {
        firstName: tenant.firstName,
        lastName: tenant.lastName,
        cuitDni: tenant.cuitDni,
      },
      unit: {
        identifier: unit.identifier,
        floor: unit.floor ?? null,
      },
      period: {
        month: payment.periodMonth,
        year: payment.periodYear,
      },
      amountDue: payment.amountDue,
      amountPaid: payment.amountPaid ?? payment.amountDue,
      paymentDate: payment.paymentDate,
      paymentMethod: sp.get('paymentMethod') ?? 'Efectivo',
      notes: sp.get('notes') ?? payment.notes ?? null,
      vat: contract.appliesVat ? {
        appliesVat: true,
        vatableBase: vatBreakdown.vatableBase,
        vatAmount: vatBreakdown.vat,
        rentBase: vatBreakdown.price,
      } : null,
    }

    // Fetch line items for breakdown
    const lines = await db
      .select()
      .from(paymentLineItems)
      .where(eq(paymentLineItems.paymentId, id))
      .orderBy(paymentLineItems.createdAt)

    if (lines.length > 0) {
      data.lineItems = lines.map((l) => ({
        type: l.type,
        description: l.description,
        amount: l.amount,
      }))
    }

    const buffer = await generateReceiptPdf(data)
    const disposition = sp.get('download') === '1' ? 'attachment' : 'inline'

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${disposition}; filename="recibo-${data.receiptNumber}.pdf"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (e) {
    const err = e as Error
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
