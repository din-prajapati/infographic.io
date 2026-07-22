import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import { AuthService } from '../../src/modules/auth/services/auth.service';

// ---------------------------------------------------------------------------
// Mocks (hoisted so the vi.mock factory can reference them)
// ---------------------------------------------------------------------------
const { mockPrisma, mockBcrypt } = vi.hoisted(() => {
  const mockPrisma = {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    passwordResetToken: {
      deleteMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  };
  const mockBcrypt = {
    hash: vi.fn().mockResolvedValue('bcrypt_hash'),
    compare: vi.fn(),
  };
  return { mockPrisma, mockBcrypt };
});

vi.mock('../../src/database/prisma.client', () => ({ prisma: mockPrisma }));
vi.mock('bcrypt', () => mockBcrypt);

const mockJwtService = { sign: vi.fn().mockReturnValue('jwt') };
const mockEmailService = { send: vi.fn().mockResolvedValue({ sent: true }) };

const sha256 = (raw: string) => crypto.createHash('sha256').update(raw).digest('hex');

describe('AuthService — password reset (US-LAUNCH-003)', () => {
  let service: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockBcrypt.hash.mockResolvedValue('bcrypt_hash');
    mockEmailService.send.mockResolvedValue({ sent: true });
    service = new AuthService(mockJwtService as any, mockEmailService as any);
  });

  // AC1 --------------------------------------------------------------------
  it('AC1: existing local account → hashed 1h token created + reset link emailed', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'u1', email: 'a@b.com', password: 'existing_bcrypt', provider: 'local',
    });
    mockPrisma.passwordResetToken.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.passwordResetToken.create.mockResolvedValue({});

    const res = await service.forgotPassword({ email: 'a@b.com' });

    // prior unused tokens dropped (throttle)
    expect(mockPrisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'u1', usedAt: null },
    });
    // token row: hashed (64 hex chars), ~1h expiry
    const createArg = mockPrisma.passwordResetToken.create.mock.calls[0][0];
    expect(createArg.data.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(createArg.data.userId).toBe('u1');
    const ttlMs = createArg.data.expiresAt.getTime() - Date.now();
    expect(ttlMs).toBeGreaterThan(59 * 60 * 1000);
    expect(ttlMs).toBeLessThanOrEqual(60 * 60 * 1000 + 1000);
    // email carries the raw-token link
    const email = mockEmailService.send.mock.calls[0][0];
    expect(email.to).toBe('a@b.com');
    expect(email.subject).toBe('Reset your Buildographic password');
    expect(email.text).toContain('/auth/reset?token=');
    // generic response
    expect(res.message).toContain('If an account exists');
  });

  // AC2 — raw token never equals the stored hash --------------------------
  it('AC2: stored tokenHash is the SHA-256 of the raw token in the email link', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'u1', email: 'a@b.com', password: 'existing_bcrypt', provider: 'local',
    });
    mockPrisma.passwordResetToken.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.passwordResetToken.create.mockResolvedValue({});

    await service.forgotPassword({ email: 'a@b.com' });

    const storedHash = mockPrisma.passwordResetToken.create.mock.calls[0][0].data.tokenHash;
    const link = mockEmailService.send.mock.calls[0][0].text as string;
    const rawToken = link.match(/token=([a-f0-9]+)/)![1];
    expect(rawToken).not.toBe(storedHash);
    expect(sha256(rawToken)).toBe(storedHash);
  });

  // AC1 — no enumeration ---------------------------------------------------
  it('AC1: unknown email → no token, no email, same generic response', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const res = await service.forgotPassword({ email: 'nobody@x.com' });

    expect(mockPrisma.passwordResetToken.create).not.toHaveBeenCalled();
    expect(mockEmailService.send).not.toHaveBeenCalled();
    expect(res.message).toContain('If an account exists');
  });

  // AC5 — Google-only account ---------------------------------------------
  it('AC5: OAuth-only account → "sign in with Google" email, no token', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'u2', email: 'g@b.com', password: '', provider: 'google',
    });

    const res = await service.forgotPassword({ email: 'g@b.com' });

    expect(mockPrisma.passwordResetToken.create).not.toHaveBeenCalled();
    expect(mockEmailService.send).toHaveBeenCalledOnce();
    expect(mockEmailService.send.mock.calls[0][0].text).toContain('Google');
    expect(res.message).toContain('If an account exists');
  });

  // AC3 — valid reset ------------------------------------------------------
  it('AC3: valid unexpired unused token → password updated + token marked used', async () => {
    const raw = 'raw_token_abc';
    mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
      id: 't1', userId: 'u1', tokenHash: sha256(raw), usedAt: null,
      expiresAt: new Date(Date.now() + 3600_000),
    });
    mockPrisma.user.update.mockResolvedValue({});
    mockPrisma.passwordResetToken.update.mockResolvedValue({});

    const res = await service.resetPassword({ token: raw, newPassword: 'newpass123' });

    expect(mockPrisma.passwordResetToken.findUnique).toHaveBeenCalledWith({
      where: { tokenHash: sha256(raw) },
    });
    expect(mockBcrypt.hash).toHaveBeenCalledWith('newpass123', 10);
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' }, data: { password: 'bcrypt_hash' },
    });
    // marked used
    expect(mockPrisma.passwordResetToken.update.mock.calls[0][0].data.usedAt).toBeInstanceOf(Date);
    expect(res.message).toContain('updated');
  });

  // AC3 — invalid token variants ------------------------------------------
  it('AC3: unknown token → 400, no password change', async () => {
    mockPrisma.passwordResetToken.findUnique.mockResolvedValue(null);
    await expect(service.resetPassword({ token: 'nope', newPassword: 'newpass123' }))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  it('AC3: expired token → 400, no password change', async () => {
    mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
      id: 't2', userId: 'u1', tokenHash: 'h', usedAt: null,
      expiresAt: new Date(Date.now() - 1000),
    });
    await expect(service.resetPassword({ token: 'x', newPassword: 'newpass123' }))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  it('AC3: already-used token → 400, no password change', async () => {
    mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
      id: 't3', userId: 'u1', tokenHash: 'h', usedAt: new Date(),
      expiresAt: new Date(Date.now() + 3600_000),
    });
    await expect(service.resetPassword({ token: 'x', newPassword: 'newpass123' }))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });
});
