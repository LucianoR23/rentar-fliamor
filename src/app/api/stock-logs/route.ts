import { NextRequest, NextResponse } from 'next/server'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { stockLogs, materials } from '@/lib/schema'
import { requireRole } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    await requireRole('viewer')
    const { searchParams } = new URL(request.url)
    const materialId = searchParams.get('materialId')

    const query = db
      .select({
        log: stockLogs,
        materialName: materials.name,
      })
      .from(stockLogs)
      .innerJoin(materials, eq(stockLogs.materialId, materials.id))
      .orderBy(desc(stockLogs.createdAt))

    const rows = materialId
      ? await query.where(eq(stockLogs.materialId, materialId))
      : await query

    const data = rows.map(({ log, materialName }) => ({
      ...log,
      materialName,
    }))

    return NextResponse.json(data)
  } catch (e) {
    const err = e as Error
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
