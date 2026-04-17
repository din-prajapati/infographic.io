import { SubscriptionCard, PaymentHistory } from "../payment";
import { Link } from "wouter";
import { Button } from "../ui/button";

export function BillingScreen() {
  return (
    <div className="space-y-6">
      {/* Current Subscription */}
      <SubscriptionCard />

      {/* Payment History */}
      <PaymentHistory />

      {/* Upgrade CTA */}
      <div className="glass rounded-xl border border-border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="mb-2 text-xl font-semibold text-foreground">Need More?</h3>
            <p className="text-muted-foreground">
              Upgrade to unlock more features and higher limits
            </p>
          </div>
          <Link href="/pricing">
            <Button variant="default">
              View Plans
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
