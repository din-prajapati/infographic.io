# Phase 0 — Human QA Checklist

> **Who:** Dinesh (sole human tester)  
> **When:** Before production go-live — complete Tasks 1–3 in order  
> **What this document is:** Only the things that require human eyes, a real browser, or manual deployment steps. Everything marked ✅ AUTO below is already verified by Playwright E2E or unit tests — **do not re-check those**.

---

## Document Index & Overall Status


| #   | Section                                                                                           | Description                                                          | Status                                                                          |
| --- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| —   | [Automation Already Done](#automation-already-done--skip-these)                                   | Playwright + unit tests — skip these                                 | ✅ All green (2026-06-19)                                                        |
| 1   | [Task 1 — Local QA](#task-1--critical-path-manual-qa-local-before-staging-deploy)                 | Flows 1A–1G: auth, generation, canvas, payments, team, cross-browser | ✅ **SIGNED OFF — 2026-06-20 · PASS**                                            |
| 2   | [Task 2 — Staging](#task-2--staging-smoke-test-railway--neon)                                     | Railway + Neon staging deploy + E2E + live Ideogram verify           | 🔲 **NEXT ACTION** — ~3–4 hrs                                                   |
| 3   | [Task 3 — Production](#task-3--production-go-live--sentry-verify)                                 | Live keys, v1.0.0 tag, Sentry, Google OAuth prod                     | 🔲 Blocked on Task 2 — ~1 hr                                                    |
| 7   | [Flow 7 — Right Sidebar](#flow-7--right-sidebar-design--property--agent-panel)                    | RightSidebar.tsx 44-point checklist                                  | ⏸ **DEFERRED to Phase 1** — all stale bugs verified as implemented (2026-06-20) |
| —   | [Deferred Feature Backlog](#deferred-feature-backlog--architectural-gaps-found-during-phase-0-qa) | GAP-01 (lightbox) · GAP-02 (editable canvas layers)                  | GAP-01 ✅ Implemented · GAP-02 🔲 Phase 1                                        |
| —   | [Deployment Strategy](#deployment-strategy--work-sizing--timeline)                                | Work sizing and timeline for infra                                   | 📋 Reference                                                                    |
| —   | [QA Session Logs](#qa-session-log--2026-06-15-flow-1)                                             | Audit trail — 2026-06-15 through 2026-06-20                          | 📋 Historical                                                                   |


> **Phase 0 Gate summary:** Task 1 is complete — write today's date + PASS in the Task 1 sign-off box below. Flow 7 is deferred and does **not** block the sign-off. Merge this branch → Railway auto-deploys staging (Task 2). Production (Task 3) follows after staging is green.

---

## Automation already done — skip these


| What's covered                                                  | File                                           | Status                                                          |
| --------------------------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------- |
| Theme toggle (light/dark persist)                               | `e2e/design-consistency.spec.ts`               | ✅ 44/44 pass                                                    |
| AI chat panel opens in both themes                              | `e2e/design-consistency.spec.ts`               | ✅ PASS                                                          |
| AppHeader identical on all pages                                | `e2e/design-consistency.spec.ts`               | ✅ PASS                                                          |
| Body text 14px across pages                                     | `e2e/design-consistency.spec.ts`               | ✅ PASS                                                          |
| Pricing page readable in both themes                            | `e2e/design-consistency.spec.ts`               | ✅ PASS                                                          |
| Auth page form + Google button visible                          | `e2e/design-consistency.spec.ts`               | ✅ PASS                                                          |
| Generation result cards render, images decode, 16:9 ratio       | `e2e/us-design-003-generation-ux.spec.ts`      | ✅ PASS (mock)                                                   |
| "Use This Design" button has bg-primary styling                 | `e2e/us-design-003-generation-ux.spec.ts`      | ✅ PASS (mock)                                                   |
| Invalid prompt → styled guidance, no raw JSON                   | `e2e/us-design-003-generation-ux.spec.ts`      | ✅ PASS (mock)                                                   |
| Button heights ≤56px on all pages                               | `e2e/us-design-004-global-consistency.spec.ts` | ✅ PASS (Pricing) + run on staging                               |
| Card borders (borderWidth > 0)                                  | `e2e/us-design-004-global-consistency.spec.ts` | ✅ logic ready → run on staging                                  |
| Section spacing ≥20px                                           | `e2e/us-design-004-global-consistency.spec.ts` | ✅ logic ready → run on staging                                  |
| `--background` not hardcoded black/white                        | `e2e/us-design-004-global-consistency.spec.ts` | ✅ logic ready → run on staging                                  |
| Unit tests (payments)                                           | `api/tests/`                                   | ✅ 34/34 pass                                                    |
| Cross-browser smoke: Chrome, Firefox, Edge, Responsive 1280×800 | `e2e/flow6-cross-browser-smoke.spec.ts`        | ✅ 12/12 passed 2026-06-19 (Chrome 4/4 · Firefox 4/4 · Edge 4/4) |


Run `npx playwright test` on staging to confirm the logic-ready tests also pass with a live DB.

---

---

## Task 1 — Critical-Path Manual QA (local, before staging deploy)

> **Goal:** Confirm the core product works on your machine before committing to a deploy.  
> **Time:** ~2 hours  
> **Prerequisites:** `npm run dev` running locally; AI keys in `.env`; a test user account.

---

### 1A. Google OAuth


| #     | Check                                                                                              | Pass? | Notes                                                                                                                                                                                          |
| ----- | -------------------------------------------------------------------------------------------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GO-01 | Google Cloud Console: OAuth 2.0 Web Client created                                                 | ✅     | Created local client `InfographicAI — Local` on 2026-06-10                                                                                                                                     |
| GO-02 | Authorized redirect URI matches exactly: `http://localhost:5000/api/v1/auth/google/callback`       | ✅     | Confirmed — OAuth flow completed successfully                                                                                                                                                  |
| GO-03 | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` set in `.env`                    | ✅     | All three vars added to `.env` on 2026-06-10                                                                                                                                                   |
| GO-04 | **New user:** Click "Continue with Google" → Google consent → lands on `/templates` authenticated  | ✅     | Verified 2026-06-10 — [Din.Prajapati@gmail.com](mailto:Din.Prajapati@gmail.com)                                                                                                                |
| GO-05 | **Returning Google user:** Second login succeeds; session survives page refresh                    | ✅     | Verified 2026-06-10                                                                                                                                                                            |
| GO-06 | **Email already registered (local password user):** Google login links correctly, no duplicate org | ✅     | Verified by code review 2026-06-10 — `authService.googleLogin()` finds existing user by email and links `googleId`; ConflictException correctly thrown on duplicate email registration attempt |
| GO-07 | **Misconfigured client id:** user sees a clear error, not a silent hang                            | ✅     | Code fix deployed 2026-06-10 — `GoogleAuthGuard` redirects to `/auth?error=google_not_configured` when `GOOGLE_CLIENT_ID` is absent                                                            |


---

### 1B. Flow 1 — Registration + First Generation


| #        | Check                                                                                                                                        | Pass? | Notes                                                                                                                                                                                                                                                                                                                     |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1-01    | Register a brand new account with a fresh email at `/auth`                                                                                   | ✅     | Verified 2026-06-15 — redirected correctly to `/templates`                                                                                                                                                                                                                                                                |
| F1-02    | User + Organization created; lands on `/templates`                                                                                           | ✅     | Verified 2026-06-15 — bug fixed same session: registration without org name now auto-creates org (`auth.service.ts`)                                                                                                                                                                                                      |
| F1-03    | Open a template into the editor                                                                                                              | ✅     | Verified 2026-06-15                                                                                                                                                                                                                                                                                                       |
| F1-04    | Open AI Chat panel (purple Sparkles button)                                                                                                  | ✅     | Verified 2026-06-15                                                                                                                                                                                                                                                                                                       |
| F1-05    | Type a prompt with address + price (e.g. `Modern home at 123 Main St, Austin TX priced at $500,000`)                                         | ✅     | Verified 2026-06-15 — paste fixed same session: `EditorLayout` global Ctrl+V now skips TEXTAREA/INPUT                                                                                                                                                                                                                     |
| F1-06    | **Progress bar visible** during generation (not a frozen blank screen)                                                                       | ✅     | Verified 2026-06-15 — step checklist in chat bubble; overall % bar above input with step label and gradient fill                                                                                                                                                                                                          |
| F1-07    | Generation completes → **3 result variations appear** with images                                                                            | ✅     | Verified 2026-06-15                                                                                                                                                                                                                                                                                                       |
| F1-08    | **Image quality:** images look like infographics (not broken or blank); fit correctly on canvas for landscape, portrait, and premium quality | ✅     | Fix 2026-06-15: orientation picker + Quality picker; canvas artboard sync. Code-verified 2026-06-17: `AI_ARTBOARDS` map has correct Ideogram-matched ratios (1280×720 / 720×1280 / 1024×1024), `objectFit: contain`, full image decode before render, proxy URL for CORS                                                  |
| F1-09    | Usage counter shows **1/3** (FREE tier) after generation                                                                                     | ✅     | Verified 2026-06-15 — shows `2/3` (2 generations used)                                                                                                                                                                                                                                                                    |
| F1-10    | No critical errors in browser console (no red exceptions)                                                                                    | ✅     | Fix 2026-06-15: `CenterCanvas.tsx` skips `loadTemplateById` when variation has `previewImage`. Code-verified 2026-06-17: guard at `CenterCanvas.tsx:84–87` confirmed — AI variation path early-returns via `loadAiVariationToCanvas()`, never reaches `loadTemplateById()`                                                |
| F1-11    | **Usage limit enforced** — FREE account at 3/3 cannot start a 4th generation                                                                 | ✅     | Fix v2 applied 2026-06-15. Code-verified 2026-06-17: `generations.service.ts:47` calls `assertCanGenerateForUser()` before any OpenAI call; org resolved from DB (heals stale JWT `organizationId` via usage/infographic history); frontend `checkQuota()` fail-closed — returns `false` and shows toast on any API error |
| DEFERRED | **Variation preview modal** — clicking a thumbnail should open a full-size lightbox                                                          | —     | Not implemented; click = select only. Scheduled: Phase 1 (see §Deferred Feature Backlog)                                                                                                                                                                                                                                  |
| DEFERRED | **AI output as editable canvas elements** — variations should decompose into individual Text/Shape/Image layers                              | —     | Architectural gap: Ideogram returns flat PNG; no structured layout JSON from OpenAI. Scheduled: Phase 1 EPIC-AI-00 (see §Deferred Feature Backlog)                                                                                                                                                                        |


---

### 1C. Flow 2 — Paid Tier Generation + Usage Meter


| #     | Check                                                                            | Pass? | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ----- | -------------------------------------------------------------------------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F2-01 | Subscribe to SOLO plan (Razorpay test card `5267 3181 8797 5449`)                | ✅     | Verified 2026-06-17 — Razorpay checkout completed successfully                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| F2-02 | Plan shows as SOLO on Account page after webhook fires                           | ✅     | **Root cause found 2026-06-18:** Razorpay webhook was configured at wrong URL (`/api/v1/webhooks/razorpay` → 404); correct Express handler is at `/api/webhooks/razorpay`. Corrected URL in Razorpay Test Dashboard. Subscription manually activated to ACTIVE via Prisma for local dev. "Refresh to check status" button updated to use React Query `refetch()` with success/info toast instead of `window.location.reload()`. On staging/prod with correct public URL, webhook fires automatically — no manual step needed. |
| F2-03 | Generate 3 more infographics; usage counter updates (e.g. `3/50`)                | ✅     | Verified 2026-06-18 — after plan activated to SOLO (ACTIVE), usage counter correctly shows e.g. 4/50, 5/50 after each generation.                                                                                                                                                                                                                                                                                                                                                                                             |
| F2-04 | No false "limit reached" error at generation #4+ (SOLO allows 50/mo)             | ✅     | **Fix verified 2026-06-18.** Root cause: webhook URL misconfigured in local dev; plan stayed PENDING; org stayed FREE (limit=3). Fix 1 (2026-06-17): `resolveEffectiveTier()` in `usage-limit.service.ts` optimistically grants PENDING subscription's limits — covers the webhook-delay window. Fix 2 (2026-06-18): correct webhook URL (`/api/webhooks/razorpay` not `/api/v1/...`). After plan activation, 4th+ generations succeed as expected (50/mo).                                                                   |
| F2-05 | **4th generation on FREE account is blocked** with a clear limit/upgrade message | ✅     | Code-verified 2026-06-17 (same `assertCanGenerate()` path as F1-11). Scenario also observed during F2-04 bug: account was blocked at 3/3 before webhook fired — confirming FREE limit enforcement works correctly. Identical code path to F1-11 (✅ pass).                                                                                                                                                                                                                                                                     |


---

### 1D. Flow 3 — Canvas Editor


| #     | Check                                                           | Pass?    | Notes                                                                                                                                                                                                                                                        |
| ----- | --------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| F3-01 | Add a **Text** element → type something → visible on canvas     | ✅ AUTO   | Playwright: text element renders with default "Double click to edit" content. `e2e/qa-canvas-editor.spec.ts`                                                                                                                                                 |
| F3-02 | Add a **Shape** (rectangle/circle) → visible on canvas          | ✅ AUTO   | Playwright: Square + Circle each verified in separate tests (`F3-02a`, `F3-02b`). `e2e/qa-canvas-editor.spec.ts`                                                                                                                                             |
| F3-03 | Add an **Image** element → image displays                       | ✅ MANUAL | Verified by human 2026-06-16: image file selected via picker, rendered correctly on canvas.                                                                                                                                                                  |
| F3-04 | **Drag + resize** elements — smooth, no layout breakage         | ✅ MANUAL | Drag/resize smooth. **F3-04-B1 FIXED (2026-06-20):** Dimensions badge repositioned to bottom-left corner of the artboard viewport — no longer overlaps the selected element. Dark-mode contrast also fixed (`dark:bg-zinc-700/95` + `ring-1 ring-white/10`). |
| F3-05 | **Save** design → success toast                                 | ✅ AUTO   | Playwright: clicked Save → filled dialog → "Design saved successfully!" toast confirmed. `e2e/qa-canvas-editor.spec.ts`                                                                                                                                      |
| F3-06 | Navigate to `/my-designs` → saved design appears                | ✅ AUTO   | Playwright (chained with F3-05): saved design card visible in My Designs grid. `e2e/qa-canvas-editor.spec.ts`                                                                                                                                                |
| F3-07 | Open saved design → canvas restores correctly                   | ✅ AUTO   | Playwright (chained with F3-05/06): clicked card → `/editor?designId=` URL + text element visible. `e2e/qa-canvas-editor.spec.ts`                                                                                                                            |
| F3-08 | **PNG export** → file downloads, no browser chrome in the image | ✅ AUTO   | Playwright: download event captured, `suggestedFilename()` ends in `.png`. Visual check not automated. `e2e/qa-canvas-editor.spec.ts`                                                                                                                        |


---

### 1E. Flow 4 — AI Chat → "Use This Design" → Editor


| #     | Check                                                                                                                                     | Pass?                            | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F4-01 | From AI Chat, click a **category chip** (e.g. "Residential") → pre-fills context                                                          | ✅ AUTO                           | Playwright: clicked "Property Listings" chip (app has no "Residential" chip — closest match) → textarea visible and writable. `e2e/qa-canvas-editor.spec.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| F4-02 | Generate infographic → variations appear                                                                                                  | ✅ MANUAL                         | Verified 2026-06-16: 3 variations generated (Variation 1/2/3 thumbnails), Layout/Quality controls visible, Smart Suggestions populated with "residential" context.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| F4-03 | Click **"Use This Design"** → redirects to editor with the design loaded                                                                  | ✅ MANUAL ✅ ALL FINDINGS RESOLVED | Redirect to editor works. **FIXED F4-03-B1 (2026-06-16):** Zoom/preview added to variation cards (`MessageBubble.tsx`) — always-visible Preview badge, click image or badge opens full-size lightbox. **FIXED F4-03-B2 (2026-06-16):** AI Chat panel UI redesigned — removed 3 redundant rows (GenerationSettingsBar, Smart Suggestions, dead conversation history); Layout/Quality controls merged into icon bar with distinct coloured icons; "Customize" removed (identical to "Use This Design" — both loaded flat PNG); "Use This Design" button placed directly on each thumbnail card; chat panel repositioned beside the AI Sparkle button (not above it) and height increased to `calc(100vh-80px)`; send button now instant (usage quota check moved to after UI update). |
| F4-04 | Canvas in editor shows the generated infographic elements                                                                                 | 🔶 DEFERRED                      | Variation loads as a **flat PNG image**, not decomposed Text/Shape/Image layers. Known architectural gap: Ideogram returns a PNG; OpenAI layout JSON is not wired to canvas element decomposition. Scheduled: Phase 1 EPIC-AI-00.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| F4-05 | Elements are editable (click text → can type)                                                                                             | 🔶 DEFERRED                      | Blocked by F4-04 — no individual text/shape elements exist to edit; canvas holds a single image element. Same root cause: flat PNG from Ideogram. Scheduled: Phase 1 EPIC-AI-00.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| F4-06 | **Customize** button also works without breaking anything                                                                                 | ✅ MANUAL                         | Both "Use This Design" and "Customize" correctly load the infographic into the canvas editor without errors. **F4-06-UX1 RESOLVED (2026-06-20 code audit):** "Back to results" path confirmed implemented — "← Edit Details" button at `RightSidebar.tsx:719–725` returns user to property form; "results ready" pill at lines 831–844 re-opens variations without re-generating. Lightbox (GAP-01) also confirmed implemented (`RightSidebar.tsx:663–712` AnimatePresence modal + `ResultsVariations.tsx` openLightbox/closeLightbox). No new story needed.                                                                                                                                                                                                                        |
| F4-07 | **Session isolation** — User 1 generates → "Use This Design" → logs out → User 2 logs in same tab → canvas is blank (not User 1's design) | ✅                                | PT-07 bug found 2026-06-17 during manual testing. Fixed same session: `logout()` in `auth.tsx` now calls `clearUserStorage()` (removes `${STORAGE_PREFIX}_designs` + `${STORAGE_PREFIX}_autosave` from localStorage) and `useCanvasStore.getState().clearCanvas()` (resets in-memory Zustand store). Both paths covered: same-session login (Zustand) and page-reload-after-logout (localStorage).                                                                                                                                                                                                                                                                                                                                                                                  |


---

### 1F. Flow 5 — User Limits (Team Plan)


| #        | Check                                                                 | Pass? | Notes                                                                                           |
| -------- | --------------------------------------------------------------------- | ----- | ----------------------------------------------------------------------------------------------- |
| F5-01    | TEAM plan: add up to **5 users** in Account → Organization — succeeds | ✅     | 2026-06-19: added team-member.01/02/03 via invite; seats counted correctly (3/5 → 4/5 → 5/5)    |
| F5-02    | Adding a **6th user** → blocked with a clear "seat limit" message     | ✅     | 2026-06-19: "Seat limit reached" banner shown; Add button + email input disabled at cap         |
| F5-03    | Removed user loses access                                             | ✅     | 2026-06-19: Remove button tested; user.organizationId set to null; re-fetch confirms slot freed |
| DEFERRED | BROKERAGE plan                                                        | —     | PT-06 unresolved; skip this                                                                     |


---

### 1G. Flow 6 — Cross-Browser Smoke

> **Automated via Playwright.** Run: `npx playwright test e2e/flow6-cross-browser-smoke.spec.ts`  
> Requires `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` in `.env`.  
> Projects: `chrome-headed` (F6-01), `firefox-smoke` (F6-02), `msedge-smoke` (F6-03), `responsive-1280` (F6-04).  
> Install Firefox if needed: `npx playwright install firefox`


| #     | Check                                                                       | Pass?  | Notes                                                                                                                 |
| ----- | --------------------------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------- |
| F6-01 | **Chrome** — Flows 1 + 3 pass                                               | ✅ AUTO | `e2e/flow6-cross-browser-smoke.spec.ts` — project `chrome-headed`; 4/4 passed 2026-06-19                              |
| F6-02 | **Firefox** — `/templates`, `/editor`, `/auth` load without critical errors | ✅ AUTO | project `firefox-smoke`; 4/4 passed 2026-06-19                                                                        |
| F6-03 | **Edge** (Safari N/A on Windows 11) — same smoke                            | ✅ AUTO | project `msedge-smoke`; 4/4 passed 2026-06-19                                                                         |
| F6-04 | **Responsive** — at 1280×800 nothing is critically broken                   | ✅ AUTO | project `responsive-1280`; F6-S4 passed on Chrome-headed (maximized) + Firefox + Edge all at ≤5px overflow 2026-06-19 |


---

**Task 1 sign-off:** All P0 flows checked (1A–1G). Flow 7 (Right Sidebar) deferred to Phase 1 — does not block this gate.  
Date: 2026-06-20 Result: ✅ PASS

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


| #    | Step                                                                                         | Done? | Notes                                |
| ---- | -------------------------------------------------------------------------------------------- | ----- | ------------------------------------ |
| S-01 | Create a Neon project (or reuse existing)                                                    | ☐     | Dashboard: console.neon.tech         |
| S-02 | Create a `staging` branch off the `main`/`production` Neon branch                            | ☐     | Branches → New branch                |
| S-03 | Copy the `staging` branch **direct connection string** (non-pooled, with `?sslmode=require`) | ☐     | Use Direct — not the Pooler endpoint |


**Step 2 — Railway: app service (no Railway Postgres)**


| #    | Step                                                                                                    | Done? | Notes                                            |
| ---- | ------------------------------------------------------------------------------------------------------- | ----- | ------------------------------------------------ |
| S-04 | `railway login` + `railway init` (project name: `infographic-editor`)                                   | ☐     |                                                  |
| S-05 | In Railway dashboard: create `staging` environment (Settings → Environments → New)                      | ☐     |                                                  |
| S-06 | Set Railway staging variables (see table below)                                                         | ☐     |                                                  |
| S-07 | **Bootstrap first deploy:** `railway up --detach` *(one-time only — creates the service)*               | ☐     | After this, merges to `main` trigger auto-deploy |
| S-08 | In Railway service settings → Deploy → set **Branch = `main`** and enable **Auto Deploy**               | ☐     | This wires the CI/CD flow from the strategy      |
| S-09 | `railway logs` → confirm `prisma db push` + `serving on port` + `Nest application successfully started` | ☐     | First boot seeds templates automatically         |
| S-10 | `railway domain` → note the staging URL                                                                 | ☐     |                                                  |


**Required Railway staging variables:**


| Variable                                    | Value                                                   |
| ------------------------------------------- | ------------------------------------------------------- |
| `DATABASE_URL`                              | Neon **staging** branch direct URL (`?sslmode=require`) |
| `NODE_ENV`                                  | `production`                                            |
| `JWT_SECRET`                                | Random 32-byte base64 — unique for staging              |
| `SESSION_SECRET`                            | Random 32-byte base64 — unique for staging              |
| `OPENAI_API_KEY`                            | Your OpenAI key                                         |
| `IDEOGRAM_API_KEY`                          | Your Ideogram key (**required for AC3 image fidelity**) |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`   | Razorpay **TEST** keys                                  |
| `RAZORPAY_PLAN_SOLO_MONTHLY` etc.           | Razorpay test plan IDs                                  |
| `VITE_RAZORPAY_KEY_ID`                      | Same TEST key (browser-exposed)                         |
| `RAZORPAY_WEBHOOK_SECRET`                   | Test webhook secret                                     |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth credentials                                       |
| `GOOGLE_CALLBACK_URL`                       | `https://<staging-url>/api/v1/auth/google/callback`     |


> ⚠️ Do **not** add a Railway Postgres service. The DB is on Neon.  
> ⚠️ Do **not** set `PORT` — Railway injects it automatically.

---

### 2B. Deploy: Merge to `main` → Staging Auto-Deploys

> Per `docs/DEPLOYMENT_STRATEGY.md` §3: merging to `main` is the staging deploy trigger — not `railway up`.


| #    | Step                                                                                       | Done? | Notes                   |
| ---- | ------------------------------------------------------------------------------------------ | ----- | ----------------------- |
| S-11 | Open a PR from `feat/epic-design-02-ui-redesign` → `main` on GitHub                        | ☐     | Use STORY.md as PR body |
| S-12 | Review the diff; confirm no unintended files (`.env`, secrets)                             | ☐     |                         |
| S-13 | **Merge the PR** (squash merge) → Railway detects push to `main` and starts staging deploy | ☐     | Watch Railway dashboard |
| S-14 | Railway deploy completes → `railway logs` shows clean startup                              | ☐     | Same checks as S-09     |


---

### 2B. Run Automated E2E Suite on Staging

```bash
# Point Playwright at the staging URL
PLAYWRIGHT_BASE_URL=https://<your-staging>.up.railway.app npx playwright test
```


| Test file                                      | Expected                                  | Pass? |
| ---------------------------------------------- | ----------------------------------------- | ----- |
| `e2e/design-consistency.spec.ts`               | All 44 should pass                        | ☐     |
| `e2e/us-design-002-editor-tokens.spec.ts`      | Pass                                      | ☐     |
| `e2e/us-design-003-generation-ux.spec.ts`      | Pass (mock-backed; login required)        | ☐     |
| `e2e/us-design-004-global-consistency.spec.ts` | All 9 pass (auth-gated tests now have DB) | ☐     |
| `e2e/m-design-03-token-foundation.spec.ts`     | Pass                                      | ☐     |
| `e2e/m-design-04-domain-colors.spec.ts`        | Pass                                      | ☐     |


> If any test fails, investigate before proceeding to Task 3.

---

### 2C. US-DESIGN-003 AC3 — Live Ideogram Image Fidelity (staging only)

> Automation covers the *layout contract* (cards render, images decode, 16:9). Only a human can judge artwork quality.


| #    | Check                                                                                              | Pass? | Notes                                                    |
| ---- | -------------------------------------------------------------------------------------------------- | ----- | -------------------------------------------------------- |
| I-01 | Open staging URL → register fresh account                                                          | ☐     |                                                          |
| I-02 | Open editor from a template → open AI Chat                                                         | ☐     |                                                          |
| I-03 | Submit: `Modern home at 123 Main St, Austin TX priced at $500,000`                                 | ☐     |                                                          |
| I-04 | **Progress bar appears** during generation (Socket.io working)                                     | ☐     | If frozen, EPIC-AI-00 US-AI-001 needed                   |
| I-05 | **3 result cards appear** with real Ideogram images (not broken/blank)                             | ☐     |                                                          |
| I-06 | Images are **correctly proportioned** (not squished, not cropped weirdly)                          | ☐     | Automation asserts 16:9 ratio; you verify visual quality |
| I-07 | **Usage counter increments**: Account → Usage shows `1/3` (FREE tier)                              | ☐     |                                                          |
| I-08 | **Repeat** (generate 2 more): counter shows `2/3`, `3/3`                                           | ☐     |                                                          |
| I-09 | **4th attempt on FREE tier** → blocked with correct message                                        | ☐     |                                                          |
| I-10 | **Error state:** disconnect IDEOGRAM_API_KEY temporarily → styled error bubble shown, not raw JSON | ☐     | Optional: verify MessageBubble error styling             |


---

### 2D. US-DESIGN-004 Visual Spot-Checks (staging only)

> Automation checks computed CSS values. You confirm they *look* right.


| #    | Check                                                                                                                              | Pass? | Notes                                                    |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------- | ----- | -------------------------------------------------------- |
| V-01 | **AC2 — Button heights:** Primary buttons on Pricing, Account, Templates look the same height (not some tall, some short)          | ☐     | ~36px visually                                           |
| V-02 | **AC3 — Card borders:** Template cards and My Designs cards have a visible, consistent border (not some with border, some without) | ☐     |                                                          |
| V-03 | **AC3 — Chart:** Usage Dashboard → chart data labels are readable in **Dark mode**                                                 | ☐     | Switch to dark, go to `/usage`                           |
| V-04 | **AC4 — Spacing:** Account page sections have consistent vertical gaps (not sections crammed together or too spread)               | ☐     |                                                          |
| V-05 | **AC6 — No split-personality:** Light mode — no page has a jarring dark panel sitting next to a light panel                        | ☐     | Check `/templates`, `/account`, `/pricing` in light mode |
| V-06 | **AC6 — No split-personality:** Dark mode — no page has a jarring white panel                                                      | ☐     | Same pages in dark mode                                  |


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


| #    | Step                                                                         | Done? | Notes                                                        |
| ---- | ---------------------------------------------------------------------------- | ----- | ------------------------------------------------------------ |
| P-01 | Confirm the Neon `main` branch is the production branch (default)            | ☐     | Or create a `production` branch if you want named separation |
| P-02 | Copy the production branch **direct connection string** (`?sslmode=require`) | ☐     |                                                              |


---

### 3B. Railway Production Environment — One-Time Setup


| #    | Step                                                                                             | Done? | Notes                                                                   |
| ---- | ------------------------------------------------------------------------------------------------ | ----- | ----------------------------------------------------------------------- |
| P-03 | In Railway dashboard: create `production` environment (mark as **Protected**)                    | ☐     | Protected = no accidental deploys                                       |
| P-04 | Set all production variables (see table below)                                                   | ☐     | **LIVE keys only — never TEST keys here**                               |
| P-05 | In Railway service settings → Deploy → set **Deploy Trigger = Git tag (`v`*)**                   | ☐     | Per strategy §3: production deploys from a version tag, not branch push |
| P-06 | **Bootstrap first deploy:** `railway up --detach` from the `production` environment *(one-time)* | ☐     | Creates the service; subsequent deploys are tag-triggered               |
| P-07 | `railway logs` → confirm clean startup                                                           | ☐     |                                                                         |
| P-08 | `railway domain` → set custom domain or note Railway URL                                         | ☐     |                                                                         |


---

### 3C. Release: Tag `v1.0.0` → Production Auto-Deploys

> Per `docs/DEPLOYMENT_STRATEGY.md` §3: production deploys from a tag push, not a merge.


| #    | Step                                                                                   | Done? | Notes                             |
| ---- | -------------------------------------------------------------------------------------- | ----- | --------------------------------- |
| P-09 | Confirm `main` is green on staging and all Task 2 checks are signed off                | ☐     | Don't tag until staging is stable |
| P-10 | `git tag v1.0.0 -m "InfographicAI v1.0.0 — Phase 0 launch"`                            | ☐     |                                   |
| P-11 | `git push origin v1.0.0` → Railway detects tag and starts production deploy            | ☐     |                                   |
| P-12 | Railway deploy completes → `railway logs` shows clean startup (production environment) | ☐     |                                   |


**Required Railway production variables (P-04):**


| Variable                                    | Value                                                      |
| ------------------------------------------- | ---------------------------------------------------------- |
| `DATABASE_URL`                              | Neon **production** branch direct URL (`?sslmode=require`) |
| `NODE_ENV`                                  | `production`                                               |
| `JWT_SECRET`                                | **New** random 32-byte — **different from staging**        |
| `SESSION_SECRET`                            | **New** random 32-byte — **different from staging**        |
| `OPENAI_API_KEY`                            | Your OpenAI key                                            |
| `IDEOGRAM_API_KEY`                          | Your Ideogram key                                          |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`   | **LIVE** Razorpay keys — not test                          |
| `RAZORPAY_PLAN_SOLO_MONTHLY` etc.           | **LIVE** plan IDs from Razorpay Dashboard                  |
| `VITE_RAZORPAY_KEY_ID`                      | **LIVE** key (browser-exposed)                             |
| `RAZORPAY_WEBHOOK_SECRET`                   | Live webhook secret                                        |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth credentials                                          |
| `GOOGLE_CALLBACK_URL`                       | `https://<prod-url>/api/v1/auth/google/callback`           |
| `SENTRY_DSN`                                | Paste from Sentry project dashboard                        |
| `VITE_SENTRY_DSN`                           | Same value (browser-exposed)                               |


> ⚠️ LIVE Razorpay keys must **never** appear in staging variables. If that happens, rotate them immediately in the Razorpay Dashboard.

---

### 3D. Production Smoke Test


| #    | Check                                                                          | Pass? | Notes                                          |
| ---- | ------------------------------------------------------------------------------ | ----- | ---------------------------------------------- |
| P-13 | `GET https://<prod-url>/api/health` returns `{"status":"ok","db":"connected"}` | ☐     |                                                |
| P-14 | Register a real account → lands on `/templates`                                | ☐     | `prisma db push` at first boot seeds templates |
| P-15 | Open template → Editor loads                                                   | ☐     |                                                |
| P-16 | Generate one infographic (uses live Ideogram key)                              | ☐     | Costs ~$0.025 per image                        |
| P-17 | Usage counter shows `1/3` (FREE tier)                                          | ☐     |                                                |
| P-18 | **LIVE Razorpay:** Complete a SOLO monthly checkout with a real card           | ☐     | Costs ₹999 — use your own card for final smoke |
| P-19 | Plan shows as SOLO after webhook fires                                         | ☐     | Check Account page                             |
| P-20 | Generate more infographics; counter updates (e.g. `2/50`, `3/50`)              | ☐     |                                                |


---

### 3E. Sentry Verification


| #    | Check                                                                                            | Pass? | Notes                                                      |
| ---- | ------------------------------------------------------------------------------------------------ | ----- | ---------------------------------------------------------- |
| P-21 | Open Sentry dashboard → InfographicAI project                                                    | ☐     |                                                            |
| P-22 | Trigger a test event: browser console on production URL → `throw new Error("Sentry smoke test")` | ☐     |                                                            |
| P-23 | Event appears in Sentry within ~30 seconds                                                       | ☐     |                                                            |
| P-24 | **Source maps** resolve: Sentry shows readable filenames, not bundle hashes                      | ☐     | If not, add `SENTRY_AUTH_TOKEN` to Railway build variables |


---

### 3F. Google OAuth — Production


| #    | Check                                                                       | Pass? | Notes                                            |
| ---- | --------------------------------------------------------------------------- | ----- | ------------------------------------------------ |
| P-25 | Google Cloud Console: add production domain to **Authorized redirect URIs** | ☐     | `https://<prod-url>/api/v1/auth/google/callback` |
| P-26 | Google sign-in works on production                                          | ☐     |                                                  |


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


| Item                                                     | File                                | Status |
| -------------------------------------------------------- | ----------------------------------- | ------ |
| `railway.json` with build + start + healthcheck          | `railway.json`                      | ✅      |
| `.nvmrc` (Node 22)                                       | `.nvmrc`                            | ✅      |
| `db:deploy` script (`prisma db push` at container start) | `package.json`                      | ✅      |
| Cross-platform `reusePort` fix (Windows safe)            | `server/index.ts`                   | ✅      |
| `.env.production.example` with all required vars         | `.env.production.example`           | ✅      |
| Step-by-step deploy guide                                | `docs/setup/RAILWAY_NEON_DEPLOY.md` | ✅      |
| Architecture decision documented (Neon + Railway)        | `docs/DEPLOYMENT_STRATEGY.md` §6    | ✅      |
| Sentry DSN wired in both frontend + API                  | `.env.example`                      | ✅      |


---

### Do now (Phase 0 Tasks 2 + 3 above): ~4–5 hours


| Item                                                       | Effort | Notes                                           |
| ---------------------------------------------------------- | ------ | ----------------------------------------------- |
| Create Neon project + staging + production branches        | 20 min | Dashboard only                                  |
| Create Railway project + staging + production environments | 30 min | `railway init`, set variables                   |
| First deploy + confirm startup logs                        | 30 min | Expect 1–2 retry cycles while setting variables |
| Run E2E on staging                                         | 30 min | `npx playwright test` against staging URL       |
| Production smoke + Sentry verify                           | 30 min | One real checkout, Sentry test event            |
| Google OAuth production callback update                    | 15 min | Google Cloud Console redirect URI               |


---

### Do after Phase 0 (Phase 1 prep): ~1 day total, spread over 2 sessions


| Item                                                                                             | When                                       | Effort  | Why                                                 |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------ | ------- | --------------------------------------------------- |
| **GitHub Actions CI pipeline** (`.github/workflows/ci.yml`) — typecheck + unit + E2E on every PR | Before Phase 1 first PR                    | ~2 hrs  | Without this, PRs are unguarded                     |
| **PR environments** on Railway (ephemeral per PR → Neon branch per PR)                           | Phase 1 kickoff                            | ~2 hrs  | Enables stakeholder review without local setup      |
| **Switch `prisma db push` → `prisma migrate deploy`** + commit baseline migration                | After first real user is on prod           | ~1 hr   | Required before any schema change on a live dataset |
| Feature-flag mechanism (env-var first: `FEATURE_X=true`)                                         | When first dark-launch needed (EPIC-AI-00) | ~30 min | Deploy EPIC-AI-00 dark while staging                |


---

### Do in Phase 2–3 (do not do now)


| Item                                     | When                       | Why defer                                             |
| ---------------------------------------- | -------------------------- | ----------------------------------------------------- |
| Postgres → Prisma Migrate full history   | Phase 2                    | Only needed when you have live users + schema changes |
| Progressive rollout / canary (1% → 100%) | Phase 3+                   | Not needed until meaningful traffic                   |
| `flags` table or Unleash/Flagsmith       | Phase 3+                   | Env-var flags are enough through Phase 2              |
| Redis / job queue for generation         | Phase 3 (batch processing) | Only needed for EPIC-AI-03 parallel batch             |
| OpenTelemetry → Grafana/Datadog          | Phase 5                    | EPIC-INFRA-02                                         |


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

---

## Deferred Feature Backlog — Architectural Gaps Found During Phase 0 QA

> These items were discovered during the Phase 0 QA session on **2026-06-15** and confirmed as **architectural gaps** — not simple bugs. They are deferred to Phase 1 as planned features.

---

### GAP-01 — Variation Preview Modal (Lightbox on thumbnail click)

> ✅ **IMPLEMENTED — 2026-06-20 code audit confirmed.** No longer a gap.


| Field                       | Detail                                                                                                                                                                                                                                                                                               |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Discovered**              | 2026-06-15 · Flow 1 F1-07                                                                                                                                                                                                                                                                            |
| **Resolved**                | 2026-06-20 — code audit confirmed full implementation                                                                                                                                                                                                                                                |
| **Implementation location** | `RightSidebar.tsx:663–712` — AnimatePresence lightbox modal with full-size preview, "← Edit Details" back button (`RightSidebar.tsx:719–725`), "results ready" pill to re-open without re-generating (`RightSidebar.tsx:831–844`). Also `ResultsVariations.tsx` with `openLightbox`/`closeLightbox`. |
| **Original description**    | Clicking a variation thumbnail opens a full-size preview modal — implemented. "Use This Design" and "Customize" CTAs present in modal.                                                                                                                                                               |


---

### GAP-02 — AI Generation Output as Editable Canvas Elements


| Field                  | Detail                                                                                                                                                                                                                                                               |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Discovered**         | 2026-06-15 · Flow 1 F1-07 / Flow 4 F4-04                                                                                                                                                                                                                             |
| **Current behaviour**  | Ideogram returns a flat PNG image URL. The canvas editor loads this as a single locked `ImageElement`. Individual text, shapes, and layout zones are not separately editable.                                                                                        |
| **Expected behaviour** | After clicking "Use This Design", the canvas should contain discrete, editable elements: a background image layer, headline `TextElement`, price `TextElement`, address `TextElement`, agent/logo `ImageElement`, etc. — each independently draggable and styleable. |
| **Root cause**         | Two-part architectural gap:                                                                                                                                                                                                                                          |
|                        | 1. **AI output** — `AiOrchestrator` / OpenAI call currently returns an image-generation prompt string, not a structured JSON layout (e.g. `{ background, elements: [...] }`).                                                                                        |
|                        | 2. **Canvas ingestion** — `generations.service.ts` has no pipeline step to convert structured JSON → `CanvasElement[]` before persisting the `Infographic.propertyData`.                                                                                             |
| **Effort estimate**    | ~2–3 days — update OpenAI prompt to emit structured layout JSON; add layout-to-canvas mapper; update `generations.service.ts` → `propertyData` pipeline; update `AiOrchestrator`; add Playwright test for element count on generated design                          |
| **Suggested target**   | Phase 1 · EPIC-AI-00 (US-AI-002 or new story)                                                                                                                                                                                                                        |
| **Story draft**        | As a user, I want the AI-generated infographic to open in the canvas editor with individually editable text and image elements so I can customise every part of the design without starting from scratch.                                                            |
| **Dependencies**       | Requires OpenAI prompt engineering + schema definition for layout JSON; coordinate with canvas element renderer in `canvasUtils.ts`                                                                                                                                  |


---

*Created: 2026-06-09 · Owner: Dinesh · Companion to `docs/DEPLOYMENT_STRATEGY.md`, `docs/setup/RAILWAY_NEON_DEPLOY.md`, `docs/testing/MVP_CRITICAL_PATH_QA.md*`
*Deferred section added: 2026-06-15 · QA session findings*
*Right Sidebar section added: 2026-06-16*

---

---

## Flow 7 — Right Sidebar: Design / Property / Agent Panel

> ⏸ **DEFERRED TO PHASE 1** — 2026-06-20  
> All bugs originally logged as RS-H03, RS-P10, RS-P11, RS-A07, RS-A08 were verified as already implemented during the 2026-06-20 code audit. The 29 automatable checks (Playwright spec `e2e/right-sidebar.spec.ts`) have not been written yet — this is Phase 1 work, not a Phase 0 blocker.  
> **This section does NOT block the Task 1 sign-off or the staging deploy.**  
> Priority will be set after staging deployment is complete and Phase 1 planning begins.

> **Component:** `client/src/components/editor/RightSidebar.tsx`  
> **Sub-forms:** `PropertyDetailsForm.tsx` (Property tab) · `AgentInfoForm.tsx` (Agent tab)  
> **Where to test:** Open `/editor` from any template → right-hand panel (320px wide sidebar)

---

### 7A. Sidebar Header — Generate Template Button


| #      | Check                                                                                                                                                                                            | Automate? | Pass? | Notes                                                      |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- | ----- | ---------------------------------------------------------- |
| RS-H01 | "Generate Template" button visible at top of sidebar with Sparkles icon                                                                                                                          | ✅ AUTO    | ☐     | Assert `button:has-text("Generate Template")` visible      |
| RS-H02 | Button has `bg-primary` styling (blue)                                                                                                                                                           | ✅ AUTO    | ☐     | Assert computed background-color matches `--primary` token |
| RS-H03 | ~~⚠️ BUG~~ — **STALE (2026-06-20):** `onClick` handler confirmed wired — `handleGenerate()` at `RightSidebar.tsx:335`. Reads `usePropertyStore` + `useAgentStore`, calls AI generation pipeline. | MANUAL    | ✅     | Verified by code audit 2026-06-20. No fix needed.          |


---

### 7B. Tab Switcher — Design / Property / Agent


| #      | Check                                                                 | Automate? | Pass? | Notes                                                      |
| ------ | --------------------------------------------------------------------- | --------- | ----- | ---------------------------------------------------------- |
| RS-T01 | Three tabs visible: "Design", "Property", "Agent"                     | ✅ AUTO    | ☐     | Assert all three tab buttons present                       |
| RS-T02 | Default active tab is "Design" (highlighted background + shadow)      | ✅ AUTO    | ☐     | Assert "Design" button has `bg-background shadow-sm` class |
| RS-T03 | Clicking "Property" tab switches content to Property Information form | ✅ AUTO    | ☐     | Click tab → assert "Property Information" heading visible  |
| RS-T04 | Clicking "Agent" tab switches content to Agent Information form       | ✅ AUTO    | ☐     | Click tab → assert "Agent Information" heading visible     |
| RS-T05 | Clicking "Design" tab restores Brand Styles + Quick Styles content    | ✅ AUTO    | ☐     | Click → assert "Brand Styles" heading visible              |
| RS-T06 | Tab content is scrollable (overflow does not break layout)            | MANUAL    | ☐     | Fill all Agent fields → verify scrolling works, no cutoff  |


---

### 7C. Design Tab — Brand Styles


| #      | Check                                                                                                                | Automate? | Pass? | Notes                                                                           |
| ------ | -------------------------------------------------------------------------------------------------------------------- | --------- | ----- | ------------------------------------------------------------------------------- |
| RS-D01 | 6 built-in palette cards render (Luxury Gold, Modern Blue, Natural Green, Elegant Navy, Sunset Orange, Royal Purple) | ✅ AUTO    | ☐     | Assert 6 palette buttons in grid                                                |
| RS-D02 | Each palette card shows a colour swatch preview (coloured rectangle with "Aa" text)                                  | MANUAL    | ☐     | Visual — assert `div[style*="background-color"]` exists per card                |
| RS-D03 | Clicking a palette card selects it — card gets `border-foreground bg-muted` highlight                                | ✅ AUTO    | ☐     | Click "Modern Blue" → assert selected border class                              |
| RS-D04 | Clicking a palette changes the canvas background colour                                                              | MANUAL    | ☐     | Visual — canvas artboard background should change to the palette's light colour |
| RS-D05 | Clicking a palette recolours existing text/shape elements on canvas                                                  | MANUAL    | ☐     | Add a text element first; click palette; verify element colour updates          |
| RS-D06 | "+ Custom" button opens BrandPaletteDialog                                                                           | ✅ AUTO    | ☐     | Click button → assert dialog/modal visible                                      |
| RS-D07 | Custom palette can be created with a name and 5 colour swatches                                                      | MANUAL    | ☐     | Fill dialog → Save → palette appears in grid with "Custom" badge                |
| RS-D08 | Custom palette: hover shows "⋮" menu; Edit and Delete items work                                                     | MANUAL    | ☐     | Hover card → click ⋮ → Edit opens dialog prefilled; Delete removes card         |
| RS-D09 | Custom palettes persist across page reload (localStorage)                                                            | ✅ AUTO    | ☐     | Create palette → reload page → assert palette still visible                     |
| RS-D10 | Deleting a built-in palette is NOT possible (no ⋮ menu on built-in cards)                                            | ✅ AUTO    | ☐     | Assert no DropdownMenu trigger on Luxury Gold / Modern Blue cards               |


---

### 7D. Design Tab — Quick Styles


| #      | Check                                                                                                                 | Automate? | Pass? | Notes                                                                            |
| ------ | --------------------------------------------------------------------------------------------------------------------- | --------- | ----- | -------------------------------------------------------------------------------- |
| RS-Q01 | 8 Quick Style buttons visible: Headline Large, Headline Medium, Title, Subtitle, Body Large, Body, Caption, Price Tag | ✅ AUTO    | ☐     | Assert 8 buttons in grid                                                         |
| RS-Q02 | Each Quick Style button shows a white chip with the letter "Aa" or "$" (example) at the correct font size             | MANUAL    | ☐     | Visual — font size legible; colours match selected theme                         |
| RS-Q03 | Clicking "Headline Large" adds a TextElement to the canvas                                                            | ✅ AUTO    | ☐     | Click button → assert new canvas element with `fontSize=48` appears              |
| RS-Q04 | Clicking "Price Tag" adds a TextElement with green dollar-style colour                                                | ✅ AUTO    | ☐     | Assert new element has `color` matching Price Tag mapping                        |
| RS-Q05 | After selecting a dark-background theme, Quick Style colours shift to light ink (contrast fix)                        | MANUAL    | ☐     | Select Royal Purple palette; verify "Body" text chip uses light colour, not dark |
| RS-Q06 | "Quick Tip" info box is visible below Quick Styles                                                                    | ✅ AUTO    | ☐     | Assert text "Select an element on the canvas" is visible                         |


---

### 7E. Property Tab — PropertyDetailsForm

> **File:** `client/src/components/editor/PropertyDetailsForm.tsx`


| #      | Check                                                                                                                                                         | Automate? | Pass? | Notes                                                                                                           |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ----- | --------------------------------------------------------------------------------------------------------------- |
| RS-P01 | "Property Information" heading and subtitle visible after switching to Property tab                                                                           | ✅ AUTO    | ☐     | Assert heading text                                                                                             |
| RS-P02 | Required fields show red asterisk (*): Property Type, Price, Address                                                                                          | ✅ AUTO    | ☐     | Assert `span.text-red-500` next to each required label                                                          |
| RS-P03 | Property Type dropdown has 4 options: Residential, Commercial, Luxury, Land/Lots                                                                              | ✅ AUTO    | ☐     | Open Select → assert 4 SelectItems                                                                              |
| RS-P04 | Default values pre-fill correctly: Type=Residential, Price=$500,000, Beds=3, Baths=2, Sqft=2,500, Address="123 Test Avenue, Design City"                      | ✅ AUTO    | ☐     | Assert default input values on mount                                                                            |
| RS-P05 | Beds NumberStepper: clicking "+" increments; clicking "−" decrements; min=0 enforced                                                                          | ✅ AUTO    | ☐     | Click + 3 times → assert value 6; click − 7 times → assert 0 (not negative)                                     |
| RS-P06 | Baths NumberStepper: same behaviour as Beds                                                                                                                   | ✅ AUTO    | ☐     |                                                                                                                 |
| RS-P07 | Description textarea shows live character counter ("N/500 characters")                                                                                        | ✅ AUTO    | ☐     | Type 10 chars → assert counter shows "N/500"                                                                    |
| RS-P08 | Features & Amenities: 6 checkboxes render (Pool, Garage, Garden, Fireplace, AC, Heating)                                                                      | ✅ AUTO    | ☐     | Assert 6 checkbox inputs present                                                                                |
| RS-P09 | Checkboxes can be checked and unchecked                                                                                                                       | ✅ AUTO    | ☐     | Click Pool → assert checked; click again → assert unchecked                                                     |
| RS-P10 | ~~⚠️ DISCONNECTED~~ — **STALE (2026-06-20):** Property form uses `usePropertyStore` (Zustand) — data persists across tab switches.                            | MANUAL    | ✅     | Verified by code audit 2026-06-20. `PropertyDetailsForm` reads/writes `usePropertyStore`, not local `useState`. |
| RS-P11 | ~~⚠️ DISCONNECTED~~ — **STALE (2026-06-20):** `buildPropertyPrompt()` at `RightSidebar.tsx:244` passes all property + agent data into the AI generation call. | MANUAL    | ✅     | Verified by code audit 2026-06-20. Property + agent data flows to AI via `buildPropertyPrompt()`.               |


---

### 7F. Agent Tab — AgentInfoForm

> **File:** `client/src/components/editor/AgentInfoForm.tsx`


| #      | Check                                                                                                                                                                    | Automate? | Pass? | Notes                                                                                  |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- | ----- | -------------------------------------------------------------------------------------- |
| RS-A01 | "Agent Information" heading and subtitle visible after switching to Agent tab                                                                                            | ✅ AUTO    | ☐     | Assert heading text                                                                    |
| RS-A02 | Required fields show red asterisk (*): Agent Name, Phone Number, Email                                                                                                   | ✅ AUTO    | ☐     | Assert `span.text-red-500` next to each required label                                 |
| RS-A03 | Agent photo upload area renders: 80×80 dashed border box with User icon when empty                                                                                       | ✅ AUTO    | ☐     | Assert upload area and `User` icon visible                                             |
| RS-A04 | Clicking "Upload Photo" triggers file picker (JPG/PNG, max 5MB)                                                                                                          | MANUAL    | ☐     | Click button → OS file dialog opens; select an image → preview renders in 80×80 box    |
| RS-A05 | Agent Name, Phone, Email, License, Brokerage, Website fields render and accept input                                                                                     | ✅ AUTO    | ☐     | Fill each field → assert value                                                         |
| RS-A06 | Agent data persists when switching tabs (Zustand in-memory store)                                                                                                        | ✅ AUTO    | ☐     | Fill Agent Name → switch to Design → switch back → name still present                  |
| RS-A07 | ~~⚠️ DISCONNECTED~~ — **STALE (2026-06-20):** Social media fields (Facebook, Instagram, LinkedIn) were removed from `AgentInfoForm.tsx`. No phantom inputs exist.        | MANUAL    | ✅     | Verified by code audit 2026-06-20. Fields are gone — not disconnected, simply removed. |
| RS-A08 | ~~⚠️ DISCONNECTED~~ — **STALE (2026-06-20):** `useAgentStore` data is consumed by `buildPropertyPrompt()` at `RightSidebar.tsx:244` and flows to the AI generation call. | MANUAL    | ✅     | Verified by code audit 2026-06-20. Agent name, phone, brokerage passed into AI prompt. |


---

### 7G. Redundant / Dead Code Found During Audit

> These items are not test cases — they are engineering findings that should be scheduled as cleanup tasks.  
> **Status updated 2026-06-20** — items re-verified against live code; stale findings corrected.


| Finding                                            | Severity         | Location                                         | Status  | Description                                                                                                             |
| -------------------------------------------------- | ---------------- | ------------------------------------------------ | ------- | ----------------------------------------------------------------------------------------------------------------------- |
| `**PropertyPanel.tsx` — entire file is dead code** | High             | `client/src/components/editor/PropertyPanel.tsx` | 🔲 Open | Never imported anywhere. `handleGenerate()` on line 52 only `console.log`s. **Action: delete file in Phase 1 cleanup.** |
| **"Generate Template" button has no `onClick`**    | ~~High~~ → N/A   | `RightSidebar.tsx:479`                           | ✅ Stale | `handleGenerate()` at line 335 is wired. Verified 2026-06-20. Not a bug.                                                |
| `**PropertyDetailsForm` state not persisted**      | ~~Medium~~ → N/A | `PropertyDetailsForm.tsx`                        | ✅ Stale | Uses `usePropertyStore` (Zustand). Persists across tab switches. Verified 2026-06-20. Not a bug.                        |
| **Agent social media fields are phantom inputs**   | ~~Low~~ → N/A    | `AgentInfoForm.tsx:182–192`                      | ✅ Stale | Social media fields were removed. No phantom inputs remain. Verified 2026-06-20.                                        |
| **Property + Agent form data never flows to AI**   | ~~High~~ → N/A   | `RightSidebar.tsx`, `AIChatBox.tsx`              | ✅ Stale | `buildPropertyPrompt()` at `RightSidebar.tsx:244` passes property + agent data into AI generation. Verified 2026-06-20. |


---

### 7H. Automation Coverage Summary


| Category      | Automatable | Manual  | Total  |
| ------------- | ----------- | ------- | ------ |
| Header button | 2           | 1 (bug) | 3      |
| Tab switching | 5           | 1       | 6      |
| Brand Styles  | 5           | 5       | 10     |
| Quick Styles  | 4           | 2       | 6      |
| Property tab  | 8           | 3       | 11     |
| Agent tab     | 5           | 3       | 8      |
| **Total**     | **29**      | **15**  | **44** |


Suggested Playwright file: `e2e/right-sidebar.spec.ts` — run against local dev with no auth required (editor accessible after template open).

---

*Right Sidebar section added: 2026-06-16*

---

## QA Session Log — 2026-06-15 (Flow 1)

> **Duration:** ~1 hr 45 min active (4:10 PM → ~5:55 PM IST, UTC+5:30)  
> **Mode:** Collaborative — Dinesh tests in browser, AI fixes bugs in code  
> **Scope:** Task 1 §1B Flow 1 (Registration + First Generation)

### Time breakdown


| Block     | Time (approx) | Activity                                                                                                                        |
| --------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 4:10–4:21 | 11 min        | Session setup, F1-01/F1-02 pass, org-on-register bug found                                                                      |
| 4:21–4:46 | 25 min        | F1-03–F1-06: paste blocked, generation error, progress bar frozen                                                               |
| 4:46–4:56 | 10 min        | F1-05 ✅ paste fix; F1-06 progress still broken; deferred GAP-01/GAP-02 logged                                                   |
| 4:56–5:30 | 34 min        | F1-06 ✅ progress bar; F1-07 ✅ 3 variations; F1-08 canvas fit iterations; F1-09 ✅ usage counter                                  |
| 5:30–5:55 | 25 min        | Orientation/quality picker; usage limit enforcement (F1-11) — **still failing at session end**; unlimited QA seed account added |


### Results summary


| Status   | Items                                                                                                                                            |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| ✅ Pass   | F1-01, F1-02, F1-03, F1-04, F1-05, F1-06, F1-07, F1-09                                                                                           |
| ☐ Open   | F1-08 (canvas fit — intermittent), F1-10 (console 404 — fix applied, not re-verified), **F1-11 (usage limit — fix v2 applied, not re-verified)** |
| Deferred | GAP-01 (variation lightbox), GAP-02 (editable canvas layers)                                                                                     |


### Bugs fixed this session


| Area                | File(s)                                                                        | Fix                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| Registration org    | `auth.service.ts`                                                              | Always create org on register                                                                               |
| Paste in AI chat    | `EditorLayout.tsx`                                                             | Ctrl+V guard skips TEXTAREA/INPUT                                                                           |
| Progress bar        | `generation-progress.gateway.ts`, `AIChatBox.tsx`, `GenerationProgressBar.tsx` | Step → % mapping; bar above input                                                                           |
| Canvas fit          | `canvasState.ts`, `ImageElement.tsx`, `CenterCanvas.tsx`                       | Orientation artboards; `contain` fit; decode before load                                                    |
| Orientation/quality | `GenerationSettingsBar.tsx`, `ideogram.service.ts`                             | Landscape/Portrait/Square + Standard/Premium                                                                |
| Console 404         | `CenterCanvas.tsx`                                                             | Skip `loadTemplateById` when `previewImage` present                                                         |
| Usage limit v1      | `usage-limit.service.ts`, `generations.service.ts`, `AIChatBox.tsx`            | `assertCanGenerate` on AI Chat path; quota API; frontend pre-check                                          |
| Usage limit v2      | `usage-limit.service.ts` (same session, end)                                   | Org resolution from DB/history; no permissive `0/3` fallback; check before extraction; fail-closed frontend |


### QA test accounts (`npm run db:seed`)

Password for all: `Test@123!`


| Email                             | Plan           | Monthly limit    |
| --------------------------------- | -------------- | ---------------- |
| `free@test.infographai.com`       | free           | 3                |
| `solo@test.infographai.com`       | solo           | 50               |
| `team-owner@test.infographai.com` | team           | 200              |
| `unlimited@test.infographai.com`  | api_enterprise | unlimited (`-1`) |


Manual upgrade (Prisma Studio): set org `planTier=api_enterprise`, `monthlyLimit=-1`.

### Re-test checklist (next session)

1. **Restart** `npm run dev` (backend changes require full restart)
2. Hard refresh browser (`Ctrl+Shift+R`)
3. ~~**F1-11:** Log in as account showing `≥3/3` → expect "Monthly limit reached" toast~~ ✅ Code-verified 2026-06-17 — needs final browser confirmation only
4. ~~**F1-08:** Test Landscape + Portrait on canvas fit~~ ✅ Code-verified 2026-06-17
5. ~~**F1-10:** DevTools console — no red 404s on "Use This Design"~~ ✅ Code-verified 2026-06-17
6. **PT-07:** Log in as User 1 → generate → "Use This Design" → log out → log in as User 2 → confirm canvas is blank
7. Continue to Flow 2 (§1C)

### Known root cause — F1-11 (documented for next fix if v2 still fails)

1. Org-healing created **new empty orgs** per request when JWT `organizationId` was stale → limit counted 0 on new org while Billing counted 11 on original org
2. Quota API returned fake `{ current: 0, limit: 3 }` when `organizationId` was null on request
3. Frontend `catch { return true }` silently allowed generation when quota API failed
4. Limit check ran **after** OpenAI extraction (expensive, appeared to "work" briefly)

*Session log added: 2026-06-15*

---

## QA Session Log — 2026-06-17 (F1 Code Verification + PT-07 Bug)

> **Duration:** ~2 hrs  
> **Mode:** Code-level verification (no browser) + manual bug discovery  
> **Scope:** F1-08 / F1-10 / F1-11 re-verification; PT-07 found and fixed during manual testing

### Results summary


| Status                                                  | Items                                                                                       |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| ✅ Code-verified (pass in code, browser confirm pending) | F1-08, F1-10, F1-11                                                                         |
| ✅ Found + Fixed                                         | PT-07 — canvas session leak between users                                                   |
| ✅ Done                                                  | `VITE_STORAGE_PREFIX` env var — localStorage keys now configurable (set to `infographicai`) |
| ☐ Still pending (browser)                               | F4-07 (PT-07 manual confirm), Flow 6                                                        |


### Bugs fixed this session


| ID    | Area              | File(s)                  | Fix                                                                                                                                                                                                                       |
| ----- | ----------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PT-07 | Session isolation | `auth.tsx`, `storage.ts` | `logout()` now calls `clearUserStorage()` (removes `${STORAGE_PREFIX}_designs` + `${STORAGE_PREFIX}_autosave`) and `useCanvasStore.getState().clearCanvas()` — prevents User 1's canvas leaking to User 2 on same browser |


### Improvements this session


| Area                | File(s)                        | Change                                                                                                                                                |
| ------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| localStorage prefix | `storage.ts`, `.env.*.example` | Prefix driven by `VITE_STORAGE_PREFIX` env var (default `infographicai`); was hardcoded `brainwave_*` — legacy from original product name "Brainwave" |
| Prompt quality      | `openai.service.ts`            | `generateImagePrompt()` rewritten: `$500K` format, `4 BED                                                                                             |


### Verification details — F1-08 / F1-10 / F1-11


| Check                | How verified                                                                                                               | File + line                                                    |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| F1-08 artboard fit   | `AI_ARTBOARDS` has correct Ideogram ratios; `objectFit: contain`; image fully decoded before dimensions read               | `canvasState.ts` — `AI_ARTBOARDS`, `loadAiVariationToCanvas()` |
| F1-10 no 404         | AI variation guard: early-return before `loadTemplateById()` is ever called                                                | `CenterCanvas.tsx:84–87`                                       |
| F1-11 quota enforced | `assertCanGenerateForUser()` called at line 47, before OpenAI extraction; org healed from DB history; frontend fail-closed | `generations.service.ts:47`, `AIChatBox.tsx` `checkQuota()`    |


*Session log added: 2026-06-17*

---

## QA Session Log — 2026-06-18 (Flow 2 close-out + Webhook fix)

> **Duration:** ~1 hr  
> **Mode:** Manual browser test + code investigation  
> **Scope:** F2 Flow close-out; webhook URL root cause; SubscriptionCard UX fix

### Results summary


| Status     | Items                                                                                                    |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| ✅ Verified | F2-03, F2-04, F2-05                                                                                      |
| ✅ Fixed    | F2-02 — Razorpay webhook URL was wrong (`/api/v1/webhooks/razorpay` → correct: `/api/webhooks/razorpay`) |
| ✅ Improved | "Refresh to check status" button now uses `refetch()` + toast instead of `window.location.reload()`      |


### Root cause — F2-04 (webhook not firing)


| Layer              | Issue                                                                                                                 |
| ------------------ | --------------------------------------------------------------------------------------------------------------------- |
| Razorpay Dashboard | Webhook URL set to `https://<ngrok>/api/v1/webhooks/razorpay` (incorrect)                                             |
| Express routing    | `/api/v1/`* proxies to NestJS; NestJS has no `/api/v1/webhooks/razorpay` route → 404                                  |
| Correct path       | `/api/webhooks/razorpay` → handled by `server/routes.ts:28` → forwards to NestJS internal endpoint                    |
| Fix                | Updated webhook URL in Razorpay Test Dashboard; subscription manually activated via Prisma for this local dev session |


### Note: Production behavior

In staging/production, Razorpay can reach the public URL directly → `subscription.charged` webhook fires automatically → `handleSubscriptionCharged()` sets status=ACTIVE + upgrades org planTier. No manual activation needed. The `resolveEffectiveTier()` PENDING-grant (added 2026-06-17) remains as a safety net for the brief webhook-delay window.

### Bugs fixed this session


| Area                      | File(s)                                                   | Fix                                                                                       |
| ------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Webhook URL clarification | `server/routes.ts` (no code change — routing was correct) | Documented correct path: `/api/webhooks/razorpay` (not `/api/v1/...`)                     |
| Refresh button UX         | `SubscriptionCard.tsx`                                    | Replaced `window.location.reload()` with `refetch()` + loading state + success/info toast |


*Session log added: 2026-06-18*

---

## QA Session Log — 2026-06-19 (Flow 5 prep + Subscription self-healing)

> **Duration:** ~3 hrs
> **Mode:** Manual browser test + code fixes
> **Scope:** Organization tab bug (Team plan); Subscription PENDING state; pricing page blocked; SubscriptionEvent logging

### Results summary


| Status     | Items                                                                                  |
| ---------- | -------------------------------------------------------------------------------------- |
| ✅ Fixed    | Organization tab showing "View Plans" for Team Plan user                               |
| ✅ Fixed    | Subscription stuck PENDING — "Refresh" button now syncs directly from Razorpay         |
| ✅ Fixed    | Pricing page greyed-out plans caused by stale `created` Razorpay subscription          |
| ✅ Added    | `SubscriptionEvent` DB table — all sync attempts logged with provider status + outcome |
| ✅ Improved | Razorpay raw status never shown to user — mapped to plain English messages             |
| ✅ Improved | "Not seeing your plan? Refresh status" link on pricing page unblocks stale PENDING     |
| ✅ Done     | Flow 5 (Team Plan) — F5-01 / F5-02 / F5-03 all verified 2026-06-19                     |


### Bugs fixed this session


| Area                                 | File(s)                                                  | Fix                                                                                                                                       |
| ------------------------------------ | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Org tab null for Team user           | `users.service.ts` — `getUserOrganizationInfo()`         | Auto-provisions org when `user.organizationId=null` but active TEAM+ subscription exists; secondary heal upgrades org `planTier` if stale |
| PENDING subscription blocked pricing | `payments.service.ts` — `getCurrentSubscription()`       | Polls Razorpay on every GET for PENDING subs; promotes to ACTIVE if Razorpay says `active`                                                |
| "Refresh status" did nothing         | `payments.service.ts` — `syncSubscriptionFromProvider()` | New force-sync method: promotes `active`/`authenticated`, auto-cancels stale `created` subs, logs to `SubscriptionEvent` table            |
| Pricing page greyed out (2 plans)    | `PricingPage.tsx`                                        | Added "Not seeing your plan? Refresh status" link under "Activating…" button; calls sync endpoint + invalidates subscription query        |
| Raw Razorpay status exposed          | `payments.service.ts`, `SubscriptionCard.tsx`, `api.ts`  | Razorpay status mapped to user-friendly messages; removed from API response and frontend toast                                            |


### New infrastructure added


| Item                               | Detail                                                                                                                                                         |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SubscriptionEvent` model          | New Prisma table: `userId`, `subscriptionId`, `eventType`, `providerStatus`, `localStatus`, `promoted`, `message`, `metadata`, `createdAt`. Pushed to Neon DB. |
| `POST /payments/subscription/sync` | New NestJS endpoint — force-syncs with Razorpay, heals PENDING, logs outcome                                                                                   |
| `paymentsApi.syncSubscription()`   | Frontend API client method wired to "Refresh status" button                                                                                                    |


### Root causes found this session


| Issue                      | Root cause                                                                                                                                              |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Org tab null               | `user.organizationId=null` in DB — user created before org-on-register was enforced, or org deleted. Subscription existed but org backlink was missing. |
| Pricing page blocked       | Razorpay subscription status was `created` (checkout opened, never completed) → stale PENDING row in our DB blocked both plan cards                     |
| Refresh button ineffective | Old implementation only `refetch()`-ed our own DB — which was stuck PENDING and couldn't self-update without a webhook                                  |


### Note: Team Plan Flow 5 setup (no subscription required)

F5 checks (add/remove team members) can be verified without a real Razorpay subscription:

1. Open Prisma Studio → set org `planTier='TEAM'`, `monthlyLimit=200`
2. Register a second test account at `/auth`
3. In Account → Organization → "Add member by email" → second account email
4. Verify 5-seat cap and remove flow

*Session log added: 2026-06-19*

---

## QA Session Log — 2026-06-19 (Flow 5 close-out)

> **Duration:** ~2 hrs
> **Mode:** Manual browser test + bug fixes
> **Scope:** Flow 5 (Team Plan user limits); two bugs found and fixed during testing

### Results summary


| Status  | Items                                                                                                                                                         |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ✅ Done  | Flow 5 — F5-01 / F5-02 / F5-03 all verified                                                                                                                   |
| ✅ Fixed | Organization tab always returned null (`data: null`) due to missing `@Inject(UsersService)` on controller                                                     |
| ✅ Fixed | Invite by email blocked with "already belongs to another organization" for any user who had registered (every registrant gets a personal solo org at sign-up) |


### Bugs fixed this session


| Area                               | File(s)                                        | Fix                                                                                                                                                                                                                                                                                                                        |
| ---------------------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Org tab always null                | `users.controller.ts`                          | `UsersController` was the only controller missing explicit `@Inject(UsersService)`. With `tsx`/esbuild `emitDecoratorMetadata` is unreliable; implicit type-based DI silently failed — `this.usersService` was `undefined` at runtime. Added `@Inject(UsersService)` to match all other controllers.                       |
| Invite blocked for all registrants | `users.service.ts` — `addUserToOrganization()` | Old check blocked any user already having a different `organizationId`. Every registered user has their own personal solo org, so this blocked 100% of invites. Fix: count members in current org — if they're the only member (personal org), allow the move; only block if they belong to a real shared org (count > 1). |


### Test data used


| Account                                                                           | Role                        | Org after flow                               |
| --------------------------------------------------------------------------------- | --------------------------- | -------------------------------------------- |
| [team-owner@test.infographai.com](mailto:team-owner@test.infographai.com)         | Team owner                  | cmq7xjdxq0002gpektndx4ob3 (Team Tier Org QA) |
| [team-member@test.infographai.com](mailto:team-member@test.infographai.com)       | Member                      | cmq7xjdxq0002gpektndx4ob3                    |
| [team-member.01@test.infographai.com](mailto:team-member.01@test.infographai.com) | Member (added this session) | cmq7xjdxq0002gpektndx4ob3                    |
| [team-member.02@test.infographai.com](mailto:team-member.02@test.infographai.com) | Member (added this session) | cmq7xjdxq0002gpektndx4ob3                    |
| [team-member.03@test.infographai.com](mailto:team-member.03@test.infographai.com) | Member (added this session) | cmq7xjdxq0002gpektndx4ob3                    |


*Session log added: 2026-06-19*

---

## QA Session Log — 2026-06-19 (Flow 6 close-out)

> **Duration:** ~30 min
> **Mode:** Playwright automation (headless + headed)
> **Scope:** Flow 6 — Cross-Browser Smoke (F6-01 through F6-04)

### Results summary


| Project                   | Tests                                  | Result          |
| ------------------------- | -------------------------------------- | --------------- |
| `chrome-headed` (F6-01)   | 4/4                                    | ✅ Pass          |
| `firefox-smoke` (F6-02)   | 4/4                                    | ✅ Pass          |
| `msedge-smoke` (F6-03)    | 4/4                                    | ✅ Pass          |
| `responsive-1280` (F6-04) | covered by F6-S4 across all 3 browsers | ✅ Pass          |
| **Total**                 | **12/12**                              | **✅ All green** |


### Bug found and fixed this session


| Area                                         | File                                                         | Fix                                                                                                                                                                                                                                                                                                                                                            |
| -------------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F6-S4 false failure (77px overflow on /auth) | `e2e/flow6-cross-browser-smoke.spec.ts` — `ensureLoggedIn()` | React's `useEffect` auth check redirects to `/auth` after the Playwright `load` event fires. `page.url()` check ran before the redirect, so `evaluate()` measured `/auth`'s 77px overflow instead of `/templates`. Fix: wait up to 5s for the gallery heading to render; if absent, fall back to login flow. Always block on gallery heading before returning. |


### Infrastructure created this session


| Item                                    | Detail                                                                                                    |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `e2e/flow6-cross-browser-smoke.spec.ts` | 4-test smoke suite — auth loads, templates loads, editor navigable, no horizontal overflow                |
| `playwright.config.ts` — 3 new projects | `firefox-smoke`, `msedge-smoke`, `responsive-1280` — scoped to flow6 spec only; existing suite unaffected |


*Session log added: 2026-06-19*

---

## QA Session Log — 2026-06-20 (Code Audit + Editor UX Fixes)

> **Duration:** ~3 hrs
> **Mode:** Code audit (no browser) + targeted code fixes
> **Scope:** RS-* bug verification; toolbar zoom fix; selection outline zoom fix; DimensionsDisplay dark mode; Flow 7 deferral decision

### Results summary


| Status                    | Items                                                                                                                                   |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| ✅ Verified as Implemented | RS-H03 (onClick wired), RS-P10 (usePropertyStore), RS-P11 (buildPropertyPrompt), RS-A07 (fields removed), RS-A08 (agent data in prompt) |
| ✅ Verified as Implemented | F4-06-UX1 ("← Edit Details" back button + "results ready" pill), GAP-01 (lightbox)                                                      |
| ✅ Fixed                   | F3-04-B1 — DimensionsDisplay dark mode contrast (`dark:bg-zinc-700/95` + `ring-1 ring-white/10`)                                        |
| ✅ Fixed                   | Toolbar zoom bug — ContextualToolbar lifted to viewport level; position computed mathematically                                         |
| ✅ Fixed                   | Selection outline zoom — `outline: ${2/zoom}px` in all 3 element types (Text, Shape, Image)                                             |
| ⏸ Deferred                | Flow 7 full 44-point checklist + `e2e/right-sidebar.spec.ts` — Phase 1 priority to be set after staging deploy                          |


### Bugs fixed this session


| Area                                  | File(s)                                                              | Fix                                                                                                                                                       |
| ------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DimensionsDisplay dark mode           | `client/src/components/editor/DimensionsDisplay.tsx`                 | `dark:bg-zinc-700/95` + `ring-1 ring-white/10` — was invisible as `dark:bg-black/80` on dark artboard                                                     |
| Toolbar scales with canvas zoom       | `CenterCanvas.tsx`, `ContextualToolbar.tsx`, `TransparencyPanel.tsx` | Lifted ContextualToolbar to viewport level; coords computed via `canvasLeft = vpW/2 - canvasWidth*zoom/2 + panX` — toolbar always renders at screen scale |
| Selection outline shrinks at low zoom | `TextElement.tsx`, `ShapeElement.tsx`, `ImageElement.tsx`            | `outline: ${2/zoom}px solid #3b82f6` in canvas coords × zoom = always 2px on screen                                                                       |


### Stale QA findings corrected

All 5 RS-* bug entries (RS-H03, RS-P10, RS-P11, RS-A07, RS-A08) and 4 §7G findings were stale — confirmed implemented. Checklist updated to reflect reality.

### Decision: Flow 7 deferred

Flow 7 (44 checklist items, 29 automatable) backlogged to Phase 1. All previously-reported bugs were implemented; `e2e/right-sidebar.spec.ts` spec not yet written. Does not block Phase 0 gate or staging.

*Session log added: 2026-06-20*