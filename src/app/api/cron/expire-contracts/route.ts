import { NextRequest, NextResponse } from 'next/server'
import { and, eq, lt } from 'drizzle-orm'
import { db } from '@/lib/db'
import { contracts } from '@/lib/schema'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('Authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = new Date().toISOString().split('T')[0]

  const result = await db
    .update(contracts)
    .set({ status: 'expired', updatedAt: new Date() })
    .where(and(eq(contracts.status, 'active'), lt(contracts.endDate, today)))
    .returning({ id: contracts.id })

  return NextResponse.json({
    ok: true,
    expired: result.length,
    ts: new Date().toISOString(),
  })
}
