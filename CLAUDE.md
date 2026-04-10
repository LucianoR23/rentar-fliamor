# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# RentAR Admin

Sistema de gestión de alquileres para el mercado argentino. Dashboard interno con roles superadmin/admin/viewer. Calcula actualizaciones de precio por ICL, IPC, monto fijo o porcentaje fijo consumiendo APIs argentinas.

## Commands

- `pnpm dev` — Dev server en localhost:3000
- `pnpm build` — Build de producción
- `pnpm lint` — ESLint
- `pnpm drizzle-kit push` — Aplicar schema a la base de datos
- `pnpm drizzle-kit generate` — Generar migración
- `pnpm drizzle-kit studio` — Drizzle Studio (GUI de DB)

## Tech Stack

Next.js 16 App Router + React 19 (React Compiler) + TypeScript strict + Tailwind v4 + shadcn/ui + Drizzle ORM + PostgreSQL (Coolify) + Better Auth + Cloudflare R2 (files) + Redis/Dragonfly via ioredis (cache) + Resend (email) + @react-pdf/renderer (PDFs) + Framer Motion

## Architecture

### Directory Structure
- `src/app/(auth)/` — Login page (glassmorphism, public)
- `src/app/(dashboard)/` — Todas las páginas del admin (protegidas por Better Auth)
- `src/app/api/` — API routes: CRUD + cálculos + PDF + files
- `src/app/api/auth/[...all]/` — Better Auth catch-all route handler
- `src/components/` — Componentes organizados por dominio (units/, tenants/, payments/, etc.)
- `src/lib/` — DB client, auth helpers, R2, Redis, índices ICL/IPC, calculadora de alquiler, PDF templates
- `src/types/` — Tipos TypeScript inferidos de Drizzle schema

### Route Protection
- `src/proxy.ts` — Next.js 16 proxy (replaces middleware.ts). Checks Better Auth session for all routes except `/sign-in`, `/api/auth/*`, `/api/cron/*`. Redirects unauthenticated users to `/sign-in`.

### Data Flow
- Server Components por default: hacen queries directos a PostgreSQL via Drizzle
- Client Components: solo formularios (react-hook-form), tablas interactivas (TanStack), modales, theme toggle
- Mutations: Server Actions o API routes, siempre llaman `requireRole()` antes de ejecutar
- Índices ICL/IPC: se cachean en Redis con TTL 24h para evitar llamadas externas repetidas

### Key Patterns
- `src/lib/auth-config.ts` → Better Auth instance con Drizzle adapter, email/password (signup disabled), admin plugin
- `src/lib/auth.ts` → `requireRole('superadmin' | 'admin' | 'viewer')` se llama al inicio de cada API route y Server Action que muta datos. Usa Better Auth API para leer la sesión del servidor. Role hierarchy: superadmin(3) > admin(2) > viewer(1) > user(0).
- `src/lib/auth-client.ts` → Client-side auth helpers
- `src/lib/db.ts` → único punto de acceso a PostgreSQL (postgres-js driver, `prepare: false` for connection pooler). NUNCA importar drizzle directamente en componentes
- `src/lib/redis.ts` → ioredis client connecting via `REDIS_URL`
- `src/lib/indices.ts` → `getICL()` y `getIPC()` siempre pasan por Redis cache antes de llamar APIs externas
- `src/lib/rent-calculator.ts` → `calculateRentUpdate()` es la función core. Nunca duplicar lógica de cálculo fuera de esta función
- Archivos: el cliente obtiene presigned URL via `/api/files/upload`, sube directo a R2, luego confirma via `/api/files/confirm`
- Soft deletes solo donde hay historial importante (contratos). El resto es hard delete con confirmación.

### Build Configuration
- `output: 'standalone'` — Docker-deployable standalone build
- `reactCompiler: true` — React 19 Compiler enabled
- `optimizePackageImports` — geist, framer-motion, @hugeicons/react, recharts, @react-pdf/renderer

## Design System

### Colores (CSS variables en globals.css)
Dark: background #09090B, surface #18181B, border #27272A, primary #7C3AED, accent #F59E0B, success #10B981, danger #EF4444, text #FAFAFA, muted #A1A1AA
Light: background #FAFAFA, surface #FFFFFF, border #E4E4E7, primary #6D28D9, accent #D97706, success #059669, danger #DC2626, text #09090B, muted #71717A

### Typography
- Fuente: Geist Sans (UI), Geist Mono (números/montos) — importar de `geist/font`
- Montos siempre en Geist Mono con `font-variant-numeric: tabular-nums`

### Style
- Border radius: 6px default, 8px cards, 12px modales, 9999px badges
- Sidebar: 240px expandida, 64px colapsada (iconos solo)
- Badges de estado: pill `px-2 py-0.5 rounded-full text-xs font-medium` con variantes bg/text según estado
- Animaciones: Framer Motion duration 150ms ease-out para modales y transiciones

## Environment Variables

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (Coolify) |
| `BETTER_AUTH_SECRET` | Session encryption key (Better Auth) |
| `BETTER_AUTH_URL` | Auth callback URL |
| `NEXT_PUBLIC_APP_URL` | URL de producción (trusted origin for Better Auth) |
| `REDIS_URL` | Redis/Dragonfly connection string (ioredis) |
| `R2_ACCOUNT_ID` | Cloudflare Account ID |
| `R2_ACCESS_KEY_ID` | R2 access key |
| `R2_SECRET_ACCESS_KEY` | R2 secret |
| `R2_BUCKET_NAME` | Nombre del bucket |
| `R2_PUBLIC_URL` | URL pública R2 |
| `RESEND_API_KEY` | Resend API key |
| `RESEND_FROM` | Sender email address |
| `CRON_SECRET` | Webhook authentication for cron routes |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog key (optional) |
| `SENTRY_DSN` | Sentry DSN (optional) |

## Reglas No Negociables

1. TypeScript strict mode. Cero `any`. Tipos siempre inferidos de Drizzle schema donde sea posible.
2. `requireRole()` SIEMPRE al inicio de cada API route o Server Action que muta datos. Sin excepción.
3. `calculateRentUpdate()` y `calculateGroupExpenseDistribution()` son las únicas fuentes de verdad para cálculos. No duplicar lógica en componentes.
4. Nunca almacenar binarios en PostgreSQL. Nunca exponer `r2Key` al cliente — solo `r2Url`.
5. Montos en la base de datos siempre en `decimal(12,2)`. Nunca floats para dinero.
6. Un componente por archivo. Máximo 300 líneas. Si es más largo, extraer sub-componentes.
7. Los índices ICL/IPC SIEMPRE pasan por `src/lib/indices.ts` (con cache Redis). Nunca fetch directo a `api.argly.com.ar` fuera de esas funciones.
8. El role `viewer` es read-only absoluto — validar en el servidor, no confiar en la UI.
9. Formatear montos ARS con `formatCurrency()` de `src/lib/utils.ts`. Nunca hardcodear el símbolo `$`.
10. Crear `src/lib/env.ts` con validación zod de `process.env` al startup. El build debe fallar si faltan vars críticas.