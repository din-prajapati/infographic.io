import { useState, useEffect, Component, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Marquee } from "@/components/ui/marquee";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Check,
  Loader2,
  Linkedin,
  Twitter,
  Youtube,
  Instagram,
  CreditCard,
  Info,
} from "lucide-react";

const PENDING_PLAN_KEY = "pending_subscription_plan";

// US-PAY-112 (visual pass, 2026-08-23) — the 5 real tiers shown on the pricing page, in display
// order. BROKERAGE is deliberately excluded here: being phased out in favor of AGENCY, no longer
// marketed on this page (existing subscribers keep it on their account, see US-PAY-102's Out of
// Scope). Enterprise is not a PLAN_CONFIG tier — no static grid card for it; it's an inline link on
// the Agency card plus the CTA banner near the bottom (design-preview-pricing.html's actual layout,
// not the old 6-card grid).
const PUBLIC_TIERS: PlanTier[] = ["FREE", "SOLO", "PRO", "TEAM", "AGENCY"];

const planDescriptions: Record<string, string> = {
  FREE: "Try Buildographic at zero cost",
  SOLO: "For individual real-estate agents",
  PRO: "For power agents & active marketers",
  TEAM: "For real-estate teams & small brokerages",
  AGENCY: "For high-volume real-estate marketing agencies",
};

interface FeatureBullet {
  title: string;
  description?: string;
  linkText?: string;
  linkHref?: string;
}

/**
 * Per-tier card feature-bullet copy, matching design-preview-pricing.html's actual bespoke
 * wording per tier (not the generic PLAN_CONFIG.features strings — those stay the entitlement
 * source of truth for the comparison table below; this is presentational-only card copy, local
 * to this page). `firstLineDetail` is the second line under the dynamic "{limit} design
 * credits / mo" title (always present, never omitted or invented per tier).
 *
 * `editor` is lifted OUT of `bullets` deliberately. It used to be the first bullet in every
 * tier's list, which buried the one capability that has its own separate allowance — opening a
 * design in the editor spends an editable credit, not a design credit. Rendering it as its own
 * highlighted row directly under the design-credit count puts the two meters side by side, in
 * the order a customer actually uses them: generate, then edit.
 *
 * One deliberate change from the mockup: the mockup's SOLO card claims "PDF, JPG & PNG Export" —
 * that contradicts this same page's own FAQ ("PDF export is coming soon"). Kept the FAQ's real
 * product state authoritative and rephrased that one bullet rather than copying the mockup's
 * unverified claim verbatim.
 */
type PublicTier = "FREE" | "SOLO" | "PRO" | "TEAM" | "AGENCY";

const planFeatureBullets: Record<
  PublicTier,
  { firstLineDetail: string; editor: FeatureBullet; bullets: FeatureBullet[] }
> = {
  FREE: {
    firstLineDetail: "Real-estate template catalog.",
    editor: { title: "Multi-layer Canvas Editor Trial", linkText: "Explore editor →", linkHref: "#what-is-design" },
    bullets: [
      { title: "Instagram & WhatsApp formats", description: "1:1 Square & 9:16 Story sizes." },
      { title: "JPG / PNG high-res export", description: "Clean downloads with no watermarks." },
    ],
  },
  SOLO: {
    firstLineDetail: "All real-estate templates & styles.",
    editor: { title: "Multi-layer Canvas Editor Included", linkText: "Edit text, colors, shapes & photos →", linkHref: "#capabilities" },
    bullets: [
      { title: "Custom Brand Setup", description: "Agency logo, brand colors & agent headshot." },
      { title: "JPG & PNG Export", description: "High-resolution, social-ready downloads." },
    ],
  },
  PRO: {
    firstLineDetail: "Priority generation render queue.",
    editor: { title: "Multi-layer Canvas Editor Included", linkText: "Full multi-layer customization →", linkHref: "#capabilities" },
    bullets: [
      { title: "Custom Brand Setup & Presets", description: "Logos, color palettes & agent branding." },
      { title: "All Real Estate Templates & Sizes", description: "Listings, open house, price drops & flyers." },
      { title: "Usage Dashboard & Priority Support", linkText: "Compare all features →", linkHref: "#comparison" },
    ],
  },
  TEAM: {
    firstLineDetail: "High volume creative pipeline.",
    editor: { title: "Multi-layer Canvas Editor Included", linkText: "Full multi-layer customization →", linkHref: "#capabilities" },
    bullets: [
      { title: "Organization Asset Storage", description: "Centralized logo, photos & design library." },
      { title: "Priority Support & Fast Renders", description: "Expedited generation processing." },
    ],
  },
  AGENCY: {
    firstLineDetail: "Agency-scale generation capacity.",
    editor: { title: "Multi-layer Canvas Editor Included", linkText: "Full multi-layer customization →", linkHref: "#capabilities" },
    bullets: [
      { title: "Multi-Property Asset Organization", description: "Organize designs by property listing and style." },
      { title: "Dedicated Account Assistance", description: "Priority customer support & onboarding." },
    ],
  },
};

import { toast } from "sonner";
import { queryClient, redirectToLogin } from "@/lib/queryClient";
import { paymentsApi, pricingApi, type ProviderInfo, type EffectivePriceResult } from "@/lib/api";
import { PLAN_CONFIG, getAnnualSavings, type PlanTier } from "@shared/schema";

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

export interface ComparisonRow {
  feature: string;
  presence: boolean[]; // one entry per plan, same order as the input array
}

/**
 * Builds the full feature-matrix comparison table rows for US-PAY-113 AC2 — the union of every
 * distinct feature string across all plans, in first-seen order, with a per-plan checkmark. Reads
 * only the same `features` arrays already rendered on the cards above (real PLAN_CONFIG tiers) —
 * never invents a capability that isn't already data-backed.
 * Exported (not inlined in JSX) so a test can assert the union/ordering/presence logic directly,
 * same pattern as computePricingCardDisplay() and getTestModeBannerAmounts().
 */
export function buildComparisonRows(
  comparisonPlans: Array<{ features: string[] }>,
): ComparisonRow[] {
  const seen: string[] = [];
  for (const plan of comparisonPlans) {
    for (const feature of plan.features) {
      if (!seen.includes(feature)) seen.push(feature);
    }
  }
  return seen.map((feature) => ({
    feature,
    presence: comparisonPlans.map((p) => p.features.includes(feature)),
  }));
}

