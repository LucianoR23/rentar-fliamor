export interface RecuperarPasswordProps {
  name: string
  url: string
  expiresInMinutes: number
}

function RecuperarPasswordEmail({ name, url, expiresInMinutes }: RecuperarPasswordProps) {
  return (
    <html>
      {/* eslint-disable-next-line @next/next/no-head-element */}
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
                <p style={{ color: '#1a1a1a', fontSize: '14px', lineHeight: '1.6', margin: '0 0 16px' }}>
                  Hola {name},
                </p>
                <p style={{ color: '#1a1a1a', fontSize: '14px', lineHeight: '1.6', margin: '0 0 24px' }}>
                  Recibimos una solicitud para restablecer la contraseña de tu cuenta. Hacé clic en el botón
                  para elegir una nueva contraseña.
                </p>

                {/* CTA */}
                <table width="100%" cellPadding="0" cellSpacing="0" style={{ marginBottom: '24px' }}>
                  <tbody>
                    <tr>
                      <td align="center">
                        <a
                          href={url}
                          style={{
                            display: 'inline-block',
                            backgroundColor: '#7C3AED',
                            color: '#FFFFFF',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            textDecoration: 'none',
                            padding: '12px 28px',
                            borderRadius: '6px',
                          }}
                        >
                          Restablecer contraseña
                        </a>
                      </td>
                    </tr>
                  </tbody>
                </table>

                <p style={{ color: '#52525B', fontSize: '13px', lineHeight: '1.6', margin: '0 0 8px' }}>
                  Este enlace vence en {expiresInMinutes} minutos. Si no solicitaste el cambio, ignorá este correo:
                  tu contraseña actual seguirá funcionando.
                </p>
                <p style={{ color: '#A1A1AA', fontSize: '12px', lineHeight: '1.6', margin: '16px 0 0', wordBreak: 'break-all' }}>
                  Si el botón no funciona, copiá y pegá este enlace en tu navegador:<br />
                  {url}
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

export function RecuperarPassword(props: RecuperarPasswordProps) {
  return <RecuperarPasswordEmail {...props} />
}

export const recuperarPasswordSubject = '[RentAR] Restablecé tu contraseña'
