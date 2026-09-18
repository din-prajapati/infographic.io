import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * US-LAUNCH-014 AC11 — makes rate limiting see the real client.
 *
 * NestJS sits behind the Express proxy on :5000, so `req.ip` is always `127.0.0.1` and
 * every user in the world shares one throttle bucket. With `xfwd: true` on the proxy
 * (`server/index.ts`) the chain arrives in `x-forwarded-for`, left to right:
 *
 *   x-forwarded-for: <client>, <hop 1>, <hop 2>, ...
 *
 * The leftmost entry is whatever the caller *claimed* — anyone can send
 * `X-Forwarded-For: 1.2.3.4` and rotate it per request, so trusting it would make the
 * limit trivially bypassable. Only the rightmost entries were appended by infrastructure
 * we control, so we count `TRUSTED_PROXY_HOPS` back **from the right**.
 *
 * TRUSTED_PROXY_HOPS = number of proxies between the client and NestJS:
 *   local dev = 1 (Express only) · Railway = likely 2 (Railway edge + Express) —
 *   confirm on staging by logging the header once (MV-014-06) before relying on the limits.
 *
 * Too-low a value tracks one of our own proxies (everyone shares a bucket again, as today);
 * too-high a value reaches into client-controlled territory. Neither is silently unsafe,
 * but only the confirmed value gives a real per-client limit.
 */
@Injectable()
export class ProxyAwareThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const header = req?.headers?.['x-forwarded-for'];
    const raw = Array.isArray(header) ? header.join(',') : header;

    if (typeof raw === 'string' && raw.length > 0) {
      const chain = raw
        .split(',')
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);

      const hops = this.trustedProxyHops();

      // Fewer entries than hops means the header did not traverse the chain we expect
      // (direct call, misconfigured proxy) — fall back rather than pick a wrong entry.
      if (chain.length >= hops) {
        return chain[chain.length - hops];
      }
    }

    return req?.ip;
  }

  /** Read per request so the value can be changed without a rebuild; 1 is the safe default. */
  private trustedProxyHops(): number {
    const parsed = Number(process.env.TRUSTED_PROXY_HOPS ?? 1);
    return Number.isInteger(parsed) && parsed >= 1 ? parsed : 1;
  }
}
