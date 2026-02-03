import { useState } from "react";
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
} from "lucide-react";

type PlanSegment = "individual" | "enterprise";

const planDescriptions: Record<string, string> = {
  FREE: "Get started with essential features at no cost",
  SOLO: "Perfect for individual agents",
  TEAM: "Built for real estate teams and brands",
  BROKERAGE: "For brokerages with white-label needs",
};

import { useToast } from "@/hooks/use-toast";
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
      "Free plans include PNG downloads. Paid plans include PDF export. All images are high-resolution and optimized for social media and print.",
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
  const { toast } = useToast();
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

  const currentPlan = subscriptionData?.subscription?.planTier || "FREE";

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
      } else if (data.shortUrl) {
        window.open(data.shortUrl, "_blank");
      } else {
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
      toast({
        title: "Subscription Error",
        description: error.message || "Failed to create subscription",
        variant: "destructive",
      });
    },
  });

  const openRazorpayCheckout = (data: any) => {
    if (typeof window.Razorpay === "undefined") {
      toast({
        title: "Payment Error",
        description: "Payment system is loading. Please try again in a moment.",
        variant: "destructive",
      });
      return;
    }

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      subscription_id: data.providerSubscription?.id,
      name: "InfographicAI",
      description: `${data.subscription?.planTier} Plan Subscription`,
      handler: async (response: any) => {
        try {
          await paymentsApi.verifyPayment({
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySubscriptionId: response.razorpay_subscription_id,
            razorpaySignature: response.razorpay_signature,
          });

          toast({
            title: "Payment Successful",
            description: "Your subscription is now active!",
          });

          queryClient.invalidateQueries({
            queryKey: ["/api/v1/payments/subscription"],
          });
          setLocation("/templates");
        } catch (error: any) {
          toast({
            title: "Verification Failed",
            description: error.message || "Payment verification failed",
            variant: "destructive",
          });
        }
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

  const handleSubscribe = async (planTier: PlanTier) => {
    if (planTier === "FREE") {
      setLocation("/auth");
      return;
    }

    if (!localStorage.getItem("auth_token")) {
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

  const plans =
    planSegment === "individual"
      ? allPlans.filter((p) => p.tier === "FREE" || p.tier === "SOLO" || p.tier === "TEAM")
      : allPlans.filter((p) => p.tier === "TEAM" || p.tier === "BROKERAGE");

  return (
    <div className="min-h-screen bg-[#f5f5f0]">
      {/* Nav - Emergent-style */}
      <nav className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between px-6 max-w-6xl mx-auto">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-lg text-black"
          >
            <Building2 className="h-7 w-7 text-black" />
            <span>InfographicAI</span>
          </Link>
          <div className="flex items-center gap-8">
            <a
              href="/#features"
              className="text-sm font-medium text-gray-600 hover:text-black"
            >
              Features
            </a>
            <a
              href="/pricing"
              className="text-sm font-medium text-black"
            >
              Pricing
            </a>
            <a
              href="/#faqs"
              className="text-sm font-medium text-gray-600 hover:text-black"
            >
              FAQs
            </a>
            <a
              href="#enterprise"
              className="text-sm font-medium text-gray-600 hover:text-black"
            >
              Enterprise
            </a>
            <Link href="/auth">
              <Button
                className="gap-2 bg-black hover:bg-gray-800 text-white rounded-full font-medium px-5"
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
          <div className="inline-flex rounded-full bg-gray-200 p-1">
            <button
              type="button"
              onClick={() => setPlanSegment("individual")}
              className={`rounded-full px-6 py-2.5 text-sm font-medium transition-all ${
                planSegment === "individual"
                  ? "bg-white text-black shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Individual
            </button>
            <button
              type="button"
              onClick={() => setPlanSegment("enterprise")}
              className={`rounded-full px-6 py-2.5 text-sm font-medium transition-all ${
                planSegment === "enterprise"
                  ? "bg-white text-black shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Enterprise
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Cards - Emergent-style with per-card Annual toggle */}
      <section className="container px-6 pb-20 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrentPlan = currentPlan === plan.tier;
            const isPlanLoading = loadingPlan === plan.tier;
            const PlanIcon = plan.icon;
            const leadIn = featureLeadIn[plan.tier];
            const isAnnual = annualToggles[plan.tier] || false;
            const showAnnualToggle = plan.price > 0;

            const displayPrice = isAnnual
              ? Math.round(calculateAnnualPrice(plan.price) / 12)
              : plan.price;

            const savings = calculateMonthlySavings(plan.price);

            return (
              <div
                key={plan.tier}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col"
              >
                {/* Header with Annual Toggle */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-black">{plan.name}</h3>
                    <PlanIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  {showAnnualToggle && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 font-medium">Annual</span>
                      <Switch
                        checked={isAnnual}
                        onCheckedChange={() => toggleAnnual(plan.tier)}
                        className="data-[state=checked]:bg-blue-600 border-2"
                      />
                    </div>
                  )}
                </div>

                <p className="text-sm text-gray-500 mb-6">
                  {planDescriptions[plan.tier]}
                </p>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-black">
                      {selectedCurrency === "INR" ? "₹" : "$"}
                      {selectedCurrency === "INR"
                        ? displayPrice.toLocaleString()
                        : Math.round(displayPrice / 83).toLocaleString()}
                    </span>
                    <span className="text-base text-gray-500">/ month</span>
                    {isAnnual && plan.price > 0 && (
                      <span className="text-sm text-teal-600 font-medium bg-teal-50 px-2 py-0.5 rounded-full">
                        Save{" "}
                        {selectedCurrency === "INR" ? "₹" : "$"}
                        {selectedCurrency === "INR"
                          ? savings.toLocaleString()
                          : Math.round(savings / 83).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Features */}
                {leadIn && (
                  <p className="text-sm text-gray-500 mb-3">{leadIn}</p>
                )}
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm text-gray-700"
                    >
                      <Check className="h-4 w-4 text-black shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Button
                  className="w-full h-12 bg-black hover:bg-gray-800 text-white rounded-full font-medium"
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
      <section className="relative bg-[#0a0a0a] py-20 overflow-hidden">
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
            <h2 className="text-2xl md:text-4xl font-bold text-white">
              Curious about InfographicAI?
            </h2>
            <p className="text-xl md:text-2xl font-bold text-white">
              We got you covered
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`faq-${index}`}
                className="bg-white/5 rounded-xl border border-white/10 px-6 overflow-hidden"
              >
                <AccordionTrigger className="text-left text-white hover:no-underline py-5 text-base font-medium">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-400 pb-5 text-sm leading-relaxed">
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
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#f5f5f0] to-transparent" />
      </section>

      {/* Footer */}
      <footer className="bg-[#f5f5f0] border-t border-gray-200 py-16">
        <div className="container px-6 max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <Link
                href="/"
                className="flex items-center gap-2 font-bold text-xl text-black mb-4"
              >
                <Building2 className="h-6 w-6" />
                <span>InfographicAI</span>
              </Link>
              <p className="text-sm text-gray-600 leading-relaxed">
                Create stunning property infographics for your listings.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-black mb-4">Product</h4>
              <ul className="space-y-3 text-sm text-gray-600">
                <li>
                  <Link href="/templates" className="hover:text-black">
                    Templates
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-black">
                    Pricing
                  </Link>
                </li>
                <li>
                  <a href="#" className="hover:text-black">
                    Integrations
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-black mb-4">Solutions</h4>
              <ul className="space-y-3 text-sm text-gray-600">
                <li>
                  <a href="#" className="hover:text-black">
                    For Agents
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-black">
                    For Teams
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-black">
                    For Brokerages
                  </a>
                </li>
                <li>
                  <a href="#enterprise" className="hover:text-black">
                    Enterprise
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-black mb-4">Resources</h4>
              <ul className="space-y-3 text-sm text-gray-600">
                <li>
                  <a href="#" className="hover:text-black">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-black">
                    Tutorials
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-black">
                    Blog
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-black mb-4">Company</h4>
              <ul className="space-y-3 text-sm text-gray-600">
                <li>
                  <a href="#" className="hover:text-black">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-black">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="/terms" className="hover:text-black">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="/privacy" className="hover:text-black">
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">COPYRIGHT InfographicAI 2025</p>
            <p className="text-sm text-gray-500">
              DESIGNED FOR REAL ESTATE PROFESSIONALS
            </p>
            <div className="flex items-center gap-4">
              <a
                href="#"
                className="text-gray-500 hover:text-black transition-colors"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-gray-500 hover:text-black transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-gray-500 hover:text-black transition-colors"
              >
                <Youtube className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-gray-500 hover:text-black transition-colors"
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
