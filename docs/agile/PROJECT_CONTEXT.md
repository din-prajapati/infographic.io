# InfographicAI — Project Context

> **Single source of truth for all AI sessions.**
> Load this file at the start of every agile planning or implementation session.
> Updated after each `/prd-to-roadmap` run, phase gate decision, or domain addition.

---

## Product Identity

| Field | Value |
|-------|-------|
| **Product** | InfographicAI — AI-powered real estate infographic SaaS |
| **Root** | `D:/Dinesh/DCloud/GITDrive/Work/Products/InfographicEditor-Unified` |
| **Current Phase** | Phase 0 (MVP) — ~99% complete, 3 human deploy tasks remain |
| **Target Users** | Solo real estate agents, small brokerages, PropTech API teams |
| **Primary Market** | India (RazorPay/INR); international secondary |

---

## Tech Stack

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Frontend | React + Vite | 18 / 5 | Port 5000 (served by Express proxy) |
| API | NestJS | 11 | Port 3001, reverse-proxied via `/api/*` |
| DB ORM | Prisma | 6 | Schema: `api/prisma/schema.prisma` (canonical) |
| Database | PostgreSQL via Neon | — | Serverless; can auto-pause |
| Auth | JWT + Google OAuth | Passport.js | JWT stored in localStorage |
| Payments | RazorPay (primary) | — | INR; Stripe secondary (disabled by default) |
| AI — Text | OpenAI GPT-4o | — | $0.004/request; prompt orchestration |
| AI — Image | Ideogram | turbo / v2 | $0.025–$0.080/image |
| Real-time | Socket.io | — | Generation progress streaming |
| UI Framework | Tailwind CSS v3 + shadcn/ui | — | Radix primitives; lucide-react icons |
| Router | Wouter | — | NOT React Router — never switch |
| State | Zustand + React Query | — | Canvas state + server data |
| Canvas | Custom renderer | — | `client/src/lib/canvasUtils.ts` + `shapeRenderers.ts` |
| Testing | Vitest (unit/integration) + Playwright (E2E) | — | `api/tests/` |
| Deploy | Railway | — | CI/CD configured; auto-deploy on main |
| Monitoring | Sentry | — | DSN configured; frontend + backend |

---

## Three-Server Topology

```
npm run dev starts:
  Express proxy     :5000  ← user-facing entrypoint
    ├─ /api/v1/*           → NestJS :3001 (reverse proxy)
    ├─ /api/proxy-image    → CORS bypass for Ideogram/OpenAI images
    ├─ /api/health         → Express health check
    └─ /*                  → Vite dev server (development) / static files (production)

  NestJS API        :3001  ← all business logic lives here
  Vite dev server          ← embedded in Express via setupVite()
```

**Rule:** Never add business logic to the Express layer. NestJS is canonical backend.

---

## NestJS Modules

| Module | Responsibility |
|--------|---------------|
| `auth` | JWT + Google OAuth + local Passport strategies |
| `payments` | RazorPay/Stripe subscriptions, webhook handling, plan enforcement |
| `infographics` | AI-generated infographic records + usage enforcement |
| `ai-generation` | OpenAI GPT-4o (prompt orchestration) + Ideogram (image generation) |
| `designs` | Canvas editor designs — CRUD using `Infographic` with `aiModel: 'canvas-editor'` |
| `templates` | Seed/static templates; canvas templates use `aiModel: 'canvas-template'` |
| `conversations` | AI chat conversation history |
| `users` | User profile, org membership, per-plan user limits |
| `health` | `/api/v1/health` — DB ping |

---

## Plan Tiers & Limits

| Tier | Limit/mo | Price | Notes |
|------|----------|-------|-------|
| FREE | 3 | — | Default for all new users |
| SOLO | 50 | — | |
| TEAM | 200 | ₹6,999/mo | 699900 paise; RazorPay verified |
| BROKERAGE | 1,000 | — | Plan IDs not configured (PT-06 deferred) |
| API_STARTER | 5,000 | — | B2B tier |
| API_GROWTH | 20,000 | — | B2B tier |
| API_ENTERPRISE | unlimited | — | B2B tier |

---

## Domain Prefixes & ID Counters

> **IMPORTANT — Update these after every `/prd-to-roadmap` or `/new-epic` run.**
> Check `docs/agile/AGILE_INDEX.md` for confirmed last-used IDs before assigning new ones.

