import 'reflect-metadata';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { Module, Controller, Post, Req, type INestApplication } from '@nestjs/common';
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
import { configureListingBodyParser } from '../../src/modules/properties/properties.module';
const create = vi.fn(async (_organization, record) => ({ id: 'saved', version: 1, record }));
@Controller('auth-body-contract')
class NonListingController { @Post() echo(@Req() req: { body: unknown }) { return req.body; } }
@Module({ imports: [PassportModule], controllers: [PropertiesController, ListingProfilesController, NonListingController], providers: [{ provide: PropertiesService, useValue: { create } }] })
class HttpTestModule {}
describe('real listing HTTP parsing and authentication', () => {
  let app: INestApplication;
  let origin: string;
  let token: string;
  beforeAll(async () => {
    const secret = 'listing-http-unit-test-secret';
    passport.use('jwt', new Strategy({ jwtFromRequest: req => req.headers.authorization?.replace(/^Bearer /, '') ?? null, secretOrKey: secret }, (_payload, done) => done(null, { id: 'user-a', organizationId: 'org-a' })));
    token = sign({ sub: 'user-a' }, secret, { expiresIn: '1h' });
    app = await NestFactory.create(HttpTestModule, { logger: false });
    configureListingBodyParser(app);
    app.setGlobalPrefix('api/v1');
    await app.listen(0, '127.0.0.1');
    origin = await app.getUrl();
  });
  afterAll(async () => { await app?.close(); passport.unuse('jwt'); });
  const post = (body: object, authenticated = true) => fetch(`${origin}/api/v1/properties`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(authenticated ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body) });
  // Contract: scoped large-image parsing never disables JSON parsing on unrelated routes.
  it('keeps default JSON parsing active outside listing routes', async () => {
    const response = await fetch(`${origin}/api/v1/auth-body-contract`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'fixture@example.test' }) });
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ email: 'fixture@example.test' });
  });
  // Contract: a genuine authenticated 150KB photo body reaches the real controller unchanged.
  it('accepts a manual image larger than the default 100KB parser limit', async () => {
    const record = createEmptyListing();
    record.photos = [{ id: 'photo', name: 'Property', src: `data:image/png;base64,${'A'.repeat(150_000)}` }];
    const res = await post({ record });
    expect(res.status).toBe(201);
    expect((await res.json()).record.photos[0].src).toBe(record.photos[0].src);
    expect(create.mock.calls.at(-1)?.[0]).toBe('org-a');
  });
  // Contract: missing bearer returns401 through actual JWT guard, no controller write.
  it('returns 401 for unauthenticated requests to both route families', async () => {
    const before = create.mock.calls.length;
    expect((await post({ record: createEmptyListing() }, false)).status).toBe(401);
    expect((await fetch(`${origin}/api/v1/listing-profiles`)).status).toBe(401);
    expect(create.mock.calls.length).toBe(before);
  });
  // Contract: body above12MB returns413 before the property service is called.
  it('rejects over-limit listing bodies without a write', async () => {
    const before = create.mock.calls.length;
    expect((await post({ record: 'A'.repeat(12 * 1024 * 1024) })).status).toBe(413);
    expect(create.mock.calls.length).toBe(before);
  });
  // Contract: strict ValidatedBody rejects ownership injection with400, no write.
  it('rejects supplied ownership at the real HTTP boundary', async () => {
    const before = create.mock.calls.length;
    expect((await post({ record: createEmptyListing(), organizationId: 'org-b' })).status).toBe(400);
    expect(create.mock.calls.length).toBe(before);
  });
});
