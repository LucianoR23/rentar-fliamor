import React from 'react'
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer'

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const TYPE_LABEL: Record<string, string> = {
  apartment: 'Departamento', local: 'Local', land: 'Terreno', house: 'Casa', other: 'Otro',
}
const STATUS_LABEL: Record<string, string> = {
  paid: 'Pagado', pending: 'Pendiente', partial: 'Parcial', overdue: 'Vencido', cancelled: 'Cancelado',
}

export interface CompleteReportData {
  period: { month: number; year: number }
  commissionRate: number
  summary: { totalUnits: number; occupiedUnits: number; activeContracts: number; totalDue: number; totalPaid: number; totalVat: number; totalCommission: number; totalNet: number }
  unitsByType: Array<{ type: string; total: number; occupied: number }>
  activeContracts: Array<{ unit: string; tenant: string; currentPrice: string; nextUpdateDate: string; endDate: string }>
  monthPayments: Array<{ unit: string; tenant: string; amountDue: string; amountPaid: string | null; vatAmount: number; commissionAmount: number; netAmount: number | null; status: string }>
  groupExpenses: Array<{ groupName: string; name: string; amount: string }>
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
  brandSub: { fontSize: 8, color: '#71717A', marginTop: 2 },
  reportTitle: { fontSize: 13, fontFamily: 'Helvetica-Bold', textAlign: 'right', letterSpacing: 0.5 },
  reportSub: { fontSize: 9, color: '#71717A', textAlign: 'right', marginTop: 3 },
  summaryRow: { flexDirection: 'row', marginBottom: 18 },
  summaryBox: { flex: 1, borderRadius: 4, paddingVertical: 8, paddingHorizontal: 9, marginRight: 5, backgroundColor: '#F5F0FF' },
  summaryLabel: { fontSize: 6.5, color: '#71717A', marginBottom: 3, letterSpacing: 0.6 },
  summaryValue: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#7C3AED' },
  sectionTitle: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#7C3AED', letterSpacing: 1.2, marginBottom: 5, marginTop: 14, paddingBottom: 3, borderBottomWidth: 0.5, borderBottomColor: '#E4E4E7' },
  tHead: { flexDirection: 'row', backgroundColor: '#F5F0FF', paddingVertical: 5, paddingHorizontal: 6, borderRadius: 3, marginBottom: 1 },
  tRow: { flexDirection: 'row', paddingVertical: 4, paddingHorizontal: 6, borderBottomWidth: 0.3, borderBottomColor: '#E4E4E7' },
  tRowAlt: { flexDirection: 'row', paddingVertical: 4, paddingHorizontal: 6, borderBottomWidth: 0.3, borderBottomColor: '#E4E4E7', backgroundColor: '#FAFAFA' },
  th: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#7C3AED' },
  td: { fontSize: 8, color: '#1a1a1a' },
  tdSub: { fontSize: 7, color: '#71717A' },
  footer: { position: 'absolute', bottom: 28, left: 52, right: 52, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 0.5, borderTopColor: '#E4E4E7', paddingTop: 7 },
  footerText: { fontSize: 7, color: '#A1A1AA' },
})

