import { NextRequest, NextResponse } from 'next/server'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { repairs, repairMaterials, materials, stockLogs } from '@/lib/schema'
import { requireRole } from '@/lib/auth'
import { repairSchema } from '@/lib/validations/repair'

export async function GET(request: NextRequest) {
  try {
    await requireRole('viewer')
    const { searchParams } = new URL(request.url)
    const unitId = searchParams.get('unitId')

    const rows = await db.query.repairs.findMany({
      where: unitId ? eq(repairs.unitId, unitId) : undefined,
      with: {
        unit: true,
        contract: true,
        repairMaterials: {
          with: { material: true },
        },
      },
      orderBy: [desc(repairs.repairDate)],
    })

    return NextResponse.json(rows)
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
    const data = repairSchema.parse(body)

    const repair = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(repairs)
        .values({
          unitId: data.unitId,
          contractId: data.contractId ?? null,
          description: data.description,
          repairDate: data.repairDate,
          laborCost: data.laborCost ? data.laborCost.toString() : null,
        })
        .returning()

      if (data.materials && data.materials.length > 0) {
        for (const item of data.materials) {
          const material = await tx.query.materials.findFirst({
            where: eq(materials.id, item.materialId),
          })

          if (!material) {
            throw new Error(`Material ${item.materialId} no encontrado`)
          }

          if (material.stock < item.quantity) {
            throw new Error(`Stock insuficiente para "${material.name}". Disponible: ${material.stock}, requerido: ${item.quantity}`)
          }

          await tx.insert(repairMaterials).values({
            repairId: created.id,
            materialId: item.materialId,
            quantity: item.quantity,
            unitCostSnapshot: material.unitCost,
          })

          const newStock = material.stock - item.quantity
          await tx
            .update(materials)
            .set({ stock: newStock, updatedAt: new Date() })
            .where(eq(materials.id, item.materialId))

          await tx.insert(stockLogs).values({
            materialId: item.materialId,
            previousStock: material.stock,
            newStock,
            reason: 'repair_usage',
          })
        }
      }

      return created
    })

    const full = await db.query.repairs.findFirst({
      where: eq(repairs.id, repair.id),
      with: {
        unit: true,
        contract: true,
        repairMaterials: { with: { material: true } },
      },
    })

    return NextResponse.json(full, { status: 201 })
  } catch (e) {
    const err = e as Error
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (err.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (err.message.startsWith('Stock insuficiente') || err.message.includes('no encontrado')) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
