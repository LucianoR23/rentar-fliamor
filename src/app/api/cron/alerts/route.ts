import { NextRequest, NextResponse } from 'next/server'
import { and, eq, gte, lte } from 'drizzle-orm'
import { db } from '@/lib/db'
import { contracts, units, tenants, users } from '@/lib/schema'
import { resend, FROM_EMAIL } from '@/lib/resend'
import { redis } from '@/lib/redis'
import React from 'react'
import { VencimientoContrato, vencimientoContratoSubject } from '@/emails/VencimientoContrato'
import { ActualizacionProxima, actualizacionProximaSubject } from '@/emails/ActualizacionProxima'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('Authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { renderToStaticMarkup } = await import('react-dom/server')

    // Destinatarios: todos los usuarios con email registrado
    const adminEmails = (
      await db.select({ email: users.email }).from(users)
    ).map((u) => u.email)

    if (adminEmails.length === 0) {
      return NextResponse.json({ ok: true, sent: 0, skipped: 0, reason: 'no user emails' })
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
      const props = {
        tenant: { firstName: tenant.firstName, lastName: tenant.lastName },
        unit: { identifier: unit.identifier, type: unit.type },
        endDate: contract.endDate,
        daysLeft,
        currentPrice: contract.currentPrice,
      }
      const html = '<!DOCTYPE html>' + renderToStaticMarkup(React.createElement(VencimientoContrato, props))
      const subject = vencimientoContratoSubject(props)

      const { error } = await resend.emails.send({ from: FROM_EMAIL, to: adminEmails, subject, html })
      if (error) {
        console.error('[cron/alerts] expiry send failed:', error.message)
        skipped++
        continue
      }
      await redis.set(key, '1', 'EX', 60 * 60 * 24 * 35)
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
      const props = {
        tenant: { firstName: tenant.firstName, lastName: tenant.lastName },
        unit: { identifier: unit.identifier, type: unit.type },
        updateDate: contract.nextUpdateDate,
        daysLeft,
        currentPrice: contract.currentPrice,
        updateType: contract.updateType,
        updateValue: contract.updateValue ?? null,
      }
      const html = '<!DOCTYPE html>' + renderToStaticMarkup(React.createElement(ActualizacionProxima, props))
      const subject = actualizacionProximaSubject(props)

      const { error } = await resend.emails.send({ from: FROM_EMAIL, to: adminEmails, subject, html })
      if (error) {
        console.error('[cron/alerts] update send failed:', error.message)
        skipped++
        continue
      }
      await redis.set(key, '1', 'EX', 60 * 60 * 24 * 10)
      sent++
    }

    return NextResponse.json({ ok: true, sent, skipped, ts: now.toISOString() })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const stack = err instanceof Error ? err.stack : undefined
    console.error('[cron/alerts] unhandled error:', message, stack)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
