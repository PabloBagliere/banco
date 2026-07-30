import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import crypto from 'node:crypto';
import { EntityManager, Repository } from 'typeorm';
import { Verification } from './entities/verification.entity';
import { VerifyDto } from './dto/verify.dto';
import { UsersService } from '../users/users.service';
import { InjectRepository } from '@nestjs/typeorm';

// Centraliza el ciclo de vida de los tokens/códigos de verificación
// (hoy: verificación de email; a futuro: reset de password, 2FA, etc.).
@Injectable()
export class VerificationService {
  // Expiración del token: 1 hora.
  private static readonly TOKEN_TTL_MS = 1000 * 60 * 60;
  private readonly logger = new Logger(VerificationService.name);

  constructor(
    @InjectRepository(Verification)
    private verificationRepository: Repository<Verification>,
    private readonly usersService: UsersService,
  ) {}

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

  async verifyToken(tokenDto: VerifyDto) {
    const verification = await this.findByToken(tokenDto.verify);
    if (!verification) {
      throw new BadRequestException('Invalid or expired verification token.');
    }
    if (verification.expiresAt <= new Date()) {
      await this.deleteToken(verification.id);
      throw new UnauthorizedException('Token expired');
    }
    await this.usersService.verifyEmail(verification.identifier);
    await this.deleteToken(verification.id);
    return {
      message: 'Email verified successfully.',
      timestamp: new Date().toISOString(),
    };
  }

  private findByToken(token: string) {
    return this.verificationRepository.findOne({
      where: {
        value: token,
      },
    });
  }

  private deleteToken(id: string) {
    return this.verificationRepository.delete(id);
  }
}
