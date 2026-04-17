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
  Building2,
  Check,
  ArrowRight,
  Gift,
  Star,
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

type PlanSegment = "individual" | "enterprise";

const planDescriptions: Record<string, string> = {
  FREE: "Get started with essential features at no cost",
  SOLO: "Perfect for individual agents",
  TEAM: "Built for real estate teams and brands",
  BROKERAGE: "For brokerages with white-label needs",
};

import { toast } from "sonner";
import { queryClient, redirectToLogin } from "@/lib/queryClient";
import { paymentsApi, type ProviderInfo } from "@/lib/api";
import { PLAN_CONFIG, type PlanTier } from "@shared/schema";

declare global {
  interface Window {
    Razorpay: any;
    Stripe: any;
  }
}

const planIcons: Record<string, any> = {
  FREE: Gift,
  SOLO: Star,
  TEAM: Building,
  BROKERAGE: Building,
};

const featureLeadIn: Record<string, string> = {
  SOLO: "Everything in Free, plus:",
  TEAM: "Everything in Solo, plus:",
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
      "Yes. InfographicAI is built for agents, teams, and brokerages. Templates are designed specifically for property listings and marketing.",
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
  const [, setLocation] = useLocation();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<"INR" | "USD">("INR");
  const [planSegment, setPlanSegment] = useState<PlanSegment>("individual");

  // Per-card annual toggle state
  const [annualToggles, setAnnualToggles] = useState<Record<string, boolean>>({
    SOLO: false,
    TEAM: false,
    BROKERAGE: false,
  });

  const toggleAnnual = (tier: string) => {
    setAnnualToggles((prev) => ({ ...prev, [tier]: !prev[tier] }));
  };

  // Fetch provider info based on selected currency
  const { data: providerInfo } = useQuery<ProviderInfo>({
    queryKey: ["/api/v1/payments/provider-info", selectedCurrency],
    queryFn: () => paymentsApi.getProviderInfo(selectedCurrency),
  });

  // Fetch current subscription if logged in
  const { data: subscriptionData } = useQuery({
    queryKey: ["/api/v1/payments/subscription"],
    queryFn: () => paymentsApi.getSubscription(),
    enabled: !!localStorage.getItem("auth_token"),
  });

  /** Only paid / entitled states count as "current" on pricing cards — PENDING checkout must not show as Current Plan (SOLO appears active after dismissing Razorpay otherwise). */
  const subscription = subscriptionData?.subscription;
  const currentPlan: PlanTier | "FREE" =
    subscription &&
    (subscription.status === "ACTIVE" ||
      subscription.status === "PAST_DUE" ||
      subscription.status === "HALTED" ||
      subscription.status === "PAUSED")
      ? (subscription.planTier as PlanTier)
      : "FREE";

  const subscriptionBillingIsAnnual = (sub: { billingPeriod?: string }) =>
    String(sub.billingPeriod ?? "MONTHLY").toUpperCase() === "ANNUAL";

  // Calculate annual price with 15% discount
  const calculateAnnualPrice = (monthlyPrice: number): number => {
    return Math.round(monthlyPrice * 12 * 0.85);
  };

  const calculateMonthlySavings = (monthlyPrice: number): number => {
    return Math.round(monthlyPrice * 12 * 0.15);
  };

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
      name: "InfographicAI",
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

  const allPlans = Object.entries(PLAN_CONFIG)
    .filter(([tier]) => !tier.startsWith("API_"))
    .map(([tier, config]) => ({
      tier: tier as PlanTier,
      ...config,
      icon: planIcons[tier] ?? Gift,
    }));

  /** TEAM only under Enterprise — avoids duplicate Team card on Individual vs Enterprise (TC-SOLO-M-01). */
  const plans =
    planSegment === "individual"
      ? allPlans.filter((p) => p.tier === "FREE" || p.tier === "SOLO")
      : allPlans.filter((p) => p.tier === "TEAM" || p.tier === "BROKERAGE");

  return (
    <div className="min-h-screen" style={{ background: 'var(--page-bg)' }}>
      {/* Nav - Dark glass style */}
      <nav className="border-b border-border glass sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between px-6 max-w-6xl mx-auto">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-lg text-foreground"
          >
            <Building2 className="h-7 w-7 text-foreground" />
            <span>InfographicAI</span>
          </Link>
          <div className="flex items-center gap-8">
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

      {/* Header - Segment Toggle */}
      <section className="container px-6 pt-10 pb-6 text-center max-w-6xl mx-auto">
        <div className="flex justify-center mb-6">
          <div className="inline-flex rounded-full glass border border-border p-1">
            <button
              type="button"
              onClick={() => setPlanSegment("individual")}
              className={`rounded-full px-6 py-2.5 text-sm font-medium transition-all ${
                planSegment === "individual"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Individual
            </button>
            <button
              type="button"
              onClick={() => setPlanSegment("enterprise")}
              className={`rounded-full px-6 py-2.5 text-sm font-medium transition-all ${
                planSegment === "enterprise"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Enterprise
            </button>
          </div>
        </div>

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
              <strong>Solo ₹2,999/mo</strong>, <strong>Team ₹6,999/mo</strong>, or annual equivalent). If you only see ₹1 or wrong recurring text, check Dashboard plan amounts and <code className="bg-muted px-1 rounded text-xs">RAZORPAY_PLAN_*</code> in <code className="bg-muted px-1 rounded text-xs">.env</code>.
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
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrentPlan = currentPlan === plan.tier;
            const isPlanLoading = loadingPlan === plan.tier;
            const PlanIcon = plan.icon;
            const leadIn = featureLeadIn[plan.tier];
            const showAnnualToggle = plan.price > 0;
            /** Paid current tier: reflect API billing period (annual vs monthly), not local toggle. */
            const isPaidCurrentCard =
              isCurrentPlan && showAnnualToggle && subscription != null;
            const isAnnual = isPaidCurrentCard
              ? subscriptionBillingIsAnnual(subscription as { billingPeriod?: string })
              : annualToggles[plan.tier] || false;
            const annualSwitchLocked = isPaidCurrentCard;

            const displayPrice = isAnnual
              ? Math.round(calculateAnnualPrice(plan.price) / 12)
              : plan.price;

            const savings = calculateMonthlySavings(plan.price);
            const annualTotalInr = calculateAnnualPrice(plan.price);
            const subscriptionAmountInr =
              subscription?.amount != null
                ? Math.round(Number(subscription.amount) / 100)
                : null;

            return (
              <div
                key={plan.tier}
                className="glass rounded-2xl border border-border p-8 flex flex-col"
              >
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
                  {isPaidCurrentCard &&
                  subscriptionAmountInr != null &&
                  subscriptionAmountInr > 0 ? (
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="text-4xl font-bold text-foreground">
                          {selectedCurrency === "INR" ? "₹" : "$"}
                          {selectedCurrency === "INR"
                            ? subscriptionAmountInr.toLocaleString()
                            : Math.round(subscriptionAmountInr / 83).toLocaleString()}
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
                          ≈{" "}
                          {selectedCurrency === "INR" ? "₹" : "$"}
                          {selectedCurrency === "INR"
                            ? Math.round(subscriptionAmountInr / 12).toLocaleString()
                            : Math.round(subscriptionAmountInr / 12 / 83).toLocaleString()}
                          /mo equivalent
                        </p>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="text-4xl font-bold text-foreground">
                          {selectedCurrency === "INR" ? "₹" : "$"}
                          {selectedCurrency === "INR"
                            ? displayPrice.toLocaleString()
                            : Math.round(displayPrice / 83).toLocaleString()}
                        </span>
                        <span className="text-base text-muted-foreground">
                          {isAnnual && plan.price > 0 ? "/ month equiv." : "/ month"}
                        </span>
                        {isAnnual && plan.price > 0 && (
                          <span className="text-sm text-teal-400 font-medium bg-teal-400/10 px-2 py-0.5 rounded-full">
                            Save{" "}
                            {selectedCurrency === "INR" ? "₹" : "$"}
                            {selectedCurrency === "INR"
                              ? savings.toLocaleString()
                              : Math.round(savings / 83).toLocaleString()}
                          </span>
                        )}
                      </div>
                      {isAnnual && plan.price > 0 && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Billed annually at{" "}
                          {selectedCurrency === "INR" ? "₹" : "$"}
                          {selectedCurrency === "INR"
                            ? annualTotalInr.toLocaleString()
                            : Math.round(annualTotalInr / 83).toLocaleString()}
                          /year (15% off vs monthly×12)
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
                <Button
                  className={`w-full h-12 rounded-full font-medium ${
                    isCurrentPlan
                      ? "bg-accent text-muted-foreground"
                      : "bg-primary hover:bg-primary/90 text-primary-foreground"
                  }`}
                  disabled={isCurrentPlan || isPlanLoading}
                  onClick={() => handleSubscribe(plan.tier)}
                >
                  {isPlanLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : isCurrentPlan ? (
                    "Current Plan"
                  ) : (
                    "Try InfographicAI"
                  )}
                </Button>
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
              Curious about InfographicAI?
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
            on InfographicAI today.
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
                className="flex items-center gap-2 font-bold text-xl text-white mb-4"
              >
                <Building2 className="h-6 w-6" />
                <span>InfographicAI</span>
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
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">COPYRIGHT InfographicAI 2025</p>
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
