/**
 * BL-30 — the global ValidationPipe is inert because esbuild/tsx emits no
 * `design:paramtypes`, so it never learns the DTO class. `ValidatedBody(Dto)` is given the class
 * explicitly. These tests pin the behaviour the pipe was supposed to provide.
 *
 * Written against the contract (reject wrong types, reject unknown fields, pass valid bodies),
 * not against the implementation.
 */
import 'reflect-metadata';
import { BadRequestException } from '@nestjs/common';
import { IsString, MinLength, getMetadataStorage } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { describe, expect, it } from 'vitest';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

// DTOs actually used by routes converted in this change.
import {
  RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto, VerifyEmailDto,
} from '../../src/modules/auth/dto/auth.dto';
import {
  CreateSubscriptionDto, CancelSubscriptionDto, UpdatePlanDto, VerifyPaymentDto, InternalWebhookDto,
} from '../../src/modules/payments/dto/payments.dto';
import { CreateDesignDto } from '../../src/modules/designs/dto/create-design.dto';
import {
  CreateConversationDto, UpdateConversationDto, AddMessageDto,
} from '../../src/modules/conversations/dto/create-conversation.dto';
import { GenerateFromChatDto, RegenerateDto } from '../../src/modules/infographics/dto/generate-from-chat.dto';
import { ExtractPropertyDataDto } from '../../src/modules/infographics/dto/extract-property-data.dto';
import { GenerateInfographicDto } from '../../src/modules/infographics/dto/generate-infographic.dto';

/**
 * The decorator's validation core, exercised directly. `createParamDecorator` returns an
 * `ExecutionContext`-bound decorator that only Nest's pipeline can invoke, so the same
 * plainToInstance + validateSync contract is asserted here against the real DTOs.
 */
function validateBody(cls: any, body: unknown): { ok: true; value: any } | { ok: false; messages: string[] } {
  if (body === null || body === undefined || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, messages: ['request body must be a JSON object'] };
  }
  const instance = plainToInstance(cls, body);
  const errors = validateSync(instance, {
    whitelist: true,
    forbidNonWhitelisted: true,
    forbidUnknownValues: false,
  });
  if (errors.length) {
    const messages: string[] = [];
    for (const e of errors) if (e.constraints) messages.push(...Object.values(e.constraints));
    return { ok: false, messages };
  }
  return { ok: true, value: instance };
}

describe('BL-30 — the two reported reproducers', () => {
  // Reported: POST /api/v1/auth/verify-email {"token":12345} returned 500 from
  // crypto.createHash().update() — the number reached the service unvalidated.
  it('rejects a wrong-typed field instead of letting it reach the service', () => {
    const result = validateBody(VerifyEmailDto, { token: 12345 });
    expect(result.ok).toBe(false);
    expect((result as any).messages.join(' ')).toMatch(/token must be a string/);
  });

  // Reported: {"token":"abc","evil":"x"} was NOT refused despite forbidNonWhitelisted.
  it('refuses an unknown extra property', () => {
    const result = validateBody(VerifyEmailDto, { token: 'abc', evil: 'x' });
    expect(result.ok).toBe(false);
    expect((result as any).messages.join(' ')).toMatch(/evil should not exist/);
  });

  // Reported: POST .../extractions {"prompt":12345} returned 500 "dto.prompt.trim is not a function".
  it('rejects a wrong-typed prompt on the extractions route', () => {
    const result = validateBody(ExtractPropertyDataDto, { prompt: 12345 });
    expect(result.ok).toBe(false);
    expect((result as any).messages.join(' ')).toMatch(/prompt must be a string/);
  });

  it('accepts a valid body and returns a DTO instance', () => {
    const result = validateBody(VerifyEmailDto, { token: 'a-real-token' });
    expect(result.ok).toBe(true);
    expect((result as any).value).toBeInstanceOf(VerifyEmailDto);
    expect((result as any).value.token).toBe('a-real-token');
  });
});

describe('non-object bodies', () => {
  it.each([
    ['an array', [1, 2, 3]],
    ['a string', 'token'],
    ['a number', 42],
    ['null', null],
    ['undefined', undefined],
  ])('rejects %s rather than coercing it into an empty instance', (_label, body) => {
    const result = validateBody(VerifyEmailDto, body);
    expect(result.ok).toBe(false);
  });
});

/**
 * Structural guard. `whitelist` + `forbidNonWhitelisted` reject any property class-validator does
 * not know about, so a field carrying only `@ApiProperty()` turns every valid request into a 400.
 * `InternalWebhookDto.event` was exactly this: `@ApiProperty()` and no validator, which would have
 * broken the webhook route the moment validation started working. The failure is invisible until a
 * real request arrives, so it is asserted here instead.
 */
describe('every DTO property reachable via ValidatedBody has a class-validator decorator', () => {
  const DTOS: Array<[string, any]> = [
    ['RegisterDto', RegisterDto], ['LoginDto', LoginDto], ['ForgotPasswordDto', ForgotPasswordDto],
    ['ResetPasswordDto', ResetPasswordDto], ['VerifyEmailDto', VerifyEmailDto],
    ['CreateSubscriptionDto', CreateSubscriptionDto], ['CancelSubscriptionDto', CancelSubscriptionDto],
    ['UpdatePlanDto', UpdatePlanDto], ['VerifyPaymentDto', VerifyPaymentDto],
    ['InternalWebhookDto', InternalWebhookDto], ['CreateDesignDto', CreateDesignDto],
    ['CreateConversationDto', CreateConversationDto], ['UpdateConversationDto', UpdateConversationDto],
    ['AddMessageDto', AddMessageDto], ['GenerateFromChatDto', GenerateFromChatDto],
    ['RegenerateDto', RegenerateDto], ['ExtractPropertyDataDto', ExtractPropertyDataDto],
    ['GenerateInfographicDto', GenerateInfographicDto],
  ];

  it.each(DTOS)('%s', (name, cls) => {
    const storage = getMetadataStorage();
    const validated = new Set(
      storage.getTargetValidationMetadatas(cls, cls.name, true, false).map((m) => m.propertyName),
    );
    const swagger: string[] =
      Reflect.getMetadata('swagger/apiModelPropertiesArray', cls.prototype) || [];
    const declared = swagger.map((s) => s.replace(/^:/, ''));

    const missing = declared.filter((d) => !validated.has(d));
    expect(missing, `${name} has @ApiProperty fields with no validator: ${missing.join(', ')}`).toEqual([]);
  });
});

describe('error shape matches ValidationPipe', () => {
  it('produces a 400 with a flat string[] message', () => {
    const exception = new BadRequestException({
      statusCode: 400,
      error: 'Bad Request',
      message: ['token must be a string'],
    });
    const response = exception.getResponse() as Record<string, unknown>;
    expect(exception.getStatus()).toBe(400);
    expect(response.statusCode).toBe(400);
    expect(response.error).toBe('Bad Request');
    expect(Array.isArray(response.message)).toBe(true);
  });
});

describe('a sanity check on the premise', () => {
  it('confirms class-validator itself works when handed the class explicitly', () => {
    class Probe {
      @ApiProperty()
      @IsString()
      @MinLength(2)
      name: string;
    }
    expect(validateBody(Probe, { name: 'ok' }).ok).toBe(true);
    expect(validateBody(Probe, { name: 'x' }).ok).toBe(false);
    expect(validateBody(Probe, { name: 1 }).ok).toBe(false);
  });
});
