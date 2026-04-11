import { NextRequest, NextResponse } from 'next/server'
import { and, count, eq, ne, sum } from 'drizzle-orm'
import { db } from '@/lib/db'
import { contracts, groupExpenses, groups, payments, tenants, units } from '@/lib/schema'
import { requireRole } from '@/lib/auth'
import { calculateVat } from '@/lib/vat'
import { getCommissionRate, calculateCommission } from '@/lib/commission'
import { generateCompleteReport, type CompleteReportData } from '@/lib/pdf/complete-report'

export async function GET(req: NextRequest) {
  try {
    await requireRole('viewer')

    const sp = req.nextUrl.searchParams
    const now = new Date()
    const month = sp.get('month') ? parseInt(sp.get('month')!) : now.getMonth() + 1
    const year = sp.get('year') ? parseInt(sp.get('year')!) : now.getFullYear()

    const [
      rawUnitsStats,
      rawProjected,
      rawCollected,
      occupancyByType,
      activeContractRows,
      monthPaymentRows,
      groupExpenseRows,
    ] = await Promise.all([
      db.select({ total: count(), occupied: count(contracts.id) })
        .from(units)
        .leftJoin(contracts, and(eq(contracts.unitId, units.id), eq(contracts.status, 'active'))),

      db.select({ total: sum(payments.amountDue) })
        .from(payments)
        .where(and(eq(payments.periodMonth, month), eq(payments.periodYear, year), ne(payments.status, 'cancelled'))),

      db.select({ total: sum(payments.amountPaid) })
        .from(payments)
        .where(and(eq(payments.periodMonth, month), eq(payments.periodYear, year), eq(payments.status, 'paid'))),

      db.select({ type: units.type, total: count(), occupied: count(contracts.id) })
        .from(units)
        .leftJoin(contracts, and(eq(contracts.unitId, units.id), eq(contracts.status, 'active')))
        .groupBy(units.type),

      db.select({ contract: contracts, unit: units, tenant: tenants })
        .from(contracts)
        .innerJoin(units, eq(contracts.unitId, units.id))
        .innerJoin(tenants, eq(contracts.tenantId, tenants.id))
        .where(eq(contracts.status, 'active'))
        .orderBy(units.identifier),

      db.select({ payment: payments, contract: contracts, unit: units, tenant: tenants })
        .from(payments)
        .innerJoin(contracts, eq(payments.contractId, contracts.id))
        .innerJoin(units, eq(contracts.unitId, units.id))
        .innerJoin(tenants, eq(contracts.tenantId, tenants.id))
        .where(and(eq(payments.periodMonth, month), eq(payments.periodYear, year)))
        .orderBy(units.identifier),

      db.select({ expense: groupExpenses, group: groups })
        .from(groupExpenses)
        .innerJoin(groups, eq(groupExpenses.groupId, groups.id))
        .where(and(eq(groupExpenses.periodMonth, month), eq(groupExpenses.periodYear, year)))
        .orderBy(groups.name, groupExpenses.name),
    ])

    const unitsStats = rawUnitsStats[0] ?? { total: 0, occupied: 0 }
    const commissionRate = await getCommissionRate()

    const mappedPayments = monthPaymentRows.map(({ payment, contract, unit, tenant }) => {
      const vat = calculateVat(Number(contract.currentPrice), contract.appliesVat, Number(contract.vatPercentage))
      const rate = payment.commissionRate != null ? Number(payment.commissionRate) : commissionRate
      const comm = calculateCommission(Number(contract.currentPrice), rate, payment.applyCommission)
      const isPaid = payment.status === 'paid' || payment.status === 'partial'
      return {
        unit: unit.identifier,
        tenant: `${tenant.lastName}, ${tenant.firstName}`,
        amountDue: payment.amountDue,
        amountPaid: payment.amountPaid ?? null,
        vatAmount: vat.vat,
        commissionAmount: isPaid ? comm.commission : 0,
        netAmount: isPaid && payment.amountPaid ? comm.net : null,
        status: payment.status,
      }
    })

    const totalCommission = mappedPayments.reduce((acc, r) => acc + r.commissionAmount, 0)
    const totalNet = mappedPayments.reduce((acc, r) => acc + (r.netAmount ?? 0), 0)

    const data: CompleteReportData = {
      period: { month, year },
      commissionRate,
      summary: {
        totalUnits: unitsStats.total,
        occupiedUnits: unitsStats.occupied,
        activeContracts: activeContractRows.length,
        totalDue: parseFloat(rawProjected[0]?.total ?? '0'),
        totalPaid: parseFloat(rawCollected[0]?.total ?? '0'),
        totalVat: monthPaymentRows.reduce((acc, { contract }) => {
          const vat = calculateVat(Number(contract.currentPrice), contract.appliesVat, Number(contract.vatPercentage))
          return acc + vat.vat
        }, 0),
        totalCommission,
        totalNet,
      },
      unitsByType: occupancyByType.map((r) => ({ type: r.type, total: r.total, occupied: r.occupied })),
      activeContracts: activeContractRows.map(({ contract, unit, tenant }) => ({
        unit: unit.identifier + (unit.floor ? ` (${unit.floor})` : ''),
        tenant: `${tenant.lastName}, ${tenant.firstName}`,
        currentPrice: contract.currentPrice,
        nextUpdateDate: contract.nextUpdateDate,
        endDate: contract.endDate,
      })),
      monthPayments: mappedPayments,
      groupExpenses: groupExpenseRows.map(({ expense, group }) => ({
        groupName: group.name,
        name: expense.name,
        amount: expense.amount,
      })),
    }

    const buffer = await generateCompleteReport(data)
    const filename = `reporte-completo-${year}-${String(month).padStart(2, '0')}.pdf`

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
    console.error('[reports/complete]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
