# 🗺️ Roadmap — Banco API

Plan de trabajo por fases. Cada fase tiene su propio archivo con tareas y **criterios de aceptación** (lo que el agente revisor verifica antes de pasar a la siguiente).

> Regla de oro: no arrancar la fase N+1 sin tener la N revisada y aprobada.

## Progreso general

| Fase | Tema | Estado |
|------|------|--------|
| [0](fase-00-fundaciones.md) | Fundaciones e infraestructura | ⬜ |
| [1](fase-01-auth-users.md) | Auth & Users | ⬜ |
| [2](fase-02-accounts.md) | Accounts (núcleo CQRS) | ⬜ |
| [3](fase-03-transactions-transfers.md) | Transactions & Transfers | ⬜ |
| [4](fase-04-reglas-avanzadas.md) | Reglas avanzadas de negocio | ⬜ |
| [5](fase-05-auditoria.md) | Auditoría | ⬜ |
| [6](fase-06-notificaciones.md) | Notificaciones con BullMQ | ⬜ |
| [7](fase-07-cards.md) | Cards | ⬜ |
| [8](fase-08-calidad.md) | Calidad y pulido final | ⬜ |

## Dependencias entre fases

```
0 (fundaciones)
└── 1 (auth)
    └── 2 (accounts)          ← núcleo CQRS
        └── 3 (transfers)
            └── 4 (reglas avanzadas)
                └── 5 (audit) ──→ 6 (notifications)
                                    └── 7 (cards)
                                        └── 8 (calidad)
```

Las fases 5, 6 y 7 son semi-independientes entre sí, pero todas consumen los eventos que ya emiten las fases 2–4.

## Cómo revisar con el agente

Cuando termines una fase, pedile al agente:

> *"Revisá la fase N: leé `roadmap/fase-NN-*.md` y verificá cada criterio de aceptación contra el código. Reportame qué pasa, qué falla y qué falta."*
