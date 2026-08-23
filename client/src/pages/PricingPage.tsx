import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Check,
  ArrowRight,
  Gift,
  Star,
  Zap,
  Users,
  Building,
  Loader2,
  Linkedin,
  Twitter,
  Youtube,
  Instagram,
  CreditCard,
  Info,
} from "lucide-react";

const PENDING_PLAN_KEY = "pending_subscription_plan";

// US-PAY-112 — the 5 real tiers shown on the pricing page, in display order, plus a 6th static
// Enterprise "Contact Sales" card (no PLAN_CONFIG entry — custom pricing, see EPIC.md Out of
// Scope). BROKERAGE is deliberately excluded here: being phased out in favor of AGENCY, no longer
// marketed on this page (existing subscribers keep it on their account, see US-PAY-102's Out of
// Scope) — this replaces the old Individual/Enterprise segment toggle, which never showed
// PRO/AGENCY at all.
const PUBLIC_TIERS: PlanTier[] = ["FREE", "SOLO", "PRO", "TEAM", "AGENCY"];

const planDescriptions: Record<string, string> = {
  FREE: "Get started with essential features at no cost",
  SOLO: "Perfect for individual agents",
  PRO: "For agents who list frequently",
  TEAM: "Built for real estate teams and brands",
  AGENCY: "For agencies and brokerages at scale",
  BROKERAGE: "For brokerages with white-label needs",
};

import { toast } from "sonner";
import { queryClient, redirectToLogin } from "@/lib/queryClient";
import { paymentsApi, pricingApi, type ProviderInfo, type EffectivePriceResult } from "@/lib/api";
import { PLAN_CONFIG, type PlanTier } from "@shared/schema";

/**
 * Test-mode banner recurring-amount text, derived from PLAN_CONFIG at call time.
 * Exported (not inlined in JSX) so a test can mutate a PLAN_CONFIG price and assert the
 * text tracks it with zero code edits — US-PAY-104 AC1/AC2.
 */
export function getTestModeBannerAmounts(
  config: Pick<typeof PLAN_CONFIG, "SOLO" | "TEAM"> = PLAN_CONFIG,
): { solo: string; team: string } {
  return {
    solo: config.SOLO.price.toLocaleString(),
    team: config.TEAM.price.toLocaleString(),
  };
}

export interface PricingCardDisplay {
  showAnnualToggle: boolean;
  hasFoundingPrice: boolean;
  displayEffective: number;
  displayRegular: number;
  annualSavings: number;
  annualEffectiveTotal: number;
}

/**
 * Pure per-card pricing derivation for US-PAY-112 — exported (not inlined in JSX) so a test can
 * assert the founding-badge/strikethrough/annual-equivalent logic against fixed EffectivePriceResult
 * fixtures, the same pattern getTestModeBannerAmounts() established for US-PAY-104. Every number
 * here comes only from the two EffectivePriceResult objects the pricing API returned — this
 * function never invents a discount or price itself (US-PAY-112 AC3).
 */
export function computePricingCardDisplay(
  monthly: EffectivePriceResult | undefined,
  annual: EffectivePriceResult | undefined,
  isAnnual: boolean,
  isStatic: boolean,
): PricingCardDisplay {
  const activePricing = isAnnual ? annual : monthly;
  const showAnnualToggle = !isStatic && (monthly?.regularPrice ?? 0) > 0;
  const hasFoundingPrice =
    !isStatic &&
    activePricing != null &&
    activePricing.campaignId != null &&
    activePricing.effectivePrice !== activePricing.regularPrice;

  const displayEffective = isAnnual
    ? Math.round((annual?.effectivePrice ?? 0) / 12)
    : (monthly?.effectivePrice ?? 0);
  const displayRegular = isAnnual
    ? Math.round((annual?.regularPrice ?? 0) / 12)
    : (monthly?.regularPrice ?? 0);
  const annualSavings = (monthly?.regularPrice ?? 0) * 12 - (annual?.regularPrice ?? 0);
  const annualEffectiveTotal = annual?.effectivePrice ?? 0;

  return { showAnnualToggle, hasFoundingPrice, displayEffective, displayRegular, annualSavings, annualEffectiveTotal };
}

declare global {
  interface Window {
    Razorpay: any;
    Stripe: any;
  }
}

