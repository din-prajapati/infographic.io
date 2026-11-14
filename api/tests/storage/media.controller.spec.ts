import 'reflect-metadata';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { Module, type INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import * as passport from 'passport';
import { Strategy } from 'passport-jwt';
import { sign } from 'jsonwebtoken';
import { MediaController } from '../../src/modules/storage/controllers/media.controller';
import { StorageService } from '../../src/modules/storage/services/storage.service';

const storage = { upload: vi.fn(), getPublicUrl: vi.fn((key: string) => `https://media.example.test/${key}`) };
@Module({ imports: [PassportModule], controllers: [MediaController], providers: [{ provide: StorageService, useValue: storage }] })
class MediaTestModule {}
// 1×1 PNG — genuine magic bytes so the file-type validator sees a real image.
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');

describe('POST /api/v1/media (R2 image storage)', () => {
  let app: INestApplication; let origin: string; let token: string;
  beforeAll(async () => {
    const secret = 'media-http-unit-test-secret';
    passport.use('jwt', new Strategy({ jwtFromRequest: req => req.headers.authorization?.replace(/^Bearer /, '') ?? null, secretOrKey: secret }, (_payload, done) => done(null, { id: 'user-a', organizationId: 'org-a' })));
    token = sign({ sub: 'user-a' }, secret, { expiresIn: '1h' });
    app = await NestFactory.create(MediaTestModule, { logger: false });
    app.setGlobalPrefix('api/v1');
    await app.listen(0, '127.0.0.1');
    origin = await app.getUrl();
  });
  afterAll(async () => { await app?.close(); passport.unuse('jwt'); });
  beforeEach(() => { storage.upload.mockReset(); storage.upload.mockResolvedValue('ok'); process.env.R2_PUBLIC_URL = 'https://media.example.test'; });
  const send = (file: Buffer | null, type: string, authenticated = true) => {
    const form = new FormData();
    if (file) form.append('file', new Blob([file], { type }), 'photo');
    return fetch(`${origin}/api/v1/media`, { method: 'POST', headers: authenticated ? { Authorization: `Bearer ${token}` } : {}, body: form });
  };
  // Contract: an authenticated image is stored in R2 under an org-scoped key and only its public https URL is returned.
  it('stores an image in R2 and returns its public URL', async () => {
    const res = await send(PNG, 'image/png');
    expect(res.status).toBe(201);
    const body = await res.json();
    const [buffer, key, contentType] = storage.upload.mock.calls[0];
    expect(Buffer.compare(buffer, PNG)).toBe(0);
    expect(key).toMatch(/^design-media\/org-a\/[0-9a-f-]{36}\.png$/);
    expect(contentType).toBe('image/png');
    expect(body).toEqual({ url: `https://media.example.test/${key}`, key, contentType: 'image/png', size: PNG.length });
  });
  // Contract: unauthenticated requests are rejected by the JWT guard before any storage write.
  it('returns 401 without a bearer token', async () => {
    expect((await send(PNG, 'image/png', false)).status).toBe(401);
    expect(storage.upload).not.toHaveBeenCalled();
  });
  // Contract: non-image or missing files are 400 and never reach storage.
  it('rejects non-image and missing files', async () => {
    expect((await send(Buffer.from('hello'), 'text/plain')).status).toBe(400);
    expect((await send(null, 'image/png')).status).toBe(400);
    expect(storage.upload).not.toHaveBeenCalled();
  });
  // Contract: content is checked by magic bytes — non-image bytes declared as image/png are rejected with a friendly message.
  it('rejects a spoofed image/png upload', async () => {
    const res = await send(Buffer.from('<html><script>alert(1)</script></html>'), 'image/png');
    expect(res.status).toBe(400);
    expect((await res.json()).message).toBe('Choose a JPEG, PNG, WebP, GIF or AVIF image.');
    expect(storage.upload).not.toHaveBeenCalled();
  });
  // Contract: without an https public base URL nothing is written (no orphaned, unreachable object).
  it('returns 503 before writing when R2_PUBLIC_URL is not configured', async () => {
    delete process.env.R2_PUBLIC_URL;
    expect((await send(PNG, 'image/png')).status).toBe(503);
    expect(storage.upload).not.toHaveBeenCalled();
  });
  // Contract: files above 10 MB are rejected without a storage write.
  it('rejects files above 10 MB', async () => {
    const res = await send(Buffer.concat([PNG, Buffer.alloc(10 * 1024 * 1024)]), 'image/png');
    expect(res.status).toBe(413);
    expect(storage.upload).not.toHaveBeenCalled();
  });
  // Contract: an R2 failure is a retryable 503, not a fake success URL.
  it('returns 503 when R2 storage fails', async () => {
    storage.upload.mockRejectedValue(new Error('R2 is not configured'));
    const res = await send(PNG, 'image/png');
    expect(res.status).toBe(503);
    expect((await res.json()).message).toContain('retry the upload');
  });
});
