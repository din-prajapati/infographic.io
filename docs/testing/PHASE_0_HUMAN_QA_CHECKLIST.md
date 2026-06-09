# Phase 0 — Human QA Checklist

> **Who:** Dinesh (sole human tester)  
> **When:** Before production go-live — complete Tasks 1–3 in order  
> **What this document is:** Only the things that require human eyes, a real browser, or manual deployment steps. Everything marked ✅ AUTO below is already verified by Playwright E2E or unit tests — **do not re-check those**.

---

## Automation already done — skip these

| What's covered | File | Status |
|---|---|---|
| Theme toggle (light/dark persist) | `e2e/design-consistency.spec.ts` | ✅ 44/44 pass |
| AI chat panel opens in both themes | `e2e/design-consistency.spec.ts` | ✅ PASS |
| AppHeader identical on all pages | `e2e/design-consistency.spec.ts` | ✅ PASS |
| Body text 14px across pages | `e2e/design-consistency.spec.ts` | ✅ PASS |
| Pricing page readable in both themes | `e2e/design-consistency.spec.ts` | ✅ PASS |
| Auth page form + Google button visible | `e2e/design-consistency.spec.ts` | ✅ PASS |
| Generation result cards render, images decode, 16:9 ratio | `e2e/us-design-003-generation-ux.spec.ts` | ✅ PASS (mock) |
| "Use This Design" button has bg-primary styling | `e2e/us-design-003-generation-ux.spec.ts` | ✅ PASS (mock) |
| Invalid prompt → styled guidance, no raw JSON | `e2e/us-design-003-generation-ux.spec.ts` | ✅ PASS (mock) |
| Button heights ≤56px on all pages | `e2e/us-design-004-global-consistency.spec.ts` | ✅ PASS (Pricing) + run on staging |
| Card borders (borderWidth > 0) | `e2e/us-design-004-global-consistency.spec.ts` | ✅ logic ready → run on staging |
| Section spacing ≥20px | `e2e/us-design-004-global-consistency.spec.ts` | ✅ logic ready → run on staging |
| `--background` not hardcoded black/white | `e2e/us-design-004-global-consistency.spec.ts` | ✅ logic ready → run on staging |
| Unit tests (payments) | `api/tests/` | ✅ 34/34 pass |

Run `npx playwright test` on staging to confirm the logic-ready tests also pass with a live DB.

---

---

## Task 1 — Critical-Path Manual QA (local, before staging deploy)

> **Goal:** Confirm the core product works on your machine before committing to a deploy.  
> **Time:** ~2 hours  
> **Prerequisites:** `npm run dev` running locally; AI keys in `.env`; a test user account.

---

### 1A. Google OAuth

