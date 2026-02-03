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
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold mb-2">Need More?</h3>
            <p className="text-blue-100">
              Upgrade to unlock more features and higher limits
            </p>
          </div>
          <Link href="/pricing">
            <Button variant="secondary" className="bg-white text-blue-600 hover:bg-blue-50">
              View Plans
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
