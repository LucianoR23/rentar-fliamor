'use no memo'

import React from 'react'
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer'

export interface InvoicePdfData {
  invoiceType: 'A' | 'B'
  cbteTipo: number
  puntoVenta: number
  cbteNro: number
  cbteFch: string // YYYYMMDD
  cae: string
  caeFchVto: string // YYYYMMDD
  cuitEmisor: string
  emitterName: string
  emitterAddress: string
  emitterActivityStart: string
  recipientName: string
  recipientCuitDni: string
  recipientTaxCondition: string
  periodMonth: number
  periodYear: number
  fchServDesde: string // YYYYMMDD
  fchServHasta: string // YYYYMMDD
  description: string
  impNeto: number
  impIva: number
  impOpEx: number
  impTotal: number
  exempt: boolean
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const TAX_CONDITION_DISPLAY: Record<string, string> = {
  monotributista: 'Monotributista',
  responsable_inscripto: 'IVA Responsable Inscripto',
  consumidor_final: 'Consumidor Final',
  exento: 'IVA Sujeto Exento',
}

function fmtAfipDate(d: string): string {
  if (d.length !== 8) return d
  return `${d.slice(6, 8)}/${d.slice(4, 6)}/${d.slice(0, 4)}`
}

function ars(v: number): string {
  return '$ ' + v.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function padPv(n: number): string {
  return String(n).padStart(5, '0')
}

function padCbte(n: number): string {
  return String(n).padStart(8, '0')
}

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1a1a1a',
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 48,
    backgroundColor: '#ffffff',
  },

  /* Header */
  header: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
    paddingRight: 20,
  },
  headerCenter: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  headerRight: {
    flex: 1,
    paddingLeft: 20,
    alignItems: 'flex-end',
  },
  letterBox: {
    width: 48,
    height: 48,
    borderWidth: 2,
    borderColor: '#7C3AED',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterText: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    color: '#7C3AED',
  },
  letterCode: {
    fontSize: 7,
    color: '#71717A',
    marginTop: 2,
    textAlign: 'center',
  },
  brandName: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#7C3AED',
    letterSpacing: 0.5,
  },
  emitterInfo: {
    fontSize: 8,
    color: '#52525B',
    marginTop: 2,
    lineHeight: 1.5,
  },
  facturaTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'right',
    marginBottom: 4,
  },
  headerLabel: {
    fontSize: 7.5,
    color: '#71717A',
    textAlign: 'right',
    letterSpacing: 0.3,
  },
  headerValue: {
    fontSize: 9,
    textAlign: 'right',
    marginBottom: 3,
  },
  divider: {
    borderBottomWidth: 2,
    borderBottomColor: '#7C3AED',
    marginBottom: 16,
  },

  /* Recipient */
  recipientBox: {
    backgroundColor: '#F5F0FF',
    borderRadius: 6,
    padding: 12,
    marginBottom: 14,
  },
  recipientRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  recipientLabel: {
    width: 140,
    fontSize: 8,
    color: '#71717A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recipientValue: {
    flex: 1,
    fontSize: 9,
    color: '#1a1a1a',
  },
  recipientValueBold: {
    flex: 1,
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a',
  },

  /* Service period */
  periodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FAFAFA',
    borderRadius: 4,
    padding: 8,
    marginBottom: 14,
  },
  periodItem: {
    alignItems: 'center',
  },
  periodLabel: {
    fontSize: 7,
    color: '#71717A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  periodValue: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },

  /* Detail table */
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
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
    paddingBottom: 4,
    marginBottom: 4,
  },
  thDesc: { flex: 1, fontSize: 7.5, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  thQty: { width: 50, fontSize: 7.5, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', textAlign: 'center' },
  thUnit: { width: 90, fontSize: 7.5, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', textAlign: 'right' },
  thSub: { width: 90, fontSize: 7.5, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', textAlign: 'right' },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    borderBottomWidth: 0.3,
    borderBottomColor: '#E4E4E7',
  },
  tdDesc: { flex: 1, fontSize: 9, color: '#1a1a1a' },
  tdQty: { width: 50, fontSize: 9, textAlign: 'center' },
  tdUnit: { width: 90, fontSize: 9, textAlign: 'right' },
  tdSub: { width: 90, fontSize: 9, fontFamily: 'Helvetica-Bold', textAlign: 'right' },

  /* Totals */
  totalsBox: {
    marginTop: 12,
    marginLeft: 'auto',
    width: 240,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  totalLabel: { fontSize: 9, color: '#52525B' },
  totalValue: { fontSize: 9, textAlign: 'right' },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 2,
    borderTopColor: '#7C3AED',
    marginTop: 4,
  },
  grandTotalLabel: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#7C3AED',
  },
  grandTotalValue: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#7C3AED',
    textAlign: 'right',
  },

  /* CAE footer */
  caeBox: {
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    borderRadius: 6,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  caeLabel: {
    fontSize: 7,
    color: '#71717A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  caeValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginTop: 1,
  },
  caeAfip: {
    fontSize: 14,
    fontFamily: 'Helvetica-BoldOblique',
    color: '#A1A1AA',
  },

  /* Page footer */
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 48,
    right: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: '#E4E4E7',
    paddingTop: 7,
  },
  footerText: { fontSize: 7, color: '#A1A1AA' },
})

