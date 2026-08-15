# PR Task List — US-LAUNCH-015

> **Story:** [STORY.md](./STORY.md)
> **Branch:** `feat/launch/us-launch-015-editable-monetization`
> **PR:** #_____ (fill when opened)
> **Linear:** LIN-XXX
> **Type:** feat

---

## Four Pillars Pre-flight (check before starting AI session)

- [x] **Brain** — STORY.md filled; US-AI-048 merged (hard prerequisite) — ✅ Done, live-verified
- [x] **Muscle** — This TASKS.md has file list + ordered tasks + exact test commands
- [x] **Map** — [ARCHITECTURE.mmd](../../ARCHITECTURE.mmd) current (this story touches no rendering/composition mechanics, only gating around it)
- [x] **Env** — no new env vars needed; no ENV.yaml exists in this repo (checked — not applicable)

---

## PR Scope Summary

**One-liner:**
```
feat(launch): gate editable composes by tier and meter extras as credits — US-LAUNCH-015
```

---

## Task Breakdown

### T1 — Server: FREE-tier lifetime-trial gate (402 EDITABLE_REQUIRES_UPGRADE)
**Files:**
- `api/src/modules/infographics/services/generations.service.ts`
- `api/src/modules/infographics/controllers/generations.controller.ts`
- `api/tests/infographics/editable-gating.spec.ts` (new)

**AC(s) covered:** AC1, AC2

### T2 — Server: extra-compose credit increment + monthly-limit interaction
**Files:**
- `api/src/modules/infographics/services/generations.service.ts`
- `api/src/modules/payments/services/usage-limit.service.ts` (TBC)
- `api/tests/infographics/editable-gating.spec.ts`

**AC(s) covered:** AC3, AC4

### T3 — Client: 402 → flat fallback + upgrade toast on both surfaces
**Files:**
- `client/src/lib/layout/loadVariation.ts`
- `client/src/components/editor/RightSidebar.tsx`
- `client/src/components/ai-chat/AIChatBox.tsx`
- `client/src/lib/layout/__tests__/loadVariation.spec.ts`

**AC(s) covered:** AC5

### T4 — Pricing page copy + metering policy amendment
**Files:**
- `client/src/pages/PricingPage.tsx`
- `docs/.../US-LAUNCH-008/STORY.md` + `CLAUDE.md` metering note

**AC(s) covered:** AC6, AC7

---

## File-to-Task Mapping

| File | Task(s) |
|------|---------|
| `generations.service.ts` | T1, T2 |
| `generations.controller.ts` | T1 |
| `usage-limit.service.ts` (TBC) | T2 |
| `loadVariation.ts` + spec | T3 |
| `RightSidebar.tsx` / `AIChatBox.tsx` | T3 |
| `PricingPage.tsx` | T4 |

---

## Test Commands

```bash
npm run check
cd api && npx vitest run tests/infographics/editable-gating.spec.ts --reporter=verbose
cd client && npx vitest run --reporter=verbose
npm run test:unit
```

---

## Task Checklist (closed 2026-08-15)

- [x] T1 — Server: FREE-tier lifetime-trial gate (`EditableRequiresUpgradeException`, `hasUsedEditableTrial`, `getEffectiveTier`)
- [x] T2 — Server: extra-compose credit increment + monthly-limit interaction (`chargeCredit` option on `composeDesignForEdit`)
- [x] T3 — Client: 402 → flat fallback + upgrade toast on both surfaces (`ApiError`, `EDITABLE_REQUIRES_UPGRADE_REASON`)
- [x] T4 — Pricing page copy (`shared/schema.ts` PLAN_CONFIG) + metering policy amendment (US-LAUNCH-008 + CLAUDE.md)
- [x] `npm run check` passes ✅
- [x] `npm run test:unit` passes — backend 368/368 (+18 new), client 229/229 (+4 new) ✅
- [x] Live E2E: `e2e/us-launch-015-editable-monetization.spec.ts` — `[201, 402]` confirmed, upgrade toast + flat load confirmed

## Anti-patterns (story-specific)

- Do NOT gate by hiding the toggle in the UI — the gate lives server-side; UI only reacts to 402.
- Do NOT charge credits or block on **cache hits** — US-AI-048's cache path must bypass both gate and meter.
- Do NOT touch `costUsd` semantics — it remains true provider spend (CLAUDE.md: never zero or average it).
- Do NOT return 500 for the gate — 402 with a typed code; Security rules require correct status semantics.
- Do NOT surface "$0.09" / "extraction" wording anywhere user-visible.
