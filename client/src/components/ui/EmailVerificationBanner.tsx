import { useState } from 'react';
import { MailWarning } from 'lucide-react';
import { Button } from './button';
import { useAuth } from '@/lib/auth';
import { resendVerificationEmail } from '../auth/EmailVerificationRequiredDialog';

type ResendState = 'idle' | 'sending' | 'sent' | 'verified' | 'error';

/**
 * Map a resend response to what the banner should say.
 *
 * Extracted so the mapping can be tested without rendering the banner (auth/query
 * mocking) — the same pattern PricingPage.spec.tsx uses.
 *
 * The bug this pins: `alreadyVerified` was folded in with `sent` and rendered as
 * "Sent — check your inbox". The server returns `alreadyVerified` precisely when it
 * has sent nothing, so the banner told the user to wait for mail that would never
 * arrive. It is not a send — it is the answer that the banner should not be shown.
 */
export function resendStateFor(
  result: { sent?: boolean; alreadyVerified?: boolean } | null | undefined,
): Extract<ResendState, 'sent' | 'verified' | 'error'> {
  if (result?.alreadyVerified) return 'verified';
  if (result?.sent) return 'sent';
  return 'error';
}

/**
 * US-LAUNCH-014 AC10 — a persistent reminder between `<AppHeader />` and `<main>`
 * on the app pages that use `AppLayoutWithHeader`.
 *
 * Renders only when `emailVerified === false`. `undefined` (a session stored before
 * this story, or a Google sign-in) renders nothing: those accounts are grandfathered
 * as verified and must not be nagged. The banner informs — the actual gate lives
 * server-side in `EmailVerifiedGuard`.
 */
export function EmailVerificationBanner() {
  const { user } = useAuth();
  const [resend, setResend] = useState<ResendState>('idle');

  // `verified` means the server told us this address is already verified — the
  // cached session is simply stale. Hide rather than keep nagging; the next
  // reload (or a cross-tab storage event) refreshes `user.emailVerified`.
  if (user?.emailVerified !== false || resend === 'verified') return null;

  const handleResend = async () => {
    setResend('sending');
    try {
      const result = await resendVerificationEmail();
      // `alreadyVerified` used to be folded in with `sent` and rendered as
      // "Sent — check your inbox". The server returns it precisely when it has
      // sent nothing, because the address is already verified — so the banner
      // told the user to wait for a mail that would never arrive. It is not a
      // send; it is the answer that this banner should not be on screen.
      setResend(resendStateFor(result));
    } catch {
      setResend('error');
    }
  };

  return (
    <div
      role="status"
      className="w-full border-b border-amber-600/30 bg-amber-100/60 px-4 py-2.5"
      data-testid="email-verification-banner"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-2 text-sm text-amber-900">
          <MailWarning className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="min-w-0">
            Please verify your email to start generating designs — we sent a link to{' '}
            <span className="font-medium break-all">{user.email}</span>.
          </span>
        </p>
        <div className="flex shrink-0 items-center gap-3 self-start sm:self-auto">
          {resend === 'sent' && (
            <span className="text-sm text-amber-900" data-testid="text-banner-resend-status">
              Sent — check your inbox
            </span>
          )}
          {resend === 'error' && (
            <span className="text-sm text-destructive" data-testid="text-banner-resend-status">
              Could not send — try again
            </span>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={handleResend}
            disabled={resend === 'sending'}
            data-testid="button-banner-resend"
          >
            {resend === 'sending' ? 'Sending…' : 'Resend verification email'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default EmailVerificationBanner;
