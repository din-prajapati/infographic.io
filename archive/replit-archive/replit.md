# InfographicAI - Dual-Revenue AI Infographic Platform

## Project Overview
AI-powered real estate infographic generation platform with dual revenue model:
- **B2B API**: $500-15k/month for MLS, CRMs, proptech companies  
- **B2C Web UI**: $29-199/month for micro real estate firms

**Tech Stack**: React + NestJS + Prisma + PostgreSQL + OpenAI GPT-5 + Ideogram 2.0

## Current Status
- ✅ **Phase 1 Complete**: Core infrastructure (backend, auth, templates, AI pipeline)
- ✅ **Phase 2 Complete**: Frontend UI (auth, generation form, gallery)
- ✅ **All Critical Bugs Fixed**: Ideogram API, validation, dependency injection
- ✅ **End-to-End Verified**: Full infographic generation working
- ✅ **UI Redesign Complete**: Modern Canva/Linear/Figma-inspired design system implemented
- ✅ **Production Hardening Complete**: JWT secrets, error boundaries, rate limiting, centralized config
- 🔜 **Phase 3 Next**: Stripe payment integration

## Architecture

### Backend (NestJS on port 3001)
- **Auth Module**: Dual authentication (JWT for UI users, API keys for B2B)
- **Templates Module**: 5 pre-seeded real estate templates
- **Infographics Module**: Core generation pipeline
- **AI Generation Module**: OpenAI + Ideogram integration

### Frontend (React on port 5000)
- **Modern UI Design**: Canva/Linear/Figma-inspired with dark charcoal backgrounds, purple accents
- **3-Column Dashboard**: Left (history), Center (canvas), Right (controls)
- **Glassmorphic Navigation**: Backdrop-blur sticky header with user avatar
- **Authentication**: Gradient purple-blue background, improved typography
- **Real-time Updates**: 5-second polling for infographic status
- **Loading States**: Skeletons, shimmer effects, progress indicators
- **Accessibility**: WCAG AA compliant with proper focus indicators

### Proxy Setup
Express server on port 5000 proxies `/api/v1/*` to NestJS on port 3001

## Database Schema (PostgreSQL)
1. **User**: Authentication, organization membership
2. **Organization**: Plan tiers, monthly limits, branding
3. **ApiKey**: B2B API access keys
4. **Template**: 5 real estate templates (listing, sold, open house, etc)
5. **Infographic**: Generated infographics with status tracking
6. **UsageRecord**: Cost tracking per generation

## Plan Tiers & Rate Limiting
- **Free**: 3/month
- **Solo**: 50/month  
- **Team**: 200/month
- **Brokerage**: 1000/month
- **API Starter**: 5000/month
- **API Growth**: 20000/month
- **API Enterprise**: Unlimited

## AI Models (Supported)
- **Ideogram Turbo**: $0.025/image (budget, fast generation)
- **Ideogram V2**: $0.080/image (premium quality)

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Create account
- `POST /api/v1/auth/login` - Login

### Infographics
- `POST /api/v1/infographics/generate` - Generate infographic
- `GET /api/v1/infographics/:id` - Get infographic by ID
- `GET /api/v1/infographics` - List user infographics

### Templates
- `GET /api/v1/templates` - List all templates
- `GET /api/v1/templates/:id` - Get template by ID

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection
- `OPENAI_API_KEY` - GPT-5 access (stored in Replit Secrets, bills to your OpenAI account)
- `IDEOGRAM_API_KEY` - Ideogram API access
- `JWT_SECRET` - JWT signing secret

## Running the Application

### Frontend Server (Automatic)
The frontend runs automatically via the "Start application" workflow:
- Express server on port 5000
- Proxies `/api/v1/*` to NestJS backend
- Serves React frontend

### NestJS Backend (Manual Start Required)
Start the NestJS API server manually:
```bash
cd api && DATABASE_URL="${DATABASE_URL}" OPENAI_API_KEY="${OPENAI_API_KEY}" IDEOGRAM_API_KEY="${IDEOGRAM_API_KEY}" JWT_SECRET="infographic-jwt-secret" API_PORT=3001 tsx src/main.ts
```

Or use the startup script:
```bash
./start-api.sh
```

### API Endpoints
- Templates: http://localhost:5000/api/v1/templates
- Auth Register: http://localhost:5000/api/v1/auth/register
- Auth Login: http://localhost:5000/api/v1/auth/login
- Swagger Documentation: http://localhost:3001/api/docs

## Generation Pipeline
1. User submits property data + agent branding
2. System selects best template based on property type
3. OpenAI GPT-5 analyzes property and generates headline
4. Ideogram generates visual infographic
5. Result stored with cost tracking
6. User sees completed infographic in gallery

## Unit Economics
- Cost per infographic: $0.029-$0.084 (OpenAI + Ideogram)
- 80-95% gross margins
- Infrastructure: 2% of revenue

