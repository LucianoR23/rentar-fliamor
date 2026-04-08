# Cron Jobs — RentAR Admin

Todos los crons son endpoints GET protegidos con Bearer token (`CRON_SECRET`).
Se invocan externamente via curl desde GitHub Actions, Coolify Scheduled Tasks, o crontab del VPS.

## Variables requeridas

| Variable | Donde se configura | Descripcion |
|----------|-------------------|-------------|
| `CRON_SECRET` | `.env` + GitHub Secrets + Coolify | Token secreto para autenticar las llamadas. Generar con `openssl rand -hex 32` |
| `APP_URL` | GitHub Secrets | URL publica de la app (ej: `https://admin.rentar.com.ar`). Solo necesaria en GitHub Actions |

---

## Crons existentes

### 1. Expirar contratos

| Campo | Valor |
|-------|-------|
| **Endpoint** | `GET /api/cron/expire-contracts` |
| **Archivo** | `src/app/api/cron/expire-contracts/route.ts` |
| **Schedule** | `0 10 * * *` (07:00 ART, todos los dias) |
| **Descripcion** | Marca automaticamente como `expired` los contratos con `status = 'active'` y `endDate < hoy` |
| **Respuesta** | `{ ok: true, expired: number, ts: string }` |

**Importante:** Debe ejecutarse ANTES del cron de alertas para que los contratos recien expirados no generen alertas de "por vencer".

### 2. Alertas por email

| Campo | Valor |
|-------|-------|
| **Endpoint** | `GET /api/cron/alerts` |
| **Archivo** | `src/app/api/cron/alerts/route.ts` |
| **Schedule** | `0 12 * * *` (09:00 ART, todos los dias) |
| **Descripcion** | Envia emails a todos los superadmins sobre: (a) contratos que vencen en los proximos 30 dias, (b) contratos con actualizacion de precio en los proximos 7 dias |
| **Respuesta** | `{ ok: true, sent: number, skipped: number, ts: string }` |
| **Dedup** | Usa Redis para evitar emails duplicados (1 alerta por contrato cada 35 dias para vencimientos, 10 dias para actualizaciones) |
| **GitHub Action** | `.github/workflows/cron-alerts.yml` |

---

## Como configurar

### Opcion A: GitHub Actions (actual para alertas)

Los workflows estan en `.github/workflows/`. Necesitan los secrets `APP_URL` y `CRON_SECRET` configurados en GitHub repo > Settings > Secrets and variables > Actions.

### Opcion B: Coolify Scheduled Tasks

En el dashboard de Coolify, ir a la aplicacion > Settings > Scheduled Tasks y agregar:

```
# Expirar contratos — 07:00 ART (10:00 UTC)
0 10 * * *  curl -s -H "Authorization: Bearer $CRON_SECRET" $APP_URL/api/cron/expire-contracts

# Alertas — 09:00 ART (12:00 UTC)
0 12 * * *  curl -s -H "Authorization: Bearer $CRON_SECRET" $APP_URL/api/cron/alerts
```

### Opcion C: Crontab del VPS

```bash
crontab -e

# Expirar contratos — 07:00 ART
0 10 * * * curl -s -H "Authorization: Bearer TU_CRON_SECRET" https://tu-dominio.com/api/cron/expire-contracts
# Alertas — 09:00 ART
0 12 * * * curl -s -H "Authorization: Bearer TU_CRON_SECRET" https://tu-dominio.com/api/cron/alerts
```

### Test manual

```bash
# Expirar contratos
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/expire-contracts

# Alertas
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/alerts
```

---

## Crons futuros a considerar

| Cron | Descripcion | Prioridad |
|------|-------------|-----------|
| Pagos vencidos | Marcar como `overdue` los pagos con `status = 'pending'` y `dueDate < hoy` | Alta |
| Limpieza de archivos huerfanos | Eliminar archivos en R2 que no tengan registro en la tabla `files` | Baja |
| Backup de indices | Guardar snapshot de ICL/IPC en la DB por si las APIs externas caen | Media |
