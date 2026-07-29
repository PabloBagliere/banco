import { Injectable } from '@nestjs/common';
import crypto from 'node:crypto';
import { EntityManager } from 'typeorm';
import { Verification } from './entities/verification.entity';

// Centraliza el ciclo de vida de los tokens/códigos de verificación
// (hoy: verificación de email; a futuro: reset de password, 2FA, etc.).
@Injectable()
export class VerificationService {
  // Expiración del token: 1 hora.
  private static readonly TOKEN_TTL_MS = 1000 * 60 * 60;

  // Recibe el EntityManager del caller para participar en su transacción:
  // el token debe crearse atómicamente junto con la entidad que lo origina.
  async createToken(
    manager: EntityManager,
    identifier: string,
  ): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const verification = new Verification();
    verification.identifier = identifier;
    verification.value = token;
    verification.expiresAt = new Date(
      Date.now() + VerificationService.TOKEN_TTL_MS,
    );
    await manager.save(verification);
    return token;
  }
}
