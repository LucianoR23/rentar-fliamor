'use client'

import { useState } from 'react'
import { useTheme } from 'next-themes'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { HugeiconsIcon } from '@hugeicons/react'
import { Calculator01Icon } from '@hugeicons/core-free-icons'

export function RentCalculatorButton() {
  const [open, setOpen] = useState(false)
  const { resolvedTheme } = useTheme()

  const iframeSrc =
    resolvedTheme === 'dark'
      ? 'https://arquiler.com/mini?theme=dark&backgroundColor=09090B'
      : 'https://arquiler.com/mini?theme=light&backgroundColor=ffffff'

  return (
    <>
      <Button
        variant="default"
        size="icon-lg"
        className="fixed right-6 bottom-6 z-40 size-12 cursor-pointer rounded-full shadow-lg"
        onClick={() => setOpen(true)}
      >
        <HugeiconsIcon icon={Calculator01Icon} className="size-5" strokeWidth={2} />
        <span className="sr-only">Calculadora de alquileres</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-3xl p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>Calculadora de alquileres</DialogTitle>
            <DialogDescription>
              Calculadora de Arquiler para consultas manuales. Los resultados no afectan al sistema.
            </DialogDescription>
          </DialogHeader>
          <iframe
            title="Calculadora de alquileres"
            src={iframeSrc}
            className="h-130 w-full border-0"
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
