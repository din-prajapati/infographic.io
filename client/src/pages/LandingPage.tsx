import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Building2,
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Play,
  Linkedin,
  Twitter,
  Youtube,
  Instagram,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Floating typography characters for background effect
const floatingChars = [
  { char: "K", top: "15%", left: "5%", opacity: 0.08 },
  { char: "H", top: "20%", left: "15%", opacity: 0.06 },
  { char: "D", top: "25%", left: "25%", opacity: 0.05 },
  { char: "Q", top: "10%", left: "35%", opacity: 0.07 },
  { char: "V", top: "30%", left: "8%", opacity: 0.04 },
  { char: "μ", top: "35%", left: "20%", opacity: 0.06 },
  { char: "σ", top: "40%", left: "30%", opacity: 0.05 },
  { char: "C", top: "45%", left: "12%", opacity: 0.07 },
  { char: "W", top: "55%", left: "5%", opacity: 0.08 },
  { char: "C", top: "60%", left: "18%", opacity: 0.06 },
  { char: "T", top: "50%", left: "28%", opacity: 0.05 },
  { char: "+", top: "52%", left: "38%", opacity: 0.04 },
  { char: "β", top: "70%", left: "8%", opacity: 0.06 },
  { char: "Q", top: "75%", left: "22%", opacity: 0.05 },
  { char: "A", top: "80%", left: "35%", opacity: 0.04 },
  { char: "@", top: "18%", left: "42%", opacity: 0.03 },
  { char: "G", top: "8%", left: "48%", opacity: 0.05 },
  { char: "V", top: "65%", left: "40%", opacity: 0.04 },
];

// Dark section floating chars
const darkFloatingChars = [
  { char: "A", top: "10%", left: "3%", opacity: 0.15 },
  { char: "+", top: "15%", left: "12%", opacity: 0.1 },
  { char: "8", top: "20%", left: "8%", opacity: 0.12 },
  { char: "X", top: "25%", left: "18%", opacity: 0.08 },
  { char: "R", top: "12%", left: "25%", opacity: 0.1 },
  { char: "N", top: "30%", left: "5%", opacity: 0.12 },
  { char: "+", top: "35%", left: "15%", opacity: 0.08 },
  { char: "Z", top: "40%", left: "22%", opacity: 0.1 },
  { char: "C", top: "45%", left: "8%", opacity: 0.12 },
  { char: "H", top: "50%", left: "18%", opacity: 0.08 },
  { char: "U", top: "55%", left: "3%", opacity: 0.1 },
  { char: "N", top: "60%", left: "12%", opacity: 0.12 },
  { char: "•", top: "65%", left: "20%", opacity: 0.08 },
  { char: "D", top: "70%", left: "6%", opacity: 0.1 },
  { char: "O", top: "75%", left: "15%", opacity: 0.08 },
  { char: "O", top: "80%", left: "25%", opacity: 0.1 },
  // Right side
  { char: "Q", top: "8%", left: "85%", opacity: 0.1 },
  { char: "+", top: "15%", left: "90%", opacity: 0.08 },
  { char: "U", top: "22%", left: "82%", opacity: 0.12 },
  { char: "S", top: "30%", left: "88%", opacity: 0.1 },
  { char: "I", top: "38%", left: "92%", opacity: 0.08 },
  { char: "Z", top: "45%", left: "85%", opacity: 0.1 },
  { char: "O", top: "52%", left: "90%", opacity: 0.12 },
  { char: "U", top: "60%", left: "83%", opacity: 0.08 },
  { char: "+", top: "68%", left: "88%", opacity: 0.1 },
  { char: "A", top: "75%", left: "92%", opacity: 0.08 },
  { char: "S", top: "82%", left: "86%", opacity: 0.1 },
];

// Showcase images for carousel
const showcaseImages = [
  {
    id: 1,
    title: "Modern Property Listing",
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&h=400&fit=crop",
    badge: "Featured Template",
  },
  {
    id: 2,
    title: "Luxury Home Showcase",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop",
    badge: "Most Popular",
  },
  {
    id: 3,
    title: "Commercial Property",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=400&fit=crop",
    badge: "New",
  },
];

