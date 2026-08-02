import crypto from 'node:crypto';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { VerifyDto } from './dto/verify.dto';
import { Verification } from './entities/verification.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';

// Centraliza el ciclo de vida de los tokens/códigos de verificación
// (hoy: verificación de email; a futuro: reset de password, 2FA, etc.).
@Injectable()
export class VerificationService {
  // Expiración del token: 1 hora.
  private static readonly TOKEN_TTL_MS = 1000 * 60 * 60;
  private readonly logger = new Logger(VerificationService.name);

  constructor(
    @InjectRepository(Verification)
    private readonly verificationRepository: Repository<Verification>,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
    private readonly dataSource: DataSource,
  ) {}

  // Recibe el EntityManager del caller para participar en su transacción:
  // el token debe crearse atómicamente junto con la entidad que lo origina.
  async createVerificationToken(
    repository: Repository<Verification> = this.verificationRepository,
    identifier: string,
  ): Promise<string> {
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');
    const verification = new Verification();
    verification.identifier = identifier;
    verification.value = verificationTokenHash;
    verification.expiresAt = new Date(Date.now() + VerificationService.TOKEN_TTL_MS);
    await repository.save(verification);
    return verificationToken;
  }

  async verifyToken(tokenDto: VerifyDto) {
    const verificationTokenHash = crypto.createHash('sha256').update(tokenDto.token).digest('hex');
    const verificationRecord = await this.findByToken(verificationTokenHash);
    if (!verificationRecord) {
      throw new BadRequestException('Verification token is invalid or expired.');
    }
    if (verificationRecord.expiresAt <= new Date()) {
      await this.deleteVerificationToken(verificationRecord.id);
      throw new BadRequestException('Verification token is invalid or expired.');
    }
    await this.usersService.verifyEmail(verificationRecord.identifier);
    await this.deleteVerificationToken(verificationRecord.id);
    this.logger.debug('Verified email address.');
    return {
      message: 'Email address verified successfully.',
    };
  }

  async resendEmail(email: string) {
    const resendResponse = {
      message: 'If the email is eligible, a verification email will be sent.',
    };
    const user = await this.usersService.findOneByEmail(email);
    if (!user || user.emailVerified) {
      return resendResponse;
    }
    const existingVerification = await this.findByIdentifier(user.id);
    let verificationToken: string;
    try {
      verificationToken = await this.dataSource.transaction(async (manager) => {
        const repository = manager.getRepository(Verification);
        if (existingVerification) {
          await this.deleteVerificationToken(existingVerification.id, repository);
        }
        return this.createVerificationToken(repository, user.id);
      });
    } catch (error) {
      this.logger.error('Failed to replace verification token.', (error as Error).stack);
      throw error;
    }
    try {
      await this.notificationsService.sendVerificationEmail(email, verificationToken);
    } catch (error) {
      this.logger.error('Failed to send verification email.', (error as Error).stack);
    }
    return resendResponse;
  }

  private findByToken(token: string) {
    return this.verificationRepository.findOne({
      where: {
        value: token,
      },
    });
  }

  private findByIdentifier(identifier: string) {
    return this.verificationRepository.findOne({
      where: {
        identifier,
      },
    });
  }
  private deleteVerificationToken(id: string, repository: Repository<Verification> = this.verificationRepository) {
    return repository.delete(id);
  }
}
