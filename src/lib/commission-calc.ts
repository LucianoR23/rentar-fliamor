export interface CommissionBreakdown {
  /** Monto sobre el que se calcula (alquiler base sin IVA) */
  base: number
  /** Monto de la comisión */
  commission: number
  /** Monto neto (base - comisión) */
  net: number
  /** Porcentaje aplicado */
  rate: number
}

/**
 * Calcula la comisión sobre un monto base (alquiler sin IVA).
 *
 * @param base - Monto del alquiler (sin IVA, sin expensas)
 * @param commissionRate - Porcentaje de comisión (ej: 10)
 * @param applyCommission - Si este pago lleva comisión
 */
export function calculateCommission(
  base: number,
  commissionRate: number,
  applyCommission: boolean
): CommissionBreakdown {
  if (!applyCommission || commissionRate <= 0) {
    return { base, commission: 0, net: base, rate: commissionRate }
  }

  const commission = Math.round(base * (commissionRate / 100) * 100) / 100
  const net = Math.round((base - commission) * 100) / 100

  return { base, commission, net, rate: commissionRate }
}
