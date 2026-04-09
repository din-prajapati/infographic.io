import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthService } from '../../src/modules/auth/services/auth.service';

// ---------------------------------------------------------------------------
// vi.hoisted ensures mocks exist before vi.mock hoists the factory to the top
// ---------------------------------------------------------------------------
const { mockPrisma, mockBcrypt, mockJwtService } = vi.hoisted(() => {
  const mockPrisma = {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
    organization: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  };

  const mockBcrypt = {
    hash: vi.fn(),
    compare: vi.fn(),
  };

  const mockJwtService = {
    sign: vi.fn().mockReturnValue('mock_jwt_token'),
  };

  return { mockPrisma, mockBcrypt, mockJwtService };
});

vi.mock('../../src/database/prisma.client', () => ({
  prisma: mockPrisma,
}));

vi.mock('bcrypt', () => mockBcrypt);

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------
const TEST_USER = {
  id: 'user_001',
  email: 'test@infographic.ai',
  password: 'hashed_password',
  name: 'Test User',
  organizationId: 'org_001',
  googleId: null,
  avatarUrl: null,
  provider: 'local',
};

const TEST_ORG = {
  id: 'org_001',
  name: "Test Org",
  planTier: 'free',
  monthlyLimit: 3,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AuthService(mockJwtService as any);
    mockBcrypt.hash.mockResolvedValue('hashed_password');
    mockBcrypt.compare.mockResolvedValue(true);
  });

  // -------------------------------------------------------------------------
  // register()
  // -------------------------------------------------------------------------
  describe('register()', () => {
    it('calls bcrypt.hash and stores user with hashed password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.organization.create.mockResolvedValue(TEST_ORG);
      mockPrisma.user.create.mockResolvedValue({
        id: 'user_001',
        email: 'test@infographic.ai',
        name: 'Test User',
        organizationId: 'org_001',
      });

      await service.register({
        email: 'test@infographic.ai',
        password: 'plaintext',
        name: 'Test User',
        organizationName: 'My Org',
      });

      expect(mockBcrypt.hash).toHaveBeenCalledWith('plaintext', 10);
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ password: 'hashed_password' }),
        }),
      );
    });

    it('throws ConflictException (409) when email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(TEST_USER);

      await expect(
        service.register({
          email: 'test@infographic.ai',
          password: 'pass',
          name: 'Test',
          organizationName: 'Org',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('creates new organization with planTier=free and monthlyLimit=3', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.organization.create.mockResolvedValue(TEST_ORG);
      mockPrisma.user.create.mockResolvedValue({
        id: 'user_002',
        email: 'new@test.com',
        name: 'New User',
        organizationId: 'org_001',
      });

      await service.register({
        email: 'new@test.com',
        password: 'pass',
        name: 'New User',
        organizationName: 'New Org',
      });

      expect(mockPrisma.organization.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            planTier: 'free',
            monthlyLimit: 3,
          }),
        }),
      );
    });

    it('returns { user, token }', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.organization.create.mockResolvedValue(TEST_ORG);
      mockPrisma.user.create.mockResolvedValue({
        id: 'user_001',
        email: 'test@infographic.ai',
        name: 'Test User',
        organizationId: 'org_001',
      });

      const result = await service.register({
        email: 'test@infographic.ai',
        password: 'pass',
        name: 'Test User',
        organizationName: 'Org',
      });

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
    });

    it('joins existing org without creating a new one when organizationId provided', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      // canAddUserToOrganization: org exists + under user limit
      mockPrisma.organization.findUnique.mockResolvedValue({ ...TEST_ORG, planTier: 'team' });
      mockPrisma.user.count.mockResolvedValue(1); // under limit
      mockPrisma.user.create.mockResolvedValue({
        id: 'user_002',
        email: 'new@test.com',
        name: 'New User',
        organizationId: 'org_001',
      });

      await service.register({
        email: 'new@test.com',
        password: 'pass',
        name: 'New User',
        organizationId: 'org_001',
      });

      expect(mockPrisma.organization.create).not.toHaveBeenCalled();
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ organizationId: 'org_001' }),
        }),
      );
    });
  });

  // -------------------------------------------------------------------------
  // login()
  // -------------------------------------------------------------------------
  describe('login()', () => {
    it('returns JWT token for valid credentials', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(TEST_USER);
      mockBcrypt.compare.mockResolvedValue(true);

      const result = await service.login({
        email: 'test@infographic.ai',
        password: 'plaintext',
      });

      expect(result).toHaveProperty('token');
      expect(result.token).toBe('mock_jwt_token');
    });

    it('throws UnauthorizedException for wrong password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(TEST_USER);
      mockBcrypt.compare.mockResolvedValue(false);

      await expect(
        service.login({ email: 'test@infographic.ai', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for unknown email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nobody@test.com', password: 'pass' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // -------------------------------------------------------------------------
  // JWT payload
  // -------------------------------------------------------------------------
  describe('JWT payload', () => {
    it('signs token with sub and email fields', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.organization.create.mockResolvedValue(TEST_ORG);
      mockPrisma.user.create.mockResolvedValue({
        id: 'user_001',
        email: 'test@infographic.ai',
        name: 'Test User',
        organizationId: 'org_001',
      });

      await service.register({
        email: 'test@infographic.ai',
        password: 'pass',
        name: 'Test',
        organizationName: 'Org',
      });

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: 'user_001',
          email: 'test@infographic.ai',
        }),
      );
    });
  });

  // -------------------------------------------------------------------------
  // googleLogin()
  // -------------------------------------------------------------------------
  describe('googleLogin()', () => {
    it('creates user and org with planTier=free on first Google login', async () => {
      // findUnique by googleId → null; findUnique by email → null (new user)
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.organization.create.mockResolvedValue(TEST_ORG);
      mockPrisma.user.create.mockResolvedValue({ ...TEST_USER, googleId: 'gid_001' });

      const result = await service.googleLogin({
        googleId: 'gid_001',
        email: 'google@test.com',
        name: 'Google User',
      });

      expect(result).toHaveProperty('code');
      expect(mockPrisma.organization.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ planTier: 'free' }),
        }),
      );
    });

    it('links googleId to existing account when email matches but googleId not yet set', async () => {
      // First call: findUnique by googleId → null; second call: findUnique by email → existing
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(null)       // by googleId
        .mockResolvedValueOnce(TEST_USER); // by email
      mockPrisma.user.update.mockResolvedValue({ ...TEST_USER, googleId: 'gid_new' });

      const result = await service.googleLogin({
        googleId: 'gid_new',
        email: TEST_USER.email,
        name: TEST_USER.name,
      });

      expect(result).toHaveProperty('code');
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ googleId: 'gid_new' }),
        }),
      );
      expect(mockPrisma.organization.create).not.toHaveBeenCalled();
    });

    it('returns code without creating records when googleId already linked', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...TEST_USER, googleId: 'gid_existing' });

      const result = await service.googleLogin({
        googleId: 'gid_existing',
        email: TEST_USER.email,
        name: TEST_USER.name,
      });

      expect(result).toHaveProperty('code');
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
      expect(mockPrisma.organization.create).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // exchangeOAuthCode()
  // -------------------------------------------------------------------------
  describe('exchangeOAuthCode()', () => {
    it('throws UnauthorizedException for an invalid or expired code', () => {
      expect(() => service.exchangeOAuthCode('invalid_code_xyz')).toThrow(UnauthorizedException);
    });

    it('returns { user, token } for a valid unexpired code', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.organization.create.mockResolvedValue(TEST_ORG);
      mockPrisma.user.create.mockResolvedValue({ ...TEST_USER, googleId: 'gid_001' });

      // googleLogin stores a code internally
      const { code } = await service.googleLogin({
        googleId: 'gid_001',
        email: 'google@test.com',
        name: 'Google User',
      });

      const result = service.exchangeOAuthCode(code);

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
    });

    it('throws UnauthorizedException if the same code is used twice (single-use)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.organization.create.mockResolvedValue(TEST_ORG);
      mockPrisma.user.create.mockResolvedValue({ ...TEST_USER, googleId: 'gid_002' });

      const { code } = await service.googleLogin({
        googleId: 'gid_002',
        email: 'google2@test.com',
        name: 'Google User 2',
      });

      service.exchangeOAuthCode(code); // first use — ok
      expect(() => service.exchangeOAuthCode(code)).toThrow(UnauthorizedException); // second use — invalid
    });
  });
});
