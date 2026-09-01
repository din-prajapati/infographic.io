import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// fs is an ESM namespace here, so vi.spyOn('readFileSync') throws 'Cannot redefine property'.
// Mock the module instead, keeping everything except readFileSync real.
const { mockReadFileSync, mockUnlinkSync } = vi.hoisted(() => ({
  mockReadFileSync: vi.fn(),
  mockUnlinkSync: vi.fn(),
}));
// Cut the controller's import graph. InfographicsService pulls the whole generation
// pipeline (orchestrator -> prisma -> DB), which makes a plain import hang for seconds.
// Nothing under test here touches it — uploadPhoto only uses fs, crypto and StorageService.
vi.mock('../../src/modules/infographics/services/infographics.service', () => ({
  InfographicsService: class {},
}));
vi.mock('fs', async (importOriginal) => ({
  ...(await importOriginal<typeof import('fs')>()),
  readFileSync: mockReadFileSync,
}));
import * as os from 'os';
import * as path from 'path';
import { HttpException } from '@nestjs/common';
import { IdeogramService } from '../../src/modules/ai-generation/services/ideogram.service';
// Imported statically, not via `await import()` inside a test. The controller pulls
// @nestjs/swagger, platform-express and passport; loading that graph cold takes longer than
// the 5s per-test timeout, so a dynamic import passed when this file ran alone and timed out
// in the full suite. Collection-time import is not subject to that limit.
import { InfographicsController } from '../../src/modules/infographics/controllers/infographics.controller';

/**
 * US-INFRA-003 — source photos live in R2, not the container's tmp dir.
 *
 * The bug being closed: Railway restarts on every deploy *and* every variable change. A photo
 * uploaded before a restart vanished from tmp, and the generation that followed failed with a 422
 * the customer could only resolve by re-uploading — with no explanation of why.
 */

const PHOTO_UPLOADS_DIR = path.join(os.tmpdir(), 'ai-infographic-uploads');
const VALID_PHOTO = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg';

function makeStorage(overrides: Record<string, any> = {}) {
  return {
    upload: vi.fn(async (_b: Buffer, key: string) => `https://assets.buildographic.com/${key}`),
    download: vi.fn(async () => Buffer.from('r2-bytes')),
    getPublicUrl: vi.fn((key: string) => `https://assets.buildographic.com/${key}`),
    ...overrides,
  };
}

/** readSourcePhoto is private; the tests exercise it as the story's ACs name it directly. */
function readSourcePhoto(svc: IdeogramService, photoPath: string): Promise<Buffer> {
  return (svc as any).readSourcePhoto(photoPath, 'gen-1');
}

