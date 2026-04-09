# Checklist de Deploy en Coolify

## Pre-deploy

### 1. Ejecutar ALTER TYPE en Beekeeper (Coolify DB)
```sql
ALTER TYPE "role" ADD VALUE 'admin' AFTER 'superadmin';
```

### 2. Pushear código a GitHub
```bash
git add .
git commit -m "migración: Supabase → Better Auth + ioredis + rol admin"
git push
```

### 3. Crear servicio Next.js en Coolify (proyecto separado de infrastructure)
- Dashboard de Coolify → New Project (ej: "rentar-admin") → New Resource → **Application**
- Source: GitHub repo `LucianoR23/rentar-fliamor` (branch `main`)
- Build Pack: **Dockerfile**
- Port: **3000**

### 3.1 Conectar a la red del proyecto "infrastructure"
La app está en un proyecto separado de PostgreSQL y Dragonfly, hay que conectar las redes:

1. Ir a Coolify → proyecto **"infrastructure"** → cualquier recurso (PostgreSQL o Dragonfly)
2. En Settings buscar el nombre de la red Docker (algo como `coolify_infrastructure` o similar, aparece en "Docker Network")
3. Ir al servicio Next.js (en el proyecto "rentar-admin") → Settings → **Custom Docker Networks** o **Connect to network**
4. Agregar el nombre de la red de infrastructure

**Verificar post-deploy** — abrir terminal del container Next.js en Coolify y ejecutar:
```bash
nc -zv d8ygplsmw84rc9epykd7vp43 5432    # PostgreSQL
nc -zv c464eyelt3v404k48ksr9huf 6380     # Dragonfly
```
Si responde "open", la conexión funciona. Si falla, revisar que la red esté bien conectada.

### 4. Configurar variables de entorno en Coolify
En el servicio Next.js → Environment Variables, agregar:

| Variable | Valor |
|---|---|
| `DATABASE_URL` | `postgres://postgres:y0SByyCbAo2m5986wLqLChHa00bB8sKsZcw7ZT9@d8ygplsmw84rc9epykd7vp43:5432/rentar_fliamor?sslmode=require` |
| `BETTER_AUTH_SECRET` | `30026876a88e4a11b75b0f9a26d87386205923709a6fb8de533650bf9da382e2` |
| `BETTER_AUTH_URL` | `https://TU_DOMINIO` |
| `NEXT_PUBLIC_APP_URL` | `https://TU_DOMINIO` |
| `REDIS_URL` | `rediss://:ShqV2MdYJFe2IncgyTriYV7B8E0izA2Enac7JYdnJFEqozFlk7EZZgM6a8HjpFRA@c464eyelt3v404k48ksr9huf:6380/0` |
| `R2_ACCOUNT_ID` | (mantener el mismo) |
| `R2_ACCESS_KEY_ID` | (mantener el mismo) |
| `R2_SECRET_ACCESS_KEY` | (mantener el mismo) |
| `R2_BUCKET_NAME` | `rentar-fliamor-files` |
| `R2_PUBLIC_URL` | `https://pub-44e2904ab1d547e081f2997482e74bc7.r2.dev` |
| `RESEND_API_KEY` | (mantener el mismo) |
| `RESEND_FROM` | (opcional, ej: `RentAR <noreply@rentar.app>`) |
| `CRON_SECRET` | `3a381d9e5bf3a2bf63dfb532c3f938f6bd986a971da426b3a48b644f827ef5ea` |
| `NEXT_PUBLIC_POSTHOG_KEY` | (si lo usás) |
| `SENTRY_DSN` | (si lo usás) |

> **IMPORTANTE:** Reemplazar `TU_DOMINIO` con el dominio real (ej: `https://admin.rentar.app`).

### 5. Deploy
- Click en **Deploy** en Coolify
- Esperar que el build termine (Dockerfile → standalone)
- Verificar logs: no debe haber errores de conexión a DB ni Redis

---

## Post-deploy

### 6. Crear usuario superadmin
Desde la terminal de Coolify (o SSH al servidor), ejecutar dentro del container de la app:

```bash
curl -X POST http://localhost:3000/api/auth/admin/create-user \
  -H "Content-Type: application/json" \
  -d '{"name":"TU_NOMBRE","email":"TU_EMAIL","password":"TU_PASSWORD","role":"user"}'
```

Luego en Beekeeper (conectado a Coolify DB):
```sql
UPDATE users SET role = 'superadmin' WHERE email = 'TU_EMAIL';
```

### 7. Verificar login
- Abrir `https://TU_DOMINIO/sign-in`
- Ingresar con el email y password del paso 6
- Verificar que redirige al dashboard
- Verificar que se ve el rol "Superadmin" en el header

### 8. Borrar usuario viejo de Supabase
En Beekeeper, borrar el usuario que se importó de Supabase (no tiene credenciales en Better Auth):
```sql
-- Verificar primero cuál es el viejo (no tiene account ni session asociados)
SELECT u.id, u.email, u.role, u.created_at
FROM users u
LEFT JOIN accounts a ON a.user_id = u.id
WHERE a.id IS NULL;

-- Borrar si corresponde
DELETE FROM users WHERE id = 'ID_DEL_USUARIO_VIEJO';
```

### 9. Verificar funcionalidades core
- [ ] Login/logout funciona
- [ ] Dashboard carga datos
- [ ] CRUD de unidades (crear, editar, eliminar)
- [ ] CRUD de inquilinos
- [ ] CRUD de contratos
- [ ] CRUD de pagos
- [ ] Subir archivos (R2)
- [ ] Generar reportes/PDFs
- [ ] Crear un usuario viewer y verificar que no puede mutar datos
- [ ] Crear un usuario admin y verificar que puede mutar pero no gestionar usuarios

### 10. Configurar Scheduled Tasks (Crons) en Coolify
Dashboard de Coolify → Aplicación → Settings → Scheduled Tasks:

```
# Expirar contratos — 07:00 ART (10:00 UTC) — DEBE correr ANTES de alertas
0 10 * * *  curl -sf -H "Authorization: Bearer 3a381d9e5bf3a2bf63dfb532c3f938f6bd986a971da426b3a48b644f827ef5ea" http://localhost:3000/api/cron/expire-contracts

# Alertas por email — 09:00 ART (12:00 UTC)
0 12 * * *  curl -sf -H "Authorization: Bearer 3a381d9e5bf3a2bf63dfb532c3f938f6bd986a971da426b3a48b644f827ef5ea" http://localhost:3000/api/cron/alerts
```

### 11. Verificar crons
Ejecutar manualmente cada cron para testear:
```bash
# Desde el container o SSH
curl -sf -H "Authorization: Bearer 3a381d9e5bf3a2bf63dfb532c3f938f6bd986a971da426b3a48b644f827ef5ea" http://localhost:3000/api/cron/expire-contracts

curl -sf -H "Authorization: Bearer 3a381d9e5bf3a2bf63dfb532c3f938f6bd986a971da426b3a48b644f827ef5ea" http://localhost:3000/api/cron/alerts
```
Esperado: `{"ok":true,...}`

### 12. Eliminar GitHub Actions de crons
Una vez verificado que los crons de Coolify funcionan:
```bash
rm .github/workflows/cron-alerts.yml
rm .github/workflows/cron-expire-contracts.yml
```
Pushear el cambio.

### 13. Testear Dragonfly (ver DRAGONFLY_TEST.md)
- Verificar conexión SSL
- Verificar dedup de alertas (correr cron 2 veces)

---

## Rollback
Si algo falla:
- La cuenta de Supabase y Upstash siguen activas
- En `.env` descomentar las URLs de Supabase/Upstash y comentar las de Coolify
- El código de Supabase está en el historial de git

## Post-migración (limpieza)
Una vez que todo funcione estable por unos días:
- Eliminar cuenta Supabase (o pausar proyecto)
- Eliminar cuenta Upstash
- Eliminar `MIGRATION_PLAN.md`, `DEPLOY_CHECKLIST.md`, `DRAGONFLY_TEST.md`
- Limpiar comentarios `# viejo` del `.env`
- Actualizar `CLAUDE.md` con el nuevo stack (Better Auth, ioredis, Coolify)