function InvoiceDocument({ data }: { data: InvoicePdfData }) {
  const period = `${MONTHS[data.periodMonth - 1]} ${data.periodYear}`
  const compNro = `${padPv(data.puntoVenta)}-${padCbte(data.cbteNro)}`

  // Unit price for the detail line
  const unitPrice = data.exempt ? data.impOpEx : data.impNeto

  return (
    <Document title={`Factura ${data.invoiceType} ${compNro}`} author="RentAR">
      <Page size="A4" style={s.page}>

        {/* Header */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Text style={s.brandName}>{data.emitterName}</Text>
            <Text style={s.emitterInfo}>{data.emitterAddress}</Text>
            <Text style={s.emitterInfo}>CUIT: {data.cuitEmisor}</Text>
            <Text style={s.emitterInfo}>IVA Responsable Inscripto</Text>
            <Text style={s.emitterInfo}>Inicio de Actividades: {data.emitterActivityStart}</Text>
          </View>
          <View style={s.headerCenter}>
            <View style={s.letterBox}>
              <Text style={s.letterText}>{data.invoiceType}</Text>
            </View>
            <Text style={s.letterCode}>COD. {String(data.cbteTipo).padStart(2, '0')}</Text>
          </View>
          <View style={s.headerRight}>
            <Text style={s.facturaTitle}>FACTURA</Text>
            <Text style={s.headerLabel}>PUNTO DE VENTA</Text>
            <Text style={s.headerValue}>{padPv(data.puntoVenta)}</Text>
            <Text style={s.headerLabel}>COMP. NRO</Text>
            <Text style={s.headerValue}>{padCbte(data.cbteNro)}</Text>
            <Text style={s.headerLabel}>FECHA DE EMISIÓN</Text>
            <Text style={s.headerValue}>{fmtAfipDate(data.cbteFch)}</Text>
          </View>
        </View>
        <View style={s.divider} />

        {/* Recipient */}
        <View style={s.recipientBox}>
          <View style={s.recipientRow}>
            <Text style={s.recipientLabel}>Señor(es)</Text>
            <Text style={s.recipientValueBold}>{data.recipientName}</Text>
          </View>
          <View style={s.recipientRow}>
            <Text style={s.recipientLabel}>CUIT/CUIL/DNI</Text>
            <Text style={s.recipientValue}>{data.recipientCuitDni}</Text>
          </View>
          <View style={s.recipientRow}>
            <Text style={s.recipientLabel}>Condición frente al IVA</Text>
            <Text style={s.recipientValue}>{TAX_CONDITION_DISPLAY[data.recipientTaxCondition] ?? data.recipientTaxCondition}</Text>
          </View>
          <View style={s.recipientRow}>
            <Text style={s.recipientLabel}>Condición de venta</Text>
            <Text style={s.recipientValue}>Cuenta Corriente</Text>
          </View>
        </View>

        {/* Service period */}
        <View style={s.periodRow}>
          <View style={s.periodItem}>
            <Text style={s.periodLabel}>Período facturado</Text>
            <Text style={s.periodValue}>{period}</Text>
          </View>
          <View style={s.periodItem}>
            <Text style={s.periodLabel}>Desde</Text>
            <Text style={s.periodValue}>{fmtAfipDate(data.fchServDesde)}</Text>
          </View>
          <View style={s.periodItem}>
            <Text style={s.periodLabel}>Hasta</Text>
            <Text style={s.periodValue}>{fmtAfipDate(data.fchServHasta)}</Text>
          </View>
        </View>

        {/* Detail table */}
        <Text style={s.sectionTitle}>Detalle</Text>
        <View style={s.tableHeader}>
          <Text style={s.thDesc}>Descripción</Text>
          <Text style={s.thQty}>Cant.</Text>
          <Text style={s.thUnit}>Precio Unit.</Text>
          <Text style={s.thSub}>Subtotal</Text>
        </View>
        <View style={s.tableRow}>
          <Text style={s.tdDesc}>{data.description}</Text>
          <Text style={s.tdQty}>1</Text>
          <Text style={s.tdUnit}>{ars(unitPrice)}</Text>
          <Text style={s.tdSub}>{ars(unitPrice)}</Text>
        </View>

        {/* Totals */}
        <View style={s.totalsBox}>
          {data.impNeto > 0 && (
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Subtotal Neto</Text>
              <Text style={s.totalValue}>{ars(data.impNeto)}</Text>
            </View>
          )}
          {data.impIva > 0 && (
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>IVA 21%</Text>
              <Text style={s.totalValue}>{ars(data.impIva)}</Text>
            </View>
          )}
          {data.impOpEx > 0 && (
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Op. Exentas</Text>
              <Text style={s.totalValue}>{ars(data.impOpEx)}</Text>
            </View>
          )}
          <View style={s.grandTotalRow}>
            <Text style={s.grandTotalLabel}>TOTAL</Text>
            <Text style={s.grandTotalValue}>{ars(data.impTotal)}</Text>
          </View>
        </View>

        {/* CAE */}
        <View style={s.caeBox}>
          <Text style={s.caeAfip}>AFIP</Text>
          <View>
            <Text style={s.caeLabel}>CAE</Text>
            <Text style={s.caeValue}>{data.cae}</Text>
          </View>
          <View>
            <Text style={s.caeLabel}>Vto. CAE</Text>
            <Text style={s.caeValue}>{fmtAfipDate(data.caeFchVto)}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>Comprobante emitido por RentAR</Text>
          <Text style={s.footerText}>
            Factura {data.invoiceType} {compNro}
          </Text>
        </View>
      </Page>
    </Document>
  )
}

export async function generateInvoicePdf(data: InvoicePdfData): Promise<Buffer> {
  const element = React.createElement(
    InvoiceDocument,
    { data },
  ) as unknown as React.ReactElement<{ title?: string; author?: string }>
  return renderToBuffer(element)
}
