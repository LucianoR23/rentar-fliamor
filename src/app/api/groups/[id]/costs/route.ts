import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { groups, groupCostConfig } from '@/lib/schema'
import { requireRole } from '@/lib/auth'
import { costDistributionSchema } from '@/lib/validations/group'

type Params = { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    await requireRole('superadmin')
    const { id } = await params

    const group = await db.query.groups.findFirst({ where: eq(groups.id, id) })
    if (!group) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body: unknown = await request.json()
    const data = costDistributionSchema.parse(body)

    // Replace all cost config for this group
    await db.delete(groupCostConfig).where(eq(groupCostConfig.groupId, id))

    const entries = Object.entries(data) as [string, number][]
    const rows = entries
      .filter(([, percentage]) => percentage > 0)
      .map(([unitType, percentage]) => ({
        groupId: id,
        unitType: unitType as 'apartment' | 'local' | 'land' | 'house' | 'other',
        percentage: String(percentage),
      }))

    if (rows.length > 0) {
      await db.insert(groupCostConfig).values(rows)
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    const err = e as Error
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (err.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
