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
import { cn } from '@/lib/utils'

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
    <div className={cn('rounded-lg border border-border bg-card p-5', className)}>
      <p className="mb-4 text-sm font-medium text-muted-foreground">
        Ingresos — últimos 6 meses
      </p>
      <ResponsiveContainer width="100%" height={440}>
        <BarChart data={data} barGap={4} barCategoryGap="32%">
          <CartesianGrid vertical={false} stroke="#27272A" strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tick={{ fill: '#A1A1AA', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatYAxis}
            tick={{ fill: '#A1A1AA', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip
            contentStyle={{
              background: '#18181B',
              border: '1px solid #27272A',
              borderRadius: '6px',
              fontSize: '12px',
            }}
            labelStyle={{ color: '#FAFAFA', marginBottom: '4px' }}
            itemStyle={{ color: '#A1A1AA' }}
            formatter={(value, name) => [
              formatTooltipCurrency(Number(value ?? 0)),
              name === 'projected' ? 'Proyectado' : 'Cobrado',
            ]}
          />
          <Legend
            wrapperStyle={{ fontSize: '12px', color: '#A1A1AA', paddingTop: '8px' }}
            formatter={(value: string) => (value === 'projected' ? 'Proyectado' : 'Cobrado')}
          />
          <Bar dataKey="projected" fill="#7C3AED" radius={[3, 3, 0, 0]} maxBarSize={44} />
          <Bar dataKey="collected" fill="#10B981" radius={[3, 3, 0, 0]} maxBarSize={44} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
