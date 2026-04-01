import { and, count, eq, gte, lte, sql, sum } from 'drizzle-orm'
import { Building2, CalendarClock, CheckCircle2, TrendingUp } from 'lucide-react'

import { KpiCard } from '@/components/dashboard/KpiCard'
import { IncomeChart } from '@/components/dashboard/IncomeChart'
import { OccupancyChart } from '@/components/dashboard/OccupancyChart'
import { PageHeader } from '@/components/shared/PageHeader'
import { db } from '@/lib/db'
import { contracts, payments, units } from '@/lib/schema'
import { formatCurrency } from '@/lib/utils'

const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

export default async function DashboardPage() {
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  const today = now.toISOString().split('T')[0]
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  // Build last 6 months array (oldest → newest)
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(currentYear, currentMonth - 1 - (5 - i), 1)
    return {
      month: d.getMonth() + 1,
      year: d.getFullYear(),
      label: `${MONTH_LABELS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
    }
  })
  const { month: startMonth, year: startYear } = last6Months[0]

  const [
    rawUnitsStats,
    rawProjected,
    rawCollected,
    rawUpcoming,
    occupancyByType,
    incomeRows,
  ] = await Promise.all([
    // Total units & occupied (units with active contract)
    db
      .select({ total: count(), occupied: count(contracts.id) })
      .from(units)
      .leftJoin(contracts, and(eq(contracts.unitId, units.id), eq(contracts.status, 'active'))),

    // Current month projected income (sum of amountDue)
    db
      .select({ total: sum(payments.amountDue) })
      .from(payments)
      .where(and(eq(payments.periodMonth, currentMonth), eq(payments.periodYear, currentYear))),

    // Current month collected (sum of amountPaid where status = 'paid')
    db
      .select({ total: sum(payments.amountPaid) })
      .from(payments)
      .where(
        and(
          eq(payments.periodMonth, currentMonth),
          eq(payments.periodYear, currentYear),
          eq(payments.status, 'paid')
        )
      ),

    // Upcoming contract updates in next 30 days
    db
      .select({ total: count() })
      .from(contracts)
      .where(
        and(
          eq(contracts.status, 'active'),
          gte(contracts.nextUpdateDate, today),
          lte(contracts.nextUpdateDate, in30Days)
        )
      ),

    // Occupancy broken down by unit type
    db
      .select({ type: units.type, total: count(), occupied: count(contracts.id) })
      .from(units)
      .leftJoin(contracts, and(eq(contracts.unitId, units.id), eq(contracts.status, 'active')))
      .groupBy(units.type),

    // Last 6 months: projected vs collected per month
    db
      .select({
        month: payments.periodMonth,
        year: payments.periodYear,
        projected: sum(payments.amountDue),
        collected: sum(payments.amountPaid),
      })
      .from(payments)
      .where(
        sql`${payments.periodYear} * 12 + ${payments.periodMonth} >= ${startYear * 12 + startMonth}`
      )
      .groupBy(payments.periodYear, payments.periodMonth)
      .orderBy(payments.periodYear, payments.periodMonth),
  ])

  const unitsStats = rawUnitsStats[0] ?? { total: 0, occupied: 0 }
  const projectedAmount = parseFloat(rawProjected[0]?.total ?? '0')
  const collectedAmount = parseFloat(rawCollected[0]?.total ?? '0')
  const upcomingCount = rawUpcoming[0]?.total ?? 0

  const occupancyPct =
    unitsStats.total > 0 ? Math.round((unitsStats.occupied / unitsStats.total) * 100) : 0

  // Merge income rows into full 6-month array (fill missing months with 0)
  const incomeMap = new Map(incomeRows.map((r) => [`${r.year}-${r.month}`, r]))
  const incomeChartData = last6Months.map(({ month, year, label }) => {
    const row = incomeMap.get(`${year}-${month}`)
    return {
      label,
      projected: parseFloat(row?.projected ?? '0'),
      collected: parseFloat(row?.collected ?? '0'),
    }
  })

  return (
    <div>
      <PageHeader title="Dashboard" description="Resumen general del sistema" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Ocupación"
          value={`${occupancyPct}%`}
          description={`${unitsStats.occupied} de ${unitsStats.total} unidades`}
          icon={Building2}
        />
        <KpiCard
          title="Proyectado del mes"
          value={formatCurrency(projectedAmount)}
          description={`${MONTH_LABELS[currentMonth - 1]} ${currentYear}`}
          icon={TrendingUp}
        />
        <KpiCard
          title="Cobrado"
          value={formatCurrency(collectedAmount)}
          description="Pagos confirmados del mes"
          icon={CheckCircle2}
        />
        <KpiCard
          title="Próximas actualizaciones"
          value={String(upcomingCount)}
          description="Contratos en los próximos 30 días"
          icon={CalendarClock}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <OccupancyChart data={occupancyByType} className="lg:col-span-2" />
        <IncomeChart data={incomeChartData} className="lg:col-span-3" />
      </div>
    </div>
  )
}
