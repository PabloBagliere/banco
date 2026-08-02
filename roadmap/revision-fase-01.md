# Revisión profesional - Fase 1 (Auth & Users)

Última revisión: 2026-08-01.

### [Media] Los criterios de autenticación aún no tienen cobertura e2e

- Ubicación: `test/app.e2e-spec.ts:7-27`.
- Evidencia: el e2e actual comprueba únicamente `GET /health`. No ejecuta registro, login, protección de rutas, refresh, rol ADMIN, verificación de email ni ausencia del hash de password en respuestas.
- Impacto: las reglas y contratos HTTP principales de Fase 1 no tienen una prueba de regresión contra el stack real de Nest y PostgreSQL.
- Corrección esperada: añadir escenarios e2e aislados que cubran los criterios de aceptación de la fase, incluyendo fallo de credenciales, refresh inválido, autorización y serialización de respuestas.
- Verificación: `pnpm test:e2e --runInBand` cubre y pasa registro duplicado 409, login inválido 401, ruta protegida 401/200, refresh inválido 401 y ausencia de password hash.
