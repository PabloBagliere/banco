# FASE 5 — Auditoría

**Objetivo:** cada acción sensible queda registrada, sin acoplar el negocio al log.

## Tareas

- [ ] 5.1 Entidad `AuditLog`: `id`, `userId`, `action`, `entity`, `entityId`, `metadata` (json), `ip`, `createdAt`.
- [ ] 5.2 Implementación basada en **eventos**: los handlers de audit escuchan (`@nestjs/event-emitter` o events de CQRS) `AccountOpened`, `TransferCompleted`, `AccountFrozen`, `FraudDetected`, login, etc. → persisten en `audit_log`.
- [ ] 5.3 Interceptor o middleware que capture `ip` y `userId` y los ponga en contexto (AsyncLocalStorage o payload del evento).
- [ ] 5.4 Endpoints de consulta (solo `ADMIN`): `GET /audit?userId&action&from&to` paginado.

## ✅ Criterios de aceptación

- Hacer login, abrir cuenta, transferir y congelar → aparecen 4+ filas en audit con usuario, acción e IP.
- Usuario normal → 403 en `/audit`; admin → 200.
- Si falla la escritura de audit, no rompe la operación de negocio (o sí, decisión documentada).

## Conceptos que se practican

`@nestjs/event-emitter` · desacople por eventos · contexto de request (AsyncLocalStorage) · autorización por roles
