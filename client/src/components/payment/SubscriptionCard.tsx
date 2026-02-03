import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
import { CreditCard, Calendar, TrendingUp, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PLAN_CONFIG, type Subscription } from "@shared/schema";
import { Link } from "wouter";

interface SubscriptionCardProps {
  organization?: {
    usageCount: number;
    monthlyLimit: number;
    plan: string;
  };
}

export function SubscriptionCard({ organization }: SubscriptionCardProps) {
  const { toast } = useToast();
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const { data, isLoading } = useQuery<{ subscription: Subscription | null }>({
    queryKey: ['/api/payments/subscription'],
  });

  const subscription = data?.subscription;

  const cancelMutation = useMutation({
    mutationFn: async (immediate: boolean) => {
      const response = await apiRequest('/api/payments/cancel', {
        method: 'POST',
        body: JSON.stringify({ immediate }),
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription has been cancelled.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/payments/subscription'] });
      setShowCancelDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel subscription",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <Card className="animate-pulse h-64" data-testid="card-subscription-loading">
        <CardContent className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const currentPlan = subscription?.planTier || organization?.plan || 'FREE';
  const planConfig = PLAN_CONFIG[currentPlan as keyof typeof PLAN_CONFIG] || PLAN_CONFIG.FREE;

  const usageCount = organization?.usageCount || 0;
  const monthlyLimit = organization?.monthlyLimit || planConfig.limit;
  const usagePercent = monthlyLimit > 0 ? (usageCount / monthlyLimit) * 100 : 0;

  const getStatusBadgeVariant = (status: string | undefined) => {
    switch (status) {
      case 'ACTIVE':
        return 'default';
      case 'PAST_DUE':
        return 'destructive';
      case 'CANCELLED':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <>
      <Card data-testid="card-subscription">
        <CardHeader>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle>Current Plan</CardTitle>
            <Badge variant={getStatusBadgeVariant(subscription?.status)} data-testid="badge-subscription-status">
              {subscription?.status || 'FREE'}
            </Badge>
          </div>
          <CardDescription>Manage your subscription and billing</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Plan Details */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium" data-testid="text-plan-name">{planConfig.name} Plan</span>
            </div>
            <span className="text-2xl font-bold" data-testid="text-amount">
              {planConfig.price === 0 ? (
                'Free'
              ) : (
                <>₹{(planConfig.price).toLocaleString()}/mo</>
              )}
            </span>
          </div>

          {/* Usage Meter */}
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
              <Calendar className="w-4 h-4" />
              <span data-testid="text-billing-date">
                Next billing: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </span>
            </div>
          )}

          {/* Cancel Warning */}
          {subscription?.cancelAtPeriodEnd && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
              <p className="text-sm text-destructive" data-testid="text-cancel-warning">
                Your subscription will end on{' '}
                {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex gap-2 flex-wrap">
          <Link href="/pricing" className="flex-1">
            <Button variant="outline" className="w-full" data-testid="button-upgrade">
              <TrendingUp className="w-4 h-4 mr-2" />
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
        </CardFooter>
      </Card>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your subscription? You'll continue to have access 
              until the end of your current billing period.
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

