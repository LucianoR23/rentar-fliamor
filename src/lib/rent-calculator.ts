import type { UnitType } from '@/types'

// ── Rent update ──────────────────────────────────────────────────────────────

export interface RentUpdateInput {
  currentPrice: number
  updateType: 'icl' | 'ipc' | 'fixed_amount' | 'fixed_percentage'
  /** For fixed_amount: absolute pesos to add. For fixed_percentage: percent. */
  updateValue?: number
  /** For icl/ipc: the index variation in percent (e.g. 12.5 = 12.5%). */
  indexValue?: number
}

export interface RentUpdateResult {
  newPrice: number
  difference: number
  percentageChange: number
}

export function calculateRentUpdate(input: RentUpdateInput): RentUpdateResult {
  const { currentPrice, updateType, updateValue = 0, indexValue = 0 } = input

  let newPrice: number
  switch (updateType) {
    case 'fixed_amount':
      newPrice = currentPrice + updateValue
      break
    case 'fixed_percentage':
      newPrice = currentPrice * (1 + updateValue / 100)
      break
    case 'icl':
    case 'ipc':
      newPrice = currentPrice * (1 + indexValue / 100)
      break
    default:
      newPrice = currentPrice
  }

  newPrice = Math.round(newPrice * 100) / 100

  return {
    newPrice,
    difference: Math.round((newPrice - currentPrice) * 100) / 100,
    percentageChange:
      currentPrice > 0
        ? Math.round(((newPrice - currentPrice) / currentPrice) * 10000) / 100
        : 0,
  }
}

// ── Group expense distribution ────────────────────────────────────────────────

export interface DistributionUnit {
  id: string
  identifier: string
  type: UnitType
}

export interface DistributionConfig {
  unitType: UnitType
  percentage: number
}

export interface DistributionResult {
  unitId: string
  unitIdentifier: string
  type: UnitType
  percentage: number
  amount: number
}

/**
 * Distributes a total expense amount across units according to their type's
 * configured percentage. Units whose type has no config entry receive 0%.
 */
export function calculateGroupExpenseDistribution(
  totalAmount: number,
  units: DistributionUnit[],
  costConfig: DistributionConfig[]
): DistributionResult[] {
  const configMap = new Map(costConfig.map((c) => [c.unitType, c.percentage]))

  return units.map((unit) => {
    const percentage = configMap.get(unit.type) ?? 0
    const amount = Math.round((totalAmount * percentage) / 100 * 100) / 100
    return {
      unitId: unit.id,
      unitIdentifier: unit.identifier,
      type: unit.type,
      percentage,
      amount,
    }
  })
}
