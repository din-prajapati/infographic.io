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
- **Google OAuth**: Passport.js Google strategy (`passport-google-oauth20`)
  - Strategy: `api/src/modules/auth/strategies/google.strategy.ts`
  - Routes: `GET /api/v1/auth/google` (initiate), `GET /api/v1/auth/google/callback` (callback)
  - Callback redirects to `/auth/callback` with token in URL params
  - Frontend callback handler: `client/src/pages/AuthCallbackPage.tsx`
  - User fields: `googleId`, `avatarUrl`, `provider` added to User model
  - Auto-creates organization for new Google users, links existing accounts by email
  - Requires secrets: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

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

### February 2026 - Landing Page Unified Redesign with MagicUI Marquee
- **Hero Section**: Full-screen video background with:
  - Navigation bar overlay (logo, links, Get Started button)
  - Centered headline and auth buttons (Google/Email)
  - Logo reveal transition at video end (fade/scale effect)
  - Scroll indicator at bottom
- **Unified Showcase Section**: Merged multiple sections into one cohesive section
  - Trust badges bar (2024 Launch, Purpose-Built, 50+ Templates, MLS Ready)
  - Format icons (Social, Web, Print, MLS)
  - **MagicUI-style Marquee**: Dual-row infinite horizontal scroll with template cards
    - Component: `client/src/components/ui/marquee.tsx`
    - Tailwind animations in `tailwind.config.ts` (marquee, marquee-reverse keyframes)
    - 6 template cards with images, badges, titles
    - Pause on hover, edge fade gradients
  - Pain point cards (4 cards solving real estate challenges)
- **Embedded Pricing Section**: 3-tier pricing on landing page
  - Free (₹0), Solo (₹999), Team (₹2499)
  - Per-card Annual toggle switches (not global)
  - 15% annual discount with savings badges
- **Features Section**: Built for Teams & Brokerages grid
- **FAQ Section**: Dark accordion with floating typography
- **CTA Section**: Sky background with call-to-action
- **Footer**: Multi-column with social icons

### Switch Component Styling
- High visibility styling: `bg-blue-600` (checked), `bg-gray-200` (unchecked)
- 2px borders for clear visibility
- Location: `client/src/components/ui/switch.tsx`

### Pricing Page (Standalone)
- Per-card Annual toggle switches
- Different pricing: Free ₹0, Solo ₹2,999, Team ₹6,999
- Individual/Enterprise tab toggle
- Savings badges showing annual discount

### Asset Organization
- `client/src/assets/images/carousel/` - Property images for marquee/carousel
- `client/src/assets/images/logo/` - Product logos
- `client/src/assets/videos/` - Hero background video
- All assets imported at top of LandingPage.tsx for easy replacement

### February 2026 - Google OAuth Backend Integration
- **Passport.js Google Strategy**: Full OAuth 2.0 flow with `passport-google-oauth20`
  - New strategy file: `api/src/modules/auth/strategies/google.strategy.ts`
  - GoogleStrategy registered in AuthModule providers
  - AuthService `googleLogin()` method: finds/creates user by googleId or email
  - Auto-creates organization with free tier for new Google sign-ups
  - Links existing email accounts to Google if user signs in with same email
- **Database Schema**: Added `googleId` (unique), `avatarUrl`, `provider` fields to User model
- **Auth Routes**: `GET /api/v1/auth/google` and `GET /api/v1/auth/google/callback`
- **Frontend Callback**: `AuthCallbackPage.tsx` at `/auth/callback` route
  - Parses token and user from URL params after Google redirect
  - Stores in AuthProvider context and localStorage
  - Redirects to `/templates` on success
- **Auth Page**: Frosted glass split-panel design with property image carousel
  - Black "Continue with Google" and "Login" buttons
  - Responsive layout: side-by-side on desktop, stacked on mobile

### February 2026 - User Limit Enforcement & Usage Analytics
- **User Limit Enforcement**: 
  - New `UsersService` (`api/src/modules/users/`) with user limit checking
  - `PLAN_USER_LIMITS` config defines userLimit per plan tier (FREE=1, SOLO=1, TEAM=5, BROKERAGE=unlimited)
  - Auth registration enforces limits when joining existing organizations via `organizationId`
  - New API endpoints: `/api/v1/users/organization`, `/api/v1/users/organization/members`, `/api/v1/users/organization/slots`
- **Usage Analytics Dashboard**:
  - New page at `/usage` route (`client/src/pages/UsageDashboardPage.tsx`)
  - Displays current plan, monthly usage, total generated, total cost
  - Monthly usage bar chart, cost breakdown by AI model
  - Recent activity table with detailed history
  - CSV/JSON export functionality
  - Links to existing backend endpoints: `/api/v1/payments/usage/*`
- **PLAN_CONFIG Update**: Added `userLimit` field to all plan tiers in `shared/schema.ts`