import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Building2, 
  Check,
  ArrowRight,
  Gift,
  Info,
  Star,
  Building,
  Loader2,
  X,
  ChevronRight
} from "lucide-react";

type PlanSegment = "individual" | "teams";

const planDescriptions: Record<string, string> = {
  FREE: "Get started with essential property infographics at no cost.",
  SOLO: "Perfect for agents and small teams listing properties.",
  TEAM: "Built for real estate teams sharing listings and branding.",
  BROKERAGE: "For brokerages and large teams with white-label needs.",
};
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient, redirectToLogin } from "@/lib/queryClient";
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
  SOLO: Info,
  TEAM: Star,
  BROKERAGE: Building,
  API_STARTER: Building,
  API_GROWTH: Building,
  API_ENTERPRISE: Building,
};

const featureLeadIn: Record<string, string> = {
  SOLO: "Everything in Free, plus:",
  TEAM: "Everything in Solo, plus:",
  BROKERAGE: "Everything in Team, plus:",
};

const faqs = [
  {
    question: "What AI models do you use?",
    answer: "We use OpenAI's GPT-5 for property analysis and headline generation, and Ideogram's latest models for image generation. This combination delivers the highest quality results.",
  },
  {
    question: "How long does generation take?",
    answer: "Most infographics are generated in 15-20 seconds. GPT-5 analyzes your property in 2-3 seconds, then Ideogram creates the visual in 10-12 seconds.",
  },
  {
    question: "Can I customize the branding?",
    answer: "Yes! Solo and higher plans include brand color customization. Team and Brokerage plans include full custom branding with your logo.",
  },
  {
    question: "What formats can I download?",
    answer: "Free plans include PNG downloads. Paid plans include PDF export. All images are high-resolution and optimized for social media and print.",
  },
  {
    question: "Do unused credits roll over?",
    answer: "Credits do not roll over between months. We recommend choosing a plan that matches your typical monthly listing volume.",
  },
  {
    question: "Can I cancel anytime?",
    answer: "Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.",
  },
];

