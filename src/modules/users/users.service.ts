import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { CreateUserDto } from './dto/createUser.dto';
import { Account } from './entities/account.entity';
import { UserRole } from './entities/user-role.enum';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
  ) {}

  async create(manager: EntityManager, createUserDto: CreateUserDto, passwordHash: string): Promise<User> {
    const user = this.createUser(createUserDto);

    await manager.save(user);
    await manager.save(this.createCredentialsAccount(passwordHash, user));

    this.logger.debug('Created user and credentials account.');

    return user;
  }
  findOneByEmail(email: string) {
    return this.userRepository.findOne({
      where: {
        email,
      },
    });
  }
  findOneById(userId: string) {
    return this.userRepository.findOne({
      where: {
        id: userId,
      },
    });
  }
  async findOnePasswordHash(user: User) {
    const credentialsAccount = await this.accountRepository.findOne({
      where: {
        userId: user.id,
        providerId: 'credentials',
      },
    });
    if (!credentialsAccount) {
      this.logger.error('Credentials account is missing.');
      throw new InternalServerErrorException('Unable to authenticate.');
    }
    return credentialsAccount.password;
  }

  existsByEmail(email: string): Promise<boolean> {
    return this.userRepository.exists({ where: { email } });
  }

  existsByUsername(username: string): Promise<boolean> {
    return this.userRepository.exists({ where: { username } });
  }

  async verifyEmail(userId: string) {
    const updateResult = await this.userRepository.update(userId, {
      emailVerified: true,
    });
    if (updateResult.affected === 0) {
      throw new NotFoundException('User account not found.');
    }
    this.logger.debug('Marked email as verified.');
    return true;
  }

  private createUser(createUserDto: CreateUserDto): User {
    const user: User = new User();
    user.email = createUserDto.email;
    user.name = createUserDto.name;
    user.username = createUserDto.username;
    user.displayUsername = createUserDto.username;
    user.role = UserRole.USER;
    return user;
  }

  private createCredentialsAccount(passwordHash: string, user: User): Account {
    const account = new Account();
    account.password = passwordHash;
    account.providerId = 'credentials';
    account.user = user;
    account.accountId = user.id;
    return account;
  }
}