| # | Check | Pass? | Notes |
|---|---|---|---|
| GO-01 | Google Cloud Console: OAuth 2.0 Web Client created | ☐ | |
| GO-02 | Authorized redirect URI matches exactly: `http://localhost:5000/api/v1/auth/google/callback` | ☐ | Must be exact — no trailing slash |
| GO-03 | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` set in `.env` | ☐ | |
| GO-04 | **New user:** Click "Continue with Google" → Google consent → lands on `/templates` authenticated | ☐ | No manual token paste |
| GO-05 | **Returning Google user:** Second login succeeds; session survives page refresh | ☐ | |
| GO-06 | **Email already registered (local password user):** Google login links correctly, no duplicate org | ☐ | |
| GO-07 | **Misconfigured client id:** user sees a clear error, not a silent hang | ☐ | |

---

### 1B. Flow 1 — Registration + First Generation

| # | Check | Pass? | Notes |
|---|---|---|---|
| F1-01 | Register a brand new account with a fresh email at `/auth` | ☐ | |
| F1-02 | User + Organization created; lands on `/templates` | ☐ | |
| F1-03 | Open a template into the editor | ☐ | |
| F1-04 | Open AI Chat panel (purple Sparkles button) | ☐ | |
| F1-05 | Type a prompt with address + price (e.g. `Modern home at 123 Main St, Austin TX priced at $500,000`) | ☐ | |
| F1-06 | **Progress bar visible** during generation (not a frozen blank screen) | ☐ | Previously broken — Socket.io gateway may need wiring (EPIC-AI-00 US-AI-001) |
| F1-07 | Generation completes → **3 result variations appear** with images | ☐ | |
| F1-08 | **Image quality:** images look like infographics (not broken or blank) | ☐ | Only human can judge — automation checks layout/decode, not art quality |
| F1-09 | Usage counter shows **1/3** (FREE tier) after generation | ☐ | Check Account → Usage |
| F1-10 | No critical errors in browser console (no red exceptions) | ☐ | |

---

### 1C. Flow 2 — Paid Tier Generation + Usage Meter

| # | Check | Pass? | Notes |
|---|---|---|---|
| F2-01 | Subscribe to SOLO plan (Razorpay test card `5267 3181 8797 5449`) | ☐ | |
| F2-02 | Plan shows as SOLO on Account page after webhook fires | ☐ | |
| F2-03 | Generate 3 more infographics; usage counter updates (e.g. `3/50`) | ☐ | |
| F2-04 | No false "limit reached" error at generation #4+ (SOLO allows 50/mo) | ☐ | |
| F2-05 | **4th generation on FREE account is blocked** with a clear limit/upgrade message | ☐ | Use a separate FREE account for this |

---

### 1D. Flow 3 — Canvas Editor

| # | Check | Pass? | Notes |
|---|---|---|---|
| F3-01 | Add a **Text** element → type something → visible on canvas | ☐ | |
| F3-02 | Add a **Shape** (rectangle/circle) → visible on canvas | ☐ | |
| F3-03 | Add an **Image** element → image displays | ☐ | |
| F3-04 | **Drag + resize** elements — smooth, no layout breakage | ☐ | |
| F3-05 | **Save** design → success toast | ☐ | |
| F3-06 | Navigate to `/my-designs` → saved design appears | ☐ | |
| F3-07 | Open saved design → canvas restores correctly | ☐ | |
| F3-08 | **PNG export** → file downloads, no browser chrome in the image | ☐ | |

---

### 1E. Flow 4 — AI Chat → "Use This Design" → Editor

| # | Check | Pass? | Notes |
|---|---|---|---|
| F4-01 | From AI Chat, click a **category chip** (e.g. "Residential") → pre-fills context | ☐ | |
| F4-02 | Generate infographic → variations appear | ☐ | |
| F4-03 | Click **"Use This Design"** → redirects to editor with the design loaded | ☐ | |
| F4-04 | Canvas in editor shows the generated infographic elements | ☐ | |
| F4-05 | Elements are editable (click text → can type) | ☐ | |
| F4-06 | **Customize** button also works without breaking anything | ☐ | |

---

### 1F. Flow 5 — User Limits (Team Plan)

| # | Check | Pass? | Notes |
|---|---|---|---|
| F5-01 | TEAM plan: add up to **5 users** in Account → Organization — succeeds | ☐ | |
| F5-02 | Adding a **6th user** → blocked with a clear "seat limit" message | ☐ | |
| F5-03 | Removed user loses access | ☐ | |
| DEFERRED | BROKERAGE plan | — | PT-06 unresolved; skip this |

---

### 1G. Flow 6 — Cross-Browser Smoke

| # | Check | Pass? | Notes |
|---|---|---|---|
| F6-01 | **Chrome** — Flows 1 + 3 pass | ☐ | |
| F6-02 | **Firefox** — `/templates`, `/editor`, `/auth` load without critical errors | ☐ | |
| F6-03 | **Safari** (or Edge as substitute) — same smoke | ☐ | Mark N/A if browser not available; document the exception |
| F6-04 | **Responsive** — at 1280×800 nothing is critically broken | ☐ | Not mobile-first; just no broken layout |

---

**Task 1 sign-off:** All P0 rows checked. Date: __________ Result: PASS / FAIL

---

---

## Task 2 — Staging Smoke Test (Railway + Neon)

> **Goal:** Deploy to a real hosted environment; run E2E tests; sign off the two staging-only ACs.  
> **Time:** ~3–4 hours (first-time setup ~2 hrs; smoke test ~1 hr)  
> **Prerequisites:** Task 1 complete; Railway CLI installed; Neon account with project.  
> **Deployment flow (from `docs/DEPLOYMENT_STRATEGY.md` §3):**  
> `merge to main` → Railway auto-deploys staging → verify → tag → production

---

### 2A. One-Time Infrastructure Setup (follow `docs/setup/RAILWAY_NEON_DEPLOY.md`)

> Do this once. After setup, every future merge to `main` auto-deploys staging — no manual command needed.

**Step 1 — Neon: database**

| # | Step | Done? | Notes |
|---|---|---|---|
| S-01 | Create a Neon project (or reuse existing) | ☐ | Dashboard: console.neon.tech |
| S-02 | Create a `staging` branch off the `main`/`production` Neon branch | ☐ | Branches → New branch |
| S-03 | Copy the `staging` branch **direct connection string** (non-pooled, with `?sslmode=require`) | ☐ | Use Direct — not the Pooler endpoint |

**Step 2 — Railway: app service (no Railway Postgres)**

| # | Step | Done? | Notes |
|---|---|---|---|
| S-04 | `railway login` + `railway init` (project name: `infographic-editor`) | ☐ | |
| S-05 | In Railway dashboard: create `staging` environment (Settings → Environments → New) | ☐ | |
| S-06 | Set Railway staging variables (see table below) | ☐ | |
| S-07 | **Bootstrap first deploy:** `railway up --detach` *(one-time only — creates the service)* | ☐ | After this, merges to `main` trigger auto-deploy |
| S-08 | In Railway service settings → Deploy → set **Branch = `main`** and enable **Auto Deploy** | ☐ | This wires the CI/CD flow from the strategy |
| S-09 | `railway logs` → confirm `prisma db push` + `serving on port` + `Nest application successfully started` | ☐ | First boot seeds templates automatically |
| S-10 | `railway domain` → note the staging URL | ☐ | |

**Required Railway staging variables:**

| Variable | Value |
|---|---|
| `DATABASE_URL` | Neon **staging** branch direct URL (`?sslmode=require`) |
| `NODE_ENV` | `production` |
| `JWT_SECRET` | Random 32-byte base64 — unique for staging |
| `SESSION_SECRET` | Random 32-byte base64 — unique for staging |
| `OPENAI_API_KEY` | Your OpenAI key |
| `IDEOGRAM_API_KEY` | Your Ideogram key (**required for AC3 image fidelity**) |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Razorpay **TEST** keys |
| `RAZORPAY_PLAN_SOLO_MONTHLY` etc. | Razorpay test plan IDs |
| `VITE_RAZORPAY_KEY_ID` | Same TEST key (browser-exposed) |
| `RAZORPAY_WEBHOOK_SECRET` | Test webhook secret |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth credentials |
| `GOOGLE_CALLBACK_URL` | `https://<staging-url>/api/v1/auth/google/callback` |