| Domain | Prefix | Scope | Next Epic # | Next Feature # | Next Story # |
|--------|--------|-------|:-----------:|:--------------:|:------------:|
| Design | DESIGN | UI/UX, design tokens, themes, components | 03 | 10 | 012 |
| Payments | PAY | Subscription, billing, RazorPay/Stripe | 02 | 01 | 001 |
| Auth | AUTH | Login, JWT, OAuth, sessions, API keys | 02 | 01 | 001 |
| Editor | EDIT | Canvas editor, drag-resize, export | 02 | 01 | 001 |
| AI | AI | GPT-4o, Ideogram, generation pipeline, refinement | 06 | 31 | 031 |
| Usage | USAGE | Usage tracking, analytics, limit alerts | 01 | 01 | 001 |
| Infrastructure | INFRA | Railway, Sentry, DB migrations, CI/CD | 02 | 01 | 001 |
| Organisation | ORG | Teams, workspace, multi-user, brand kit | 01 | 01 | 001 |
| API (B2B) | API | REST API, key management, webhooks, portal | 01 | 01 | 001 |
| Testing | TEST | Test infrastructure, coverage, QA automation | 01 | 01 | 001 |
| Mobile | MOBILE | React Native / PWA mobile app | 01 | 01 | 001 |

> To add a new domain: append a row here, pick an unused 2-6 char UPPERCASE prefix, start all counters at `01` / `001`.

---

## Phase Registry

| Phase | Folder | Release | Status | Business Outcome |
|-------|--------|---------|--------|-----------------|
| Phase 0 | `phase-0-mvp` | v1.0 | 🟡 99% | Working product in production |
| Phase 0.5 | `phase-0.5-foundation` | (parallel) | 🔲 | AI pipeline stability + model swap |
| Phase 1 | `phase-1-ai-core` | v1.1 | 🔲 | Conversational AI + generation control |
| Phase 2 | `phase-2-ai-refine` | v1.2 | 🔲 | Refine loop + element editing |
| Phase 3 | `phase-3-ai-advanced` | v1.3 | 🔲 | Production tools + intelligence enrichment |
| Phase 4 | `phase-4-backlog` | — | 🔲 Deferred | Promoted by business trigger, not calendar |

> When adding a new phase from a PRD: append a row, use next integer, create `docs/agile/epics/{phase-folder}/`, add to PHASE_TRACKER.md.

---

## Agile Hierarchy & ID Rules

```
Phase  →  Epic  →  Feature  →  Milestone  →  Story  →  Tasks  →  PR
 P0       EPIC       F-         M-           US-        T1…      #NNN
```

| Level | Format | Example | Zero-pad | Scope |
|-------|--------|---------|----------|-------|
| Epic | `EPIC-{DOMAIN}-{NN}` | `EPIC-AI-06` | 2-digit | 3–8 weeks, one business outcome |
| Feature | `F-{DOMAIN}-{NN}` | `F-AI-31` | 2-digit | 1–2 weeks, one cohesive capability area |
| Milestone | `M-{DOMAIN}-{NN}-{slug}` | `M-AI-17-intent-api` | 2-digit | ~1 week, shippable/demonstrable increment |
| Story | `US-{DOMAIN}-{NNN}` | `US-AI-031` | 3-digit | 1 AI session (2–4 h), one user capability |
| Task | `T{N}` (local to TASKS.md) | `T1`, `T2` | none | One file change, one commit |
| PR branch | `feat/{domain}-{story-slug}` | `feat/ai-us-ai-031-intent-api` | — | One branch per Story |
| Linear issue | Title prefixed with story ID | `[US-AI-031] Intent detection API` | — | Sync with AGILE_INDEX.md |

**Numbering rules:**
- Epic and Feature numbers are sequential **per domain** (reset per domain, not global).
- Story numbers are sequential **per domain** across all epics (never reset).
- Milestone numbers are sequential **globally** across all domains (M-AI-17 means the 17th milestone overall, not the 17th AI milestone).
- Task numbers (`T1`, `T2`…) are local to one TASKS.md and reset per story.

---

## Story Sizing Guide

| Size | Effort | Sessions | Definition |
|------|--------|----------|------------|
| XS | < 1 h | < 0.5 | Config change, copy update, minor tweak |
| S | 1–2 h | 0.5–1 | Small component, single endpoint |
| **M** | **2–4 h** | **1** | **Target size — standard story** |
| L | 4–8 h | 2 | Complex feature — split if possible |
| XL | > 8 h | 3+ | **Must split before development starts** |

