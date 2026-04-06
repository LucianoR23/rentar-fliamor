import { calculateRentUpdate } from './rent-calculator'
import type { Contract } from '@/types'

export interface CalculationPreview {
  contractId: string
  currentPrice: number
  newPrice: number
  difference: number
  percentageChange: number
  updateType: 'icl' | 'ipc' | 'fixed_amount' | 'fixed_percentage'
  periodMonths: number
  indexVariation?: number
  updateValue?: number
  nextUpdateDate: string
  /** Full schedule returned by the Arquiler API (ICL/IPC only) */
  schedule?: ArquilerPeriod[]
}

interface ArquilerPeriod {
  date: string
  value: number
  estimated: boolean
  dif: number
  amount: number
}

interface ArquilerResponse {
  success: boolean
  data: ArquilerPeriod[]
}

export function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr)
  d.setMonth(d.getMonth() + months)
  return d.toISOString().split('T')[0]
}

/**
 * Calls the Arquiler RapidAPI to calculate ICL/IPC rent updates.
 * Returns the full schedule of update periods.
 */
async function fetchArquilerCalculation(
  amount: number,
  date: string,
  months: number,
  rate: 'icl' | 'ipc'
): Promise<ArquilerResponse> {
  const res = await fetch('https://arquilerapi1.p.rapidapi.com/calculate', {
    method: 'POST',
    headers: {
      'x-rapidapi-key': process.env.RAPIDAPI_KEY!,
      'x-rapidapi-host': 'arquilerapi1.p.rapidapi.com',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ amount, date, months, rate }),
  })

  if (!res.ok) {
    throw new Error(`Arquiler API error: ${res.status}`)
  }

  return res.json() as Promise<ArquilerResponse>
}

/**
 * Computes the rent update preview for a contract.
 * For ICL/IPC: uses the Arquiler RapidAPI which does the full calculation.
 * For fixed_amount/fixed_percentage: calculates locally.
 * Does NOT mutate the database.
 */
export async function computeContractUpdate(contract: Contract): Promise<CalculationPreview> {
  const currentPrice = Number(contract.currentPrice)
  const periodMonths = contract.updateFrequencyMonths
  const updateValue = contract.updateValue != null ? Number(contract.updateValue) : undefined

  if (contract.updateType === 'icl' || contract.updateType === 'ipc') {
    const arquiler = await fetchArquilerCalculation(
      Number(contract.firstMonthPrice),
      contract.startDate,
      periodMonths,
      contract.updateType
    )

    if (!arquiler.success || arquiler.data.length < 2) {
      throw new Error('No update data returned from Arquiler API')
    }

    // Find the next update period — the first period after the current nextUpdateDate
    // or fall back to the last calculated period
    const nextPeriod = arquiler.data.find(
      (p) => p.date >= contract.nextUpdateDate
    ) ?? arquiler.data[arquiler.data.length - 1]

    const newPrice = Math.round(nextPeriod.amount * 100) / 100

    return {
      contractId: contract.id,
      currentPrice,
      newPrice,
      difference: Math.round((newPrice - currentPrice) * 100) / 100,
      percentageChange: nextPeriod.dif
        ? Math.round(nextPeriod.dif * 100) / 100
        : currentPrice > 0
          ? Math.round(((newPrice - currentPrice) / currentPrice) * 10000) / 100
          : 0,
      updateType: contract.updateType,
      periodMonths,
      indexVariation: nextPeriod.dif ? Math.round(nextPeriod.dif * 100) / 100 : undefined,
      nextUpdateDate: addMonths(contract.nextUpdateDate, periodMonths),
      schedule: arquiler.data,
    }
  }

  // fixed_amount / fixed_percentage — local calculation
  const result = calculateRentUpdate({
    currentPrice,
    updateType: contract.updateType,
    updateValue,
  })

  return {
    contractId: contract.id,
    currentPrice,
    ...result,
    updateType: contract.updateType,
    periodMonths,
    updateValue,
    nextUpdateDate: addMonths(contract.nextUpdateDate, periodMonths),
  }
}
