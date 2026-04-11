import { and, eq, inArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  contracts,
  groupCostConfig,
  groupExpenses,
  groupExpenseUnits,
  manualCharges,
  paymentLineItems,
  payments,
  units,
} from '@/lib/schema'
import { calculateVat } from '@/lib/vat'
import { calculateGroupExpenseDistribution } from '@/lib/rent-calculator'
import type { NewPaymentLineItem } from '@/types'

interface ContractForPayment {
  id: string
  unitId: string
  currentPrice: string
  appliesVat: boolean
  vatPercentage: string
  managedSince: string | null
  startDate: string
}

interface UnitForPayment {
  id: string
  identifier: string
  type: 'apartment' | 'local' | 'land' | 'house' | 'other'
  groupId: string | null
}

/**
 * Generates a payment with all line items (rent, VAT, group expenses, manual charges).
 * Only call this when a payment doesn't exist yet for the contract+period.
 */
export async function generatePaymentWithLineItems(
  contract: ContractForPayment,
  unit: UnitForPayment,
  month: number,
  year: number,
): Promise<string> {
  const price = Number(contract.currentPrice)
  const vat = calculateVat(price, contract.appliesVat, Number(contract.vatPercentage))

  // Collect line items
  const lines: Omit<NewPaymentLineItem, 'paymentId'>[] = []

  // 1. Rent
  lines.push({ type: 'rent', description: 'Alquiler', amount: String(price) })

  // 2. VAT
  if (vat.vat > 0) {
    lines.push({ type: 'vat', description: `IVA 21% (sobre ${contract.vatPercentage}%)`, amount: String(vat.vat) })
  }

  // 3. Group expenses
  if (unit.groupId) {
    const groupExpenseLines = await getGroupExpenseLinesForUnit(unit, month, year)
    lines.push(...groupExpenseLines)
  }

  // 4. Manual charges
  const chargeRows = await db
    .select()
    .from(manualCharges)
    .where(
      and(
        eq(manualCharges.unitId, unit.id),
        eq(manualCharges.periodMonth, month),
        eq(manualCharges.periodYear, year),
      ),
    )
  for (const charge of chargeRows) {
    lines.push({
      type: 'manual_charge',
      description: charge.description,
      amount: charge.amount,
      manualChargeId: charge.id,
    })
  }

  // Calculate total
  const total = lines.reduce((sum, l) => sum + Number(l.amount), 0)
  const dueDate = `${year}-${String(month).padStart(2, '0')}-05`

  // Insert payment
  const [payment] = await db
    .insert(payments)
    .values({
      contractId: contract.id,
      periodMonth: month,
      periodYear: year,
      baseRent: String(price),
      vatAmount: String(vat.vat),
      amountDue: String(Math.round(total * 100) / 100),
      dueDate,
      status: 'pending',
    })
    .returning()

  // Insert line items
  if (lines.length > 0) {
    await db.insert(paymentLineItems).values(
      lines.map((l) => ({ ...l, paymentId: payment.id })),
    )
  }

  return payment.id
}

/**
 * Recalculates amountDue and line items for a pending/overdue payment.
 * Only recalculates extras (group expenses + manual charges) — rent and VAT are preserved.
 */
export async function recalculatePaymentTotal(paymentId: string): Promise<void> {
  const payment = await db.query.payments.findFirst({
    where: eq(payments.id, paymentId),
  })
  if (!payment) return
  if (payment.status !== 'pending' && payment.status !== 'overdue') return

  // Get the contract and unit
  const [row] = await db
    .select({ contract: contracts, unit: units })
    .from(contracts)
    .innerJoin(units, eq(contracts.unitId, units.id))
    .where(eq(contracts.id, payment.contractId))
    .limit(1)
  if (!row) return

  // Delete existing extra line items (keep rent + vat)
  await db
    .delete(paymentLineItems)
    .where(
      and(
        eq(paymentLineItems.paymentId, paymentId),
        inArray(paymentLineItems.type, ['group_expense', 'manual_charge']),
      ),
    )

  const newLines: Omit<NewPaymentLineItem, 'paymentId'>[] = []

  // Recalculate group expenses
  if (row.unit.groupId) {
    const groupExpenseLines = await getGroupExpenseLinesForUnit(
      row.unit as UnitForPayment,
      payment.periodMonth,
      payment.periodYear,
    )
    newLines.push(...groupExpenseLines)
  }

  // Recalculate manual charges
  const chargeRows = await db
    .select()
    .from(manualCharges)
    .where(
      and(
        eq(manualCharges.unitId, row.unit.id),
        eq(manualCharges.periodMonth, payment.periodMonth),
        eq(manualCharges.periodYear, payment.periodYear),
      ),
    )
  for (const charge of chargeRows) {
    newLines.push({
      type: 'manual_charge',
      description: charge.description,
      amount: charge.amount,
      manualChargeId: charge.id,
    })
  }

  // Insert new extra line items
  if (newLines.length > 0) {
    await db.insert(paymentLineItems).values(
      newLines.map((l) => ({ ...l, paymentId })),
    )
  }

  // Recalculate total from all line items
  const allLines = await db
    .select()
    .from(paymentLineItems)
    .where(eq(paymentLineItems.paymentId, paymentId))

  const total = allLines.reduce((sum, l) => sum + Number(l.amount), 0)
  await db
    .update(payments)
    .set({ amountDue: String(Math.round(total * 100) / 100), updatedAt: new Date() })
    .where(eq(payments.id, paymentId))
}