> ⚠️ Do **not** add a Railway Postgres service. The DB is on Neon.  
> ⚠️ Do **not** set `PORT` — Railway injects it automatically.

---

### 2B. Deploy: Merge to `main` → Staging Auto-Deploys

> Per `docs/DEPLOYMENT_STRATEGY.md` §3: merging to `main` is the staging deploy trigger — not `railway up`.

| # | Step | Done? | Notes |
|---|---|---|---|
| S-11 | Open a PR from `feat/epic-design-02-ui-redesign` → `main` on GitHub | ☐ | Use STORY.md as PR body |
| S-12 | Review the diff; confirm no unintended files (`.env`, secrets) | ☐ | |
| S-13 | **Merge the PR** (squash merge) → Railway detects push to `main` and starts staging deploy | ☐ | Watch Railway dashboard |
| S-14 | Railway deploy completes → `railway logs` shows clean startup | ☐ | Same checks as S-09 |

---

### 2B. Run Automated E2E Suite on Staging

```bash
# Point Playwright at the staging URL
PLAYWRIGHT_BASE_URL=https://<your-staging>.up.railway.app npx playwright test
```

| Test file | Expected | Pass? |
|---|---|---|
| `e2e/design-consistency.spec.ts` | All 44 should pass | ☐ |
| `e2e/us-design-002-editor-tokens.spec.ts` | Pass | ☐ |
| `e2e/us-design-003-generation-ux.spec.ts` | Pass (mock-backed; login required) | ☐ |
| `e2e/us-design-004-global-consistency.spec.ts` | All 9 pass (auth-gated tests now have DB) | ☐ |
| `e2e/m-design-03-token-foundation.spec.ts` | Pass | ☐ |
| `e2e/m-design-04-domain-colors.spec.ts` | Pass | ☐ |

