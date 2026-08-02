import { DataSource, Repository } from 'typeorm';
import { Verification } from './entities/verification.entity';
import { VerificationService } from './verification.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';

describe('VerificationService resend email', () => {
  const response = {
    message: 'If the email is eligible, a verification email will be sent.',
  };
  const verificationRepository = {
    delete: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
  };
  const manager = {
    getRepository: jest.fn().mockReturnValue(verificationRepository),
  };
  const dataSource = {
    transaction: jest.fn((callback: (transactionManager: typeof manager) => unknown) => callback(manager)),
  };
  const usersService = {
    findOneByEmail: jest.fn(),
  };
  const notificationsService = {
    sendVerificationEmail: jest.fn(),
  };
  const service = new VerificationService(
    verificationRepository as unknown as Repository<Verification>,
    usersService as unknown as UsersService,
    notificationsService as unknown as NotificationsService,
    dataSource as unknown as DataSource,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    verificationRepository.delete.mockResolvedValue({ affected: 1 });
    verificationRepository.save.mockResolvedValue(undefined);
    notificationsService.sendVerificationEmail.mockResolvedValue(undefined);
  });

  it('returns the same response for an unknown and an already verified email', async () => {
    usersService.findOneByEmail.mockResolvedValueOnce(null).mockResolvedValueOnce({ emailVerified: true });

    await expect(service.resendEmail('unknown@example.com')).resolves.toEqual(response);
    await expect(service.resendEmail('verified@example.com')).resolves.toEqual(response);

    expect(dataSource.transaction).not.toHaveBeenCalled();
    expect(notificationsService.sendVerificationEmail).not.toHaveBeenCalled();
  });

  it('sends an email only to an unverified user but keeps the public response generic', async () => {
    usersService.findOneByEmail.mockResolvedValue({
      id: 'user-id',
      emailVerified: false,
    });
    verificationRepository.findOne.mockResolvedValue(null);

    await expect(service.resendEmail('unverified@example.com')).resolves.toEqual(response);

    expect(notificationsService.sendVerificationEmail).toHaveBeenCalledWith(
      'unverified@example.com',
      expect.any(String),
    );
  });
});
