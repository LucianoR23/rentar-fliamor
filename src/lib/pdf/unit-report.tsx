import React from 'react'
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer'

const MONTHS_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

const TYPE_LABEL: Record<string, string> = {
  apartment: 'Departamento', local: 'Local', land: 'Terreno', house: 'Casa', other: 'Otro',
}
const STATUS_LABEL: Record<string, string> = {
  paid: 'Pagado', pending: 'Pendiente', partial: 'Parcial', overdue: 'Vencido',
  active: 'Activo', expired: 'Vencido', terminated: 'Rescindido',
}
const UPDATE_LABEL: Record<string, string> = {
  icl: 'ICL', ipc: 'IPC', fixed_amount: 'Monto fijo', fixed_percentage: 'Porcentaje',
}

export interface UnitPayment {
  periodMonth: number; periodYear: number
  amountDue: string; amountPaid: string | null
  status: string; paymentDate: string | null; dueDate: string
}
export interface UnitPriceUpdate {
  updateDate: string; previousPrice: string; newPrice: string
  updateType: string; indexValue: string | null
}
export interface UnitContractData {
  startDate: string; endDate: string; status: string
  currentPrice: string; firstMonthPrice: string
  updateType: string; updateValue: string | null
  tenant: { firstName: string; lastName: string; dni: string; phone: string }
  payments: UnitPayment[]
  updates: UnitPriceUpdate[]
}
export interface UnitReportData {
  unit: { identifier: string; type: string; floor: string | null; description: string | null }
  group: { name: string; address: string } | null
  contracts: UnitContractData[]
}

const ars = (v: string | number | null) =>
  v == null ? '—' : '$ ' + Number(v).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtDate = (d: string | null) => {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}
const fmtPeriod = (month: number, year: number) => `${MONTHS_SHORT[month - 1]} ${year}`

const s = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 9, color: '#1a1a1a', paddingTop: 44, paddingBottom: 60, paddingHorizontal: 52, backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 14, marginBottom: 18, borderBottomWidth: 2, borderBottomColor: '#7C3AED' },
  brandName: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#7C3AED', letterSpacing: 1 },
  brandSub: { fontSize: 8, color: '#71717A', marginTop: 2 },
  reportTitle: { fontSize: 13, fontFamily: 'Helvetica-Bold', textAlign: 'right', letterSpacing: 0.5 },
  reportSub: { fontSize: 9, color: '#71717A', textAlign: 'right', marginTop: 3 },
  unitBox: { backgroundColor: '#F5F0FF', borderRadius: 5, padding: 12, marginBottom: 16 },
  unitId: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#7C3AED', marginBottom: 3 },
  unitMeta: { fontSize: 9, color: '#52525B' },
  contractBox: { marginBottom: 12, borderWidth: 0.5, borderColor: '#E4E4E7', borderRadius: 4, padding: 10 },
  contractHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 },
  contractTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#1a1a1a' },
  contractBadge: { fontSize: 8, color: '#71717A' },
  infoRow: { flexDirection: 'row', marginBottom: 3 },
  infoLabel: { width: 100, fontSize: 8, color: '#71717A' },
  infoValue: { flex: 1, fontSize: 8, color: '#1a1a1a' },
  subTitle: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#7C3AED', letterSpacing: 1, marginTop: 8, marginBottom: 3, paddingBottom: 2, borderBottomWidth: 0.4, borderBottomColor: '#E4E4E7' },
  tHead: { flexDirection: 'row', backgroundColor: '#F5F0FF', paddingVertical: 4, paddingHorizontal: 5, borderRadius: 2, marginBottom: 1 },
  tRow: { flexDirection: 'row', paddingVertical: 3, paddingHorizontal: 5, borderBottomWidth: 0.3, borderBottomColor: '#E4E4E7' },
  tRowAlt: { flexDirection: 'row', paddingVertical: 3, paddingHorizontal: 5, borderBottomWidth: 0.3, borderBottomColor: '#E4E4E7', backgroundColor: '#FAFAFA' },
  th: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#7C3AED' },
  td: { fontSize: 8, color: '#1a1a1a' },
  tdSub: { fontSize: 7, color: '#71717A' },
  footer: { position: 'absolute', bottom: 28, left: 52, right: 52, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 0.5, borderTopColor: '#E4E4E7', paddingTop: 7 },
  footerText: { fontSize: 7, color: '#A1A1AA' },
})

