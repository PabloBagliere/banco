import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { UserRole } from '../../modules/users/entities/user-role.enum';

describe('RolesGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  };
  const guard = new RolesGuard(reflector as unknown as Reflector);

  const context = (role?: UserRole): ExecutionContext =>
    ({
      getClass: jest.fn(),
      getHandler: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          user: role ? { role } : undefined,
        }),
      }),
    }) as unknown as ExecutionContext;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('permite rutas sin roles requeridos', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    expect(guard.canActivate(context())).toBe(true);
  });

  it('deniega un rol no autorizado', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

    expect(guard.canActivate(context(UserRole.USER))).toBe(false);
  });

  it('permite el rol requerido', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

    expect(guard.canActivate(context(UserRole.ADMIN))).toBe(true);
  });
});
