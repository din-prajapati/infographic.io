# US-QA-001 — Phase 0 QA Hardening: Subscription Sync, Session Isolation, Org Invite Fixes + Cross-Browser Smoke

> **Epic:** [EPIC-AI-00](../../EPIC.md)
> **Milestone:** M-AI-01-critical-fixes
> **Status:** ✅ Done
> **Priority:** P0
> **Persona:** Dinesh (QA + sole developer)
> **Branch:** `feat/epic-design-02-ui-redesign`
> **Closed:** 2026-06-19

---

## User Story

*As a* developer running Phase 0 QA,
*I want* subscription state, session isolation, org invite, and cross-browser rendering to all work correctly,
*So that* the product is stable and ready for staging deploy with no known P0 bugs.

---

## Context

This story captures all bug fixes and test automation produced across three QA sessions (2026-06-17 → 2026-06-19) on the `feat/epic-design-02-ui-redesign` branch. All acceptance criteria were verified during live testing before this story was closed.

---

## Acceptance Criteria

### Group A — Subscription Sync (Flow 2, verified 2026-06-18)

- [x] **AC-A1:** `GET /payments/subscription` automatically polls Razorpay for any `PENDING` subscription and promotes it to `ACTIVE` if the provider says `active` or `authenticated` — no manual intervention needed after checkout.

- [x] **AC-A2:** `POST /payments/subscription/sync` force-syncs with Razorpay: promotes `active`/`authenticated` → `ACTIVE`, auto-cancels `created` (stale checkout-abandoned subs), and records every outcome to a new `SubscriptionEvent` audit table.

- [x] **AC-A3:** The `SubscriptionEvent` table logs `userId`, `subscriptionId`, `eventType`, `providerStatus`, `localStatus`, `promoted`, `message`, and `createdAt` for every sync attempt.

- [x] **AC-A4:** The Pricing page shows a "Not seeing your plan? Refresh status" inline link under an `Activating…` plan button. Clicking it calls the sync endpoint and re-fetches subscription state — unblocking users stuck in PENDING without requiring a page reload.

- [x] **AC-A5:** No raw Razorpay status strings (`created`, `authenticated`, `halted`) are ever shown to the user. All states are mapped to human-readable messages before reaching the frontend.

- [x] **AC-A6:** `resolveEffectiveTier()` in `usage-limit.service.ts` optimistically grants a PENDING subscription's tier limits — covers the webhook-delivery latency window so users are not blocked immediately after checkout.

---

### Group B — Session Isolation (PT-07, verified 2026-06-17)

- [x] **AC-B1:** `logout()` in `auth.tsx` calls `clearUserStorage()` which removes `${STORAGE_PREFIX}_designs` and `${STORAGE_PREFIX}_autosave` from localStorage, preventing User 1's canvas from persisting to User 2 on the same browser.

- [x] **AC-B2:** `logout()` also calls `useCanvasStore.getState().clearCanvas()` to reset in-memory Zustand state — covers the same-session case where a page reload does not occur.

- [x] **AC-B3:** The `VITE_STORAGE_PREFIX` environment variable controls the localStorage key prefix (default `infographicai`). The legacy hardcoded `brainwave_*` prefix is replaced.

---

### Group C — Users Module: Org Tab + Invite (Flow 5, verified 2026-06-19)

- [x] **AC-C1:** `GET /users/organization` returns full organization + slot data for a TEAM plan user. Previously returned `{ data: null }` due to missing `@Inject(UsersService)` on `UsersController` — esbuild's `emitDecoratorMetadata` silently left `this.usersService` as `undefined`.

- [x] **AC-C2:** Inviting a user by email succeeds when the invitee's only existing org is their personal solo org (1 member). Previously blocked with "already belongs to another organization" because every registered user auto-receives a personal org at signup.

- [x] **AC-C3:** Inviting a user is correctly blocked with "already belongs to another organization" when the invitee is a member of a shared org with 2+ members.

- [x] **AC-C4:** `getUserOrganizationInfo()` auto-provisions an org and links it to the user if `user.organizationId` is null but an active TEAM+ subscription exists (healing path for edge-case registrations).

