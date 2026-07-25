# FASE 2 — Accounts (núcleo CQRS)

**Objetivo:** el corazón del banco con CQRS de verdad (no controllers llamando services).

## Tareas

- [ ] 2.1 Entidad `Account`: `id`, `userId`, `cbu` (22 dígitos, único, generado), `alias` (único, formato `palabra.palabra.palabra`, editable), `currency` (ARS/USD), `type`, `tier`, `status` (`ACTIVE | FROZEN | CLOSED`), `balance`.
- [ ] 2.2 Módulo con `CqrsModule` y handlers separados:
  - **Commands:** `OpenAccountCommand`, `DepositMoneyCommand`, `WithdrawMoneyCommand`, `FreezeAccountCommand`, `UnfreezeAccountCommand`, `CloseAccountCommand`, `UpdateAliasCommand`.
  - **Queries:** `GetAccountQuery`, `GetBalanceQuery`, `GetAccountsByUserQuery`, `GetStatementQuery`, `GetTransactionsQuery`.
- [ ] 2.3 Endpoints REST (el controller solo despacha al `CommandBus`/`QueryBus`):

  ```
  POST   /accounts
  GET    /accounts
  GET    /accounts/:id
  GET    /accounts/:id/balance
  GET    /accounts/:id/statement?from&to&page&limit
  PATCH  /accounts/:id/alias
  POST   /accounts/:id/deposit
  POST   /accounts/:id/withdraw
  POST   /accounts/:id/freeze
  POST   /accounts/:id/unfreeze
  POST   /accounts/:id/close
  ```

- [ ] 2.4 Reglas: saldo nunca negativo; `FROZEN` no debita; `CLOSED` no opera; no cerrar cuenta con saldo ≠ 0; alias/CBU únicos.
- [ ] 2.5 **Ownership**: un usuario solo toca sus cuentas (verificación en guard o en el handler → 403/404).
- [ ] 2.6 Eventos CQRS: `AccountOpenedEvent`, `MoneyDepositedEvent`, `MoneyWithdrawnEvent`, `AccountFrozenEvent`, `AccountClosedEvent` (por ahora solo log/handler interno; se enganchan a audit y notifications en fases 5 y 6).
- [ ] 2.7 Montos: usar **centavos enteros** (bigint/integer) o `decimal`, nunca `float`. Validar `amount > 0` con pipes/DTO.

## ✅ Criterios de aceptación

- Flujo completo: abrir cuenta → depositar → retirar → saldo correcto en `GET /balance`.
- Retirar más que el saldo → 400/409 y el saldo no cambia.
- Cuenta congelada no puede retirar; cuenta cerrada no acepta nada.
- CBU y alias únicos (repetido → 409).
- Usuario A no puede ver ni operar la cuenta de usuario B.
- No hay lógica de negocio en controllers: solo `commandBus.execute(...)` / `queryBus.execute(...)`.

## Conceptos que se practican

`@nestjs/cqrs` (CommandBus, QueryBus, EventBus) · separación comando/consulta · reglas de dominio en handlers · ownership con Guards · modelado de dinero sin floats
