'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  // If starts with 0, assume Argentine local → replace with 54
  if (digits.startsWith('0')) return '54' + digits.slice(1)
  // If doesn't start with country code, assume Argentine
  if (!digits.startsWith('54') && digits.length <= 10) return '54' + digits
  return digits
}

interface WhatsAppLinkProps {
  phone: string
  children?: React.ReactNode
  className?: string
}

export function WhatsAppLink({ phone, children, className }: WhatsAppLinkProps) {
  const [open, setOpen] = useState(false)

  function handleConfirm() {
    const normalized = normalizePhone(phone)
    window.open(`https://wa.me/${normalized}`, '_blank')
    setOpen(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className ?? 'text-sm font-medium text-primary hover:underline cursor-pointer'}
      >
        {children ?? phone}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Abrir WhatsApp</DialogTitle>
            <DialogDescription>
              Se abrirá una conversación de WhatsApp con el número {phone}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
