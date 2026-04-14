# RentAR Admin

Sistema de gestion de alquileres para el mercado inmobiliario argentino. Dashboard interno con roles, facturacion electronica AFIP, actualizaciones automaticas por ICL/IPC, generacion de recibos PDF y reportes financieros.

## Tech Stack

- **Framework**: Next.js 16 (App Router, React 19, React Compiler)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **ORM**: Drizzle ORM + PostgreSQL
- **Auth**: Better Auth (email/password, role-based access)
- **Storage**: Cloudflare R2 (S3-compatible)
- **Cache**: Redis / Dragonfly (via ioredis)
- **Email**: Resend
- **PDF**: @react-pdf/renderer
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Monitoring**: Sentry

## Features

### Contratos
- CRUD completo con historial de actualizaciones
- Calculo automatico de actualizaciones por ICL, IPC, monto fijo o porcentaje
- Consumo de indices argentinos con cache en Redis (TTL 24h)
- Timeline visual de actualizaciones aplicadas
- Deteccion de actualizaciones vencidas

### Facturacion AFIP
- Factura electronica tipo A y B segun condicion fiscal
- Determinacion automatica de tipo de comprobante, IVA y exenciones
- Obtencion de CAE y numero de comprobante
- Generacion de PDF con formato fiscal completo

### Pagos
- Generacion automatica de pagos mensuales con line items (alquiler, IVA, expensas, cargos manuales)
- Recalculo automatico al modificar expensas o cargos
- Recibos PDF descargables
- Estados: pendiente, pagado, parcial, vencido, cancelado

### Grupos / Edificios
- Agrupacion de unidades con distribucion de costos por tipo
- Expensas compartidas con distribucion configurable
- Asignacion de expensas a unidades especificas

### Mantenimiento
- Inventario de materiales con stock y costo unitario
- Ordenes de reparacion con mano de obra y materiales
- Historial de movimientos de stock

### Reportes
- Dashboard con KPIs: ocupacion, ingresos proyectados vs cobrados, actualizaciones proximas
- Graficos de tendencia de ingresos (ultimos 6 meses)
- Reportes PDF: mensual, por unidad y completo

### Alertas (Cron Jobs)
- Notificacion por email de contratos por vencer (30 dias)
- Aviso de actualizaciones de precio proximas (7 dias)
- Deduplicacion de alertas con Redis

### Seguridad
- Roles: superadmin, admin, viewer — validados en servidor
- `requireRole()` en cada API route y Server Action que muta datos
- Viewer es read-only absoluto
- Archivos subidos via presigned URL directo a R2, sin pasar por el servidor

## Architecture

```
src/
  app/
    (auth)/            Login (glassmorphism UI)
    (dashboard)/       Paginas protegidas por auth
    api/               REST endpoints + cron routes
  components/          Componentes por dominio
  lib/
    auth-config.ts     Better Auth con Drizzle adapter
    auth.ts            requireRole() — gate de autorizacion
    db.ts              Cliente PostgreSQL (Drizzle)
    redis.ts           Cliente Redis (ioredis)
    indices.ts         ICL/IPC con cache Redis
    rent-calculator.ts Calculo de actualizaciones y distribucion de expensas
    afip.ts            Cliente AFIP para facturacion electronica
    payment-generator.ts  Generacion y recalculo de pagos
    pdf/               Templates de recibos y facturas
  types/               Tipos inferidos de Drizzle schema
```

### Patrones clave

- Server Components por default, Client Components solo para formularios y tablas interactivas
- Validacion con Zod en API routes y Server Actions
- Montos en `decimal(12,2)` — nunca floats para dinero
- Proxy de autenticacion en `src/proxy.ts` (Next.js 16)
- Standalone output para deploy con Docker

## Getting Started

```bash
pnpm install

cp .env.example .env
# Configurar las variables de entorno

pnpm drizzle-kit push

pnpm dev
```

## Environment Variables

| Variable | Descripcion |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Session encryption key |
| `BETTER_AUTH_URL` | Auth callback URL |
| `NEXT_PUBLIC_APP_URL` | URL publica de la app |
| `REDIS_URL` | Redis/Dragonfly connection string |
| `R2_ACCOUNT_ID` | Cloudflare Account ID |
| `R2_ACCESS_KEY_ID` | R2 access key |
| `R2_SECRET_ACCESS_KEY` | R2 secret key |
| `R2_BUCKET_NAME` | Nombre del bucket |
| `R2_PUBLIC_URL` | URL publica del bucket |
| `RESEND_API_KEY` | Resend API key |
| `RESEND_FROM` | Email remitente |
| `CRON_SECRET` | Auth para cron routes |
| `AFIP_CERT` | Certificado AFIP (PEM) |
| `AFIP_KEY` | Clave privada AFIP (PEM) |
| `AFIP_CUIT` | CUIT del contribuyente |

## Scripts

| Comando | Descripcion |
|---------|-------------|
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | Build de produccion |
| `pnpm lint` | ESLint |
| `pnpm drizzle-kit push` | Aplicar schema a la DB |
| `pnpm drizzle-kit generate` | Generar migracion |
| `pnpm drizzle-kit studio` | GUI de base de datos |