> If any test fails, investigate before proceeding to Task 3.

---

### 2C. US-DESIGN-003 AC3 — Live Ideogram Image Fidelity (staging only)

> Automation covers the *layout contract* (cards render, images decode, 16:9). Only a human can judge artwork quality.

| # | Check | Pass? | Notes |
|---|---|---|---|
| I-01 | Open staging URL → register fresh account | ☐ | |
| I-02 | Open editor from a template → open AI Chat | ☐ | |
| I-03 | Submit: `Modern home at 123 Main St, Austin TX priced at $500,000` | ☐ | |
| I-04 | **Progress bar appears** during generation (Socket.io working) | ☐ | If frozen, EPIC-AI-00 US-AI-001 needed |
| I-05 | **3 result cards appear** with real Ideogram images (not broken/blank) | ☐ | |
| I-06 | Images are **correctly proportioned** (not squished, not cropped weirdly) | ☐ | Automation asserts 16:9 ratio; you verify visual quality |
| I-07 | **Usage counter increments**: Account → Usage shows `1/3` (FREE tier) | ☐ | |
| I-08 | **Repeat** (generate 2 more): counter shows `2/3`, `3/3` | ☐ | |
| I-09 | **4th attempt on FREE tier** → blocked with correct message | ☐ | |
| I-10 | **Error state:** disconnect IDEOGRAM_API_KEY temporarily → styled error bubble shown, not raw JSON | ☐ | Optional: verify MessageBubble error styling |

---

### 2D. US-DESIGN-004 Visual Spot-Checks (staging only)

> Automation checks computed CSS values. You confirm they *look* right.

| # | Check | Pass? | Notes |
|---|---|---|---|
| V-01 | **AC2 — Button heights:** Primary buttons on Pricing, Account, Templates look the same height (not some tall, some short) | ☐ | ~36px visually |
| V-02 | **AC3 — Card borders:** Template cards and My Designs cards have a visible, consistent border (not some with border, some without) | ☐ | |
| V-03 | **AC3 — Chart:** Usage Dashboard → chart data labels are readable in **Dark mode** | ☐ | Switch to dark, go to `/usage` |
| V-04 | **AC4 — Spacing:** Account page sections have consistent vertical gaps (not sections crammed together or too spread) | ☐ | |
| V-05 | **AC6 — No split-personality:** Light mode — no page has a jarring dark panel sitting next to a light panel | ☐ | Check `/templates`, `/account`, `/pricing` in light mode |
| V-06 | **AC6 — No split-personality:** Dark mode — no page has a jarring white panel | ☐ | Same pages in dark mode |

---

**Task 2 sign-off:** All rows checked; E2E suite passes on staging. Date: __________ Result: PASS / FAIL

---

---

## Task 3 — Production Go-Live + Sentry Verify

> **Goal:** Deploy to production with live keys; verify monitoring is working.  
> **Time:** ~1 hour  
> **Prerequisites:** Task 2 signed off; staging smoke fully green.  
> **Deployment flow (from `docs/DEPLOYMENT_STRATEGY.md` §3):**  
> `git tag v1.0.0` → push tag → Railway promotes to production (canary → 100%)

---

### 3A. Neon Production Branch

| # | Step | Done? | Notes |
|---|---|---|---|
| P-01 | Confirm the Neon `main` branch is the production branch (default) | ☐ | Or create a `production` branch if you want named separation |
| P-02 | Copy the production branch **direct connection string** (`?sslmode=require`) | ☐ | |

---

### 3B. Railway Production Environment — One-Time Setup

| # | Step | Done? | Notes |
|---|---|---|---|
| P-03 | In Railway dashboard: create `production` environment (mark as **Protected**) | ☐ | Protected = no accidental deploys |
| P-04 | Set all production variables (see table below) | ☐ | **LIVE keys only — never TEST keys here** |
| P-05 | In Railway service settings → Deploy → set **Deploy Trigger = Git tag (`v*`)** | ☐ | Per strategy §3: production deploys from a version tag, not branch push |
| P-06 | **Bootstrap first deploy:** `railway up --detach` from the `production` environment *(one-time)* | ☐ | Creates the service; subsequent deploys are tag-triggered |
| P-07 | `railway logs` → confirm clean startup | ☐ | |
| P-08 | `railway domain` → set custom domain or note Railway URL | ☐ | |

