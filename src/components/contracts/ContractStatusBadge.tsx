import { StatusBadge } from '@/components/shared/StatusBadge'
import type { ContractStatus } from '@/types'

const CONFIG: Record<ContractStatus, { label: string; variant: 'success' | 'warning' | 'danger' }> = {
  active: { label: 'Activo', variant: 'success' },
  expired: { label: 'Vencido', variant: 'warning' },
  terminated: { label: 'Rescindido', variant: 'danger' },
}

export function ContractStatusBadge({ status }: { status: ContractStatus }) {
  const { label, variant } = CONFIG[status] ?? { label: status, variant: 'danger' }
  return <StatusBadge label={label} variant={variant} />
}
