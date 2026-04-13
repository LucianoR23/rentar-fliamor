import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { createInvoiceSchema } from '@/lib/validations/invoice'
import { resolveInvoiceType, calculateInvoiceAmounts, resolveDocType, getCondicionIvaReceptorId, isExempt } from '@/lib/afip'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { contracts } from '@/lib/schema'
import type { TaxCondition, UnitType } from '@/types'

export async function POST(request: NextRequest) {
  try {
    await requireRole('admin')
    const body: unknown = await request.json()
    const data = createInvoiceSchema.parse(body)

    const contract = await db.query.contracts.findFirst({
      where: eq(contracts.id, data.contractId),
      with: { unit: true, tenant: true },
    })

    if (!contract) {
      return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 })
    }

    const taxCondition = data.taxCondition as TaxCondition
    const unitType = contract.unit.type as UnitType
    const { invoiceType, cbteTipo } = resolveInvoiceType(taxCondition)
    const amounts = calculateInvoiceAmounts(data.amount, taxCondition, unitType)
    const { docTipo, docNro } = resolveDocType(taxCondition, contract.tenant.cuitDni)
    const condicionIvaReceptorId = getCondicionIvaReceptorId(taxCondition)
    const exempt = isExempt(unitType)

    return NextResponse.json({
      invoiceType,
      cbteTipo,
      ...amounts,
      docTipo,
      docNro,
      condicionIvaReceptorId,
      exempt,
      recipientName: `${contract.tenant.lastName}, ${contract.tenant.firstName}`,
      recipientCuitDni: contract.tenant.cuitDni,
      unitType,
    })
  } catch (e) {
    const err = e as Error
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (err.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
