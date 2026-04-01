import React from 'react'
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer'

export interface ReceiptData {
  receiptNumber: string
  tenant: {
    firstName: string
    lastName: string
    dni: string
  }
  unit: {
    identifier: string
    floor: string | null
  }
  period: {
    month: number
    year: number
  }
  amountDue: string
  amountPaid: string
  paymentDate: string | null
  paymentMethod: string
  notes: string | null
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1a1a1a',
    paddingTop: 44,
    paddingBottom: 60,
    paddingHorizontal: 52,
    backgroundColor: '#ffffff',
  },

  /* ── Header ── */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 14,
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#7C3AED',
  },
  brandName: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: '#7C3AED',
    letterSpacing: 1,
  },
  brandSub: {
    fontSize: 8,
    color: '#71717A',
    marginTop: 2,
    letterSpacing: 0.4,
  },
  receiptTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'right',
    letterSpacing: 0.5,
  },
  receiptNum: {
    fontSize: 9,
    color: '#71717A',
    textAlign: 'right',
    marginTop: 3,
  },

  /* ── Sections ── */
  section: { marginBottom: 14 },
  sectionTitle: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#7C3AED',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E4E4E7',
  },
  row: { flexDirection: 'row', marginBottom: 3.5 },
  label: { width: 130, fontSize: 9, color: '#71717A' },
  value: { flex: 1, fontSize: 9, color: '#1a1a1a' },
  valueBold: { flex: 1, fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#1a1a1a' },

  /* ── Amount box ── */
  amountBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F0FF',
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  amountLabel: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#7C3AED',
  },
  amountValue: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#7C3AED',
  },

  /* ── Notes ── */
  notesBox: {
    backgroundColor: '#F8F8F8',
    borderRadius: 4,
    padding: 8,
    marginBottom: 14,
  },
  notesText: { fontSize: 9, color: '#52525B', lineHeight: 1.5 },

  /* ── Signature ── */
  sigRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 36,
  },
  sigBlock: { width: '42%', alignItems: 'center' },
  sigLine: {
    borderTopWidth: 0.8,
    borderTopColor: '#27272A',
    width: '100%',
    marginBottom: 5,
  },
  sigLabel: { fontSize: 8, color: '#71717A', textAlign: 'center', marginBottom: 1 },

  /* ── Footer ── */
  footer: {
    position: 'absolute',
    bottom: 28,
    left: 52,
    right: 52,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: '#E4E4E7',
    paddingTop: 7,
  },
  footerText: { fontSize: 7, color: '#A1A1AA' },
})

function ars(v: string | number) {
  return '$ ' + Number(v).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(d: string | null) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

function ReceiptDocument({ data }: { data: ReceiptData }) {
  const period = `${MONTHS[data.period.month - 1]} ${data.period.year}`
  const unitLabel = data.unit.floor
    ? `${data.unit.identifier} — Piso ${data.unit.floor}`
    : data.unit.identifier

  return (
    <Document title={`Recibo ${data.receiptNumber}`} author="RentAR">
      <Page size="A4" style={s.page}>

        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.brandName}>RentAR</Text>
            <Text style={s.brandSub}>Sistema de Gestión de Alquileres</Text>
          </View>
          <View>
            <Text style={s.receiptTitle}>RECIBO DE ALQUILER</Text>
            <Text style={s.receiptNum}>N° {data.receiptNumber}</Text>
          </View>
        </View>

        {/* Tenant */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Datos del inquilino</Text>
          <View style={s.row}>
            <Text style={s.label}>Apellido y Nombre:</Text>
            <Text style={s.valueBold}>{data.tenant.lastName}, {data.tenant.firstName}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.label}>DNI:</Text>
            <Text style={s.value}>{data.tenant.dni}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.label}>Unidad:</Text>
            <Text style={s.value}>{unitLabel}</Text>
          </View>
        </View>

        {/* Payment detail */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Detalle del pago</Text>
          <View style={s.row}>
            <Text style={s.label}>Período:</Text>
            <Text style={s.valueBold}>{period}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.label}>Fecha de pago:</Text>
            <Text style={s.value}>{fmtDate(data.paymentDate)}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.label}>Forma de pago:</Text>
            <Text style={s.value}>{data.paymentMethod}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.label}>Alquiler del período:</Text>
            <Text style={s.value}>{ars(data.amountDue)}</Text>
          </View>
        </View>

        {/* Amount highlight */}
        <View style={s.amountBox}>
          <Text style={s.amountLabel}>TOTAL COBRADO</Text>
          <Text style={s.amountValue}>{ars(data.amountPaid)}</Text>
        </View>

        {/* Notes */}
        {data.notes ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Observaciones</Text>
            <View style={s.notesBox}>
              <Text style={s.notesText}>{data.notes}</Text>
            </View>
          </View>
        ) : null}

        {/* Signatures */}
        <View style={s.sigRow}>
          <View style={s.sigBlock}>
            <View style={s.sigLine} />
            <Text style={s.sigLabel}>Firma del arrendador</Text>
            <Text style={s.sigLabel}>Aclaración</Text>
          </View>
          <View style={s.sigBlock}>
            <View style={s.sigLine} />
            <Text style={s.sigLabel}>Firma del inquilino</Text>
            <Text style={s.sigLabel}>Aclaración</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>RentAR — Sistema de Gestión de Alquileres</Text>
          <Text style={s.footerText}>
            Recibo N° {data.receiptNumber} | {new Date().toLocaleDateString('es-AR')}
          </Text>
        </View>
      </Page>
    </Document>
  )
}

export async function generateReceiptPdf(data: ReceiptData): Promise<Buffer> {
  const element = React.createElement(
    ReceiptDocument,
    { data },
  ) as unknown as React.ReactElement<{ title?: string; author?: string }>
  return renderToBuffer(element)
}
