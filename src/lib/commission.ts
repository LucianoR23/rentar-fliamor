import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { settings } from '@/lib/schema'

// Re-export pure calculation function for convenience in server code
export { calculateCommission, type CommissionBreakdown } from '@/lib/commission-calc'

/**
 * Lee el porcentaje de comisión actual de la tabla settings.
 * Devuelve 0 si no está configurado.
 */
export async function getCommissionRate(): Promise<number> {
  const [row] = await db
    .select({ value: settings.value })
    .from(settings)
    .where(eq(settings.key, 'commission_percentage'))
    .limit(1)
  return row ? Number(row.value) : 0
}