function CompleteDoc({ data }: { data: CompleteReportData }) {
  const period = `${MONTHS[data.period.month - 1]} ${data.period.year}`
  const hasComm = data.commissionRate > 0
  const occPct = data.summary.totalUnits > 0
    ? Math.round((data.summary.occupiedUnits / data.summary.totalUnits) * 100)
    : 0

  return (
    <Document title={`Reporte Completo — ${period}`} author="RentAR">
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View>
            <Text style={s.brandName}>RentAR</Text>
            <Text style={s.brandSub}>Sistema de Gestión de Alquileres</Text>
          </View>
          <View>
            <Text style={s.reportTitle}>REPORTE COMPLETO</Text>
            <Text style={s.reportSub}>{period}</Text>
          </View>
        </View>

        {/* Summary */}
        <View style={s.summaryRow}>
          <View style={s.summaryBox}>
            <Text style={s.summaryLabel}>UNIDADES</Text>
            <Text style={s.summaryValue}>{data.summary.totalUnits}</Text>
          </View>
          <View style={{ ...s.summaryBox, backgroundColor: '#F0FDF4' }}>
            <Text style={s.summaryLabel}>OCUPACIÓN</Text>
            <Text style={{ ...s.summaryValue, color: '#10B981' }}>{occPct}%</Text>
          </View>
          <View style={s.summaryBox}>
            <Text style={s.summaryLabel}>CONTRATOS ACTIVOS</Text>
            <Text style={s.summaryValue}>{data.summary.activeContracts}</Text>
          </View>
          <View style={s.summaryBox}>
            <Text style={s.summaryLabel}>PROYECTADO</Text>
            <Text style={s.summaryValue}>{ars(data.summary.totalDue)}</Text>
          </View>
          <View style={{ ...s.summaryBox, backgroundColor: '#F0FDF4' }}>
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
          {data.summary.totalVat > 0 && (
            <View style={{ ...s.summaryBox, marginRight: 0 }}>
              <Text style={s.summaryLabel}>IVA</Text>
              <Text style={{ ...s.summaryValue, color: '#71717A' }}>{ars(data.summary.totalVat)}</Text>
            </View>
          )}
        </View>

        {/* Units by type */}
        <Text style={s.sectionTitle}>UNIDADES POR TIPO</Text>
        <View style={s.tHead}>
          <Text style={{ ...s.th, flex: 1 }}>Tipo</Text>
          <Text style={{ ...s.th, width: 60, textAlign: 'right' }}>Total</Text>
          <Text style={{ ...s.th, width: 60, textAlign: 'right' }}>Ocupadas</Text>
          <Text style={{ ...s.th, width: 60, textAlign: 'right' }}>Disponibles</Text>
        </View>
        {data.unitsByType.map((row, i) => (
          <View key={i} style={i % 2 === 0 ? s.tRow : s.tRowAlt} wrap={false}>
            <Text style={{ ...s.td, flex: 1 }}>{TYPE_LABEL[row.type] ?? row.type}</Text>
            <Text style={{ ...s.td, width: 60, textAlign: 'right' }}>{row.total}</Text>
            <Text style={{ ...s.td, width: 60, textAlign: 'right' }}>{row.occupied}</Text>
            <Text style={{ ...s.td, width: 60, textAlign: 'right' }}>{row.total - row.occupied}</Text>
          </View>
        ))}

        {/* Active contracts */}
        <Text style={s.sectionTitle}>CONTRATOS ACTIVOS</Text>
        <View style={s.tHead}>
          <Text style={{ ...s.th, width: 62 }}>Unidad</Text>
          <Text style={{ ...s.th, width: 120 }}>Inquilino</Text>
          <Text style={{ ...s.th, width: 80, textAlign: 'right' }}>Precio actual</Text>
          <Text style={{ ...s.th, width: 62 }}>Próx. actualiz.</Text>
          <Text style={{ ...s.th, width: 62 }}>Vencimiento</Text>
        </View>
        {data.activeContracts.length === 0 ? (
          <Text style={{ fontSize: 8, color: '#71717A', paddingLeft: 6, paddingTop: 8 }}>Sin contratos activos.</Text>
        ) : data.activeContracts.map((row, i) => (
          <View key={i} style={i % 2 === 0 ? s.tRow : s.tRowAlt} wrap={false}>
            <Text style={{ ...s.td, width: 62 }}>{row.unit}</Text>
            <Text style={{ ...s.td, width: 120 }}>{row.tenant}</Text>
            <Text style={{ ...s.td, width: 80, textAlign: 'right' }}>{ars(row.currentPrice)}</Text>
            <Text style={{ ...s.tdSub, width: 62 }}>{fmtDate(row.nextUpdateDate)}</Text>
            <Text style={{ ...s.tdSub, width: 62 }}>{fmtDate(row.endDate)}</Text>
          </View>
        ))}

        {/* Monthly payments */}
        <Text style={s.sectionTitle}>PAGOS DEL PERÍODO — {period}</Text>
        <View style={s.tHead}>
          <Text style={{ ...s.th, width: hasComm ? 50 : 60 }}>Unidad</Text>
          <Text style={{ ...s.th, width: hasComm ? 80 : 110 }}>Inquilino</Text>
          <Text style={{ ...s.th, width: hasComm ? 58 : 70, textAlign: 'right' }}>Alquiler</Text>
          <Text style={{ ...s.th, width: hasComm ? 44 : 52, textAlign: 'right' }}>IVA</Text>
          <Text style={{ ...s.th, width: hasComm ? 58 : 70, textAlign: 'right' }}>Cobrado</Text>
          {hasComm && <Text style={{ ...s.th, width: 44, textAlign: 'right' }}>Comisión</Text>}
          {hasComm && <Text style={{ ...s.th, width: 56, textAlign: 'right' }}>Neto</Text>}
          <Text style={{ ...s.th, flex: 1 }}>Estado</Text>
        </View>
        {data.monthPayments.length === 0 ? (
          <Text style={{ fontSize: 8, color: '#71717A', paddingLeft: 6, paddingTop: 8 }}>Sin pagos registrados para el período.</Text>
        ) : data.monthPayments.map((row, i) => (
          <View key={i} style={i % 2 === 0 ? s.tRow : s.tRowAlt} wrap={false}>
            <Text style={{ ...s.td, width: hasComm ? 50 : 60 }}>{row.unit}</Text>
            <Text style={{ ...s.td, width: hasComm ? 80 : 110 }}>{row.tenant}</Text>
            <Text style={{ ...s.td, width: hasComm ? 58 : 70, textAlign: 'right' }}>{ars(row.amountDue)}</Text>
            <Text style={{ ...s.tdSub, width: hasComm ? 44 : 52, textAlign: 'right' }}>{row.vatAmount > 0 ? ars(row.vatAmount) : '—'}</Text>
            <Text style={{ ...s.td, width: hasComm ? 58 : 70, textAlign: 'right' }}>{ars(row.amountPaid)}</Text>
            {hasComm && <Text style={{ ...s.tdSub, width: 44, textAlign: 'right' }}>{row.commissionAmount > 0 ? ars(row.commissionAmount) : '—'}</Text>}
            {hasComm && <Text style={{ ...s.td, width: 56, textAlign: 'right' }}>{row.netAmount != null ? ars(row.netAmount) : '—'}</Text>}
            <Text style={{ ...s.td, flex: 1 }}>{STATUS_LABEL[row.status] ?? row.status}</Text>
          </View>
        ))}

        {/* Group expenses */}
        {data.groupExpenses.length > 0 && (
          <>
            <Text style={s.sectionTitle}>GASTOS DE GRUPOS — {period}</Text>
            <View style={s.tHead}>
              <Text style={{ ...s.th, width: 130 }}>Grupo</Text>
              <Text style={{ ...s.th, flex: 1 }}>Concepto</Text>
              <Text style={{ ...s.th, width: 90, textAlign: 'right' }}>Monto</Text>
            </View>
            {data.groupExpenses.map((row, i) => (
              <View key={i} style={i % 2 === 0 ? s.tRow : s.tRowAlt} wrap={false}>
                <Text style={{ ...s.tdSub, width: 130 }}>{row.groupName}</Text>
                <Text style={{ ...s.td, flex: 1 }}>{row.name}</Text>
                <Text style={{ ...s.td, width: 90, textAlign: 'right' }}>{ars(row.amount)}</Text>
              </View>
            ))}
          </>
        )}

        <View style={s.footer} fixed>
          <Text style={s.footerText}>RentAR — Sistema de Gestión de Alquileres</Text>
          <Text style={s.footerText}>Generado el {new Date().toLocaleDateString('es-AR')}</Text>
        </View>
      </Page>
    </Document>
  )
}

export async function generateCompleteReport(data: CompleteReportData): Promise<Buffer> {
  const el = React.createElement(CompleteDoc, { data }) as unknown as React.ReactElement<{ title?: string }>
  return renderToBuffer(el)
}
