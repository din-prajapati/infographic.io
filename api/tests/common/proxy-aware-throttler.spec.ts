import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ProxyAwareThrottlerGuard } from '../../src/common/guards/proxy-aware-throttler.guard';
import * as jwtLib from 'jsonwebtoken';

// ---------------------------------------------------------------------------
// US-LAUNCH-014 AC11 — the tracker must resolve to the real client, and must not
// be selectable by the caller via a forged leading X-Forwarded-For entry.
// ---------------------------------------------------------------------------

/** getTracker is `protected`; the cast is the whole point of the test. */
function trackerOf(guard: ProxyAwareThrottlerGuard, req: Record<string, any>): Promise<string> {
  return (guard as any).getTracker(req);
}

function makeGuard() {
  const options: any = { throttlers: [{ name: 'default', ttl: 60000, limit: 100 }] };
  const storage: any = { increment: () => undefined };
  const reflector: any = { getAllAndOverride: () => undefined };
  return new ProxyAwareThrottlerGuard(options, storage, reflector);
}

function makeRequest(xff?: string | string[], ip = '127.0.0.1') {
  return {
    ip,
    headers: xff === undefined ? {} : { 'x-forwarded-for': xff },
  };
}

describe('ProxyAwareThrottlerGuard.getTracker (AC11)', () => {
  const originalHops = process.env.TRUSTED_PROXY_HOPS;
  let guard: ProxyAwareThrottlerGuard;

  beforeEach(() => {
    guard = makeGuard();
    delete process.env.TRUSTED_PROXY_HOPS;
  });

  afterEach(() => {
    if (originalHops === undefined) delete process.env.TRUSTED_PROXY_HOPS;
    else process.env.TRUSTED_PROXY_HOPS = originalHops;
  });

  it('with hops = 2 returns the second entry from the right', async () => {
    process.env.TRUSTED_PROXY_HOPS = '2';

    await expect(trackerOf(guard, makeRequest('6.6.6.6, 1.2.3.4, 10.0.0.1'))).resolves.toBe(
      '1.2.3.4',
    );
  });

  it('with hops = 1 returns the rightmost entry', async () => {
    process.env.TRUSTED_PROXY_HOPS = '1';

    await expect(trackerOf(guard, makeRequest('6.6.6.6, 1.2.3.4, 10.0.0.1'))).resolves.toBe(
      '10.0.0.1',
    );
  });

  it('defaults to 1 hop when TRUSTED_PROXY_HOPS is unset', async () => {
    await expect(trackerOf(guard, makeRequest('6.6.6.6, 1.2.3.4, 10.0.0.1'))).resolves.toBe(
      '10.0.0.1',
    );
  });

  it('never returns the leftmost entry while any trusted hop remains to its right', async () => {
    // With a 3-entry chain, hops 1 and 2 must stay inside the infrastructure-appended
    // tail. (hops = 3 WOULD return the leftmost — and that is correct, because three
    // trusted proxies means the first of them appended the client itself. The security
    // property is the next test: a caller cannot *shift* which entry is picked.)
    for (const hops of ['1', '2']) {
      process.env.TRUSTED_PROXY_HOPS = hops;
      const tracker = await trackerOf(guard, makeRequest('6.6.6.6, 1.2.3.4, 10.0.0.1'));
      expect(tracker).not.toBe('6.6.6.6');
    }
  });

  it('a caller who prepends a forged entry cannot change the tracked value', async () => {
    process.env.TRUSTED_PROXY_HOPS = '2';

    const honest = await trackerOf(guard, makeRequest('1.2.3.4, 10.0.0.1'));
    const forged = await trackerOf(guard, makeRequest('9.9.9.9, 1.2.3.4, 10.0.0.1'));

    expect(forged).toBe(honest);
  });

  it('trims whitespace around entries', async () => {
    process.env.TRUSTED_PROXY_HOPS = '2';

    await expect(trackerOf(guard, makeRequest('6.6.6.6,   1.2.3.4 ,10.0.0.1'))).resolves.toBe(
      '1.2.3.4',
    );
  });

  it('handles a repeated header delivered as an array', async () => {
    process.env.TRUSTED_PROXY_HOPS = '2';

    await expect(
      trackerOf(guard, makeRequest(['6.6.6.6', '1.2.3.4, 10.0.0.1'])),
    ).resolves.toBe('1.2.3.4');
  });

  // null-input branches (AC13)
  it('falls back to req.ip when the header is absent', async () => {
    await expect(trackerOf(guard, makeRequest(undefined, '203.0.113.7'))).resolves.toBe(
      '203.0.113.7',
    );
  });

  it('falls back to req.ip when the header is empty', async () => {
    await expect(trackerOf(guard, makeRequest('', '203.0.113.7'))).resolves.toBe('203.0.113.7');
  });

  it('falls back to req.ip when the chain is shorter than the configured hop count', async () => {
    process.env.TRUSTED_PROXY_HOPS = '3';

    await expect(trackerOf(guard, makeRequest('1.2.3.4, 10.0.0.1', '203.0.113.7'))).resolves.toBe(
      '203.0.113.7',
    );
  });

  it('ignores a non-numeric or zero TRUSTED_PROXY_HOPS and uses 1', async () => {
    for (const bad of ['', 'two', '0', '-1', '1.5']) {
      process.env.TRUSTED_PROXY_HOPS = bad;
      await expect(trackerOf(guard, makeRequest('6.6.6.6, 1.2.3.4, 10.0.0.1'))).resolves.toBe(
        '10.0.0.1',
      );
    }
  });
});

