export interface VencimientoContratoProps {
  tenant: { firstName: string; lastName: string }
  unit: { identifier: string; type: string }
  endDate: string       // 'YYYY-MM-DD'
  daysLeft: number
  currentPrice: string  // decimal string
}

const TYPE_LABEL: Record<string, string> = {
  apartment: 'Departamento', local: 'Local', land: 'Terreno', house: 'Casa', other: 'Otro',
}

function fmtDate(d: string): string {
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

function ars(v: string): string {
  return '$ ' + Number(v).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function VencimientoContratoEmail({ tenant, unit, endDate, daysLeft, currentPrice }: VencimientoContratoProps) {
  const rows = [
    ['Unidad', `${unit.identifier} — ${TYPE_LABEL[unit.type] ?? unit.type}`],
    ['Inquilino', `${tenant.firstName} ${tenant.lastName}`],
    ['Fecha de vencimiento', fmtDate(endDate)],
    ['Alquiler actual', ars(currentPrice)],
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
                <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '6px', padding: '10px 14px', marginBottom: '20px' }}>
                  <span style={{ color: '#DC2626', fontWeight: 'bold', fontSize: '13px' }}>
                    Contrato vence en {daysLeft} día{daysLeft !== 1 ? 's' : ''}
                  </span>
                </div>

                <p style={{ color: '#1a1a1a', fontSize: '14px', lineHeight: '1.6', margin: '0 0 20px' }}>
                  Este es un aviso automático. El siguiente contrato está próximo a vencer.
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
                  Recordá gestionar la renovación o rescisión del contrato con anticipación para evitar inconvenientes.
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

export function VencimientoContrato(props: VencimientoContratoProps) {
  return <VencimientoContratoEmail {...props} />
}

export function vencimientoContratoSubject(props: VencimientoContratoProps): string {
  return `[RentAR] Contrato vence en ${props.daysLeft} días — Unidad ${props.unit.identifier}`
}
