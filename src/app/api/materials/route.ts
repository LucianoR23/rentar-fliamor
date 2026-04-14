import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { materials, stockLogs } from '@/lib/schema'
import { requireRole } from '@/lib/auth'
import { materialSchema } from '@/lib/validations/material'

export async function GET() {
  try {
    await requireRole('viewer')
    const all = await db.select().from(materials).orderBy(materials.name)
    return NextResponse.json(all)
  } catch (e) {
    const err = e as Error
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole('admin')
    const body: unknown = await request.json()
    const data = materialSchema.parse(body)

    const material = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(materials)
        .values({
          name: data.name,
          stock: data.stock,
          unitOfMeasure: data.unitOfMeasure,
          unitCost: data.unitCost ? data.unitCost.toString() : null,
          observations: data.observations || null,
        })
        .returning()

      await tx.insert(stockLogs).values({
        materialId: created.id,
        previousStock: 0,
        newStock: data.stock,
        reason: 'initial',
      })

      return created
    })

    return NextResponse.json(material, { status: 201 })
  } catch (e) {
    const err = e as Error
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (err.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
