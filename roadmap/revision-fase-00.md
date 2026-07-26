# 🔍 Revisión profesional — Fase 0 (Fundaciones)

> Tercera pasada. Resueltos y verificados en runtime: filtro con formato completo en 500s, mensaje de validación formateado al boot, logger JSON solo en prod (patrón `bufferLogs` + `useLogger`, sin `process.env`), helmet + CORS + prefijo global `/api` (`/health` excluido), typo del roadmap, `'provision'` fuera del enum.
>
> **Quedan 2 ítems, ambos postergados a propósito.**

---

## ⏸️ Postergados (decisión del autor, no olvidar)

### 1. Swagger siempre expuesto (postergado)

Hoy `/docs` se monta en todos los entornos. Antes de cualquier deploy a prod:

```ts
if (appConfig.isDev) {
  SwaggerModule.setup('docs', app, documentFactory);
}
```

(o protegerlo con auth básica). No urgente en desarrollo.

### 2. Filter e interceptor sin tipar (a pensar)

- El filtro tiene un `eslint-disable` por `ctx.getRequest()` sin tipo → `ctx.getRequest<Request>()` (`express`) y desaparece el disable.
- El interceptor usa `req.originalUrl` (Express-only) con `req`/`res` como `any` → tipar con `Request`/`Response`.
- Decisión de fondo: hoy el filtro quedó agnóstico del adapter (sirve para Express y Fastify) pero el interceptor ata la app a Express. Si algún día se evalúa Fastify (performance), hay que rehacer el interceptor; si la app se queda en Express (lo probable), tipar todo y listo.

---

## ✅ Estado de la fase

Con lo resuelto hasta acá, la Fase 0 queda **aprobada**: los dos pendientes son mejoras conscientes, no deudas que bloqueen Fase 1.
