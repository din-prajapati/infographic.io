import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Marquee } from "@/components/ui/marquee";
import {
  Linkedin,
  Twitter,
  Youtube,
  Instagram,
  Check,
  X,
  Clock,
  Layers,
  Maximize,
  Zap,
  MessageSquare,
  PenTool,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PLAN_CONFIG } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { pricingApi, type EffectivePriceResult } from "@/lib/api";

import carouselImage1 from "@/assets/images/carousel/property-1.jpg";
import carouselImage2 from "@/assets/images/carousel/property-2.jpg";
import carouselImage3 from "@/assets/images/carousel/property-3.jpg";
import heroVideo from "@/assets/videos/hero-background.mp4";

// design-preview-landing.html — visual pass, 2026-08-24. Full re-skin to the mockup, same
// playbook as PricingPage.tsx's visual pass (US-PAY-112). Real PLAN_CONFIG data and existing
// business logic reused unchanged; see docs/agile/PRD/2026-08-24-naming-cleanup-and-landing-
// relaunch.md Part 2 for the 9 content-risk decisions applied throughout (each cross-referenced
// inline below at the section it affects).

const showcaseTemplates = [
  { id: 1, title: "Modern Property Listing", format: "Instagram Story & Reel", image: carouselImage1, badge: "9:16" },
  { id: 2, title: "Luxury Home Showcase", format: "Facebook & Instagram Post", image: carouselImage2, badge: "1:1" },
  { id: 3, title: "Commercial Property", format: "LinkedIn Banner & Web", image: carouselImage3, badge: "16:9" },
  { id: 4, title: "Open House Flyer", format: "Print Ready PDF", image: carouselImage1, badge: "A4" },
  { id: 5, title: "Quarterly Market Report", format: "Email Newsletter Header", image: carouselImage2, badge: "3:1" },
  { id: 6, title: "Agent Branding Showcase", format: "MLS Compliant Format", image: carouselImage3, badge: "MLS" },
];

// Item 1 (PRD, Approved) — the mockup's trust marquee named real competitor brokerages
// (Sotheby's, Keller Williams, Compass, etc.) with no evidence of any real relationship —
// replaced with the same generic audience/use-case tag pattern the pricing page's own marquee
// already uses, never a named third party.
const audienceMarquee = [
  "SOLO AGENTS",
  "REAL ESTATE TEAMS",
  "BROKERAGES",
  "PROPERTY MANAGERS",
  "LISTING MARKETERS",
  "REAL ESTATE MARKETING AGENCIES",
];

const pillars = [
  {
    number: "01",
    eyebrow: "Ingest & Research",
    accent: "text-brandOrange",
    title: "Real Estate Data Extraction",
    description:
      "Paste raw listing descriptions or property feature bullets. AI extracts pricing, square footage, bed/bath specs, amenities, and narrative hooks automatically.",
    footerLabel: "Amenities Mapped",
    footerValue: "Structured in Seconds",
  },
  {
    number: "02",
    eyebrow: "AI Design Studio",
    accent: "text-brandBlue",
    title: "Multi-Layer Canvas Editor",
    // Item 5 (PRD, Approved) — "Vector"/"zero hallucinations" reworded to the product's real
    // term (Multi-layer Canvas Editor) with an honest claim about not needing manual redesign.
    description:
      "Generates a complete layout paired with a live multi-layer canvas. Move text, adjust colors, swap badges, add shapes, and edit any marketing element — no manual redesign needed.",
    footerLabel: "Canvas Editor",
    footerValue: "100% Editable Text",
  },
  {
    number: "03",
    eyebrow: "Brand & Distribute",
    accent: "text-brandEmerald",
    title: "1-Click Multi-Format Reflow",
    description:
      "Auto-applies your agent headshot, license disclaimer, and brokerage logo. Instantly reflows across 9:16 Stories/Reels, 1:1 Feeds, 16:9 Banners, and print-ready flyers.",
    footerLabel: "Multi-Format",
    footerValue: "9:16 • 1:1 • 16:9 • Print",
  },
];