// FAQs adapted for real estate
const faqs = [
  {
    question: "What is InfographicAI and how does it work?",
    answer:
      "InfographicAI is a platform that transforms your property listings into stunning visual infographics. Simply enter your property details, choose a template, and our system creates professional marketing materials ready for social media, MLS, and print.",
  },
  {
    question: "What can I create with InfographicAI?",
    answer:
      "You can create property listing infographics, open house flyers, market reports, neighborhood guides, agent branding materials, and social media graphics. All templates are designed specifically for real estate professionals.",
  },
  {
    question: "How does InfographicAI's pricing work?",
    answer:
      "We offer flexible plans starting with a free tier that includes 3 infographics per month. Paid plans provide more monthly infographics, custom branding options, and priority support. Annual billing saves you 15%.",
  },
  {
    question: "Do I need design experience to use InfographicAI?",
    answer:
      "No design experience needed! Our templates are pre-designed by professionals. You just enter your property details and our system handles the layout, typography, and visual design automatically.",
  },
  {
    question: "How is InfographicAI different from other design tools?",
    answer:
      "InfographicAI is purpose-built for real estate. Unlike generic design tools, our templates understand property data, MLS requirements, and real estate marketing best practices. Everything is optimized for agents and brokerages.",
  },
  {
    question: "What formats can I download my infographics in?",
    answer:
      "Free plans include high-resolution PNG downloads perfect for social media. Paid plans also include PDF export for professional printing, flyers, and MLS uploads.",
  },
];

