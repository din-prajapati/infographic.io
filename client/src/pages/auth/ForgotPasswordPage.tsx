import { useState } from 'react';
import { Link } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authApi } from '@/lib/api';
import { Building2, ArrowLeft, MailCheck } from 'lucide-react';

/**
 * Public page — request a password reset link (US-LAUNCH-003, AC4).
 * The response is always generic, so the UI shows the same "check your email"
 * state whether or not the account exists (no enumeration).
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const mutation = useMutation({
    mutationFn: () => authApi.forgotPassword({ email }),
    // Same success state on error too — never reveal whether the account exists.
    onSuccess: () => setSent(true),
    onError: () => setSent(true),
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="flex items-center gap-2 mb-6 justify-center">
          <Building2 className="h-7 w-7 text-primary" />
          <span className="text-lg font-bold text-foreground">InfographicAI</span>
        </div>

        {sent ? (
          <div className="text-center space-y-4" data-testid="forgot-sent">
            <MailCheck className="h-10 w-10 text-primary mx-auto" />
            <h1 className="text-xl font-semibold text-foreground">Check your email</h1>
            <p className="text-sm text-muted-foreground">
              If an account exists for{' '}
              <span className="font-medium text-foreground">{email}</span>, we've sent a
              password reset link. It's valid for 1 hour.
            </p>
            <Link
              href="/auth"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <ArrowLeft className="h-4 w-4" /> Back to login
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-semibold text-foreground text-center mb-1">
              Forgot your password?
            </h1>
            <p className="text-sm text-muted-foreground text-center mb-6">
              Enter your email and we'll send you a reset link.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (email.trim()) mutation.mutate();
              }}
              className="space-y-4"
            >
              <div>
                <label htmlFor="fp-email" className="text-xs font-medium text-muted-foreground mb-1 block">
                  Email
                </label>
                <Input
                  id="fp-email"
                  type="email"
                  required
                  placeholder="agent@realty.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-testid="input-forgot-email"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={mutation.isPending || !email.trim()}
                data-testid="button-forgot-submit"
              >
                {mutation.isPending ? 'Sending…' : 'Send reset link'}
              </Button>
            </form>
            <Link
              href="/auth"
              className="mt-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Back to login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
