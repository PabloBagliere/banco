# FASE 4 — Reglas avanzadas de negocio

**Objetivo:** los features "de banco real".

## Tareas

- [ ] 4.1 **Multi-moneda**: transferir ARS → cuenta USD (o viceversa) aplica conversión con un `ExchangeRateProvider` (interface en `infrastructure/`, implementación mock con rates configurables por env). La transferencia registra monto origen, monto destino y rate usado.
- [ ] 4.2 **Cuentas premium**: `tier = PREMIUM` (upgrade con `UpgradeAccountCommand` o al abrir). Beneficios: límite diario mayor y transferencias sin comisión (standard puede tener comisión configurable en ARS).
- [ ] 4.3 **Transferencias programadas**: entidad `ScheduledTransfer` (`executeAt`, `recurrence: NONE | DAILY | WEEKLY | MONTHLY`, status). Endpoints `POST /transfers/scheduled`, `GET /transfers/scheduled`, `DELETE /transfers/scheduled/:id`.
- [ ] 4.4 **Scheduler** (`@nestjs/schedule`): cron cada minuto busca programadas vencidas y despacha `TransferMoneyCommand`; actualiza estado y reprograma si es recurrente.
- [ ] 4.5 **Reversar**: `POST /transfers/:id/reverse` → `ReverseTransferCommand`. Solo si `COMPLETED`, dentro de la ventana (ej. 24h, configurable), y con fondos disponibles en destino. Crea movimientos compensatorios y marca la original `REVERSED`. No se puede reversar dos veces ni reversar una reversa.
- [ ] 4.6 **Bloqueo por fraude**: regla detectora (ej. > 5 transferencias en 10 min, o monto > umbral por tier). Al detectar: publica `FraudDetectedEvent` → handler congela la cuenta (`status = FROZEN`, motivo `FRAUD`) y registra el caso. Endpoint admin para revisar/desbloquear.
- [ ] 4.7 Congelar manual (admin) ya existe de la fase 2: unificar motivo (`reason: MANUAL | FRAUD`).

## ✅ Criterios de aceptación

- Transferencia ARS→USD acredita el monto convertido según el rate mockeado y guarda el rate.
- Premium tiene límite diario mayor que standard (verificable por API/tests).
- Una programada con `executeAt` en el pasado se ejecuta en el próximo tick del cron y genera su transferencia real.
- Reversa válida devuelve los fondos y deja trazabilidad (movimientos + estados).
- Disparar la regla de fraude congela la cuenta automáticamente y las operaciones posteriores fallan.

## Conceptos que se practican

`@nestjs/schedule` (cron) · providers con interface (Strategy) · eventos como disparadores de reglas · comisiones y tiers · ventanas temporales de negocio
