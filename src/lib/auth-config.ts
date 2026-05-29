import { betterAuth } from 'better-auth'
import { admin } from 'better-auth/plugins'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from './db'
import * as schema from './schema'
import { resend, FROM_EMAIL } from './resend'
import { RecuperarPassword, recuperarPasswordSubject } from '@/emails/RecuperarPassword'

const RESET_TOKEN_EXPIRES_IN = 60 * 60 // 1 hora (segundos)

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg', schema }),
  user: {
    modelName: 'users',
    additionalFields: {
      role: { type: 'string', defaultValue: 'viewer', input: false },
    },
  },
  session: {
    modelName: 'sessions',
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24, // 24 horas — el rol casi nunca cambia
    },
  },
  account: { modelName: 'accounts' },
  verification: { modelName: 'verifications' },
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    resetPasswordTokenExpiresIn: RESET_TOKEN_EXPIRES_IN,
    sendResetPassword: async ({ user, url }) => {
      const React = (await import('react')).default
      const { renderToStaticMarkup } = await import('react-dom/server')
      const html =
        '<!DOCTYPE html>' +
        renderToStaticMarkup(
          React.createElement(RecuperarPassword, {
            name: user.name || user.email,
            url,
            expiresInMinutes: Math.round(RESET_TOKEN_EXPIRES_IN / 60),
          }),
        )

      const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: user.email,
        subject: recuperarPasswordSubject,
        html,
      })
      if (error) {
        console.error('[auth] sendResetPassword failed:', error.message)
        throw new Error('No se pudo enviar el email de recuperación')
      }
    },
  },
  plugins: [admin()],
  trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL!],
})
