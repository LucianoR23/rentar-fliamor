import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { contracts, contractUpdates } from '@/lib/schema'
import { requireRole } from '@/lib/auth'
import { computeContractUpdate } from '@/lib/compute-update'

type Params = { params: Promise<{ id: string }> }

/**
 * Calculates the rent update and applies it in one atomic step.
 * Creates a contractUpdates history record and updates currentPrice + nextUpdateDate.
 */
export async function POST(_req: NextRequest, { params }: Params) {
  try {
    await requireRole('admin')
    const { id } = await params

    const contract = await db.query.contracts.findFirst({ where: eq(contracts.id, id) })
    if (!contract) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (contract.status !== 'active') {
      return NextResponse.json({ error: 'El contrato no está activo' }, { status: 400 })
    }

    const preview = await computeContractUpdate(contract)

    await db.insert(contractUpdates).values({
      contractId: id,
      updateDate: new Date().toISOString().split('T')[0],
      previousPrice: String(preview.currentPrice),
      newPrice: String(preview.newPrice),
      updateType: preview.updateType,
      indexValue: preview.indexVariation != null ? String(preview.indexVariation) : null,
    })

    const [updated] = await db
      .update(contracts)
      .set({
        currentPrice: String(preview.newPrice),
        nextUpdateDate: preview.nextUpdateDate,
        updatedAt: new Date(),
      })
      .where(eq(contracts.id, id))
      .returning()

    return NextResponse.json({ contract: updated, preview })
  } catch (e) {
    const err = e as Error
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (err.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
