# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (starts Express proxy :5000 + NestJS :3001 + Vite frontend)
npm run dev

# Production build and start
npm run build && npm start

# Type checking
npm run check

# Database
npx prisma generate --schema=api/prisma/schema.prisma
npx prisma db push --schema=api/prisma/schema.prisma
npx prisma studio --schema=api/prisma/schema.prisma

# Tests
npm run test:unit                          # All unit tests (mock-based, no DB needed)
npm run test:integration                   # Integration tests (requires .env.test with Neon DB URL)
npm run test:payments:unit                 # Payment unit tests only
npm run test:e2e                           # Playwright E2E tests

# Run a single unit test file
cd api && npx vitest run tests/payments/payments.service.spec.ts --reporter=verbose

# Payment utilities
npm run verify:payment-prereqs
npm run test:payment
npm run list-active-subscriptions
npm run clean-dev-db
```

## Architecture

### Three-server topology
`npm run dev` runs a single process that coordinates three servers:
1. **Express proxy** (`server/index.ts`) on port 5000 — spawns NestJS as a child process, reverse-proxies `/api/v1/*` to NestJS, handles `/api/proxy-image` (CORS bypass for Ideogram/OpenAI images), `/api/health`, and the legacy payment routes
2. **NestJS API** (`api/src/main.ts`) on port 3001 — canonical backend for all business logic
3. **Vite dev server** — embedded in Express via `setupVite()` in development

In production, Vite's output is served as static files by Express.

### Path aliases
- `@shared` → `shared/` (used by both NestJS `api/` and unit tests via vitest config)
- `@/*` → `client/src/*` (Vite, frontend)

### NestJS modules (`api/src/modules/`)
| Module | Responsibility |
|---|---|
| `auth` | JWT + Google OAuth + local Passport strategies, register/login |
| `payments` | RazorPay/Stripe subscriptions, webhook handling, plan enforcement |
| `infographics` | AI-generated infographic records + usage enforcement per plan tier |
| `ai-generation` | OpenAI GPT-4o (prompt orchestration) + Ideogram (image generation) |
| `designs` | Canvas editor designs — CRUD using `Infographic` model with `aiModel: 'canvas-editor'` |
| `templates` | Seed/static templates; canvas templates use `aiModel: 'canvas-template'` |
| `conversations` | AI chat conversation history |
| `users` | User profile, organization membership, per-plan user limits |
| `health` | `/api/v1/health` — DB ping, used by Express health proxy |

`DatabaseModule` is `@Global()` and exports a singleton `PrismaService` — do not re-provide Prisma in module-level `providers`.

### Database
- **ORM**: Prisma 6 (`api/prisma/schema.prisma`) — canonical schema. `shared/schema.ts` contains legacy Drizzle/zod schema used only by the Express server routes; do not confuse the two.
- **DB**: PostgreSQL via Neon (serverless). Neon can auto-pause — the integration test setup handles reconnect in `afterAll` with `$connect()` + try/catch.
- Direct Prisma access pattern: `import { prisma } from '../../../database/prisma.client'` (singleton, not injected via DI in most services).

### Payment architecture
- **Primary**: RazorPay (INR). Plan IDs are read from env vars like `RAZORPAY_PLAN_SOLO_MONTHLY`, `RAZORPAY_PLAN_TEAM_MONTHLY`, etc.
- **Secondary**: Stripe (disabled by default).
- Provider abstraction: `server/payments/providers/payment-provider.factory.ts` + `PaymentProvider` interface. NestJS `PaymentsService` imports the factory from `server/` — the Express and NestJS layers share provider code.
- Webhook route: `POST /api/v1/webhooks/razorpay` (NestJS). Raw body preserved in Express for signature verification.
- Subscription states: `PENDING → ACTIVE` on webhook confirmation. Schema has `PENDING` status and `billingPeriod` field (added 2026-02-28).

### Frontend
- **Router**: Wouter (not React Router). Routes: `/`, `/auth`, `/auth/callback`, `/pricing`, `/templates`, `/my-designs`, `/account`, `/usage`, `/editor`
- **State**: Zustand for canvas/editor state; React Query (`@tanstack/react-query`) for server data
- **UI**: Tailwind CSS v3 + shadcn/ui (Radix primitives) + `lucide-react` icons
- **Canvas editor**: Custom HTML Canvas renderer in `client/src/lib/canvasUtils.ts`, `shapeRenderers.ts`; `react-rnd` for drag-resize
- **API client**: `client/src/lib/api.ts` — resolves same-origin vs cross-origin automatically (handles ngrok/public tunnel scenarios)
- **Auth**: JWT stored in localStorage; `AuthProvider` in `client/src/lib/auth.tsx` wraps the app; 401 responses trigger redirect via `REDIRECT_TO_AUTH_KEY` flag

### AI generation flow
1. Frontend sends prompt via REST or Socket.io
2. NestJS `AiOrchestrator` calls OpenAI GPT-4o to generate structured JSON layout
3. Ideogram API generates the background image
4. Progress streamed back via Socket.io (`@nestjs/websockets`)
5. AI models: `ideogram-turbo` ($0.025/image), `ideogram-2` ($0.080/image), GPT-4o ($0.004/request)

### Plan tiers and limits
`FREE=3/mo | SOLO=50/mo | TEAM=200/mo | BROKERAGE=1000/mo | API_STARTER=5000 | API_GROWTH=20000 | API_ENTERPRISE=unlimited`

### Testing
- **Unit tests**: `api/tests/**/*.spec.ts` (exclude `*.integration.spec.ts`) — all mock-based, no DB
- **Integration tests**: `api/tests/**/*.integration.spec.ts` — require `.env.test` at repo root with a real Neon connection string; scoped cleanup deletes only records with `name='Integration Test Org'`
- Integration tests run sequentially (`singleFork: true`) with 120s timeout to handle Neon auto-pause latency

### Environment variables (key ones)
```
DATABASE_URL                  Neon PostgreSQL connection string
JWT_SECRET
OPENAI_API_KEY
IDEOGRAM_API_KEY
RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET / RAZORPAY_WEBHOOK_SECRET
VITE_RAZORPAY_KEY_ID          Exposed to browser (checkout)
RAZORPAY_PLAN_SOLO_MONTHLY    Razorpay plan ID for SOLO monthly
RAZORPAY_PLAN_TEAM_MONTHLY    Razorpay plan ID for TEAM monthly
STRIPE_SECRET_KEY / STRIPE_PUBLISHABLE_KEY / STRIPE_WEBHOOK_SECRET  (optional)
PORT=5000  API_PORT=3001
```

In production, NestJS skips `.env` files when `NODE_ENV=production` AND `DATABASE_URL` is set as a system env var (`ignoreEnvFile` in `AppModule`).