function UnitDoc({ data }: { data: UnitReportData }) {
  const unitMeta = [TYPE_LABEL[data.unit.type] ?? data.unit.type, data.unit.floor ? `Piso ${data.unit.floor}` : null].filter(Boolean).join(' · ')
  return (
    <Document title={`Historial — ${data.unit.identifier}`} author="RentAR">
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View>
            <Text style={s.brandName}>RentAR</Text>
            <Text style={s.brandSub}>Sistema de Gestión de Alquileres</Text>
          </View>
          <View>
            <Text style={s.reportTitle}>HISTORIAL DE UNIDAD</Text>
            <Text style={s.reportSub}>Generado el {new Date().toLocaleDateString('es-AR')}</Text>
          </View>
        </View>

        <View style={s.unitBox}>
          <Text style={s.unitId}>{data.unit.identifier}</Text>
          <Text style={s.unitMeta}>{unitMeta}{data.group ? ` · ${data.group.name}` : ''}</Text>
          {data.group ? <Text style={s.unitMeta}>{data.group.address}</Text> : null}
          {data.unit.description ? <Text style={{ ...s.unitMeta, marginTop: 4 }}>{data.unit.description}</Text> : null}
        </View>

        {data.contracts.length === 0 ? (
          <Text style={{ fontSize: 9, color: '#71717A', textAlign: 'center', marginTop: 20 }}>
            Esta unidad no tiene contratos registrados.
          </Text>
        ) : data.contracts.map((c, ci) => (
          <View key={ci} style={s.contractBox}>
            <View style={s.contractHeader}>
              <Text style={s.contractTitle}>
                Contrato {ci + 1} · {fmtDate(c.startDate)} → {fmtDate(c.endDate)}
              </Text>
              <Text style={s.contractBadge}>{STATUS_LABEL[c.status] ?? c.status}</Text>
            </View>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Inquilino:</Text>
              <Text style={s.infoValue}>{c.tenant.lastName}, {c.tenant.firstName} — DNI {c.tenant.dni}</Text>
            </View>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Precio inicial / actual:</Text>
              <Text style={s.infoValue}>{ars(c.firstMonthPrice)} → {ars(c.currentPrice)}</Text>
            </View>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Actualización:</Text>
              <Text style={s.infoValue}>{UPDATE_LABEL[c.updateType] ?? c.updateType}{c.updateValue ? ` (${c.updateValue})` : ''}</Text>
            </View>

            {c.payments.length > 0 && (
              <>
                <Text style={s.subTitle}>PAGOS ({c.payments.length})</Text>
                <View style={s.tHead}>
                  <Text style={{ ...s.th, width: 60 }}>Período</Text>
                  <Text style={{ ...s.th, width: 62 }}>Vencimiento</Text>
                  <Text style={{ ...s.th, width: 76, textAlign: 'right' }}>Alquiler</Text>
                  <Text style={{ ...s.th, width: 76, textAlign: 'right' }}>Cobrado</Text>
                  <Text style={{ ...s.th, width: 58 }}>Estado</Text>
                  <Text style={{ ...s.th, width: 58 }}>Pago</Text>
                </View>
                {c.payments.map((p, pi) => (
                  <View key={pi} style={pi % 2 === 0 ? s.tRow : s.tRowAlt} wrap={false}>
                    <Text style={{ ...s.td, width: 60 }}>{fmtPeriod(p.periodMonth, p.periodYear)}</Text>
                    <Text style={{ ...s.tdSub, width: 62 }}>{fmtDate(p.dueDate)}</Text>
                    <Text style={{ ...s.td, width: 76, textAlign: 'right' }}>{ars(p.amountDue)}</Text>
                    <Text style={{ ...s.td, width: 76, textAlign: 'right' }}>{ars(p.amountPaid)}</Text>
                    <Text style={{ ...s.td, width: 58 }}>{STATUS_LABEL[p.status] ?? p.status}</Text>
                    <Text style={{ ...s.tdSub, width: 58 }}>{fmtDate(p.paymentDate)}</Text>
                  </View>
                ))}
              </>
            )}

            {c.updates.length > 0 && (
              <>
                <Text style={s.subTitle}>ACTUALIZACIONES DE PRECIO ({c.updates.length})</Text>
                <View style={s.tHead}>
                  <Text style={{ ...s.th, width: 68 }}>Fecha</Text>
                  <Text style={{ ...s.th, width: 94, textAlign: 'right' }}>Precio anterior</Text>
                  <Text style={{ ...s.th, width: 94, textAlign: 'right' }}>Nuevo precio</Text>
                  <Text style={{ ...s.th, width: 72 }}>Tipo</Text>
                  <Text style={{ ...s.th, width: 62, textAlign: 'right' }}>Índice/Valor</Text>
                </View>
                {c.updates.map((u, ui) => (
                  <View key={ui} style={ui % 2 === 0 ? s.tRow : s.tRowAlt} wrap={false}>
                    <Text style={{ ...s.td, width: 68 }}>{fmtDate(u.updateDate)}</Text>
                    <Text style={{ ...s.td, width: 94, textAlign: 'right' }}>{ars(u.previousPrice)}</Text>
                    <Text style={{ ...s.td, width: 94, textAlign: 'right' }}>{ars(u.newPrice)}</Text>
                    <Text style={{ ...s.td, width: 72 }}>{UPDATE_LABEL[u.updateType] ?? u.updateType}</Text>
                    <Text style={{ ...s.tdSub, width: 62, textAlign: 'right' }}>{u.indexValue ?? '—'}</Text>
                  </View>
                ))}
              </>
            )}
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

export async function generateUnitReport(data: UnitReportData): Promise<Buffer> {
  const el = React.createElement(UnitDoc, { data }) as unknown as React.ReactElement<{ title?: string }>
  return renderToBuffer(el)
}
