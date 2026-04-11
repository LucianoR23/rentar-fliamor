import { NextRequest, NextResponse } from 'next/server'
import { and, eq, ne, sum } from 'drizzle-orm'
import { db } from '@/lib/db'
import { contracts, payments, units, tenants } from '@/lib/schema'
import { requireRole } from '@/lib/auth'
import { calculateVat } from '@/lib/vat'
import { getCommissionRate, calculateCommission } from '@/lib/commission'
import { generateMonthlyReport, type MonthlyReportData } from '@/lib/pdf/monthly-report'

export async function GET(req: NextRequest) {
  try {
    await requireRole('viewer')

    const sp = req.nextUrl.searchParams
    const now = new Date()
    const month = sp.get('month') ? parseInt(sp.get('month')!) : now.getMonth() + 1
    const year = sp.get('year') ? parseInt(sp.get('year')!) : now.getFullYear()

    const rows = await db
      .select({ payment: payments, contract: contracts, unit: units, tenant: tenants })
      .from(payments)
      .innerJoin(contracts, eq(payments.contractId, contracts.id))
      .innerJoin(units, eq(contracts.unitId, units.id))
      .innerJoin(tenants, eq(contracts.tenantId, tenants.id))
      .where(and(eq(payments.periodMonth, month), eq(payments.periodYear, year)))
      .orderBy(units.identifier)

    const [projectedRow] = await db
      .select({ total: sum(payments.amountDue) })
      .from(payments)
      .where(and(eq(payments.periodMonth, month), eq(payments.periodYear, year), ne(payments.status, 'cancelled')))

    const [collectedRow] = await db
      .select({ total: sum(payments.amountPaid) })
      .from(payments)
      .where(and(eq(payments.periodMonth, month), eq(payments.periodYear, year), eq(payments.status, 'paid')))

    const commissionRate = await getCommissionRate()

    const mappedRows = rows.map(({ payment, contract, unit, tenant }) => {
      const vat = calculateVat(Number(contract.currentPrice), contract.appliesVat, Number(contract.vatPercentage))
      const rate = payment.commissionRate != null ? Number(payment.commissionRate) : commissionRate
      const comm = calculateCommission(Number(contract.currentPrice), rate, payment.applyCommission)
      const isPaid = payment.status === 'paid' || payment.status === 'partial'
      return {
        unit: { identifier: unit.identifier, floor: unit.floor ?? null, type: unit.type },
        tenant: { firstName: tenant.firstName, lastName: tenant.lastName },
        amountDue: payment.amountDue,
        amountPaid: payment.amountPaid ?? null,
        vatAmount: vat.vat,
        commissionAmount: isPaid ? comm.commission : 0,
        netAmount: isPaid && payment.amountPaid ? comm.net : null,
        status: payment.status,
        paymentDate: payment.paymentDate ?? null,
      }
    })

    const totalVat = mappedRows.reduce((sum, r) => sum + r.vatAmount, 0)
    const totalCommission = mappedRows.reduce((sum, r) => sum + r.commissionAmount, 0)
    const totalNet = mappedRows.reduce((sum, r) => sum + (r.netAmount ?? 0), 0)

    const data: MonthlyReportData = {
      period: { month, year },
      rows: mappedRows,
      commissionRate,
      summary: {
        totalDue: parseFloat(projectedRow?.total ?? '0'),
        totalPaid: parseFloat(collectedRow?.total ?? '0'),
        totalVat,
        totalCommission,
        totalNet,
        paidCount: rows.filter((r) => r.payment.status === 'paid').length,
        pendingCount: rows.filter((r) => r.payment.status === 'pending').length,
        overdueCount: rows.filter((r) => r.payment.status === 'overdue').length,
        cancelledCount: rows.filter((r) => r.payment.status === 'cancelled').length,
      },
    }

    const buffer = await generateMonthlyReport(data)
    const filename = `reporte-mensual-${year}-${String(month).padStart(2, '0')}.pdf`

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (e) {
    const err = e as Error
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    console.error('[reports/monthly]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