const planIcons: Record<string, any> = {
  FREE: Gift,
  SOLO: Star,
  PRO: Zap,
  TEAM: Building,
  AGENCY: Users,
  BROKERAGE: Building,
  ENTERPRISE: Building,
};

const featureLeadIn: Record<string, string> = {
  SOLO: "Everything in Free, plus:",
  PRO: "Everything in Solo, plus:",
  TEAM: "Everything in Pro, plus:",
  AGENCY: "Everything in Team, plus:",
  BROKERAGE: "Everything in Team, plus:",
};

const faqs = [
  {
    question: "How fast can I create an infographic?",
    answer:
      "Most infographics are ready in 15-20 seconds. Enter your listing details, pick a template, and the system generates the visual automatically.",
  },
  {
    question: "Do I need a credit card to start?",
    answer:
      "No. The Free plan includes 3 infographics per month. Upgrade when you need more listings or custom branding.",
  },
  {
    question: "Is this built for real estate?",
    answer:
      "Yes. Buildographic is built for agents, teams, and brokerages. Templates are designed specifically for property listings and marketing.",
  },
  {
    question: "What formats can I download?",
    answer:
      "All plans include high-resolution PNG and JPG downloads, optimized for social media and print-ready sizing. PDF export is coming soon.",
  },
  {
    question: "Do unused credits roll over?",
    answer:
      "Credits do not roll over between months. We recommend choosing a plan that matches your typical monthly listing volume.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.",
  },
];

// Floating typography for dark sections
const darkFloatingChars = [
  { char: "A", top: "10%", left: "3%", opacity: 0.12 },
  { char: "+", top: "15%", left: "12%", opacity: 0.08 },
  { char: "8", top: "20%", left: "8%", opacity: 0.1 },
  { char: "X", top: "25%", left: "18%", opacity: 0.06 },
  { char: "R", top: "12%", left: "25%", opacity: 0.08 },
  { char: "Q", top: "8%", left: "85%", opacity: 0.08 },
  { char: "+", top: "15%", left: "90%", opacity: 0.06 },
  { char: "U", top: "22%", left: "82%", opacity: 0.1 },
  { char: "S", top: "30%", left: "88%", opacity: 0.08 },
];

