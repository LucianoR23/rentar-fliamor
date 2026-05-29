'use client'

import { motion } from 'framer-motion'

const orbs = [
  { width: 600, height: 600, top: '-15%', left: '-10%', color: 'rgba(109,40,217,0.18)', delay: 0 },
  { width: 480, height: 480, top: '-5%', right: '-8%', color: 'rgba(124,58,237,0.12)', delay: 1.5 },
  { width: 320, height: 320, bottom: '10%', left: '30%', color: 'rgba(167,139,250,0.10)', delay: 0.8 },
]

interface AuthShellProps {
  title: string
  subtitle: string
  children: React.ReactNode
}

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <div
      className="relative min-h-screen w-full overflow-hidden flex items-center justify-center px-4"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, #3b0764 0%, #09090b 60%)' }}
    >
      {/* Orbs difusos */}
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: orb.width,
            height: orb.height,
            top: orb.top,
            left: 'left' in orb ? orb.left : undefined,
            right: 'right' in orb ? orb.right : undefined,
            bottom: 'bottom' in orb ? orb.bottom : undefined,
            background: orb.color,
            filter: 'blur(80px)',
          }}
          animate={{ scale: [1, 1.06, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 6, delay: orb.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      {/* Card glassmorphism */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-sm"
      >
        <div
          className="rounded-2xl p-8"
          style={{
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.10)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}
        >
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-violet-600 mb-4">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 5h14M3 10h14M3 15h8" stroke="white" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-white tracking-tight">{title}</h1>
            <p className="text-sm text-zinc-400 mt-1">{subtitle}</p>
          </div>

          {children}
        </div>
      </motion.div>
    </div>
  )
}

const inputStyle = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)',
} as const

export function AuthInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition focus:ring-1 focus:ring-violet-500 disabled:opacity-50"
      style={inputStyle}
    />
  )
}

export function AuthSubmit({
  loading,
  loadingLabel,
  children,
}: {
  loading: boolean
  loadingLabel: string
  children: React.ReactNode
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="mt-2 w-full rounded-lg py-2.5 text-sm font-medium cursor-pointer text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
      style={{
        background: loading ? 'rgba(109,40,217,0.6)' : 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
        boxShadow: '0 0 20px rgba(124,58,237,0.3)',
      }}
    >
      {loading ? loadingLabel : children}
    </button>
  )
}
