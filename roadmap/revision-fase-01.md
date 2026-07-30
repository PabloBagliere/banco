# 🔍 Revisión profesional — Fase 1 (Auth & Users)

> **Actualizado 2026-07-30.** Revisión estática de 1.3 (código + build + lint, sin runtime). Este documento lista **solo lo que falta**.

---

## 🟡 Menores

- **Sentinelas en login**: `'Not Ip'` / `'Not Agent'` ensucian columnas nullable que después alimentan auditoría (Fase 5) → `?? null`. Bonus: `request.ip` requiere `trust proxy` si algún día hay un proxy adelante; o usar el decorador `@Ip()` de Nest.
- **`users.service.spec.ts` roto**: instancia `UsersService` sin mockear los dos repositorios → falla la inyección al correr `pnpm test`. Mockear o borrar hasta Fase 8.
- **Throttler global (10 req/min por IP)** cubre `/auth/login` y `/auth/register` → al probar a mano es fácil comerse un 429. En Fase 8 evaluar límites por ruta.
- **Naming token/verify**: el email manda `?token=` pero el DTO espera `{ verify }`. Funciona si el front lo mapea, pero conviene unificar el nombre.

## ⏳ Pendiente de la fase

- **1.4 `POST /auth/refresh`** (base ya lista: SHA-256 + `jti` + `revoked_at`/`replaced_by`):
  1. Verificar firma con `JWT_REFRESH_SECRET` y buscar por `tokenHash` (lookup indexado).
  2. Rechazar si `revoked_at` o `expires_at` vencido → 401.
  3. Rotar: viejo queda `revoked_at` + `replaced_by` → nuevo.
  4. **Reuso detectado** (llega un token ya revocado) → revocar toda la cadena del usuario.
- **1.5** `JwtAuthGuard` + `@CurrentUser()` · **1.6** `RolesGuard` + `@Roles('ADMIN')` · **1.7** `GET /auth/me` · **1.8** password nunca se serializa.

## ⏸️ Postergados de Fase 0 (no olvidar)

- `/docs` expuesto en todos los entornos (condicionar a dev o proteger antes de prod).
- Filter e interceptor sin tipar (los 11 errores de lint restantes).

---

## 🔵 Notas para fases posteriores

- **Tabla `"user"` es palabra reservada en Postgres**: TypeORM la quotea y funciona, pero en queries crudos o migraciones a mano hay que acordarse siempre de las comillas. Renombrar a `"users"` es una opción; quedarse así también, siendo conscientes.
- **1.8 (no serializar password)**: el password vive en `account`, no en `user`. Ojo al devolver `User` con `relations: ['accounts']` (en 1.7 `/auth/me`, por ejemplo): el hash saldría por la respuesta. Resolver con response DTO o `@Exclude`.
- **YAGNI**: `two_factor` y `verification` están migradas; `TwoFactor` además está registrado en `AuthModule.forFeature` sin uso — sacarlo de ahí hasta que se use.
- **Limpieza de `refresh_token`**: la tabla crece sin tope (un row por login). Anotar un job de purga de expirados para Fase 8 (calidad) o cuando haya cron.
- **Rol congelado en el access token**: un cambio de rol no se refleja hasta el próximo login. Aceptable con access tokens cortos, pero tenerlo presente en 1.6.
