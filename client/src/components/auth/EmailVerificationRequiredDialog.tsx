import { useEffect, useState } from 'react';
import { MailCheck } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { apiRequest, EMAIL_VERIFICATION_REQUIRED_EVENT } from '@/lib/queryClient';
import { getApiUrl } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export type ResendVerificationResponse = {
  sent?: boolean;
  alreadyVerified?: boolean;
};

/**
 * US-LAUNCH-014 AC7 client side. `apiRequest` attaches the JWT from
 * `localStorage.auth_token`, so the server derives the user id from the token and
 * never from anything we send. Exported so `EmailVerificationBanner` calls exactly
 * the same endpoint — one definition, no drift.
 */
export function resendVerificationEmail(): Promise<ResendVerificationResponse> {
  return apiRequest<ResendVerificationResponse>(getApiUrl('/auth/resend-verification'), {
    method: 'POST',
  });
}

type ResendState = 'idle' | 'sending' | 'sent' | 'error';

/**
 * US-LAUNCH-014 AC9 — opens when an AI-spend call is refused with
 * `code === 'EMAIL_NOT_VERIFIED'`. Mounted exactly once in App.tsx inside
 * `AuthProvider`; a single `open` boolean means repeated events re-open the same
 * dialog instead of stacking copies of it.
 *
 * It does not suppress the caller's own error toast — a duplicate message is
 * accepted (STORY.md Out of Scope).
 */
export function EmailVerificationRequiredDialog() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [resend, setResend] = useState<ResendState>('idle');

  useEffect(() => {
    const onRequired = () => {
      // Reset the resend state so a stale "Sent" from an earlier open isn't shown.
      setResend('idle');
      setOpen(true);
    };
    window.addEventListener(EMAIL_VERIFICATION_REQUIRED_EVENT, onRequired);
    return () => window.removeEventListener(EMAIL_VERIFICATION_REQUIRED_EVENT, onRequired);
  }, []);

  const handleResend = async () => {
    setResend('sending');
    try {
      const result = await resendVerificationEmail();
      setResend(result?.sent || result?.alreadyVerified ? 'sent' : 'error');
    } catch {
      setResend('error');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md" data-testid="email-verification-required-dialog">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <MailCheck className="h-5 w-5 shrink-0 text-primary" />
            <DialogTitle>Verify your email to start generating</DialogTitle>
          </div>
          <DialogDescription>
            We sent a verification link to{' '}
            <span className="font-medium text-foreground break-all" data-testid="text-verify-email-address">
              {user?.email ?? 'your email address'}
            </span>
            . Open it to unlock AI generation — you can keep browsing templates and the editor
            meanwhile.
          </DialogDescription>
        </DialogHeader>

        {resend === 'sent' && (
          <p className="text-sm text-primary" data-testid="text-resend-status">
            Sent — check your inbox
          </p>
        )}
        {resend === 'error' && (
          <p className="text-sm text-destructive" data-testid="text-resend-status">
            Could not send — try again
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} data-testid="button-verify-close">
            Close
          </Button>
          <Button
            onClick={handleResend}
            disabled={resend === 'sending'}
            data-testid="button-verify-resend"
          >
            {resend === 'sending' ? 'Sending…' : 'Resend verification email'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default EmailVerificationRequiredDialog;
