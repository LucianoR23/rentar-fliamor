import { NextRequest, NextResponse } from 'next/server'
import { eq, and } from 'drizzle-orm'
import { db } from '@/lib/db'
import { repairs, materials, stockLogs, files } from '@/lib/schema'
import { requireRole } from '@/lib/auth'
import { deleteFromR2 } from '@/lib/r2'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await requireRole('viewer')
    const { id } = await params

    const repair = await db.query.repairs.findFirst({
      where: eq(repairs.id, id),
      with: {
        unit: true,
        contract: true,
        repairMaterials: { with: { material: true } },
      },
    })

    if (!repair) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(repair)
  } catch (e) {
    const err = e as Error
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await requireRole('admin')
    const { id } = await params

    const repair = await db.query.repairs.findFirst({
      where: eq(repairs.id, id),
      with: { repairMaterials: true },
    })

    if (!repair) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await db.transaction(async (tx) => {
      for (const rm of repair.repairMaterials) {
        const material = await tx.query.materials.findFirst({
          where: eq(materials.id, rm.materialId),
        })

        if (material) {
          const restoredStock = material.stock + rm.quantity
          await tx
            .update(materials)
            .set({ stock: restoredStock, updatedAt: new Date() })
            .where(eq(materials.id, rm.materialId))

          await tx.insert(stockLogs).values({
            materialId: rm.materialId,
            previousStock: material.stock,
            newStock: restoredStock,
            reason: 'manual_edit',
          })
        }
      }

      await tx.delete(repairs).where(eq(repairs.id, id))
    })

    const repairFiles = await db
      .select()
      .from(files)
      .where(and(eq(files.entityType, 'repair'), eq(files.entityId, id)))

    for (const file of repairFiles) {
      await deleteFromR2(file.r2Key)
      await db.delete(files).where(eq(files.id, file.id))
    }

    return new NextResponse(null, { status: 204 })
  } catch (e) {
    const err = e as Error
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (err.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