/**
 * US-PAY-113 AC2 — the comparison table is a sibling section below the pricing cards, not a
 * dependency of them. This boundary makes that explicit: a render failure here fails silently
 * (renders nothing) rather than taking the rest of the page down, so the cards above always keep
 * working standalone.
 */
class ComparisonSectionBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error) {
    console.error("Pricing comparison table failed to render:", error);
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

declare global {
  interface Window {
    Razorpay: any;
    Stripe: any;
  }
}

const faqs = [
  {
    question: "How does the free plan work?",
    answer:
      "The Free plan gives you 3 AI marketing designs every month at zero cost. No credit card or payment details are needed. You can generate real-estate templates and download high-resolution PNG/JPG files.",
  },
  {
    question: "How fast can I create a design?",
    answer:
      "Most designs are ready in 15-20 seconds. Enter your listing details, pick a template, and the system generates the visual automatically.",
  },
  {
    question: "What is an Editable Design?",
    answer:
      "An Editable Design unlocks our multi-layer Canvas editor. You can customize text, replace agent photos, adjust badges, and apply your own brand palette directly in your browser instead of accepting a static image.",
  },
  {
    question: "Can I change my plan later?",
    answer:
      "Yes, you can upgrade, switch billing cycles (monthly/yearly), or modify your subscription from your account dashboard at any time.",
  },
  {
    question: "Do unused designs roll over?",
    answer:
      "Designs don't roll over between months. We recommend choosing a plan that matches your typical monthly listing volume — you can always upgrade later.",
  },
  {
    question: "What formats can I download?",
    answer:
      "All plans include high-resolution PNG and JPG downloads, optimized for social media and print-ready sizing. PDF export is coming soon.",
  },
];

// "What is an AI Marketing Design?" — 8 illustrative examples of real output categories. Pure
// presentational content (no PLAN_CONFIG/backend data), matching design-preview-pricing.html.
const designExamples = [
  { tag: "1:1 Square", title: "Luxury Villa 4 BHK", label: "Property Listing", note: "Full showcase with specs" },
  { tag: "9:16 Story", title: "Swipe Up For Tour", label: "Instagram Story", note: "High-converting social visual" },
  { tag: "Direct Chat", title: "WhatsApp Brochure", label: "WhatsApp Creative", note: "Ready-to-broadcast flyer" },
  { tag: "Event Invite", title: "Open House Showcase", label: "Open House Flyer", note: "Event date & map specs" },
  { tag: "Price Drop", title: "Revised Pricing Alert", label: "Price Update Alert", note: "Urgency & revised pricing", accent: true },
  { tag: "Icon Grid", title: "Clubhouse & Pool", label: "Amenities Breakdown", note: "Visual amenity icons" },
  { tag: "Transit Map", title: "Metro & Commute", label: "Location Advantage", note: "Distance & transit times" },
  { tag: "Festive Offer", title: "Seasonal Booking", label: "Festival Campaign", note: "Holiday & seasonal offers", accent: true },
];

// Platform Capabilities — 3 real, already-shipped capabilities (AI generation, the multi-layer
// Canvas editor from EPIC-EDIT-03, and multi-format templates). Copy kept to what's confirmed real
// rather than the mockup's unverified specifics (e.g. no A4/16:9 claim unless confirmed elsewhere).
const capabilities = [
  {
    eyebrow: "01 / Creation",
    title: "AI Marketing Designs",
    description:
      "Turn property details, pricing, specs and photos into ready-to-publish real-estate marketing creatives for Instagram, WhatsApp and listing portals.",
    footer: "High-res JPG & PNG export →",
  },
  {
    eyebrow: "02 / Customization",
    title: "Editable Canvas",
    description:
      "Turn generated designs into editable, layered creatives. Update copy, images, branding and layout directly in the browser.",
    footer: "Full multi-layer control →",
  },
  {
    eyebrow: "03 / Multi-Format",
    title: "Marketing Templates",
    description:
      "Choose from real-estate-ready formats, including Square posts (1:1) and vertical Stories (9:16), across the full template catalog.",
    footer: "All formats included →",
  },
];

const marqueeTags = [
  "📸 Instagram Post & Story",
  "💬 WhatsApp Broadcasts",
  "🏡 Open House Flyers",
  "🏷️ Price Drop Alerts",
  "🏊 Amenities & Floorplans",
  "📍 Location Advantage",
  "🎉 Festival Campaigns",
];

/** Paid tiers sold on this page -- the set the annual badge must be true for. */
const PUBLIC_PAID_TIERS: PlanTier[] = ['SOLO', 'PRO', 'TEAM', 'AGENCY'];

/**
 * The annual-saving percentage shown on the Yearly toggle.
 *
 * Derived from the authored monthly/annual prices rather than written by hand, so
 * the badge can never disagree with the prices on the cards below it. Returns null
 * unless EVERY publicly-sold paid tier shares the same percentage -- a single claim
 * covering tiers that disagree would be false for at least one of them, and the
 * honest response is to show no badge rather than a wrong one.
 */
function computeAnnualSavingsPercent(): number | null {
  const percents = PUBLIC_PAID_TIERS.map((t) => getAnnualSavings(t)?.percent).filter(
    (p): p is number => typeof p === 'number',
  );
  if (percents.length !== PUBLIC_PAID_TIERS.length) return null;
  return percents.every((p) => p === percents[0]) ? percents[0] : null;
}

export default function PricingPage() {
  const isBetaMode = import.meta.env.VITE_BETA_MODE === 'true';

  const [, setLocation] = useLocation();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [isSyncingStatus, setIsSyncingStatus] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<"INR" | "USD">("INR");

  // Single global Monthly/Yearly toggle (design-preview-pricing.html) — replaces the old per-card
  // toggle. The one real exception, a card showing the user's *actual current subscription's*
  // billing period, is still handled per-card below via isPaidCurrentCard/subscriptionBillingIsAnnual.
  const [isAnnualGlobal, setIsAnnualGlobal] = useState(false);
  const annualSavingsPercent = computeAnnualSavingsPercent();

  // US-PAY-112 AC1/AC3 — the only source for regularPrice/effectivePrice/campaignId/badge.
  // Public endpoint, no auth needed. Never recompute a discounted price client-side.
  const { data: pricingData } = useQuery({
    queryKey: ["/api/v1/pricing"],
    queryFn: () => pricingApi.getPricing(),
  });

  const pricingByTier = new Map<PlanTier, { monthly: EffectivePriceResult; annual: EffectivePriceResult }>(
    (pricingData?.plans ?? []).map((p) => [p.tier, { monthly: p.monthly, annual: p.annual }]),
  );

  // Fetch provider info based on selected currency. USD is not really billable today (no USD field
  // on PLAN_CONFIG/EffectivePriceResult, and the one live USD checkout path would charge the same
  // rupee number relabeled as dollars) — so the currency toggle's USD option is gated entirely by
  // this server-returned flag (stripeEnabled), not a frontend constant. When it flips true (real
  // Razorpay/Stripe USD billing for global customers confirmed), the toggle appears with zero
  // frontend redeploy needed.
  const { data: providerInfo } = useQuery<ProviderInfo>({
    queryKey: ["/api/v1/payments/provider-info", selectedCurrency],
    queryFn: () => paymentsApi.getProviderInfo(selectedCurrency),
  });
  const usdBillingEnabled = providerInfo?.stripeEnabled === true;

  // Fetch plan availability — gate tiers without a configured plan ID (AC2 US-LAUNCH-007)
  const { data: plansData } = useQuery({
    queryKey: ["/api/v1/payments/plans"],
    queryFn: () => paymentsApi.getPlans(),
  });

  // Set of plan tiers that are paid but NOT yet configured with a payment-provider plan ID.
  // Driven by the backend "configured" flag — not hardcoded to any specific tier.
  //
  // PRO is deliberately excluded from this gate at the CTA render site below (2026-08-23, per
  // explicit user direction) even though its Razorpay Plan IDs aren't in .env yet (HUMAN_TASKS #6,
  // US-PAY-109 T0) — real Plan objects are expected "in a couple of days." Clicking "Choose Pro"
  // before then will attempt a real checkout against an unconfigured plan and can fail server-side.
  // AGENCY (and any other unconfigured tier) still gets the safe "Contact us" fallback.
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
  const isLoggedIn = !!localStorage.getItem("auth_token");
  // ACTIVE/PAST_DUE/HALTED/PAUSED = confirmed current plan. PENDING handled separately below.
  // Anonymous visitors have no "current plan" at all — only a logged-in user without an
  // active paid subscription defaults to FREE. Without this gate every anonymous visitor
  // saw the Free card rendered as a disabled "Current Plan", never "Get started free".
  const currentPlan: PlanTier | "FREE" | null = !isLoggedIn
    ? null
    : subscription &&
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
        color: "#eb5e28",
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
      if (isAnnual) setIsAnnualGlobal(true);
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
        JSON.stringify({ planTier, isAnnual: isAnnualGlobal }),
      );
      redirectToLogin();
      return;
    }

    setLoadingPlan(planTier);
    try {
      await createSubscriptionMutation.mutateAsync({
        planTier,
        isAnnual: isAnnualGlobal,
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  // US-PAY-112 AC1 — Free/Solo/Pro/Team/Agency render together (replaces the old Individual/
  // Enterprise segment toggle, which never showed PRO/AGENCY at all). No static Enterprise card —
  // see the PUBLIC_TIERS comment above. Non-price fields (name, features, allowances) still come
  // from PLAN_CONFIG — only price itself is server-resolved (AC3).
  const realPlans = PUBLIC_TIERS.map((tier) => {
    const config = PLAN_CONFIG[tier];
    const pricing = pricingByTier.get(tier);
    return {
      tier,
      name: config.name,
      features: config.features,
      designLimit: config.limit,
      editableLimit: config.editableLimit,
      // -1 = unlimited seats. Drives the shared-pool line below: it only needs saying on a
      // tier that can actually have more than one person in it.
      userLimit: config.userLimit,
      monthly: pricing?.monthly,
      annual: pricing?.annual,
    };
  });

  // US-PAY-113 AC2 — full feature-matrix comparison, gated behind an env flag (defaults on) so it
  // can be turned off independently of the cards above, and rendered inside a local error
  // boundary so a failure here never takes the cards with it.
  const comparisonTableEnabled = import.meta.env.VITE_PRICING_COMPARISON_ENABLED !== "false";
  // Skip each plan's first feature string (the "X AI Marketing Designs/month" count) — it's already shown,
  // correctly, as the numeric "AI Marketing Designs / mo" row above. Left in, it produces a sparse,
  // confusing row per tier (each tier's own count string only checks true for itself) that restates
  // the same number rather than comparing anything.
  const comparisonRows = buildComparisonRows(realPlans.map((p) => ({ features: p.features.slice(1) })));
  // Re-groups buildComparisonRows()'s flat output into the mockup's 3-category layout — pure
  // reorganization of the same real PLAN_CONFIG-backed rows, no new claims added. Explicit
  // allow-lists (not a generic bucket-by-guess) so a feature never lands in the wrong category
  // silently.
  const templateAccessRows = comparisonRows.filter((r) => ["Basic templates", "All templates"].includes(r.feature));
  const editableAccessRows = comparisonRows.filter((r) => ["Editable designs (1 trial)", "Editable designs"].includes(r.feature));
  const brandingRows = comparisonRows.filter((r) => r.feature === "Custom branding");
  const platformRows = comparisonRows.filter((r) =>
    ["Priority support", "Team collaboration", "5 users", "Advanced analytics", "Unlimited users"].includes(r.feature),
  );

  // Check + label rendered together, colored per column (PRO gets the brand-orange accent, every
  // other "true" cell gets the dark text color) — the "visually appealing" tick+text treatment
  // from the mockup, applied only to rows this table already carries (real PLAN_CONFIG-backed
  // capabilities), not new unbacked claims.
  const renderComparisonRow = (row: ComparisonRow, trueLabel: string = "Included") => (
    <tr key={row.feature}>
      <td className="p-4 px-5 font-semibold text-[#1e1c1a]">{row.feature}</td>
      {row.presence.map((has, i) => {
        const isPro = realPlans[i].tier === "PRO";
        return (
          <td
            key={realPlans[i].tier}
            className={`p-4 text-center ${isPro ? "bg-[#fff5ee]/40 border-x border-[#eb5e28]/20" : ""}`}
          >
            {has ? (
              <span
                className={`inline-flex items-center gap-1 font-semibold whitespace-nowrap ${
                  isPro ? "text-[#eb5e28]" : "text-[#1e1c1a]"
                }`}
              >
                <Check className="h-3.5 w-3.5 shrink-0" /> {trueLabel}
              </span>
            ) : (
              <span className="text-[#8c8780]/50">–</span>
            )}
          </td>
        );
      })}
    </tr>
  );

  return (
    <div
      className="min-h-screen bg-white text-[#1e1c1a]"
      style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
    >
      {/* ── NAV ─────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-[#e6e3dd]">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[8px] bg-[#2a2825] flex items-center justify-center text-white shadow-sm shrink-0">
              <img src="/logo-icon-option6-light.png" alt="" className="h-4 w-4" />
            </div>
            <span className="font-bold text-base tracking-tight text-[#1e1c1a]">Buildographic</span>
          </Link>

          <div className="hidden md:flex items-center gap-1 text-sm font-medium text-[#68645e]">
            <a href="#plans-grid" className="px-3.5 py-1.5 rounded-[8px] text-[#1e1c1a] font-semibold bg-[#e6e3dd]/40">Pricing</a>
            <a href="#what-is-design" className="px-3.5 py-1.5 rounded-[8px] hover:text-[#1e1c1a] hover:bg-[#faf9f6] transition">What's a Design?</a>
            <a href="#comparison" className="px-3.5 py-1.5 rounded-[8px] hover:text-[#1e1c1a] hover:bg-[#faf9f6] transition">Compare</a>
            <a href="#capabilities" className="px-3.5 py-1.5 rounded-[8px] hover:text-[#1e1c1a] hover:bg-[#faf9f6] transition">Platform</a>
            <a href="#faq" className="px-3.5 py-1.5 rounded-[8px] hover:text-[#1e1c1a] hover:bg-[#faf9f6] transition">FAQ</a>
          </div>

          <div className="flex items-center gap-3">
            {/* Currency toggle — server-gated, see usdBillingEnabled comment above. Hidden (INR-only
                badge) until Stripe/USD billing is actually confirmed live. */}
            {usdBillingEnabled ? (
              <div className="flex items-center bg-black/[0.04] border border-black/10 p-0.5 rounded-full shadow-sm">
                <button
                  onClick={() => setSelectedCurrency("INR")}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${
                    selectedCurrency === "INR" ? "bg-[#2a2825] text-white shadow-sm" : "text-[#2a2825] hover:opacity-80 font-medium"
                  }`}
                >
                  ₹ INR
                </button>
                <button
                  onClick={() => setSelectedCurrency("USD")}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${
                    selectedCurrency === "USD" ? "bg-[#2a2825] text-white shadow-sm" : "text-[#2a2825] hover:opacity-80 font-medium"
                  }`}
                >
                  $ USD
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center bg-black/[0.04] border border-black/10 px-3 py-1 rounded-full text-xs font-semibold text-[#2a2825]">
                ₹ INR
              </div>
            )}

            <Link href="/auth" className="text-sm font-medium text-[#68645e] hover:text-[#1e1c1a] px-2 py-1 transition hidden sm:inline-block">
              Log in
            </Link>
            <Link
              href="/auth"
              className="inline-flex items-center gap-1.5 bg-[#2a2825] hover:bg-[#1e1c1a] text-white text-xs font-bold px-4 py-2.5 rounded-[8px] shadow-sm transition active:scale-95"
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────── */}
      <section className="border-b border-[#e6e3dd]">
        <div
          className="pt-20 pb-16 px-4 sm:px-12 text-center"
          style={{
            background:
              "radial-gradient(100% 100% at 50% 108%, #f8b868 0%, #ecd09e 26%, #b5d9ff 55%, #d9ebff 76%, #f3f8ff 100%)",
          }}
        >
          <div className="max-w-4xl mx-auto flex flex-col items-center gap-3 mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1e1c1a]/60 bg-white/40 border border-black/10 px-3 py-1 rounded-full">
              PRICING
            </span>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#1e1c1a] mt-2 leading-[1.15]">
              AI Marketing for Real Estate. <br className="hidden sm:inline" />Priced by Output.
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-[#1e1c1a]/70 max-w-2xl mx-auto leading-relaxed mt-1">
              Create property creatives, campaigns and editable designs without the designer bottleneck.
            </p>
          </div>

          <div className="inline-flex flex-col items-center">
            <div className="bg-white/60 backdrop-blur-md border border-black/10 p-1 rounded-full flex items-center shadow-sm">
              <button
                onClick={() => setIsAnnualGlobal(false)}
                className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                  !isAnnualGlobal ? "bg-[#2a2825] text-white shadow-sm" : "text-[#2a2825] hover:opacity-80 font-medium"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsAnnualGlobal(true)}
                className={`px-5 py-1.5 rounded-full text-xs transition-all duration-200 flex items-center gap-1.5 ${
                  isAnnualGlobal ? "bg-[#2a2825] text-white shadow-sm font-semibold" : "text-[#2a2825] hover:opacity-80 font-medium"
                }`}
              >
                <span>Yearly</span>
                {/* Derived from the authored monthly/annual prices (getAnnualSavings), not a
                    hand-written claim — so this badge cannot contradict the price beside it.
                    Every paid tier is authored to land on the same figure; if a future tier
                    breaks that, annualSavingsPercent goes null and the badge disappears rather
                    than advertising a number that is wrong for some tier. */}
                {annualSavingsPercent !== null && (
                  <span className="text-[11px] font-bold text-[#eb5e28] bg-[#eb5e28]/10 px-2 py-0.5 rounded-full">
                    Save {annualSavingsPercent}%
                  </span>
                )}
              </button>
            </div>
            <p className="text-xs text-[#68645e] mt-4 font-medium max-w-md mx-auto">
              Your plan is based on marketing output — not per-seat software fees.
            </p>
          </div>

          {isBetaMode && (
            <div className="mx-auto max-w-2xl mt-8 rounded-[12px] border border-emerald-600/30 bg-white/70 p-4">
              <div className="flex items-center justify-center gap-2 text-emerald-700 font-semibold mb-1">
                <Info className="h-4 w-4 shrink-0" />
                Free during beta
              </div>
              <p className="text-sm text-[#68645e] text-center">
                Paid plans are coming soon. Create an account and start generating — no credit card needed.
              </p>
            </div>
          )}

          {typeof import.meta.env.VITE_RAZORPAY_KEY_ID === "string" &&
            import.meta.env.VITE_RAZORPAY_KEY_ID.startsWith("rzp_test_") && (
            <div className="mx-auto max-w-2xl mt-6 rounded-[12px] border border-amber-600/30 bg-white/70 p-4 text-left">
              <div className="flex items-center gap-2 text-amber-700 font-medium mb-2">
                <Info className="h-4 w-4 shrink-0" />
                Test mode — Razorpay
              </div>
              <p className="text-sm text-[#68645e] mb-3">
                For <strong>subscriptions</strong>, Razorpay often shows a small <strong>refundable auth charge</strong> (e.g. ₹5) in the price summary first; the modal copy should still state the full recurring amount (
                <strong>Solo ₹{getTestModeBannerAmounts().solo}/mo</strong>, <strong>Team ₹{getTestModeBannerAmounts().team}/mo</strong>, or annual equivalent). If you only see ₹1 or wrong recurring text, check Dashboard plan amounts and <code className="bg-[#e6e3dd]/60 px-1 rounded text-xs">RAZORPAY_PLAN_*</code> in <code className="bg-[#e6e3dd]/60 px-1 rounded text-xs">.env</code>.
              </p>
              <div className="flex items-start gap-2 text-sm text-[#68645e]">
                <CreditCard className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium text-[#1e1c1a]">Test card (subscriptions):</span>{" "}
                  <code className="bg-[#e6e3dd]/60 px-1 rounded">5267 3181 8797 5449</code>
                  {" "}(Mastercard). CVV: any 3 digits · Expiry: any future date · OTP: <strong>4–10 digits</strong> = success. Or use UPI: <code className="bg-[#e6e3dd]/60 px-1 rounded">success@razorpay</code>.
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── PRICING CARDS ───────────────────────────────────────────── */}
      <section id="plans-grid" className="border-b border-[#e6e3dd] bg-white">
        <div className="max-w-[1320px] mx-auto border-x border-[#e6e3dd]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 divide-y xl:divide-y-0 xl:divide-x divide-[#e6e3dd]">
            {realPlans.map((plan) => {
              const isCurrentPlan = currentPlan === plan.tier;
              const isPendingPlan = pendingPlanTier === plan.tier;
              const isPlanLoading = loadingPlan === plan.tier;
              const isMostPopular = plan.tier === "PRO";
              const bulletsData = planFeatureBullets[plan.tier as PublicTier];

              // US-PAY-112 AC1/AC3 — regularPrice/effectivePrice/campaignId/badge come only from
              // the pricing API (getEffectivePrice() server-side); never recomputed here.
              const monthlyPricing = plan.monthly;
              const annualPricing = plan.annual;
              const showAnnualToggleBase = (monthlyPricing?.regularPrice ?? 0) > 0;

              /** Paid current tier: reflect API billing period (annual vs monthly), not the toggle. */
              const isPaidCurrentCard =
                isCurrentPlan && showAnnualToggleBase && subscription != null;
              const isAnnual = isPaidCurrentCard
                ? subscriptionBillingIsAnnual(subscription as { billingPeriod?: string })
                : isAnnualGlobal;

              const activePricing = isAnnual ? annualPricing : monthlyPricing;
              const {
                hasFoundingPrice,
                displayEffective,
                displayRegular,
                annualSavings,
              } = computePricingCardDisplay(monthlyPricing, annualPricing, isAnnual, false);

              const subscriptionAmountInr =
                subscription?.amount != null
                  ? Math.round(Number(subscription.amount) / 100)
                  : null;

              // USD figure is a display-only approximation, shown only once usdBillingEnabled is
              // true server-side — see the currency-gating comment above the providerInfo query.
              const fmt = (n: number) =>
                selectedCurrency === "INR" ? n.toLocaleString() : Math.round(n / 83).toLocaleString();
              const currencySymbol = selectedCurrency === "INR" ? "₹" : "$";

              return (
                <div
                  key={plan.tier}
                  className={`relative p-6 sm:p-8 flex flex-col justify-between transition-colors ${
                    isMostPopular
                      ? "bg-[#fff5ee]/40 border-y-2 xl:border-y-0 xl:border-x-2 border-[#eb5e28] shadow-[0_12px_30px_-6px_rgba(235,94,40,0.12),0_2px_8px_0_rgba(30,28,26,0.04)]"
                      : "hover:bg-[#faf9f6]/60"
                  }`}
                >
                  <div>
                    {isMostPopular && (
                      <div className="inline-flex items-center gap-1 text-[10px] font-extrabold text-white bg-[#eb5e28] uppercase tracking-wider px-2.5 py-0.5 rounded-full mb-2 shadow-sm">
                        ⭐ MOST POPULAR
                      </div>
                    )}
                    {hasFoundingPrice && activePricing?.badge && (
                      <div className="inline-flex items-center gap-1 text-[10px] font-extrabold text-white bg-[#0066cc] uppercase tracking-wider px-2.5 py-0.5 rounded-full mb-2 shadow-sm ml-2">
                        {activePricing.badge}
                      </div>
                    )}

                    <h3 className="text-xl font-bold text-[#1e1c1a]">{plan.name}</h3>
                    <p className="text-xs text-[#68645e] mt-1 min-h-[32px] leading-relaxed">
                      {planDescriptions[plan.tier]}
                    </p>

                    {/* Price */}
                    <div className="my-6">
                      {isPaidCurrentCard && subscriptionAmountInr != null && subscriptionAmountInr > 0 ? (
                        <>
                          <div className="text-4xl sm:text-[42px] font-bold text-[#1e1c1a] tracking-tight">
                            {currencySymbol}{fmt(subscriptionAmountInr)}
                          </div>
                          <div className="text-xs text-[#68645e] mt-2 font-normal">
                            {isAnnual ? "Per year — your current plan." : "Per month — your current plan."}
                          </div>
                          {isAnnual && (
                            <div className="text-[11px] text-[#8c8780]">
                              ≈ {currencySymbol}{fmt(Math.round(subscriptionAmountInr / 12))}/mo equivalent
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="flex items-baseline gap-2 flex-wrap">
                            {hasFoundingPrice && (
                              <span className="text-lg text-[#8c8780] line-through">
                                {currencySymbol}{fmt(displayRegular)}
                              </span>
                            )}
                            <span className="text-4xl sm:text-[42px] font-bold text-[#1e1c1a] tracking-tight">
                              {currencySymbol}{fmt(displayEffective)}
                            </span>
                          </div>
                          <div className="text-xs text-[#68645e] mt-2 font-normal">
                            {isAnnual ? "Per month, billed annually." : "Per month platform fee."}
                          </div>
                          {isAnnual && annualSavings > 0 && (
                            <div className="text-[11px] text-[#eb5e28] font-medium mt-0.5">
                              Save {currencySymbol}{fmt(annualSavings)}/yr on annual billing
                            </div>
                          )}
                          {plan.tier === "FREE" && (
                            <div className="text-[11px] text-[#8c8780]">No credit card required.</div>
                          )}
                        </>
                      )}
                    </div>

                    {/* CTA */}
                    {isBetaMode && (monthlyPricing?.regularPrice ?? 0) > 0 ? (
                      <button
                        disabled
                        className="w-full py-3 px-4 rounded-[8px] bg-[#e6e3dd] text-[#8c8780] font-bold text-xs mb-8 cursor-not-allowed"
                      >
                        Available after beta
                      </button>
                    ) : unconfiguredPaidTiers.has(plan.tier) && plan.tier !== "PRO" ? (
                      <a
                        href="mailto:hello@buildographic.com"
                        className="w-full py-3 px-4 rounded-[8px] bg-[#2a2825] hover:bg-[#1e1c1a] text-white font-bold text-xs transition shadow-sm mb-8 flex items-center justify-center"
                      >
                        Contact us
                      </a>
                    ) : (
                      <button
                        onClick={() => handleSubscribe(plan.tier)}
                        disabled={isCurrentPlan || isPendingPlan || isPlanLoading}
                        className={`w-full py-3 px-4 rounded-[8px] font-bold text-xs transition shadow-sm active:scale-95 mb-2 flex items-center justify-center gap-2 ${
                          isCurrentPlan || isPendingPlan
                            ? "bg-[#e6e3dd] text-[#68645e] cursor-default"
                            : isMostPopular
                              ? "bg-[#eb5e28] hover:bg-[#d44d18] text-white"
                              : "bg-[#2a2825] hover:bg-[#1e1c1a] text-white"
                        }`}
                      >
                        {isPlanLoading ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Processing...
                          </>
                        ) : isCurrentPlan ? (
                          "Current Plan"
                        ) : isPendingPlan ? (
                          "Activating..."
                        ) : plan.tier === "FREE" ? (
                          "Get started free"
                        ) : plan.tier === "PRO" ? (
                          "Choose Pro"
                        ) : (
                          `Get started with ${plan.name}`
                        )}
                      </button>
                    )}
                    {isPendingPlan && (
                      <button
                        onClick={handleSyncPendingStatus}
                        disabled={isSyncingStatus}
                        className="w-full text-xs text-[#68645e] hover:text-[#1e1c1a] underline underline-offset-2 disabled:opacity-50 transition-colors mb-6"
                      >
                        {isSyncingStatus ? "Checking…" : "Not seeing your plan? Refresh status"}
                      </button>
                    )}

                    <div className="text-[10px] font-bold text-[#8c8780] uppercase tracking-wider mb-4 mt-2">
                      WHAT YOU GET
                    </div>
                    <div className="space-y-4 text-xs text-[#1e1c1a]">
                      <div>
                        <div className="font-bold">
                          {plan.designLimit === -1 ? "Unlimited" : plan.designLimit} design credits / mo
                        </div>
                        <div className="text-[11px] text-[#68645e] mt-0.5">{bulletsData.firstLineDetail}</div>
                        {/* The design allowance is ONE pool per organisation, counted against
                            Organization.monthlyLimit — not per seat. On a multi-seat tier a buyer
                            can reasonably read "5 users, 200 designs" as 200 EACH, so say which
                            it is on the card rather than leaving it to be discovered at the cap. */}
                        {plan.userLimit !== 1 && (
                          <div className="text-[11px] text-[#68645e]">
                            Shared across your whole team — one pool, not {plan.designLimit} per person.
                          </div>
                        )}
                        <div className="text-[11px] text-[#68645e]">Generated designs remain in your library.</div>
                      </div>

                      {/* The editor and its allowance, as their OWN row — the second of the two
                          meters. Editing is metered separately from generating, so it gets equal
                          billing on the card instead of being the first item in a flat bullet
                          list where it read as one capability among several. */}
                      <div className="rounded-lg border border-[#eb5e28]/25 bg-[#fff5ee]/50 p-3 -mx-1">
                        <div className="font-bold">{bulletsData.editor.title}</div>
                        {plan.editableLimit != null && plan.editableLimit !== 0 ? (
                          <div className="text-[11px] text-[#68645e] mt-0.5">
                            {plan.editableLimit === -1 ? "Unlimited" : plan.editableLimit} editable
                            credit{plan.editableLimit === 1 ? "" : "s"} / mo — a separate allowance,
                            spent when you open a design in the editor.
                          </div>
                        ) : (
                          /* FREE has no editableLimit in PLAN_CONFIG — its editable access is a
                             one-off lifetime trial, not a monthly allowance, so do not print "0". */
                          <div className="text-[11px] text-[#68645e] mt-0.5">
                            One free trial edit — no monthly editable allowance.
                          </div>
                        )}
                        {bulletsData.editor.linkText && (
                          <a
                            href={bulletsData.editor.linkHref}
                            className="text-[#0066cc] text-[11px] hover:underline font-medium block mt-0.5"
                          >
                            {bulletsData.editor.linkText}
                          </a>
                        )}
                      </div>
                      {bulletsData.bullets.map((bullet) => (
                        <div key={bullet.title}>
                          <div className="font-bold">{bullet.title}</div>
                          {bullet.description && (
                            <div className="text-[11px] text-[#68645e] mt-0.5">{bullet.description}</div>
                          )}
                          {bullet.linkText && (
                            <a
                              href={bullet.linkHref}
                              className="text-[#0066cc] text-[11px] hover:underline font-medium block mt-0.5"
                            >
                              {bullet.linkText}
                            </a>
                          )}
                        </div>
                      ))}

                      {plan.tier === "AGENCY" && (
                        <div className="pt-4 border-t border-[#e6e3dd] text-[11px] text-[#68645e] leading-relaxed">
                          Need custom volume or enterprise integration?{" "}
                          <a
                            href="mailto:hello@buildographic.com"
                            className="font-bold text-[#1e1c1a] underline underline-offset-2 hover:text-[#0066cc]"
                          >
                            Contact Sales
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── "WHAT IS AN AI MARKETING DESIGN?" ──────────────────────────── */}
      <section id="what-is-design" className="border-b border-[#e6e3dd] py-20 bg-[#faf9f6]">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8c8780]">TRANSPARENT PRICING</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1e1c1a] mt-2 mb-3 tracking-tight">
              What is an AI Marketing Design?
            </h2>
            <p className="text-[#68645e] text-sm sm:text-base leading-relaxed">
              An AI Marketing Design is <strong>one completed marketing creative</strong> generated for your property or campaign.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {designExamples.map((ex) => (
              <div key={ex.label} className="bg-white rounded-[12px] p-4 border border-[#e6e3dd] shadow-sm">
                <div className="h-24 rounded-[8px] bg-[#faf9f6] flex flex-col justify-between p-3 mb-3 border border-[#e6e3dd]">
                  <span className={`text-[10px] font-bold ${ex.accent ? "text-[#eb5e28]" : "text-[#68645e]"}`}>{ex.tag}</span>
                  <div className="text-xs font-bold text-[#1e1c1a] truncate">{ex.title}</div>
                </div>
                <div className="text-xs font-bold text-[#1e1c1a]">{ex.label}</div>
                <div className="text-[11px] text-[#8c8780]">{ex.note}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPARISON TABLE — rows trace only to real PLAN_CONFIG fields / already-shipped
          features (confirmed with the user); nothing here is invented marketing copy. ───────── */}
      {comparisonTableEnabled && (
        <ComparisonSectionBoundary>
          <section id="comparison" className="border-b border-[#e6e3dd] py-20 bg-white">
            <div className="max-w-[1320px] mx-auto px-4 sm:px-8">
              <div className="text-center max-w-3xl mx-auto mb-14">
                <span className="text-xs font-bold uppercase tracking-wider text-[#8c8780]">FEATURE MATRIX</span>
                <h2 className="text-3xl sm:text-4xl font-bold text-[#1e1c1a] mt-2 mb-3 tracking-tight">
                  Compare plans side-by-side
                </h2>
              </div>

              <div className="rounded-[16px] border border-[#e6e3dd] overflow-hidden bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[720px]">
                    <thead>
                      <tr className="border-b border-[#e6e3dd] bg-[#faf9f6]">
                        <th className="p-4 sm:p-5 text-sm font-bold text-[#1e1c1a] w-1/3">Feature</th>
                        {realPlans.map((plan) => (
                          <th
                            key={plan.tier}
                            className={`p-4 text-center text-xs font-bold whitespace-nowrap ${
                              plan.tier === "PRO"
                                ? "text-[#eb5e28] bg-[#fff5ee]/40 border-x border-[#eb5e28]/20"
                                : "text-[#1e1c1a]"
                            }`}
                          >
                            {plan.name}{plan.tier === "PRO" ? " ⭐" : ""}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="text-xs divide-y divide-[#e6e3dd] text-[#68645e]">
                      <tr className="bg-[#faf9f6]">
                        <td colSpan={realPlans.length + 1} className="px-5 py-2.5 font-bold uppercase tracking-wider text-[11px] text-[#1e1c1a]">
                          Creation &amp; Output Allowances
                        </td>
                      </tr>
                      <tr>
                        <td className="p-4 px-5 font-semibold text-[#1e1c1a]">
                          Design credits / mo
                          {/* Two allowances are metered separately and are not interchangeable, so
                              name each one on its own row rather than leaving "designs" and
                              "editable designs" to read as one pool measured two ways. The
                              shared-pool note is stated here, on the row the number lives on —
                              the allowance is org-wide (Organization.monthlyLimit), never per seat. */}
                          <div className="font-normal text-[11px] text-[#68645e] mt-0.5">
                            One per AI design you generate · shared across everyone on the plan
                          </div>
                        </td>
                        {realPlans.map((plan) => (
                          <td
                            key={plan.tier}
                            className={`p-4 text-center font-bold ${
                              plan.tier === "PRO" ? "text-[#eb5e28] bg-[#fff5ee]/40 border-x border-[#eb5e28]/20" : "text-[#1e1c1a]"
                            }`}
                          >
                            {plan.designLimit === -1 ? "Unlimited" : plan.designLimit}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-4 px-5 font-semibold text-[#1e1c1a]">
                          Editable credits / mo
                          <div className="font-normal text-[11px] text-[#68645e] mt-0.5">
                            One the first time you open a design in the editor · a separate
                            allowance, not taken from your design credits
                          </div>
                        </td>
                        {realPlans.map((plan) => (
                          <td
                            key={plan.tier}
                            className={`p-4 text-center font-bold ${
                              plan.tier === "PRO" ? "text-[#eb5e28] bg-[#fff5ee]/40 border-x border-[#eb5e28]/20" : "text-[#1e1c1a]"
                            }`}
                          >
                            {plan.editableLimit === -1 ? "Unlimited" : plan.editableLimit}
                          </td>
                        ))}
                      </tr>

                      {templateAccessRows.map((row) => renderComparisonRow(row))}
                      {editableAccessRows.map((row) => renderComparisonRow(row))}

                      <tr className="bg-[#faf9f6]">
                        <td colSpan={realPlans.length + 1} className="px-5 py-2.5 font-bold uppercase tracking-wider text-[11px] text-[#1e1c1a]">
                          Branding &amp; Customization
                        </td>
                      </tr>
                      {brandingRows.map((row) => renderComparisonRow(row))}
                      {/* Always true, every tier — real behavior (Infographic records persist in
                          the design library), already stated on every card above; not derived
                          from buildComparisonRows() since there's no per-tier variance to show. */}
                      <tr>
                        <td className="p-4 px-5 font-semibold text-[#1e1c1a]">Design persistence in your library</td>
                        {realPlans.map((plan) => {
                          const isPro = plan.tier === "PRO";
                          return (
                            <td
                              key={plan.tier}
                              className={`p-4 text-center ${isPro ? "bg-[#fff5ee]/40 border-x border-[#eb5e28]/20" : ""}`}
                            >
                              <span
                                className={`inline-flex items-center gap-1 font-semibold whitespace-nowrap ${
                                  isPro ? "text-[#eb5e28]" : "text-[#1e1c1a]"
                                }`}
                              >
                                <Check className="h-3.5 w-3.5 shrink-0" /> Permanent
                              </span>
                            </td>
                          );
                        })}
                      </tr>

                      <tr className="bg-[#faf9f6]">
                        <td colSpan={realPlans.length + 1} className="px-5 py-2.5 font-bold uppercase tracking-wider text-[11px] text-[#1e1c1a]">
                          Platform &amp; Support
                        </td>
                      </tr>
                      {platformRows.map((row) => renderComparisonRow(row))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>
        </ComparisonSectionBoundary>
      )}

      {/* ── PLATFORM CAPABILITIES ──────────────────────────────────────── */}
      <section id="capabilities" className="border-b border-[#e6e3dd] py-20 bg-white">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8c8780]">PLATFORM CAPABILITIES</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1e1c1a] mt-2 mb-3 tracking-tight">
              Everything You Need to Market a Property
            </h2>
            <p className="text-[#68645e] text-sm sm:text-base leading-relaxed">
              From quick single-post generation to complete layered customization, Buildographic simplifies real-estate marketing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {capabilities.map((cap) => (
              <div key={cap.title} className="bg-[#faf9f6] rounded-[16px] p-8 border border-[#e6e3dd] flex flex-col justify-between">
                <div>
                  <div className="text-xs font-bold text-[#eb5e28] uppercase tracking-wider mb-3">{cap.eyebrow}</div>
                  <h3 className="text-xl font-bold text-[#1e1c1a]">{cap.title}</h3>
                  <p className="text-sm text-[#68645e] mt-3 leading-relaxed">{cap.description}</p>
                </div>
                <div className="mt-8 pt-4 border-t border-[#e6e3dd] text-xs font-bold text-[#1e1c1a]">
                  {cap.footer}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF MARQUEE ────────────────────────────────────────── */}
      <section className="border-b border-[#e6e3dd] bg-white py-12">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-8">
          <div className="text-center max-w-3xl mx-auto mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8c8780]">
              BUILT FOR MODERN REAL-ESTATE MARKETING
            </span>
            <p className="text-[#68645e] text-sm mt-2 font-medium">
              Designed around the workflows used by real-estate agents, brokers, marketers and property teams.
            </p>
          </div>
          <div className="relative">
            <Marquee pauseOnHover className="[--duration:30s]">
              {marqueeTags.map((tag) => (
                <span
                  key={tag}
                  className="text-[#8c8780] font-semibold text-xs tracking-wider uppercase whitespace-nowrap px-2"
                >
                  {tag}
                </span>
              ))}
            </Marquee>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white" />
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section id="faq" className="border-b border-[#e6e3dd] py-20 bg-[#faf9f6]">
        <div className="max-w-[800px] mx-auto px-4 sm:px-8">
          <div className="border-b border-[#e6e3dd] pb-2 mb-8">
            <span className="text-xs font-bold tracking-wider text-[#8c8780] uppercase">QUESTIONS WORTH ANSWERING</span>
          </div>

          <Accordion type="single" collapsible className="divide-y divide-[#e6e3dd]">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`faq-${index}`} className="py-1 border-none">
                <AccordionTrigger className="text-left text-[#1e1c1a] hover:no-underline py-4 text-base font-semibold hover:opacity-80">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-[#68645e] pb-4 text-sm leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ── ENTERPRISE / BROKERAGE CTA BANNER ──────────────────────────── */}
      <section id="enterprise" className="border-b border-[#e6e3dd] py-16 bg-white">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-8">
          <div className="bg-[#2a2825] text-white rounded-[20px] p-8 sm:p-12 md:p-14 flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm">
            <div className="max-w-xl text-center md:text-left">
              <span className="text-xs font-bold text-[#eb5e28] uppercase tracking-wider">
                FOR BROKERAGES &amp; ENTERPRISE
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold mt-2 leading-tight">
                Running a growing brokerage or real-estate organization?
              </h2>
              <p className="text-sm text-[#cac6bf] mt-2 leading-relaxed">
                Get custom design volumes, dedicated support and enterprise setup tailored to your organization.
              </p>
            </div>
            <a
              href="mailto:hello@buildographic.com"
              className="px-6 py-3 rounded-[8px] bg-white text-[#1e1c1a] hover:bg-[#faf9f6] font-bold text-xs transition shrink-0 shadow-sm"
            >
              Contact Enterprise Sales →
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="bg-[#faf9f6] py-14 text-xs text-[#68645e]">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pb-10 border-b border-[#e6e3dd]">
            <div>
              <div className="font-bold text-sm text-[#1e1c1a] mb-3">Buildographic</div>
              <p className="text-[11px] text-[#68645e] leading-relaxed">
                AI-powered property marketing platform built for real-estate agents, teams, and brokerages.
              </p>
            </div>
            <div>
              <div className="font-semibold text-[#1e1c1a] mb-2">Product</div>
              <ul className="space-y-1.5">
                <li><Link href="/templates" className="hover:text-[#1e1c1a]">Templates</Link></li>
                <li><Link href="/pricing" className="text-[#1e1c1a] font-bold">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <div className="font-semibold text-[#1e1c1a] mb-2">Solutions</div>
              <ul className="space-y-1.5">
                <li><a href="#plans-grid" className="hover:text-[#1e1c1a]">Solo Agents</a></li>
                <li><a href="#plans-grid" className="hover:text-[#1e1c1a]">Real Estate Teams</a></li>
                <li><a href="#plans-grid" className="hover:text-[#1e1c1a]">Agencies &amp; Brokerages</a></li>
              </ul>
            </div>
            <div>
              <div className="font-semibold text-[#1e1c1a] mb-2">Legal</div>
              <ul className="space-y-1.5">
                <li><a href="/terms" className="hover:text-[#1e1c1a]">Terms of Service</a></li>
                <li><a href="/privacy" className="hover:text-[#1e1c1a]">Privacy Policy</a></li>
                <li><a href="/refund-policy" className="hover:text-[#1e1c1a]">Refund &amp; Cancellation</a></li>
                <li><a href="/cookies" className="hover:text-[#1e1c1a]">Cookie Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#8c8780]">
            <div>© 2026 Buildographic. All rights reserved.</div>
            <div className="flex items-center gap-3">
              <a href="#" className="hover:text-[#1e1c1a] transition-colors"><Linkedin className="h-4 w-4" /></a>
              <a href="#" className="hover:text-[#1e1c1a] transition-colors"><Twitter className="h-4 w-4" /></a>
              <a href="#" className="hover:text-[#1e1c1a] transition-colors"><Youtube className="h-4 w-4" /></a>
              <a href="#" className="hover:text-[#1e1c1a] transition-colors"><Instagram className="h-4 w-4" /></a>
            </div>
            <div>✓ Razorpay Secured</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