/**
 * Recalculates all pending/overdue payments for a given unit+period.
 * Called when group expenses or manual charges are created/edited/deleted.
 */
export async function recalculatePaymentsForUnit(
  unitId: string,
  month: number,
  year: number,
): Promise<void> {
  const paymentRows = await db
    .select({ id: payments.id })
    .from(payments)
    .innerJoin(contracts, eq(payments.contractId, contracts.id))
    .where(
      and(
        eq(contracts.unitId, unitId),
        eq(payments.periodMonth, month),
        eq(payments.periodYear, year),
        inArray(payments.status, ['pending', 'overdue']),
      ),
    )

  for (const p of paymentRows) {
    await recalculatePaymentTotal(p.id)
  }
}

/**
 * Recalculates all pending/overdue payments affected by a group expense.
 */
export async function recalculatePaymentsForGroupExpense(
  groupExpenseId: string,
  groupId: string,
  month: number,
  year: number,
): Promise<void> {
  // Find all units in this group
  const groupUnits = await db
    .select({ id: units.id })
    .from(units)
    .where(eq(units.groupId, groupId))

  // Check if expense is scoped to specific units
  const scopedUnits = await db
    .select({ unitId: groupExpenseUnits.unitId })
    .from(groupExpenseUnits)
    .where(eq(groupExpenseUnits.groupExpenseId, groupExpenseId))

  const affectedUnitIds = scopedUnits.length > 0
    ? scopedUnits.map((u) => u.unitId)
    : groupUnits.map((u) => u.id)

  for (const unitId of affectedUnitIds) {
    await recalculatePaymentsForUnit(unitId, month, year)
  }
}

// --- Internal helpers ---

async function getGroupExpenseLinesForUnit(
  unit: UnitForPayment,
  month: number,
  year: number,
): Promise<Omit<NewPaymentLineItem, 'paymentId'>[]> {
  if (!unit.groupId) return []

  // Get group expenses for this period
  const expenses = await db
    .select()
    .from(groupExpenses)
    .where(
      and(
        eq(groupExpenses.groupId, unit.groupId),
        eq(groupExpenses.periodMonth, month),
        eq(groupExpenses.periodYear, year),
      ),
    )

  if (expenses.length === 0) return []

  // Get cost config for the group
  const costConfig = await db
    .select()
    .from(groupCostConfig)
    .where(eq(groupCostConfig.groupId, unit.groupId))

  // Get all units in the group for distribution calculation
  const groupUnits = await db
    .select({ id: units.id, identifier: units.identifier, type: units.type })
    .from(units)
    .where(eq(units.groupId, unit.groupId))

  const lines: Omit<NewPaymentLineItem, 'paymentId'>[] = []

  for (const expense of expenses) {
    // Check if this expense is scoped to specific units
    const scoped = await db
      .select({ unitId: groupExpenseUnits.unitId })
      .from(groupExpenseUnits)
      .where(eq(groupExpenseUnits.groupExpenseId, expense.id))

    const applicableUnits = scoped.length > 0
      ? groupUnits.filter((u) => scoped.some((s) => s.unitId === u.id))
      : groupUnits

    // Check if this unit is in the applicable list
    if (!applicableUnits.some((u) => u.id === unit.id)) continue

    // Calculate distribution
    const config = costConfig.map((c) => ({
      unitType: c.unitType,
      percentage: Number(c.percentage),
    }))
    const distribution = calculateGroupExpenseDistribution(
      Number(expense.amount),
      applicableUnits,
      config,
    )

    const unitShare = distribution.find((d) => d.unitId === unit.id)
    if (unitShare && unitShare.amount > 0) {
      lines.push({
        type: 'group_expense',
        description: expense.name,
        amount: String(unitShare.amount),
        groupExpenseId: expense.id,
      })
    }
  }

  return lines
}
