import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { CreateUserDto } from '../users/dto/createUser.dto';
import { UsersService } from '../users/users.service';
import { HttpService } from '@nestjs/axios';
import crypto from 'node:crypto';
import argon2 from 'argon2';
import { firstValueFrom, map } from 'rxjs';
import { DataSource, QueryFailedError } from 'typeorm';
import { VerificationService } from '../verification/verification.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private dataSource: DataSource,
    private readonly httpService: HttpService,
    private readonly usersService: UsersService,
    private readonly verificationService: VerificationService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async signUp(createUserDto: CreateUserDto): Promise<{
    message: string;
    data: {
      username: string;
      email: string;
      emailVerified: boolean;
    };
  }> {
    if (await this.usersService.existsByEmail(createUserDto.email)) {
      throw new ConflictException('Email already exists');
    }
    if (await this.usersService.existsByUsername(createUserDto.username)) {
      throw new ConflictException('Username already exists');
    }
    if (await this.isPasswordPwned(createUserDto.password)) {
      throw new BadRequestException('The password has been compromised.');
    }

    // El hash se calcula ANTES de abrir la transacción: argon2 tarda
    // 100-300ms y no tiene sentido retener una conexión del pool mientras tanto.
    const passwordHash = await this.hashPassword(createUserDto.password);
    let tokenVerify: string;
    try {
      tokenVerify = await this.dataSource.transaction(async (manager) => {
        const user = await this.usersService.create(
          manager,
          createUserDto,
          passwordHash,
        );

        return this.verificationService.createToken(manager, user.id);
      });
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === '23505'
      ) {
        throw new ConflictException('Email or username already exists');
      }
      throw error;
    }

    try {
      await this.notificationsService.sendVerificationEmail(
        createUserDto.email,
        tokenVerify,
      );
    } catch (error) {
      this.logger.error('not enviar email', error);
    }
    return {
      message:
        'Registration successful. Check your email to verify your account.',
      data: {
        username: createUserDto.username,
        email: createUserDto.email,
        emailVerified: false,
      },
    };
  }

  // k-anonymity: solo viajan los primeros 5 chars del SHA-1, nunca la password.
  // Fail-open a propósito: si HIBP no responde no se bloquea el registro
  // (la validación de fortaleza del DTO sigue aplicando). Ver roadmap/decisiones.md.
  private async isPasswordPwned(password: string): Promise<boolean> {
    const sha1 = crypto
      .createHash('sha1')
      .update(password)
      .digest('hex')
      .toUpperCase();

    const prefix = sha1.slice(0, 5);
    const suffix = sha1.slice(5);

    try {
      return await firstValueFrom(
        this.httpService
          .get<string>(`https://api.pwnedpasswords.com/range/${prefix}`, {
            headers: { 'Add-Padding': 'true' },
          })
          .pipe(
            map(({ data }) =>
              data.split('\n').some((line: string) => line.startsWith(suffix)),
            ),
          ),
      );
    } catch {
      this.logger.warn(
        'HIBP no disponible: se omite el chequeo de password comprometido',
      );
      return false;
    }
  }

  private hashPassword(password: string): Promise<string> {
    return argon2.hash(password);
  }
}
