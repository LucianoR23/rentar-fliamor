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
const ARGLY_BASE = 'https://api.argly.com.ar/api'

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Parse Argly date format "DD/MM/YYYY" → "YYYY-MM-DD" */
function parseArglyDate(arglyDate: string): string {
  const [dd, mm, yyyy] = arglyDate.split('/')
  return `${yyyy}-${mm}-${dd}`
}

// ── ICL ───────────────────────────────────────────────────────────────────────

interface ArglyIclResponse {
  data: { fecha: string; valor: number }
}

/**
 * Returns the latest ICL index value via api.argly.com.ar.
 * Cached in Redis for 24 h.
 */
export async function getICL(): Promise<IndexPoint> {
  const cacheKey = 'icl:latest'

  const cached = await redis.get<IndexPoint>(cacheKey)
  if (cached) return cached

  const res = await fetch(`${ARGLY_BASE}/icl`, { next: { revalidate: 0 } })
  if (!res.ok) throw new Error(`Argly ICL API error: ${res.status}`)

  const json = (await res.json()) as ArglyIclResponse
  const point: IndexPoint = {
    value: json.data.valor,
    date: parseArglyDate(json.data.fecha),
  }

  await redis.set(cacheKey, point, { ex: TTL })
  return point
}

// ── IPC ───────────────────────────────────────────────────────────────────────

interface ArglyIpcResponse {
  data: {
    indice_ipc: number
    mes: number
    nombre_mes: string
    anio: number
  }
}

/**
 * Returns the latest IPC variation via api.argly.com.ar.
 * Cached in Redis for 24 h.
 */
export async function getIPC(): Promise<IpcVariation> {
  const cacheKey = 'ipc:latest'

  const cached = await redis.get<IpcVariation>(cacheKey)
  if (cached) return cached

  const res = await fetch(`${ARGLY_BASE}/ipc`, { next: { revalidate: 0 } })
  if (!res.ok) throw new Error(`Argly IPC API error: ${res.status}`)

  const json = (await res.json()) as ArglyIpcResponse
  const variation: IpcVariation = {
    date: `${json.data.anio}-${String(json.data.mes).padStart(2, '0')}-01`,
    variation: json.data.indice_ipc,
  }

  await redis.set(cacheKey, variation, { ex: TTL })
  return variation
}
