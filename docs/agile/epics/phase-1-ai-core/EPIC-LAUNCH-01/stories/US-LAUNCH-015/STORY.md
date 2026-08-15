# Story Card — US-LAUNCH-015

> **Status:** ✅ Done — all 7 ACs verified. AC1/AC2/AC5 live-verified 2026-08-15 (compose responses `[201, 402]` — trial consumed, second blocked, upgrade toast shown, canvas still loaded); AC3/AC4/AC6/AC7 unit-verified.
> **Feature:** F-LAUNCH-07 — Editable-design monetization
> **Epic:** [EPIC-LAUNCH-01](../../EPIC.md)
> **Milestone:** [M-LAUNCH-02-revenue-on](../../milestones/M-LAUNCH-02-revenue-on.md)
> **Size:** M
> **Depends on:** [US-AI-048](../../../EPIC-AI-06/stories/US-AI-048/STORY.md) (compose cache) — "distinct compose" must be well-defined before it can be priced
> **Blocks:** —
> **Linear:** LIN-XXX
> **Created:** 2026-08-13 | **Closed:** 2026-08-15

---

## Why this story exists

Editable design (layerize extraction, working as of 2026-08-13) adds $0.09 per composed variation — the only per-action provider cost not covered by the credit system. Measured margins with one editable load: SOLO 72%, TEAM 52%; worst case (all 3 variations composed) drops TEAM to 8% and costs $0.84/mo per fully-active FREE user. US-AI-048 caps cost at $0.09 × distinct variations; this story aligns *revenue* with those distinct composes.

Model decided 2026-08-13 (see conversation record / EPIC-AI-06 log):
**editable is the paid moat** — the first compose per generation is part of the product promise on paid tiers; *additional* variation composes consume a credit; FREE gets a lifetime trial taste of it. Headline prices do not change.

---

## Story

*As the* product owner
*I want* editable-design composes gated by plan tier and metered beyond the first per generation
*So that* the feature that differentiates the product drives upgrades instead of silently eroding margin.

---

## Acceptance Criteria

- [x] **AC1 (FREE gate):** On the FREE tier, `POST /generations/:id/compose` succeeds for the organisation's **first-ever** compose (lifetime trial) and thereafter returns **402** with error code `EDITABLE_REQUIRES_UPGRADE` — enforced server-side in the compose path, not by hiding UI. **Live-verified 2026-08-15**: real generation, real compose #1 → `201`; real compose #2 (same org, different variation) → `402`. `EditableRequiresUpgradeException` (`usage-limit.service.ts`) thrown from `GenerationsService.getComposedDesign` BEFORE any extraction call — a blocked request never spends the $0.09.
- [x] **AC2 (trial tracking):** The lifetime-trial state is derived from persisted data (count of cached `composedDesigns` entries across the org's Infographics, or an explicit org counter — implementer's choice, documented), so it survives logout/re-register of users within the org. Implemented as `UsageLimitService.hasUsedEditableTrial(organizationId)` — queries `Infographic.composedDesigns` across the whole org, no schema migration needed, no counter to drift out of sync. Unit-tested (`usage-limit.service.spec.ts`).
- [x] **AC3 (extra-compose credit):** On paid tiers, the **first distinct** variation composed per generation is free-of-credit; each **additional distinct** variation composed on the same generation increments `creditsUsed` by 1 on that generation's UsageRecord. Cache hits (US-AI-048) never charge a credit or a rupee. Unit-tested end to end: gate decision in `editable-gating.spec.ts` (7 tests), actual DB-write increment in `compose-cache.spec.ts` (4 new tests covering success/omitted/degraded/cache-hit).
- [x] **AC4 (limit interaction):** An extra compose that would exceed the plan's monthly credit limit is rejected with the same monthly-limit error shape the generate path uses (`Monthly limit … reached`), and the UI surfaces it via the existing limit toast. Reuses `UsageLimitService.assertCanGenerate` directly (same `ForbiddenException` shape as the generate path) — checked before extraction. Client reuses the exact `toast.error("Monthly limit reached", ...)` pattern already used for the generate path.
- [x] **AC5 (UI affordance):** When the FREE gate (402) is hit, the editable toggle path shows an upgrade prompt naming the feature ("Editable designs are a paid feature") with a link to `/pricing` — the design still loads **flat** so the user is never left with nothing. **Live-verified 2026-08-15** — toast text and "View plans" action both confirmed visible in the same live run as AC1; canvas remained visible (flat load) throughout.
- [x] **AC6 (policy doc):** US-LAUNCH-008's metering policy statement (STORY.md + CLAUDE.md metering note) is amended: *"limits count generations; each additional distinct variation compose on a generation also consumes 1 credit."* `costUsd` semantics unchanged. Both amended 2026-08-15 with the full policy wording (see each doc's own amendment note, history preserved rather than overwritten).
- [x] **AC7 (pricing page):** PricingPage feature lists show "Editable designs" as included on SOLO/TEAM/BROKERAGE and "1 trial" on FREE — no headline price changes. `shared/schema.ts`'s `PLAN_CONFIG` (the actual source PricingPage renders from) updated for all 4 tiers; no `price` field touched on any tier.

