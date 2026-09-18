import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { isInternalTestEmail } from '../../modules/auth/utils/email-policy';

/**
 * AC16 — the only routes an internal test address may skip the limit on. Listed with and
 * without the `api/v1` global prefix and compared for equality (never `endsWith`), so a
 * hypothetical `/anything/auth/register` could not inherit the exemption.
 */
const EXEMPTIBLE_EMAIL_PATHS: ReadonlySet<string> = new Set(
  ['/auth/register', '/auth/resend-verification', '/auth/forgot-password'].flatMap((path) => [
    path,
    `/api/v1${path}`,
  ]),
);

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

  /**
   * AC16 — let this repo's own automated suites sign up without tripping the AC12 limits.
   *
   * A full E2E run registers 12+ accounts from a single CI IP, which exceeds the 5/hour
   * sign-up limit. The exemption is granted ONLY when both hold:
   *
   *   1. the request is a POST to one of the three email-sending auth routes, and
   *   2. the submitted `email` matches `INTERNAL_TEST_EMAIL_DOMAINS` (unset in production
   *      → `isInternalTestEmail` is always false → this method never returns true here).
   *
   * The email in the body is the *only* input consulted. A header, query parameter or a
   * body flag must never be able to select it: any of those would let an attacker opt out
   * of rate limiting on the exact endpoints the limits exist to protect. An absent or
   * malformed body, a normal address, or any other route falls through to normal
   * throttling. The global 100/min default still applies to every other route.
   */
  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    if (context?.getType?.() !== 'http') return false;

    const request = context.switchToHttp?.()?.getRequest?.();
    if (!request) return false;

    if (String(request.method ?? '').toUpperCase() !== 'POST') return false;

    const path = String(request.originalUrl ?? request.url ?? '')
      .split('?')[0]
      .replace(/\/+$/, '');
    if (!EXEMPTIBLE_EMAIL_PATHS.has(path)) return false;

    const email = request.body?.email;
    if (typeof email !== 'string') return false;

    return isInternalTestEmail(email);
  }

  /** Read per request so the value can be changed without a rebuild; 1 is the safe default. */
  private trustedProxyHops(): number {
    const parsed = Number(process.env.TRUSTED_PROXY_HOPS ?? 1);
    return Number.isInteger(parsed) && parsed >= 1 ? parsed : 1;
  }
}
