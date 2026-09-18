import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ProxyAwareThrottlerGuard } from '../../src/common/guards/proxy-aware-throttler.guard';

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