// ---------------------------------------------------------------------------
// US-LAUNCH-014 AC16/AC18 — the allowlist exemption. The exemption must be
// reachable ONLY from the submitted email on the three email-sending routes;
// everything else keeps its normal limit.
// ---------------------------------------------------------------------------

/** shouldSkip is `protected`; the cast is the whole point of the test. */
function shouldSkipOf(guard: ProxyAwareThrottlerGuard, context: unknown): Promise<boolean> {
  return (guard as any).shouldSkip(context);
}

function makeContext(
  overrides: { method?: string; url?: string; body?: unknown; headers?: Record<string, unknown> } = {},
) {
  const request: Record<string, any> = {
    method: overrides.method ?? 'POST',
    url: overrides.url ?? '/api/v1/auth/register',
    headers: overrides.headers ?? {},
    ip: '127.0.0.1',
  };
  if ('body' in overrides) request.body = overrides.body;
  else request.body = { email: 'e2e-1@test.local', password: 'password123' };

  return {
    getType: () => 'http',
    switchToHttp: () => ({ getRequest: () => request }),
  };
}

describe('ProxyAwareThrottlerGuard.shouldSkip (AC16)', () => {
  const originalDomains = process.env.INTERNAL_TEST_EMAIL_DOMAINS;
  let guard: ProxyAwareThrottlerGuard;

  beforeEach(() => {
    guard = makeGuard();
    process.env.INTERNAL_TEST_EMAIL_DOMAINS = 'test.local';
  });

  afterEach(() => {
    if (originalDomains === undefined) delete process.env.INTERNAL_TEST_EMAIL_DOMAINS;
    else process.env.INTERNAL_TEST_EMAIL_DOMAINS = originalDomains;
  });

  it('skips the limit for an allowlisted address on the three email-sending routes', async () => {
    for (const path of ['/auth/register', '/auth/resend-verification', '/auth/forgot-password']) {
      await expect(shouldSkipOf(guard, makeContext({ url: `/api/v1${path}` }))).resolves.toBe(true);
      // also when the guard sees the pre-global-prefix path
      await expect(shouldSkipOf(guard, makeContext({ url: path }))).resolves.toBe(true);
    }
  });

  it('ignores a query string on the path', async () => {
    await expect(
      shouldSkipOf(guard, makeContext({ url: '/api/v1/auth/register?next=/templates' })),
    ).resolves.toBe(true);
  });

  it('does NOT skip for a normal address on the same route', async () => {
    await expect(
      shouldSkipOf(guard, makeContext({ body: { email: 'jane@company.com' } })),
    ).resolves.toBe(false);
  });

  it('does NOT skip for a look-alike or subdomain of the allowlisted domain', async () => {
    for (const email of ['a@evil-test.local', 'a@sub.test.local']) {
      await expect(shouldSkipOf(guard, makeContext({ body: { email } }))).resolves.toBe(false);
    }
  });

  // `/api/v1/auth/login` was in this list until AC19 deliberately made it exemptible —
  // once the global bucket is empty the login call itself is refused, which is the whole
  // failure (BL-31). It is not untested: the AC19 block below asserts both that an
  // allowlisted address skips it and that a normal address still does not.
  it('does NOT skip an allowlisted address on any other route', async () => {
    for (const url of [
      '/api/v1/auth/reset-password',
      '/api/v1/infographics/generate',
      '/api/v1/anything/auth/register',
    ]) {
      await expect(shouldSkipOf(guard, makeContext({ url }))).resolves.toBe(false);
    }
  });

  it('does NOT skip a non-POST request to an exemptible route', async () => {
    for (const method of ['GET', 'PUT', 'DELETE']) {
      await expect(shouldSkipOf(guard, makeContext({ method }))).resolves.toBe(false);
    }
  });

  // The security property this guard exists to preserve: nothing request-supplied
  // other than the email itself can select the exemption.
  it('ignores a header, query parameter or body flag claiming test-account status', async () => {
    await expect(
      shouldSkipOf(
        guard,
        makeContext({
          body: { email: 'attacker@gmail.com', isTestAccount: true, internalTest: '1' },
          headers: { 'x-internal-test': 'true', 'x-test-account': 'test.local' },
          url: '/api/v1/auth/register?internalTest=true',
        }),
      ),
    ).resolves.toBe(false);
  });

  // null-input branches (AC18)
  it('does NOT skip when the body is absent, empty or malformed', async () => {
    for (const body of [undefined, null, {}, { email: null }, { email: 123 }, { email: ['a@test.local'] }, 'raw-string']) {
      await expect(shouldSkipOf(guard, makeContext({ body }))).resolves.toBe(false);
    }
  });

  it('does NOT skip when the request or context cannot be read', async () => {
    await expect(shouldSkipOf(guard, { getType: () => 'ws' })).resolves.toBe(false);
    await expect(
      shouldSkipOf(guard, { getType: () => 'http', switchToHttp: () => ({ getRequest: () => undefined }) }),
    ).resolves.toBe(false);
    await expect(shouldSkipOf(guard, {})).resolves.toBe(false);
  });

  it('never skips when INTERNAL_TEST_EMAIL_DOMAINS is unset — the production posture', async () => {
    delete process.env.INTERNAL_TEST_EMAIL_DOMAINS;

    for (const path of ['/auth/register', '/auth/resend-verification', '/auth/forgot-password']) {
      await expect(shouldSkipOf(guard, makeContext({ url: `/api/v1${path}` }))).resolves.toBe(
        false,
      );
    }
  });
});

