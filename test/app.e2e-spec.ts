import { HttpService } from '@nestjs/axios';
import { INestApplication, RequestMethod, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { cleanE2eDatabase, e2eDataSource, prepareE2eDatabase } from './e2e-database';
import { AppModule } from '../src/app.module';
import { NotificationsService } from '../src/modules/notifications/notifications.service';

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
}

describe('Authentication and verification (e2e)', () => {
  let app: INestApplication<App> | undefined;
  let verificationToken = '';

  beforeAll(async () => {
    await prepareE2eDatabase();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(HttpService)
      .useValue({
        get: () => {
          throw new Error('HIBP is disabled in e2e tests.');
        },
      })
      .overrideProvider(NotificationsService)
      .useValue({
        sendVerificationEmail: (_recipient: string, token: string): Promise<void> => {
          verificationToken = token;
          return Promise.resolve();
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api', {
      exclude: [{ path: 'health', method: RequestMethod.GET }],
    });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  beforeEach(async () => {
    verificationToken = '';
    await cleanE2eDatabase();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    if (e2eDataSource.isInitialized) {
      await e2eDataSource.destroy();
    }
  });

  it('registers only once and never exposes a password hash', async () => {
    const registration = {
      name: 'E2E User',
      email: 'e2e@example.com',
      username: 'e2e_user',
      password: 'E2ePassword!2026',
    };

    const response = await request(app!.getHttpServer()).post('/api/auth/register').send(registration).expect(201);

    expect(response.body).toEqual({
      message: 'Registration successful. Verify your email address to sign in.',
      data: {
        username: registration.username,
        email: registration.email,
        emailVerified: false,
      },
    });
    expect(JSON.stringify(response.body)).not.toContain('password');
    expect(verificationToken).toHaveLength(64);

    await request(app!.getHttpServer()).post('/api/auth/register').send(registration).expect(409);
  });

  it('requires verification before login, then authenticates and protects the profile', async () => {
    const registration = {
      name: 'Verified User',
      email: 'verified@example.com',
      username: 'verified_user',
      password: 'VerifiedPassword!2026',
    };

    await request(app!.getHttpServer()).post('/api/auth/register').send(registration).expect(201);
    await request(app!.getHttpServer())
      .post('/api/auth/login')
      .send({ email: registration.email, password: registration.password })
      .expect(401);

    await request(app!.getHttpServer()).post('/api/verification/verify').send({ token: verificationToken }).expect(200);

    const login = await request(app!.getHttpServer())
      .post('/api/auth/login')
      .send({ email: registration.email, password: registration.password })
      .expect(200);

    const tokens = login.body as TokenResponse;
    expect(tokens).toMatchObject({ tokenType: 'Bearer' });
    expect(tokens.accessToken).toEqual(expect.any(String));
    expect(tokens.refreshToken).toEqual(expect.any(String));

    await request(app!.getHttpServer()).get('/api/auth/me').expect(401);
    const profile = await request(app!.getHttpServer())
      .get('/api/auth/me')
      .auth(tokens.accessToken, { type: 'bearer' })
      .expect(200);
    expect(profile.body).toMatchObject({ email: registration.email, username: registration.username });
    expect(JSON.stringify(profile.body)).not.toContain('password');
  });

  it('rejects invalid credentials and refresh tokens', async () => {
    await request(app!.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'missing@example.com', password: 'WrongPassword!2026' })
      .expect(401);
    const response = await request(app!.getHttpServer())
      .post('/api/auth/refresh')
      .send({ refresh: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyIn0.invalid' })
      .expect(401);
    expect((response.body as { message: string }).message).toBe('Refresh token is invalid or expired.');
  });
});
