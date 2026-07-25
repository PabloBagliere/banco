# FASE 3 — Transactions (libro mayor) & Transfers

**Objetivo:** dinero moviéndose entre cuentas, con trazabilidad total.

## Tareas

- [ ] 3.1 Entidad `Transaction` (movimiento): `id`, `accountId`, `type` (`DEBIT | CREDIT`), `amount`, `currency`, `balanceAfter`, `referenceId` (transferId), `description`, `createdAt`. Toda operación que toca saldo deja movimiento.
- [ ] 3.2 Entidad `Transfer`: `id`, `fromAccountId`, `toAccountId`, `amount`, `currency`, `status` (`PENDING | COMPLETED | FAILED | REVERSED`), `idempotencyKey`, timestamps.
- [ ] 3.3 `TransferMoneyCommand` + handler: resuelve destino por **alias o CBU**, valida (cuentas activas, saldo, moneda), **ejecuta en transacción de DB** (débito + crédito + 2 movimientos + transfer `COMPLETED`, todo o nada).
- [ ] 3.4 **Idempotencia**: `POST /transfers` acepta header `Idempotency-Key`; reintentar con la misma key devuelve la misma transferencia, no duplica.
- [ ] 3.5 Endpoints:

  ```
  POST /transfers          # body: { toAlias | toCbu, amount, description }
  GET  /transfers          # historial (paginado, filtros por estado/fecha)
  GET  /transfers/:id      # detalle + estado actual
  GET  /accounts/:id/transactions
  ```

- [ ] 3.6 Queries: `GetTransferHistoryQuery`, `GetTransferByIdQuery`, `GetTransactionsQuery`.
- [ ] 3.7 Eventos: `TransferCompletedEvent`, `TransferFailedEvent`.
- [ ] 3.8 **Límite diario**: sumar transferencias del día de la cuenta origen; si supera el límite del tier → 409 (`DailyLimitExceededException` custom). Tests de borde (justo en el límite).
- [ ] 3.9 `GetStatementQuery` real: extracto con rango de fechas y paginación.

## ✅ Criterios de aceptación

- Transferencia válida: origen debita, destino acredita, ambos movimientos existen, estados y `balanceAfter` correctos.
- Fallo a mitad (simular) → rollback total: no queda débito huérfano.
- Misma `Idempotency-Key` dos veces → una sola transferencia.
- Superar el límite diario → 409; al día siguiente vuelve a funcionar (o mockear reloj en test).
- Transferir a alias inexistente → 404; a cuenta propia → 400.
- El historial y el estado de cada transferencia se pueden consultar.

## Conceptos que se practican

Transacciones de DB (atomicidad) · idempotency keys · máquina de estados · excepciones de dominio custom · paginación y filtros · CQRS events
