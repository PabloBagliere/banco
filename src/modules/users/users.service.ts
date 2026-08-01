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
    private userRepository: Repository<User>,
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
  ) {}

  async create(manager: EntityManager, dto: CreateUserDto, passwordHash: string): Promise<User> {
    const user = this.createUser(dto);

    await manager.save(user);
    await manager.save(this.createAccount(passwordHash, user));

    this.logger.debug('User created successfully');

    return user;
  }
  findOneEmail(email: string) {
    return this.userRepository.findOne({
      where: {
        email,
      },
    });
  }
  findOneId(id: string) {
    return this.userRepository.findOne({
      where: {
        id,
      },
    });
  }
  async findOnePasswordHash(user: User) {
    const result = await this.accountRepository.findOne({
      where: {
        userId: user.id,
        providerId: 'credentials',
      },
    });
    if (!result) {
      this.logger.error('Credentials account not found for user: ' + user.id);
      throw new InternalServerErrorException('Password account not found');
    }
    return result.password;
  }

  existsByEmail(email: string): Promise<boolean> {
    return this.userRepository.exists({ where: { email } });
  }

  existsByUsername(username: string): Promise<boolean> {
    return this.userRepository.exists({ where: { username } });
  }

  async verifyEmail(id: string) {
    const result = await this.userRepository.update(id, {
      emailVerified: true,
    });
    if (result.affected === 0) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    this.logger.debug(`Updated user email validity: ${id}`);
    return true;
  }

  private createUser(dto: CreateUserDto): User {
    const user: User = new User();
    user.email = dto.email;
    user.name = dto.name;
    user.username = dto.username;
    user.displayUsername = dto.username;
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
