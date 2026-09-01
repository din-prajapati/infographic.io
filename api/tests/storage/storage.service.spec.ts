import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the SDK before importing the service — StorageService constructs S3Client lazily, but the
// PutObjectCommand constructor is called on every upload and we assert on what it received.
const { mockSend, MockPutObjectCommand } = vi.hoisted(() => ({
  mockSend: vi.fn(),
  MockPutObjectCommand: vi.fn((input) => ({ input })),
}));

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn(() => ({ send: mockSend })),
  PutObjectCommand: MockPutObjectCommand,
}));

import { StorageService } from '../../src/modules/storage/services/storage.service';

const ENV_KEYS = [
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET_NAME',
  'R2_PUBLIC_URL',
] as const;

describe('StorageService (US-INFRA-001)', () => {
  let service: StorageService;
  let saved: Record<string, string | undefined>;

  beforeEach(() => {
    vi.clearAllMocks();
    saved = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
    process.env.R2_ACCOUNT_ID = 'acct123';
    process.env.R2_ACCESS_KEY_ID = 'key123';
    process.env.R2_SECRET_ACCESS_KEY = 'secret123';
    process.env.R2_BUCKET_NAME = 'buildographic-assets';
    process.env.R2_PUBLIC_URL = 'https://assets.buildographic.com';
    service = new StorageService();
  });

  afterEach(() => {
    for (const k of ENV_KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k] as string;
    }
  });

  // ---------------------------------------------------------------------------
  // AC1 / TC-INFRA-001-01
  // ---------------------------------------------------------------------------
  describe('AC1: upload() returns the owned URL on success', () => {
    it('resolves to R2_PUBLIC_URL + key when PutObjectCommand succeeds', async () => {
      mockSend.mockResolvedValue({});

      const url = await service.upload(Buffer.from('x'), 'infographics/img.jpg', 'image/jpeg');

      expect(url).toBe('https://assets.buildographic.com/infographics/img.jpg');
    });

    it('sends the buffer, key, bucket and contentType to PutObjectCommand', async () => {
      mockSend.mockResolvedValue({});
      const body = Buffer.from('payload');

      await service.upload(body, 'infographics/img.jpg', 'image/jpeg');

      expect(MockPutObjectCommand).toHaveBeenCalledWith({
        Bucket: 'buildographic-assets',
        Key: 'infographics/img.jpg',
        Body: body,
        ContentType: 'image/jpeg',
      });
      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // AC2 / TC-INFRA-001-03
  // ---------------------------------------------------------------------------
  describe('AC2: getPublicUrl() is synchronous and makes no network call', () => {
    it('returns base + key', () => {
      expect(service.getPublicUrl('composed/abc123.png')).toBe(
        'https://assets.buildographic.com/composed/abc123.png',
      );
    });

    it('never invokes S3Client.send', () => {
      service.getPublicUrl('composed/abc123.png');
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('does not produce a double slash when R2_PUBLIC_URL has a trailing slash', () => {
      // R2_PUBLIC_URL is hand-entered into an env file; a trailing slash there would
      // otherwise appear in every asset URL the product emits.
      process.env.R2_PUBLIC_URL = 'https://assets.buildographic.com/';

      expect(service.getPublicUrl('composed/a.png')).toBe(
        'https://assets.buildographic.com/composed/a.png',
      );
    });

    it('does not produce a double slash when the key has a leading slash', () => {
      expect(service.getPublicUrl('/composed/a.png')).toBe(
        'https://assets.buildographic.com/composed/a.png',
      );
    });
  });

  // ---------------------------------------------------------------------------
  // AC3 / TC-INFRA-001-02
  // ---------------------------------------------------------------------------
  describe('AC3: upload() re-throws rather than swallowing', () => {
    it('propagates the original error, not a transformed one', async () => {
      const original = new Error('R2 network failure');
      mockSend.mockRejectedValue(original);

      // The identity assertion matters: US-INFRA-002 decides what a storage failure means
      // for a generation. A wrapped or swallowed error would take that decision away and
      // make the fallback path indistinguishable from success.
      await expect(service.upload(Buffer.from('x'), 'k.jpg', 'image/jpeg')).rejects.toBe(original);
    });

    it('does not resolve to undefined on failure', async () => {
      mockSend.mockRejectedValue(new Error('R2 network failure'));

      await expect(service.upload(Buffer.from('x'), 'k.jpg')).rejects.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // TC-INFRA-001-04
  // ---------------------------------------------------------------------------
  // ---------------------------------------------------------------------------
  // AC7 [rollback] — exactly one provider write, so no partial state exists
  // ---------------------------------------------------------------------------
  describe('AC7: upload() is a single write', () => {
    it('invokes S3Client.send exactly once per upload', async () => {
      mockSend.mockResolvedValue({});

      await service.upload(Buffer.from('x'), 'infographics/img.jpg', 'image/jpeg');

      // The count is the contract. INFRA requires rollback coverage because storage work
      // normally pairs a provider write with a DB write and those are not atomic — see
      // US-INFRA-002 AC6. This service is the one place the property holds by construction.
      // If a second write is ever added here (a manifest, an index entry, a DB row), this
      // fails and forces the atomicity question at the point it becomes real.
      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(MockPutObjectCommand).toHaveBeenCalledTimes(1);
    });

    it('a failed upload leaves nothing behind to undo — one attempted write, no retry', async () => {
      mockSend.mockRejectedValue(new Error('R2 network failure'));

      await expect(service.upload(Buffer.from('x'), 'k.jpg')).rejects.toThrow();

      // No internal retry either: a silent retry would be a second write the caller
      // never asked for and cannot reason about.
      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });

  describe('contentType defaulting', () => {
    it('defaults to application/octet-stream when omitted', async () => {
      mockSend.mockResolvedValue({});

      await service.upload(Buffer.from('x'), 'infographics/img.jpg');

      expect(MockPutObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({ ContentType: 'application/octet-stream' }),
      );
    });

    it('never sends ContentType: undefined', async () => {
      // R2 would store the object with no Content-Type, and browsers would download it
      // instead of rendering it — a silent, visible-much-later failure.
      mockSend.mockResolvedValue({});

      await service.upload(Buffer.from('x'), 'infographics/img.jpg');

      const arg = MockPutObjectCommand.mock.calls.at(-1)![0] as { ContentType?: string };
      expect(arg.ContentType).toBeDefined();
    });
  });

  // ---------------------------------------------------------------------------
  // Unconfigured environments — R2 is unprovisioned in most of them today
  // ---------------------------------------------------------------------------
  describe('when R2 is not configured', () => {
    it('getPublicUrl() still works without credentials — it takes no network path', () => {
      delete process.env.R2_ACCESS_KEY_ID;
      delete process.env.R2_SECRET_ACCESS_KEY;

      expect(new StorageService().getPublicUrl('a/b.png')).toBe(
        'https://assets.buildographic.com/a/b.png',
      );
    });

    it('upload() names the missing variables rather than failing generically', async () => {
      delete process.env.R2_ACCESS_KEY_ID;

      await expect(new StorageService().upload(Buffer.from('x'), 'k.jpg')).rejects.toThrow(
        /R2_ACCESS_KEY_ID/,
      );
    });

    it('upload() reports a missing bucket by name', async () => {
      delete process.env.R2_BUCKET_NAME;

      await expect(new StorageService().upload(Buffer.from('x'), 'k.jpg')).rejects.toThrow(
        /R2_BUCKET_NAME/,
      );
    });
  });
});
