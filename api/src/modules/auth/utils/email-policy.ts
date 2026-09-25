import { disposableEmailBlocklistSet } from 'disposable-email-domains-js';

/**
 * US-LAUNCH-014 — sign-up email policy (AC2, AC3).
 *
 * Every consumer talks to `isDisposableEmail` / `normalizeEmail` only. The upstream
 * package (`disposable-email-domains-js`, CC0) is referenced exactly once, below, so the
 * list source stays swappable without touching AuthService or any test.
 *
 * Refreshing the list = bumping the npm dependency. There is no runtime fetch.
 */

/**
 * Domains we block on top of the upstream list — for throwaway services the package has
 * not picked up yet. Kept deliberately short: the upstream list already carries ~5.4k
 * entries, and every hand-added domain is a permanent false-positive risk for real users.
 * Entries are matched the same way as upstream ones, i.e. parent domains included.
 */
export const EXTRA_BLOCKED_DOMAINS: readonly string[] = [
  'burnermail.io',
  'mailduck.io',
];

/**
 * `disposableEmailBlocklistSet()` rebuilds a 5.4k-entry Set on every call, so it is built
 * once, lazily, on first use rather than at import time (keeps NestJS boot cheap).
 */
let cachedBlocklist: Set<string> | null = null;

function blocklist(): Set<string> {
  if (cachedBlocklist === null) {
    cachedBlocklist = new Set([
      ...disposableEmailBlocklistSet(),
      ...EXTRA_BLOCKED_DOMAINS,
    ]);
  }
  return cachedBlocklist;
}

/** Lower-cased domain part, or '' when the input is not an addressable email. */
function domainOf(email: string): string {
  const trimmed = (email ?? '').trim().toLowerCase();
  const at = trimmed.lastIndexOf('@');
  if (at <= 0 || at === trimmed.length - 1) return '';
  return trimmed.slice(at + 1);
}

/**
 * AC2 — true when the address belongs to a throwaway-inbox provider.
 *
 * Matches the domain **and each of its parents**, because many providers hand out
 * unlimited subdomains (`x.mailinator.com`) while only the apex is listed upstream.
 * The bare TLD is never tested on its own — `foo.com` must not be blocked by `com`.
 */
export function isDisposableEmail(email: string): boolean {
  const domain = domainOf(email);
  if (!domain) return false;

  const labels = domain.split('.');
  const list = blocklist();

  for (let i = 0; i < labels.length - 1; i += 1) {
    if (list.has(labels.slice(i).join('.'))) return true;
  }

  return false;
}

/**
 * AC14 — true when the address belongs to an internal test domain.
 *
 * Exists for one reason: the AC8 gate and the AC12 sign-up limits broke this repo's own
 * E2E suite (12 specs register `e2e-*@test.local` then call a gated route, and one run
 * exceeds 5 sign-ups/hour from a single CI IP). The allowlist is opt-in per environment
 * via `INTERNAL_TEST_EMAIL_DOMAINS` — **unset in production**, where this function is
 * therefore always false and the product behaves exactly as if the feature did not exist.
 *
 * Two deliberate properties:
 *
 * 1. The variable is read on **every call**, not cached at module load. Tests mutate it
 *    per case, and an operator must be able to remove it from a running API (Railway
 *    restart aside) without a rebuild.
 * 2. Matching is **exact domain equality** — the precise opposite of `isDisposableEmail`,
 *    which walks parent domains on purpose. Here a parent/suffix walk would be a security
 *    hole: allowlisting `test.local` would also hand a verified, unthrottled account to
 *    anyone who owns `evil-test.local` (suffix match) or can register under
 *    `sub.test.local`. Widening a *block* list is safe; widening an *allow* list is not.
 *
 * The decision depends on the submitted address alone — no header, query parameter or
 * body flag can select it.
 */
export function isInternalTestEmail(email: string): boolean {
  const domain = domainOf(email);
  if (!domain) return false;

  const configured = (process.env.INTERNAL_TEST_EMAIL_DOMAINS ?? '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.length > 0);

  if (configured.length === 0) return false;

  return configured.includes(domain);
}

/**
 * AC3 — collapse provider-side aliases so one real inbox maps to one account.
 *
 * Rules: trim + lower-case; strip a `+suffix` from the local part on every domain;
 * on Gmail also drop all dots and fold `googlemail.com` into `gmail.com`.
 *
 * The result is a **duplicate-detection key only**. It is never the login address and is
 * never sent to — `User.email` keeps the address exactly as the user typed it.
 */
export function normalizeEmail(email: string): string {
  const trimmed = (email ?? '').trim().toLowerCase();
  const at = trimmed.lastIndexOf('@');
  if (at <= 0 || at === trimmed.length - 1) return trimmed;

  let local = trimmed.slice(0, at);
  let domain = trimmed.slice(at + 1);

  const plus = local.indexOf('+');
  if (plus !== -1) local = local.slice(0, plus);

  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    local = local.split('.').join('');
    domain = 'gmail.com';
  }

  return `${local}@${domain}`;
}
