import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { toast } from 'sonner';
import { ArrowUpRight, Loader2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { resendVerificationEmail } from '@/components/auth/EmailVerificationRequiredDialog';
import { generationsApi, getApiUrl, paymentsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { PLAN_CONFIG, type Subscription } from '@shared/schema';
import { formatBillingDate, formatPaymentAmount, formatPaymentMethod, paymentStatusTone, planFor, planPriceLabel, shortTransactionId, statusLabel, subscriptionStatusTone, type PillTone } from '../billingFormat';
import { SettingRow, SettingSection, UsageMeter } from '../SettingsPrimitives';

export const SUBSCRIPTION_QUERY_KEY = [getApiUrl('/payments/subscription')];
const PILL: Record<PillTone, string> = { green: 'ws-pill ws-pill-green', amber: 'ws-pill ws-pill-amber', red: 'ws-pill st-pill-red', neutral: 'ws-pill' };

/**
 * Settings → Billing (spec §6.2) — the old Account → Billing page (plan card, payment history, "Need more?") in the
 * dialog's row layout. Behaviour is carried over unchanged: PENDING-mandate banner with "Refresh status",
 * verify-email-after-paying banner, cancel-at-period-end notice, cancel confirmation. Test ids are kept.
 */
export default function BillingPane() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const subscriptionQuery = useQuery({ queryKey: SUBSCRIPTION_QUERY_KEY, queryFn: () => paymentsApi.getSubscription() });
  const editable = useQuery({ queryKey: [getApiUrl('/infographics/generations/usage/quota/editable')], queryFn: () => generationsApi.getEditableUsageQuota() });
  const history = useQuery({ queryKey: [getApiUrl('/payments/history')], queryFn: () => paymentsApi.getPaymentHistory() });
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [verify, setVerify] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const cancel = useMutation({
    mutationFn: () => paymentsApi.cancelSubscription(false),
    onSuccess: () => { toast.success('Subscription cancelled', { description: 'You keep your plan until the end of this billing period.' }); void queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_QUERY_KEY }); setConfirmCancel(false); },
    onError: (error: Error) => toast.error('Could not cancel', { description: error.message || 'Try again in a moment.' }),
  });

  const refreshStatus = async () => {
    setRefreshing(true);
    try {
      const result = await paymentsApi.syncSubscription();
      if (result.promoted) { toast.success('Plan activated', { description: result.message }); await queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_QUERY_KEY }); }
      else toast.info('Still waiting for the first payment', { description: result.message });
    } catch { toast.error('Could not reach the server. Try again.'); }
    finally { setRefreshing(false); }
  };
  const resend = async () => {
    setVerify('sending');
    // `alreadyVerified` is not a send — the cached session is stale; saying "Sent" would promise a mail that never comes.
    try { const result = await resendVerificationEmail(); setVerify(result?.sent ? 'sent' : result?.alreadyVerified ? 'idle' : 'error'); }
    catch { setVerify('error'); }
  };

  if (subscriptionQuery.isLoading) return <div className="ws-skeleton st-pane-skeleton" data-testid="card-subscription-loading" aria-label="Loading billing" />;
  if (subscriptionQuery.isError) {
    return (
      <div className="ws-alert ws-alert-error" role="alert">
        <span>Your billing details could not be loaded.</span>
        <button type="button" className="ws-btn ws-btn-small" onClick={() => void subscriptionQuery.refetch()}>Retry</button>
      </div>
    );
  }

  const subscription = subscriptionQuery.data?.subscription as Subscription | null | undefined;
  const { tier, config } = planFor(subscription?.planTier);
  const { price, annual } = planPriceLabel(subscription, config);
  const status = subscription?.status;
  const usage = subscriptionQuery.data?.usage;
  const used = usage?.current ?? 0;
  const limit = usage?.limit ?? config.limit;
  const percent = limit > 0 ? (used / limit) * 100 : 0;
  const periodEnd = subscription ? formatBillingDate(subscription.currentPeriodEnd, { currentPeriodStart: subscription.currentPeriodStart, createdAt: subscription.createdAt }) : null;
  const payments = history.data?.payments ?? [];
  const topTier = tier === 'API_ENTERPRISE' || tier === 'AGENCY';

  return (
    <div data-testid="card-subscription">
      {/* US-LAUNCH-014 F12 option B — ask for email confirmation after paying: receipts and renewal warnings go there. */}
      {user?.emailVerified === false && subscription && (
        <div className="ws-alert ws-alert-error st-banner" data-testid="banner-verify-email-paid">
          <span><strong>Confirm your email to receive receipts and billing alerts.</strong> Receipts, renewal reminders and payment-failure warnings go to {user.email}. Your plan is unaffected.
            {verify === 'sent' && <span data-testid="text-verify-resend-status"> Sent — check your inbox.</span>}
            {verify === 'error' && <span data-testid="text-verify-resend-status"> Could not send — try again.</span>}
          </span>
          <button type="button" className="ws-btn ws-btn-small" onClick={() => void resend()} disabled={verify === 'sending'} data-testid="button-verify-email-paid">{verify === 'sending' ? 'Sending…' : 'Send link again'}</button>
        </div>
      )}
      {status === 'PENDING' && (
        <div className="ws-alert ws-alert-warn st-banner" role="status">
          <span><strong>Payment method registered — awaiting your first charge.</strong> Your {config.name} plan starts when the first payment is collected, which can take up to a day. Until then you stay on Free ({PLAN_CONFIG.FREE.limit} designs a month).</span>
          <button type="button" className="ws-btn ws-btn-small" onClick={() => void refreshStatus()} disabled={refreshing}>{refreshing ? 'Checking…' : 'Refresh status'}</button>
        </div>
      )}
      {subscription?.cancelAtPeriodEnd && (
        <div className="ws-alert ws-alert-warn st-banner" data-testid="text-cancel-warning">Your subscription ends on {periodEnd}. You keep your plan until then.</div>
      )}

      <SettingSection title="Current plan" action={<span className={PILL[subscriptionStatusTone(status)]} data-testid="badge-subscription-status">{status ? statusLabel(status) : 'Free'}</span>}>
        <SettingRow id="current-plan" title={<span data-testid="text-plan-name">{config.name} plan{annual ? ' · Annual' : ''}</span>}
          description={periodEnd && !subscription?.cancelAtPeriodEnd ? <span data-testid="text-billing-date">Next billing on {periodEnd}</span> : 'Manage your subscription and billing.'}>
          <span className="st-price" data-testid="text-amount">{price}</span>
          <Link href="/pricing" className="ws-btn ws-btn-small ws-btn-primary" data-testid="button-upgrade">{tier === 'FREE' ? 'Upgrade plan' : 'Change plan'}</Link>
        </SettingRow>
        <SettingRow title="Monthly usage" description={percent >= 100 ? <span className="ws-field-error">You’ve reached your monthly limit. Upgrade to continue.</span> : percent >= 80 ? 'You’re approaching your monthly limit.' : 'Designs generated this calendar month.'}>
          <span data-testid="text-usage" className="ws-sr-only">{used} / {limit === -1 ? 'Unlimited' : limit}</span>
          <UsageMeter label="Monthly usage" used={used} limit={limit} />
        </SettingRow>
        {editable.data && (
          <SettingRow title="Editable designs" description="Opening a design in the editor uses one.">
            <span className="st-value" data-testid="text-editable-remaining">{editable.data.editableRemaining === -1 ? 'Unlimited' : `${editable.data.editableRemaining} remaining this month`}</span>
          </SettingRow>
        )}
      </SettingSection>

      <SettingSection title="Payment history">
        <div data-setting-id="payment-history" tabIndex={-1} data-testid={payments.length ? 'card-payment-history' : history.isLoading ? 'card-payment-history-loading' : history.isError ? 'card-payment-history-error' : 'card-payment-history-empty'}>
          {history.isLoading ? <div className="ws-skeleton st-chart-skeleton" /> : history.isError ? <p className="st-muted st-row-pad">Payment history could not be loaded. Try again later.</p> : payments.length === 0 ? (
            <p className="st-muted st-row-pad">No payments yet. Your receipts will appear here after your first payment.</p>
          ) : (
            <div className="st-table-wrap">
              <table className="st-table">
                <thead><tr><th scope="col">Date</th><th scope="col">Amount</th><th scope="col">Method</th><th scope="col">Status</th><th scope="col" className="st-num">Transaction ID</th></tr></thead>
                <tbody>
                  {payments.map(payment => (
                    <tr key={payment.id} data-testid={`row-payment-${payment.id}`}>
                      <td>{new Date(payment.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td className="st-strong" data-testid={`text-payment-amount-${payment.id}`}>{formatPaymentAmount(payment.amount, payment.currency)}</td>
                      <td>{formatPaymentMethod(payment.method)}</td>
                      <td><span className={PILL[paymentStatusTone(payment.status)]} data-testid={`badge-payment-status-${payment.id}`}>{statusLabel(payment.status)}</span></td>
                      <td className="st-num st-mono">{shortTransactionId(payment)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </SettingSection>

      {!topTier && (
        <SettingSection title="Need more?">
          <SettingRow title="Higher limits and more seats" description="Compare plans to unlock more designs, editable credits and team members.">
            <Link href="/pricing" className="ws-btn ws-btn-small">View plans<ArrowUpRight aria-hidden="true" /></Link>
          </SettingRow>
        </SettingSection>
      )}

      {subscription && !subscription.cancelAtPeriodEnd && (
        <SettingSection title="Cancellation">
          <SettingRow title="Cancel subscription" description={status === 'PENDING' ? 'Removes the pending checkout and returns you to Free.' : 'You keep your plan until the end of this billing period.'}>
            <button type="button" className="ws-btn ws-btn-small ws-btn-danger" onClick={() => setConfirmCancel(true)} disabled={cancel.isPending} data-testid="button-cancel">
              {cancel.isPending ? <Loader2 className="st-spin" aria-hidden="true" /> : 'Cancel plan'}
            </button>
          </SettingRow>
        </SettingSection>
      )}

      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel your {config.name} plan?</AlertDialogTitle>
            <AlertDialogDescription>
              {status === 'PENDING'
                ? `Payment isn’t complete yet. Cancelling removes this pending ${config.name} checkout, cancels it with your payment provider, and returns your workspace to the Free plan.`
                : `You’ll keep ${config.name} until ${periodEnd}. After that your workspace moves to the Free plan.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-dialog-cancel">Keep plan</AlertDialogCancel>
            <AlertDialogAction onClick={() => cancel.mutate()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" data-testid="button-cancel-dialog-confirm">
              {cancel.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Cancel subscription
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
