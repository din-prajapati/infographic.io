# Infographic Editor - Unified Project

## Overview

This is an AI-powered infographic editor platform designed for real estate professionals. The application enables users to create, edit, and export professional infographics using a canvas-based editor with AI assistance. The platform follows a dual-revenue model with B2C web UI subscriptions and planned B2B API access.

The core value proposition is allowing real estate agents to quickly generate branded infographics for property listings, open houses, market stats, and agent branding materials.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with path aliases (`@/` for client/src, `@shared/` for shared)
- **Routing**: Wouter (lightweight React router)
- **State Management**: Zustand for canvas state, TanStack React Query for server state
- **UI Components**: shadcn/ui built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system (neutral color palette, 12px border radius)
- **Canvas**: Custom React + SVG implementation with drag/resize capabilities

### Backend Architecture
- **Primary API**: NestJS (TypeScript) running on port 3001
- **Proxy Server**: Express.js running on port 5000, proxies `/api/v1/*` to NestJS
- **Module Structure**: Feature-based modules (auth, infographics, templates, ai-generation, designs, conversations, payments)
- **Authentication**: JWT-based with Passport.js integration
- **Rate Limiting**: NestJS Throttler for API protection

### Database
- **ORM**: Dual setup - Prisma for NestJS modules, Drizzle for Express routes
- **Database**: PostgreSQL (Neon serverless)
- **Schema Location**: `shared/schema.ts` (Drizzle), `api/prisma/schema.prisma` (Prisma)
- **Key Entities**: Users, Organizations, Subscriptions, Payments, Templates, Infographics

### AI Integration
- **Text Analysis**: OpenAI GPT for property data extraction and structured output
- **Image Generation**: Ideogram API for infographic visuals
- **Orchestration**: Custom AI orchestrator service combining multiple AI providers

### Authentication Flow
- JWT tokens with refresh capability
- AuthProvider context wrapping the application
- Protected routes using Wouter with redirect to `/auth`
- Dual auth support: JWT for web users, API keys for B2B access

## External Dependencies

### Payment Providers
- **RazorPay**: Primary for India/INR transactions
- **Stripe**: International payments (USD/EUR), feature-flagged via `STRIPE_ENABLED`
- **Architecture**: Provider-agnostic factory pattern allowing runtime provider selection
- **Webhooks**: Raw body parsing required for signature verification

### AI Services
- **OpenAI API**: GPT models for text processing and property data extraction
- **Ideogram API**: Image generation for infographic visuals
- **Google API**: Additional AI capabilities

### Infrastructure
- **Database**: Neon PostgreSQL (serverless, auto-pause enabled)
- **File Storage**: Not yet implemented (planned for user uploads)
- **Deployment**: Designed for Replit deployment with hybrid Cursor development support

### Frontend Libraries
- **@tanstack/react-query**: Server state management and caching
- **framer-motion**: Animations throughout the UI
- **html2canvas**: Canvas export (note: OKLCH color compatibility issues documented)
- **Radix UI**: Accessible component primitives
- **Zod**: Schema validation shared between frontend and backend

### Development Tools
- **TypeScript**: Strict mode enabled across all packages
- **ESBuild**: Production bundling for server
- **cross-env**: Cross-platform environment variable handling

## Recent Changes

### February 2026 - Landing & Pricing Page Redesign
- **UI Style**: Redesigned LandingPage.tsx and PricingPage.tsx following Emergent.sh aesthetic
- **Landing Page Features**:
  - Split-screen hero: Left side with floating typography background + auth buttons, right side with showcase carousel
  - Product video section with dark background and floating decorative letters
  - FAQ accordion with dark background, real estate-focused questions
  - Sky/clouds CTA section with gradient background
  - Multi-column footer (Product, Solutions, Resources, Company) with social icons
- **Pricing Page Features**:
  - Per-card Annual toggle switches (not global toggle)
  - Savings badges showing "Save 17%" on annual billing
  - 3-column card layout matching Emergent.sh style
  - Dark FAQ section with accordion
- **Content Policy**: Removed inappropriate marketing claims (GPT references, profit margins, specific user counts) and replaced with neutral, feature-focused language
- **Auth Types**: Updated LegacyUser type for auth context compatibility

### February 2026 - Full Landing Page Redesign (Video Hero)
- **Hero Section**: Full-screen video background with:
  - Navigation bar overlay (logo, links, Get Started button)
  - Centered headline and auth buttons (Google/Email)
  - Logo reveal transition at video end (fade/scale effect)
  - Scroll indicator at bottom
- **Product Highlights**: Trust badges section (2024 Launch, Purpose-Built, 50+ Templates, MLS Ready)
- **Showcase Carousel**: 
  - Split layout with content left, carousel right
  - Auto-slides every 4 seconds, pauses on hover
  - Smooth slide transitions with controls
- **Pain Point Cards**: 4 cards solving real estate marketing challenges
- **USP Features**: Built for Teams & Brokerages with visual grid
- **Template Gallery**: Auto-sliding multi-format templates (Social, Web, Print, MLS)
- **FAQ Section**: Dark accordion with floating typography
- **CTA Section**: Sky background with call-to-action
- **Footer**: Multi-column with social icons
- **Asset Organization**:
  - `client/src/assets/images/carousel/` - Carousel property images
  - `client/src/assets/images/logo/` - Product logos
  - `client/src/assets/videos/` - Background videos
  - All assets imported at top of LandingPage.tsx for easy replacement