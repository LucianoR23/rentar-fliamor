import type { InferSelectModel, InferInsertModel } from 'drizzle-orm'
import type {
  users,
  tenants,
  groups,
  groupCostConfig,
  units,
  contracts,
  contractUpdates,
  payments,
  paymentLineItems,
  manualCharges,
  files,
  groupExpenses,
  groupExpenseUnits,
  expenses,
  invoices,
  invoiceTemplates,
  materials,
  repairs,
  repairMaterials,
  stockLogs,
} from '@/lib/schema'

// Select types (lectura)
export type User = InferSelectModel<typeof users>
export type Tenant = InferSelectModel<typeof tenants>
export type Group = InferSelectModel<typeof groups>
export type GroupCostConfig = InferSelectModel<typeof groupCostConfig>
export type Unit = InferSelectModel<typeof units>
export type Contract = InferSelectModel<typeof contracts>
export type ContractUpdate = InferSelectModel<typeof contractUpdates>
export type Payment = InferSelectModel<typeof payments>
export type File = InferSelectModel<typeof files>
export type GroupExpense = InferSelectModel<typeof groupExpenses>
export type GroupExpenseUnit = InferSelectModel<typeof groupExpenseUnits>
export type Expense = InferSelectModel<typeof expenses>
export type PaymentLineItem = InferSelectModel<typeof paymentLineItems>
export type ManualCharge = InferSelectModel<typeof manualCharges>
export type Invoice = InferSelectModel<typeof invoices>
export type InvoiceTemplate = InferSelectModel<typeof invoiceTemplates>
export type Material = InferSelectModel<typeof materials>
export type Repair = InferSelectModel<typeof repairs>
export type RepairMaterial = InferSelectModel<typeof repairMaterials>
export type StockLog = InferSelectModel<typeof stockLogs>

// Insert types (escritura)
export type NewUser = InferInsertModel<typeof users>
export type NewTenant = InferInsertModel<typeof tenants>
export type NewGroup = InferInsertModel<typeof groups>
export type NewGroupCostConfig = InferInsertModel<typeof groupCostConfig>
export type NewUnit = InferInsertModel<typeof units>
export type NewContract = InferInsertModel<typeof contracts>
export type NewContractUpdate = InferInsertModel<typeof contractUpdates>
export type NewPayment = InferInsertModel<typeof payments>
export type NewFile = InferInsertModel<typeof files>
export type NewGroupExpense = InferInsertModel<typeof groupExpenses>
export type NewGroupExpenseUnit = InferInsertModel<typeof groupExpenseUnits>
export type NewExpense = InferInsertModel<typeof expenses>
export type NewPaymentLineItem = InferInsertModel<typeof paymentLineItems>
export type NewManualCharge = InferInsertModel<typeof manualCharges>
export type NewInvoice = InferInsertModel<typeof invoices>
export type NewInvoiceTemplate = InferInsertModel<typeof invoiceTemplates>
export type NewMaterial = InferInsertModel<typeof materials>
export type NewRepair = InferInsertModel<typeof repairs>
export type NewRepairMaterial = InferInsertModel<typeof repairMaterials>
export type NewStockLog = InferInsertModel<typeof stockLogs>

// Enum types
export type UserRole = User['role']
export type UnitType = Unit['type']
export type UpdateType = Contract['updateType']
export type ContractStatus = Contract['status']
export type PaymentStatus = Payment['status']
export type FileEntityType = File['entityType']
export type PaymentLineType = PaymentLineItem['type']
export type TaxCondition = NonNullable<Tenant['taxCondition']>
export type InvoiceType = Invoice['invoiceType']
export type UnitOfMeasure = Material['unitOfMeasure']
export type StockChangeReason = StockLog['reason']

// Tipos con relaciones (para queries con joins)
export type UnitWithGroup = Unit & { group: Group | null }
export type ContractWithRelations = Contract & {
  unit: UnitWithGroup
  tenant: Tenant
}
export type PaymentWithContract = Payment & {
  contract: ContractWithRelations
}
export type GroupWithUnits = Group & {
  units: Unit[]
  costConfig: GroupCostConfig[]
}
export type RepairWithRelations = Repair & {
  unit: Unit
  contract: Contract | null
  repairMaterials: (RepairMaterial & { material: Material })[]
}
