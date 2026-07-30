import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
  InternalServerErrorException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { CreateUserDto } from '../users/dto/createUser.dto';
import { UsersService } from '../users/users.service';
import { HttpService } from '@nestjs/axios';
import crypto from 'node:crypto';
import argon2 from 'argon2';
import { firstValueFrom, map } from 'rxjs';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { VerificationService } from '../verification/verification.service';
import { NotificationsService } from '../notifications/notifications.service';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { RefreshToken } from './entities/refresh-token.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { AppConfig } from 'src/infrastructure/config/app.config';
import ms from 'ms';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(RefreshToken)
    private refreshRepository: Repository<RefreshToken>,
    private dataSource: DataSource,
    private readonly httpService: HttpService,
    private readonly usersService: UsersService,
    private readonly verificationService: VerificationService,
    private readonly notificationsService: NotificationsService,
    private jwtService: JwtService,
    private readonly config: AppConfig,
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
    const passwordHash = await this.createHash(createUserDto.password);
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

  async signIn(loginUserDto: LoginDto, ip: string, userAgent: string) {
    const user = await this.usersService.findOne(loginUserDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.emailVerified) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const passwordHash = await this.usersService.findOnePasswordHash(user);
    if (!passwordHash) {
      this.logger.error('User not password account what ' + user.email);
      throw new InternalServerErrorException('Password account not found');
    }
    if (!(await this.compareHash(loginUserDto.password, passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload = {
      sub: user.id,
      username: user.username,
      displayName: user.displayUsername,
      role: user.role,
      image: user.image,
      email: user.email,
      name: user.name,
    };
    const access = await this.signAccessToken(payload);
    const refresh = await this.createRefreshToken(user, ip, userAgent);
    return {
      access_token: access,
      refresh_token: refresh,
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

  private createHash(password: string): Promise<string> {
    return argon2.hash(password);
  }

  private compareHash(password: string, hashPassword: string) {
    return argon2.verify(hashPassword, password);
  }

  private async signAccessToken(payload) {
    return this.jwtService.signAsync(payload, {
      secret: this.config.jwtAccessSecret,
      expiresIn: this.config.jwtAccessExpiresIn,
    });
  }

  private async signRefreshToken(payload) {
    return this.jwtService.signAsync(payload, {
      secret: this.config.jwtRefreshSecret,
      expiresIn: this.config.jwtRefreshExpiresIn,
    });
  }

  private async createRefreshToken(user: User, ip: string, userAgent: string) {
    const refresh = await this.signRefreshToken({ sub: user.id });
    const expiresAt = new Date(
      Date.now() + ms(this.config.jwtRefreshExpiresIn),
    );
    const hash = await this.createHash(refresh);
    const Refresh = new RefreshToken();
    Refresh.user = user;
    Refresh.ipAddress = ip;
    Refresh.userAgent = userAgent;
    Refresh.tokenHash = hash;
    Refresh.expiresAt = expiresAt;
    await this.saveRefreshToken(Refresh);
    this.logger.debug('Save token refresh');
    return refresh;
  }

  private saveRefreshToken(refresh: RefreshToken) {
    return this.refreshRepository.save(refresh);
  }
}
