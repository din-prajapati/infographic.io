/**
 * EmailVerificationBanner — resend state mapping (F6/F8 follow-up).
 *
 * The defect, found on production 2026-10-16: the banner mapped the server's
 * `{ alreadyVerified: true }` to the message "Sent — check your inbox".
 *
 * `resendVerification` (auth.service.ts) returns `alreadyVerified` on an early
 * return, *before* sending anything, because the address is already confirmed.
 * So the banner claimed a send that never happened and left the user waiting on
 * mail that would never arrive. It also kept nagging an account that was, in
 * fact, verified — the cached session was simply stale.
 *
 * Observed on production: the account verified at 11:11:26; the operator clicked
 * Resend at 11:14:09, three minutes later, and was told "Sent".
 *
 * Tested as a pure function rather than by rendering, matching the pattern
 * PricingPage.spec.tsx documents for this codebase.
 *
 * Run with: cd client && npx vitest run src/components/ui/__tests__/EmailVerificationBanner.spec.tsx
 */
import { describe, it, expect } from 'vitest';
import { resendStateFor } from '@/components/ui/EmailVerificationBanner';

describe('resendStateFor', () => {
  it('reports a real send as sent', () => {
    expect(resendStateFor({ sent: true })).toBe('sent');
  });

  it('never reports alreadyVerified as a send — nothing was sent', () => {
    expect(resendStateFor({ alreadyVerified: true })).toBe('verified');
  });

  it('prefers alreadyVerified when a response somehow carries both', () => {
    // Defensive: `verified` hides the banner, `sent` keeps it up telling the
    // user to wait. On an already-verified account, hiding is the right answer.
    expect(resendStateFor({ sent: true, alreadyVerified: true })).toBe('verified');
  });

  it.each([
    [{ sent: false }, 'an explicit failure'],
    [{}, 'an empty response'],
    [null, 'a null response'],
    [undefined, 'a missing response'],
  ])('treats %j as an error (%s)', (input, _why) => {
    expect(resendStateFor(input as any)).toBe('error');
  });
});