const refinementModes = [
  {
    icon: MessageSquare,
    accent: "text-brandOrange bg-brandOrangeLight",
    title: "Prompt-Driven Refinement",
    description:
      'Talk directly to the canvas: "Make the price badge bold saffron", "Highlight the rooftop terrace", or "Rewrite the description for luxury buyers."',
    footerLabel: "Prompt",
    footerValue: '"Change headline to \'Beverly Hills Masterpiece\' in bold."',
    footerAccent: "text-brandOrange",
  },
  {
    icon: PenTool,
    accent: "text-brandBlue bg-blue-50",
    title: "Direct Visual Canvas Edit",
    description:
      "Click any element directly on the canvas. Drag text boxes, re-order layers, adjust opacity, change typography, or insert custom badges with zero friction.",
    footerLabel: "Layer Action",
    footerValue: "[Text_Title] Moved • Font: Inter Black 36pt",
    footerAccent: "text-brandBlue",
  },
  {
    icon: ShieldCheck,
    accent: "text-brandEmerald bg-emerald-50",
    title: "Dynamic Brand Kit Sync",
    description:
      "One click stamps your agent headshot, official brokerage logo, license numbers, and custom team color palette across every single format.",
    footerLabel: "Brand Kit",
    footerValue: "Your Brokerage • Your Name (Active)",
    footerAccent: "text-brandEmerald",
  },
];

const oldWorkflow = [
  { icon: Clock, text: "2–4 hours manually copying listing data and formatting layers" },
  { icon: X, text: "$50–$150 per flyer when outsourcing to freelance designers" },
  { icon: X, text: "Flat AI image generators produce unfixable text typos" },
  { icon: Layers, text: "Must manually resize separately for Stories, Posts, & MLS" },
];

// Item 3 (PRD, Approved) — dropped the mockup's "$0.29 per design" internal-cost figure
// (M-PAY-04's own milestone ACs ban Ideogram/GPT/API cost language on customer-facing pages);
// replaced with the same "output-based, not per-seat" framing already locked in for /pricing.
const newWorkflow = [
  { icon: Zap, text: "Seconds from prompt or raw listing text to a finished design" },
  { icon: Check, text: "Output-based pricing — you pay for what you create, not idle seats" },
  { icon: PenTool, text: "Fully editable layers with complete typography & color control" },
  { icon: Maximize, text: "1-click multi-format reflow across 9:16, 1:1, 16:9 & print" },
];

const faqs = [
  {
    question: "What is Buildographic and how does it work?",
    answer:
      "Buildographic transforms your property listings into stunning AI marketing designs. Enter your property details, choose a template, and our system creates professional marketing materials ready for social media, MLS, and print.",
  },
  {
    question: "What can I create with Buildographic?",
    answer:
      "Property listing designs, open house flyers, market reports, neighborhood guides, agent branding materials, and social media graphics. All templates are designed specifically for real estate professionals.",
  },
  {
    question: "How does pricing work?",
    answer:
      "We offer flexible plans starting with a free tier that includes 3 AI marketing designs per month. Paid plans provide more monthly designs, custom branding options, and priority support. Annual billing gets you 2 months free.",
  },
  {
    question: "Do I need design experience?",
    answer:
      "No design experience needed! Our templates are pre-designed by professionals. You just enter your property details and our system handles the layout, typography, and visual design automatically.",
  },
  {
    question: "What formats can I download?",
    answer:
      "All plans include high-resolution PNG and JPG downloads. Images are optimized for social media, MLS, and print-ready sizing. PDF export is coming soon.",
  },
];

// US-PAY-112 T3 precedent, kept: teaser stays a 3-tier FREE/SOLO/TEAM preview (full 5-tier grid
// lives on /pricing). Live prices come from the same GET /api/v1/pricing endpoint the main
// pricing page uses, so a founding-campaign badge/price can never drift between the two pages.
const PUBLIC_TEASER_TIERS = ["FREE", "SOLO", "TEAM"] as const;

const teaserDescriptions: Record<(typeof PUBLIC_TEASER_TIERS)[number], string> = {
  FREE: "Perfect for trying Buildographic on your next listing.",
  SOLO: "Designed for active individual real estate agents.",
  TEAM: "For real estate teams and brokerage offices.",
};

