# FASE 1 — Auth & Users

**Objetivo:** registro, login y protección de rutas. Todo lo demás cuelga de acá.

## Tareas

- [ ] 1.1 Módulo `users`: entidad `User` (email único, password hasheado con bcrypt, nombre, role `USER | ADMIN`).
- [ ] 1.2 `POST /auth/register` con DTO validado (email válido, password mínimo, etc.).
- [ ] 1.3 `POST /auth/login` → devuelve **access token** (corto) + **refresh token** (largo).
- [ ] 1.4 `POST /auth/refresh` → rota el refresh token.
- [ ] 1.5 `JwtAuthGuard` global o por ruta + decorador `@CurrentUser()` (param decorator custom).
- [ ] 1.6 `RolesGuard` + decorador `@Roles('ADMIN')` (se usa después en audit/admin).
- [ ] 1.7 `GET /auth/me` → perfil del usuario autenticado.
- [ ] 1.8 Password nunca se serializa en respuestas (`class-transformer` `@Exclude` o similar).

## ✅ Criterios de aceptación

- No se puede registrar dos veces el mismo email (409).
- Login con password malo → 401. Ruta protegida sin token → 401, con token → 200.
- El hash de la password no aparece en ninguna respuesta.
- Refresh token inválido → 401.

## Conceptos que se practican

Guards · decoradores custom (`@CurrentUser`, `@Roles`) · JWT (access + refresh) · DTOs con `class-validator` · serialización
