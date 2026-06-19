# Tasks — US-QA-001

## Three Pillars Pre-flight
- [x] STORY.md has ACs written
- [x] Test cases identified and run
- [x] Branch: `feat/epic-design-02-ui-redesign`

---

## Group A — Subscription Sync

- [x] A1: Add `syncSubscriptionFromProvider()` to `payments.service.ts` — polls Razorpay, promotes PENDING → ACTIVE, logs to `SubscriptionEvent`
- [x] A2: Add `SubscriptionEvent` model to `api/prisma/schema.prisma` and push to Neon
- [x] A3: Wire `POST /payments/subscription/sync` endpoint in `payments.controller.ts`
- [x] A4: Add `paymentsApi.syncSubscription()` to `client/src/lib/api.ts`
- [x] A5: Add "Refresh status" inline link to `PricingPage.tsx` for PENDING state
- [x] A6: Update `SubscriptionCard.tsx` — use `refetch()` + toast instead of `window.location.reload()`
- [x] A7: `resolveEffectiveTier()` in `usage-limit.service.ts` grants PENDING subscription limits optimistically
- [x] A8: Verify Flow 2 (F2-01 through F2-05) ✅

## Group B — Session Isolation (PT-07)

- [x] B1: `logout()` in `auth.tsx` calls `clearUserStorage()` — clears localStorage canvas/designs
- [x] B2: `logout()` calls `useCanvasStore.getState().clearCanvas()` — resets Zustand in-memory state
- [x] B3: `VITE_STORAGE_PREFIX` env var in `storage.ts` replaces hardcoded `brainwave_*` prefix
- [x] B4: Verify F4-07 (session isolation) ✅

## Group C — Users Module: Org Tab + Invite

- [x] C1: Add `@Inject(UsersService)` to `UsersController` constructor — fixes DI under esbuild/tsx
- [x] C2: Fix `addUserToOrganization()` in `users.service.ts` — count current org members; only block if > 1
- [x] C3: Add org auto-provision healing to `getUserOrganizationInfo()` — creates org when null + active TEAM+ sub exists
- [x] C4: Add org `planTier` healing to `getUserOrganizationInfo()` — upgrades stale org planTier from active subscription
- [x] C5: Verify Flow 5 (F5-01 through F5-03) ✅

## Group D — Cross-Browser Smoke (Flow 6)

- [x] D1: Add `firefox-smoke`, `msedge-smoke`, `responsive-1280` projects to `playwright.config.ts`
- [x] D2: Create `e2e/flow6-cross-browser-smoke.spec.ts` — F6-S1 through F6-S4 smoke tests
- [x] D3: Fix `ensureLoggedIn()` — wait for gallery heading instead of URL check (React SPA timing fix)
- [x] D4: Run `--project=chrome-headed` → 4/4 ✅
- [x] D5: Run `--project=firefox-smoke` → 4/4 ✅
- [x] D6: Run `--project=msedge-smoke` → 4/4 ✅
- [x] D7: Update `PHASE_0_HUMAN_QA_CHECKLIST.md` — mark F6-01 through F6-04 ✅

## Documentation

- [x] E1: Add QA session log 2026-06-17 (PT-07) to checklist
- [x] E2: Add QA session log 2026-06-18 (Flow 2) to checklist
- [x] E3: Add QA session log 2026-06-19 Flow 5 close-out to checklist
- [x] E4: Add QA session log 2026-06-19 Flow 6 close-out to checklist
- [x] E5: Write STORY.md for US-QA-001 with all ACs

## Commit

- [x] Stage all 25 modified files + `e2e/flow6-cross-browser-smoke.spec.ts` + story files
- [x] Commit with message referencing US-QA-001
