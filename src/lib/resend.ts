import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY!)

/** Sender address — must match a verified domain in your Resend account */
export const FROM_EMAIL = process.env.RESEND_FROM ?? 'RentAR <noreply@rentar.app>'
