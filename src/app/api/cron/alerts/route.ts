import { NextRequest, NextResponse } from 'next/server'
import { and, eq, gte, lte } from 'drizzle-orm'
import { db } from '@/lib/db'
import { contracts, units, tenants, users } from '@/lib/schema'
import { resend, FROM_EMAIL } from '@/lib/resend'
import { redis } from '@/lib/redis'
import { renderVencimientoContrato } from '@/emails/VencimientoContrato'
import { renderActualizacionProxima } from '@/emails/ActualizacionProxima'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('Authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Destinatarios: todos los superadmins con email registrado
  const adminEmails = (
    await db.select({ email: users.email }).from(users).where(eq(users.role, 'superadmin'))
  ).map((u) => u.email)

  if (adminEmails.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, skipped: 0, reason: 'no superadmin emails' })
  }

  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const in7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  let sent = 0
  let skipped = 0

  /* ── 1. Contratos que vencen en los próximos 30 días ── */
  const expiring = await db
    .select({ contract: contracts, unit: units, tenant: tenants })
    .from(contracts)
    .innerJoin(units, eq(contracts.unitId, units.id))
    .innerJoin(tenants, eq(contracts.tenantId, tenants.id))
    .where(and(eq(contracts.status, 'active'), gte(contracts.endDate, today), lte(contracts.endDate, in30)))

  for (const { contract, unit, tenant } of expiring) {
    const key = `alert:expiry:${contract.id}`
    if (await redis.get(key)) { skipped++; continue }

    const daysLeft = Math.max(1, Math.ceil(
      (new Date(contract.endDate).getTime() - now.getTime()) / 86_400_000
    ))
    const { html, subject } = renderVencimientoContrato({
      tenant: { firstName: tenant.firstName, lastName: tenant.lastName },
      unit: { identifier: unit.identifier, type: unit.type },
      endDate: contract.endDate,
      daysLeft,
      currentPrice: contract.currentPrice,
    })

    const { error } = await resend.emails.send({ from: FROM_EMAIL, to: adminEmails, subject, html })
    if (error) {
      console.error('[cron/alerts] expiry send failed:', error.message)
      skipped++
      continue
    }
    await redis.set(key, '1', { ex: 60 * 60 * 24 * 35 })
    sent++
  }

  /* ── 2. Contratos con actualización de precio en los próximos 7 días ── */
  const updating = await db
    .select({ contract: contracts, unit: units, tenant: tenants })
    .from(contracts)
    .innerJoin(units, eq(contracts.unitId, units.id))
    .innerJoin(tenants, eq(contracts.tenantId, tenants.id))
    .where(and(eq(contracts.status, 'active'), gte(contracts.nextUpdateDate, today), lte(contracts.nextUpdateDate, in7)))

  for (const { contract, unit, tenant } of updating) {
    const key = `alert:update:${contract.id}:${contract.nextUpdateDate}`
    if (await redis.get(key)) { skipped++; continue }

    const daysLeft = Math.max(1, Math.ceil(
      (new Date(contract.nextUpdateDate).getTime() - now.getTime()) / 86_400_000
    ))
    const { html, subject } = renderActualizacionProxima({
      tenant: { firstName: tenant.firstName, lastName: tenant.lastName },
      unit: { identifier: unit.identifier, type: unit.type },
      updateDate: contract.nextUpdateDate,
      daysLeft,
      currentPrice: contract.currentPrice,
      updateType: contract.updateType,
      updateValue: contract.updateValue ?? null,
    })

    const { error } = await resend.emails.send({ from: FROM_EMAIL, to: adminEmails, subject, html })
    if (error) {
      console.error('[cron/alerts] update send failed:', error.message)
      skipped++
      continue
    }
    await redis.set(key, '1', { ex: 60 * 60 * 24 * 10 })
    sent++
  }

  return NextResponse.json({ ok: true, sent, skipped, ts: now.toISOString() })
}
