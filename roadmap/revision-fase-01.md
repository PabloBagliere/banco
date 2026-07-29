# 🔍 Revisión profesional — Fase 1, puntos 1.1 y 1.2 (Users & Register)

> **Actualizado 2026-07-29.** 1.1 y 1.2 **cerrados** ✅ — todos los hallazgos de las tres pasadas fueron resueltos. Este documento solo lista lo pendiente.

---

## ⏳ Pendiente

### 🟠 Módulo `users` (antes de 1.5)

Todo vive en `modules/auth` (entidades incluidas). 1.5 (`@CurrentUser`), 1.6 (`RolesGuard`) y 1.7 (`/auth/me`) necesitan un `UsersService` con `findById`/`findByEmail`. Si se crea dentro de `auth`, el módulo se vuelve un god-module; si se crea después, hay que mover las entidades y rehacer imports.

**Recomendación**: crear `modules/users` ahora (mover `user.entity.ts` + `UsersService` con `findByEmail`, `existsByEmail`, `create`), y que `AuthModule` lo consuma. Es el diseño que el roadmap asume en todas las fases siguientes (accounts, audit, admin cuelgan de users, no de auth).

### 1.3/1.4 — Login + refresh token

- `login.dto.ts` creado; config JWT lista (secrets y expiraciones validadas con zod, getters en `AppConfig`).
- Falta: instalar `@nestjs/jwt` e implementar login + rotación de refresh (modelo ya decidido: JWT HS256 + tabla `refresh_token`, ver `roadmap/decisiones.md` #3).

### Postergados de Fase 0 (no olvidar)

- `/docs` expuesto en todos los entornos (condicionar a dev o proteger antes de prod).
- Filter e interceptor sin tipar (los 11 errores de lint actuales).

---

## 🔵 Notas para fases posteriores

- **Tabla `"user"` es palabra reservada en Postgres**: TypeORM la quotea y funciona, pero en queries crudos o migraciones a mano hay que acordarse siempre de las comillas. Renombrar a `"users"` es una opción; quedarse así también, siendo conscientes.
- **1.8 (no serializar password)**: el password vive en `account`, no en `user`. Ojo al devolver `User` con `relations: ['accounts']` (en 1.7 `/auth/me`, por ejemplo): el hash saldría por la respuesta. Resolver con response DTO o `@Exclude`.
- **YAGNI**: `two_factor` y `verification` están migradas sin uso todavía.
