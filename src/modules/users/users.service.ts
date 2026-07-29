import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { CreateUserDto } from './dto/createUser.dto';
import { User } from './entities/user.entity';
import { UserRole } from './entities/user-role.enum';
import { Account } from './entities/account.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryFailedError, Repository } from 'typeorm';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
  ) {}

  existsByEmail(email: string): Promise<boolean> {
    return this.userRepository.exists({ where: { email } });
  }

  existsByUsername(username: string): Promise<boolean> {
    return this.userRepository.exists({ where: { username } });
  }

  async create(dto: CreateUserDto, passwordHash: string) {
    const user = this.createUser(dto);
    try {
      await this.dataSource.transaction(async (manager) => {
        await manager.save(user);
        await manager.save(this.createAccount(passwordHash, user));
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
    this.logger.debug('user create successfully');
  }

  private createUser(CreateUserDto: CreateUserDto): User {
    const user: User = new User();
    user.email = CreateUserDto.email;
    user.name = CreateUserDto.name;
    user.username = CreateUserDto.username;
    user.displayUsername = CreateUserDto.username;
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