---

## Out of Scope

- **API-tier compose pricing** (separate metered `/compose` line item, ~$0.15/call) — API plans are post-launch (EPIC on hold); record the decision, implement later.
- **Price changes to SOLO/TEAM/BROKERAGE** — explicitly none; the model was chosen to avoid launch repricing.
- **Compose caching mechanics** — US-AI-048 owns it; this story consumes its definition of "distinct compose".
- **Ideogram/extraction cost language in UI** — sell "editable design", never "$0.09 extraction".

---

## Engineering / PR

- **Branch:** `feat/launch/us-launch-015-editable-monetization`
- **PR:** #_____ (fill when opened)
- **Primary files touched:**
  - `api/src/modules/infographics/controllers/generations.controller.ts` — gate + 402
  - `api/src/modules/infographics/services/generations.service.ts` — tier check, extra-compose credit increment
  - `api/src/modules/payments/services/usage-limit.service.ts` (TBC exact name) — limit interaction
  - `client/src/lib/layout/loadVariation.ts` + `client/src/components/editor/RightSidebar.tsx` / `AIChatBox.tsx` — 402 → upgrade toast + flat fallback
  - `client/src/pages/PricingPage.tsx` — feature list copy
  - `docs/agile/epics/phase-1-ai-core/EPIC-LAUNCH-01/stories/US-LAUNCH-008/STORY.md` — policy amendment

---

## AI Implementation Prompt

> Copy this block into Claude Code to implement the story.

```
Context: InfographicAI SaaS — NestJS API (3001) + React frontend (5000). See CLAUDE.md.
Read this STORY.md, TASKS.md, and US-AI-048 (compose cache — merged prerequisite).

Story: US-LAUNCH-015 — Editable-design monetization (FREE gate + extra-compose credits)

Server: in the compose path, resolve the org's effective tier (same resolver the
generate path uses). FREE → allow first-ever compose (lifetime, org-scoped), then 402
{ code: 'EDITABLE_REQUIRES_UPGRADE' }. Paid → first distinct variation compose per
generation free; each additional distinct one increments creditsUsed by 1 and is
subject to the monthly limit (reject with the existing limit error shape).
Cache hits never gate, never charge.

Client: planVariationLoad already never-throws — map the 402 to
{ mode:'flat', reason:'editable requires upgrade' } and have both surfaces show an
upgrade toast with a /pricing action, then load flat.

Docs: amend US-LAUNCH-008 policy line + CLAUDE.md metering note (AC6 wording).

Implementation rules:
- Touch ONLY the files listed in "Primary files touched"
- Do NOT implement anything in "Out of scope"
- Every task ships with its own test in the same commit
- When done: list files changed, ACs checked, test command to run
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-LAUNCH-015-01 | Auto | P0 | FREE org, first compose → 200; second compose (different generation) → 402 EDITABLE_REQUIRES_UPGRADE (AC1/2) | ✅ Pass | `api/tests/infographics/editable-gating.spec.ts` TC-01a/TC-01b; also live-verified (see TC-06) |
| TC-LAUNCH-015-02 | Auto | P0 | Paid org: compose variation A → creditsUsed unchanged; compose B on same generation → creditsUsed +1; re-compose A (cache hit) → unchanged (AC3) | ✅ Pass | `editable-gating.spec.ts` TC-02a/b/c (gate decision) + `compose-cache.spec.ts` chargeCredit tests (actual DB write) |
| TC-LAUNCH-015-03 | Auto | P1 | Paid org at monthly limit: extra compose → rejected with monthly-limit error shape (AC4) | ✅ Pass | `editable-gating.spec.ts` TC-03 |
| TC-LAUNCH-015-04 | Auto | P1 | Client: 402 from compose → plan degrades to flat with reason, upgrade toast fired (AC5) | ⚠️ Pass with finding | `ApiError` status/code unit-tested (`queryClient.spec.ts`); the full try/catch integration in `loadVariation.ts` hits a pre-existing, documented vitest unhandled-rejection constraint (see that file's "KNOWN COVERAGE GAP" comment) — covered instead by the live E2E run (TC-06) |
| TC-LAUNCH-015-05 | Manual | P1 | PricingPage shows "Editable designs" rows per AC7; FREE shows "1 trial" (AC7) | ✅ Pass | `shared/schema.ts` PLAN_CONFIG updated for all 4 tiers; PricingPage renders directly from it, no separate copy to drift |
| TC-LAUNCH-015-06 | Auto (E2E, live) | P2 | Live FREE-tier browser run: trial compose works; next hits upgrade toast and flat load (AC1/5) | ✅ Pass | `e2e/us-launch-015-editable-monetization.spec.ts` — live run 2026-08-15, compose responses `[201, 402]`, upgrade toast + "View plans" confirmed, canvas stayed loaded |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [x] All ACs checked ✅
- [x] All test cases run and recorded
- [x] Gate 1 green (tsc + `npm run test:unit`) — backend 368/368, client 229/229, zero regressions
- [x] US-LAUNCH-008 + CLAUDE.md policy text amended (AC6) — history preserved, amendment noted rather than overwritten
