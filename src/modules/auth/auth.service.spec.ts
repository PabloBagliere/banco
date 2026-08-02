import crypto from 'node:crypto';
import { HttpService } from '@nestjs/axios';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataSource, Repository } from 'typeorm';
import { AuthService } from './auth.service';
import { RefreshToken } from './entities/refresh-token.entity';
import { AppConfig } from '../../infrastructure/config/app.config';
import { NotificationsService } from '../notifications/notifications.service';
import { UserRole } from '../users/entities/user-role.enum';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { VerificationService } from '../verification/verification.service';

describe('AuthService refresh token rotation', () => {
  const now = new Date('2026-08-01T00:00:00.000Z');
  const user = {
    id: 'user-id',
    role: UserRole.USER,
    banned: false,
    banExpires: null,
  } as User;
  const activeRefresh = {
    id: 'refresh-id',
    userId: user.id,
    expiresAt: new Date('2026-08-01T00:01:00.000Z'),
    revokedAt: null,
  } as RefreshToken;
  const refreshRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };
  const manager = {
    getRepository: jest.fn().mockReturnValue(refreshRepository),
  };
  const dataSource = {
    transaction: jest.fn((callback: (transactionManager: typeof manager) => unknown) => callback(manager)),
  };
  const usersService = {
    findOneById: jest.fn(),
  };
  const jwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };
  const config = {
    jwtAccessSecret: 'access-secret',
    jwtAccessExpiresIn: '15m',
    jwtRefreshSecret: 'refresh-secret',
    jwtRefreshExpiresIn: '7d',
  };
  const service = new AuthService(
    refreshRepository as unknown as Repository<RefreshToken>,
    dataSource as unknown as DataSource,
    {} as HttpService,
    usersService as unknown as UsersService,
    {} as VerificationService,
    {} as NotificationsService,
    jwtService as unknown as JwtService,
    config as AppConfig,
  );

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);
    jest.clearAllMocks();
    usersService.findOneById.mockResolvedValue(user);
    jwtService.verifyAsync.mockResolvedValue({ sub: user.id, jti: 'refresh-jti' });
    jwtService.signAsync.mockImplementation((payload: { jti?: string }) =>
      Promise.resolve(payload.jti ? 'child-refresh' : 'access-token'),
    );
    refreshRepository.save.mockImplementation((token: RefreshToken) => {
      token.id = 'child-id';
      return Promise.resolve(token);
    });
    refreshRepository.update.mockResolvedValue({ affected: 1 });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('locks the parent refresh and rotates it in the same transaction', async () => {
    refreshRepository.findOne.mockResolvedValue(activeRefresh);

    await expect(service.refreshSession({ refresh: 'parent-refresh' }, null, null)).resolves.toMatchObject({
      accessToken: 'access-token',
      refreshToken: 'child-refresh',
    });

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(refreshRepository.findOne).toHaveBeenCalledWith({
      where: { tokenHash: crypto.createHash('sha256').update('parent-refresh').digest('hex'), userId: user.id },
      lock: { mode: 'pessimistic_write' },
    });
    expect(refreshRepository.update).toHaveBeenCalledWith(
      { id: activeRefresh.id },
      { revokedAt: now, replacedBy: 'child-id' },
    );
  });

  it('revokes every refresh token when a rotated token is reused', async () => {
    refreshRepository.findOne.mockResolvedValue({ ...activeRefresh, revokedAt: new Date() });

    await expect(service.refreshSession({ refresh: 'reused-refresh' }, null, null)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(refreshRepository.update).toHaveBeenCalledWith({ userId: user.id }, { revokedAt: now });
  });
});
