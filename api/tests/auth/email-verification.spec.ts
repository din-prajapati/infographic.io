import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { AuthService } from '../../src/modules/auth/services/auth.service';

// ---------------------------------------------------------------------------
// Mock prisma singleton — vi.hoisted ensures mockPrisma exists before vi.mock
// ---------------------------------------------------------------------------
const { mockPrisma } = vi.hoisted(() => {
  const mockPrisma = {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    organization: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    emailVerificationToken: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
  };
  return { mockPrisma };
});

vi.mock('../../src/database/prisma.client', () => ({
  prisma: mockPrisma,
}));

vi.mock('bcrypt', () => ({
  hash: vi.fn().mockResolvedValue('hashed-password'),
  compare: vi.fn().mockResolvedValue(true),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const now = new Date('2026-09-18T10:00:00Z');
const HOUR = 60 * 60 * 1000;

function makeService() {
  const emailService = { send: vi.fn().mockResolvedValue({ sent: true }) };
  const jwtService = { sign: vi.fn().mockReturnValue('signed.jwt.token') };
  const service = new AuthService(jwtService as any, emailService as any);
  return { service, emailService, jwtService };
}

// ---------------------------------------------------------------------------
// Tests — US-LAUNCH-014 (AC2, AC4, AC5, AC6, AC7)
// ---------------------------------------------------------------------------
describe('AuthService — sign-up verification gate (US-LAUNCH-014)', () => {
  let service: AuthService;
  let emailService: { send: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(now);

    ({ service, emailService } = makeService());

    mockPrisma.user.findFirst.mockResolvedValue(null);
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.organization.create.mockResolvedValue({ id: 'org_new' });
    mockPrisma.user.create.mockResolvedValue({
      id: 'user_new',
      email: 'jane@company.com',
      name: 'Jane',
      organizationId: 'org_new',
      emailVerified: false,
    });
    mockPrisma.emailVerificationToken.create.mockResolvedValue({ id: 'evt_1' });
    mockPrisma.emailVerificationToken.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.user.update.mockResolvedValue({});
    mockPrisma.emailVerificationToken.update.mockResolvedValue({});
  });

  // -------------------------------------------------------------------------
  // (a) AC2 — disposable domain refused before any write
  // -------------------------------------------------------------------------
  describe('register() — disposable domains (AC2)', () => {
    it('throws 400 DISPOSABLE_EMAIL_NOT_ALLOWED and creates no organization, user or token', async () => {
      const promise = service.register({
        email: 'throwaway@mailinator.com',
        password: 'password123',
      } as any);

      await expect(promise).rejects.toBeInstanceOf(BadRequestException);

      const error = await promise.catch((e) => e);
      expect(error.getResponse()).toMatchObject({
        code: 'DISPOSABLE_EMAIL_NOT_ALLOWED',
        message: "Please use a permanent email address — temporary inboxes aren't supported.",
      });

      expect(mockPrisma.organization.create).not.toHaveBeenCalled();
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
      expect(mockPrisma.emailVerificationToken.create).not.toHaveBeenCalled();
      expect(emailService.send).not.toHaveBeenCalled();
    });

    it('blocks a subdomain of a disposable provider too', async () => {
      await expect(
        service.register({ email: 'a@x.mailinator.com', password: 'password123' } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('does not even look the address up in the database', async () => {
      await service
        .register({ email: 'a@mailinator.com', password: 'password123' } as any)
        .catch(() => undefined);
      expect(mockPrisma.user.findFirst).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // (b) AC4 — duplicate detection via emailNormalized
  // -------------------------------------------------------------------------
  describe('register() — duplicate detection (AC4)', () => {
    it('throws 409 when an existing user matches on emailNormalized', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'user_existing',
        email: 'john.doe@gmail.com',
        emailNormalized: 'johndoe@gmail.com',
      });

      await expect(
        service.register({ email: 'John.Doe+promo@GMail.com', password: 'password123' } as any),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(mockPrisma.organization.create).not.toHaveBeenCalled();
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('queries on the address as typed OR its normalized form', async () => {
      await service
        .register({ email: 'John.Doe+promo@GMail.com', password: 'password123' } as any)
        .catch(() => undefined);

      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [{ email: 'John.Doe+promo@GMail.com' }, { emailNormalized: 'johndoe@gmail.com' }],
        },
      });
    });
  });

  // -------------------------------------------------------------------------
  // (c) AC5 — successful register mints a token and sends once
  // -------------------------------------------------------------------------
  describe('register() — verification email (AC5)', () => {
    it('creates the user unverified with its normalized alias key', async () => {
      await service.register({
        email: 'Jane+news@Company.com',
        password: 'password123',
        name: 'Jane',
      } as any);

      expect(mockPrisma.user.create).toHaveBeenCalledTimes(1);
      const data = mockPrisma.user.create.mock.calls[0][0].data;
      expect(data.emailVerified).toBe(false);
      expect(data.emailNormalized).toBe('jane@company.com');
      // the stored address is what the user typed, NOT the normalized form
      expect(data.email).toBe('Jane+news@Company.com');
    });

    it('stores only a 64-char hex hash and a ~24h expiry', async () => {
      await service.register({ email: 'jane@company.com', password: 'password123' } as any);

      expect(mockPrisma.emailVerificationToken.create).toHaveBeenCalledTimes(1);
      const data = mockPrisma.emailVerificationToken.create.mock.calls[0][0].data;
      expect(data.userId).toBe('user_new');
      expect(data.tokenHash).toMatch(/^[0-9a-f]{64}$/);
      expect(data.expiresAt.getTime() - now.getTime()).toBe(24 * HOUR);
      // the raw token is never persisted
      expect(JSON.stringify(data)).not.toContain('token"');
    });

    it('sends exactly one email whose subject mentions verifying and whose body carries the link', async () => {
      await service.register({ email: 'jane@company.com', password: 'password123' } as any);

      expect(emailService.send).toHaveBeenCalledTimes(1);
      const params = emailService.send.mock.calls[0][0];
      expect(params.to).toBe('jane@company.com');
      expect(params.subject.toLowerCase()).toContain('verify');
      expect(params.text).toContain('/auth/verify-email?token=');
      // the link carries the RAW token, which must not equal the stored hash
      const rawToken = params.text.match(/\/auth\/verify-email\?token=([0-9a-f]+)/)![1];
      const storedHash = mockPrisma.emailVerificationToken.create.mock.calls[0][0].data.tokenHash;
      expect(rawToken).not.toBe(storedHash);
    });

    it('returns user.emailVerified alongside the JWT', async () => {
      const result = await service.register({
        email: 'jane@company.com',
        password: 'password123',
      } as any);

      expect(result.user.emailVerified).toBe(false);
      expect(result.token).toBe('signed.jwt.token');
    });
  });

  // -------------------------------------------------------------------------
  // AC14/AC15/AC18 — internal test-account allowlist.
  // The env var is saved and restored per case so nothing leaks into the suites
  // above (which all assume the production posture: allowlist off).
  // -------------------------------------------------------------------------
  describe('register() — internal test allowlist (AC15)', () => {
    const originalDomains = process.env.INTERNAL_TEST_EMAIL_DOMAINS;

    beforeEach(() => {
      process.env.INTERNAL_TEST_EMAIL_DOMAINS = 'test.local';
      mockPrisma.user.create.mockResolvedValue({
        id: 'user_e2e',
        email: 'e2e-1@test.local',
        name: null,
        organizationId: 'org_new',
        emailVerified: true,
      });
    });

    afterEach(() => {
      if (originalDomains === undefined) delete process.env.INTERNAL_TEST_EMAIL_DOMAINS;
      else process.env.INTERNAL_TEST_EMAIL_DOMAINS = originalDomains;
    });

    it('creates the account pre-verified, mints no token and sends no email', async () => {
      const result = await service.register({
        email: 'e2e-1@test.local',
        password: 'password123',
      } as any);

      const data = mockPrisma.user.create.mock.calls[0][0].data;
      expect(data.emailVerified).toBe(true);
      expect(data.emailVerifiedAt).toBeInstanceOf(Date);
      expect(mockPrisma.emailVerificationToken.create).not.toHaveBeenCalled();
      expect(emailService.send).not.toHaveBeenCalled();
      expect(result.user.emailVerified).toBe(true);
    });

    it('skips the disposable-domain check for an allowlisted address', async () => {
      process.env.INTERNAL_TEST_EMAIL_DOMAINS = 'mailinator.com';

      await expect(
        service.register({ email: 'e2e-2@mailinator.com', password: 'password123' } as any),
      ).resolves.toMatchObject({ token: 'signed.jwt.token' });

      expect(mockPrisma.user.create).toHaveBeenCalledTimes(1);
    });

    it('still enforces the AC4 duplicate check — a repeat address is a 409', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'user_existing',
        email: 'e2e-1@test.local',
        emailNormalized: 'e2e-1@test.local',
      });

      await expect(
        service.register({ email: 'e2e-1@test.local', password: 'password123' } as any),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('grants nothing extra — the organization is still a free, 3-generation org', async () => {
      await service.register({ email: 'e2e-1@test.local', password: 'password123' } as any);

      expect(mockPrisma.organization.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ planTier: 'free', monthlyLimit: 3 }),
      });
    });

    it('does NOT apply to a look-alike or subdomain of the allowlisted domain', async () => {
      for (const email of ['e2e@evil-test.local', 'e2e@sub.test.local']) {
        vi.clearAllMocks();
        mockPrisma.user.findFirst.mockResolvedValue(null);
        mockPrisma.organization.create.mockResolvedValue({ id: 'org_new' });
        mockPrisma.user.create.mockResolvedValue({
          id: 'user_x',
          email,
          organizationId: 'org_new',
          emailVerified: false,
        });
        mockPrisma.emailVerificationToken.create.mockResolvedValue({ id: 'evt_x' });

        await service.register({ email, password: 'password123' } as any);

        expect(mockPrisma.user.create.mock.calls[0][0].data.emailVerified).toBe(false);
        expect(mockPrisma.emailVerificationToken.create).toHaveBeenCalledTimes(1);
        expect(emailService.send).toHaveBeenCalledTimes(1);
      }
    });

    it('is inert when the variable is unset — the same address registers unverified', async () => {
      delete process.env.INTERNAL_TEST_EMAIL_DOMAINS;
      mockPrisma.user.create.mockResolvedValue({
        id: 'user_e2e',
        email: 'e2e-1@test.local',
        organizationId: 'org_new',
        emailVerified: false,
      });

      await service.register({ email: 'e2e-1@test.local', password: 'password123' } as any);

      expect(mockPrisma.user.create.mock.calls[0][0].data.emailVerified).toBe(false);
      expect(mockPrisma.emailVerificationToken.create).toHaveBeenCalledTimes(1);
      expect(emailService.send).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // (d) AC5 — email failure never fails the sign-up
  // -------------------------------------------------------------------------
  it('register() still returns the user and token when token creation throws (AC5)', async () => {
    mockPrisma.emailVerificationToken.create.mockRejectedValue(new Error('db down'));

    const result = await service.register({
      email: 'jane@company.com',
      password: 'password123',
    } as any);

    expect(result.user.id).toBe('user_new');
    expect(result.token).toBe('signed.jwt.token');
  });

  // -------------------------------------------------------------------------
  // (e)/(f) AC6 — verifyEmail
  // -------------------------------------------------------------------------
  describe('verifyEmail() (AC6)', () => {
    function validRecord(overrides: Record<string, unknown> = {}) {
      return {
        id: 'evt_1',
        userId: 'user_new',
        tokenHash: 'irrelevant-the-lookup-is-mocked',
        expiresAt: new Date(now.getTime() + HOUR),
        usedAt: null,
        ...overrides,
      };
    }

    it('marks the user verified and burns the token', async () => {
      mockPrisma.emailVerificationToken.findUnique.mockResolvedValue(validRecord());

      const result = await service.verifyEmail({ token: 'raw-token' } as any);

      expect(result).toEqual({ verified: true, userId: 'user_new' });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user_new' },
        data: { emailVerified: true, emailVerifiedAt: now },
      });
      expect(mockPrisma.emailVerificationToken.update).toHaveBeenCalledWith({
        where: { id: 'evt_1' },
        data: { usedAt: now },
      });
    });

    it('looks the token up by its hash, never by the raw value', async () => {
      mockPrisma.emailVerificationToken.findUnique.mockResolvedValue(validRecord());
      await service.verifyEmail({ token: 'raw-token' } as any);

      const where = mockPrisma.emailVerificationToken.findUnique.mock.calls[0][0].where;
      expect(where.tokenHash).toMatch(/^[0-9a-f]{64}$/);
      expect(where.tokenHash).not.toBe('raw-token');
    });

    it('rejects an expired token without mutating anything', async () => {
      mockPrisma.emailVerificationToken.findUnique.mockResolvedValue(
        validRecord({ expiresAt: new Date(now.getTime() - HOUR) }),
      );

      await expect(service.verifyEmail({ token: 'raw-token' } as any)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
      expect(mockPrisma.emailVerificationToken.update).not.toHaveBeenCalled();
    });

    it('rejects an already-used token without mutating anything', async () => {
      mockPrisma.emailVerificationToken.findUnique.mockResolvedValue(
        validRecord({ usedAt: new Date(now.getTime() - HOUR) }),
      );

      await expect(service.verifyEmail({ token: 'raw-token' } as any)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    // null-input branch (AC13)
    it('rejects an unknown token without mutating anything', async () => {
      mockPrisma.emailVerificationToken.findUnique.mockResolvedValue(null);

      await expect(service.verifyEmail({ token: 'never-issued' } as any)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
      expect(mockPrisma.emailVerificationToken.update).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // (g)/(h) AC7 — resendVerification
  // -------------------------------------------------------------------------
  describe('resendVerification() (AC7)', () => {
    it('is a no-op for an already-verified user — no token, no email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user_new',
        email: 'jane@company.com',
        emailVerified: true,
      });

      const result = await service.resendVerification('user_new');

      expect(result).toEqual({ alreadyVerified: true });
      expect(mockPrisma.emailVerificationToken.deleteMany).not.toHaveBeenCalled();
      expect(mockPrisma.emailVerificationToken.create).not.toHaveBeenCalled();
      expect(emailService.send).not.toHaveBeenCalled();
    });

    it('drops unused tokens, mints one and sends once for an unverified user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user_new',
        email: 'jane@company.com',
        emailVerified: false,
      });

      const result = await service.resendVerification('user_new');

      expect(result).toEqual({ sent: true });
      expect(mockPrisma.emailVerificationToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user_new', usedAt: null },
      });
      expect(mockPrisma.emailVerificationToken.create).toHaveBeenCalledTimes(1);
      expect(emailService.send).toHaveBeenCalledTimes(1);
    });

    it('reports { sent: true } even when delivery fails', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user_new',
        email: 'jane@company.com',
        emailVerified: false,
      });
      emailService.send.mockResolvedValue({ sent: false });

      await expect(service.resendVerification('user_new')).resolves.toEqual({ sent: true });
    });

    it('uses the id it was given and never trusts a client-supplied address', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user_new',
        email: 'jane@company.com',
        emailVerified: false,
      });

      await service.resendVerification('user_new');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'user_new' } }),
      );
      expect(emailService.send.mock.calls[0][0].to).toBe('jane@company.com');
    });
  });

  // -------------------------------------------------------------------------
  // (i) AC4 — googleLogin links rather than duplicates
  // -------------------------------------------------------------------------
  describe('googleLogin() — alias linking (AC4)', () => {
    it('links to an existing account matched only by emailNormalized', async () => {
      // no googleId match
      mockPrisma.user.findUnique.mockResolvedValue(null);
      // the email lookup matches on the normalized alias
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'user_existing',
        email: 'john.doe@gmail.com',
        emailNormalized: 'johndoe@gmail.com',
        avatarUrl: null,
        organizationId: 'org_existing',
        name: 'John',
      });
      mockPrisma.user.update.mockResolvedValue({
        id: 'user_existing',
        email: 'john.doe@gmail.com',
        name: 'John',
        organizationId: 'org_existing',
      });

      await service.googleLogin({
        googleId: 'g-123',
        email: 'johndoe@gmail.com',
        name: 'John',
      });

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'user_existing' } }),
      );
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
      expect(mockPrisma.organization.create).not.toHaveBeenCalled();

      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [{ email: 'johndoe@gmail.com' }, { emailNormalized: 'johndoe@gmail.com' }],
        },
      });
    });

    it('stores emailNormalized when it creates a brand-new Google user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'user_g',
        email: 'New.User+tag@gmail.com',
        name: 'New User',
        organizationId: 'org_new',
      });

      await service.googleLogin({
        googleId: 'g-456',
        email: 'New.User+tag@gmail.com',
        name: 'New User',
      });

      const data = mockPrisma.user.create.mock.calls[0][0].data;
      expect(data.emailNormalized).toBe('newuser@gmail.com');
      expect(data.email).toBe('New.User+tag@gmail.com');
      // Google proved the inbox — no verification email is sent on this path
      expect(emailService.send).not.toHaveBeenCalled();
    });
  });
});
