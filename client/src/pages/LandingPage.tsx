import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Marquee } from "@/components/ui/marquee";
import {
  Building2,
  ArrowRight,
  ChevronDown,
  Linkedin,
  Twitter,
  Youtube,
  Instagram,
  Users,
  Zap,
  Target,
  TrendingUp,
  FileImage,
  Smartphone,
  Monitor,
  Printer,
  Check,
  Gift,
  Star,
  Building,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import carouselImage1 from "@/assets/images/carousel/property-1.jpg";
import carouselImage2 from "@/assets/images/carousel/property-2.jpg";
import carouselImage3 from "@/assets/images/carousel/property-3.jpg";
import heroVideo from "@/assets/videos/hero-background.mp4";

const darkFloatingChars = [
  { char: "A", top: "10%", left: "3%", opacity: 0.15 },
  { char: "+", top: "15%", left: "12%", opacity: 0.1 },
  { char: "8", top: "20%", left: "8%", opacity: 0.12 },
  { char: "X", top: "25%", left: "18%", opacity: 0.08 },
  { char: "R", top: "12%", left: "25%", opacity: 0.1 },
  { char: "Q", top: "8%", left: "85%", opacity: 0.1 },
  { char: "+", top: "15%", left: "90%", opacity: 0.08 },
  { char: "U", top: "22%", left: "82%", opacity: 0.12 },
  { char: "S", top: "30%", left: "88%", opacity: 0.1 },
];

const showcaseTemplates = [
  { id: 1, title: "Modern Property Listing", format: "Instagram Story", image: carouselImage1, badge: "9:16" },
  { id: 2, title: "Luxury Home Showcase", format: "Facebook Post", image: carouselImage2, badge: "1:1" },
  { id: 3, title: "Commercial Property", format: "LinkedIn Banner", image: carouselImage3, badge: "16:9" },
  { id: 4, title: "Open House Flyer", format: "Print Ready", image: carouselImage1, badge: "A4" },
  { id: 5, title: "Market Report", format: "Email Header", image: carouselImage2, badge: "3:1" },
  { id: 6, title: "Agent Branding", format: "MLS Ready", image: carouselImage3, badge: "MLS" },
];

const painPointCards = [
  {
    icon: Zap,
    title: "Time-Consuming Design",
    description: "Create professional infographics in minutes, not days.",
  },
  {
    icon: Target,
    title: "Inconsistent Branding",
    description: "Maintain brand consistency across all marketing materials.",
  },
  {
    icon: TrendingUp,
    title: "Low Engagement",
    description: "Boost listing views with eye-catching visuals.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Share templates and assets across your team.",
  },
];

const faqs = [
  {
    question: "What is InfographicAI and how does it work?",
    answer:
      "InfographicAI transforms your property listings into stunning visual infographics. Enter your property details, choose a template, and our system creates professional marketing materials ready for social media, MLS, and print.",
  },
  {
    question: "What can I create with InfographicAI?",
    answer:
      "Property listing infographics, open house flyers, market reports, neighborhood guides, agent branding materials, and social media graphics. All templates are designed specifically for real estate professionals.",
  },
  {
    question: "How does pricing work?",
    answer:
      "We offer flexible plans starting with a free tier that includes 3 infographics per month. Paid plans provide more monthly infographics, custom branding options, and priority support. Annual billing saves you 15%.",
  },
  {
    question: "Do I need design experience?",
    answer:
      "No design experience needed! Our templates are pre-designed by professionals. You just enter your property details and our system handles the layout, typography, and visual design automatically.",
  },
  {
    question: "What formats can I download?",
    answer:
      "Free plans include high-resolution PNG downloads. Paid plans also include PDF export for professional printing, flyers, and MLS uploads.",
  },
];

const pricingPlans = [
  {
    tier: "FREE",
    name: "Free",
    icon: Gift,
    description: "Get started with essential features",
    price: 0,
    features: ["3 infographics per month", "Basic templates", "PNG download", "Watermark included"],
  },
  {
    tier: "SOLO",
    name: "Solo",
    icon: Star,
    description: "Perfect for individual agents",
    price: 999,
    features: ["25 infographics per month", "All templates", "PNG & PDF export", "No watermark", "Custom branding"],
  },
  {
    tier: "TEAM",
    name: "Team",
    icon: Building,
    description: "Built for real estate teams",
    price: 2499,
    features: ["100 infographics per month", "Team workspace", "Brand kit", "Priority support", "API access"],
  },
];

function TemplateCard({ template }: { template: typeof showcaseTemplates[0] }) {
  return (
    <div className="relative group w-[280px] md:w-[320px] rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 border border-white/10 shadow-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl">
      <div className="aspect-[4/3] overflow-hidden">
        <img
          src={template.image}
          alt={template.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      </div>
      <div className="absolute top-3 right-3">
        <span className="px-2 py-1 bg-teal-500/90 text-white text-xs font-medium rounded-full backdrop-blur-sm">
          {template.badge}
        </span>
      </div>
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4">
        <h3 className="text-white font-semibold text-sm">{template.title}</h3>
        <p className="text-gray-400 text-xs mt-0.5">{template.format}</p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [showLogoReveal, setShowLogoReveal] = useState(false);
  const [annualToggles, setAnnualToggles] = useState<Record<string, boolean>>({
    SOLO: false,
    TEAM: false,
  });
  const videoRef = useRef<HTMLVideoElement>(null);

  const toggleAnnual = (tier: string) => {
    setAnnualToggles((prev) => ({ ...prev, [tier]: !prev[tier] }));
  };

  const calculateAnnualPrice = (monthlyPrice: number): number => {
    return Math.round(monthlyPrice * 12 * 0.85);
  };

  const calculateMonthlySavings = (monthlyPrice: number): number => {
    return Math.round(monthlyPrice * 12 * 0.15);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (video.duration - video.currentTime <= 2) {
        setShowLogoReveal(true);
      } else {
        setShowLogoReveal(false);
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => video.removeEventListener("timeupdate", handleTimeUpdate);
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f5f0]">
      {/* ==================== HERO SECTION ==================== */}
      <section className="relative min-h-screen flex flex-col overflow-hidden bg-neutral-800">
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={heroVideo} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/50" />

        <nav className="relative z-20 border-b border-white/10">
          <div className="container flex h-16 items-center justify-between px-6 max-w-6xl mx-auto">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg text-white">
              <Building2 className="h-7 w-7 text-white" />
              <span>InfographicAI</span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <a href="#templates" className="text-sm font-medium text-white/80 hover:text-white">Templates</a>
              <a href="#pricing" className="text-sm font-medium text-white/80 hover:text-white">Pricing</a>
              <a href="#features" className="text-sm font-medium text-white/80 hover:text-white">Features</a>
              <a href="#faq" className="text-sm font-medium text-white/80 hover:text-white">FAQ</a>
              <Link href="/auth">
                <Button className="gap-2 bg-teal-500 hover:bg-teal-600 text-white rounded-full font-medium px-5">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </nav>

        <div className="flex-1 flex items-center justify-center relative z-10">
          <div className="text-center px-6 max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Create Property<br />
              <span className="text-teal-400">Infographics</span> in Minutes
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
              Transform your listings into stunning visuals. Perfect for social media, MLS, and print marketing.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth?provider=google">
                <Button size="lg" className="h-14 px-8 gap-3 rounded-full bg-white hover:bg-gray-100 text-black font-medium text-lg shadow-xl">
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </Button>
              </Link>
              <Link href="/auth">
                <Button size="lg" variant="outline" className="h-14 px-8 gap-2 rounded-full border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 font-medium text-lg">
                  Continue with Email
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className={`absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-40 transition-all duration-1000 ease-out ${showLogoReveal ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className={`flex flex-col items-center gap-4 transition-all duration-700 delay-300 ${showLogoReveal ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'}`}>
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-2xl shadow-teal-500/30">
              <Building2 className="h-12 w-12 md:h-16 md:w-16 text-white" />
            </div>
            <div className="text-center">
              <h3 className="text-3xl md:text-4xl font-bold text-white">InfographicAI</h3>
              <p className="text-gray-400 text-lg mt-2">Real Estate Marketing Made Easy</p>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <ChevronDown className="h-8 w-8 text-white/60 animate-bounce" />
        </div>
      </section>

      {/* ==================== UNIFIED SHOWCASE SECTION ==================== */}
      <section id="templates" className="bg-[#0a0a0a] py-20 md:py-32">
        <div className="container px-6 max-w-6xl mx-auto">
          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 mb-20 pb-12 border-b border-white/10">
            <div className="text-center">
              <p className="text-teal-400 text-2xl md:text-3xl font-bold">2024</p>
              <p className="text-gray-500 text-xs uppercase tracking-wide">Product Launch</p>
            </div>
            <div className="text-center">
              <p className="text-white text-2xl md:text-3xl font-bold">Real Estate</p>
              <p className="text-gray-500 text-xs uppercase tracking-wide">Purpose-Built</p>
            </div>
            <div className="text-center">
              <p className="text-teal-400 text-2xl md:text-3xl font-bold">50+</p>
              <p className="text-gray-500 text-xs uppercase tracking-wide">Templates</p>
            </div>
            <div className="text-center">
              <p className="text-white text-2xl md:text-3xl font-bold">MLS Ready</p>
              <p className="text-gray-500 text-xs uppercase tracking-wide">Export Formats</p>
            </div>
          </div>

          {/* Section Header */}
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-widest text-teal-400 mb-4">TEMPLATE SHOWCASE</p>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Professional Templates for Every Format
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Create infographics for Instagram, Facebook, LinkedIn, print flyers, MLS, and more.
            </p>
          </div>

          {/* Format Icons */}
          <div className="flex items-center justify-center gap-8 mb-12">
            <div className="text-center">
              <Smartphone className="h-8 w-8 text-teal-400 mx-auto mb-2" />
              <p className="text-white text-sm">Social</p>
            </div>
            <div className="text-center">
              <Monitor className="h-8 w-8 text-teal-400 mx-auto mb-2" />
              <p className="text-white text-sm">Web</p>
            </div>
            <div className="text-center">
              <Printer className="h-8 w-8 text-teal-400 mx-auto mb-2" />
              <p className="text-white text-sm">Print</p>
            </div>
            <div className="text-center">
              <FileImage className="h-8 w-8 text-teal-400 mx-auto mb-2" />
              <p className="text-white text-sm">MLS</p>
            </div>
          </div>
        </div>

        {/* MagicUI Marquee Showcase */}
        <div className="relative">
          <Marquee pauseOnHover className="[--duration:30s]">
            {showcaseTemplates.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </Marquee>
          <Marquee reverse pauseOnHover className="[--duration:30s] mt-4">
            {showcaseTemplates.map((template) => (
              <TemplateCard key={`reverse-${template.id}`} template={template} />
            ))}
          </Marquee>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-[#0a0a0a]" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-[#0a0a0a]" />
        </div>

        {/* Pain Point Cards */}
        <div className="container px-6 max-w-6xl mx-auto mt-20">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-widest text-teal-400 mb-4">WHY INFOGRAPHICAI</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white">Solve Your Marketing Challenges</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {painPointCards.map((card, index) => (
              <div key={index} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-teal-500/20 flex items-center justify-center mb-4">
                  <card.icon className="h-6 w-6 text-teal-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{card.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{card.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== PRICING SECTION ==================== */}
      <section id="pricing" className="bg-[#f5f5f0] py-20 md:py-32">
        <div className="container px-6 max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs uppercase tracking-widest text-teal-600 mb-4">PRICING</p>
            <h2 className="text-3xl md:text-5xl font-bold text-black mb-4">Simple, Transparent Pricing</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Start free and upgrade as you grow. Annual billing saves 15%.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {pricingPlans.map((plan) => {
              const isAnnual = annualToggles[plan.tier] || false;
              const showAnnualToggle = plan.price > 0;
              const displayPrice = isAnnual ? Math.round(calculateAnnualPrice(plan.price) / 12) : plan.price;
              const savings = calculateMonthlySavings(plan.price);
              const PlanIcon = plan.icon;

              return (
                <div key={plan.tier} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col">
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
                        />
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-gray-500 mb-6">{plan.description}</p>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-black">
                        ₹{displayPrice.toLocaleString()}
                      </span>
                      <span className="text-base text-gray-500">/ month</span>
                      {isAnnual && plan.price > 0 && (
                        <span className="text-sm text-teal-600 font-medium bg-teal-50 px-2 py-0.5 rounded-full">
                          Save ₹{savings.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm text-gray-700">
                        <Check className="h-4 w-4 text-black shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link href="/auth">
                    <Button className="w-full h-12 bg-black hover:bg-gray-800 text-white rounded-full font-medium">
                      Get Started
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-8">
            <Link href="/pricing" className="text-teal-600 hover:text-teal-700 font-medium">
              View all plans and enterprise options →
            </Link>
          </div>
        </div>
      </section>

      {/* ==================== FEATURES SECTION ==================== */}
      <section id="features" className="bg-[#0a0a0a] py-20 md:py-32">
        <div className="container px-6 max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs uppercase tracking-widest text-teal-400 mb-4">KEY FEATURES</p>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-8">
                Built for Teams<br />
                <span className="text-gray-400">& Brokerages</span>
              </h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                    <Users className="h-6 w-6 text-teal-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">Team Workspace</h3>
                    <p className="text-gray-400 text-sm">Share templates and assets across your entire team seamlessly.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-6 w-6 text-teal-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">Multi-Agent Support</h3>
                    <p className="text-gray-400 text-sm">Each agent gets their own workspace with shared resources.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-teal-500/20 to-transparent rounded-3xl p-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                    <Users className="h-8 w-8 text-teal-400 mb-2" />
                    <p className="text-white font-semibold">Team Workspace</p>
                    <p className="text-gray-400 text-xs mt-1">Share templates & assets</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                    <Building2 className="h-8 w-8 text-teal-400 mb-2" />
                    <p className="text-white font-semibold">Multi-Agent</p>
                    <p className="text-gray-400 text-xs mt-1">Individual workspaces</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                    <Target className="h-8 w-8 text-teal-400 mb-2" />
                    <p className="text-white font-semibold">Brand Kit</p>
                    <p className="text-gray-400 text-xs mt-1">Custom branding</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                    <Zap className="h-8 w-8 text-teal-400 mb-2" />
                    <p className="text-white font-semibold">Instant Export</p>
                    <p className="text-gray-400 text-xs mt-1">PNG, PDF, Print</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FAQ SECTION ==================== */}
      <section id="faq" className="relative bg-[#0a0a0a] py-20 md:py-32 overflow-hidden border-t border-white/10">
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
          {darkFloatingChars.map((item, i) => (
            <span
              key={i}
              className="absolute text-3xl md:text-5xl lg:text-6xl font-bold text-gray-600"
              style={{ top: item.top, left: item.left, opacity: item.opacity * 0.7 }}
            >
              {item.char}
            </span>
          ))}
        </div>

        <div className="container px-6 max-w-3xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">FREQUENTLY ASKED QUESTIONS</p>
            <h2 className="text-2xl md:text-4xl font-bold text-white">Curious about InfographicAI?</h2>
            <p className="text-xl md:text-2xl font-bold text-white">We got you covered</p>
          </div>

          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`faq-${index}`}
                className="bg-white/5 rounded-xl border border-white/10 px-6 overflow-hidden"
              >
                <AccordionTrigger className="text-left text-white hover:no-underline py-5 text-base md:text-lg font-medium">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-400 pb-5 text-sm md:text-base leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ==================== CTA SECTION ==================== */}
      <section
        className="relative py-32 md:py-48 overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1600&h=900&fit=crop')" }}
      >
        <div className="absolute inset-0 bg-sky-400/20" />
        <div className="container px-6 max-w-4xl mx-auto relative z-10 text-center">
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 drop-shadow-lg">Start creating</h2>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-10 drop-shadow-lg">on InfographicAI today.</h2>
          <Link href="/auth">
            <Button size="lg" className="h-14 px-8 gap-2 rounded-full bg-white hover:bg-gray-100 text-black font-medium text-lg shadow-xl">
              Get Started <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#f5f5f0] to-transparent" />
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer className="bg-[#f5f5f0] border-t border-gray-200 py-16">
        <div className="container px-6 max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2 font-bold text-xl text-black mb-4">
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
                <li><Link href="/templates" className="hover:text-black">Templates</Link></li>
                <li><Link href="/pricing" className="hover:text-black">Pricing</Link></li>
                <li><a href="#" className="hover:text-black">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-black mb-4">Solutions</h4>
              <ul className="space-y-3 text-sm text-gray-600">
                <li><a href="#" className="hover:text-black">For Agents</a></li>
                <li><a href="#" className="hover:text-black">For Teams</a></li>
                <li><a href="#" className="hover:text-black">For Brokerages</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-black mb-4">Resources</h4>
              <ul className="space-y-3 text-sm text-gray-600">
                <li><a href="#" className="hover:text-black">Help Center</a></li>
                <li><a href="#" className="hover:text-black">Tutorials</a></li>
                <li><a href="#" className="hover:text-black">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-black mb-4">Company</h4>
              <ul className="space-y-3 text-sm text-gray-600">
                <li><a href="#" className="hover:text-black">About</a></li>
                <li><a href="/terms" className="hover:text-black">Terms of Service</a></li>
                <li><a href="/privacy" className="hover:text-black">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">COPYRIGHT InfographicAI 2025</p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-gray-500 hover:text-black transition-colors"><Linkedin className="h-5 w-5" /></a>
              <a href="#" className="text-gray-500 hover:text-black transition-colors"><Twitter className="h-5 w-5" /></a>
              <a href="#" className="text-gray-500 hover:text-black transition-colors"><Youtube className="h-5 w-5" /></a>
              <a href="#" className="text-gray-500 hover:text-black transition-colors"><Instagram className="h-5 w-5" /></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
