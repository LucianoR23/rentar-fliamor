import { getICL, getIPC, iclVariation, compoundIpc } from './indices'
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
  iclToday?: { value: number; date: string }
  iclBase?: { value: number; date: string }
  ipcVariations?: { date: string; variation: number }[]
  indexVariation?: number
  updateValue?: number
  nextUpdateDate: string
}

export function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr)
  d.setMonth(d.getMonth() + months)
  return d.toISOString().split('T')[0]
}

/**
 * Computes the rent update preview for a contract.
 * Fetches ICL/IPC indices as needed (cached via Redis).
 * Does NOT mutate the database.
 */
export async function computeContractUpdate(contract: Contract): Promise<CalculationPreview> {
  const currentPrice = Number(contract.currentPrice)
  const periodMonths = contract.updateFrequencyMonths
  const updateValue = contract.updateValue != null ? Number(contract.updateValue) : undefined

  if (contract.updateType === 'icl') {
    const baseDate = addMonths(contract.nextUpdateDate, -periodMonths)
    const [iclToday, iclBase] = await Promise.all([getICL(), getICL(baseDate)])
    const indexVariation = iclVariation(iclToday, iclBase)
    const result = calculateRentUpdate({ currentPrice, updateType: 'icl', indexValue: indexVariation })
    return {
      contractId: contract.id,
      currentPrice,
      ...result,
      updateType: 'icl',
      periodMonths,
      iclToday,
      iclBase,
      indexVariation,
      nextUpdateDate: addMonths(contract.nextUpdateDate, periodMonths),
    }
  }

  if (contract.updateType === 'ipc') {
    const allVariations = await getIPC(periodMonths + 1)
    const periodVariations = allVariations.slice(0, periodMonths)
    const indexVariation = compoundIpc(periodVariations)
    const result = calculateRentUpdate({ currentPrice, updateType: 'ipc', indexValue: indexVariation })
    return {
      contractId: contract.id,
      currentPrice,
      ...result,
      updateType: 'ipc',
      periodMonths,
      ipcVariations: periodVariations,
      indexVariation,
      nextUpdateDate: addMonths(contract.nextUpdateDate, periodMonths),
    }
  }

  if (contract.updateType === 'fixed_amount') {
    const result = calculateRentUpdate({ currentPrice, updateType: 'fixed_amount', updateValue })
    return {
      contractId: contract.id,
      currentPrice,
      ...result,
      updateType: 'fixed_amount',
      periodMonths,
      updateValue,
      nextUpdateDate: addMonths(contract.nextUpdateDate, periodMonths),
    }
  }

  // fixed_percentage
  const result = calculateRentUpdate({ currentPrice, updateType: 'fixed_percentage', updateValue })
  return {
    contractId: contract.id,
    currentPrice,
    ...result,
    updateType: 'fixed_percentage',
    periodMonths,
    updateValue,
    nextUpdateDate: addMonths(contract.nextUpdateDate, periodMonths),
  }
}
