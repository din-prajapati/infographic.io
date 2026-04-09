import { useState, type ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CreditCard, Calendar, TrendingUp, Loader2, Clock } from "lucide-react";
import { toast } from "sonner";
import { queryClient } from "@/lib/queryClient";
import { paymentsApi, getApiUrl } from "@/lib/api";
import { PLAN_CONFIG, type Subscription, type SubscriptionStatus } from "@shared/schema";
import { Link } from "wouter";

interface SubscriptionCardProps {
  organization?: {
    usageCount: number;
    monthlyLimit: number;
    plan: string;
  };
}

function toValidDate(v: string | Date | null | undefined): Date | null {
  if (v == null) return null;
  const d = new Date(v);
  const time = d.getTime();
  if (Number.isNaN(time) || time < 86400000) return null; // Before 2 Jan 1970 = invalid/epoch
  return d;
}

function addDays(d: Date, days: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}

/** Avoid displaying epoch (1/1/1970) or invalid dates. Uses fallbacks when primary is invalid. */
function formatBillingDate(
  value: string | Date | null | undefined,
  fallbacks?: { currentPeriodStart?: string | Date; createdAt?: string | Date }
): string {
  const primary = toValidDate(value);
  if (primary) return primary.toLocaleDateString();
  const fromStart = toValidDate(fallbacks?.currentPeriodStart);
  if (fromStart) return addDays(fromStart, 30).toLocaleDateString();
  const fromCreated = toValidDate(fallbacks?.createdAt);
  if (fromCreated) return addDays(fromCreated, 30).toLocaleDateString();
  return '—';
}

type PlanConfigEntry = (typeof PLAN_CONFIG)[keyof typeof PLAN_CONFIG];

/** Uses API `billingPeriod` + `amount` (paise); falls back to catalog price when needed. */
function getSubscriptionBillingLabels(
  subscription: Subscription | null | undefined,
  planConfig: PlanConfigEntry,
): { showAnnualLabel: boolean; amountDisplay: ReactNode } {
  if (planConfig.price === 0) {
    return { showAnnualLabel: false, amountDisplay: 'Free' };
  }
  if (!subscription) {
    return { showAnnualLabel: false, amountDisplay: <>₹{planConfig.price.toLocaleString()}/mo</> };
  }
  const billingPeriodUpper = String(
    (subscription as { billingPeriod?: string }).billingPeriod ?? 'MONTHLY',
  ).toUpperCase();
  const isAnnual = billingPeriodUpper === 'ANNUAL';
  const rupees =
    subscription.amount != null ? Math.round(Number(subscription.amount) / 100) : null;
  if (rupees != null && rupees > 0) {
    return {
      showAnnualLabel: isAnnual,
      amountDisplay: isAnnual ? (
        <>₹{rupees.toLocaleString()}/yr</>
      ) : (
        <>₹{rupees.toLocaleString()}/mo</>
      ),
    };
  }
  return { showAnnualLabel: false, amountDisplay: <>₹{planConfig.price.toLocaleString()}/mo</> };
}

