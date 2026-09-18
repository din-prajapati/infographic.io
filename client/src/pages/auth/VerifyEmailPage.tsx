import { useEffect, useRef, useState } from 'react';
import { useLocation, useSearch } from 'wouter';
import { CheckCircle2, MailWarning } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { getApiUrl } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { LegacyUser } from '@shared/schema';

type VerifyState = 'verifying' | 'verified' | 'invalid' | 'no-token';

type VerifyEmailResponse = { verified: boolean; userId: string };

/**
 * Public page — confirms an email address using the token from the verification
 * link (US-LAUNCH-014 AC6/AC10). Public on purpose: the token in the URL is the
 * only credential needed, so the link works in a browser with no session (a
 * different device, or after the session expired).
 */
export default function VerifyEmailPage() {
  const search = useSearch();
  const token = new URLSearchParams(search).get('token') || '';
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const [state, setState] = useState<VerifyState>(token ? 'verifying' : 'no-token');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  // StrictMode double-invokes effects in dev; a single-use token must be spent once.
  const startedRef = useRef(false);

  useEffect(() => {
    if (!token || startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;

    (async () => {
      try {
        const result = await apiRequest<VerifyEmailResponse>(getApiUrl('/auth/verify-email'), {
          method: 'POST',
          body: JSON.stringify({ token }),
        });
        if (cancelled) return;

        // Refresh the cached session in place when this browser is signed in as the
        // verified user, so the banner and the gate clear without a re-login.
        const authToken = localStorage.getItem('auth_token');
        const storedUser = localStorage.getItem('auth_user');
        if (authToken && storedUser) {
          try {
            const parsed = JSON.parse(storedUser) as LegacyUser;
            if (parsed?.id === result.userId) {
              login({ ...parsed, emailVerified: true }, authToken);
            }
            setIsLoggedIn(true);
          } catch {
            setIsLoggedIn(false);
          }
        }
        setState('verified');
      } catch {
        // 400 (unknown / used / expired) and network failures land in the same
        // recoverable state — sign in and resend rather than a dead end.
        if (!cancelled) setState('invalid');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, login]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="flex flex-col items-center gap-1 mb-6">
          <img src="/logo-icon-option6.png" alt="" className="h-9 w-9 dark:hidden" />
          <img src="/logo-icon-option6-light.png" alt="" className="h-9 w-9 hidden dark:block" />
          <span className="text-lg font-bold text-foreground">Buildographic</span>
        </div>

        {state === 'verifying' && (
          <div className="text-center space-y-2" data-testid="verify-email-pending">
            <h1 className="text-xl font-semibold text-foreground">Verifying your email…</h1>
            <p className="text-sm text-muted-foreground">This only takes a moment.</p>
          </div>
        )}

        {state === 'verified' && (
          <div className="text-center space-y-4" data-testid="verify-email-success">
            <CheckCircle2 className="h-10 w-10 mx-auto text-primary" />
            <h1 className="text-xl font-semibold text-foreground">Email verified</h1>
            <p className="text-sm text-muted-foreground">
              Your email address is verified. You can generate designs now.
            </p>
            <Button
              className="w-full"
              onClick={() => navigate(isLoggedIn ? '/templates' : '/auth')}
              data-testid="button-verify-continue"
            >
              {isLoggedIn ? 'Start designing' : 'Sign in'}
            </Button>
          </div>
        )}

        {state === 'invalid' && (
          <div className="text-center space-y-4" data-testid="verify-email-invalid">
            <MailWarning className="h-10 w-10 mx-auto text-muted-foreground" />
            <h1 className="text-xl font-semibold text-foreground">
              This link is invalid or expired
            </h1>
            <p className="text-sm text-muted-foreground">
              Verification links last 24 hours and can be used once. Sign in and use{' '}
              <span className="font-medium text-foreground">Resend verification email</span> to get
              a fresh one.
            </p>
            <Button
              className="w-full"
              onClick={() => navigate('/auth')}
              data-testid="button-verify-signin"
            >
              Sign in
            </Button>
          </div>
        )}

        {state === 'no-token' && (
          <div className="text-center space-y-4" data-testid="verify-email-no-token">
            <MailWarning className="h-10 w-10 mx-auto text-muted-foreground" />
            <h1 className="text-xl font-semibold text-foreground">Verification link incomplete</h1>
            <p className="text-sm text-muted-foreground">
              This link is missing its token. Open the link from your verification email, or sign in
              and request a new one.
            </p>
            <Button
              className="w-full"
              onClick={() => navigate('/auth')}
              data-testid="button-verify-signin"
            >
              Sign in
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
