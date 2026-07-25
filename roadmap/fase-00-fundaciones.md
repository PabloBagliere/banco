# FASE 0 — Fundaciones e infraestructura

**Objetivo:** dejar el proyecto parado sobre bases sólidas antes de escribir negocio.

## Tareas

- [x] 0.1 Definir estructura de carpetas (`modules/`, `common/`, `infrastructure/`) y borrar los archivos de ejemplo (`app.controller`, `app.service`).
- [x] 0.2 `docker-compose.yml` con **PostgreSQL** y **Redis**.
- [x] 0.3 **ConfigModule** global (`@nestjs/config`) con `.env` y **validación del env** al arrancar (Joi o Zod): `DATABASE_URL`, `JWT_SECRET`, `REDIS_HOST`, `DAILY_LIMIT_ARS`, etc. Si falta una variable, la app no levanta.
- [x] 0.4 Conexión a DB (TypeORM/Prisma) con configuración cargada desde un servicio de config tipado (no `process.env` suelto por el código).
- [x] 0.5 `ValidationPipe` **global** (whitelist, transform, forbidNonWhitelisted).
- [x]d 0.6 **Exception Filter global** que devuelva formato de error consistente: `{ statusCode, message, error, timestamp, path }`.
- [x] 0.7 **Interceptor** de logging (método, ruta, duración) y/o de respuesta.
- [x] 0.8 Swagger (`@nestjs/swagger`) montado en `/docs`.

## ✅ Criterios de aceptación

- `docker compose up -d` levanta Postgres + Redis y la app conecta.
- Falta una env var → la app falla al boot con mensaje claro.
- Cualquier error HTTP sale en el formato estándar del filtro.
- Swagger visible en `/docs`.

## Conceptos que se practican

`ConfigModule` · validación de configuración · `ValidationPipe` · Exception Filters · Interceptors · Swagger