---

### 3C. Release: Tag `v1.0.0` → Production Auto-Deploys

> Per `docs/DEPLOYMENT_STRATEGY.md` §3: production deploys from a tag push, not a merge.

| # | Step | Done? | Notes |
|---|---|---|---|
| P-09 | Confirm `main` is green on staging and all Task 2 checks are signed off | ☐ | Don't tag until staging is stable |
| P-10 | `git tag v1.0.0 -m "InfographicAI v1.0.0 — Phase 0 launch"` | ☐ | |
| P-11 | `git push origin v1.0.0` → Railway detects tag and starts production deploy | ☐ | |
| P-12 | Railway deploy completes → `railway logs` shows clean startup (production environment) | ☐ | |

**Required Railway production variables (P-04):**

| Variable | Value |
|---|---|
| `DATABASE_URL` | Neon **production** branch direct URL (`?sslmode=require`) |
| `NODE_ENV` | `production` |
| `JWT_SECRET` | **New** random 32-byte — **different from staging** |
| `SESSION_SECRET` | **New** random 32-byte — **different from staging** |
| `OPENAI_API_KEY` | Your OpenAI key |
| `IDEOGRAM_API_KEY` | Your Ideogram key |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | **LIVE** Razorpay keys — not test |
| `RAZORPAY_PLAN_SOLO_MONTHLY` etc. | **LIVE** plan IDs from Razorpay Dashboard |
| `VITE_RAZORPAY_KEY_ID` | **LIVE** key (browser-exposed) |
| `RAZORPAY_WEBHOOK_SECRET` | Live webhook secret |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth credentials |
| `GOOGLE_CALLBACK_URL` | `https://<prod-url>/api/v1/auth/google/callback` |
| `SENTRY_DSN` | Paste from Sentry project dashboard |
| `VITE_SENTRY_DSN` | Same value (browser-exposed) |

> ⚠️ LIVE Razorpay keys must **never** appear in staging variables. If that happens, rotate them immediately in the Razorpay Dashboard.

---

### 3D. Production Smoke Test

| # | Check | Pass? | Notes |
|---|---|---|---|
| P-13 | `GET https://<prod-url>/api/health` returns `{"status":"ok","db":"connected"}` | ☐ | |
| P-14 | Register a real account → lands on `/templates` | ☐ | `prisma db push` at first boot seeds templates |
| P-15 | Open template → Editor loads | ☐ | |
| P-16 | Generate one infographic (uses live Ideogram key) | ☐ | Costs ~$0.025 per image |
| P-17 | Usage counter shows `1/3` (FREE tier) | ☐ | |
| P-18 | **LIVE Razorpay:** Complete a SOLO monthly checkout with a real card | ☐ | Costs ₹999 — use your own card for final smoke |
| P-19 | Plan shows as SOLO after webhook fires | ☐ | Check Account page |
| P-20 | Generate more infographics; counter updates (e.g. `2/50`, `3/50`) | ☐ | |

---

### 3E. Sentry Verification

| # | Check | Pass? | Notes |
|---|---|---|---|
| P-21 | Open Sentry dashboard → InfographicAI project | ☐ | |
| P-22 | Trigger a test event: browser console on production URL → `throw new Error("Sentry smoke test")` | ☐ | |
| P-23 | Event appears in Sentry within ~30 seconds | ☐ | |
| P-24 | **Source maps** resolve: Sentry shows readable filenames, not bundle hashes | ☐ | If not, add `SENTRY_AUTH_TOKEN` to Railway build variables |

---

### 3F. Google OAuth — Production

| # | Check | Pass? | Notes |
|---|---|---|---|
| P-25 | Google Cloud Console: add production domain to **Authorized redirect URIs** | ☐ | `https://<prod-url>/api/v1/auth/google/callback` |
| P-26 | Google sign-in works on production | ☐ | |

---

**Task 3 sign-off:** Production live, Sentry receiving events, Google OAuth working. Date: __________ Result: PASS / FAIL

---

---

## Phase 0 Gate — Done ✅

All 3 tasks signed off → Phase 0 is complete. Update:
- `docs/agile/PHASE_TRACKER.md` — Phase 0 gate checkboxes
- `docs/agile/TEAM_STATUS.md` — INFRA domain "Now" → "Done"
- `docs/agile/AGILE_INDEX.md` — EPIC-INFRA-01 status → ✅ Done

