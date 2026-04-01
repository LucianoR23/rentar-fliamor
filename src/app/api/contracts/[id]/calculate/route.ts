import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { contracts } from '@/lib/schema'
import { requireRole } from '@/lib/auth'
import { computeContractUpdate } from '@/lib/compute-update'

export type { CalculationPreview } from '@/lib/compute-update'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await requireRole('viewer')
    const { id } = await params

    const contract = await db.query.contracts.findFirst({ where: eq(contracts.id, id) })
    if (!contract) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const preview = await computeContractUpdate(contract)
    return NextResponse.json(preview)
  } catch (e) {
    const err = e as Error
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