- [x] **AC-C5:** `getUserOrganizationInfo()` heals a stale org `planTier` (e.g. org still on `FREE` after webhook upgraded the subscription to `TEAM`) by reading the active subscription and updating the org.

- [x] **AC-C6:** TEAM plan (5-seat limit) correctly counts seats, shows 3/5 → 4/5 → 5/5 as members are added, and blocks a 6th invite with a clear seat-limit message.

- [x] **AC-C7:** The Account → Organization UI disables the "Add" button and email input when the seat limit is reached ("Seat limit reached" banner is shown).

- [x] **AC-C8:** Removing a member decrements the seat count and allows a new invite to succeed.

---

### Group D — Cross-Browser Smoke (Flow 6, verified 2026-06-19)

- [x] **AC-D1:** `/auth` page loads in Chrome, Firefox, and Edge — email input, password input, and Google button are all visible.

- [x] **AC-D2:** `/templates` page loads in Chrome, Firefox, and Edge after login — "Template Gallery" heading and at least one "Use Template" button are visible.

- [x] **AC-D3:** `/editor` page is navigable in Chrome, Firefox, and Edge — opening a template navigates to `/editor?templateId=…` and the design canvas renders.

- [x] **AC-D4:** No horizontal overflow (`scrollWidth − clientWidth ≤ 5px`) on `/templates` in any tested browser or viewport.

- [x] **AC-D5:** Playwright `ensureLoggedIn()` helper correctly waits for React's async auth check to complete before asserting page state — fixes false failures caused by React's `useEffect` redirecting to `/auth` after the `load` event.

---

## Test Results

| Flow | Tests | Result | Date |
|------|-------|--------|------|
| Flow 2 — Subscription sync | Manual (F2-01 through F2-05) | ✅ All pass | 2026-06-18 |
| PT-07 — Session isolation | Manual (F4-07) | ✅ Pass | 2026-06-17 |
| Flow 5 — Team user limits | Manual (F5-01 through F5-03) | ✅ All pass | 2026-06-19 |
| Flow 6 — Chrome smoke | Playwright `chrome-headed` 4/4 | ✅ Pass | 2026-06-19 |
| Flow 6 — Firefox smoke | Playwright `firefox-smoke` 4/4 | ✅ Pass | 2026-06-19 |
| Flow 6 — Edge smoke | Playwright `msedge-smoke` 4/4 | ✅ Pass | 2026-06-19 |

---

## Files Changed

### Backend (NestJS)

| File | Change |
|------|--------|
| `api/prisma/schema.prisma` | Added `SubscriptionEvent` model; added `PENDING` to `SubscriptionStatus` enum; added `billingPeriod` to `Subscription` |
| `api/prisma/seed.ts` | Added QA test accounts (team-owner, team-member variants) |
| `api/src/modules/payments/services/payments.service.ts` | `syncSubscriptionFromProvider()` — force-sync with Razorpay + `SubscriptionEvent` logging; `getCurrentSubscription()` auto-polls Razorpay for PENDING subs |
| `api/src/modules/payments/controllers/payments.controller.ts` | `POST /payments/subscription/sync` endpoint wired to `syncSubscriptionFromProvider()` |
| `api/src/modules/payments/services/subscription-storage.service.ts` | Subscription storage helper updates |
| `api/src/modules/users/users.controller.ts` | Added `@Inject(UsersService)` to constructor — fixes silent DI failure under esbuild/tsx |
| `api/src/modules/users/users.service.ts` | `addUserToOrganization()`: allow move from personal solo org (1-member); block only on shared org. `getUserOrganizationInfo()`: org auto-provision + planTier healing |
| `api/src/modules/infographics/services/usage-limit.service.ts` | `resolveEffectiveTier()` grants PENDING subscription limits optimistically |
| `api/src/config/ai-models.config.ts` | AI model config updates (model-transparent naming) |
| `api/src/config/image-generation.config.ts` | Image generation config (orientation/quality mappings) |
| `api/src/modules/ai-generation/services/ai-orchestrator.service.ts` | Orchestrator updates for structured generation flow |
| `api/src/modules/ai-generation/services/ideogram.service.ts` | Ideogram service updates (orientation params) |
| `api/src/modules/ai-generation/services/openai.service.ts` | `generateImagePrompt()`: hex → descriptive color names; prompt structure improvements |

