import React from 'react'
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer'

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

const TYPE_SHORT: Record<string, string> = {
  apartment: 'Depto', local: 'Local', land: 'Terreno', house: 'Casa', other: 'Otro',
}
const STATUS_LABEL: Record<string, string> = {
  paid: 'Pagado', pending: 'Pendiente', partial: 'Parcial', overdue: 'Vencido', cancelled: 'Cancelado',
}

export interface MonthlyReportRow {
  unit: { identifier: string; floor: string | null; type: string }
  tenant: { firstName: string; lastName: string }
  amountDue: string
  amountPaid: string | null
  vatAmount: number
  commissionAmount: number
  netAmount: number | null
  status: string
  paymentDate: string | null
}

export interface MonthlyReportData {
  period: { month: number; year: number }
  rows: MonthlyReportRow[]
  commissionRate: number
  summary: { totalDue: number; totalPaid: number; totalVat: number; totalCommission: number; totalNet: number; paidCount: number; pendingCount: number; overdueCount: number; cancelledCount: number }
}

const ars = (v: string | number | null) =>
  v == null ? '—' : '$ ' + Number(v).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const fmtDate = (d: string | null) => {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

const s = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 9, color: '#1a1a1a', paddingTop: 44, paddingBottom: 60, paddingHorizontal: 52, backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 14, marginBottom: 18, borderBottomWidth: 2, borderBottomColor: '#7C3AED' },
  brandName: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#7C3AED', letterSpacing: 1 },
  brandSub: { fontSize: 8, color: '#71717A', marginTop: 2, letterSpacing: 0.4 },
  reportTitle: { fontSize: 13, fontFamily: 'Helvetica-Bold', textAlign: 'right', letterSpacing: 0.5 },
  reportSub: { fontSize: 9, color: '#71717A', textAlign: 'right', marginTop: 3 },
  summaryRow: { flexDirection: 'row', marginBottom: 16 },
  summaryBox: { flex: 1, borderRadius: 4, paddingVertical: 7, paddingHorizontal: 8, marginRight: 5, backgroundColor: '#F5F0FF' },
  summaryLabel: { fontSize: 6.5, color: '#71717A', marginBottom: 3, letterSpacing: 0.6 },
  summaryValue: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#7C3AED' },
  sectionTitle: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#7C3AED', letterSpacing: 1.2, marginBottom: 5, paddingBottom: 3, borderBottomWidth: 0.5, borderBottomColor: '#E4E4E7' },
  tHead: { flexDirection: 'row', backgroundColor: '#F5F0FF', paddingVertical: 5, paddingHorizontal: 6, borderRadius: 3, marginBottom: 1 },
  tRow: { flexDirection: 'row', paddingVertical: 4, paddingHorizontal: 6, borderBottomWidth: 0.3, borderBottomColor: '#E4E4E7' },
  tRowAlt: { flexDirection: 'row', paddingVertical: 4, paddingHorizontal: 6, borderBottomWidth: 0.3, borderBottomColor: '#E4E4E7', backgroundColor: '#FAFAFA' },
  th: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#7C3AED' },
  td: { fontSize: 8, color: '#1a1a1a' },
  tdSub: { fontSize: 7, color: '#71717A' },
  footer: { position: 'absolute', bottom: 28, left: 52, right: 52, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 0.5, borderTopColor: '#E4E4E7', paddingTop: 7 },
  footerText: { fontSize: 7, color: '#A1A1AA' },
})

