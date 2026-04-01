import { redis } from './redis'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface IndexPoint {
  value: number
  date: string
}

export interface IpcVariation {
  date: string      // YYYY-MM-01 (monthly)
  variation: number // percentage (e.g. 4.2 = 4.2%)
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TTL = 60 * 60 * 24 // 24 hours

// BCRA publishes the ICL (Índice para Contratos de Locación) daily.
// Variable ID 40 in BCRA's estadísticas API.
// Docs: https://www.bcra.gob.ar/BCRAyVos/servicios_datos.asp
const BCRA_BASE = 'https://api.bcra.gob.ar/estadisticas/v3.0/Datos'
const ICL_VARIABLE = 40

// INDEC IPC Nacional — variación mensual, via datos.gob.ar time series API.
// Series ID: 148.3_INIVELNAL_DICI_M_26
const IPC_SERIES_URL =
  'https://apis.datos.gob.ar/series/api/series/?ids=148.3_INIVELNAL_DICI_M_26&limit=13&sort=desc&format=json'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

function subtractDays(d: Date, days: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() - days)
  return r
}

// ── ICL ───────────────────────────────────────────────────────────────────────

interface BcraResponse {
  status: number
  results?: { d: string; v: number }[]
}

/**
 * Returns the ICL index value for a given date (or the most recent available
 * value if no date is specified). Results are cached in Redis for 24 h.
 *
 * If the exact date has no data (weekend/holiday), returns the closest prior
 * value within a 7-day lookback window.
 */
export async function getICL(date?: string): Promise<IndexPoint> {
  const targetDate = date ?? formatDate(new Date())
  const cacheKey = `icl:${targetDate}`

  const cached = await redis.get<IndexPoint>(cacheKey)
  if (cached) return cached

  // Request a 10-day window ending on targetDate to handle weekends/holidays
  const to = new Date(targetDate)
  const from = subtractDays(to, 10)

  const url = `${BCRA_BASE}/${ICL_VARIABLE}/${formatDate(from)}/${formatDate(to)}`
  const res = await fetch(url, { next: { revalidate: 0 } })

  if (!res.ok) {
    throw new Error(`BCRA API error: ${res.status}`)
  }

  const json = (await res.json()) as BcraResponse

  if (!json.results || json.results.length === 0) {
    throw new Error('No ICL data available from BCRA')
  }

  // results are sorted descending by date — take the most recent
  const latest = json.results[0]
  const point: IndexPoint = { value: latest.v, date: latest.d }

  await redis.set(cacheKey, point, { ex: TTL })
  return point
}

// ── IPC ───────────────────────────────────────────────────────────────────────

interface DatosGobArResponse {
  data: [string, number][]
}

/**
 * Returns the last N monthly IPC (Nacional) variations from INDEC via
 * datos.gob.ar. Results are cached for 24 h.
 *
 * @param months  How many monthly observations to return (default: 13).
 */
export async function getIPC(months = 13): Promise<IpcVariation[]> {
  const cacheKey = `ipc:variations:${months}`

  const cached = await redis.get<IpcVariation[]>(cacheKey)
  if (cached) return cached

  const res = await fetch(IPC_SERIES_URL, { next: { revalidate: 0 } })

  if (!res.ok) {
    throw new Error(`datos.gob.ar API error: ${res.status}`)
  }

  const json = (await res.json()) as DatosGobArResponse

  const variations: IpcVariation[] = json.data
    .slice(0, months)
    .map(([date, variation]) => ({ date, variation }))

  await redis.set(cacheKey, variations, { ex: TTL })
  return variations
}

// ── Variation helpers ─────────────────────────────────────────────────────────

/**
 * Calculates the ICL variation (%) between two index points.
 * Formula: (iclNow / iclBase - 1) * 100
 */
export function iclVariation(now: IndexPoint, base: IndexPoint): number {
  return Math.round(((now.value / base.value) - 1) * 10000) / 100
}

/**
 * Compounds N monthly IPC variations into a single accumulated percentage.
 * Formula: ((1 + v1/100) * (1 + v2/100) * ... - 1) * 100
 */
export function compoundIpc(variations: IpcVariation[]): number {
  const factor = variations.reduce((acc, { variation }) => acc * (1 + variation / 100), 1)
  return Math.round((factor - 1) * 10000) / 100
}
