'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

const UNIT_TYPE_LABELS: Record<string, string> = {
  apartment: 'Departamento', local: 'Local', land: 'Terreno', house: 'Casa', other: 'Otro',
}

const selectCls = 'h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary'

function MonthYearPicker({
  month, year, onMonth, onYear,
}: { month: number; year: number; onMonth: (v: number) => void; onYear: (v: number) => void }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Mes</label>
        <select className={selectCls} value={month} onChange={(e) => onMonth(Number(e.target.value))}>
          {MONTH_NAMES.map((name, i) => (
            <option key={i} value={i + 1}>{name}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Año</label>
        <input
          type="number"
          className={`${selectCls} w-24`}
          value={year}
          min={2000}
          max={2099}
          onChange={(e) => onYear(Number(e.target.value))}
        />
      </div>
    </div>
  )
}

export interface UnitOption {
  id: string
  identifier: string
  type: string
  floor: string | null
}

export function MonthlyReportForm() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const filename = `reporte-mensual-${year}-${String(month).padStart(2, '0')}.pdf`

  return (
    <div className="rounded-lg border border-border bg-card p-6 max-w-lg">
      <p className="text-sm text-muted-foreground mb-5">
        Tabla de todos los pagos del período seleccionado con estado, monto proyectado y monto cobrado.
      </p>
      <div className="flex flex-wrap items-end gap-4">
        <MonthYearPicker month={month} year={year} onMonth={setMonth} onYear={setYear} />
        <Button asChild size="sm">
          <a href={`/api/reports/monthly?month=${month}&year=${year}`} download={filename}>
            <Download className="h-4 w-4" />
            Descargar PDF
          </a>
        </Button>
      </div>
    </div>
  )
}

export function UnitReportForm({ units }: { units: UnitOption[] }) {
  const [unitId, setUnitId] = useState(units[0]?.id ?? '')
  const selectedUnit = units.find((u) => u.id === unitId)
  const filename = selectedUnit
    ? `historial-${selectedUnit.identifier.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`
    : 'historial.pdf'

  return (
    <div className="rounded-lg border border-border bg-card p-6 max-w-lg">
      <p className="text-sm text-muted-foreground mb-5">
        Historial completo de una unidad: todos sus contratos, pagos registrados y actualizaciones de precio.
      </p>
      {units.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay unidades registradas en el sistema.</p>
      ) : (
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Unidad</label>
            <select
              className={`${selectCls} min-w-55`}
              value={unitId}
              onChange={(e) => setUnitId(e.target.value)}
            >
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.identifier}{u.floor ? ` (Piso ${u.floor})` : ''} — {UNIT_TYPE_LABELS[u.type] ?? u.type}
                </option>
              ))}
            </select>
          </div>
          <Button asChild size="sm" disabled={!unitId}>
            <a href={unitId ? `/api/reports/unit?unitId=${unitId}` : '#'} download={filename}>
              <Download className="h-4 w-4" />
              Descargar PDF
            </a>
          </Button>
        </div>
      )}
    </div>
  )
}

export function CompleteReportForm() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const filename = `reporte-completo-${year}-${String(month).padStart(2, '0')}.pdf`

  return (
    <div className="rounded-lg border border-border bg-card p-6 max-w-lg">
      <p className="text-sm text-muted-foreground mb-5">
        Resumen total del sistema: unidades, contratos activos, ingresos y gastos del período seleccionado.
      </p>
      <div className="flex flex-wrap items-end gap-4">
        <MonthYearPicker month={month} year={year} onMonth={setMonth} onYear={setYear} />
        <Button asChild size="sm">
          <a href={`/api/reports/complete?month=${month}&year=${year}`} download={filename}>
            <Download className="h-4 w-4" />
            Descargar PDF
          </a>
        </Button>
      </div>
    </div>
  )
}