**Next:** Merge `feat/epic-design-02-ui-redesign` → `main` → auto-deploy to staging. Begin **EPIC-AI-00** (US-AI-001: Socket.io gateway wiring).

---

---

## Deployment Strategy — Work Sizing & Timeline

> Based on `docs/DEPLOYMENT_STRATEGY.md` — what's done, what's needed now, and what comes later.

### Already done (in repo — no work needed)

| Item | File | Status |
|---|---|---|
| `railway.json` with build + start + healthcheck | `railway.json` | ✅ |
| `.nvmrc` (Node 22) | `.nvmrc` | ✅ |
| `db:deploy` script (`prisma db push` at container start) | `package.json` | ✅ |
| Cross-platform `reusePort` fix (Windows safe) | `server/index.ts` | ✅ |
| `.env.production.example` with all required vars | `.env.production.example` | ✅ |
| Step-by-step deploy guide | `docs/setup/RAILWAY_NEON_DEPLOY.md` | ✅ |
| Architecture decision documented (Neon + Railway) | `docs/DEPLOYMENT_STRATEGY.md` §6 | ✅ |
| Sentry DSN wired in both frontend + API | `.env.example` | ✅ |

---

### Do now (Phase 0 Tasks 2 + 3 above): ~4–5 hours

| Item | Effort | Notes |
|---|---|---|
| Create Neon project + staging + production branches | 20 min | Dashboard only |
| Create Railway project + staging + production environments | 30 min | `railway init`, set variables |
| First deploy + confirm startup logs | 30 min | Expect 1–2 retry cycles while setting variables |
| Run E2E on staging | 30 min | `npx playwright test` against staging URL |
| Production smoke + Sentry verify | 30 min | One real checkout, Sentry test event |
| Google OAuth production callback update | 15 min | Google Cloud Console redirect URI |

---

### Do after Phase 0 (Phase 1 prep): ~1 day total, spread over 2 sessions

| Item | When | Effort | Why |
|---|---|---|---|
| **GitHub Actions CI pipeline** (`.github/workflows/ci.yml`) — typecheck + unit + E2E on every PR | Before Phase 1 first PR | ~2 hrs | Without this, PRs are unguarded |
| **PR environments** on Railway (ephemeral per PR → Neon branch per PR) | Phase 1 kickoff | ~2 hrs | Enables stakeholder review without local setup |
| **Switch `prisma db push` → `prisma migrate deploy`** + commit baseline migration | After first real user is on prod | ~1 hr | Required before any schema change on a live dataset |
| Feature-flag mechanism (env-var first: `FEATURE_X=true`) | When first dark-launch needed (EPIC-AI-00) | ~30 min | Deploy EPIC-AI-00 dark while staging |

---

### Do in Phase 2–3 (do not do now)

| Item | When | Why defer |
|---|---|---|
| Postgres → Prisma Migrate full history | Phase 2 | Only needed when you have live users + schema changes |
| Progressive rollout / canary (1% → 100%) | Phase 3+ | Not needed until meaningful traffic |
| `flags` table or Unleash/Flagsmith | Phase 3+ | Env-var flags are enough through Phase 2 |
| Redis / job queue for generation | Phase 3 (batch processing) | Only needed for EPIC-AI-03 parallel batch |
| OpenTelemetry → Grafana/Datadog | Phase 5 | EPIC-INFRA-02 |

---

### Summary: what to schedule

```
This week (Phase 0 close):
  □  Task 1 — Local critical-path QA         ~2 hrs
  □  Task 2 — Staging deploy + smoke         ~3 hrs
  □  Task 3 — Production go-live             ~1 hr

Next session (Phase 1 prep, before first story branch):
  □  GitHub Actions CI pipeline              ~2 hrs
  □  PR environments (Railway + Neon CLI)    ~2 hrs

When first schema change comes (any Phase 1 story that touches DB):
  □  Migrate to prisma migrate deploy        ~1 hr
```

---

*Created: 2026-06-09 · Owner: Dinesh · Companion to `docs/DEPLOYMENT_STRATEGY.md`, `docs/setup/RAILWAY_NEON_DEPLOY.md`, `docs/testing/MVP_CRITICAL_PATH_QA.md`*