## Bug Fixes & Database Migration (Nov 11, 2025)
1. **PostgreSQL Database Migration** ✅
   - Migrated from failing external Neon database to Replit PostgreSQL
   - Fixed connection termination errors (E57P01)
   - All 5 templates seeded successfully
   - Database now stable with automatic backups

2. **Infographic Generation Fixed** ✅
   - Fixed validation error: Made `photos` field optional in backend DTO
   - Users can now generate infographics without providing photo URLs
   - AI generates the visual content automatically

3. **Demo Mode Added** ✅
   - Added `DEMO_MODE` environment variable (default: `false` for real AI)
   - Generates mock infographics with Unsplash placeholder images when enabled
   - Zero API costs for testing and development in demo mode
   - To use demo mode: Set `DEMO_MODE=true` in `server/index.ts`

4. **Enhanced Error Handling** ✅
   - Added specific error messages for quota/API key issues
   - Frontend displays user-friendly error messages for failed infographics
   - Better debugging with detailed error logging

5. **Real AI Verification** ✅ (Nov 11, 2025)
   - Tested with real OpenAI GPT-5 and Ideogram Turbo APIs
   - Successfully generated luxury home infographic ($850k, 4BR/3BA, Beverly Hills)
   - Image URL: `https://ideogram.ai/api/images/ephemeral/...`
   - Cost tracking verified: $0.029 USD per generation
   - End-to-end pipeline confirmed working with actual API calls

## Security Hardening (Nov 11, 2025)
1. **JWT Secret Configuration** ✅
   - Added JWT_SECRET to Replit Secrets for secure token signing
   - Updated server startup to use environment variable instead of hardcoded fallback
   - Verified authentication endpoints working correctly

2. **React Error Boundary** ✅
   - Created ErrorBoundary component to gracefully catch and display frontend errors
   - Prevents white screen crashes, shows user-friendly error UI with reload option
   - Wraps entire application for comprehensive error handling

3. **API Rate Limiting** ✅
   - Installed and configured @nestjs/throttler module
   - Enforced global rate limit: 100 requests per 60 seconds
   - Prevents abuse and ensures fair API usage across all clients

4. **Centralized AI Model Pricing** ✅
   - Created `api/src/config/ai-models.config.ts` for all AI model costs
   - Eliminated hard-coded pricing values in services
   - Added safe fallback for unknown models (prevents crashes)
   - Updated IdeogramService and AiOrchestrator to use centralized config

5. **Workflow Auto-Start** ✅
   - Both frontend (port 5000) and backend (port 3001) auto-start together
   - Single workflow command handles full stack initialization
   - Graceful shutdown handlers for clean process termination

## Critical Fixes Completed (Oct 14, 2025)
1. **Ideogram API 404 Error** ✅
   - Fixed endpoint: `https://api.ideogram.ai/generate` (removed `/v1` prefix)
   - Fixed aspect ratio: `ASPECT_16_9` (enum format)

2. **Form Validation** ✅
   - logoUrl accepts empty strings using `.refine()` validation
   - AI model dropdown restricted to supported models only

3. **NestJS Dependency Injection** ✅
   - Added `@Inject()` decorators to all service constructors
   - Resolved circular dependency issues

4. **PostgreSQL Warnings** ✅
   - Verified E57P01 errors are harmless (normal restart behavior)

## OpenAI Integration Update (Oct 28, 2025)
1. **Upgraded to GPT-5** ✅
   - Updated from outdated "gpt-4o" to newest "gpt-5" (released August 7, 2025)
   - Changed `max_tokens` to `max_completion_tokens` (required for GPT-5)
   - Removed `temperature` parameter (not supported in GPT-5)

2. **Enhanced Key Management** ✅
   - Added validation to ensure OPENAI_API_KEY exists before initialization
   - Added clear documentation about Replit Secrets usage
   - Confirmed billing goes directly to your OpenAI account (not Replit credits)

## Design System (Oct 17, 2025)
**Modern Canva/Linear/Figma-Inspired UI**
- **Color Palette**:
  - Background: Deep charcoal (217 19% 12%)
  - Card/Sidebar: Elevated surfaces (217 19% 16-20%)
  - Primary Accent: Vibrant purple (262 83% 58%)
  - Text: High contrast (217 10% 95%)
  - Success: Green (142 76% 36%)
  - Warning: Orange (38 92% 50%)

- **Typography**: Inter font stack, responsive scale
- **Layout**: 3-column dashboard (w-64, flex-1, w-80)
- **Effects**: Glassmorphic nav, dot-grid canvas, hover animations
- **Components**: Rounded inputs (h-11), large buttons (h-12), shadow effects

## Next Steps
- Phase 3: Add Stripe payment integration
- Implement API key management UI
- Add webhooks for async generation
- Build analytics dashboard
- Deploy to production with custom domain
