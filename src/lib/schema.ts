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
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const roleEnum = pgEnum('role', ['superadmin', 'viewer'])
export const unitTypeEnum = pgEnum('unit_type', ['apartment', 'local', 'land', 'house', 'other'])
export const updateTypeEnum = pgEnum('update_type', ['icl', 'ipc', 'fixed_amount', 'fixed_percentage'])
export const contractStatusEnum = pgEnum('contract_status', ['active', 'expired', 'terminated'])
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'paid', 'partial', 'overdue'])
export const fileEntityEnum = pgEnum('file_entity', ['unit', 'contract', 'expense', 'group_expense'])

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  supabaseId: uuid('supabase_id').unique().notNull(),
  role: roleEnum('role').default('viewer').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }).notNull(),
  dni: varchar('dni', { length: 20 }).notNull(),
  phone: varchar('phone', { length: 30 }).notNull(),
  email: varchar('email', { length: 255 }),
  address: text('address'),
  guarantorName: varchar('guarantor_name', { length: 255 }),
  guarantorPhone: varchar('guarantor_phone', { length: 30 }),
  guarantorDni: varchar('guarantor_dni', { length: 20 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const groups = pgTable('groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  address: text('address').notNull(),
  description: text('description'),
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
  description: text('description'),
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
  amountDue: decimal('amount_due', { precision: 12, scale: 2 }).notNull(),
  amountPaid: decimal('amount_paid', { precision: 12, scale: 2 }),
  paymentDate: date('payment_date'),
  dueDate: date('due_date').notNull(),
  status: paymentStatusEnum('status').default('pending').notNull(),
  receiptNumber: varchar('receipt_number', { length: 50 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
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
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
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
}))

export const contractsRelations = relations(contracts, ({ one, many }) => ({
  unit: one(units, { fields: [contracts.unitId], references: [units.id] }),
  tenant: one(tenants, { fields: [contracts.tenantId], references: [tenants.id] }),
  payments: many(payments),
  updates: many(contractUpdates),
}))

export const contractUpdatesRelations = relations(contractUpdates, ({ one }) => ({
  contract: one(contracts, { fields: [contractUpdates.contractId], references: [contracts.id] }),
}))

export const paymentsRelations = relations(payments, ({ one }) => ({
  contract: one(contracts, { fields: [payments.contractId], references: [contracts.id] }),
}))

export const groupExpensesRelations = relations(groupExpenses, ({ one, many }) => ({
  group: one(groups, { fields: [groupExpenses.groupId], references: [groups.id] }),
  scopedUnits: many(groupExpenseUnits),
}))

export const groupExpenseUnitsRelations = relations(groupExpenseUnits, ({ one }) => ({
  groupExpense: one(groupExpenses, { fields: [groupExpenseUnits.groupExpenseId], references: [groupExpenses.id] }),
  unit: one(units, { fields: [groupExpenseUnits.unitId], references: [units.id] }),
}))
