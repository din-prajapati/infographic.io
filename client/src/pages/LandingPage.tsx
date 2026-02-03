import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Building2,
  ArrowRight,
  Sparkles,
  LayoutTemplate,
  Palette,
  Download,
} from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "AI property infographics",
    description:
      "Generate listing infographics in seconds. GPT-5 analyzes your property and Ideogram creates on-brand visuals for listings and social.",
  },
  {
    icon: LayoutTemplate,
    title: "Templates for every listing",
    description:
      "Choose from templates designed for residential, commercial, and luxury. One-click generation from your listing details.",
  },
  {
    icon: Palette,
    title: "Your branding, everywhere",
    description:
      "Add your logo and brand colors. Solo and above get custom branding so every infographic looks like it came from your team.",
  },
  {
    icon: Download,
    title: "Export for print and web",
    description:
      "Download PNG for social and PDF for print. High-resolution, ready for MLS, flyers, and marketing.",
  },
];

const faqs = [
  {
    question: "How fast can I create an infographic?",
    answer:
      "Most infographics are ready in 15–20 seconds. Enter your listing details, pick a template, and the AI generates the visual.",
  },
  {
    question: "Do I need a credit card to start?",
    answer:
      "No. The Free plan includes 3 infographics per month. Upgrade when you need more listings or custom branding.",
  },
  {
    question: "Is this built for real estate?",
    answer:
      "Yes. InfographicAI is built for agents, teams, and brokerages. Templates and AI are tuned for property listings and marketing.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Nav - white bar, black text, black CTA (Emergent-style) */}
      <nav className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-black">
            <Building2 className="h-7 w-7 text-black" />
            <span>InfographicAI</span>
          </Link>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-sm font-medium text-gray-600 hover:text-black">Features</a>
            <Link href="/pricing" className="text-sm font-medium text-gray-600 hover:text-black">Pricing</Link>
            <a href="#faqs" className="text-sm font-medium text-gray-600 hover:text-black">FAQs</a>
            <a href="/pricing#enterprise" className="text-sm font-medium text-gray-600 hover:text-black">Enterprise</a>
            <Link href="/auth">
              <Button data-testid="nav-get-started" className="bg-black hover:bg-gray-800 text-white rounded-lg gap-2">
                Get Started <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero - Emergent-style: two-line headline, Google + OR + Email */}
      <section className="container px-6 py-16 md:py-24 text-center">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-black mb-2">
          Create Property
        </h1>
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-black mb-10">
          Infographics in minutes
        </h1>
        <div className="flex flex-col items-center justify-center gap-4 max-w-sm mx-auto">
          <Link href="/auth" className="w-full">
            <Button
              size="lg"
              variant="outline"
              className="w-full gap-2 h-12 rounded-lg border-2 border-gray-300 bg-white text-black hover:bg-gray-50 font-medium"
              data-testid="hero-google"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>
          </Link>
          <span className="text-sm text-gray-500 font-medium">OR</span>
          <Link href="/auth" className="w-full">
            <Button
              size="lg"
              className="w-full gap-2 h-12 bg-black hover:bg-gray-800 text-white rounded-lg font-medium"
              data-testid="hero-cta"
            >
              Continue with Email
            </Button>
          </Link>
        </div>
        <p className="text-sm text-gray-500 mt-8">
          By continuing, you agree to our{" "}
          <a href="/terms" className="underline hover:text-black">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="/privacy" className="underline hover:text-black">
            Privacy Policy
          </a>
          .
        </p>
      </section>

      {/* Features - Emergent-style: clean sections, white cards */}
      <section id="features" className="py-20 md:py-28 scroll-mt-20 bg-white">
        <div className="container px-6 max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-3 text-black">
            Built for real estate
          </h2>
          <p className="text-lg text-gray-600 text-center max-w-2xl mx-auto mb-16">
            From single agents to brokerages—create listing infographics that
            match your brand and convert.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="flex flex-col">
                  <div className="h-12 w-12 rounded-xl bg-gray-100 flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-black" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-black">{f.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{f.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing teaser - Emergent-style section */}
      <section className="py-20 md:py-28 bg-gray-50">
        <div className="container px-6 max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black">
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-gray-600 mb-10">
            Start free with 3 infographics per month. Upgrade when you need more
            listings or custom branding.
          </p>
          <Link href="/pricing">
            <Button size="lg" className="gap-2 rounded-lg bg-black hover:bg-gray-800 text-white font-medium" data-testid="see-pricing">
              See pricing <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* FAQ - Emergent-style: minimal cards */}
      <section id="faqs" className="py-20 md:py-28 scroll-mt-20 bg-white">
        <div className="container px-6 max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-black">
            Frequently asked questions
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {faqs.map((faq) => (
              <div key={faq.question} className="border-b border-gray-100 pb-6 md:border-b-0 md:pb-0">
                <h3 className="text-base font-semibold mb-2 text-black">{faq.question}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA - Emergent-style black CTA */}
      <section className="py-20 md:py-28 bg-gray-50">
        <div className="container px-6 max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black">Ready to get started?</h2>
          <p className="text-gray-600 mb-8">
            Create your first property infographic in under a minute.
          </p>
          <Link href="/auth">
            <Button size="lg" className="gap-2 rounded-lg bg-black hover:bg-gray-800 text-white font-medium px-8" data-testid="cta-start">
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer - Emergent-style: Product, Company, links */}
      <footer className="border-t border-gray-200 bg-white py-16 mt-auto">
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
                <a href="/pricing#enterprise" className="hover:text-black">Enterprise</a>
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
