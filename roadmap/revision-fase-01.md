# 🔍 Revisión profesional — Fase 1, puntos 1.1 y 1.2 (Users & Register)

> **Segunda pasada (2026-07-27).** Resueltos y verificados en runtime: #5 (role enum en TS + Postgres, migración reescrita a mano con `USING`), #7 (HIBP con timeout 3s, `Add-Padding`, fail-open + log, rename a `isPasswordPwned`, pwned → 400), #9 (límites y formato en DTOs, ejemplos en Scalar, `@ApiTags`), #10 (hash fuera de la transacción, `exists()`, return types). #3 resuelto por decisión: **JWT HS256 + tabla `refresh_token`** (schema ya aplicado: `session` eliminada, `refresh_token` creada y migrada; ver `roadmap/decisiones.md`).
>
> **⏸️ Estado: pausado por el autor, se retoma después.** Pendientes:
>
> - 🔴 #1 — casing de email (`@Transform` lowercase + índice único sobre `lower(email)`)
> - 🔴 #2 — race condition → mapear `QueryFailedError` código `23505` a 409
> - 🟠 #4 — módulo `users` (crearlo antes de 1.5)
> - 🟠 #6 — restaurar helmet con CSP compatible con Scalar
> - 1.3/1.4 — implementación propia del autor (tablas listas; falta instalar `@nestjs/jwt`)
>
> ---
>
> Primera pasada. Revisión de código + verificación en runtime (app booteada contra Postgres en Docker, endpoints ejercitados con curl, estado inspeccionado con psql).
>
> **Veredicto: happy path aprobado, pero hay 2 hallazgos rojos que violan criterios de aceptación. Corregir antes de arrancar 1.3.**

---

## ✅ Lo que está bien (verificado en runtime)

- **Validación del DTO funciona**: password débil → 400, email inválido → 400, campo extra (`role` inyectado) → 400 por `forbidNonWhitelisted`. No hay mass-assignment: el rol sale hardcodeado del service, no del body.
- **409 en duplicados secuenciales**: email y username repetidos devuelven `ConflictException` con mensaje claro.
- **HIBP (Have I Been Pwned)**: implementado correctamente con k-anonymity (SHA-1 local, se envían solo 5 chars del prefijo). Verificado: `Password1!` (pasa `IsStrongPassword` pero está filtrado) → rechazado.
- **Hashing**: `argon2id` con parámetros sanos (`m=65536, t=3, p=4`), verificado en DB. Mejor que el bcrypt que pedía el roadmap — desviación a favor.
- **Transacción user + account**: atómica, con `DataSource.transaction`. Correcto.
- **Migración consistente con las entidades**: snake_case, `timestamptz`, FKs con `ON DELETE CASCADE`, índices. El pipeline de migraciones de Fase 0 sigue firme (`synchronize: false`, `migrationsRun: true`).
- **Build limpio** y sin errores de lint en los archivos nuevos (los 11 errores de lint son los ya postergados de Fase 0: filter e interceptor).

---

## 🔴 Hallazgos bloqueantes

### 1. El email se puede registrar dos veces cambiando mayúsculas

El criterio de aceptación *"No se puede registrar dos veces el mismo email (409)"* **falla**. Verificado:

```
POST {"email":"pablo.test@example.com", ...} → 201
POST {"email":"PABLO.TEST@example.com", ...} → 201   ← mismo email, otro usuario
```

En la DB quedaron las dos filas. La unique constraint de Postgres sobre `text` es case-sensitive y el `checkEmail` también. En un banco esto es grave: dos cuentas "distintas" con el mismo email real.

**Fix (defensa en capas, las dos cosas):**

```ts
// register.dto.ts — normalizar antes de validar
@Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
@IsEmail()
email!: string;
```

```sql
-- y a nivel DB, para que ningún path futuro lo rompa:
CREATE UNIQUE INDEX user_email_lower_uidx ON "user" (lower(email));
-- (o migrar la columna a CITEXT)
```

Lo mismo aplica a `username`.

### 2. Race condition: dos requests concurrentes con el mismo email → 500

Verificado: disparé dos registros simultáneos con el mismo email → `201` + **`500 Internal Server Error`**. El log muestra `QueryFailedError: duplicate key value violates unique constraint` sin mapear. El patrón check-then-act (`checkEmail` → `save`) tiene una ventana de carrera: la única garantía real es la constraint de la DB, y hoy esa violación escapa como 500.

