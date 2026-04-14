import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { materials, stockLogs } from '@/lib/schema'
import { requireRole } from '@/lib/auth'
import { materialSchema } from '@/lib/validations/material'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await requireRole('viewer')
    const { id } = await params
    const material = await db.query.materials.findFirst({ where: eq(materials.id, id) })
    if (!material) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(material)
  } catch (e) {
    const err = e as Error
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    await requireRole('admin')
    const { id } = await params
    const body: unknown = await request.json()
    const data = materialSchema.parse(body)

    const existing = await db.query.materials.findFirst({ where: eq(materials.id, id) })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const updated = await db.transaction(async (tx) => {
      const [result] = await tx
        .update(materials)
        .set({
          name: data.name,
          stock: data.stock,
          unitOfMeasure: data.unitOfMeasure,
          unitCost: data.unitCost ? data.unitCost.toString() : null,
          observations: data.observations || null,
          updatedAt: new Date(),
        })
        .where(eq(materials.id, id))
        .returning()

      if (existing.stock !== data.stock) {
        await tx.insert(stockLogs).values({
          materialId: id,
          previousStock: existing.stock,
          newStock: data.stock,
          reason: 'manual_edit',
        })
      }

      return result
    })

    return NextResponse.json(updated)
  } catch (e) {
    const err = e as Error
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (err.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await requireRole('admin')
    const { id } = await params
    await db.delete(materials).where(eq(materials.id, id))
    return new NextResponse(null, { status: 204 })
  } catch (e) {
    const err = e as Error
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (err.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