function TemplateCard({ template }: { template: typeof showcaseTemplates[0] }) {
  return (
    <div className="w-[280px] sm:w-[320px] rounded-[16px] bg-[#faf9f6] border border-[#e6e3dd] overflow-hidden shadow-sm flex-shrink-0 group hover:scale-[1.02] transition-transform duration-300">
      <div className="aspect-[4/3] overflow-hidden relative">
        <img
          src={template.image}
          alt={template.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-[#1e1c1a]/85 text-white text-[10px] font-bold backdrop-blur-sm">
          {template.badge}
        </span>
      </div>
      <div className="p-4 bg-white border-t border-[#e6e3dd]">
        <h4 className="text-sm font-bold text-[#1e1c1a]">{template.title}</h4>
        <p className="text-[11px] text-[#68645e] mt-0.5">{template.format}</p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [isAnnualGlobal, setIsAnnualGlobal] = useState(false);
  const [heroPrompt, setHeroPrompt] = useState(
    "Luxury 4BHK Villa with private infinity pool & clubhouse view, ₹2.8 Cr",
  );
  const videoRef = useRef<HTMLVideoElement>(null);

  // Item 7 (PRD, Approved) — the mockup's hero has a real-looking prompt bar; kept decorative/
  // lead-in only for this pass. Typing a prompt just updates local state (heroPrompt below); the
  // "Generate Marketing Design" button is a plain <Link href="/auth">, same as every other CTA on
  // the page. Real anonymous/unauthenticated generation needs rate-limiting and abuse prevention —
  // separate, backend-scoped work for its own story if wanted later.

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Item 6 (PRD, Approved) — same locked decision as US-PAY-112: real PLAN_CONFIG INR numbers via
  // the existing GET /api/v1/pricing endpoint, kept to the 3-tier FREE/SOLO/TEAM teaser scope, the
  // real x10 annual formula ("2 months free"), no currency toggle.
  const { data: pricingData } = useQuery({
    queryKey: ["/api/v1/pricing"],
    queryFn: () => pricingApi.getPricing(),
  });
  const pricingByTier = new Map<string, { monthly: EffectivePriceResult; annual: EffectivePriceResult }>(
    (pricingData?.plans ?? []).map((p) => [p.tier, { monthly: p.monthly, annual: p.annual }]),
  );

  return (
    <div className="min-h-screen bg-white text-[#1e1c1a]" style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      {/* ── NAV — transparent over hero video, solid on scroll ─────────── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 border-b ${
          scrolled
            ? "bg-white/95 backdrop-blur-md border-[#e6e3dd] shadow-sm text-[#1e1c1a]"
            : "bg-transparent border-white/10 text-white"
        }`}
      >
        <div className="max-w-[1320px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div
              className={`w-7 h-7 rounded-[8px] flex items-center justify-center shadow-sm shrink-0 transition-colors ${
                scrolled ? "bg-[#2a2825] text-white" : "bg-white text-[#1e1c1a]"
              }`}
            >
              <img src="/logo-icon-option6.png" alt="" className="h-4 w-4" />
            </div>
            <span className="font-bold text-base tracking-tight">Buildographic</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            <a href="#solutions" className={`px-3.5 py-1.5 rounded-[8px] transition ${scrolled ? "text-[#68645e] hover:text-[#1e1c1a] hover:bg-[#faf9f6]" : "text-white/80 hover:text-white hover:bg-white/10"}`}>Solutions</a>
            <a href="#studio" className={`px-3.5 py-1.5 rounded-[8px] transition ${scrolled ? "text-[#68645e] hover:text-[#1e1c1a] hover:bg-[#faf9f6]" : "text-white/80 hover:text-white hover:bg-white/10"}`}>Canvas Editor</a>
            <a href="#templates" className={`px-3.5 py-1.5 rounded-[8px] transition ${scrolled ? "text-[#68645e] hover:text-[#1e1c1a] hover:bg-[#faf9f6]" : "text-white/80 hover:text-white hover:bg-white/10"}`}>Templates</a>
            <a href="#comparison" className={`px-3.5 py-1.5 rounded-[8px] transition ${scrolled ? "text-[#68645e] hover:text-[#1e1c1a] hover:bg-[#faf9f6]" : "text-white/80 hover:text-white hover:bg-white/10"}`}>Why Us</a>
            <Link href="/pricing" className={`px-3.5 py-1.5 rounded-[8px] font-semibold transition ${scrolled ? "bg-[#e6e3dd]/40 text-[#1e1c1a]" : "bg-white/10 text-white"}`}>Pricing</Link>
            <a href="#faq" className={`px-3.5 py-1.5 rounded-[8px] transition ${scrolled ? "text-[#68645e] hover:text-[#1e1c1a] hover:bg-[#faf9f6]" : "text-white/80 hover:text-white hover:bg-white/10"}`}>FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/auth" className={`text-sm font-medium px-2 py-1 transition hidden sm:inline-block ${scrolled ? "text-[#68645e] hover:text-[#1e1c1a]" : "text-white/80 hover:text-white"}`}>
              Log in
            </Link>
            <Link
              href="/auth?provider=google"
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-[8px] shadow-sm transition active:scale-95 ${
                scrolled ? "bg-[#2a2825] hover:bg-[#1e1c1a] text-white" : "bg-white hover:bg-gray-100 text-[#1e1c1a]"
              }`}
            >
              Get started free
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO — full-bleed video, real prompt bar (decorative, routes to /auth) ─────── */}
      <section className="relative overflow-hidden bg-[#1c1a18]" id="hero-prompt">
        <video ref={videoRef} autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover opacity-60 z-0">
          <source src={heroVideo} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-[#1c1a18]/85 via-[#1c1a18]/45 to-[#1c1a18]/90 z-0 pointer-events-none" />

        <div className="max-w-[1320px] mx-auto relative min-h-screen flex flex-col justify-between pt-24 pb-12 sm:pt-28 sm:pb-16 lg:pt-32 lg:pb-16 px-4 sm:px-8 lg:px-12 text-center z-10">
          <div className="relative z-10 flex items-center justify-center max-w-5xl mx-auto w-full mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white/90 text-[11px] font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>No credit card required to start</span>
            </div>
          </div>

          <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center gap-3 my-auto py-6">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-amber-300 bg-amber-400/10 backdrop-blur-md border border-amber-400/25 px-4 py-1.5 rounded-full">
              AI DESIGN STUDIO FOR REAL ESTATE
            </span>

            <h1 className="text-3xl sm:text-5xl md:text-[56px] lg:text-[60px] font-bold tracking-tight text-white leading-[1.1] drop-shadow-md">
              Create Property Marketing Designs.<br className="hidden sm:inline" /> Not Days of Design Work.
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-white/80 max-w-2xl mx-auto leading-relaxed drop-shadow-sm">
              Transform property listings and market data into stunning, fully editable social carousels, open house flyers, and print marketing in seconds.
            </p>

            <div className="w-full max-w-3xl mt-6 text-left">
              <div className="bg-white/95 backdrop-blur-xl p-2.5 rounded-[20px] shadow-2xl border border-white/30">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="flex items-center gap-3 px-4 py-2.5 flex-1">
                    <Zap className="w-5 h-5 text-brandOrange flex-shrink-0" />
                    <input
                      type="text"
                      value={heroPrompt}
                      onChange={(e) => setHeroPrompt(e.target.value)}
                      placeholder="What property do you want to market?"
                      className="w-full bg-transparent text-[#1e1c1a] placeholder:text-[#8c8780] text-sm sm:text-base focus:outline-none font-medium"
                    />
                  </div>
                  <Link
                    href="/auth"
                    className="px-6 py-3 rounded-[12px] bg-[#2a2825] hover:bg-[#1e1c1a] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition active:scale-95 flex-shrink-0"
                  >
                    <span>Generate Marketing Design</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                <div className="pt-2.5 pb-1 px-3 border-t border-black/5 flex items-center gap-2 overflow-x-auto text-xs text-[#68645e]">
                  <span className="text-[#8c8780] font-semibold flex-shrink-0">Try:</span>
                  {[
                    { emoji: "🏡", label: "Luxury Penthouse", value: "Luxury 4BHK Penthouse with panoramic skyline view, ₹3.2 Cr" },
                    { emoji: "📅", label: "Open House Flyer", value: "Open House this Sunday 2-5 PM, Modern 3BHK Apartment" },
                    { emoji: "📊", label: "Market Trend Report", value: "Q3 Market Pulse: 14% median price rise, 18 days on market" },
                    { emoji: "🏷️", label: "Price Reduction", value: "Just Reduced! ₹10 Lakh Price Drop on Premium Villa" },
                  ].map((pill) => (
                    <button
                      key={pill.label}
                      onClick={() => setHeroPrompt(pill.value)}
                      className="px-2.5 py-1 rounded-full bg-black/5 hover:bg-black/10 text-[#1e1c1a] transition-colors flex-shrink-0 flex items-center gap-1.5 font-medium"
                    >
                      <span>{pill.emoji}</span> {pill.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-3.5 max-w-5xl mx-auto w-full text-center mt-6">
            <div className="p-4 rounded-[16px] bg-white/10 backdrop-blur-md border border-white/15 text-white shadow-lg">
              <div className="text-2xl sm:text-3xl font-extrabold text-white">Fast</div>
              <div className="text-xs text-white/70 mt-1 font-medium">Prompt to Finished Design</div>
            </div>
            <div className="p-4 rounded-[16px] bg-white/10 backdrop-blur-md border border-white/15 text-white shadow-lg">
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-400">100%</div>
              <div className="text-xs text-white/70 mt-1 font-medium">Editable Text & Layout</div>
            </div>
            <div className="p-4 rounded-[16px] bg-white/10 backdrop-blur-md border border-white/15 text-white shadow-lg">
              <div className="text-2xl sm:text-3xl font-extrabold text-white">7+</div>
              <div className="text-xs text-white/70 mt-1 font-medium">Multi-Channel Formats</div>
            </div>
            <div className="p-4 rounded-[16px] bg-white/10 backdrop-blur-md border border-white/15 text-white shadow-lg">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">Free</div>
              <div className="text-xs text-white/70 mt-1 font-medium">No Credit Card to Start</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── AUDIENCE MARQUEE — generic tags, no named third parties (Item 1) ─────────── */}
      <section className="border-b border-[#e6e3dd] bg-white py-6 overflow-hidden">
        <div className="max-w-[1320px] mx-auto border-x-0 sm:border-x border-[#e6e3dd]">
          <div className="overflow-x-hidden">
            <Marquee pauseOnHover className="[--duration:30s]">
              {[...audienceMarquee, ...audienceMarquee].map((tag, i) => (
                <span key={i} className="text-[#8c8780] text-xs font-bold uppercase tracking-wider whitespace-nowrap px-2">
                  {tag}
                </span>
              ))}
            </Marquee>
          </div>
        </div>
      </section>

      {/* ── 3-PILLAR FRAMEWORK ─────────────────────────────────────────── */}
      <section id="solutions" className="border-b border-[#e6e3dd] bg-white py-20">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8c8780]">THE SOLUTIONING FRAMEWORK</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1e1c1a] mt-2 mb-3 tracking-tight">
              From listing text to marketing-ready designs in three steps
            </h2>
            <p className="text-[#68645e] text-sm sm:text-base">
              Stop wrestling with generic design tools or waiting days on freelance agencies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#e6e3dd] rounded-[16px] border border-[#e6e3dd] overflow-hidden bg-white shadow-sm">
            {pillars.map((pillar) => (
              <div key={pillar.number} className="p-8 flex flex-col justify-between hover:bg-[#faf9f6] transition">
                <div>
                  <div className="w-10 h-10 rounded-[8px] bg-[#2a2825] text-white flex items-center justify-center font-bold text-sm mb-6">
                    {pillar.number}
                  </div>
                  <div className={`text-xs font-bold uppercase tracking-wider mb-1.5 ${pillar.accent}`}>{pillar.eyebrow}</div>
                  <h3 className="text-lg font-bold text-[#1e1c1a] mb-2">{pillar.title}</h3>
                  <p className="text-xs text-[#68645e] leading-relaxed mb-6">{pillar.description}</p>
                </div>
                <div className="p-3 rounded-[8px] bg-[#faf9f6] border border-[#e6e3dd] text-xs font-mono text-[#68645e]">
                  <span className="text-[#1e1c1a] font-bold">{pillar.footerLabel}:</span> {pillar.footerValue}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CANVAS EDITOR — 3 refinement modes (Item 8: renamed from "Vibe Studio") ────── */}
      <section id="studio" className="border-b border-[#e6e3dd] bg-[#faf9f6] py-20">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8c8780]">CREATIVE CONTROL</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1e1c1a] mt-2 mb-3 tracking-tight">
              Three ways to refine your designs
            </h2>
            <p className="text-[#68645e] text-sm sm:text-base">
              Switch seamlessly between conversational prompts, visual drag-and-drop, and automated brand kits.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {refinementModes.map((mode) => (
              <div key={mode.title} className="p-8 rounded-[16px] bg-white border border-[#e6e3dd] shadow-sm flex flex-col justify-between">
                <div>
                  <div className={`w-10 h-10 rounded-[8px] flex items-center justify-center mb-6 ${mode.accent}`}>
                    <mode.icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-[#1e1c1a] mb-2">{mode.title}</h3>
                  <p className="text-xs text-[#68645e] leading-relaxed mb-6">{mode.description}</p>
                </div>
                <div className="p-3 rounded-[8px] bg-[#faf9f6] border border-[#e6e3dd] text-[11px] text-[#68645e] font-mono">
                  <span className={`font-bold ${mode.footerAccent}`}>{mode.footerLabel}:</span> {mode.footerValue}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TEMPLATE MARQUEE ───────────────────────────────────────────── */}
      <section id="templates" className="border-b border-[#e6e3dd] bg-white py-20 overflow-hidden">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8c8780]">DESIGN-FIRST TEMPLATES</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1e1c1a] mt-2 mb-3 tracking-tight">
              Built for real estate conversion
            </h2>
            <p className="text-[#68645e] text-sm sm:text-base">
              Explore proven layouts across Instagram, Facebook, LinkedIn, MLS, and print flyers.
            </p>
          </div>
        </div>

        <div className="relative w-full overflow-hidden">
          <Marquee pauseOnHover className="[--duration:30s] mb-4">
            {showcaseTemplates.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </Marquee>
          <Marquee reverse pauseOnHover className="[--duration:30s]">
            {showcaseTemplates.map((template) => (
              <TemplateCard key={`reverse-${template.id}`} template={template} />
            ))}
          </Marquee>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-24 sm:w-48 bg-gradient-to-r from-white to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-24 sm:w-48 bg-gradient-to-l from-white to-transparent z-10" />
        </div>
      </section>

      {/* ── OLD VS NEW WORKFLOW COMPARISON ────────────────────────────── */}
      <section id="comparison" className="border-b border-[#e6e3dd] bg-[#faf9f6] py-20">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8c8780]">THE SHIFT</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1e1c1a] mt-2 mb-3 tracking-tight">
              Why real estate pros choose Buildographic
            </h2>
            <p className="text-[#68645e] text-sm sm:text-base">
              Stop wrestling with generic design tools or waiting days on freelance agencies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="p-8 rounded-[24px] bg-red-50/50 border border-red-200/80">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold">
                  <X className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-red-950">The Old Workflow</h3>
                  <p className="text-xs text-red-700">Canva, Photoshop, or Freelance Agencies</p>
                </div>
              </div>
              <ul className="space-y-4 text-sm text-red-900/90 font-medium">
                {oldWorkflow.map((item) => (
                  <li key={item.text} className="flex items-start gap-3">
                    <item.icon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-8 rounded-[24px] bg-brandOrangeLight border border-brandOrange/30 shadow-sm relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-brandOrange/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-brandOrange text-white flex items-center justify-center font-bold">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#1e1c1a]">The Buildographic Way</h3>
                  <p className="text-xs text-brandOrange font-bold">AI Design Studio & Canvas Editor</p>
                </div>
              </div>
              <ul className="space-y-4 text-sm text-[#1e1c1a] font-semibold">
                {newWorkflow.map((item) => (
                  <li key={item.text} className="flex items-start gap-3">
                    <item.icon className="w-5 h-5 text-brandOrange flex-shrink-0 mt-0.5" />
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING SNAPSHOT — real PLAN_CONFIG data, 3-tier teaser (Item 6) ──────────── */}
      <section className="py-24 bg-[#22201d] text-white border-b border-white/10" id="pricing">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brandOrange/20 text-brandOrange text-xs font-bold uppercase tracking-wider mb-3">
              Output-Based Pricing
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
              Pay for results, not idle seats.
            </h2>
            <p className="mt-4 text-white/70 text-base sm:text-lg">
              No designer retainers. Scale your listing marketing on transparent monthly or annual plans.
            </p>

            <div className="mt-8 inline-flex items-center p-1 rounded-full bg-white/10 border border-white/15">
              <button
                onClick={() => setIsAnnualGlobal(false)}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${!isAnnualGlobal ? "bg-brandOrange text-white" : "text-white/70 hover:text-white"}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsAnnualGlobal(true)}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${isAnnualGlobal ? "bg-brandOrange text-white" : "text-white/70 hover:text-white"}`}
              >
                <span>Annual</span>
                {/* "2 months free" is the exact, always-true description of the x10 annual formula
                    — a flat percentage claim would be wrong for at least one tier's real math,
                    same reasoning as PricingPage.tsx's hero toggle. */}
                <span className="px-1.5 py-0.5 rounded bg-brandEmerald text-white text-[10px] font-extrabold">2 months free</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {PUBLIC_TEASER_TIERS.map((tier) => {
              const config = PLAN_CONFIG[tier];
              const tierPricing = pricingByTier.get(tier);
              const monthly = tierPricing?.monthly;
              const annual = tierPricing?.annual;
              const showAnnualToggle = (monthly?.regularPrice ?? 0) > 0;
              const isAnnual = isAnnualGlobal && showAnnualToggle;
              const active = isAnnual ? annual : monthly;
              const hasFoundingPrice =
                active != null && active.campaignId != null && active.effectivePrice !== active.regularPrice;
              const displayPrice = isAnnual
                ? Math.round((annual?.effectivePrice ?? 0) / 12)
                : (monthly?.effectivePrice ?? 0);
              const isMostPopular = tier === "SOLO";

              return (
                <div
                  key={tier}
                  className={`p-8 rounded-[24px] flex flex-col justify-between relative ${
                    isMostPopular
                      ? "bg-[#2a2825] border-2 border-brandOrange shadow-[0_0_50px_-10px_rgba(235,94,40,0.35)]"
                      : "bg-white/[0.06] border border-white/10 backdrop-blur-sm"
                  }`}
                >
                  {isMostPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-brandOrange text-white text-[11px] font-extrabold tracking-wider uppercase">
                      Most Popular
                    </div>
                  )}
                  <div>
                    <div className={`text-xs font-bold uppercase mb-2 ${isMostPopular ? "text-brandOrange" : "text-white/60"}`}>
                      {config.name}
                    </div>
                    <div className="flex items-baseline gap-1 mb-1">
                      {hasFoundingPrice && (
                        <span className="text-lg text-white/40 line-through">₹{(active?.regularPrice ?? 0).toLocaleString()}</span>
                      )}
                      <span className="text-4xl font-extrabold text-white">₹{displayPrice.toLocaleString()}</span>
                      <span className="text-xs text-white/60">/month</span>
                    </div>
                    {hasFoundingPrice && active?.badge && (
                      <div className="text-[11px] font-bold text-brandOrange mb-3">{active.badge}</div>
                    )}
                    <p className="text-xs text-white/60 mb-6 mt-3">{teaserDescriptions[tier]}</p>
                    <ul className={`space-y-3 text-xs font-medium mb-8 ${isMostPopular ? "text-white/90" : "text-white/80"}`}>
                      {config.features.slice(0, 4).map((feature) => (
                        <li key={feature} className="flex items-center gap-2.5">
                          <Check className={`w-4 h-4 ${isMostPopular ? "text-brandOrange" : "text-brandEmerald"}`} />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Link
                    href={tier === "FREE" ? "/auth" : "/pricing"}
                    className={`w-full py-3 rounded-[12px] text-center text-xs font-bold transition-colors ${
                      isMostPopular ? "bg-brandOrange hover:bg-brandOrangeHover text-white" : "bg-white/10 hover:bg-white/20 text-white"
                    }`}
                  >
                    {tier === "FREE" ? "Get Started Free" : `Get started with ${config.name}`}
                  </Link>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-10">
            <Link href="/pricing" className="inline-flex items-center gap-2 text-sm font-semibold text-white/70 hover:text-white transition-colors">
              <span>Need API access or Enterprise Brokerage plans?</span>
              <span className="text-brandOrange underline">View Full Pricing Table →</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section id="faq" className="border-b border-[#e6e3dd] bg-[#faf9f6] py-20">
        <div className="max-w-[800px] mx-auto px-4 sm:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8c8780]">COMMON QUESTIONS</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1e1c1a] mt-2 mb-3 tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`faq-${index}`}
                className="bg-white rounded-[12px] border border-[#e6e3dd] px-5 shadow-sm overflow-hidden"
              >
                <AccordionTrigger className="text-left text-[#1e1c1a] hover:no-underline py-4 text-sm font-bold [&>svg]:text-[#8c8780]">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-[#68645e] pb-4 text-xs leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ── BOTTOM CTA — no fabricated customer count (Item 2) ─────────── */}
      <section className="border-b border-[#e6e3dd] bg-white py-20 text-center">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-8">
          <div className="max-w-3xl mx-auto space-y-5">
            <span className="text-xs font-bold uppercase tracking-wider text-brandOrange bg-brandOrange/10 border border-brandOrange/20 px-3.5 py-1 rounded-full">
              ⚡ GET STARTED FREE — NO CREDIT CARD REQUIRED
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#1e1c1a] tracking-tight">
              Ready to 10x your listing marketing?
            </h2>
            <p className="text-[#68645e] text-sm sm:text-base max-w-xl mx-auto">
              Create stunning, on-brand marketing materials in seconds — start free, upgrade when you're ready.
            </p>
            <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/auth?provider=google"
                className="inline-flex items-center gap-2.5 bg-white hover:bg-gray-50 text-[#1e1c1a] text-sm font-semibold px-6 py-3.5 rounded-full border border-black/15 shadow-sm transition active:scale-95"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span>Continue with Google</span>
              </Link>
              <Link
                href="/auth"
                className="inline-flex items-center gap-2 bg-[#2a2825] hover:bg-[#1e1c1a] text-white text-sm font-bold px-6 py-3.5 rounded-full shadow-sm transition active:scale-95"
              >
                <span>Create your first marketing design free</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="pt-1">
              <Link href="/pricing" className="inline-flex items-center text-xs font-semibold text-[#68645e] hover:text-[#1e1c1a] transition">
                Explore pricing & plans →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER — real links, no fabricated version/status claims (Item 9) ─────────── */}
      <footer className="bg-[#faf9f6] py-14 text-xs text-[#68645e]">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2.5 font-bold text-sm text-[#1e1c1a] mb-3">
                <img src="/logo-icon-option6.png" alt="" className="h-6 w-6" />
                <span>Buildographic</span>
              </Link>
              <p className="text-[11px] text-[#8c8780] leading-relaxed">
                Create stunning property marketing designs for your listings.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-[#1e1c1a] mb-3">Product</h4>
              <ul className="space-y-2">
                <li><Link href="/templates" className="hover:text-[#1e1c1a]">Templates</Link></li>
                <li><Link href="/pricing" className="hover:text-[#1e1c1a]">Pricing</Link></li>
                <li><a href="#studio" className="hover:text-[#1e1c1a]">Canvas Editor</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-[#1e1c1a] mb-3">Solutions</h4>
              <ul className="space-y-2">
                <li><a href="#solutions" className="hover:text-[#1e1c1a]">For Agents</a></li>
                <li><a href="#solutions" className="hover:text-[#1e1c1a]">For Teams</a></li>
                <li><a href="#solutions" className="hover:text-[#1e1c1a]">For Brokerages</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-[#1e1c1a] mb-3">Resources</h4>
              <ul className="space-y-2">
                <li><a href="#faq" className="hover:text-[#1e1c1a]">Help Center</a></li>
                <li><a href="#templates" className="hover:text-[#1e1c1a]">Templates Gallery</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-[#1e1c1a] mb-3">Legal</h4>
              <ul className="space-y-2">
                <li><a href="/terms" className="hover:text-[#1e1c1a]">Terms of Service</a></li>
                <li><a href="/privacy" className="hover:text-[#1e1c1a]">Privacy Policy</a></li>
                <li><a href="/refund-policy" className="hover:text-[#1e1c1a]">Refund &amp; Cancellation</a></li>
                <li><a href="/cookies" className="hover:text-[#1e1c1a]">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-6 border-t border-[#e6e3dd] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#8c8780]">
            <div>© 2026 Buildographic. All rights reserved.</div>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-[#1e1c1a] transition-colors"><Linkedin className="h-4 w-4" /></a>
              <a href="#" className="hover:text-[#1e1c1a] transition-colors"><Twitter className="h-4 w-4" /></a>
              <a href="#" className="hover:text-[#1e1c1a] transition-colors"><Youtube className="h-4 w-4" /></a>
              <a href="#" className="hover:text-[#1e1c1a] transition-colors"><Instagram className="h-4 w-4" /></a>
            </div>
            <div>Designed for real estate professionals</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
