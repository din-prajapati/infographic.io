/**
 * BL-30 — runtime proof, through a real HTTP request to a real Nest application.
 *
 * This runs under vitest, which transforms with esbuild, so `design:paramtypes` is absent here
 * exactly as it is in dev and production (`npx tsx src/main.ts`). That makes this the honest
 * condition to test in: the global `ValidationPipe` below is configured identically to
 * `main.ts`, and the contrast route proves it is inert while `@ValidatedBody` is not.
 *
 * No supertest / @nestjs/testing — the app is booted on an ephemeral port and driven with fetch.
 */
import 'reflect-metadata';
import { Body, Controller, HttpCode, Module, Post, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { INestApplication } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { ValidatedBody } from '../../src/common/validated-body.decorator';
import { VerifyEmailDto } from '../../src/modules/auth/dto/auth.dto';

@Controller('t')
class ProbeController {
  /** The pattern this change rolls out. */
  @Post('validated')
  @HttpCode(200)
  validated(@ValidatedBody(VerifyEmailDto) dto: VerifyEmailDto) {
    return { received: dto.token, type: typeof dto.token };
  }

  /** The pattern every route used before: relies on the global pipe resolving the DTO. */
  @Post('plain')
  @HttpCode(200)
  plain(@Body() dto: VerifyEmailDto) {
    return { received: dto.token, type: typeof dto.token };
  }
}

@Module({ controllers: [ProbeController] })
class ProbeModule {}

let app: INestApplication;
let base: string;

beforeAll(async () => {
  app = await NestFactory.create(ProbeModule, { logger: false });
  // Identical to api/src/main.ts
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );
  await app.listen(0);
  const url = await app.getUrl();
  base = url.replace('[::1]', '127.0.0.1');
}, 60_000);

afterAll(async () => {
  await app?.close();
});

const post = async (path: string, body: unknown) => {
  const res = await fetch(`${base}/t/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json().catch(() => null) as any };
};

describe('the environment this test runs in', () => {
  it('has no design:paramtypes — the same condition as dev and production', () => {
    const meta = Reflect.getMetadata('design:paramtypes', ProbeController.prototype, 'plain');
    expect(meta).toBeUndefined();
  });
});

describe('@ValidatedBody — validates without decorator metadata', () => {
  it('rejects a wrong-typed field with 400', async () => {
    const { status, body } = await post('validated', { token: 12345 });
    expect(status).toBe(400);
    expect(JSON.stringify(body.message)).toMatch(/token must be a string/);
  });

  it('rejects an unknown extra property with 400', async () => {
    const { status, body } = await post('validated', { token: 'abc', evil: 'x' });
    expect(status).toBe(400);
    expect(JSON.stringify(body.message)).toMatch(/evil should not exist/);
  });

  it('rejects a non-object body with 400', async () => {
    const { status } = await post('validated', [1, 2, 3]);
    expect(status).toBe(400);
  });

  it('accepts a valid body', async () => {
    const { status, body } = await post('validated', { token: 'a-real-token' });
    expect(status).toBe(200);
    expect(body).toEqual({ received: 'a-real-token', type: 'string' });
  });

  it('returns ValidationPipe\'s error shape', async () => {
    const { body } = await post('validated', { token: 12345 });
    expect(body.statusCode).toBe(400);
    expect(body.error).toBe('Bad Request');
    expect(Array.isArray(body.message)).toBe(true);
  });
});

describe('the global ValidationPipe is inert here — this is BL-30 itself', () => {
  // If this ever starts returning 400, decorator metadata has been restored (BL-39) and the
  // global pipe works again. That is good news, and the right moment to reconsider whether
  // @ValidatedBody is still needed — so this test is deliberately written to notice.
  it('lets a wrong-typed field through a plain @Body() route with 200', async () => {
    const { status, body } = await post('plain', { token: 12345 });
    expect(status).toBe(200);
    expect(body).toEqual({ received: 12345, type: 'number' });
  });

  it('does not refuse an unknown extra property on a plain @Body() route', async () => {
    const { status } = await post('plain', { token: 'abc', evil: 'x' });
    expect(status).toBe(200);
  });
});
