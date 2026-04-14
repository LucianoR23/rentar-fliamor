import {
  pgTable,
  uuid,
  varchar,
  text,
  decimal,
  smallint,
  date,
  timestamp,
  pgEnum,
  integer,
  boolean,
  bigint,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const roleEnum = pgEnum('role', ['superadmin', 'admin', 'viewer', 'user'])
export const unitTypeEnum = pgEnum('unit_type', ['apartment', 'local', 'land', 'house', 'other'])
export const updateTypeEnum = pgEnum('update_type', ['icl', 'ipc', 'fixed_amount', 'fixed_percentage'])
export const contractStatusEnum = pgEnum('contract_status', ['active', 'expired', 'terminated'])
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'paid', 'partial', 'overdue', 'cancelled'])
export const paymentLineTypeEnum = pgEnum('payment_line_type', ['rent', 'vat', 'group_expense', 'manual_charge'])
export const fileEntityEnum = pgEnum('file_entity', ['unit', 'contract', 'expense', 'group_expense', 'material', 'repair'])
export const unitOfMeasureEnum = pgEnum('unit_of_measure', ['unit', 'meter', 'kilogram', 'liter'])
export const stockChangeReasonEnum = pgEnum('stock_change_reason', ['manual_edit', 'repair_usage', 'initial'])
export const taxConditionEnum = pgEnum('tax_condition', ['monotributista', 'responsable_inscripto', 'consumidor_final', 'exento'])
export const invoiceTypeEnum = pgEnum('invoice_type', ['A', 'B'])

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  role: roleEnum('role').default('viewer').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  emailVerified: boolean('email_verified').default(false),
  image: text('image'),
  banned: boolean('banned').default(false),
  bannedReason: text('banned_reason'),
  banExpires: bigint('ban_expires', { mode: 'number' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const accounts = pgTable('accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  accountId: varchar('account_id', { length: 255 }).notNull(),
  providerId: varchar('provider_id', { length: 255 }).notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  idToken: text('id_token'),
  password: text('password'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const verifications = pgTable('verifications', {
  id: text('id').primaryKey(),
  identifier: varchar('identifier', { length: 255 }).notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }).notNull(),
  cuitDni: varchar('cuit_dni', { length: 20 }).notNull(),
  phone: varchar('phone', { length: 30 }).notNull(),
  email: varchar('email', { length: 255 }),
  address: text('address'),
  guarantorName: varchar('guarantor_name', { length: 255 }),
  guarantorPhone: varchar('guarantor_phone', { length: 30 }),
  guarantorCuitDni: varchar('guarantor_cuit_dni', { length: 20 }),
  notes: text('notes'),
  taxCondition: taxConditionEnum('tax_condition'),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const groups = pgTable('groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  address: text('address').notNull(),
  description: text('description'),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const groupCostConfig = pgTable('group_cost_config', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id')
    .references(() => groups.id, { onDelete: 'cascade' })
    .notNull(),
  unitType: unitTypeEnum('unit_type').notNull(),
  percentage: decimal('percentage', { precision: 5, scale: 2 }).notNull(),
})

export const units = pgTable('units', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id').references(() => groups.id, { onDelete: 'set null' }),
  type: unitTypeEnum('type').notNull(),
  identifier: varchar('identifier', { length: 100 }).notNull(),
  floor: varchar('floor', { length: 20 }),
  address: text('address'),
  description: text('description'),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const contracts = pgTable('contracts', {
  id: uuid('id').primaryKey().defaultRandom(),
  unitId: uuid('unit_id')
    .references(() => units.id, { onDelete: 'restrict' })
    .notNull(),
  tenantId: uuid('tenant_id')
    .references(() => tenants.id, { onDelete: 'restrict' })
    .notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  updateFrequencyMonths: smallint('update_frequency_months').notNull(),
  updateType: updateTypeEnum('update_type').notNull(),
  updateValue: decimal('update_value', { precision: 10, scale: 4 }),
  firstMonthPrice: decimal('first_month_price', { precision: 12, scale: 2 }).notNull(),
  currentPrice: decimal('current_price', { precision: 12, scale: 2 }).notNull(),
  depositAmount: decimal('deposit_amount', { precision: 12, scale: 2 }),
  appliesVat: boolean('applies_vat').default(false).notNull(),
  vatPercentage: decimal('vat_percentage', { precision: 5, scale: 2 }).default('100.00').notNull(),
  managedSince: date('managed_since'),
  status: contractStatusEnum('status').default('active').notNull(),
  nextUpdateDate: date('next_update_date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const contractUpdates = pgTable('contract_updates', {
  id: uuid('id').primaryKey().defaultRandom(),
  contractId: uuid('contract_id')
    .references(() => contracts.id, { onDelete: 'cascade' })
    .notNull(),
  updateDate: date('update_date').notNull(),
  previousPrice: decimal('previous_price', { precision: 12, scale: 2 }).notNull(),
  newPrice: decimal('new_price', { precision: 12, scale: 2 }).notNull(),
  updateType: updateTypeEnum('update_type').notNull(),
  indexValue: decimal('index_value', { precision: 10, scale: 4 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  contractId: uuid('contract_id')
    .references(() => contracts.id, { onDelete: 'restrict' })
    .notNull(),
  periodMonth: smallint('period_month').notNull(),
  periodYear: smallint('period_year').notNull(),
  baseRent: decimal('base_rent', { precision: 12, scale: 2 }),
  vatAmount: decimal('vat_amount', { precision: 12, scale: 2 }),
  amountDue: decimal('amount_due', { precision: 12, scale: 2 }).notNull(),
  amountPaid: decimal('amount_paid', { precision: 12, scale: 2 }),
  paymentDate: date('payment_date'),
  dueDate: date('due_date').notNull(),
  status: paymentStatusEnum('status').default('pending').notNull(),
  commissionRate: decimal('commission_rate', { precision: 5, scale: 2 }),
  applyCommission: boolean('apply_commission').default(true).notNull(),
  receiptNumber: varchar('receipt_number', { length: 50 }),
  notes: text('notes'),
  cancelledReason: text('cancelled_reason'),
  cancelledAt: timestamp('cancelled_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const settings = pgTable('settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: varchar('key', { length: 100 }).notNull().unique(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const files = pgTable('files', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityType: fileEntityEnum('entity_type').notNull(),
  entityId: uuid('entity_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  r2Key: varchar('r2_key', { length: 500 }).notNull(),
  r2Url: text('r2_url').notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  uploadedBy: varchar('uploaded_by', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const groupExpenses = pgTable('group_expenses', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id')
    .references(() => groups.id, { onDelete: 'cascade' })
    .notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  periodMonth: smallint('period_month').notNull(),
  periodYear: smallint('period_year').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const groupExpenseUnits = pgTable('group_expense_units', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupExpenseId: uuid('group_expense_id')
    .references(() => groupExpenses.id, { onDelete: 'cascade' })
    .notNull(),
  unitId: uuid('unit_id')
    .references(() => units.id, { onDelete: 'cascade' })
    .notNull(),
})

export const expenses = pgTable('expenses', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  category: varchar('category', { length: 100 }),
  expenseDate: date('expense_date').notNull(),
  notes: text('notes'),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const manualCharges = pgTable('manual_charges', {
  id: uuid('id').primaryKey().defaultRandom(),
  unitId: uuid('unit_id')
    .references(() => units.id, { onDelete: 'cascade' })
    .notNull(),
  description: varchar('description', { length: 255 }).notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  periodMonth: smallint('period_month').notNull(),
  periodYear: smallint('period_year').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const paymentLineItems = pgTable('payment_line_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  paymentId: uuid('payment_id')
    .references(() => payments.id, { onDelete: 'cascade' })
    .notNull(),
  type: paymentLineTypeEnum('type').notNull(),
  description: varchar('description', { length: 255 }).notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  groupExpenseId: uuid('group_expense_id')
    .references(() => groupExpenses.id, { onDelete: 'set null' }),
  manualChargeId: uuid('manual_charge_id')
    .references(() => manualCharges.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  contractId: uuid('contract_id')
    .references(() => contracts.id, { onDelete: 'restrict' })
    .notNull(),
  invoiceType: invoiceTypeEnum('invoice_type').notNull(),
  cbteTipo: smallint('cbte_tipo').notNull(),
  puntoVenta: smallint('punto_venta').notNull(),
  cbteNro: integer('cbte_nro').notNull(),
  cae: varchar('cae', { length: 20 }).notNull(),
  caeFchVto: varchar('cae_fch_vto', { length: 10 }).notNull(),
  cbteFch: varchar('cbte_fch', { length: 10 }).notNull(),
  impNeto: decimal('imp_neto', { precision: 12, scale: 2 }).notNull(),
  impIva: decimal('imp_iva', { precision: 12, scale: 2 }).notNull(),
  impOpEx: decimal('imp_op_ex', { precision: 12, scale: 2 }).notNull(),
  impTotal: decimal('imp_total', { precision: 12, scale: 2 }).notNull(),
  docTipo: smallint('doc_tipo').notNull(),
  docNro: varchar('doc_nro', { length: 20 }).notNull(),
  recipientName: varchar('recipient_name', { length: 255 }).notNull(),
  recipientTaxCondition: taxConditionEnum('recipient_tax_condition').notNull(),
  condicionIvaReceptorId: smallint('condicion_iva_receptor_id').notNull(),
  periodMonth: smallint('period_month').notNull(),
  periodYear: smallint('period_year').notNull(),
  fchServDesde: varchar('fch_serv_desde', { length: 10 }).notNull(),
  fchServHasta: varchar('fch_serv_hasta', { length: 10 }).notNull(),
  description: text('description').notNull(),
  paymentMethod: varchar('payment_method', { length: 50 }).default('Contado').notNull(),
  unitType: unitTypeEnum('unit_type').notNull(),
  issuedBy: text('issued_by')
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const invoiceTemplates = pgTable('invoice_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  unitType: unitTypeEnum('unit_type').notNull().unique(),
  template: text('template').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Maintenance tables
export const materials = pgTable('materials', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  stock: integer('stock').notNull(),
  unitOfMeasure: unitOfMeasureEnum('unit_of_measure').notNull(),
  unitCost: decimal('unit_cost', { precision: 12, scale: 2 }),
  observations: text('observations'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const repairs = pgTable('repairs', {
  id: uuid('id').primaryKey().defaultRandom(),
  unitId: uuid('unit_id')
    .references(() => units.id, { onDelete: 'restrict' })
    .notNull(),
  contractId: uuid('contract_id')
    .references(() => contracts.id, { onDelete: 'set null' }),
  description: text('description').notNull(),
  repairDate: date('repair_date').notNull(),
  laborCost: decimal('labor_cost', { precision: 12, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const repairMaterials = pgTable('repair_materials', {
  id: uuid('id').primaryKey().defaultRandom(),
  repairId: uuid('repair_id')
    .references(() => repairs.id, { onDelete: 'cascade' })
    .notNull(),
  materialId: uuid('material_id')
    .references(() => materials.id, { onDelete: 'restrict' })
    .notNull(),
  quantity: integer('quantity').notNull(),
  unitCostSnapshot: decimal('unit_cost_snapshot', { precision: 12, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const stockLogs = pgTable('stock_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  materialId: uuid('material_id')
    .references(() => materials.id, { onDelete: 'cascade' })
    .notNull(),
  previousStock: integer('previous_stock').notNull(),
  newStock: integer('new_stock').notNull(),
  reason: stockChangeReasonEnum('reason').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Relations
export const usersRelations = relations(users, () => ({}))

export const tenantsRelations = relations(tenants, ({ many }) => ({
  contracts: many(contracts),
}))

export const groupsRelations = relations(groups, ({ many }) => ({
  units: many(units),
  costConfig: many(groupCostConfig),
  expenses: many(groupExpenses),
}))

export const groupCostConfigRelations = relations(groupCostConfig, ({ one }) => ({
  group: one(groups, { fields: [groupCostConfig.groupId], references: [groups.id] }),
}))

export const unitsRelations = relations(units, ({ one, many }) => ({
  group: one(groups, { fields: [units.groupId], references: [groups.id] }),
  contracts: many(contracts),
  manualCharges: many(manualCharges),
  repairs: many(repairs),
}))

export const contractsRelations = relations(contracts, ({ one, many }) => ({
  unit: one(units, { fields: [contracts.unitId], references: [units.id] }),
  tenant: one(tenants, { fields: [contracts.tenantId], references: [tenants.id] }),
  payments: many(payments),
  updates: many(contractUpdates),
  invoices: many(invoices),
}))

export const contractUpdatesRelations = relations(contractUpdates, ({ one }) => ({
  contract: one(contracts, { fields: [contractUpdates.contractId], references: [contracts.id] }),
}))

export const paymentsRelations = relations(payments, ({ one, many }) => ({
  contract: one(contracts, { fields: [payments.contractId], references: [contracts.id] }),
  lineItems: many(paymentLineItems),
}))

export const groupExpensesRelations = relations(groupExpenses, ({ one, many }) => ({
  group: one(groups, { fields: [groupExpenses.groupId], references: [groups.id] }),
  scopedUnits: many(groupExpenseUnits),
}))

export const groupExpenseUnitsRelations = relations(groupExpenseUnits, ({ one }) => ({
  groupExpense: one(groupExpenses, { fields: [groupExpenseUnits.groupExpenseId], references: [groupExpenses.id] }),
  unit: one(units, { fields: [groupExpenseUnits.unitId], references: [units.id] }),
}))

export const manualChargesRelations = relations(manualCharges, ({ one }) => ({
  unit: one(units, { fields: [manualCharges.unitId], references: [units.id] }),
}))

export const paymentLineItemsRelations = relations(paymentLineItems, ({ one }) => ({
  payment: one(payments, { fields: [paymentLineItems.paymentId], references: [payments.id] }),
  groupExpense: one(groupExpenses, { fields: [paymentLineItems.groupExpenseId], references: [groupExpenses.id] }),
  manualCharge: one(manualCharges, { fields: [paymentLineItems.manualChargeId], references: [manualCharges.id] }),
}))

export const invoicesRelations = relations(invoices, ({ one }) => ({
  contract: one(contracts, { fields: [invoices.contractId], references: [contracts.id] }),
  issuer: one(users, { fields: [invoices.issuedBy], references: [users.id] }),
}))

export const materialsRelations = relations(materials, ({ many }) => ({
  repairMaterials: many(repairMaterials),
  stockLogs: many(stockLogs),
}))

export const repairsRelations = relations(repairs, ({ one, many }) => ({
  unit: one(units, { fields: [repairs.unitId], references: [units.id] }),
  contract: one(contracts, { fields: [repairs.contractId], references: [contracts.id] }),
  repairMaterials: many(repairMaterials),
}))

export const repairMaterialsRelations = relations(repairMaterials, ({ one }) => ({
  repair: one(repairs, { fields: [repairMaterials.repairId], references: [repairs.id] }),
  material: one(materials, { fields: [repairMaterials.materialId], references: [materials.id] }),
}))

export const stockLogsRelations = relations(stockLogs, ({ one }) => ({
  material: one(materials, { fields: [stockLogs.materialId], references: [materials.id] }),
}))
