import type { JwtAccessPayload } from '../../modules/auth/interfaces/jwt-payload.interface';

declare global {
  namespace Express {
    interface Request {
      user?: JwtAccessPayload;
    }
  }
}

export {};