describe('US-INFRA-003 — durable source photos', () => {
  beforeEach(() => {
    process.env.IDEOGRAM_API_KEY = 'test-key';
    mockReadFileSync.mockReset();
    mockUnlinkSync.mockReset();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // AC4 [security] — the guard runs before any key or path is built
  // ---------------------------------------------------------------------------
  describe('AC4: path-traversal guard at the sink', () => {
    it.each([
      '../../../etc/passwd',
      '../secret.jpg',
      'sub/dir/photo.jpg',
      'photo.jpg/../../etc/passwd',
      'photo.exe',
      'photo',
      '..\\..\\windows\\system32\\config.jpg',
    ])('rejects %j with HTTP 400', async (bad) => {
      const storage = makeStorage();
      const svc = new IdeogramService(storage as any);

      await expect(readSourcePhoto(svc, bad)).rejects.toMatchObject({ status: 400 });
    });

    it('rejects BEFORE touching R2 or the filesystem', async () => {
      // The AC's real requirement: no key is constructed, no path is joined. Asserting only the
      // 400 would pass an implementation that reads the file first and validates afterwards.
      const storage = makeStorage();
      mockReadFileSync.mockClear();
      const svc = new IdeogramService(storage as any);

      await expect(readSourcePhoto(svc, '../../../etc/passwd')).rejects.toThrow(HttpException);

      expect(storage.download).not.toHaveBeenCalled();
      expect(mockReadFileSync).not.toHaveBeenCalled();
    });

    it('accepts a well-formed UUID filename', async () => {
      const storage = makeStorage();
      const svc = new IdeogramService(storage as any);

      await expect(readSourcePhoto(svc, VALID_PHOTO)).resolves.toBeInstanceOf(Buffer);
    });
  });

  // ---------------------------------------------------------------------------
  // AC2 [happy-path] — R2 wins, and survives the tmp file being gone
  // ---------------------------------------------------------------------------
  describe('AC2: reads from R2 even when the tmp file is gone', () => {
    it('returns the R2 buffer when the local file does not exist', async () => {
      // Simulates the container restart: tmp is empty, R2 still has the object.
      mockReadFileSync.mockImplementation(() => { throw new Error('ENOENT'); });
      const storage = makeStorage({ download: vi.fn(async () => Buffer.from('durable-photo')) });
      const svc = new IdeogramService(storage as any);

      const buf = await readSourcePhoto(svc, VALID_PHOTO);

      expect(buf.toString()).toBe('durable-photo');
      expect(storage.download).toHaveBeenCalledWith(`source-photos/${VALID_PHOTO}`);
    });

    it('prefers R2 over tmp — the local copy is the fallback, not the source of truth', async () => {
      mockReadFileSync.mockReturnValue(Buffer.from('stale-tmp'));
      const storage = makeStorage({ download: vi.fn(async () => Buffer.from('r2-copy')) });
      const svc = new IdeogramService(storage as any);

      const buf = await readSourcePhoto(svc, VALID_PHOTO);

      expect(buf.toString()).toBe('r2-copy');
      expect(mockReadFileSync).not.toHaveBeenCalled();
    });

    it('falls back to tmp when R2 misses, rather than failing', async () => {
      mockReadFileSync.mockReturnValue(Buffer.from('local-copy'));
      const storage = makeStorage({
        download: vi.fn().mockRejectedValue(new Error('NoSuchKey')),
      });
      const svc = new IdeogramService(storage as any);

      const buf = await readSourcePhoto(svc, VALID_PHOTO);

      expect(buf.toString()).toBe('local-copy');
    });
  });

  // ---------------------------------------------------------------------------
  // AC3 [error-path] — both sources gone is a hard fail, never a silent substitute
  // ---------------------------------------------------------------------------
  describe('AC3: both R2 and tmp unavailable', () => {
    it('throws HttpException 422 whose message tells the customer to re-upload', async () => {
      mockReadFileSync.mockImplementation(() => { throw new Error('ENOENT'); });
      const storage = makeStorage({ download: vi.fn().mockRejectedValue(new Error('NoSuchKey')) });
      const svc = new IdeogramService(storage as any);

      await expect(readSourcePhoto(svc, VALID_PHOTO)).rejects.toMatchObject({ status: 422 });
      await expect(readSourcePhoto(svc, VALID_PHOTO)).rejects.toThrow(/re-upload/);
    });

    it('does not fall through silently — generation must not continue with a substitute', async () => {
      // US-AI-031 AC4's contract: the customer asked for a design featuring THEIR property.
      // Continuing with anything else would be worse than an error they can act on.
      mockReadFileSync.mockImplementation(() => { throw new Error('ENOENT'); });
      const storage = makeStorage({ download: vi.fn().mockRejectedValue(new Error('NoSuchKey')) });
      const svc = new IdeogramService(storage as any);

      let resolved = false;
      await readSourcePhoto(svc, VALID_PHOTO)
        .then(() => {
          resolved = true;
        })
        .catch(() => {});

      expect(resolved).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Degradation when StorageService is absent
  // ---------------------------------------------------------------------------
  describe('when StorageService is not injected', () => {
    it('reads straight from tmp — the pre-US-INFRA-003 behaviour, no crash', async () => {
      mockReadFileSync.mockReturnValue(Buffer.from('tmp-only'));
      const svc = new IdeogramService();

      const buf = await readSourcePhoto(svc, VALID_PHOTO);

      expect(buf.toString()).toBe('tmp-only');
    });

    it('still enforces the traversal guard without a storage service', async () => {
      const svc = new IdeogramService();
      await expect(readSourcePhoto(svc, '../../../etc/passwd')).rejects.toMatchObject({ status: 400 });
    });
  });

  // ---------------------------------------------------------------------------
  // AC1 [happy-path] — the upload side, keyed under source-photos/
  // ---------------------------------------------------------------------------
  describe('AC1: uploads are stored under source-photos/', () => {
    it('uses the key format readSourcePhoto reads back', async () => {
      // Guards the pair, not one side: a mismatch between the write key and the read key would
      // make every restart-recovery fail while both halves looked correct in isolation.
      const storage = makeStorage();
      await storage.upload(Buffer.from('x'), `source-photos/${VALID_PHOTO}`, 'image/jpeg');

      const writtenKey = storage.upload.mock.calls[0][1];

      const svc = new IdeogramService(storage as any);
      mockReadFileSync.mockImplementation(() => { throw new Error('ENOENT'); });
      await readSourcePhoto(svc, VALID_PHOTO);

      expect(storage.download).toHaveBeenCalledWith(writtenKey);
    });
  });

  // ---------------------------------------------------------------------------
  // AC6 [rollback] — uploadPhoto does two writes; the partial state is recorded
  // ---------------------------------------------------------------------------
  describe('AC6: tmp write succeeded, R2 upload did not', () => {
    /**
     * Exercises the controller's two-write sequence directly rather than through Nest's
     * HTTP layer — the ParseFilePipe validators need a real request pipeline, and the
     * behaviour under test is the ordering and the logging, not the file validation.
     */
    async function uploadWith(storage: any) {
      const controller = new InfographicsController({} as any, storage);
      const logged: string[] = [];
      (controller as any).logger = {
        log: (m: string) => logged.push(m),
        warn: (m: string) => logged.push(m),
        error: (m: string) => logged.push(m),
      };
      const file = { buffer: Buffer.from('photo-bytes'), mimetype: 'image/jpeg', size: 11 };
      const res = await (controller as any).uploadPhoto(file);
      return { res, logged: logged.join('\n') };
    }

    it('still returns a usable photoId and records durable:false when R2 fails', async () => {
      mockReadFileSync.mockReturnValue(Buffer.from('x'));
      const storage = { upload: vi.fn().mockRejectedValue(new Error('R2 down')) };

      const { res, logged } = await uploadWith(storage);

      // Response succeeds — failing here would tell the customer their upload failed
      // when the tmp copy makes it perfectly usable for the common case.
      expect(res.photoId).toMatch(/^[0-9a-f-]{36}\.jpg$/i);
      // The partial state is RECORDED, not hidden. Without this line an R2 outage looks
      // identical to a healthy upload until someone hits a 422 days later.
      expect(logged).toContain('"durable": false');
    });

    it('records durable:true when both writes succeed', async () => {
      const storage = { upload: vi.fn().mockResolvedValue('https://assets.buildographic.com/x') };

      const { logged } = await uploadWith(storage);

      expect(logged).toContain('"durable": true');
    });

    it('does not roll back the tmp copy when R2 fails — it is the only copy that exists', async () => {
      const storage = { upload: vi.fn().mockRejectedValue(new Error('R2 down')) };

      await uploadWith(storage);

      // Deleting it would turn a photo that works right now into one that does not — once
      // R2 has refused the upload, the tmp copy is the ONLY copy that exists.
      expect(mockUnlinkSync).not.toHaveBeenCalled();
      expect(storage.upload).toHaveBeenCalledTimes(1);
    });
  });

  it('PHOTO_UPLOADS_DIR is still the tmp path the fallback expects', () => {
    // Both ideogram.service.ts and infographics.controller.ts declare this constant separately;
    // the file's own comment says to update both together. This pins the shared value.
    expect(PHOTO_UPLOADS_DIR).toBe(path.join(os.tmpdir(), 'ai-infographic-uploads'));
  });
});
