import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { EmailVerifiedGuard } from '../../src/common/guards/email-verified.guard';

// ---------------------------------------------------------------------------
// Mock prisma singleton — vi.hoisted ensures mockPrisma exists before vi.mock
// ---------------------------------------------------------------------------
const { mockPrisma } = vi.hoisted(() => {
  const mockPrisma = {
    user: {
      findUnique: vi.fn(),
    },
  };
  return { mockPrisma };
});

vi.mock('../../src/database/prisma.client', () => ({
  prisma: mockPrisma,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeContext(user: unknown): any {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  };
}

// ---------------------------------------------------------------------------
// Tests — US-LAUNCH-014 AC8
// ---------------------------------------------------------------------------
describe('EmailVerifiedGuard (US-LAUNCH-014 AC8)', () => {
  let guard: EmailVerifiedGuard;

  beforeEach(() => {
    vi.clearAllMocks();
    guard = new EmailVerifiedGuard();
  });

  it('lets a verified user through', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ emailVerified: true });

    await expect(guard.canActivate(makeContext({ id: 'user_1' }))).resolves.toBe(true);
  });

  it('throws 403 EMAIL_NOT_VERIFIED for an unverified user', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ emailVerified: false });

    const promise = guard.canActivate(makeContext({ id: 'user_1' }));
    await expect(promise).rejects.toBeInstanceOf(ForbiddenException);

    const error = await promise.catch((e) => e);
    expect(error.getStatus()).toBe(403);
    expect(error.getResponse()).toEqual({
      code: 'EMAIL_NOT_VERIFIED',
      message: 'Please verify your email address to generate designs.',
    });
  });

  it('reads emailVerified from the database, not from req.user', async () => {
    // req.user carries a stale/forged `emailVerified: true` — the DB says otherwise
    // and the DB must win.
    mockPrisma.user.findUnique.mockResolvedValue({ emailVerified: false });

    await expect(
      guard.canActivate(makeContext({ id: 'user_1', emailVerified: true })),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user_1' },
      select: { emailVerified: true },
    });
  });

  it('does not trust a req.user that claims to be unverified either — the DB decides', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ emailVerified: true });

    await expect(
      guard.canActivate(makeContext({ id: 'user_1', emailVerified: false })),
    ).resolves.toBe(true);
  });

  it('queries the database on every call — no per-process caching of the verdict', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ emailVerified: true });

    await guard.canActivate(makeContext({ id: 'user_1' }));
    await guard.canActivate(makeContext({ id: 'user_1' }));

    expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(2);
  });

  // null-input branches (AC13)
  it('throws 401, not 403, when req.user is absent', async () => {
    await expect(guard.canActivate(makeContext(undefined))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('throws 401 when the user row no longer exists', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(guard.canActivate(makeContext({ id: 'ghost' }))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
