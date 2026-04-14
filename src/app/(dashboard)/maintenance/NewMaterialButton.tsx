'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MaterialFormDialog } from '@/components/maintenance/MaterialFormDialog'

export function NewMaterialButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button size="sm" className="cursor-pointer" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Nuevo material
      </Button>
      <MaterialFormDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
