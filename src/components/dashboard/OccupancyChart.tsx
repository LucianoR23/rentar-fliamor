'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const UNIT_TYPE_LABELS: Record<string, string> = {
  apartment: 'Departamento',
  local: 'Local',
  land: 'Terreno',
  house: 'Casa',
  other: 'Otro',
}

const TYPE_COLORS: Record<string, string> = {
  apartment: '#7C3AED',
  local: '#F59E0B',
  land: '#10B981',
  house: '#3B82F6',
  other: '#A1A1AA',
}

export interface OccupancyData {
  type: string
  total: number
  occupied: number
}

interface OccupancyChartProps {
  data: OccupancyData[]
  className?: string
}

interface PieSlice {
  name: string
  value: number
  type: string
  status: 'occupied' | 'vacant'
}

export function OccupancyChart({ data, className }: OccupancyChartProps) {
  const totalUnits = data.reduce((s, d) => s + d.total, 0)
  const totalOccupied = data.reduce((s, d) => s + d.occupied, 0)

  const pieData: PieSlice[] = data
    .flatMap((d) => [
      { name: `${UNIT_TYPE_LABELS[d.type] ?? d.type} — Ocupado`, value: d.occupied, type: d.type, status: 'occupied' as const },
      { name: `${UNIT_TYPE_LABELS[d.type] ?? d.type} — Libre`, value: d.total - d.occupied, type: d.type, status: 'vacant' as const },
    ])
    .filter((s) => s.value > 0)

  if (totalUnits === 0) {
    return (
      <Card className={cn('flex items-center justify-center p-6 text-muted-foreground', className)}>
        Sin unidades registradas
      </Card>
    )
  }

  const occupancyPct = Math.round((totalOccupied / totalUnits) * 100)

  return (
    <Card className={className}>
      <p className="text-sm font-medium text-muted-foreground">Ocupación por tipo</p>
      <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-foreground">
        {totalOccupied}/{totalUnits}
        <span className="ml-2 text-base font-normal text-muted-foreground">
          ({occupancyPct}%)
        </span>
      </p>

      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={80}
            outerRadius={130}
            paddingAngle={2}
            dataKey="value"
          >
            {pieData.map((entry, i) => (
              <Cell
                key={`cell-${i}`}
                fill={entry.status === 'occupied' ? (TYPE_COLORS[entry.type] ?? '#7C3AED') : '#27272A'}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: '#18181B',
              border: '1px solid #27272A',
              borderRadius: '6px',
              fontSize: '12px',
            }}
            labelStyle={{ color: '#FAFAFA' }}
            itemStyle={{ color: '#A1A1AA' }}
            formatter={(value, name) => [value as number, name as string]}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1.5">
        {data.map((d) => (
          <div key={d.type} className="flex items-center gap-1.5 text-xs">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: TYPE_COLORS[d.type] ?? '#7C3AED' }}
            />
            <span className="text-muted-foreground">
              {UNIT_TYPE_LABELS[d.type] ?? d.type}:{' '}
              <span className="font-medium text-foreground">{d.occupied}/{d.total}</span>
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}
