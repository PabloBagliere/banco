# FASE 7 — Cards

**Objetivo:** módulo extra para reforzar el patrón ya aprendido.

## Tareas

- [ ] 7.1 Entidad `Card`: número (mock), `accountId`, `type` (`DEBIT | CREDIT`), `status` (`ACTIVE | BLOCKED`), `spentLimit`.
- [ ] 7.2 Commands: `IssueCardCommand`, `BlockCardCommand`, `UnblockCardCommand`. Query: `GetCardsQuery`.
- [ ] 7.3 Endpoints: `POST /cards`, `GET /cards`, `POST /cards/:id/block`, `POST /cards/:id/unblock`.
- [ ] 7.4 Regla: no emitir tarjeta de cuenta `FROZEN`/`CLOSED`; solo el dueño opera sus tarjetas.

## ✅ Criterios de aceptación

- CRUD de tarjetas funcionando con ownership y reglas de estado.
- Mismo patrón CQRS que accounts/transfers (nada de lógica en controllers).

## Conceptos que se practican

Consolidación del patrón CQRS completo en un módulo nuevo, sin andamiaje previo.
