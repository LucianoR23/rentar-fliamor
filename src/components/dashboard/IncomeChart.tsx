'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Card } from '@/components/ui/card'

export interface IncomeMonth {
  label: string
  projected: number
  collected: number
}

interface IncomeChartProps {
  data: IncomeMonth[]
  className?: string
}

function formatYAxis(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`
  return String(value)
}

function formatTooltipCurrency(value: number): string {
  return '$ ' + value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function IncomeChart({ data, className }: IncomeChartProps) {
  return (
    <Card className={className}>
      <p className="mb-4 text-sm font-medium text-muted-foreground">
        Ingresos — últimos 6 meses
      </p>
      <ResponsiveContainer width="100%" height={440}>
        <BarChart data={data} barGap={4} barCategoryGap="32%">
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatYAxis}
            tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              fontSize: '12px',
            }}
            labelStyle={{ color: 'var(--foreground)', marginBottom: '4px' }}
            itemStyle={{ color: 'var(--muted-foreground)' }}
            formatter={(value, name) => [
              formatTooltipCurrency(Number(value ?? 0)),
              name === 'projected' ? 'Proyectado' : 'Cobrado',
            ]}
          />
          <Legend
            wrapperStyle={{ fontSize: '12px', color: 'var(--muted-foreground)', paddingTop: '8px' }}
            formatter={(value: string) => (value === 'projected' ? 'Proyectado' : 'Cobrado')}
          />
          <Bar dataKey="projected" fill="var(--primary)" radius={[3, 3, 0, 0]} maxBarSize={44} />
          <Bar dataKey="collected" fill="var(--success)" radius={[3, 3, 0, 0]} maxBarSize={44} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}
