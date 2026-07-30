import { UserRole } from '../../users/entities/user-role.enum';

// Claims del access token: lo mínimo para autorizar (quién sos y qué rol).
// El resto del perfil se sirve en /auth/me — el payload de un JWT es base64
// público y viaja en cada request, no es lugar para PII.
export interface JwtAccessPayload {
  sub: string;
  role: UserRole;
}

// Claims del refresh token. El jti hace único al token aunque dos logins
// caigan en el mismo segundo (sin él, el unique de token_hash tiraría 23505)
// y habilita revocación por id a futuro.
export interface JwtRefreshPayload {
  sub: string;
  jti: string;
}
