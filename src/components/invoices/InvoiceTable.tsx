'use client'

import Link from 'next/link'
import { type ColumnDef } from '@tanstack/react-table'
import { Eye, Download } from 'lucide-react'
import { DataTable } from '@/components/shared/DataTable'
import { InvoiceTypeBadge } from './InvoiceTypeBadge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { formatCurrency } from '@/lib/utils'
import type { Invoice, Contract, Unit, Tenant } from '@/types'

export type InvoiceRow = {
  invoice: Invoice
  contract: Contract
  unit: Unit
  tenant: Tenant
}

const MONTHS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
]

function fmtAfipDate(d: string): string {
  if (d.length !== 8) return d
  return `${d.slice(6, 8)}/${d.slice(4, 6)}/${d.slice(0, 4)}`
}

function fmtCompNro(pv: number, nro: number): string {
  return `${String(pv).padStart(5, '0')}-${String(nro).padStart(8, '0')}`
}

export function InvoiceTable({ data }: { data: InvoiceRow[] }) {
  const columns: ColumnDef<InvoiceRow>[] = [
    {
      id: 'fecha',
      header: 'Fecha',
      accessorFn: (row) => row.invoice.cbteFch,
      cell: ({ row }) => (
        <span className="font-mono text-sm text-muted-foreground">
          {fmtAfipDate(row.original.invoice.cbteFch)}
        </span>
      ),
    },
    {
      id: 'tipo',
      header: 'Tipo',
      cell: ({ row }) => <InvoiceTypeBadge type={row.original.invoice.invoiceType} />,
    },
    {
      id: 'numero',
      header: 'Número',
      cell: ({ row }) => (
        <span className="font-mono tabular-nums text-sm">
          {fmtCompNro(row.original.invoice.puntoVenta, row.original.invoice.cbteNro)}
        </span>
      ),
    },
    {
      id: 'inquilino',
      header: 'Inquilino',
      accessorFn: (row) => row.invoice.recipientName,
      cell: ({ row }) => row.original.invoice.recipientName,
    },
    {
      id: 'unidad',
      header: 'Unidad',
      cell: ({ row }) => (
        <span className="font-mono tabular-nums font-medium">
          {row.original.unit.identifier}
        </span>
      ),
    },
    {
      id: 'periodo',
      header: 'Período',
      cell: ({ row }) => {
        const inv = row.original.invoice
        return `${MONTHS[inv.periodMonth - 1]} ${inv.periodYear}`
      },
    },
    {
      id: 'total',
      header: 'Total',
      cell: ({ row }) => (
        <span className="font-mono tabular-nums font-medium">
          {formatCurrency(row.original.invoice.impTotal)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-0.5 justify-end">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" asChild>
                <Link href={`/invoices/${row.original.invoice.id}`}>
                  <Eye className="h-4 w-4" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Ver detalle</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" asChild>
                <a href={`/api/invoices/${row.original.invoice.id}/pdf`} target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4" />
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Descargar PDF</TooltipContent>
          </Tooltip>
        </div>
      ),
    },
  ]

  return <DataTable columns={columns} data={data} searchPlaceholder="Buscar por inquilino, unidad..." />
}
