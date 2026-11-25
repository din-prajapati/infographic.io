import 'reflect-metadata';
import { beforeAll, afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConflictException, Module, type INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import * as passport from 'passport';
import { Strategy } from 'passport-jwt';
import { sign } from 'jsonwebtoken';
import { createEmptyListing } from '@shared/listingWorkflow';
vi.mock('../../src/database/prisma.client', () => ({ prisma: {} }));
import { PropertiesController } from '../../src/modules/properties/properties.controller';
import { ListingProfilesController } from '../../src/modules/properties/listing-profiles.controller';
import { PropertiesService } from '../../src/modules/properties/properties.service';
import { StorageService } from '../../src/modules/storage/services/storage.service';

const storage = { upload: vi.fn(), remove: vi.fn(), getPublicUrl: (key: string) => `https://media.example.test/${key}` };
const service = { create: vi.fn(), update: vi.fn(), saveProfile: vi.fn() };
@Module({ imports: [PassportModule], controllers: [PropertiesController, ListingProfilesController], providers: [{ provide: PropertiesService, useValue: service }, { provide: StorageService, useValue: storage }] })
class TestModule {}
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6qS8AAAAASUVORK5CYII=', 'base64');

describe('workspace multipart save lifecycle (real HTTP, fake storage/database)', () => {
  let app: INestApplication, origin: string, token: string;
  const oldPublic = process.env.R2_PUBLIC_URL;
  beforeAll(async () => {
    const secret = 'workspace-media-http-test-secret';
    passport.use('jwt', new Strategy({ jwtFromRequest: req => req.headers.authorization?.replace(/^Bearer /, '') ?? null, secretOrKey: secret }, (_payload, done) => done(null, { id: 'user-a', organizationId: 'org-a' })));
    token = sign({ sub: 'user-a' }, secret);
    app = await NestFactory.create(TestModule, { logger: false }); app.setGlobalPrefix('api/v1');
    await app.listen(0, '127.0.0.1'); origin = await app.getUrl();
  });
  afterAll(async () => { await app?.close(); passport.unuse('jwt'); if (oldPublic === undefined) delete process.env.R2_PUBLIC_URL; else process.env.R2_PUBLIC_URL = oldPublic; });
  beforeEach(() => {
    vi.resetAllMocks(); process.env.R2_PUBLIC_URL = 'https://media.example.test';
    service.create.mockImplementation(async (_org, record) => ({ id: 'p1', version: 1, record }));
    service.update.mockImplementation(async (_org, id, record) => ({ id, version: 2, record }));
    service.saveProfile.mockImplementation(async (_user, record) => ({ version: 1, record }));
    storage.upload.mockResolvedValue('uploaded'); storage.remove.mockResolvedValue(undefined);
  });
  const send = (payload: unknown, files: { id: string; buffer?: Buffer; type?: string }[] = [{ id: 'media-0' }], path = '/properties', method = 'POST', authenticated = true) => {
    const form = new FormData(); form.append('payload', JSON.stringify(payload));
    for (const file of files) form.append(file.id, new Blob([file.buffer ?? PNG], { type: file.type ?? 'image/png' }), 'photo.png');
    return fetch(origin + '/api/v1' + path, { method, headers: authenticated ? { Authorization: `Bearer ${token}` } : {}, body: form });
  };
  const listing = () => { const record = createEmptyListing(); record.photos.push({ id: 'a', name: 'Front', src: 'draft:media-0' }); return record; };

  it('persists only durable URLs and never deletes committed media', async () => {
    const response = await send({ record: listing() });
    expect(response.status).toBe(201);
    expect((await response.json()).record.photos[0].src).toMatch(/^https:\/\/media.example.test\/design-media\/org-a\//);
    expect(storage.upload).toHaveBeenCalledTimes(1); expect(storage.remove).not.toHaveBeenCalled();
  });
  it('handles profile images and expectedVersion in the same save', async () => {
    const { agent, brand } = createEmptyListing(); brand.logo = 'draft:media-0';
    const response = await send({ record: { agent, brand }, expectedVersion: 0 }, undefined, '/listing-profiles', 'PUT');
    expect(response.status).toBe(200);
    expect(service.saveProfile.mock.calls[0][0]).toBe('user-a');
    expect(service.saveProfile.mock.calls[0][2]).toBe(0);
    expect((await response.json()).record.brand.logo).toMatch(/^https:/);
  });
  it('blocks unauthenticated uploads before storage', async () => {
    expect((await send({ record: listing() }, undefined, '/properties', 'POST', false)).status).toBe(401);
    expect(storage.upload).not.toHaveBeenCalled();
  });
  it.each(['email', 'accent', 'ownership', 'missing-file', 'extra-file', 'version', 'spoofed-image'])('rejects %s before any storage write', async kind => {
    const record = listing();
    if (kind === 'email') record.agent.email = 'bad@';
    if (kind === 'accent') record.brand.accent = 'red';
    const body = { record, ...(kind === 'ownership' ? { userId: 'other' } : {}), ...(kind === 'version' ? { expectedVersion: -1 } : {}) };
    const files = kind === 'missing-file' ? [] : kind === 'extra-file' ? [{ id: 'media-0' }, { id: 'media-1' }] : [{ id: 'media-0', ...(kind === 'spoofed-image' ? { buffer: Buffer.from('not an image') } : {}) }];
    expect((await send(body, files, kind === 'version' ? '/properties/p1' : '/properties', kind === 'version' ? 'PUT' : 'POST')).status).toBe(400);
    expect(storage.upload).not.toHaveBeenCalled(); expect(service.create).not.toHaveBeenCalled();
  });
  it('cleans up only this request uploads when a stale save is rejected', async () => {
    service.update.mockRejectedValue(new ConflictException('Stale version'));
    expect((await send({ record: listing(), expectedVersion: 1 }, undefined, '/properties/p1', 'PUT')).status).toBe(409);
    expect(storage.remove).toHaveBeenCalledWith(storage.upload.mock.calls[0][1]);
  });
  it('cleans partially uploaded files when storage fails, without persisting a record', async () => {
    const record = listing(); record.brand.logo = 'draft:media-1';
    storage.upload.mockResolvedValueOnce('ok').mockRejectedValueOnce(new Error('Storage unavailable'));
    expect((await send({ record }, [{ id: 'media-0' }, { id: 'media-1' }])).status).toBe(503);
    expect(storage.remove).toHaveBeenCalledTimes(2); expect(service.create).not.toHaveBeenCalled();
  });
  it('preserves media on uncertain persistence failure rather than breaking possibly committed data', async () => {
    service.create.mockRejectedValue(new Error('Database connection lost'));
    expect((await send({ record: listing() })).status).toBe(500);
    expect(storage.remove).not.toHaveBeenCalled();
  });
});
