import { useState, useEffect, useRef } from "react";
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
  Users,
  Zap,
  Target,
  TrendingUp,
  FileImage,
  Smartphone,
  Monitor,
  Printer,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Asset imports for easy replacement
import carouselImage1 from "@/assets/images/carousel/property-1.jpg";
import carouselImage2 from "@/assets/images/carousel/property-2.jpg";
import carouselImage3 from "@/assets/images/carousel/property-3.jpg";
import heroVideo from "@/assets/videos/hero-background.mp4";

// Floating typography characters for dark sections
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

// Showcase images for carousel - update these imports to change images
const showcaseImages = [
  {
    id: 1,
    title: "Modern Property Listing",
    image: carouselImage1,
    badge: "Featured Template",
  },
  {
    id: 2,
    title: "Luxury Home Showcase",
    image: carouselImage2,
    badge: "Most Popular",
  },
  {
    id: 3,
    title: "Commercial Property",
    image: carouselImage3,
    badge: "New",
  },
];

// Template gallery slides for different media formats
const templateGallerySlides = [
  { id: 1, title: "Instagram Story", format: "9:16", image: carouselImage1 },
  { id: 2, title: "Facebook Post", format: "1:1", image: carouselImage2 },
  { id: 3, title: "LinkedIn Banner", format: "16:9", image: carouselImage3 },
  { id: 4, title: "Print Flyer", format: "A4", image: carouselImage1 },
  { id: 5, title: "Email Header", format: "3:1", image: carouselImage2 },
];

// Pain point cards data
const painPointCards = [
  {
    icon: Zap,
    title: "Time-Consuming Design",
    description: "Stop spending hours on design tools. Create professional infographics in minutes, not days.",
  },
  {
    icon: Target,
    title: "Inconsistent Branding",
    description: "Maintain brand consistency across all your marketing materials with custom templates.",
  },
  {
    icon: TrendingUp,
    title: "Low Engagement",
    description: "Boost your listing views with eye-catching visuals that stand out in crowded feeds.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Share templates and assets across your entire team or brokerage seamlessly.",
  },
];

