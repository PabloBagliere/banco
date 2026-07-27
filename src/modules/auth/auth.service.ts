import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserRole } from './entities/user-role.enum';
import { Account } from './entities/account.entity';
import { RegisterDto } from './dto/register.dto';
import { HttpService } from '@nestjs/axios';
import crypto from 'node:crypto';
import argon2 from 'argon2';
import { firstValueFrom, map } from 'rxjs';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
    private readonly httpService: HttpService,
  ) {}

  async signUp(registerDto: RegisterDto): Promise<{ message: string }> {
    if (await this.checkEmail(registerDto.email)) {
      throw new ConflictException('Email already exists');
    }
    if (await this.checkUsername(registerDto.username)) {
      throw new ConflictException('Username already exists');
    }
    if (await this.isPasswordPwned(registerDto.password)) {
      throw new BadRequestException('The password has been compromised.');
    }

    const user = this.createUser(registerDto);
    // El hash se calcula ANTES de abrir la transacción: argon2 tarda
    // 100-300ms y no tiene sentido retener una conexión del pool mientras tanto.
    const passwordHash = await this.hashPassword(registerDto.password);

    await this.dataSource.transaction(async (manager) => {
      await manager.save(user);
      await manager.save(this.createAccount(passwordHash, user));
    });

    return { message: 'Todo ok' };
  }

  private checkEmail(email: string): Promise<boolean> {
    return this.userRepository.exists({ where: { email } });
  }

  private checkUsername(username: string): Promise<boolean> {
    return this.userRepository.exists({ where: { username } });
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

  private createUser(registerDto: RegisterDto): User {
    const user: User = new User();
    user.email = registerDto.email;
    user.name = registerDto.name;
    user.username = registerDto.username;
    user.displayUsername = registerDto.username;
    user.role = UserRole.USER;
    return user;
  }

  private createAccount(hash: string, user: User): Account {
    const account = new Account();
    account.password = hash;
    account.providerId = 'credentials';
    account.user = user;
    account.accountId = user.id;
    return account;
  }
}
