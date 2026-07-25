# 🏦 Banco API — Backend bancario con NestJS + CQRS

Proyecto de aprendizaje: un backend bancario **lo más real posible** (modelo argentino: CBU, alias, ARS/USD) construido con NestJS y arquitectura **CQRS**.

La idea es implementar cada fase **a mano** para aprender, y después pedirle a un agente que revise el punto contra los **criterios de aceptación** definidos en el roadmap.

## 📋 Roadmap

El plan de trabajo completo, fase por fase, está en **[roadmap/README.md](roadmap/README.md)**.

## Stack objetivo

- **NestJS 11** (TypeScript)
- **CQRS** (`@nestjs/cqrs`) — Commands / Queries / Events
- **PostgreSQL** + TypeORM (o Prisma, a elección en Fase 0)
- **Redis** + **BullMQ** — colas para notificaciones y procesos async
- **JWT** — auth con access + refresh tokens
- `@nestjs/config`, `@nestjs/schedule`, `@nestjs/event-emitter`
- `class-validator` + `class-transformer`
- Docker Compose (Postgres + Redis)

## Conceptos de NestJS que se practican

Guards · Pipes · Validation · Exception Filters · Interceptors · CQRS · EventEmitter · Scheduler (cron) · BullMQ · ConfigModule · Swagger · Testing (unit + e2e)

## Estructura objetivo

```
src/
├── modules/
│   ├── auth/            # register, login, refresh, guards JWT
│   ├── users/           # entidad usuario (dueño de cuentas)
│   ├── accounts/        # cuentas, saldo, CBU/alias, freeze, cierre
│   │   ├── commands/    # OpenAccountCommand, DepositMoneyCommand, ...
│   │   ├── queries/     # GetBalanceQuery, GetAccountQuery, ...
│   │   ├── events/      # AccountOpenedEvent, AccountFrozenEvent, ...
│   │   ├── dto/
│   │   └── entities/
│   ├── transfers/       # transferencias, estados, reversas, programadas
│   ├── transactions/    # libro mayor: movimientos (débito/crédito)
│   ├── cards/           # emisión, bloqueo, límites de tarjetas
│   ├── audit/           # audit log de todo lo que pasa
│   └── notifications/   # colas BullMQ: email/SMS (mock)
├── common/              # guards, filters, interceptors, pipes, decorators, exceptions
└── infrastructure/      # database, config, providers externos (fx rates)
```

## Reglas de negocio (modelo argentino)

- Toda cuenta tiene **CBU** (22 dígitos numéricos, único) y **alias** editable (`gato.perro.casa`).
- Monedas: **ARS** y **USD** (una cuenta = una moneda).
- Tipos: `CAJA_AHORRO` / `CUENTA_CORRIENTE`. Tiers: `STANDARD` / `PREMIUM`.
- **Límite diario** de transferencias por tier (premium > standard, configurable por env).
- Cuenta `FROZEN` no puede debitar ni hacer transferencias salientes.
- **Bloqueo por fraude**: regla automática (ej. > N transferencias en X minutos o monto > umbral) congela la cuenta y notifica.
- Transferencias con ciclo de vida: `PENDING → COMPLETED / FAILED`, y `REVERSED`.
- **Reversa**: solo dentro de una ventana de tiempo y si está `COMPLETED`; genera movimiento compensatorio.
- **Transferencias programadas**: se ejecutan vía cron.
- Todo evento relevante queda en **auditoría** y dispara **notificación** async.

## Cómo trabajar cada punto

1. Leer el objetivo de la fase en [roadmap/](roadmap/README.md).
2. Implementar **sin mirar soluciones**, a tu manera.
3. Verificar manualmente los **criterios de aceptación** de esa fase.
4. Pedir al agente: *"revisá la FASE N contra los criterios de aceptación de roadmap/fase-NN-*.md"* → corregir lo que marque.
5. Marcar los checkboxes y recién ahí pasar a la siguiente fase.

## Setup rápido (cuando esté implementado)

```bash
docker compose up -d      # Postgres + Redis
pnpm install
pnpm start:dev            # API en :3000, docs en /docs
pnpm test && pnpm test:e2e
```
