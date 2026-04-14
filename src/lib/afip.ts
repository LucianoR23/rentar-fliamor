import Afip from '@afipsdk/afip.js'
import type { TaxCondition, UnitType } from '@/types'

// --- AFIP Client ---

export function createAfipClient() {
  const cert = process.env.AFIP_CERT?.replace(/\\n/g, '\n')
  const key = process.env.AFIP_KEY?.replace(/\\n/g, '\n')
  const cuitStr = process.env.AFIP_CUIT
  const ptoVtaStr = process.env.AFIP_PTO_VTA
  const accessToken = process.env.AFIP_ACCESS_TOKEN

  if (!cert || !key || !cuitStr || !ptoVtaStr || !accessToken) {
    throw new Error('Faltan credenciales AFIP configuradas (AFIP_CERT, AFIP_KEY, AFIP_CUIT, AFIP_PTO_VTA, AFIP_ACCESS_TOKEN)')
  }

  const cuit = parseInt(cuitStr)
  const ptoVta = parseInt(ptoVtaStr)

  const afip = new Afip({
    CUIT: cuit,
    cert,
    key,
    production: true,
    access_token: accessToken,
  })

  return { afip, cuit, ptoVta }
}

// --- Date helpers ---

const AFIP_TZ = 'America/Argentina/Buenos_Aires' as const

