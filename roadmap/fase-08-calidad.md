# FASE 8 — Calidad y pulido final

**Objetivo:** dejar el proyecto en estado "presentable como portfolio".

## Tareas

- [ ] 8.1 Tests unitarios de handlers críticos (transfer, withdraw, reverse, límite diario) con repos mockeados.
- [ ] 8.2 Tests e2e de los flujos principales: register → login → abrir cuenta → depositar → transferir → reverse.
- [ ] 8.3 Swagger completo: DTOs documentados, auth con bearer, ejemplos.
- [ ] 8.4 Paginación estándar en todos los listados (`page`, `limit`, `total`).
- [ ] 8.5 Health check (`@nestjs/terminus`): `/health` verifica DB y Redis.
- [ ] 8.6 Rate limiting (`@nestjs/throttler`) en login y transferencias.
- [ ] 8.7 README final: cómo levantar todo, variables de entorno, endpoints principales.

## ✅ Criterios de aceptación

- `pnpm test` y `pnpm test:e2e` verdes.
- Swagger usable para probar todo el flujo sin Postman.
- `docker compose up` + `pnpm start:dev` levanta el sistema completo desde cero.

## Conceptos que se practican

Testing unitario y e2e en NestJS · `@nestjs/terminus` · `@nestjs/throttler` · documentación de API · DX del proyecto
