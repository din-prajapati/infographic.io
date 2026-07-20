import { useState } from 'react';
import { Link, useLocation, useSearch } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { authApi } from '@/lib/api';
import { Building2, ArrowLeft } from 'lucide-react';

/**
 * Public page — set a new password using the emailed token (US-LAUNCH-003, AC4).
 * Token arrives as ?token=... ; an expired/used/unknown token surfaces the
 * backend's safe 400 message via toast.
 */
export default function ResetPasswordPage() {
  const search = useSearch();
  const token = new URLSearchParams(search).get('token') || '';
  const [, navigate] = useLocation();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const mutation = useMutation({
    mutationFn: () => authApi.resetPassword({ token, newPassword: password }),
    onSuccess: (data) => {
      toast.success('Password updated', { description: data.message });
      navigate('/auth');
    },
    onError: (err: Error) => {
      toast.error('Could not reset password', { description: err.message });
    },
  });

  const canSubmit = password.length >= 6 && password === confirm && !!token;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
        <Link
          href="/auth"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back to login
        </Link>

        <div className="flex items-center gap-2 mb-6 justify-center">
          <Building2 className="h-7 w-7 text-primary" />
          <span className="text-lg font-bold text-foreground">Buildographic</span>
        </div>

        {!token ? (
          <div className="text-center space-y-4" data-testid="reset-no-token">
            <h1 className="text-xl font-semibold text-foreground">Invalid reset link</h1>
            <p className="text-sm text-muted-foreground">
              This link is missing its token. Please request a new password reset.
            </p>
            <Link href="/auth/forgot" className="text-sm text-primary hover:underline">
              Request a new link
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-semibold text-foreground text-center mb-1">
              Set a new password
            </h1>
            <p className="text-sm text-muted-foreground text-center mb-6">
              Choose a password with at least 6 characters.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (canSubmit) mutation.mutate();
              }}
              className="space-y-4"
            >
              <div>
                <label htmlFor="rp-pw" className="text-xs font-medium text-muted-foreground mb-1 block">
                  New password
                </label>
                <Input
                  id="rp-pw"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="input-reset-password"
                />
              </div>
              <div>
                <label htmlFor="rp-confirm" className="text-xs font-medium text-muted-foreground mb-1 block">
                  Confirm password
                </label>
                <Input
                  id="rp-confirm"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  data-testid="input-reset-confirm"
                />
                {confirm.length > 0 && password !== confirm && (
                  <p className="text-xs text-destructive mt-1">Passwords don't match.</p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={mutation.isPending || !canSubmit}
                data-testid="button-reset-submit"
              >
                {mutation.isPending ? 'Updating…' : 'Update password'}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