export function getArgentinaCalendarDateISO(reference: Date = new Date()): string {
  const dtf = new Intl.DateTimeFormat('en-CA', {
    timeZone: AFIP_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = dtf.formatToParts(reference)
  const y = parts.find((p) => p.type === 'year')?.value
  const m = parts.find((p) => p.type === 'month')?.value
  const d = parts.find((p) => p.type === 'day')?.value
  if (!y || !m || !d) throw new Error('No se pudo resolver la fecha Argentina')
  return `${y}-${m}-${d}`
}

function getServicePeriodDates(month: number, year: number) {
  const desde = `${year}${String(month).padStart(2, '0')}01`
  const lastDay = new Date(year, month, 0).getDate()
  const hasta = `${year}${String(month).padStart(2, '0')}${String(lastDay).padStart(2, '0')}`
  return { desde, hasta }
}

// --- Invoice type resolution ---

export function resolveInvoiceType(taxCondition: TaxCondition): { invoiceType: 'A' | 'B'; cbteTipo: number } {
  switch (taxCondition) {
    case 'responsable_inscripto':
    case 'monotributista':
      return { invoiceType: 'A', cbteTipo: 1 }
    case 'consumidor_final':
    case 'exento':
      return { invoiceType: 'B', cbteTipo: 6 }
  }
}

export function getCondicionIvaReceptorId(taxCondition: TaxCondition): number {
  switch (taxCondition) {
    case 'responsable_inscripto': return 1
    case 'exento': return 4
    case 'consumidor_final': return 5
    case 'monotributista': return 6
  }
}

export function isExempt(unitType: UnitType): boolean {
  return unitType !== 'local'
}

export function resolveDocType(taxCondition: TaxCondition, cuitDni: string): { docTipo: number; docNro: string } {
  const clean = cuitDni.replace(/\D/g, '')
  const { cbteTipo } = resolveInvoiceType(taxCondition)

  if (cbteTipo === 1) {
    // Factura A siempre requiere CUIT
    return { docTipo: 80, docNro: clean }
  }

  // Factura B: CUIT si tiene 11 dígitos, DNI si tiene 7-8, sin identificar si no hay
  if (clean.length === 11) return { docTipo: 80, docNro: clean }
  if (clean.length >= 7) return { docTipo: 96, docNro: clean }
  return { docTipo: 99, docNro: '0' }
}

// --- Voucher data builder ---

const VAT_RATE = 0.21
const VAT_AFIP_ID = 5 // 21% alícuota

interface BuildVoucherParams {
  amount: number
  taxCondition: TaxCondition
  unitType: UnitType
  cuitDni: string
  periodMonth: number
  periodYear: number
  puntoVenta: number
  cbteNro: number
  paymentMethod?: string
}

export interface VoucherAmounts {
  impNeto: number
  impIva: number
  impOpEx: number
  impTotal: number
}

export function calculateInvoiceAmounts(
  amount: number,
  taxCondition: TaxCondition,
  unitType: UnitType
): VoucherAmounts {
  const { cbteTipo } = resolveInvoiceType(taxCondition)
  const exempt = isExempt(unitType)

  if (exempt) {
    // Departamento/casa/terreno: siempre exento
    return { impNeto: 0, impIva: 0, impOpEx: amount, impTotal: amount }
  }

  if (cbteTipo === 1) {
    // Factura A + local: discrimina IVA
    const impIva = Math.round(amount * VAT_RATE * 100) / 100
    return { impNeto: amount, impIva, impOpEx: 0, impTotal: amount + impIva }
  }

  // Factura B + local: IVA incluido en el monto, se extrae para AFIP
  const impNeto = Math.round((amount / (1 + VAT_RATE)) * 100) / 100
  const impIva = Math.round((amount - impNeto) * 100) / 100
  return { impNeto, impIva, impOpEx: 0, impTotal: amount }
}

export function buildVoucherData(params: BuildVoucherParams) {
  const { amount, taxCondition, unitType, cuitDni, periodMonth, periodYear, puntoVenta, cbteNro } = params
  const { cbteTipo } = resolveInvoiceType(taxCondition)
  const condicionIvaReceptorId = getCondicionIvaReceptorId(taxCondition)
  const { docTipo, docNro } = resolveDocType(taxCondition, cuitDni)
  const { impNeto, impIva, impOpEx, impTotal } = calculateInvoiceAmounts(amount, taxCondition, unitType)
  const { desde, hasta } = getServicePeriodDates(periodMonth, periodYear)

  const date = getArgentinaCalendarDateISO()
  const cbteFch = parseInt(date.replace(/-/g, ''))

  const data: Record<string, unknown> = {
    CantReg: 1,
    PtoVta: puntoVenta,
    CbteTipo: cbteTipo,
    Concepto: 2, // Servicios
    DocTipo: docTipo,
    DocNro: parseInt(docNro) || 0,
    CbteDesde: cbteNro,
    CbteHasta: cbteNro,
    CbteFch: cbteFch,
    ImpTotal: impTotal,
    ImpTotConc: Math.round((impTotal - impNeto - impOpEx - impIva) * 100) / 100,
    ImpNeto: impNeto,
    ImpOpEx: impOpEx,
    ImpTrib: 0,
    ImpIVA: impIva,
    FchServDesde: parseInt(desde),
    FchServHasta: parseInt(hasta),
    FchVtoPago: cbteFch,
    MonId: 'PES',
    MonCotiz: 1,
    CondicionIVAReceptorId: condicionIvaReceptorId,
  }

  // Agregar array de IVA solo cuando hay IVA discriminado (Factura A gravada)
  if (impIva > 0) {
    data.Iva = [
      {
        Id: VAT_AFIP_ID,
        BaseImp: impNeto,
        Importe: impIva,
      },
    ]
  }


  return {
    data,
    cbteFch: date.replace(/-/g, ''),
    fchServDesde: desde,
    fchServHasta: hasta,
    amounts: { impNeto, impIva, impOpEx, impTotal },
    docTipo,
    docNro,
    condicionIvaReceptorId,
    cbteTipo,
  }
}

// --- Error parsing ---

interface AfipErrorWithResponse {
  response?: { data?: unknown }
  message?: string
}

export function getAfipErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const err = error as AfipErrorWithResponse
    // Log full error for debugging
    console.error('AFIP error full object:', JSON.stringify(error, Object.getOwnPropertyNames(error as object), 2))
    if (err.response?.data) return JSON.stringify(err.response.data, null, 2)
    if (typeof err.message === 'string') return err.message
  }
  return 'Error desconocido en AFIP'
}

// --- Template helpers ---

export function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '')
}
