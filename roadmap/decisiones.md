# 📐 Decisiones de diseño

Registro de decisiones que se desvían del roadmap o que resuelven bifurcaciones de arquitectura. Cada entrada dice qué se decidió, por qué y qué se descartó, para que el roadmap y el código no queden desfasados.

---

## 1. Hashing: argon2id en vez de bcrypt (Fase 1.1)

**El roadmap decía bcrypt. Se implementó argon2id.**

- **Por qué:** argon2id es la recomendación actual de OWASP para password hashing: es memory-hard (resiste ataques con GPU/ASIC mucho mejor que bcrypt, que es de 1999 y solo CPU-hard).
- **Parámetros:** defaults del paquete `argon2` — `m=65536` (64 MiB), `t=3`, `p=4`. Verificados en los hashes almacenados (`$argon2id$v=19$m=65536,p=4,t=3...`).
- **Dónde vive el hash:** en `account.password` (provider `credentials`), no en `user`. Así un mismo usuario puede tener varios providers a futuro (Google, etc.) sin columnas muertas en `user`.

## 2. Documentación: Scalar en vez de Swagger UI

**Se reemplazó `SwaggerModule.setup('docs')` por `@scalar/nestjs-api-reference` en `/docs`.**

- **Por qué:** preferencia del autor (UI más moderna). El documento OpenAPI se sigue generando con `@nestjs/swagger` y los decoradores (`@ApiProperty`, `@ApiTags`); Scalar solo lo renderiza.
- **Efecto colateral (resuelto):** al migrar se había desactivado helmet (su CSP rompe el JS de Scalar). Ya se restauró con `helmet({ contentSecurityPolicy: false })`.
- Sigue postergado de Fase 0: `/docs` expuesto en todos los entornos (condicionar a dev o proteger antes de prod).

## 3. Auth: JWT simétrico (HS256) + tabla `refresh_token` propia (Fase 1.3/1.4)

**Decidido el 2026-07-27. El schema original era el de BetterAuth (auth por sesiones); se optó por JWT como dice el roadmap.**

- **Modelo:** access token corto firmado con `JWT_ACCESS_SECRET`, refresh token largo firmado con `JWT_REFRESH_SECRET` (ambos ya validados con zod, mínimo 64 chars). El refresh se guarda **hasheado (SHA-256)** en `refresh_token`, nunca en claro.
- **Rotación (1.4):** al rotar, el token viejo queda `revoked_at` + `replaced_by` apuntando al nuevo → cadena que permite detectar reuso de tokens robados.
- **Se eliminó:** la tabla `session` de BetterAuth (no aplica en un modelo JWT con refresh rotado).
- **Se descartó JWKS** (claves asimétricas estilo BetterAuth, tabla `jwks` + endpoint `/.well-known/jwks.json`): es la respuesta correcta cuando *otros servicios* verifican tus tokens (microservicios), pero en un monolito es complejidad sin beneficio. Si algún día se migra a microservicios, el cambio HS256 → JWKS queda contenido en el módulo auth.
- **Del schema de BetterAuth se conservan:** `user`, `account`, `verification`, `two_factor`.

## 4. HIBP: fail-open ante caídas (Fase 1.2)

**Si la API de Have I Been Pwned no responde, el registro continúa.**

- **Contexto:** el chequeo de password comprometido llama a un tercero en el path del registro (con k-anonymity: solo viajan 5 chars del SHA-1, header `Add-Padding: true`, timeout 3s).
- **Decisión:** fail-open + log `warn`. El control principal es `IsStrongPassword` del DTO; HIBP es un control adicional y no justifica tumbar el registro (disponibilidad) porque un tercero esté caído.
- **Alternativa descartada:** fail-closed (503). Revisar si algún día hay requisitos de compliance que lo exijan.

## 5. Fixtures locales y secretos de ejemplo aceptados (Fase 1)

**Decidido el 2026-08-01. El repositorio es un entorno de aprendizaje exclusivamente local; `peticiones.http` y `.env.example` priorizan poder levantar y probar la API sin configuración adicional.**

- **Contexto:** `peticiones.http` contiene datos y JWT de la base local de desarrollo; `.env.example` contiene secretos JWT deterministas de 64 caracteres que superan la validación de arranque.
- **Decisión:** se aceptan esos fixtures y secretos conocidos mientras el repositorio se use solo en desarrollo local. No se consideran secretos de producción ni se exige que la configuración rechace esos valores.
- **Consecuencia:** el proyecto no puede desplegarse ni compartirse como aplicación con datos reales sin sustituir esas credenciales y revisar su configuración de seguridad. Los hallazgos de exposición de secretos asociados a esos archivos no se mantienen en la revisión de Fase 1 bajo este alcance.
- **Alternativa descartada:** usar placeholders no aceptables en `.env.example`, impedir secretos conocidos en producción y retirar los JWT/credenciales de `peticiones.http`.
- **Referencias afectadas:** `peticiones.http`, `.env.example`, `src/infrastructure/config/env.validation.ts`.