/**
 * AC19 — an authenticated internal-test session skips the limit on any route.
 *
 * Why this exists: a full E2E run makes hundreds of requests from one IP and exhausts the
 * global 100/min bucket (measured: 120 rapid calls → 100×200 then 20×429). Once exhausted,
 * even `POST /auth/login` is refused, which looks exactly like a broken login — the real
 * cause of `us-ai-040` failing ~half the time (BL-31). The sign-up exemption alone could not
 * fix it: the budget is spent on authenticated GETs, not on the four auth endpoints.
 */
describe('ProxyAwareThrottlerGuard.shouldSkip — authenticated test session (AC19)', () => {
  const originalDomains = process.env.INTERNAL_TEST_EMAIL_DOMAINS;
  const originalSecret = process.env.JWT_SECRET;
  const SECRET = 'test-secret-for-throttler-spec';
  let guard: ProxyAwareThrottlerGuard;

  const sign = (payload: Record<string, unknown>, secret = SECRET) =>
    jwtLib.sign(payload, secret);

  const authedGet = (token: string, url = '/api/v1/infographics/generations/usage/quota') =>
    makeContext({ method: 'GET', url, headers: { authorization: `Bearer ${token}` }, body: undefined });

  beforeEach(() => {
    guard = makeGuard();
    process.env.INTERNAL_TEST_EMAIL_DOMAINS = 'test.local';
    process.env.JWT_SECRET = SECRET;
  });

  afterEach(() => {
    if (originalDomains === undefined) delete process.env.INTERNAL_TEST_EMAIL_DOMAINS;
    else process.env.INTERNAL_TEST_EMAIL_DOMAINS = originalDomains;
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  });

  it('skips on a GET carrying a valid token for an allowlisted address', async () => {
    const token = sign({ sub: 'u1', email: 'e2e-1@test.local' });
    await expect(shouldSkipOf(guard, authedGet(token))).resolves.toBe(true);
  });

  it('does NOT skip for a valid token belonging to a normal user', async () => {
    const token = sign({ sub: 'u2', email: 'agent@realty.com' });
    await expect(shouldSkipOf(guard, authedGet(token))).resolves.toBe(false);
  });

  it('does NOT skip for a token signed with the wrong secret — forgery earns no exemption', async () => {
    const forged = sign({ sub: 'evil', email: 'e2e-1@test.local' }, 'not-the-server-secret');
    await expect(shouldSkipOf(guard, authedGet(forged))).resolves.toBe(false);
  });

  it('does NOT skip for an unsigned/garbage bearer value', async () => {
    for (const token of ['', 'not-a-jwt', 'a.b.c']) {
      await expect(shouldSkipOf(guard, authedGet(token))).resolves.toBe(false);
    }
  });

  it('does NOT skip for an expired token', async () => {
    const expired = jwtLib.sign({ sub: 'u1', email: 'e2e-1@test.local' }, SECRET, { expiresIn: -60 });
    await expect(shouldSkipOf(guard, authedGet(expired))).resolves.toBe(false);
  });

  it('does NOT skip when INTERNAL_TEST_EMAIL_DOMAINS is unset, even with a valid token', async () => {
    delete process.env.INTERNAL_TEST_EMAIL_DOMAINS;
    const token = sign({ sub: 'u1', email: 'e2e-1@test.local' });
    await expect(shouldSkipOf(guard, authedGet(token))).resolves.toBe(false);
  });

  it('does NOT skip when JWT_SECRET is unset', async () => {
    const token = sign({ sub: 'u1', email: 'e2e-1@test.local' });
    delete process.env.JWT_SECRET;
    await expect(shouldSkipOf(guard, authedGet(token))).resolves.toBe(false);
  });

  it('ignores a non-bearer Authorization header', async () => {
    const ctx = makeContext({
      method: 'GET',
      url: '/api/v1/templates',
      headers: { authorization: 'Basic dXNlcjpwYXNz' },
      body: undefined,
    });
    await expect(shouldSkipOf(guard, ctx)).resolves.toBe(false);
  });

  it('exempts POST /auth/login by body email — the request refused once the bucket is empty', async () => {
    const ctx = makeContext({
      url: '/api/v1/auth/login',
      body: { email: 'e2e-1@test.local', password: 'x' },
    });
    await expect(shouldSkipOf(guard, ctx)).resolves.toBe(true);
  });

  it('does NOT exempt POST /auth/login for a normal address', async () => {
    const ctx = makeContext({
      url: '/api/v1/auth/login',
      body: { email: 'agent@realty.com', password: 'x' },
    });
    await expect(shouldSkipOf(guard, ctx)).resolves.toBe(false);
  });
});
