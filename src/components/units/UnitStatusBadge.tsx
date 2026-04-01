import { StatusBadge } from '@/components/shared/StatusBadge'

interface UnitStatusBadgeProps {
  hasActiveContract: boolean
}

export function UnitStatusBadge({ hasActiveContract }: UnitStatusBadgeProps) {
  return hasActiveContract ? (
    <StatusBadge variant="success" label="Ocupada" />
  ) : (
    <StatusBadge variant="muted" label="Disponible" />
  )
}
