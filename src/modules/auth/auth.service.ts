import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Account } from './entities/account.entity';
import { RegisterDto } from './dto/register.dto';
import { HttpService } from '@nestjs/axios';
import crypto from 'node:crypto';
import argon2 from 'argon2';
import { firstValueFrom, map } from 'rxjs';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
    private readonly httpService: HttpService,
  ) {}

  async signUp(registerDto: RegisterDto) {
    if (await this.checkEmail(registerDto.email)) {
      throw new ConflictException('Email already exists');
    }
    if (await this.checkUsername(registerDto.username)) {
      throw new ConflictException('Username already exists');
    }
    if (await this.checkPassword(registerDto.password)) {
      throw new ConflictException('The password has been compromised.');
    }
    const user = this.createUser(registerDto);

    await this.dataSource.transaction(async (manager) => {
      await manager.save(user);
      const account = this.createAccount(
        await this.hashPassword(registerDto.password),
        user,
      );
      await manager.save(account);
    });

    const result = {
      message: 'Todo ok',
    };
    return result;
  }

  private async checkEmail(email: string) {
    return this.userRepository.findOne({
      where: {
        email: email,
      },
    });
  }

  private async checkUsername(username: string) {
    return this.userRepository.findOne({
      where: {
        username: username,
      },
    });
  }

  private async checkPassword(password: string) {
    const sha1 = crypto
      .createHash('sha1')
      .update(password)
      .digest('hex')
      .toUpperCase();

    const prefix = sha1.slice(0, 5);
    const suffix = sha1.slice(5);

    return await firstValueFrom(
      this.httpService
        .get<string>(`https://api.pwnedpasswords.com/range/${prefix}`)
        .pipe(
          map(({ data }) =>
            data.split('\n').some((line: string) => line.startsWith(suffix)),
          ),
        ),
    );
  }

  private async hashPassword(password: string) {
    return argon2.hash(password);
  }

  private createUser(registerDto: RegisterDto) {
    const user: User = new User();
    user.email = registerDto.email;
    user.name = registerDto.name;
    user.username = registerDto.username;
    user.displayUsername = registerDto.username;
    user.role = 'USER';
    return user;
  }

  private createAccount(hash: string, user: User) {
    const account = new Account();
    account.password = hash;
    account.providerId = 'credentials';
    account.user = user;
    account.accountId = user.id;
    return account;
  }
}