---

## Critical Implementation Rules

1. **Three Pillars Pre-flight** — Before opening AI chat, TASKS.md must confirm: Brain (STORY.md ACs written) + Muscle (file list + ordered tasks) + Map (ARCHITECTURE.mmd exists) + Env (ENV.yaml loaded).
2. **Test Is Truth** — Never weaken or skip a failing test to make it pass. Fix the code. Never open a PR until all exact test commands in TASKS.md pass or are explicitly marked N/A with a written reason.
3. **Verification Gates** — Gate 1 (typecheck + unit tests) runs before every PR. Gate 2 (visual checklist) for any frontend change. Gate 4 (API smoke) for any backend change.
4. **One PR = One Story** — Each PR maps to exactly one Story ID, except hotfixes (which reference the bug ID).
5. **Model Opacity** — AI model names (GPT-4o, Ideogram, "Nano Banana", Gemini, Flash) **never** appear in any UI label, API response, or user-visible message. Users see: "Quick Generate", "Campaign Quality", "Social", "Print Quality".
6. **Out of Scope is Law** — Anything listed in a Story's "Out of Scope" section is never implemented in that PR, even if it seems helpful.
7. **Prisma is Canonical** — `api/prisma/schema.prisma` is the only schema to update. `shared/schema.ts` is legacy Drizzle — do not touch.
8. **DatabaseModule is Global** — Do not re-provide PrismaService in module-level `providers`. It is already `@Global()`.
9. **No Anti-Patterns** — No backwards-compat hacks, no unused `_vars`, no commented-out code, no `// TODO` without a story ID.

---

## AI Generation Flow (for AI-domain stories)

```
1. Frontend → REST or Socket.io prompt
2. NestJS AiOrchestrator → OpenAI GPT-4o → structured JSON layout
3. Ideogram API → background image
4. Socket.io → progress events back to frontend
5. Result stored in Infographic record
```

Model costs: GPT-4o `$0.004/req` · Ideogram Turbo `$0.025/img` · Ideogram v2 `$0.080/img`

---

## Run Commands (Quick Reference)

```bash
npm run dev              # All three servers (port 5000 + 3001 + Vite)
npm run check            # TypeScript check — Gate 1 mandatory
npm run test:unit        # Vitest unit tests — Gate 1 mandatory
npm run test:e2e         # Playwright E2E — Gate 3
npm run test:integration # Integration tests (requires .env.test with Neon DB)
npx prisma db push       # Sync schema to Neon dev DB
npx prisma studio        # DB browser UI
npm run verify:payment-prereqs  # Payment config smoke test
```

---

## Agile System File Map

| File | Purpose | Update cadence |
|------|---------|----------------|
| `docs/agile/PROJECT_CONTEXT.md` | This file — project-wide context | After PRD runs, domain additions, phase gates |
| `docs/agile/ROADMAP.md` | Master roadmap generated from PRDs | After each `/prd-to-roadmap` run |
| `docs/agile/AGILE_INDEX.md` | Epic registry with status | After each epic created or closed |
| `docs/agile/PHASE_TRACKER.md` | Executive phase progress view | After each milestone or phase gate |
| `docs/agile/TEAM_STATUS.md` | Per-domain board (now/next/blocked) | Weekly or after story close |
| `docs/agile/GIT_STRATEGY.md` | Branch/commit/PR/label conventions | Rarely |
| `docs/agile/PRD/` | Source PRDs that fed roadmap runs | On each new PRD input |

---

## Known Issues & Deferrals

| ID | Status | Summary |
|----|--------|---------|
| PT-01 | ✅ Fixed | RazorPay shortUrl redirect broke checkout |
| PT-02 | ✅ Fixed | VITE_RAZORPAY_KEY_ID was placeholder |
| PT-03 | ✅ Fixed | Old subscription cancelled before upgrade |
| PT-04 | ✅ Fixed | Subscription PENDING until webhook fires |
| PT-05 | ✅ Verified | TEAM plan ₹6,999 / 699900 paise confirmed in RazorPay Dashboard |
| PT-06 | ⏸ Deferred | BROKERAGE plan IDs not configured in env |

---

*Last updated: 2026-05-18 | Maintained by: Dinesh + Claude Code*
