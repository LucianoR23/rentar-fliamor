import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { contracts, contractUpdates } from '@/lib/schema'
import { requireRole } from '@/lib/auth'
import { addMonths } from '@/lib/compute-update'

type Params = { params: Promise<{ id: string }> }

interface ApplyBody {
  previousPrice: number
  newPrice: number
  indexValue: number | null
}

/**
 * Applies a rent update with client-provided values.
 * Creates a contractUpdates history record and updates currentPrice + nextUpdateDate.
 */
export async function POST(req: NextRequest, { params }: Params) {
  try {
    await requireRole('admin')
    const { id } = await params

    const body = (await req.json()) as ApplyBody
    if (!body.newPrice || body.newPrice <= 0) {
      return NextResponse.json({ error: 'Nuevo precio inválido' }, { status: 400 })
    }

    const contract = await db.query.contracts.findFirst({ where: eq(contracts.id, id) })
    if (!contract) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (contract.status !== 'active') {
      return NextResponse.json({ error: 'El contrato no está activo' }, { status: 400 })
    }

    // Use the contract's nextUpdateDate as the period this update covers,
    // not today's date — so the timeline reflects the correct period.
    const periodDate = contract.nextUpdateDate
    const newNextUpdateDate = addMonths(periodDate, contract.updateFrequencyMonths)

    await db.insert(contractUpdates).values({
      contractId: id,
      updateDate: periodDate,
      previousPrice: String(body.previousPrice),
      newPrice: String(body.newPrice),
      updateType: contract.updateType,
      indexValue: body.indexValue != null ? String(body.indexValue) : null,
    })

    const [updated] = await db
      .update(contracts)
      .set({
        currentPrice: String(body.newPrice),
        nextUpdateDate: newNextUpdateDate,
        updatedAt: new Date(),
      })
      .where(eq(contracts.id, id))
      .returning()

    return NextResponse.json({ contract: updated })
  } catch (e) {
    const err = e as Error
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (err.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
