---
  Pasos para activar

  1. Variables de entorno — agregar en Vercel y en .env.local

  ┌────────────────┬───────────────────────────────────────────────────────────────────────────┐
  │    Variable    │                                   Valor                                   │
  ├────────────────┼───────────────────────────────────────────────────────────────────────────┤
  │ RESEND_API_KEY │ Ya está definida — verificá que esté cargada                              │
  ├────────────────┼───────────────────────────────────────────────────────────────────────────┤
  │ RESEND_FROM    │ RentAR <noreply@tudominio.com> — debe ser un dominio verificado en Resend │
  ├────────────────┼───────────────────────────────────────────────────────────────────────────┤
  │ CRON_SECRET    │ Cualquier string seguro, ej: openssl rand -hex 32                         │
  ├────────────────┼───────────────────────────────────────────────────────────────────────────┤
  │ ALERT_EMAIL    │ Email del admin (fallback cuando el inquilino no tiene email)             │
  └────────────────┴───────────────────────────────────────────────────────────────────────────┘

  2. Verificar dominio en Resend

  En https://resend.com/domains: agregá tu dominio y seguí los pasos de DNS. Hasta que esté
  verificado, Resend sólo permite enviar a onboarding@resend.dev en modo test.

  3. Deployar en Vercel

  El vercel.json que se creó activa el cron automáticamente al deployar. Vercel requiere el plan
  Pro para que los crons funcionen. En el plan Hobby, podés disparar el endpoint manualmente.

  4. Probar localmente

  curl -H "Authorization: Bearer TU_CRON_SECRET" \
    http://localhost:3000/api/cron/alerts
  Devuelve { ok: true, sent: N, skipped: N }.

  5. Ver ejecuciones en Vercel

  Panel → tu proyecto → Cron Jobs tab — muestra historial de ejecuciones y logs.

---

  Cómo funciona

  - Cron: corre todos los días a las 9:00 UTC
  - Vencimientos: busca contratos activos con endDate en los próximos 30 días → email rojo por
  contrato → Redis dedup (TTL 35 días)
  - Actualizaciones: busca contratos activos con nextUpdateDate en los próximos 7 días → email
  amarillo por contrato → Redis dedup (TTL 10 días, key incluye la fecha para que se re-dispare en
   el próximo ciclo)
  - Destinatario: email del inquilino si tiene, sino ALERT_EMAIL; si ninguno, se saltea con log

---

Pasos para activarlo:

  1. En GitHub → tu repo → Settings → Secrets and variables → Actions → New
  repository secret
    - APP_URL → https://tu-app.vercel.app
    - CRON_SECRET → el mismo valor que usaste en Vercel
  2. Pusheá el archivo. El workflow aparece en la pestaña Actions.
  3. Para probar sin esperar: Actions → Daily Alert Emails → Run workflow.

  Logs visibles en la misma pestaña. Gratis en todos los planes de GitHub.

---

RESEND_FROM: Sí, necesitás un dominio verificado. Sin verificación, Resend solo te deja enviar a onboarding@resend.dev (modo test).
                                                                                                                                                               
  CRON_SECRET: Lo generás vos. Es una contraseña que el cron usa para probar que es realmente tu cron y no un ataque. Generá uno con:                            openssl rand -hex 32                                                                                                                                           O cualquier string largo aleatorio. Luego lo ponés en:                                                                                                         - GitHub Actions: repo → Settings → Secrets and variables → Actions → CRON_SECRET                                                                            
  - O en .env.local si lo disparás manual                                                                                                                      

  Webhooks en Resend: NO necesitás. Los webhooks son para cuando Resend te notifica de bounces, clics, etc. Vos solo enviás y listo.

  ---
  Dominios en Argentina — 3 opciones

  ┌───────────────────────────────────────────┬─────────────────────┬───────────────────────────────────────┬────────────────────────────────────────┐
  │                 Proveedor                 │     Costo aprox     │             Setup Resend              │                 Notas                  │
  ├───────────────────────────────────────────┼─────────────────────┼───────────────────────────────────────┼────────────────────────────────────────┤
  │ NIC.ar (.com.ar, .org.ar, .net.ar)        │ $800-1500/año       │ 2 mins — DNS records                  │ La opción más argentina; requiere CUIT │
  ├───────────────────────────────────────────┼─────────────────────┼───────────────────────────────────────┼────────────────────────────────────────┤
  │ Namecheap (.com, .com.ar)                 │ $8-15 USD/año       │ 2 mins — DNS records                  │ Más barato; soporte rápido             │
  ├───────────────────────────────────────────┼─────────────────────┼───────────────────────────────────────┼────────────────────────────────────────┤
  │ Cloudflare Registrar (.com, .com.ar, etc) │ Similar a Namecheap │ 1 min — auto-integrado con Cloudflare │ Si usás Cloudflare ya, lo más fácil    │
  └───────────────────────────────────────────┴─────────────────────┴───────────────────────────────────────┴────────────────────────────────────────┘

  Más simple para Argentina: Namecheap ($12/año) → Resend → 2 DNS records y listo.

  Más "local": NIC.ar si querés .com.ar — pero requiere CUIT y es más lento el setup.

  ---
  Una vez comprés dominio:

  1. En Resend → Domains → Add domain → verificás DNS (2 records TXT)
  2. En .env.local:
  RESEND_FROM=RentAR <noreply@tudominio.com>
  3. Listo, los emails salen de tu dominio.