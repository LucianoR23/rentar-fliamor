import React from 'react'

export interface ActualizacionProximaProps {
  tenant: { firstName: string; lastName: string }
  unit: { identifier: string; type: string }
  updateDate: string    // 'YYYY-MM-DD' — nextUpdateDate
  daysLeft: number
  currentPrice: string  // decimal string
  updateType: string    // 'icl' | 'ipc' | 'fixed_amount' | 'fixed_percentage'
  updateValue: string | null
}

const TYPE_LABEL: Record<string, string> = {
  apartment: 'Departamento', local: 'Local', land: 'Terreno', house: 'Casa', other: 'Otro',
}
const UPDATE_LABEL: Record<string, string> = {
  icl: 'ICL — Índice para Contratos de Locación',
  ipc: 'IPC — Índice de Precios al Consumidor',
  fixed_amount: 'Monto fijo',
  fixed_percentage: 'Porcentaje fijo',
}

function fmtDate(d: string): string {
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

function ars(v: string): string {
  return '$ ' + Number(v).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function ActualizacionProximaEmail({ tenant, unit, updateDate, daysLeft, currentPrice, updateType, updateValue }: ActualizacionProximaProps) {
  const updateLabel = UPDATE_LABEL[updateType] ?? updateType
  const updateDetail = updateValue
    ? updateType === 'fixed_amount'
      ? `+${ars(updateValue)}`
      : `+${updateValue}%`
    : null

  const rows = [
    ['Unidad', `${unit.identifier} — ${TYPE_LABEL[unit.type] ?? unit.type}`],
    ['Inquilino', `${tenant.firstName} ${tenant.lastName}`],
    ['Fecha de actualización', fmtDate(updateDate)],
    ['Precio actual', ars(currentPrice)],
    ['Tipo de ajuste', `${updateLabel}${updateDetail ? ` (${updateDetail})` : ''}`],
  ] as const

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{ fontFamily: 'Arial,Helvetica,sans-serif', backgroundColor: '#F4F4F5', margin: 0, padding: '24px 0' }}>
        <table width="100%" cellPadding="0" cellSpacing="0" style={{ maxWidth: '560px', margin: '0 auto' }}>
          <tbody>
            {/* Header */}
            <tr>
              <td style={{ backgroundColor: '#7C3AED', padding: '20px 28px', borderRadius: '8px 8px 0 0' }}>
                <div style={{ color: '#FFFFFF', fontSize: '22px', fontWeight: 'bold', letterSpacing: '1px' }}>RentAR</div>
                <div style={{ color: '#DDD6FE', fontSize: '12px', marginTop: '3px' }}>Sistema de Gestión de Alquileres</div>
              </td>
            </tr>

            {/* Body */}
            <tr>
              <td style={{ backgroundColor: '#FFFFFF', padding: '28px' }}>
                {/* Alert badge */}
                <div style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '6px', padding: '10px 14px', marginBottom: '20px' }}>
                  <span style={{ color: '#D97706', fontWeight: 'bold', fontSize: '13px' }}>
                    Actualización de precio en {daysLeft} día{daysLeft !== 1 ? 's' : ''}
                  </span>
                </div>

                <p style={{ color: '#1a1a1a', fontSize: '14px', lineHeight: '1.6', margin: '0 0 20px' }}>
                  Este es un aviso automático. El siguiente contrato tiene una actualización de precio programada.
                </p>

                {/* Detail table */}
                <table width="100%" cellPadding="0" cellSpacing="0" style={{ borderTop: '1px solid #E4E4E7', marginBottom: '24px' }}>
                  <tbody>
                    {rows.map(([label, value]) => (
                      <tr key={label}>
                        <td style={{ padding: '9px 0', borderBottom: '1px solid #F4F4F5', color: '#71717A', fontSize: '13px', width: '44%' }}>{label}</td>
                        <td style={{ padding: '9px 0', borderBottom: '1px solid #F4F4F5', color: '#1a1a1a', fontSize: '13px', fontWeight: 'bold' }}>{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <p style={{ color: '#52525B', fontSize: '13px', lineHeight: '1.6', margin: '0' }}>
                  Verificá el índice de actualización en el sistema para confirmar el nuevo precio antes de la fecha indicada.
                </p>
              </td>
            </tr>

            {/* Footer */}
            <tr>
              <td style={{ backgroundColor: '#F4F4F5', padding: '14px 28px', borderRadius: '0 0 8px 8px', borderTop: '1px solid #E4E4E7' }}>
                <p style={{ color: '#A1A1AA', fontSize: '11px', margin: '0', lineHeight: '1.5' }}>
                  Mensaje automático generado por RentAR. No responder a este correo.
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  )
}

export function ActualizacionProxima(props: ActualizacionProximaProps) {
  return <ActualizacionProximaEmail {...props} />
}

export function actualizacionProximaSubject(props: ActualizacionProximaProps): string {
  return `[RentAR] Actualización de precio en ${props.daysLeft} días — Unidad ${props.unit.identifier}`
}
