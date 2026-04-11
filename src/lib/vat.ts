export const VAT_RATE = 0.21

export interface VatBreakdown {
  /** Precio del alquiler (sin IVA) */
  price: number
  /** Porción del alquiler gravada con IVA */
  vatableBase: number
  /** Monto del IVA */
  vat: number
  /** Total a cobrar (precio + IVA) */
  total: number
}

/**
 * Calcula el desglose de IVA sobre un precio de alquiler.
 *
 * @param price - Precio del alquiler (sin IVA)
 * @param appliesVat - Si el contrato aplica IVA
 * @param vatPercentage - Porcentaje del alquiler sobre el que se calcula IVA (default 100)
 *
 * Ejemplo: price=500000, appliesVat=true, vatPercentage=20
 *   vatableBase = 500000 * 20/100 = 100000
 *   vat = 100000 * 0.21 = 21000
 *   total = 500000 + 21000 = 521000
 */
export function calculateVat(
  price: number,
  appliesVat: boolean,
  vatPercentage: number = 100
): VatBreakdown {
  if (!appliesVat) {
    return { price, vatableBase: 0, vat: 0, total: price }
  }

  const vatableBase = Math.round(price * (vatPercentage / 100) * 100) / 100
  const vat = Math.round(vatableBase * VAT_RATE * 100) / 100
  const total = Math.round((price + vat) * 100) / 100

  return { price, vatableBase, vat, total }
}