function MonthlyDoc({ data }: { data: MonthlyReportData }) {
  const period = `${MONTHS[data.period.month - 1]} ${data.period.year}`
  const hasComm = data.commissionRate > 0
  const W = hasComm
    ? { unit: 50, tenant: 80, amtDue: 56, vat: 44, amtPaid: 56, comm: 44, net: 56, status: 42, date: 42 }
    : { unit: 60, tenant: 100, amtDue: 66, vat: 52, amtPaid: 66, comm: 0, net: 0, status: 50, date: 48 }

  return (
    <Document title={`Reporte Mensual — ${period}`} author="RentAR">
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View>
            <Text style={s.brandName}>RentAR</Text>
            <Text style={s.brandSub}>Sistema de Gestión de Alquileres</Text>
          </View>
          <View>
            <Text style={s.reportTitle}>REPORTE MENSUAL DE PAGOS</Text>
            <Text style={s.reportSub}>{period}</Text>
          </View>
        </View>

        <View style={s.summaryRow}>
          <View style={s.summaryBox}>
            <Text style={s.summaryLabel}>PROYECTADO</Text>
            <Text style={s.summaryValue}>{ars(data.summary.totalDue)}</Text>
          </View>
          <View style={s.summaryBox}>
            <Text style={s.summaryLabel}>COBRADO</Text>
            <Text style={{ ...s.summaryValue, color: '#10B981' }}>{ars(data.summary.totalPaid)}</Text>
          </View>
          {hasComm && (
            <View style={s.summaryBox}>
              <Text style={s.summaryLabel}>COMISIÓN</Text>
              <Text style={{ ...s.summaryValue, color: '#F59E0B' }}>{ars(data.summary.totalCommission)}</Text>
            </View>
          )}
          {hasComm && (
            <View style={{ ...s.summaryBox, backgroundColor: '#F0FDF4' }}>
              <Text style={s.summaryLabel}>NETO</Text>
              <Text style={{ ...s.summaryValue, color: '#10B981' }}>{ars(data.summary.totalNet)}</Text>
            </View>
          )}
          <View style={{ ...s.summaryBox, backgroundColor: '#F0FDF4' }}>
            <Text style={s.summaryLabel}>PAGADOS</Text>
            <Text style={{ ...s.summaryValue, color: '#10B981' }}>{data.summary.paidCount}</Text>
          </View>
          <View style={{ ...s.summaryBox, backgroundColor: '#FFFBEB' }}>
            <Text style={s.summaryLabel}>PENDIENTES</Text>
            <Text style={{ ...s.summaryValue, color: '#F59E0B' }}>{data.summary.pendingCount}</Text>
          </View>
          {data.summary.totalVat > 0 && (
            <View style={s.summaryBox}>
              <Text style={s.summaryLabel}>IVA</Text>
              <Text style={{ ...s.summaryValue, color: '#71717A' }}>{ars(data.summary.totalVat)}</Text>
            </View>
          )}
          <View style={{ ...s.summaryBox, backgroundColor: '#FEF2F2' }}>
            <Text style={s.summaryLabel}>VENCIDOS</Text>
            <Text style={{ ...s.summaryValue, color: '#EF4444' }}>{data.summary.overdueCount}</Text>
          </View>
          {data.summary.cancelledCount > 0 && (
            <View style={{ ...s.summaryBox, backgroundColor: '#F4F4F5', marginRight: 0 }}>
              <Text style={s.summaryLabel}>CANCELADOS</Text>
              <Text style={{ ...s.summaryValue, color: '#71717A' }}>{data.summary.cancelledCount}</Text>
            </View>
          )}
        </View>

        <Text style={s.sectionTitle}>Detalle de pagos del período</Text>

        <View style={s.tHead}>
          <Text style={{ ...s.th, width: W.unit }}>Unidad</Text>
          <Text style={{ ...s.th, width: W.tenant }}>Inquilino</Text>
          <Text style={{ ...s.th, width: W.amtDue, textAlign: 'right' }}>Alquiler</Text>
          <Text style={{ ...s.th, width: W.vat, textAlign: 'right' }}>IVA</Text>
          <Text style={{ ...s.th, width: W.amtPaid, textAlign: 'right' }}>Cobrado</Text>
          {hasComm && <Text style={{ ...s.th, width: W.comm, textAlign: 'right' }}>Comisión</Text>}
          {hasComm && <Text style={{ ...s.th, width: W.net, textAlign: 'right' }}>Neto</Text>}
          <Text style={{ ...s.th, width: W.status }}>Estado</Text>
          <Text style={{ ...s.th, width: W.date }}>Fecha pago</Text>
        </View>

        {data.rows.length === 0 ? (
          <Text style={{ fontSize: 9, color: '#71717A', textAlign: 'center', marginTop: 24 }}>
            No hay pagos registrados para este período.
          </Text>
        ) : data.rows.map((row, i) => (
          <View key={i} style={i % 2 === 0 ? s.tRow : s.tRowAlt} wrap={false}>
            <View style={{ width: W.unit }}>
              <Text style={s.td}>{row.unit.identifier}{row.unit.floor ? ` (${row.unit.floor})` : ''}</Text>
              <Text style={s.tdSub}>{TYPE_SHORT[row.unit.type] ?? row.unit.type}</Text>
            </View>
            <Text style={{ ...s.td, width: W.tenant }}>{row.tenant.lastName}, {row.tenant.firstName}</Text>
            <Text style={{ ...s.td, width: W.amtDue, textAlign: 'right' }}>{ars(row.amountDue)}</Text>
            <Text style={{ ...s.tdSub, width: W.vat, textAlign: 'right' }}>{row.vatAmount > 0 ? ars(row.vatAmount) : '—'}</Text>
            <Text style={{ ...s.td, width: W.amtPaid, textAlign: 'right' }}>{ars(row.amountPaid)}</Text>
            {hasComm && <Text style={{ ...s.tdSub, width: W.comm, textAlign: 'right' }}>{row.commissionAmount > 0 ? ars(row.commissionAmount) : '—'}</Text>}
            {hasComm && <Text style={{ ...s.td, width: W.net, textAlign: 'right' }}>{row.netAmount != null ? ars(row.netAmount) : '—'}</Text>}
            <Text style={{ ...s.td, width: W.status }}>{STATUS_LABEL[row.status] ?? row.status}</Text>
            <Text style={{ ...s.tdSub, width: W.date }}>{fmtDate(row.paymentDate)}</Text>
          </View>
        ))}

        <View style={s.footer} fixed>
          <Text style={s.footerText}>RentAR — Sistema de Gestión de Alquileres</Text>
          <Text style={s.footerText}>Generado el {new Date().toLocaleDateString('es-AR')}</Text>
        </View>
      </Page>
    </Document>
  )
}

export async function generateMonthlyReport(data: MonthlyReportData): Promise<Buffer> {
  const el = React.createElement(MonthlyDoc, { data }) as unknown as React.ReactElement<{ title?: string }>
  return renderToBuffer(el)
}
