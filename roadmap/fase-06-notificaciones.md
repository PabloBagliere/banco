# FASE 6 — Notificaciones con BullMQ

**Objetivo:** procesos asíncronos reales con colas.

## Tareas

- [ ] 6.1 Módulo `notifications` con BullMQ sobre Redis: cola `notifications` y producer/consumer separados.
- [ ] 6.2 Al ocurrir `TransferCompletedEvent`, `AccountFrozenEvent`, `FraudDetectedEvent`, `ScheduledTransferExecutedEvent` → se encola un job (email/SMS/push mock: loguea o guarda en tabla `notifications`).
- [ ] 6.3 Reintentos con backoff (ej. 3 intentos) y manejo de jobs fallidos.
- [ ] 6.4 `GET /notifications` (mis notificaciones, paginado) y marcado como leída.
- [ ] 6.5 (Opcional) Bull Board en `/queues` para ver la cola.

## ✅ Criterios de aceptación

- Transferir → aparece notificación del destinatario sin que el request de transferencia espere al "envío".
- Matar Redis → la API sigue respondiendo (el encolado falla controlado o se documenta el comportamiento).
- Job que falla → reintenta según config y termina en failed, visible.

## Conceptos que se practican

`@nestjs/bullmq` (queues, processors, jobs) · retries con backoff · producer/consumer · asincronía desacoplada del request HTTP