export default function LandingPage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % showcaseImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + showcaseImages.length) % showcaseImages.length);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f0]">
      {/* ==================== HERO SECTION - Split Screen ==================== */}
      <section className="min-h-screen flex flex-col lg:flex-row">
        {/* Left Panel - Auth */}
        <div className="relative flex-1 flex flex-col items-center justify-center px-8 py-16 lg:py-0 overflow-hidden bg-[#f5f5f0]">
          {/* Floating Typography Background */}
          <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
            {floatingChars.map((item, i) => (
              <span
                key={i}
                className="absolute text-4xl md:text-6xl lg:text-7xl font-bold text-gray-400"
                style={{
                  top: item.top,
                  left: item.left,
                  opacity: item.opacity,
                  fontFamily: "system-ui, sans-serif",
                }}
              >
                {item.char}
              </span>
            ))}
          </div>

          {/* Logo */}
          <div className="relative z-10 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-teal-500 flex items-center justify-center shadow-lg">
              <Building2 className="h-8 w-8 text-white" />
            </div>
          </div>

          {/* Headline */}
          <h1 className="relative z-10 text-3xl md:text-4xl lg:text-5xl font-bold text-center text-black mb-2">
            Create Property
          </h1>
          <h2 className="relative z-10 text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-8">
            <span className="text-teal-500">Infographics</span> in minutes
          </h2>

          {/* Auth Buttons */}
          <div className="relative z-10 flex flex-col items-center gap-4 w-full max-w-sm">
            <Link href="/auth" className="w-full">
              <Button
                size="lg"
                className="w-full h-12 gap-3 rounded-full bg-black hover:bg-gray-800 text-white font-medium"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
                  <path
                    fill="#fff"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#fff"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#fff"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#fff"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>
            </Link>

            <span className="text-sm text-gray-500 font-medium">OR</span>

            <Link href="/auth" className="w-full">
              <Button
                size="lg"
                variant="outline"
                className="w-full h-12 gap-2 rounded-full border-2 border-gray-300 bg-white text-black hover:bg-gray-50 font-medium"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Continue with Email
              </Button>
            </Link>
          </div>

          {/* Terms */}
          <p className="relative z-10 text-xs text-gray-500 mt-8 text-center max-w-sm">
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
        </div>

        {/* Right Panel - Showcase */}
        <div className="relative flex-1 flex flex-col items-center justify-center px-8 py-16 lg:py-0 overflow-hidden bg-gradient-to-b from-sky-100 via-sky-200 to-white">
          {/* Cloud background effect */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-60"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1517483000871-1dbf64a6e1c6?w=1200&h=800&fit=crop')",
            }}
          />

          {/* Trusted users badge */}
          <div className="relative z-10 flex items-center gap-2 mb-6">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full bg-orange-400 border-2 border-white" />
              <div className="w-8 h-8 rounded-full bg-blue-400 border-2 border-white" />
              <div className="w-8 h-8 rounded-full bg-green-400 border-2 border-white" />
            </div>
            <span className="text-sm font-medium text-sky-800">
              Trusted by Real Estate Professionals
            </span>
          </div>

          {/* Showcase Carousel */}
          <div className="relative z-10 w-full max-w-lg">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-white">
              <img
                src={showcaseImages[currentSlide].image}
                alt={showcaseImages[currentSlide].title}
                className="w-full h-64 md:h-80 object-cover"
              />
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 bg-teal-500 text-white text-xs font-medium rounded-full">
                  {showcaseImages[currentSlide].badge}
                </span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                <h3 className="text-white text-lg font-semibold">
                  {showcaseImages[currentSlide].title}
                </h3>
                <p className="text-white/80 text-sm">
                  Professional real estate infographic template
                </p>
              </div>
            </div>

            {/* Carousel Controls */}
            <div className="flex items-center justify-center gap-4 mt-4">
              <button
                onClick={prevSlide}
                className="w-10 h-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-md transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-gray-700" />
              </button>
              <div className="flex gap-2">
                {showcaseImages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i === currentSlide ? "bg-teal-500" : "bg-gray-300"
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={nextSlide}
                className="w-10 h-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-md transition-colors"
              >
                <ChevronRight className="h-5 w-5 text-gray-700" />
              </button>
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="relative z-10 flex items-center gap-6 mt-8 text-center">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-teal-500" />
              <p className="text-sm text-gray-700">Instant Generation</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-teal-500" />
              <p className="text-sm text-gray-700">Print Ready</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-teal-500" />
              <p className="text-sm text-gray-700">Custom Branding</p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== PRODUCT VIDEO SECTION ==================== */}
      <section className="relative bg-[#0a0a0a] py-20 md:py-32 overflow-hidden">
        {/* Floating Typography - Dark */}
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

        <div className="container px-6 max-w-5xl mx-auto relative z-10">
          {/* Section Header */}
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-widest text-gray-500 mb-2 flex items-center justify-center gap-2">
              PRODUCT VIDEO <Play className="h-3 w-3" />
            </p>
            <h2 className="text-2xl md:text-4xl font-bold text-white">
              See InfographicAI in Action
            </h2>
          </div>

          {/* Video Placeholder */}
          <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gray-900 aspect-video max-w-3xl mx-auto">
            <img
              src="https://images.unsplash.com/photo-1560520653-9e0e4c89eb11?w=1200&h=675&fit=crop"
              alt="Product demo"
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="absolute right-8 top-1/2 -translate-y-1/2 text-right">
                <p className="text-3xl md:text-5xl font-bold text-white">
                  Ever seen
                </p>
                <p className="text-3xl md:text-5xl font-bold text-white">
                  a listing
                </p>
                <p className="text-3xl md:text-5xl font-bold text-teal-400">
                  sell itself?
                </p>
              </div>
            </div>
            {/* Play Button */}
            <button className="absolute bottom-6 left-6 w-14 h-14 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center backdrop-blur-sm transition-colors">
              <Play className="h-6 w-6 text-white fill-white" />
            </button>
          </div>
        </div>
      </section>

      {/* ==================== FAQ SECTION ==================== */}
      <section className="relative bg-[#0a0a0a] py-20 md:py-32 overflow-hidden">
        {/* Floating Typography - Dark */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
          {darkFloatingChars.map((item, i) => (
            <span
              key={i}
              className="absolute text-3xl md:text-5xl lg:text-6xl font-bold text-gray-600"
              style={{
                top: item.top,
                left: item.left,
                opacity: item.opacity * 0.7,
              }}
            >
              {item.char}
            </span>
          ))}
        </div>

        <div className="container px-6 max-w-3xl mx-auto relative z-10">
          {/* Section Header */}
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

          {/* Accordion FAQs */}
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
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1600&h=900&fit=crop')",
        }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-sky-400/20" />

        {/* Floating Logo */}
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full bg-gradient-to-br from-teal-400 to-teal-500 opacity-80 blur-sm" />

        <div className="container px-6 max-w-4xl mx-auto relative z-10 text-center">
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 drop-shadow-lg">
            Start creating
          </h2>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-10 drop-shadow-lg">
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

        {/* Decorative elements */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer className="bg-[#f5f5f0] border-t border-gray-200 py-16">
        <div className="container px-6 max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            {/* Brand Column */}
            <div className="col-span-2 md:col-span-1">
              <Link
                href="/"
                className="flex items-center gap-2 font-bold text-xl text-black mb-4"
              >
                <Building2 className="h-6 w-6" />
                <span>InfographicAI</span>
              </Link>
              <p className="text-sm text-gray-600 leading-relaxed">
                Create stunning property infographics for your listings. Perfect
                for agents, teams, and brokerages.
              </p>
            </div>

            {/* Product */}
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

            {/* Solutions */}
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
                  <a href="/pricing#enterprise" className="hover:text-black">
                    Enterprise
                  </a>
                </li>
              </ul>
            </div>

            {/* Resources */}
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

            {/* Company */}
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

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">
              COPYRIGHT InfographicAI 2025
            </p>
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