### Frontend (React)

| File | Change |
|------|--------|
| `client/src/lib/auth.tsx` | `logout()` now calls `clearUserStorage()` + `useCanvasStore.getState().clearCanvas()` — PT-07 session isolation fix |
| `client/src/lib/storage.ts` | `VITE_STORAGE_PREFIX` env var replaces hardcoded `brainwave_*` key prefix |
| `client/src/lib/api.ts` | Added `paymentsApi.syncSubscription()` method |
| `client/src/components/payment/SubscriptionCard.tsx` | "Refresh to check status" uses `refetch()` + toast; loading state added |
| `client/src/pages/PricingPage.tsx` | "Not seeing your plan? Refresh status" inline link for PENDING state |

### Environment / Config

| File | Change |
|------|--------|
| `.env.development.example` | Added `VITE_STORAGE_PREFIX`, `SubscriptionEvent`-related vars |
| `.env.production.example` | Same additions for production template |

### Testing

| File | Change |
|------|--------|
| `playwright.config.ts` | Added `firefox-smoke`, `msedge-smoke`, `responsive-1280` projects scoped to `flow6-cross-browser-smoke.spec.ts` |
| `e2e/flow6-cross-browser-smoke.spec.ts` | New: 4-test cross-browser smoke suite (F6-S1 through F6-S4) with robust `ensureLoggedIn()` that handles React SPA async auth redirect |

### Documentation

| File | Change |
|------|--------|
| `docs/testing/PHASE_0_HUMAN_QA_CHECKLIST.md` | Flow 2, Flow 5, Flow 6 all closed ✅; three QA session logs added (2026-06-17, 2026-06-18, 2026-06-19) |
| `docs/agile/epics/phase-0.5-foundation/EPIC-AI-00/milestones/M-AI-01-critical-fixes.md` | Milestone updated |
| `docs/agile/epics/phase-0.5-foundation/EPIC-AI-00/stories/US-AI-001/STORY.md` | Story status updated |
| `docs/business/COMPREHENSIVE_PRICING_ANALYSIS.md` | Pricing analysis updated |

---

## Known Bugs (Carry-Forward to Phase 1)

| ID | Description | Story | Status |
|----|-------------|-------|--------|
| F3-04-B1 | Dimensions badge overlaps selected canvas element | Needs `US-EDITOR-01` | Open |
| F4-06-UX1 | No "back to results" after "Use This Design" | Needs `US-UX-01` | Open |

> **Note (verified 2026-06-20):** RS-H03, RS-P10, RS-A07, RS-A08, RS-P11 were listed as bugs but are **already implemented**:
> - `RightSidebar.tsx:631` — sticky "Generate" button has `onClick={handleGenerate}`
> - `handleGenerate()` reads `usePropertyStore.getState().property` + `useAgentStore.getState().agent` and passes all fields to the AI API
> - `PropertyDetailsForm.tsx` uses `usePropertyStore` Zustand store — state persists on tab switch
> - `AgentInfoForm.tsx` — social media fields were removed; remaining fields all have `value`/`onChange` bindings via `useAgentStore`
>
> US-SIDEBAR-01 and US-SIDEBAR-02 should **not** be created — their scope is already covered.

---

## Definition of Done

- [x] All ACs verified during live QA sessions (see Test Results above)
- [x] All Playwright Flow 6 tests green: 12/12 (Chrome · Firefox · Edge)
- [x] `docs/testing/PHASE_0_HUMAN_QA_CHECKLIST.md` updated — Flows 2, 5, 6 marked ✅
- [x] No new regressions introduced in existing Playwright suite
- [x] Branch ready to merge to `main`

---

*Story created: 2026-06-19 | Author: Dinesh*
