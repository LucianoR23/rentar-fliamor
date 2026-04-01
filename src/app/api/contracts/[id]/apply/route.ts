import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { contracts, contractUpdates } from '@/lib/schema'
import { requireRole } from '@/lib/auth'
import type { CalculationPreview } from '../calculate/route'

type Params = { params: Promise<{ id: string }> }

/**
 * Applies a pre-calculated rent update to the contract.
 * Expects the CalculationPreview payload in the request body.
 * Creates a contractUpdate history record and updates currentPrice + nextUpdateDate.
 */
export async function POST(request: NextRequest, { params }: Params) {
  try {
    await requireRole('superadmin')
    const { id } = await params

    const contract = await db.query.contracts.findFirst({
      where: eq(contracts.id, id),
    })
    if (!contract) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = (await request.json()) as CalculationPreview

    // Persist history record
    await db.insert(contractUpdates).values({
      contractId: id,
      updateDate: new Date().toISOString().split('T')[0],
      previousPrice: String(body.currentPrice),
      newPrice: String(body.newPrice),
      updateType: body.updateType,
      indexValue: body.indexVariation != null ? String(body.indexVariation) : null,
    })

    // Update contract
    const [updated] = await db
      .update(contracts)
      .set({
        currentPrice: String(body.newPrice),
        nextUpdateDate: body.nextUpdateDate,
        updatedAt: new Date(),
      })
      .where(eq(contracts.id, id))
      .returning()

    return NextResponse.json(updated)
  } catch (e) {
    const err = e as Error
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (err.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