**Fix**: capturar el error de constraint y mapearlo a 409:

```ts
import { QueryFailedError } from 'typeorm';

try {
  await this.dataSource.transaction(async (manager) => { ... });
} catch (error) {
  if (
    error instanceof QueryFailedError &&
    (error.driverError as { code?: string }).code === '23505'
  ) {
    throw new ConflictException('Email or username already exists');
  }
  throw error;
}
```

(Ojo: con el `detail` del driverError podés discriminar si chocó `email` o `username`.) Los checks previos quedan como fast-path para el caso común, pero la constraint es la fuente de verdad.

---

## 🟠 Hallazgos importantes (decidir/corregir en esta fase)

### 3. El schema es BetterAuth, el roadmap es JWT — hay una decisión de arquitectura pendiente

Las entidades (`user`, `account`, `session`, `verification`, `two_factor` con esas columnas exactas) son el schema de **BetterAuth**, que es auth *basada en sesiones*. El roadmap (1.3/1.4) pide **JWT access + refresh token**. Hoy conviven las dos señales y en 1.3 hay que elegir:

- **JWT stateless (roadmap)**: la tabla `session` sobra; los refresh tokens rotados se pueden guardar en `account` o una tabla `refresh_token`.
- **Sesiones opacas (lo que sugiere el schema)**: hay que reescribir 1.3–1.5 del roadmap (no habría `JwtAuthGuard` sino un guard de sesión).

No es un error de código, es una bifurcación que hay que resolver **antes** de 1.3, no durante. Si la idea era "uso el schema de BetterAuth pero implemento la lógica yo" (válido como ejercicio), igual hay que decidir el modelo de token.

### 4. No existe el módulo `users` que pedía 1.1

Todo vive en `modules/auth` (entidades incluidas). Problema práctico inmediato: 1.5 (`@CurrentUser`), 1.6 (`RolesGuard`) y 1.7 (`/auth/me`) necesitan un `UsersService` con `findById`/`findByEmail`. Si se crea dentro de `auth`, el módulo se vuelve un god-module; si se crea después, hay que mover las entidades y rehacer imports.

**Recomendación**: crear `modules/users` ahora (mover `user.entity.ts` + `UsersService` con `findByEmail`, `existsByEmail`, `create`), y que `AuthModule` lo consuma. Es el diseño que el roadmap asume en todas las fases siguientes (accounts, audit, admin cuelgan de users, no de auth).

### 5. `role` es `text` nullable, no el enum `USER | ADMIN` que pedía 1.1

```ts
@Column({ type: 'text', nullable: true })
role!: string | null;   // el 'USER' lo pone el service a mano
```

Sin enum en TS ni en DB, sin default, y nullable. Cualquier string entra. El `RolesGuard` de 1.6 va a comparar contra esto. **Fix**:

```ts
export enum UserRole { USER = 'USER', ADMIN = 'ADMIN' }

@Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
role!: UserRole;
```

(enum de Postgres vía migración — TypeORM lo genera solo con `migration:generate`.)

### 6. Regresión de Fase 0: helmet quedó desactivado

En el diff de "fase 1 iniciada": `// app.use(helmet())`. Casi seguro pasó al migrar de Swagger UI a Scalar (el CSP de helmet rompe `/docs`). El fix no es apagar helmet, es ajustar CSP:

```ts
app.use(helmet({ contentSecurityPolicy: false })); // o CSP fino solo para /docs
```

Fase 0 quedó aprobada *con* helmet; hay que restaurarlo.

### 7. HIBP es un punto de fallo sin red de seguridad

`checkPassword` llama a una API externa en el path crítico del registro sin `try/catch` y con `HttpModule` sin `timeout` (axios default: **sin timeout**). Si HIBP cae o se cuelga, el registro devuelve 500 o queda colgado. Además falta el header `Add-Padding: true`, que HIBP recomienda oficialmente para privacidad (hoy el largo de la respuesta filtra info).

**Fix**: `HttpModule.register({ timeout: 3000 })`, header `Add-Padding: true`, y una política explícita ante fallo: fail-open (log warning + dejar pasar) o fail-closed (503). Para un banco, fail-open con alerta es razonable; lo que no es razonable es que no sea una decisión.