export function SubscriptionCard({ organization }: SubscriptionCardProps) {
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const { data, isLoading } = useQuery<{
    subscription: Subscription | null;
    usage?: { current: number; limit: number };
  }>({
    queryKey: [getApiUrl('/payments/subscription')],
  });

  const subscription = data?.subscription;
  const usageFromApi = data?.usage;

  const cancelMutation = useMutation({
    mutationFn: async (immediate: boolean) => {
      return paymentsApi.cancelSubscription(immediate);
    },
    onSuccess: () => {
      toast.success("Subscription Cancelled", {
        description: "Your subscription has been cancelled.",
      });
      queryClient.invalidateQueries({ queryKey: [getApiUrl('/payments/subscription')] });
      setShowCancelDialog(false);
    },
    onError: (error: any) => {
      toast.error("Error", {
        description: error.message || "Failed to cancel subscription",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="glass flex h-64 animate-pulse items-center justify-center rounded-xl border border-border" data-testid="card-subscription-loading">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const currentPlan = subscription?.planTier || organization?.plan || 'FREE';
  const planConfig = PLAN_CONFIG[currentPlan as keyof typeof PLAN_CONFIG] || PLAN_CONFIG.FREE;
  const subscriptionStatus = subscription?.status as SubscriptionStatus | undefined;
  const { showAnnualLabel, amountDisplay } = getSubscriptionBillingLabels(subscription, planConfig);

  const usageCount = usageFromApi?.current ?? organization?.usageCount ?? 0;
  const monthlyLimit = usageFromApi?.limit ?? organization?.monthlyLimit ?? planConfig.limit;
  const usagePercent = monthlyLimit > 0 ? (usageCount / monthlyLimit) * 100 : 0;

  const getStatusBadgeVariant = (status: string | undefined) => {
    switch (status) {
      case 'ACTIVE':
        return 'default';
      case 'PAST_DUE':
        return 'destructive';
      case 'CANCELLED':
        return 'secondary';
      case 'PENDING':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <>
      <div className="glass overflow-hidden rounded-xl border border-border" data-testid="card-subscription">
        <div className="border-b border-border px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold text-foreground">Current Plan</h2>
            <Badge variant={getStatusBadgeVariant(subscription?.status)} data-testid="badge-subscription-status">
              {subscription?.status || 'FREE'}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Manage your subscription and billing</p>
        </div>

        <div className="space-y-6 p-6">
          {/* Plan Details */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <CreditCard className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium text-foreground" data-testid="text-plan-name">
                {planConfig.name} Plan
                {subscription && showAnnualLabel ? (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">(Annual)</span>
                ) : null}
              </span>
            </div>
            <span className="text-2xl font-bold text-foreground" data-testid="text-amount">
              {amountDisplay}
            </span>
          </div>

          {/* Usage Meter - Infographics generated this billing period vs plan limit */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Monthly Usage</span>
              <span className="font-medium" data-testid="text-usage">
                {usageCount} / {monthlyLimit === -1 ? 'Unlimited' : monthlyLimit}
              </span>
            </div>
            {monthlyLimit > 0 && (
              <Progress 
                value={Math.min(usagePercent, 100)} 
                className="h-2" 
                data-testid="progress-usage"
              />
            )}
            {usagePercent >= 80 && usagePercent < 100 && (
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                You're approaching your monthly limit
              </p>
            )}
            {usagePercent >= 100 && (
              <p className="text-sm text-destructive">
                You've reached your monthly limit. Upgrade to continue.
              </p>
            )}
          </div>

          {/* Billing Period */}
          {subscription && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4 shrink-0" />
              <span data-testid="text-billing-date">
                Next billing: {formatBillingDate(subscription.currentPeriodEnd, {
                  currentPeriodStart: subscription.currentPeriodStart,
                  createdAt: subscription.createdAt,
                })}
              </span>
            </div>
          )}

          {/* Pending Payment Banner */}
          {subscriptionStatus === 'PENDING' && (
            <div className="flex items-start gap-2 rounded-md border border-yellow-500/30 bg-yellow-500/10 p-3">
              <Clock className="h-4 w-4 shrink-0 mt-0.5 text-yellow-500" />
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                Payment processing — your plan will activate once payment is confirmed. This usually takes under a minute.
              </p>
            </div>
          )}

          {/* Cancel Warning */}
          {subscription?.cancelAtPeriodEnd && (
            <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3">
              <p className="text-sm text-destructive" data-testid="text-cancel-warning">
                Your subscription will end on {formatBillingDate(subscription.currentPeriodEnd, {
                  currentPeriodStart: subscription.currentPeriodStart,
                  createdAt: subscription.createdAt,
                })}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 border-t border-border px-6 pb-6 pt-4">
          <Link href="/pricing" className="flex-1">
            <Button variant="outline" className="w-full border-border" data-testid="button-upgrade">
              <TrendingUp className="mr-2 h-4 w-4" />
              {currentPlan === 'FREE' ? 'Upgrade Plan' : 'Change Plan'}
            </Button>
          </Link>

          {subscription && !subscription.cancelAtPeriodEnd && (
            <Button
              variant="destructive"
              onClick={() => setShowCancelDialog(true)}
              disabled={cancelMutation.isPending}
              data-testid="button-cancel"
            >
              {cancelMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Cancel'
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
            <AlertDialogDescription>
              {subscriptionStatus === 'PENDING' ? (
                <>
                  Payment is not complete yet. Cancelling removes this pending {planConfig.name} checkout,
                  cancels the subscription with your payment provider, and returns your workspace to the Free plan.
                </>
              ) : (
                <>
                  Are you sure you want to cancel your subscription? You&apos;ll continue to have access
                  until the end of your current billing period.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-dialog-cancel">
              Keep Subscription
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cancelMutation.mutate(false)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-cancel-dialog-confirm"
            >
              {cancelMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Cancel Subscription
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

