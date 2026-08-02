import { InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { CreateUserDto } from './dto/createUser.dto';
import { Account } from './entities/account.entity';
import { UserRole } from './entities/user-role.enum';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

/**
 * Factory de mocks de repositorio TypeORM.
 * Cada método que el service usa queda reemplazado por un jest.fn(),
 * así en cada test controlamos qué devuelve "la base de datos"
 * (mockResolvedValue / mockReturnValue) y verificamos con qué
 * argumentos fue llamado (toHaveBeenCalledWith).
 *
 * Para otro service: agregar acá los métodos que use su repositorio
 * (save, find, delete, createQueryBuilder, etc.).
 */
const mockRepositoryFactory = () => ({
  findOne: jest.fn(),
  exists: jest.fn(),
  update: jest.fn(),
  save: jest.fn(),
});

// Tipo del repositorio mockeado (cada método es un jest.Mock).
type MockRepository = ReturnType<typeof mockRepositoryFactory>;

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: MockRepository;
  let accountRepository: MockRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        // getRepositoryToken(Entity) es el mismo token que resuelve
        // @InjectRepository(Entity), así Nest inyecta nuestro mock.
        {
          provide: getRepositoryToken(User),
          useFactory: mockRepositoryFactory,
        },
        {
          provide: getRepositoryToken(Account),
          useFactory: mockRepositoryFactory,
        },
      ],
    }).compile();

    service = module.get(UsersService);
    userRepository = module.get<MockRepository>(getRepositoryToken(User));
    accountRepository = module.get<MockRepository>(getRepositoryToken(Account));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto: CreateUserDto = {
      name: 'Pablo Bagliere',
      email: 'pablo@example.com',
      username: 'pablobagliere',
      password: 'ClaveSegura2026!',
    };

    it('guarda el usuario y su cuenta credentials con el EntityManager recibido', async () => {
      // El EntityManager llega por parámetro (lo abre quien maneja la
      // transacción), así que se mockea como un objeto plano con jest.fn().
      // jest.fn<Retorno, [Args]> queda tipado para inspeccionar las llamadas.
      const save = jest.fn<Promise<unknown>, [unknown]>();
      save.mockResolvedValue(undefined);
      const manager = { save } as unknown as EntityManager;

      const result = await service.create(manager, dto, 'hash123');

      expect(save).toHaveBeenCalledTimes(2);

      // Primer save: el User armado a partir del DTO.
      const savedUser = save.mock.calls[0][0] as User;
      expect(savedUser).toBeInstanceOf(User);
      expect(savedUser.email).toBe(dto.email);
      expect(savedUser.name).toBe(dto.name);
      expect(savedUser.username).toBe(dto.username);
      expect(savedUser.displayUsername).toBe(dto.username);
      expect(savedUser.role).toBe(UserRole.USER);

      // Segundo save: la Account con el hash de la contraseña.
      const savedAccount = save.mock.calls[1][0] as Account;
      expect(savedAccount).toBeInstanceOf(Account);
      expect(savedAccount.password).toBe('hash123');
      expect(savedAccount.providerId).toBe('credentials');
      expect(savedAccount.user).toBe(savedUser);

      expect(result).toBe(savedUser);
    });
  });

  describe('findOneByEmail', () => {
    it('devuelve el usuario que matchea el email', async () => {
      const user = { id: 'uuid-1', email: 'a@b.com' } as User;
      userRepository.findOne.mockResolvedValue(user);

      const result = await service.findOneByEmail('a@b.com');

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'a@b.com' },
      });
      expect(result).toBe(user);
    });

    it('devuelve null cuando el email no existe', async () => {
      userRepository.findOne.mockResolvedValue(null);

      const result = await service.findOneByEmail('nadie@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findOnePasswordHash', () => {
    const user = { id: 'uuid-1' } as User;

    it('devuelve el password de la cuenta credentials del usuario', async () => {
      accountRepository.findOne.mockResolvedValue({
        password: 'hash123',
      });

      const result = await service.findOnePasswordHash(user);

      expect(accountRepository.findOne).toHaveBeenCalledWith({
        where: { userId: user.id, providerId: 'credentials' },
      });
      expect(result).toBe('hash123');
    });

    it('lanza InternalServerErrorException si no existe la cuenta credentials', async () => {
      accountRepository.findOne.mockResolvedValue(null);

      await expect(service.findOnePasswordHash(user)).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('existsByEmail', () => {
    it.each([
      [true, true],
      [false, false],
    ])('devuelve %s cuando el repositorio responde %s', async (expected, repoValue) => {
      userRepository.exists.mockResolvedValue(repoValue);

      const result = await service.existsByEmail('a@b.com');

      expect(userRepository.exists).toHaveBeenCalledWith({
        where: { email: 'a@b.com' },
      });
      expect(result).toBe(expected);
    });
  });

  describe('existsByUsername', () => {
    it.each([
      [true, true],
      [false, false],
    ])('devuelve %s cuando el repositorio responde %s', async (expected, repoValue) => {
      userRepository.exists.mockResolvedValue(repoValue);

      const result = await service.existsByUsername('pablobagliere');

      expect(userRepository.exists).toHaveBeenCalledWith({
        where: { username: 'pablobagliere' },
      });
      expect(result).toBe(expected);
    });
  });

  describe('verifyEmail', () => {
    it('marca el email como verificado y devuelve true', async () => {
      userRepository.update.mockResolvedValue({
        affected: 1,
        raw: {},
        generatedMaps: [],
      });

      const result = await service.verifyEmail('uuid-1');

      expect(userRepository.update).toHaveBeenCalledWith('uuid-1', {
        emailVerified: true,
      });
      expect(result).toBe(true);
    });

    it('lanza NotFoundException cuando no se actualizó ninguna fila', async () => {
      userRepository.update.mockResolvedValue({
        affected: 0,
        raw: {},
        generatedMaps: [],
      });

      await expect(service.verifyEmail('uuid-inexistente')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
