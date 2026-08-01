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
        const user = await this.usersService.create(manager, createUserDto, passwordHash);

        return this.verificationService.createToken(manager, user.id);
      });
    } catch (error) {
      if (error instanceof QueryFailedError && (error.driverError as { code?: string }).code === '23505') {
        throw new ConflictException('Email or username already exists');
      }
      throw error;
    }

    try {
      await this.notificationsService.sendVerificationEmail(createUserDto.email, tokenVerify);
    } catch (error) {
      this.logger.error('Failed to send verification email', (error as Error).stack);
    }
    return {
      message: 'Registration successful. Check your email to verify your account.',
      data: {
        username: createUserDto.username,
        email: createUserDto.email,
        emailVerified: false,
      },
    };
  }

  async signIn(loginUserDto: LoginDto, ip: string | null, userAgent: string | null) {
    const user = await this.usersService.findOneEmail(loginUserDto.email);
    if (!user) {
      // Verify contra un hash dummy: igual costo que una password incorrecta,
      // el timing no filtra si el email existe.
      await this.compareHash(loginUserDto.password, AuthService.DUMMY_HASH);
      throw new UnauthorizedException('Invalid credentials');
    }
    this.logger.debug('User encontrado');
    const passwordHash = await this.usersService.findOnePasswordHash(user);
    if (!passwordHash) {
      this.logger.error('Credentials account not found for user: ' + user.id);
      throw new InternalServerErrorException('Password account not found');
    }
    this.logger.debug('Password encontrada a ese user');
    if (!(await this.compareHash(loginUserDto.password, passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    // Estado de la cuenta DESPUÉS de validar credenciales: ni el mensaje ni
    // el timing filtran si un email existe / está verificado / baneado.
    if (!user.emailVerified) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (this.isBanned(user)) {
      throw new ForbiddenException('Account suspended');
    }
    const payload: JwtAccessPayload = {
      sub: user.id,
      role: user.role,
    };
    const access = await this.signAccessToken(payload);
    const refresh = await this.signRefreshToken({
      sub: user.id,
      jti: crypto.randomUUID(),
    });
    await this.saveRefreshToken(user, ip, userAgent, refresh);
    return {
      accessToken: access,
      refreshToken: refresh,
      expiresIn: ms(this.config.jwtAccessExpiresIn),
      refreshExpiresIn: ms(this.config.jwtRefreshExpiresIn),
      tokenType: 'Bearer',
    };
  }

  async refreshToken(refreshDto: RefreshTokenDto, ip: string | null, userAgent: string | null) {
    const token = await this.isValidedRefreshToken(refreshDto.refresh);
    const tokenHash = this.tokenHash(refreshDto.refresh);
    const user = await this.usersService.findOneId(token.sub);
    if (!user) {
      this.logger.error('What tokenValid not user?? ' + token.sub);
      throw new UnauthorizedException('User Not exist');
    }
    const refreshTokenDB = await this.checkRefreshTokenDb(tokenHash, user.id);
    const refresh = await this.signRefreshToken({
      sub: user.id,
      jti: crypto.randomUUID(),
    });
    const payload: JwtAccessPayload = {
      sub: user.id,
      role: user.role,
    };
    const access = await this.signAccessToken(payload);
    try {
      await this.dataSource.transaction(async (manager) => {
        const repository = manager.getRepository(RefreshToken);
        const newToken = await this.saveRefreshToken(user, ip, userAgent, refresh, repository);
        await this.revokedRefreshToken(repository, refreshTokenDB, newToken);
      });
    } catch (error) {
      if (error instanceof QueryFailedError && (error.driverError as { code?: string }).code === '23505') {
        throw new ConflictException('Email or username already exists');
      }
      throw error;
    }
    return {
      accessToken: access,
      refreshToken: refresh,
      expiresIn: ms(this.config.jwtAccessExpiresIn),
      refreshExpiresIn: ms(this.config.jwtRefreshExpiresIn),
      tokenType: 'Bearer',
    };
  }

  async getUserMe(id: string) {
    const user = await this.usersService.findOneId(id);
    if (!user) {
      this.logger.error('not user?? ' + id);
      throw new InternalServerErrorException('Upps error');
    }

    if (user.banned) {
      throw new UnauthorizedException('User banned contact administration');
    }

    return {
      id: user.id,
      email: user.email,
      image: user.image,
      userName: user.username,
      displayName: user.displayUsername,
      name: user.name,
    };
  }

  // Ban permanente (sin fecha) o vigente. Un ban vencido permite loguear.
  private isBanned(user: User): boolean {
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
      this.logger.warn('HIBP no disponible: se omite el chequeo de password comprometido');
      return false;
    }
  }

  private createHash(password: string): Promise<string> {
    return hash(password);
  }

  private compareHash(password: string, hashPassword: string) {
    return verify(hashPassword, password);
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

  private isValidedRefreshToken(token: string): Promise<JwtRefreshPayload> {
    return this.jwtService.verifyAsync(token, {
      secret: this.config.jwtRefreshSecret,
    });
  }

  private async checkRefreshTokenDb(tokenHash: string, idUser: string): Promise<RefreshToken> {
    const result = await this.refreshRepository.findOne({
      where: {
        tokenHash,
        userId: idUser,
      },
    });
    if (!result) {
      this.logger.debug('RefreshToken not in db ', { tokenHash, idUser });
      throw new UnauthorizedException('Refresh token not valid');
    }
    if (result.expiresAt <= new Date() || result.revokedAt) {
      this.logger.debug('RefreshToken expired ', { tokenHash, idUser });
      throw new UnauthorizedException('Refresh token expired');
    }
    return result;
  }

  private tokenHash(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async revokedRefreshToken(
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
    token: string,
    repository: Repository<RefreshToken> = this.refreshRepository,
  ): Promise<RefreshToken> {
    const refreshToken = new RefreshToken();
    refreshToken.user = user;
    refreshToken.ipAddress = ip;
    refreshToken.userAgent = userAgent;
    refreshToken.tokenHash = this.tokenHash(token);
    refreshToken.expiresAt = new Date(Date.now() + ms(this.config.jwtRefreshExpiresIn));
    await repository.save(refreshToken);
    this.logger.debug('Refresh token stored');
    return refreshToken;
  }
}
