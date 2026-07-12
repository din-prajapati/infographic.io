import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmailService } from '../../src/modules/email/email.service';

// ---------------------------------------------------------------------------
// Hoist mock state so the vi.mock factory can reference it at hoist time
// ---------------------------------------------------------------------------
const { mockEmailsSend } = vi.hoisted(() => {
  const mockEmailsSend = vi.fn().mockResolvedValue({ id: 'test-email-id-123' });
  return { mockEmailsSend };
});

// Mock the Resend SDK — no real network, no real API key required (AC5)
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: mockEmailsSend },
  })),
}));

// ---------------------------------------------------------------------------
// Helper: build EmailService with controlled config (no NestJS test harness)
// ---------------------------------------------------------------------------
function buildService(env: Record<string, string | undefined>): EmailService {
  const mockConfig = {
    get: (key: string) => env[key] ?? undefined,
  };
  return new EmailService(mockConfig as any);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('EmailService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEmailsSend.mockResolvedValue({ id: 'test-email-id-123' });
  });

  // TC-LAUNCH-002-01 — Provider called with correct payload when key is set
  describe('with RESEND_API_KEY set', () => {
    it('sends email through provider with correct to, from, subject, and html', async () => {
      const service = buildService({
        RESEND_API_KEY: 'test-key-abc',
        EMAIL_FROM: 'hello@example.com',
      });

      const result = await service.send({
        to: 'user@test.com',
        subject: 'Welcome!',
        html: '<p>Hello world</p>',
      });

      expect(result).toEqual({ sent: true });
      expect(mockEmailsSend).toHaveBeenCalledOnce();
      expect(mockEmailsSend).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'hello@example.com',
          to: 'user@test.com',
          subject: 'Welcome!',
          html: '<p>Hello world</p>',
        }),
      );
    });

    it('includes text field when provided', async () => {
      const service = buildService({
        RESEND_API_KEY: 'test-key-abc',
        EMAIL_FROM: 'sender@example.com',
      });

      await service.send({
        to: 'user@test.com',
        subject: 'Reset',
        html: '<p>Click here</p>',
        text: 'Click here',
      });

      expect(mockEmailsSend).toHaveBeenCalledWith(
        expect.objectContaining({ text: 'Click here' }),
      );
    });

    it('falls back to noreply@example.com when EMAIL_FROM is absent', async () => {
      const service = buildService({ RESEND_API_KEY: 'test-key-abc' });

      await service.send({ to: 'user@test.com', subject: 'Test', html: '<p>x</p>' });

      expect(mockEmailsSend).toHaveBeenCalledWith(
        expect.objectContaining({ from: 'noreply@example.com' }),
      );
    });
  });

  // TC-LAUNCH-002-02 — Console fallback when no RESEND_API_KEY
  describe('without RESEND_API_KEY', () => {
    it('resolves { sent: true, dev: true } and does NOT call the provider', async () => {
      const service = buildService({});

      const result = await service.send({
        to: 'user@test.com',
        subject: 'Password reset',
        text: 'Your reset link: https://example.com/reset/token123',
      });

      expect(result).toEqual({ sent: true, dev: true });
      expect(mockEmailsSend).not.toHaveBeenCalled();
    });

    it('does not throw when html and text are both absent', async () => {
      const service = buildService({});

      await expect(
        service.send({ to: 'user@test.com', subject: 'Empty' }),
      ).resolves.toEqual({ sent: true, dev: true });
    });
  });

  // TC-LAUNCH-002-03 — Error swallowing: never throws to callers
  describe('error handling', () => {
    it('returns { sent: false } when the provider throws', async () => {
      mockEmailsSend.mockRejectedValue(new Error('Rate limit exceeded'));

      const service = buildService({
        RESEND_API_KEY: 'test-key-abc',
        EMAIL_FROM: 'hello@example.com',
      });

      const result = await service.send({
        to: 'user@test.com',
        subject: 'Test',
        html: '<p>Hi</p>',
      });

      expect(result).toEqual({ sent: false });
    });

    it('never propagates provider exceptions — promise always resolves', async () => {
      mockEmailsSend.mockRejectedValue(new Error('Network timeout'));

      const service = buildService({
        RESEND_API_KEY: 'test-key-abc',
        EMAIL_FROM: 'hello@example.com',
      });

      // Must NOT reject — auth/webhook flows must survive email outages (AC4)
      await expect(
        service.send({ to: 'user@test.com', subject: 'Test', html: '<p>x</p>' }),
      ).resolves.not.toThrow();
    });
  });
});
