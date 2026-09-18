import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { AllExceptionsFilter } from '../../src/common/filters/http-exception.filter';

// ---------------------------------------------------------------------------
// Helpers — a minimal ArgumentsHost capturing what the filter writes
// ---------------------------------------------------------------------------
function makeHost() {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  const host: any = {
    switchToHttp: () => ({ getResponse: () => ({ status }) }),
  };
  return { host, status, json };
}

// ---------------------------------------------------------------------------
// Tests — US-LAUNCH-014 T5b: typed error codes must survive the filter
// ---------------------------------------------------------------------------
describe('AllExceptionsFilter — typed error code pass-through (US-LAUNCH-014 T5b)', () => {
  let filter: AllExceptionsFilter;

  beforeEach(() => {
    vi.clearAllMocks();
    filter = new AllExceptionsFilter();
    // The 500 branch logs; keep the test output clean.
    vi.spyOn((filter as any).logger, 'error').mockImplementation(() => undefined);
  });

  it('emits statusCode, message and code when the thrower supplied one', () => {
    const { host, status, json } = makeHost();

    filter.catch(
      new ForbiddenException({
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Please verify your email address to generate designs.',
      }),
      host,
    );

    expect(status).toHaveBeenCalledWith(403);
    expect(json).toHaveBeenCalledWith({
      statusCode: 403,
      message: 'Please verify your email address to generate designs.',
      code: 'EMAIL_NOT_VERIFIED',
    });
  });

  it('omits the code key entirely for a plain HttpException', () => {
    const { host, status, json } = makeHost();

    filter.catch(new ForbiddenException('nope'), host);

    expect(status).toHaveBeenCalledWith(403);
    const body = json.mock.calls[0][0];
    expect(body).toEqual({ statusCode: 403, message: 'nope' });
    expect('code' in body).toBe(false);
  });

  it('leaves non-HttpException errors unchanged — 500, real message, no code', () => {
    const { host, status, json } = makeHost();

    filter.catch(new Error('prisma exploded'), host);

    expect(status).toHaveBeenCalledWith(500);
    const body = json.mock.calls[0][0];
    expect(body).toEqual({ statusCode: 500, message: 'prisma exploded' });
    expect('code' in body).toBe(false);
  });

  it('ignores a non-string code on the exception response', () => {
    const { host, json } = makeHost();

    filter.catch(new ForbiddenException({ code: 42, message: 'weird' } as any), host);

    const body = json.mock.calls[0][0];
    expect('code' in body).toBe(false);
  });
});