export default function PricingPage() {
  const isBetaMode = import.meta.env.VITE_BETA_MODE === 'true';

  const [, setLocation] = useLocation();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [isSyncingStatus, setIsSyncingStatus] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<"INR" | "USD">("INR");

  // Per-card annual toggle state
  const [annualToggles, setAnnualToggles] = useState<Record<string, boolean>>({
    SOLO: false,
    PRO: false,
    TEAM: false,
    AGENCY: false,
  });

  const toggleAnnual = (tier: string) => {
    setAnnualToggles((prev) => ({ ...prev, [tier]: !prev[tier] }));
  };

  // US-PAY-112 AC1/AC3 — the only source for regularPrice/effectivePrice/campaignId/badge.
  // Public endpoint, no auth needed. Never recompute a discounted price client-side.
  const { data: pricingData } = useQuery({
    queryKey: ["/api/v1/pricing"],
    queryFn: () => pricingApi.getPricing(),
  });

  const pricingByTier = new Map<PlanTier, { monthly: EffectivePriceResult; annual: EffectivePriceResult }>(
    (pricingData?.plans ?? []).map((p) => [p.tier, { monthly: p.monthly, annual: p.annual }]),
  );

  // Fetch provider info based on selected currency
  const { data: providerInfo } = useQuery<ProviderInfo>({
    queryKey: ["/api/v1/payments/provider-info", selectedCurrency],
    queryFn: () => paymentsApi.getProviderInfo(selectedCurrency),
  });

  // Fetch plan availability — gate tiers without a configured plan ID (AC2 US-LAUNCH-007)
  const { data: plansData } = useQuery({
    queryKey: ["/api/v1/payments/plans"],
    queryFn: () => paymentsApi.getPlans(),
  });

  // Set of plan tiers that are paid but NOT yet configured with a payment-provider plan ID.
  // Driven by the backend "configured" flag — not hardcoded to any specific tier.
  const unconfiguredPaidTiers = new Set<string>(
    (plansData?.plans ?? [])
      .filter((p: { tier: string; price?: number; configured?: boolean }) =>
        (p.price ?? 0) > 0 && !p.configured
      )
      .map((p: { tier: string }) => p.tier),
  );

  // Fetch current subscription if logged in
  const { data: subscriptionData } = useQuery({
    queryKey: ["/api/v1/payments/subscription"],
    queryFn: () => paymentsApi.getSubscription(),
    enabled: !!localStorage.getItem("auth_token"),
  });

  const subscription = subscriptionData?.subscription;
  // ACTIVE/PAST_DUE/HALTED/PAUSED = confirmed current plan. PENDING handled separately below.
  const currentPlan: PlanTier | "FREE" =
    subscription &&
    (subscription.status === "ACTIVE" ||
      subscription.status === "PAST_DUE" ||
      subscription.status === "HALTED" ||
      subscription.status === "PAUSED")
      ? (subscription.planTier as PlanTier)
      : "FREE";
  // PENDING: payment captured but webhook not yet confirmed — show "Activating..." and block re-subscribe
  const pendingPlanTier: PlanTier | null =
    subscription?.status === "PENDING" ? (subscription.planTier as PlanTier) : null;

  const subscriptionBillingIsAnnual = (sub: { billingPeriod?: string }) =>
    String(sub.billingPeriod ?? "MONTHLY").toUpperCase() === "ANNUAL";

  // Create subscription mutation
  const createSubscriptionMutation = useMutation({
    mutationFn: async ({ planTier, isAnnual }: { planTier: PlanTier; isAnnual: boolean }) => {
      return paymentsApi.createSubscription({
        planTier,
        currency: selectedCurrency,
        region: selectedCurrency === "INR" ? "IN" : "US",
        billingPeriod: isAnnual ? "annual" : "monthly",
      });
    },
    onSuccess: (data) => {
      if (data.provider === "STRIPE" && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        // Always use Razorpay JS checkout widget — shortUrl (hosted page) is unreliable in test mode
        openRazorpayCheckout(data);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/v1/payments/subscription"] });
    },
    onError: (error: any) => {
      const isUnauthorized =
        error?.message === "Unauthorized" ||
        error?.response?.status === 401 ||
        (typeof error?.message === "string" &&
          error.message.toLowerCase().includes("unauthorized"));
      if (isUnauthorized) {
        redirectToLogin();
        return;
      }
      toast.error("Subscription Error", {
        description: error.message || "Failed to create subscription",
      });
    },
  });

  const openRazorpayCheckout = (data: any) => {
    if (typeof window.Razorpay === "undefined") {
      toast.error("Payment Error", {
        description: "Payment system is loading. Please try again in a moment.",
      });
      return;
    }

    const planTierLabel = data.subscription?.planTier || "Paid";

    const subscriptionId = data.providerSubscription?.id ?? data.subscription?.externalSubscriptionId;
    if (!subscriptionId) {
      toast.error("Payment Error", {
        description: "Missing subscription ID. Please try again.",
      });
      return;
    }
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      subscription_id: subscriptionId,
      name: "Buildographic",
      description: `${planTierLabel} Plan Subscription`,
      handler: async (response: any) => {
        try {
          await paymentsApi.verifyPayment({
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySubscriptionId: response.razorpay_subscription_id,
            razorpaySignature: response.razorpay_signature,
          });

          toast.success("Payment Successful", {
            description: "Your subscription is now active!",
          });

          queryClient.invalidateQueries({
            queryKey: ["/api/v1/payments/subscription"],
          });
          setLocation("/templates");
        } catch (error: any) {
          toast.error("Verification Failed", {
            description: error.message || "Payment verification failed",
          });
        }
      },
      modal: {
        ondismiss: async () => {
          toast.error("Payment Cancelled", {
            description:
              "Checkout was closed before payment completed. We are cancelling the pending checkout.",
          });
          try {
            await paymentsApi.cancelSubscription();
          } catch {
            // No PENDING sub, or cancel already applied — still refresh below
          }
          queryClient.invalidateQueries({
            queryKey: ["/api/v1/payments/subscription"],
          });
        },
      },
      prefill: {
        email: "",
        contact: "",
      },
      theme: {
        color: "#000000",
      },
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  };

  // Auto-resume pending subscription after post-login redirect back to /pricing
  useEffect(() => {
    if (!localStorage.getItem("auth_token")) return;
    const stored = localStorage.getItem(PENDING_PLAN_KEY);
    if (!stored) return;
    localStorage.removeItem(PENDING_PLAN_KEY);
    try {
      const { planTier, isAnnual } = JSON.parse(stored) as { planTier: PlanTier; isAnnual: boolean };
      if (!planTier || planTier === "FREE") return;
      if (isAnnual) setAnnualToggles((prev) => ({ ...prev, [planTier]: true }));
      setLoadingPlan(planTier);
      createSubscriptionMutation.mutate({ planTier, isAnnual: isAnnual ?? false });
    } catch {
      // ignore malformed stored value
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSyncPendingStatus = async () => {
    setIsSyncingStatus(true);
    try {
      const result = await paymentsApi.syncSubscription();
      await queryClient.invalidateQueries({ queryKey: ["/api/v1/payments/subscription"] });
      if (result.promoted || result.localStatus === 'CANCELLED') {
        // Page will re-render with updated subscription data — toast handled by SubscriptionCard
        // For abandoned (CANCELLED) case, show a brief message
        if (result.localStatus === 'CANCELLED') {
          toast.info('Checkout cleared', { description: result.message });
        }
      }
    } catch {
      toast.error('Could not check status. Please try again.');
    } finally {
      setIsSyncingStatus(false);
    }
  };

  const handleSubscribe = async (planTier: PlanTier) => {
    if (planTier === "FREE") {
      setLocation("/auth");
      return;
    }

    if (!localStorage.getItem("auth_token")) {
      localStorage.setItem(
        PENDING_PLAN_KEY,
        JSON.stringify({ planTier, isAnnual: annualToggles[planTier] || false }),
      );
      redirectToLogin();
      return;
    }

    setLoadingPlan(planTier);
    try {
      await createSubscriptionMutation.mutateAsync({
        planTier,
        isAnnual: annualToggles[planTier] || false,
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  // US-PAY-112 AC1 — Free/Solo/Pro/Team/Agency render together (replaces the old Individual/
  // Enterprise segment toggle, which never showed PRO/AGENCY at all), plus a static Enterprise
  // "Contact Sales" card. Non-price fields (name, features, allowances) still come from
  // PLAN_CONFIG — only price itself is server-resolved (AC3).
  const realPlans = PUBLIC_TIERS.map((tier) => {
    const config = PLAN_CONFIG[tier];
    const pricing = pricingByTier.get(tier);
    return {
      tier: tier as PlanTier | "ENTERPRISE",
      name: config.name,
      icon: planIcons[tier] ?? Gift,
      features: config.features,
      designLimit: config.limit,
      editableLimit: config.editableLimit,
      isStatic: false,
      monthly: pricing?.monthly,
      annual: pricing?.annual,
    };
  });

  const enterprisePlan = {
    tier: "ENTERPRISE" as const,
    name: "Enterprise",
    icon: planIcons.ENTERPRISE ?? Building,
    features: [
      "Unlimited infographics",
      "Unlimited editable designs",
      "Dedicated account manager",
      "Custom integrations",
      "SLA guarantee",
      "White-label options",
    ],
    designLimit: -1,
    editableLimit: -1,
    isStatic: true,
    monthly: undefined,
    annual: undefined,
  };

  const plans = [...realPlans, enterprisePlan];

  return (
    <div className="min-h-screen" style={{ background: 'var(--page-bg)' }}>
      {/* Nav - Dark glass style */}
      <nav className="border-b border-border glass sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between px-6 max-w-6xl mx-auto">
          <Link
            href="/"
            className="flex flex-col items-center justify-center leading-none font-bold text-foreground"
          >
            <img src="/logo-icon-option6.png" alt="" className="h-7 w-7 dark:hidden" />
            <img src="/logo-icon-option6-light.png" alt="" className="h-7 w-7 hidden dark:block" />
            <span className="text-[10px] leading-none font-extrabold tracking-tight mt-0.5">Buildographic</span>
          </Link>
          {/* US-PAY-113 AC1: hidden below md, same convention as LandingPage.tsx's nav — this
              codebase has no mobile hamburger menu anywhere yet, so a full-width link row here
              would overflow the viewport on a phone. */}
          <div className="hidden md:flex items-center gap-8">
            <a
              href="/#features"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Features
            </a>
            <a
              href="/pricing"
              className="text-sm font-medium text-foreground"
            >
              Pricing
            </a>
            <a
              href="/#faqs"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              FAQs
            </a>
            <a
              href="#enterprise"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Enterprise
            </a>
            <Link href="/auth">
              <Button
                className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full font-medium px-5"
              >
                Get Started <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="container px-6 pt-10 pb-6 text-center max-w-6xl mx-auto">

        {/* Beta mode notice */}
        {isBetaMode && (
          <div className="mx-auto max-w-2xl rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 mb-4">
            <div className="flex items-center justify-center gap-2 text-emerald-400 font-semibold mb-1">
              <Info className="h-4 w-4 shrink-0" />
              Free during beta
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Paid plans are coming soon. Create an account and start generating — no credit card needed.
            </p>
          </div>
        )}

        {/* Test mode: show Razorpay test card details and expected amounts */}
        {typeof import.meta.env.VITE_RAZORPAY_KEY_ID === "string" &&
          import.meta.env.VITE_RAZORPAY_KEY_ID.startsWith("rzp_test_") && (
          <div className="mx-auto max-w-2xl rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-left">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-medium mb-2">
              <Info className="h-4 w-4 shrink-0" />
              Test mode — Razorpay
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              For <strong>subscriptions</strong>, Razorpay often shows a small <strong>refundable auth charge</strong> (e.g. ₹5) in the price summary first; the modal copy should still state the full recurring amount (
              <strong>Solo ₹{getTestModeBannerAmounts().solo}/mo</strong>, <strong>Team ₹{getTestModeBannerAmounts().team}/mo</strong>, or annual equivalent). If you only see ₹1 or wrong recurring text, check Dashboard plan amounts and <code className="bg-muted px-1 rounded text-xs">RAZORPAY_PLAN_*</code> in <code className="bg-muted px-1 rounded text-xs">.env</code>.
            </p>
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <CreditCard className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-medium text-foreground">Test card (subscriptions):</span>{" "}
                <code className="bg-muted px-1 rounded">5267 3181 8797 5449</code>
                {" "}(Mastercard). CVV: any 3 digits · Expiry: any future date · OTP: <strong>4–10 digits</strong> = success. Or use UPI: <code className="bg-muted px-1 rounded">success@razorpay</code>.
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Pricing Cards - Emergent-style with per-card Annual toggle */}
      <section className="container px-6 pb-20 max-w-6xl mx-auto">
        {/* US-PAY-113 AC1: explicit grid-cols-1 -> sm:2 -> lg:3 so 6 cards stack cleanly on a
            phone (no reliance on grid's implicit single-column default) and fill tablet width. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrentPlan = currentPlan === plan.tier;
            const isPendingPlan = pendingPlanTier === plan.tier;
            const isPlanLoading = loadingPlan === plan.tier;
            const PlanIcon = plan.icon;
            const leadIn = featureLeadIn[plan.tier];
            const isMostPopular = plan.tier === "PRO";

            // US-PAY-112 AC1/AC3 — regularPrice/effectivePrice/campaignId/badge come only from
            // the pricing API (getEffectivePrice() server-side); never recomputed here.
            const monthlyPricing = plan.monthly;
            const annualPricing = plan.annual;
            const showAnnualToggleBase = !plan.isStatic && (monthlyPricing?.regularPrice ?? 0) > 0;

            /** Paid current tier: reflect API billing period (annual vs monthly), not local toggle. */
            const isPaidCurrentCard =
              isCurrentPlan && showAnnualToggleBase && subscription != null;
            const isAnnual = isPaidCurrentCard
              ? subscriptionBillingIsAnnual(subscription as { billingPeriod?: string })
              : annualToggles[plan.tier] || false;
            const annualSwitchLocked = isPaidCurrentCard;

            const activePricing = isAnnual ? annualPricing : monthlyPricing;
            const {
              showAnnualToggle,
              hasFoundingPrice,
              displayEffective,
              displayRegular,
              annualSavings,
              annualEffectiveTotal,
            } = computePricingCardDisplay(monthlyPricing, annualPricing, isAnnual, plan.isStatic);

            const subscriptionAmountInr =
              subscription?.amount != null
                ? Math.round(Number(subscription.amount) / 100)
                : null;

            const fmt = (n: number) =>
              selectedCurrency === "INR" ? n.toLocaleString() : Math.round(n / 83).toLocaleString();
            const currencySymbol = selectedCurrency === "INR" ? "₹" : "$";

            return (
              <div
                key={plan.tier}
                className={`relative glass rounded-2xl border p-8 flex flex-col ${
                  isMostPopular ? "border-primary ring-2 ring-primary/30" : "border-border"
                }`}
              >
                {isMostPopular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
                    MOST POPULAR
                  </span>
                )}
                {hasFoundingPrice && activePricing?.badge && (
                  <span className="absolute -top-3 right-4 bg-amber-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
                    {activePricing.badge}
                  </span>
                )}

                {/* Header with Annual Toggle */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                    <PlanIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  {showAnnualToggle && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-medium">Annual</span>
                      <Switch
                        checked={isAnnual}
                        disabled={annualSwitchLocked}
                        onCheckedChange={() => {
                          if (!annualSwitchLocked) toggleAnnual(plan.tier);
                        }}
                        className="data-[state=checked]:bg-blue-600 border-2"
                      />
                    </div>
                  )}
                </div>

                <p className="text-sm text-muted-foreground mb-6">
                  {planDescriptions[plan.tier]}
                </p>

                {/* Price */}
                <div className="mb-6">
                  {plan.isStatic ? (
                    <div className="text-4xl font-bold text-foreground">Custom</div>
                  ) : isPaidCurrentCard &&
                    subscriptionAmountInr != null &&
                    subscriptionAmountInr > 0 ? (
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="text-4xl font-bold text-foreground">
                          {currencySymbol}
                          {fmt(subscriptionAmountInr)}
                        </span>
                        <span className="text-base text-muted-foreground">
                          {isAnnual ? "/ year" : "/ month"}
                        </span>
                        {isAnnual && (
                          <span className="text-sm text-teal-400 font-medium bg-teal-400/10 px-2 py-0.5 rounded-full">
                            Annual
                          </span>
                        )}
                      </div>
                      {isAnnual && (
                        <p className="text-sm text-muted-foreground">
                          ≈ {currencySymbol}
                          {fmt(Math.round(subscriptionAmountInr / 12))}
                          /mo equivalent
                        </p>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-baseline gap-2">
                        {hasFoundingPrice && (
                          <span className="text-lg text-muted-foreground line-through">
                            {currencySymbol}
                            {fmt(displayRegular)}
                          </span>
                        )}
                        <span className="text-4xl font-bold text-foreground">
                          {currencySymbol}
                          {fmt(displayEffective)}
                        </span>
                        <span className="text-base text-muted-foreground">
                          {isAnnual ? "/ month equiv." : "/ month"}
                        </span>
                        {isAnnual && (
                          <span className="text-sm text-teal-400 font-medium bg-teal-400/10 px-2 py-0.5 rounded-full">
                            Save {currencySymbol}
                            {fmt(annualSavings)}
                          </span>
                        )}
                      </div>
                      {isAnnual && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Billed annually at {currencySymbol}
                          {fmt(annualEffectiveTotal)}
                          /year
                        </p>
                      )}
                      {!plan.isStatic && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {plan.designLimit === -1 ? "Unlimited" : plan.designLimit} designs/mo ·{" "}
                          {plan.editableLimit === -1 ? "unlimited" : plan.editableLimit} editable
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* Features */}
                {leadIn && (
                  <p className="text-sm text-muted-foreground mb-3">{leadIn}</p>
                )}
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm text-foreground"
                    >
                      <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                {plan.isStatic ? (
                  <a
                    href="mailto:hello@buildographic.com"
                    className="w-full h-12 rounded-full font-medium flex items-center justify-center gap-2 bg-accent text-foreground hover:bg-accent/80 transition-colors"
                  >
                    Contact Sales
                  </a>
                ) : isBetaMode && (monthlyPricing?.regularPrice ?? 0) > 0 ? (
                  <Button
                    className="w-full h-12 rounded-full font-medium bg-accent text-muted-foreground cursor-not-allowed"
                    disabled
                  >
                    Available after beta
                  </Button>
                ) : unconfiguredPaidTiers.has(plan.tier) ? (
                  /* AC1/AC2 US-LAUNCH-007: no plan ID configured → Contact us instead of checkout */
                  <a
                    href="mailto:hello@buildographic.com"
                    className="w-full h-12 rounded-full font-medium flex items-center justify-center gap-2 bg-accent text-foreground hover:bg-accent/80 transition-colors"
                  >
                    Contact us
                  </a>
                ) : (
                  <Button
                    className={`w-full h-12 rounded-full font-medium ${
                      isCurrentPlan || isPendingPlan
                        ? "bg-accent text-muted-foreground"
                        : "bg-primary hover:bg-primary/90 text-primary-foreground"
                    }`}
                    disabled={isCurrentPlan || isPendingPlan || isPlanLoading}
                    onClick={() => handleSubscribe(plan.tier as PlanTier)}
                  >
                    {isPlanLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : isCurrentPlan ? (
                      "Current Plan"
                    ) : isPendingPlan ? (
                      "Activating..."
                    ) : (
                      "Try Buildographic"
                    )}
                  </Button>
                )}
                {isPendingPlan && (
                  <button
                    onClick={handleSyncPendingStatus}
                    disabled={isSyncingStatus}
                    className="mt-2 w-full text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 disabled:opacity-50 transition-colors"
                  >
                    {isSyncingStatus ? "Checking…" : "Not seeing your plan? Refresh status"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQ Section - Dark with floating typography */}
      <section className="relative bg-background py-20 overflow-hidden">
        {/* Floating Typography */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
          {darkFloatingChars.map((item, i) => (
            <span
              key={i}
              className="absolute text-3xl md:text-5xl lg:text-6xl font-bold text-gray-600"
              style={{
                top: item.top,
                left: item.left,
                opacity: item.opacity,
              }}
            >
              {item.char}
            </span>
          ))}
        </div>

        <div className="container px-6 max-w-3xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">
              FREQUENTLY ASKED QUESTIONS
            </p>
            <h2 className="text-2xl md:text-4xl font-bold text-foreground">
              Curious about Buildographic?
            </h2>
            <p className="text-xl md:text-2xl font-bold text-foreground">
              We got you covered
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`faq-${index}`}
                className="glass rounded-xl border border-border px-6 overflow-hidden"
              >
                <AccordionTrigger className="text-left text-foreground hover:no-underline py-5 text-base font-medium">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 text-sm leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className="relative py-32 overflow-hidden bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1600&h=900&fit=crop')",
        }}
        id="enterprise"
      >
        <div className="absolute inset-0 bg-sky-400/20" />
        <div className="container px-6 max-w-4xl mx-auto relative z-10 text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
            Start creating
          </h2>
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-10 drop-shadow-lg">
            on Buildographic today.
          </h2>
          <Link href="/auth">
            <Button
              size="lg"
              className="h-14 px-8 gap-2 rounded-full bg-white hover:bg-gray-100 text-black font-medium text-lg shadow-xl"
            >
              Get Started <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-border py-16">
        <div className="container px-6 max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <Link
                href="/"
                className="flex flex-col items-start gap-1 font-bold text-xl text-white mb-4"
              >
                <img src="/logo-icon-option6-light.png" alt="" className="h-8 w-8" />
                <span>Buildographic</span>
              </Link>
              <p className="text-sm text-gray-400 leading-relaxed">
                Create stunning property infographics for your listings.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li>
                  <Link href="/templates" className="hover:text-white">
                    Templates
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-white">
                    Pricing
                  </Link>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Integrations
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Solutions</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    For Agents
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    For Teams
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    For Brokerages
                  </a>
                </li>
                <li>
                  <a href="#enterprise" className="hover:text-white">
                    Enterprise
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Resources</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Tutorials
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Blog
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="/terms" className="hover:text-white">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="/privacy" className="hover:text-white">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="/refund-policy" className="hover:text-white">
                    Refund &amp; Cancellation
                  </a>
                </li>
                <li>
                  <a href="/cookies" className="hover:text-white">
                    Cookie Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">COPYRIGHT Buildographic 2025</p>
            <p className="text-sm text-gray-500">
              DESIGNED FOR REAL ESTATE PROFESSIONALS
            </p>
            <div className="flex items-center gap-4">
              <a
                href="#"
                className="text-gray-500 hover:text-white transition-colors"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-gray-500 hover:text-white transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-gray-500 hover:text-white transition-colors"
              >
                <Youtube className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-gray-500 hover:text-white transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