Bonus semántico: password comprometido devuelve **409**. Es un 400/422, no un conflicto de recursos. Y el método se llama `checkPassword` pero no chequea el password: renombrar a `isPasswordPwned` o `assertPasswordNotCompromised`.

---

## 🟡 Mejoras (no bloquean, pero anotarlas)

### 8. El register devuelve `{ message: 'Todo ok' }`

No es una respuesta de API seria: ni el recurso creado, ni un contrato estable, y mezcla idiomas (mensajes de error en inglés, esto en español informal). Convención habitual: **201 + el usuario serializado** (sin password — conecta con 1.8) o 201 vacío con header `Location`. Definir el contrato ahora, porque 1.3 (login) va a heredar el estilo.

### 9. DTO: límites y normalización

- `username` con `@MinLength(8)`: inusual para un username (y el roadmap ni siquiera lo pedía). Si se queda, bajar a 3–4 y agregar formato (`@Matches(/^[a-z0-9_]+$/)`).
- Falta `@MaxLength` en **todos** los campos (`name`, `email`, `username`): hoy entran strings de kilómetros hasta el límite del body parser.
- `@IsStrongPassword()` con defaults implícitos: dejar las opciones explícitas (`minLength: 8, minUppercase: 1, ...`) para que el requisito sea visible en el código y en la doc.
- `@ApiProperty` sin `example` ni `format: 'password'`: la doc de Scalar queda pobre. Y falta `@ApiTags('auth')` en el controller.

### 10. Detalles de implementación del service

- **Hash dentro de la transacción**: argon2 tarda 100–300ms+ con la conexión del pool retenida. Calcular el hash **antes** de abrir la transacción; dentro solo los `INSERT`.
- `checkEmail`/`checkUsername` hacen `findOne` (traen la fila entera) para usarla como booleano: `this.userRepository.exists({ where: { email } })` es más barato y expresa la intención.
- `signUp` sin return type explícito: `Promise<void>` (o el tipo del contrato que definas en el punto 8). Con 10 años de backend esto ya lo sabés: en Nest los tipos explícitos en la frontera controller/service te salvan cuando activás serialización.

### 11. Suite e2e rota (scaffold viejo)

`test/app.e2e-spec.ts` sigue siendo el scaffold de Nest (`GET /` esperando "Hello World!") y **falla** (verificado con `pnpm test:e2e`). La Fase 8 es la de calidad, pero los criterios de aceptación de 1.2 son exactamente 5 requests de supertest; dejarlos escritos ahora te cubre contra regresiones como la del casing (que un test de caja negra detecta al instante).

---

## 🔵 Notas / para fases posteriores

- **User enumeration**: `409 "Email already exists"` permite averiguar qué emails están registrados. En registro es casi inevitable, pero hay que mitigarlo con rate limiting (`@nestjs/throttler`) — anotar para Fase 4/8.
- **Tabla `"user"` es palabra reservada en Postgres**: TypeORM la quotea y funciona (verificado), pero en queries crudos o migraciones a mano hay que acordarse siempre de las comillas. Renombrar a `"users"` es una opción; quedarse así también, siendo conscientes.
- **YAGNI**: `two_factor` y `verification` ya están migradas sin uso. No molestan, pero la migración inicial ya carga con schema especulativo.
- **1.8 (no serializar password)**: hoy no filtra nada porque el register no devuelve la entidad y el password vive en `account`, no en `user`. Pero ojo: si mañana se devuelve `User` con `relations: ['accounts']`, el hash sale por la respuesta. Cuando definas el contrato del punto 8, resolvé 1.8 de paso (response DTO o `@Exclude`).
- **Swagger expuesto en todos los entornos** y **filter/interceptor sin tipar**: siguen postergados de Fase 0, no olvidar.

---

## 📋 Estado de los puntos revisados

| Punto | Estado | Comentario |
|-------|--------|------------|
| 1.1 Entidad `User` | 🟡 Aprobado con correcciones | Falta: enum de role, normalización de email, módulo `users`. Hash argon2id mejor que lo pedido. |
| 1.2 `POST /auth/register` | 🟡 Aprobado con correcciones | Funciona, pero el criterio "email duplicado → 409" falla por casing y por race condition. |

**Para cerrar 1.1/1.2**: corregir los 2 🔴, restaurar helmet (🟠 #6) y decidir JWT vs sesiones (🟠 #3) antes de tocar 1.3. El resto puede ir en el mismo pase o quedar anotado.
