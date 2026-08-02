import crypto from 'node:crypto';
import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
  InternalServerErrorException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { hash, verify } from 'argon2';
import ms from 'ms';
import { firstValueFrom, map } from 'rxjs';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { AppConfig } from '../../infrastructure/config/app.config';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateUserDto } from '../users/dto/createUser.dto';
import { UsersService } from '../users/users.service';
import { VerificationService } from '../verification/verification.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refreshToken.dto';
import { RefreshToken } from './entities/refresh-token.entity';
import { JwtAccessPayload, JwtRefreshPayload } from './interfaces/jwt-payload.interface';
import { User } from '../users/entities/user.entity';
import { Verification } from '../verification/entities/verification.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  // Hash argon2id válido de una password aleatoria, precalculado. Se usa para
  // ejecutar un verify completo cuando el email no existe: sin esto, "email
  // inexistente" respondería ~200ms más rápido que "password mala" y el
  // timing delataría qué emails están registrados (enumeración).
  private static readonly DUMMY_HASH =
    '$argon2id$v=19$m=65536,p=4,t=3$DmPcej26dsHhWuKuYQG4OA$/S63/SuVSQnUHnTM0z6qALsxug/SCnWr1a6PU7yKoVo';

  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshRepository: Repository<RefreshToken>,
    private readonly dataSource: DataSource,
    private readonly httpService: HttpService,
    private readonly usersService: UsersService,
    private readonly verificationService: VerificationService,
    private readonly notificationsService: NotificationsService,
    private readonly jwtService: JwtService,
    private readonly config: AppConfig,
  ) {}

  async register(createUserDto: CreateUserDto): Promise<{
    message: string;
    data: {
      username: string;
      email: string;
      emailVerified: boolean;
    };
  }> {
    if (await this.usersService.existsByEmail(createUserDto.email)) {
      throw new ConflictException('Email is already registered.');
    }
    if (await this.usersService.existsByUsername(createUserDto.username)) {
      throw new ConflictException('Username is already registered.');
    }
    if (await this.isPasswordPwned(createUserDto.password)) {
      throw new BadRequestException('Password has been exposed in a data breach.');
    }

    // El hash se calcula ANTES de abrir la transacción: argon2 tarda
    // 100-300ms y no tiene sentido retener una conexión del pool mientras tanto.
    const passwordHash = await this.hashPassword(createUserDto.password);
    let verificationToken: string;
    try {
      verificationToken = await this.dataSource.transaction(async (manager) => {
        const user = await this.usersService.create(manager, createUserDto, passwordHash);

        return this.verificationService.createVerificationToken(manager.getRepository(Verification), user.id);
      });
    } catch (error) {
      if (error instanceof QueryFailedError && (error.driverError as { code?: string }).code === '23505') {
        throw new ConflictException('Email or username is already registered.');
      }
      throw error;
    }

    try {
      await this.notificationsService.sendVerificationEmail(createUserDto.email, verificationToken);
    } catch (error) {
      this.logger.error('Failed to send verification email.', (error as Error).stack);
    }
    return {
      message: 'Registration successful. Verify your email address to sign in.',
      data: {
        username: createUserDto.username,
        email: createUserDto.email,
        emailVerified: false,
      },
    };
  }

  async login(loginDto: LoginDto, ip: string | null, userAgent: string | null) {
    const user = await this.usersService.findOneByEmail(loginDto.email);
    if (!user) {
      // Verify contra un hash dummy: igual costo que una password incorrecta,
      // el timing no filtra si el email existe.
      await this.verifyPassword(loginDto.password, AuthService.DUMMY_HASH);
      throw new UnauthorizedException('Invalid email or password.');
    }
    const passwordHash = await this.usersService.findOnePasswordHash(user);
    if (!passwordHash) {
      this.logger.error(`Credentials password hash is missing for user ${user.id}.`);
      throw new InternalServerErrorException('Unable to authenticate.');
    }
    if (!(await this.verifyPassword(loginDto.password, passwordHash))) {
      throw new UnauthorizedException('Invalid email or password.');
    }
    // Estado de la cuenta DESPUÉS de validar credenciales: ni el mensaje ni
    // el timing filtran si un email existe / está verificado / baneado.
    if (!user.emailVerified) {
      throw new UnauthorizedException('Invalid email or password.');
    }
    if (this.isSuspended(user)) {
      throw new ForbiddenException('Account is suspended.');
    }
    const payload: JwtAccessPayload = {
      sub: user.id,
      role: user.role,
    };
    const accessToken = await this.signAccessToken(payload);
    const refreshToken = await this.signRefreshToken({
      sub: user.id,
      jti: crypto.randomUUID(),
    });
    await this.saveRefreshToken(user, ip, userAgent, refreshToken);
    return {
      accessToken,
      refreshToken,
      expiresIn: ms(this.config.jwtAccessExpiresIn),
      refreshExpiresIn: ms(this.config.jwtRefreshExpiresIn),
      tokenType: 'Bearer',
    };
  }

  async refreshSession(refreshTokenDto: RefreshTokenDto, ip: string | null, userAgent: string | null) {
    const refreshPayload = await this.verifyRefreshToken(refreshTokenDto.refresh);
    const refreshTokenHash = this.tokenHash(refreshTokenDto.refresh);
    const user = await this.usersService.findOneById(refreshPayload.sub);
    if (!user) {
      this.logger.warn('Refresh token referenced a missing user.');
      throw new UnauthorizedException('Refresh token is invalid or expired.');
    }
    if (this.isSuspended(user)) {
      throw new ForbiddenException('Account is suspended.');
    }
    try {
      const rotation = await this.dataSource.transaction(async (manager) => {
        const repository = manager.getRepository(RefreshToken);
        const storedRefreshToken = await this.lockActiveRefreshToken(refreshTokenHash, user.id, repository);
        if (!storedRefreshToken) {
          return null;
        }
        const refreshToken = await this.signRefreshToken({
          sub: user.id,
          jti: crypto.randomUUID(),
        });
        const payload: JwtAccessPayload = {
          sub: user.id,
          role: user.role,
        };
        const accessToken = await this.signAccessToken(payload);
        const newRefreshToken = await this.saveRefreshToken(user, ip, userAgent, refreshToken, repository);
        await this.revokeRefreshToken(repository, storedRefreshToken, newRefreshToken);
        return { accessToken, refreshToken };
      });
      if (!rotation) {
        throw new UnauthorizedException('Refresh token is invalid or expired.');
      }
      return {
        accessToken: rotation.accessToken,
        refreshToken: rotation.refreshToken,
        expiresIn: ms(this.config.jwtAccessExpiresIn),
        refreshExpiresIn: ms(this.config.jwtRefreshExpiresIn),
        tokenType: 'Bearer',
      };
    } catch (error) {
      if (error instanceof QueryFailedError && (error.driverError as { code?: string }).code === '23505') {
        this.logger.error('Failed to rotate refresh token.', error.stack);
        throw new InternalServerErrorException('Unable to refresh session.');
      }
      throw error;
    }
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findOneById(userId);
    if (!user) {
      this.logger.warn('Access token referenced a missing user.');
      throw new UnauthorizedException('Authentication token is invalid or expired.');
    }
    if (this.isSuspended(user)) {
      throw new ForbiddenException('Account is suspended.');
    }
    return {
      id: user.id,
      email: user.email,
      image: user.image,
      username: user.username,
      displayName: user.displayUsername,
      name: user.name,
    };
  }

  // Ban permanente (sin fecha) o vigente. Un ban vencido permite loguear.
  private isSuspended(user: User): boolean {
    if (!user.banned) {
      return false;
    }
    return !user.banExpires || user.banExpires > new Date();
  }

  // k-anonymity: solo viajan los primeros 5 chars del SHA-1, nunca la password.
  // Fail-open a propósito: si HIBP no responde no se bloquea el registro
  // (la validación de fortaleza del DTO sigue aplicando). Ver roadmap/decisiones.md.
  private async isPasswordPwned(password: string): Promise<boolean> {
    // eslint-disable-next-line sonarjs/hashing -- la API de HIBP exige SHA-1 (k-anonymity)
    const sha1 = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();

    const prefix = sha1.slice(0, 5);
    const suffix = sha1.slice(5);

    try {
      return await firstValueFrom(
        this.httpService
          .get<string>(`https://api.pwnedpasswords.com/range/${prefix}`, {
            headers: { 'Add-Padding': 'true' },
          })
          .pipe(map(({ data }) => data.split('\n').some((line: string) => line.startsWith(suffix)))),
      );
    } catch {
      this.logger.warn('HIBP request failed; skipping password breach check.');
      return false;
    }
  }

  private hashPassword(password: string): Promise<string> {
    return hash(password);
  }

  private verifyPassword(password: string, passwordHash: string) {
    return verify(passwordHash, password);
  }

  private signAccessToken(payload: JwtAccessPayload): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.config.jwtAccessSecret,
      expiresIn: this.config.jwtAccessExpiresIn,
    });
  }

  private signRefreshToken(payload: JwtRefreshPayload): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.config.jwtRefreshSecret,
      expiresIn: this.config.jwtRefreshExpiresIn,
    });
  }

  private async verifyRefreshToken(token: string): Promise<JwtRefreshPayload> {
    try {
      const result = await this.jwtService.verifyAsync<JwtRefreshPayload>(token, {
        secret: this.config.jwtRefreshSecret,
      });
      return result;
    } catch {
      throw new UnauthorizedException('Refresh token is invalid or expired.');
    }
  }

  private async lockActiveRefreshToken(
    refreshTokenHash: string,
    userId: string,
    repository: Repository<RefreshToken>,
  ): Promise<RefreshToken | null> {
    // The row lock makes a second rotation wait until it can observe the revocation.
    const result = await repository.findOne({
      where: {
        tokenHash: refreshTokenHash,
        userId,
      },
      lock: { mode: 'pessimistic_write' },
    });
    if (!result) {
      this.logger.debug('Refresh token was not found.');
      throw new UnauthorizedException('Refresh token is invalid or expired.');
    }
    if (result.expiresAt <= new Date()) {
      this.logger.debug('Refresh token has expired.');
      throw new UnauthorizedException('Refresh token is invalid or expired.');
    }
    if (result.revokedAt) {
      await this.revokeAllUserRefreshTokens(userId, repository);
      return null;
    }
    return result;
  }

  private async revokeAllUserRefreshTokens(userId: string, repository: Repository<RefreshToken>) {
    return repository.update(
      {
        userId,
      },
      {
        revokedAt: new Date(),
      },
    );
  }

  private tokenHash(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async revokeRefreshToken(
    repository: Repository<RefreshToken> = this.refreshRepository,
    oldRefresh: RefreshToken,
    newRefresh: RefreshToken,
  ): Promise<void> {
    await repository.update(
      {
        id: oldRefresh.id,
      },
      {
        revokedAt: new Date(),
        replacedBy: newRefresh.id,
      },
    );
  }

  private async saveRefreshToken(
    user: User,
    ip: string | null,
    userAgent: string | null,
    refreshTokenValue: string,
    repository: Repository<RefreshToken> = this.refreshRepository,
  ): Promise<RefreshToken> {
    const refreshToken = new RefreshToken();
    refreshToken.user = user;
    refreshToken.ipAddress = ip;
    refreshToken.userAgent = userAgent;
    refreshToken.tokenHash = this.tokenHash(refreshTokenValue);
    refreshToken.expiresAt = new Date(Date.now() + ms(this.config.jwtRefreshExpiresIn));
    await repository.save(refreshToken);
    this.logger.debug('Stored refresh token.');
    return refreshToken;
  }
}
