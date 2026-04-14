'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RepairFormDialog } from '@/components/maintenance/RepairFormDialog'
import type { Unit, Contract, Material } from '@/types'

interface NewRepairButtonProps {
  units: Pick<Unit, 'id' | 'identifier'>[]
  contracts: Pick<Contract, 'id' | 'unitId' | 'status'>[]
  materials: Material[]
}

export function NewRepairButton({ units, contracts, materials }: NewRepairButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button size="sm" className="cursor-pointer" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Nuevo arreglo
      </Button>
      <RepairFormDialog
        open={open}
        onOpenChange={setOpen}
        units={units}
        contracts={contracts}
        materials={materials}
      />
    </>
  )
}
