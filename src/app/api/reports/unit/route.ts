import { NextRequest, NextResponse } from 'next/server'
import { desc, eq, inArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import { contracts, contractUpdates, groups, payments, tenants, units } from '@/lib/schema'
import { requireRole } from '@/lib/auth'
import { getCommissionRate, calculateCommission } from '@/lib/commission'
import { generateUnitReport, type UnitReportData } from '@/lib/pdf/unit-report'

export async function GET(req: NextRequest) {
  try {
    await requireRole('viewer')

    const unitId = req.nextUrl.searchParams.get('unitId')
    if (!unitId) return NextResponse.json({ error: 'unitId requerido' }, { status: 400 })

    const [unitRow] = await db
      .select({ unit: units, group: groups })
      .from(units)
      .leftJoin(groups, eq(units.groupId, groups.id))
      .where(eq(units.id, unitId))
      .limit(1)

    if (!unitRow) return NextResponse.json({ error: 'Unidad no encontrada' }, { status: 404 })

    const contractRows = await db
      .select({ contract: contracts, tenant: tenants })
      .from(contracts)
      .innerJoin(tenants, eq(contracts.tenantId, tenants.id))
      .where(eq(contracts.unitId, unitId))
      .orderBy(desc(contracts.startDate))

    const contractIds = contractRows.map((r) => r.contract.id)

    const [allPayments, allUpdates] = await Promise.all([
      contractIds.length > 0
        ? db.select().from(payments).where(inArray(payments.contractId, contractIds)).orderBy(payments.periodYear, payments.periodMonth)
        : Promise.resolve([]),
      contractIds.length > 0
        ? db.select().from(contractUpdates).where(inArray(contractUpdates.contractId, contractIds)).orderBy(contractUpdates.updateDate)
        : Promise.resolve([]),
    ])

    const paymentsByContract = new Map<string, typeof allPayments>()
    for (const p of allPayments) {
      const arr = paymentsByContract.get(p.contractId) ?? []
      arr.push(p)
      paymentsByContract.set(p.contractId, arr)
    }
    const updatesByContract = new Map<string, typeof allUpdates>()
    for (const u of allUpdates) {
      const arr = updatesByContract.get(u.contractId) ?? []
      arr.push(u)
      updatesByContract.set(u.contractId, arr)
    }

    const commissionRate = await getCommissionRate()

    const data: UnitReportData = {
      unit: {
        identifier: unitRow.unit.identifier,
        type: unitRow.unit.type,
        floor: unitRow.unit.floor ?? null,
        description: unitRow.unit.description ?? null,
      },
      group: unitRow.group ? { name: unitRow.group.name, address: unitRow.group.address } : null,
      commissionRate,
      contracts: contractRows.map(({ contract, tenant }) => ({
        startDate: contract.startDate,
        endDate: contract.endDate,
        status: contract.status,
        currentPrice: contract.currentPrice,
        firstMonthPrice: contract.firstMonthPrice,
        updateType: contract.updateType,
        updateValue: contract.updateValue ?? null,
        appliesVat: contract.appliesVat,
        vatPercentage: contract.vatPercentage,
        tenant: {
          firstName: tenant.firstName,
          lastName: tenant.lastName,
          cuitDni: tenant.cuitDni,
          phone: tenant.phone,
        },
        payments: (paymentsByContract.get(contract.id) ?? []).map((p) => {
          const rate = p.commissionRate != null ? Number(p.commissionRate) : commissionRate
          const comm = calculateCommission(Number(contract.currentPrice), rate, p.applyCommission)
          const isPaid = p.status === 'paid' || p.status === 'partial'
          return {
            periodMonth: p.periodMonth,
            periodYear: p.periodYear,
            amountDue: p.amountDue,
            amountPaid: p.amountPaid ?? null,
            commissionAmount: isPaid ? comm.commission : 0,
            netAmount: isPaid && p.amountPaid ? comm.net : null,
            status: p.status,
            paymentDate: p.paymentDate ?? null,
            dueDate: p.dueDate,
          }
        }),
        updates: (updatesByContract.get(contract.id) ?? []).map((u) => ({
          updateDate: u.updateDate,
          previousPrice: u.previousPrice,
          newPrice: u.newPrice,
          updateType: u.updateType,
          indexValue: u.indexValue ?? null,
        })),
      })),
    }

    const buffer = await generateUnitReport(data)
    const filename = `historial-${unitRow.unit.identifier.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`

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
    console.error('[reports/unit]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