// USP Features data
const uspFeatures = [
  {
    title: "Built for Teams",
    description: "Collaborate with your team in real-time. Share templates, maintain brand consistency, and scale your marketing.",
    icon: Users,
  },
  {
    title: "Multi-Agent Support",
    description: "Perfect for brokerages with multiple agents. Each agent gets their own workspace with shared resources.",
    icon: Building2,
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
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);
  const [showLogoReveal, setShowLogoReveal] = useState(false);
  const [templateSlide, setTemplateSlide] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % showcaseImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + showcaseImages.length) % showcaseImages.length);
  };

  // Auto-slide carousel with pause on hover
  useEffect(() => {
    if (isCarouselPaused) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % showcaseImages.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isCarouselPaused]);

  // Auto-slide template gallery
  useEffect(() => {
    const interval = setInterval(() => {
      setTemplateSlide((prev) => (prev + 1) % templateGallerySlides.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Video logo reveal handler
  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      const timeRemaining = videoRef.current.duration - videoRef.current.currentTime;
      if (timeRemaining <= 2) {
        setShowLogoReveal(true);
      } else {
        setShowLogoReveal(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* ==================== HERO SECTION - Full Screen Video ==================== */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Video */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          onTimeUpdate={handleVideoTimeUpdate}
        >
          <source src={heroVideo} type="video/mp4" />
        </video>
        
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/50" />
        
        {/* Navigation Bar */}
        <nav className="absolute top-0 left-0 right-0 z-50 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 text-white font-bold text-xl">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-500 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <span>InfographicAI</span>
            </Link>
            
            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-8 text-white/80">
              <Link href="/templates" className="hover:text-white transition-colors">Templates</Link>
              <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            </div>
            
            {/* Auth Button */}
            <Link href="/auth">
              <Button className="bg-teal-500 hover:bg-teal-600 text-white rounded-full px-6">
                Get Started
              </Button>
            </Link>
          </div>
        </nav>
        
        {/* Hero Content */}
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Create Property
            <br />
            <span className="text-teal-400">Infographics</span> in Minutes
          </h1>
          <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Transform your listings into stunning visuals. Perfect for social media, MLS, and print marketing.
          </p>
          
          {/* Auth Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth">
              <Button
                size="lg"
                className="h-14 px-8 gap-3 rounded-full bg-white hover:bg-gray-100 text-black font-medium text-lg"
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
            <Link href="/auth">
              <Button
                size="lg"
                variant="outline"
                className="h-14 px-8 gap-2 rounded-full border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 font-medium text-lg"
              >
                Continue with Email
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Logo Reveal - Modern Fade/Scale Transition */}
        <div 
          className={`absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-40 transition-all duration-1000 ease-out ${
            showLogoReveal 
              ? 'opacity-100' 
              : 'opacity-0 pointer-events-none'
          }`}
        >
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
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <ChevronDown className="h-8 w-8 text-white/60 animate-bounce" />
        </div>
      </section>

      {/* ==================== PRODUCT HIGHLIGHTS / TRUST SECTION ==================== */}
      <section className="bg-[#0a0a0a] py-12 border-b border-white/10">
        <div className="container px-6 max-w-6xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
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
        </div>
      </section>

      {/* ==================== SHOWCASE CAROUSEL SECTION ==================== */}
      <section className="bg-[#0a0a0a] py-20 md:py-32">
        <div className="container px-6 max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Content */}
            <div>
              <p className="text-xs uppercase tracking-widest text-teal-400 mb-4">
                FEATURED TEMPLATES
              </p>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                Professional Templates
                <br />
                <span className="text-gray-400">for Every Listing</span>
              </h2>
              <p className="text-gray-400 text-lg mb-8">
                Choose from dozens of professionally designed templates. Perfect for property listings, open houses, market stats, and more.
              </p>
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-orange-400 border-2 border-[#0a0a0a]" />
                  <div className="w-8 h-8 rounded-full bg-blue-400 border-2 border-[#0a0a0a]" />
                  <div className="w-8 h-8 rounded-full bg-green-400 border-2 border-[#0a0a0a]" />
                </div>
                <span>Trusted by Real Estate Professionals</span>
              </div>
            </div>
            
            {/* Right: Carousel */}
            <div 
              className="relative"
              onMouseEnter={() => setIsCarouselPaused(true)}
              onMouseLeave={() => setIsCarouselPaused(false)}
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gray-900">
                <div className="relative w-full h-72 md:h-96">
                  {showcaseImages.map((slide, index) => (
                    <div
                      key={slide.id}
                      className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                        index === currentSlide 
                          ? "opacity-100 translate-x-0" 
                          : index < currentSlide 
                            ? "opacity-0 -translate-x-full" 
                            : "opacity-0 translate-x-full"
                      }`}
                    >
                      <img
                        src={slide.image}
                        alt={slide.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 bg-teal-500 text-white text-xs font-medium rounded-full">
                          {slide.badge}
                        </span>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                        <h3 className="text-white text-xl font-semibold">
                          {slide.title}
                        </h3>
                        <p className="text-white/70 text-sm mt-1">
                          Professional real estate infographic template
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Carousel Controls */}
              <div className="flex items-center justify-center gap-4 mt-6">
                <button
                  onClick={prevSlide}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <ChevronLeft className="h-5 w-5 text-white" />
                </button>
                <div className="flex gap-2">
                  {showcaseImages.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentSlide(i)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        i === currentSlide ? "bg-teal-500" : "bg-gray-600"
                      }`}
                    />
                  ))}
                </div>
                <button
                  onClick={nextSlide}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <ChevronRight className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== PAIN POINT CARDS SECTION ==================== */}
      <section id="features" className="bg-[#0a0a0a] py-20 md:py-32 border-t border-white/10">
        <div className="container px-6 max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs uppercase tracking-widest text-teal-400 mb-4">
              WHY INFOGRAPHICAI
            </p>
            <h2 className="text-3xl md:text-5xl font-bold text-white">
              Solve Your Marketing Challenges
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {painPointCards.map((card, index) => (
              <div
                key={index}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-teal-500/20 flex items-center justify-center mb-4">
                  <card.icon className="h-6 w-6 text-teal-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {card.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== USP FEATURES SECTION ==================== */}
      <section className="bg-[#0a0a0a] py-20 md:py-32 border-t border-white/10">
        <div className="container px-6 max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Features */}
            <div>
              <p className="text-xs uppercase tracking-widest text-teal-400 mb-4">
                KEY FEATURES
              </p>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-12">
                Built for Teams
                <br />
                <span className="text-gray-400">& Brokerages</span>
              </h2>
              
              <div className="space-y-8">
                {uspFeatures.map((feature, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                      <feature.icon className="h-6 w-6 text-teal-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Right: Visual */}
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

      {/* ==================== TEMPLATE GALLERY SECTION ==================== */}
      <section className="bg-[#0a0a0a] py-20 md:py-32 border-t border-white/10">
        <div className="container px-6 max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs uppercase tracking-widest text-teal-400 mb-4">
              MULTI-FORMAT SUPPORT
            </p>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              One Listing, Every Format
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Create infographics for Instagram, Facebook, LinkedIn, print flyers, and more. All from a single property entry.
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
          
          {/* Auto-sliding Gallery */}
          <div className="relative overflow-hidden">
            <div 
              className="flex transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${templateSlide * 100}%)` }}
            >
              {templateGallerySlides.map((slide) => (
                <div key={slide.id} className="w-full flex-shrink-0 px-4">
                  <div className="relative rounded-2xl overflow-hidden bg-gray-900 aspect-video max-w-2xl mx-auto">
                    <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
                    <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm rounded-full px-4 py-2">
                      <p className="text-white text-sm font-medium">{slide.title}</p>
                      <p className="text-gray-400 text-xs">{slide.format}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Gallery Dots */}
            <div className="flex items-center justify-center gap-2 mt-6">
              {templateGallerySlides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setTemplateSlide(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === templateSlide ? "bg-teal-500" : "bg-gray-600"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FAQ SECTION ==================== */}
      <section id="faq" className="relative bg-[#0a0a0a] py-20 md:py-32 overflow-hidden border-t border-white/10">
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
        <div className="absolute inset-0 bg-sky-400/20" />
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

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* ==================== FOOTER ==================== */}
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
                Create stunning property infographics for your listings. Perfect
                for agents, teams, and brokerages.
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
                <li><a href="/pricing#enterprise" className="hover:text-black">Enterprise</a></li>
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
                <li><a href="#" className="hover:text-black">Careers</a></li>
                <li><a href="/terms" className="hover:text-black">Terms of Service</a></li>
                <li><a href="/privacy" className="hover:text-black">Privacy Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">COPYRIGHT InfographicAI 2025</p>
            <p className="text-sm text-gray-500">DESIGNED FOR REAL ESTATE PROFESSIONALS</p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-gray-500 hover:text-black transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-500 hover:text-black transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-500 hover:text-black transition-colors">
                <Youtube className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-500 hover:text-black transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