export default function PricingPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<'INR' | 'USD'>('INR');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [planSegment, setPlanSegment] = useState<PlanSegment>("individual");

  // Fetch provider info based on selected currency
  const { data: providerInfo } = useQuery<ProviderInfo>({
    queryKey: ['/api/v1/payments/provider-info', selectedCurrency],
    queryFn: () => paymentsApi.getProviderInfo(selectedCurrency),
  });

  // Fetch current subscription if logged in (use auth_token to match apiRequest)
  const { data: subscriptionData } = useQuery({
    queryKey: ['/api/v1/payments/subscription'],
    queryFn: () => paymentsApi.getSubscription(),
    enabled: !!localStorage.getItem('auth_token'),
  });

  const currentPlan = subscriptionData?.subscription?.planTier || 'FREE';

  // Calculate annual price with 15% discount
  const calculateAnnualPrice = (monthlyPrice: number): number => {
    return Math.round(monthlyPrice * 12 * 0.85); // 15% discount
  };

  // Create subscription mutation
  const createSubscriptionMutation = useMutation({
    mutationFn: async (planTier: PlanTier) => {
      return paymentsApi.createSubscription({
        planTier,
        currency: selectedCurrency,
        region: selectedCurrency === 'INR' ? 'IN' : 'US',
        billingPeriod,
      });
    },
    onSuccess: (data) => {
      // Route to appropriate checkout based on provider
      if (data.provider === 'STRIPE' && data.checkoutUrl) {
        // Stripe Checkout - redirect to Stripe-hosted page
        window.location.href = data.checkoutUrl;
      } else if (data.shortUrl) {
        // RazorPay short URL
        window.open(data.shortUrl, '_blank');
      } else {
        // RazorPay inline checkout
        openRazorpayCheckout(data);
      }
      queryClient.invalidateQueries({ queryKey: ['/api/v1/payments/subscription'] });
    },
    onError: (error: any) => {
      const isUnauthorized =
        error?.message === "Unauthorized" ||
        (error?.response?.status === 401) ||
        (typeof error?.message === "string" && error.message.toLowerCase().includes("unauthorized"));
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
    // Check if RazorPay script is loaded
    if (typeof window.Razorpay === 'undefined') {
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
          
          queryClient.invalidateQueries({ queryKey: ['/api/v1/payments/subscription'] });
          setLocation('/templates');
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
        color: "#6366F1",
      },
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  };

  const handleSubscribe = async (planTier: PlanTier) => {
    if (planTier === 'FREE') {
      setLocation('/auth');
      return;
    }

    if (!localStorage.getItem('auth_token')) {
      redirectToLogin();
      return;
    }

    if (planTier === 'API_ENTERPRISE') {
      toast({
        title: "Contact Sales",
        description: "Please contact our sales team for Enterprise pricing.",
      });
      return;
    }

    setLoadingPlan(planTier);
    try {
      await createSubscriptionMutation.mutateAsync(planTier);
    } finally {
      setLoadingPlan(null);
    }
  };

  const allPlans = Object.entries(PLAN_CONFIG)
    .filter(([tier]) => !tier.startsWith('API_'))
    .map(([tier, config]) => ({
      tier: tier as PlanTier,
      ...config,
      icon: planIcons[tier] ?? Gift,
    }));

  const plans =
    planSegment === "individual"
      ? allPlans.filter((p) => p.tier === "FREE" || p.tier === "SOLO")
      : allPlans.filter((p) => p.tier === "TEAM" || p.tier === "BROKERAGE");

  const comparisonPlans =
    planSegment === "individual"
      ? (["FREE", "SOLO"] as const)
      : (["TEAM", "BROKERAGE"] as const);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav - Emergent-style: white bar, Features, Pricing, FAQs, Enterprise, Get Started */}
      <nav className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between px-6 max-w-6xl mx-auto">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-black">
            <Building2 className="h-7 w-7 text-black" />
            <span>InfographicAI</span>
          </Link>
          <div className="flex items-center gap-8">
            <a href="/#features" className="text-sm font-medium text-gray-600 hover:text-black">Features</a>
            <Link href="/pricing" className="text-sm font-medium text-black">Pricing</Link>
            <a href="/#faqs" className="text-sm font-medium text-gray-600 hover:text-black">FAQs</a>
            <a href="#enterprise" className="text-sm font-medium text-gray-600 hover:text-black">Enterprise</a>
            <Link href="/auth">
              <Button data-testid="link-signup" className="gap-2 bg-black hover:bg-gray-800 text-white rounded-lg font-medium">
                Get Started <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Header - Emergent-style: pill toggle + currency/billing */}
      <section className="container px-6 pt-10 pb-6 text-center max-w-6xl mx-auto">
        {/* Plan segment: pill toggle (Emergent-style) */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex rounded-full bg-gray-200 p-1">
            <button
              type="button"
              onClick={() => setPlanSegment("individual")}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
                planSegment === "individual"
                  ? "bg-white text-black shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              data-testid="toggle-individual"
            >
              Individual
            </button>
            <button
              type="button"
              onClick={() => setPlanSegment("teams")}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
                planSegment === "teams"
                  ? "bg-white text-black shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              data-testid="toggle-teams"
            >
              Teams & Enterprise
            </button>
          </div>
        </div>
        {/* Currency & Billing - compact row */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className={selectedCurrency === 'INR' ? 'font-medium text-black' : 'text-gray-500'}>INR</span>
            <button
              type="button"
              onClick={() => setSelectedCurrency(selectedCurrency === 'INR' ? 'USD' : 'INR')}
              className="rounded-md border border-gray-300 bg-white px-2 py-1 text-gray-700 hover:bg-gray-50"
              data-testid="button-currency-toggle"
            >
              {selectedCurrency}
            </button>
            <span className={selectedCurrency === 'USD' ? 'font-medium text-black' : 'text-gray-500'}>USD</span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-gray-200 p-1">
            <button
              type="button"
              onClick={() => setBillingPeriod('monthly')}
              className={`rounded-full px-3 py-1 text-sm ${billingPeriod === 'monthly' ? 'bg-white text-black shadow-sm' : 'text-gray-500'}`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingPeriod('annual')}
              className={`rounded-full px-3 py-1 text-sm ${billingPeriod === 'annual' ? 'bg-white text-black shadow-sm' : 'text-gray-500'}`}
            >
              Annual <span className="text-xs text-green-600 font-medium">(Save 15%)</span>
            </button>
          </div>
          {providerInfo?.stripeEnabled && selectedCurrency === 'USD' && (
            <span className="text-gray-500 text-xs">Powered by Stripe</span>
          )}
          {selectedCurrency === 'INR' && (
            <span className="text-gray-500 text-xs">Powered by Razorpay</span>
          )}
        </div>
      </section>

      {/* Pricing Cards - Emergent-style: 3 columns, white cards, rounded-2xl */}
      <section className="container px-6 pb-20 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const isCurrentPlan = currentPlan === plan.tier;
            const isPlanLoading = loadingPlan === plan.tier;
            const PlanIcon = plan.icon;
            const leadIn = featureLeadIn[plan.tier];
            return (
              <div
                key={plan.tier}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col"
                data-testid={`card-plan-${plan.tier.toLowerCase()}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <PlanIcon className="h-5 w-5 text-black shrink-0" />
                  <h3 className="text-xl font-bold text-black">{plan.name}</h3>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  {planDescriptions[plan.tier] ?? (plan.limit === -1 ? "Unlimited" : `${plan.limit} infographics/month`)}
                </p>
                <div className="mb-4">
                  {plan.price === 0 ? (
                    <p className="text-3xl font-bold text-black" data-testid={`text-price-${plan.tier.toLowerCase()}`}>
                      ₹0 <span className="text-base font-normal text-gray-500">/month</span>
                    </p>
                  ) : (
                    <>
                      <p className="text-3xl font-bold text-black" data-testid={`text-price-${plan.tier.toLowerCase()}`}>
                        {selectedCurrency === 'INR' ? '₹' : '$'}
                        {billingPeriod === 'annual'
                          ? (selectedCurrency === 'INR'
                              ? calculateAnnualPrice(plan.price).toLocaleString()
                              : Math.round(calculateAnnualPrice(plan.price) / 83).toLocaleString())
                          : (selectedCurrency === 'INR'
                              ? plan.price.toLocaleString()
                              : Math.round(plan.price / 83).toLocaleString())}
                        <span className="text-base font-normal text-gray-500">
                          /{billingPeriod === 'annual' ? 'year' : 'month'}
                        </span>
                      </p>
                      {billingPeriod === 'annual' && plan.price > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Save {selectedCurrency === 'INR' ? '₹' : '$'}
                          {selectedCurrency === 'INR'
                            ? ((plan.price * 12) - calculateAnnualPrice(plan.price)).toLocaleString()
                            : Math.round(((plan.price * 12) - calculateAnnualPrice(plan.price)) / 83).toLocaleString()}{' '}
                          per year
                        </p>
                      )}
                    </>
                  )}
                </div>
                {leadIn && (
                  <p className="text-sm text-gray-500 mb-2">{leadIn}</p>
                )}
                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-gray-700">
                      <Check className="h-4 w-4 text-black shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full bg-black hover:bg-gray-800 text-white rounded-lg"
                  disabled={isCurrentPlan || isPlanLoading}
                  onClick={() => handleSubscribe(plan.tier)}
                  data-testid={`button-subscribe-${plan.tier.toLowerCase()}`}
                >
                  {isPlanLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : isCurrentPlan ? (
                    'Current Plan'
                  ) : plan.price === 0 ? (
                    'Try InfographicAI'
                  ) : (
                    'Try InfographicAI'
                  )}
                </Button>
              </div>
            );
          })}
          {/* Third card: teaser - Emergent-style */}
          {planSegment === "individual" ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-5 w-5 text-gray-400 shrink-0" />
                <h3 className="text-xl font-bold text-black">Team</h3>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                For real estate teams sharing listings and branding.
              </p>
              <p className="text-sm text-gray-500 mb-4 flex-1">
                Get more infographics, logo upload, and team collaboration.
              </p>
              <Button
                variant="outline"
                className="w-full rounded-lg border-black text-black hover:bg-gray-100"
                onClick={() => setPlanSegment("teams")}
              >
                See Teams & Enterprise <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col" id="enterprise">
              <div className="flex items-center gap-2 mb-2">
                <Building className="h-5 w-5 text-gray-400 shrink-0" />
                <h3 className="text-xl font-bold text-black">Enterprise</h3>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                API access, custom SLA, and dedicated support.
              </p>
              <ul className="space-y-2 mb-6 flex-1 text-sm text-gray-700">
                <li className="flex items-start gap-2"><Check className="h-4 w-4 text-black shrink-0 mt-0.5" /> Unlimited API calls</li>
                <li className="flex items-start gap-2"><Check className="h-4 w-4 text-black shrink-0 mt-0.5" /> Custom integrations</li>
                <li className="flex items-start gap-2"><Check className="h-4 w-4 text-black shrink-0 mt-0.5" /> Dedicated support</li>
              </ul>
              <Button
                className="w-full bg-black hover:bg-gray-800 text-white rounded-lg"
                onClick={() => toast({ title: "Contact Sales", description: "We'll reach out for Enterprise pricing." })}
              >
                Contact Sales
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Tier Comparison Table - Emergent-style: clean white card */}
      <section id="compare" className="container px-6 pb-16 scroll-mt-20 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8 text-black">
          Compare Plans
        </h2>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Feature</TableHead>
                  {comparisonPlans.map((tier) => (
                    <TableHead key={tier} className="text-center">
                      {PLAN_CONFIG[tier].name}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Monthly Infographics</TableCell>
                  {comparisonPlans.map((tier) => (
                    <TableCell key={tier} className="text-center">
                      {PLAN_CONFIG[tier].limit === -1 ? "Unlimited" : PLAN_CONFIG[tier].limit.toLocaleString()}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">AI Models</TableCell>
                  {comparisonPlans.map((tier) => (
                    <TableCell key={tier} className="text-center">✓</TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Custom Branding</TableCell>
                  {comparisonPlans.map((tier) => (
                    <TableCell key={tier} className="text-center">
                      {tier === "FREE" ? <X className="h-4 w-4 mx-auto text-muted-foreground" /> : "✓"}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Logo Upload</TableCell>
                  {comparisonPlans.map((tier) => (
                    <TableCell key={tier} className="text-center">
                      {tier === "FREE" || tier === "SOLO" ? <X className="h-4 w-4 mx-auto text-muted-foreground" /> : "✓"}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Support</TableCell>
                  {comparisonPlans.map((tier) => (
                    <TableCell key={tier} className="text-center">
                      {tier === "FREE" ? "Email" : tier === "SOLO" || tier === "TEAM" ? "Priority" : "Dedicated"}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Users</TableCell>
                  {comparisonPlans.map((tier) => (
                    <TableCell key={tier} className="text-center">
                      {tier === "BROKERAGE" ? "Unlimited" : tier === "TEAM" ? "5" : "1"}
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
        </div>
      </section>

      {/* API Plans / Enterprise - Emergent-style cards */}
      <section className="py-16 bg-white">
        <div className="container px-6 max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10 text-black">
            API & Enterprise
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {Object.entries(PLAN_CONFIG)
              .filter(([tier]) => tier.startsWith('API_'))
              .map(([tier, config]) => (
                <div key={tier} className="bg-gray-50 rounded-2xl border border-gray-100 p-8" data-testid={`card-plan-${tier.toLowerCase()}`}>
                  <h3 className="text-xl font-bold text-black mb-1">{config.name}</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {config.limit === -1 ? 'Unlimited API calls' : `${config.limit.toLocaleString()} API calls/month`}
                  </p>
                  <p className="text-3xl font-bold text-black mb-4" data-testid={`text-price-${tier.toLowerCase()}`}>
                    {config.price === 0 ? 'Custom' : <>₹{config.price.toLocaleString()}<span className="text-base font-normal text-gray-500">/mo</span></>}
                  </p>
                  <ul className="space-y-2 text-sm text-gray-700 mb-6">
                    {config.features.slice(0, 4).map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-black shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full bg-black hover:bg-gray-800 text-white rounded-lg"
                    onClick={() => handleSubscribe(tier as PlanTier)}
                    disabled={loadingPlan === tier}
                    data-testid={`button-subscribe-${tier.toLowerCase()}`}
                  >
                    {loadingPlan === tier ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
                    ) : config.price === 0 ? 'Contact Sales' : 'Subscribe'}
                  </Button>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* Cost Breakdown - Emergent-style */}
      <section className="py-16 bg-gray-50">
        <div className="container px-6 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8 text-black">
            What's Included in Every Property Infographic
          </h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-2xl font-bold text-black mb-1">GPT-5</p>
                <p className="text-sm text-gray-500">Property analysis & headline</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-black mb-1">Ideogram</p>
                <p className="text-sm text-gray-500">AI image generation</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-black mb-1">15 sec</p>
                <p className="text-sm text-gray-500">Total generation time</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ - Emergent-style: minimal, no heavy cards */}
      <section className="container px-6 py-16 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-10 text-black">
          Frequently Asked Questions
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          {faqs.map((faq) => (
            <div key={faq.question} className="border-b border-gray-100 pb-6 last:border-0" data-testid="card-faq">
              <h3 className="font-semibold mb-2 text-black">{faq.question}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA - Emergent-style */}
      <section className="py-16 bg-gray-50">
        <div className="container px-6 max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4 text-black">
            Ready to Get Started?
          </h2>
          <p className="text-gray-600 mb-8">
            Start with 3 free property infographics. No credit card required.
          </p>
          <Link href="/auth">
            <Button size="lg" className="gap-2 bg-black hover:bg-gray-800 text-white rounded-lg font-medium px-8" data-testid="button-cta-start">
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer - Emergent-style: Product, Company columns */}
      <footer className="border-t border-gray-200 bg-white py-16">
        <div className="container px-6 max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">Product</p>
              <div className="flex flex-col gap-3 text-sm text-gray-600">
                <Link href="/#features" className="hover:text-black">Features</Link>
                <Link href="/pricing" className="hover:text-black">Pricing</Link>
                <a href="/#faqs" className="hover:text-black">FAQs</a>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">Company</p>
              <div className="flex flex-col gap-3 text-sm text-gray-600">
                <a href="#enterprise" className="hover:text-black">Enterprise</a>
                <a href="/terms" className="hover:text-black">Terms of Service</a>
                <a href="/privacy" className="hover:text-black">Privacy Policy</a>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <Link href="/" className="flex items-center gap-2 font-bold text-black">
              <Building2 className="h-5 w-5 text-black" />
              <span>InfographicAI</span>
            </Link>
            <p className="text-sm text-gray-500">
              Powered by GPT-5 and Ideogram AI. For real estate agents and teams.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

