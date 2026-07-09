# PR Task List — US-AI-034

> **Story:** [STORY.md](./STORY.md)
> **Branch:** `fix/ai-us-ai-034-generation-progress-delivery`
> **PR:** #_____ (fill when opened)
> **Linear:** LIN-XXX
> **Type:** fix

---

## Three Pillars Pre-flight (check before starting AI session)

- [ ] **Brain** — STORY.md filled: ACs written, Root Cause Findings section ready to fill during investigation
- [ ] **Muscle** — This TASKS.md has file list + ordered tasks + exact test commands
- [ ] **Map** — [ARCHITECTURE.mmd](../../ARCHITECTURE.mmd) exists — shows the confirmed-working backend vs. suspect frontend hook
- [ ] **Env** — [ENV.yaml](../../ENV.yaml) loaded (currently empty — may need updating if investigation reveals a config gap)

---

## PR Scope Summary

**One-liner:** Root-cause and fix generation-progress delivery so results render on staging/production
```
fix(ai): generation progress delivery to browser — US-AI-034
```

---

## Task Breakdown

### T1 — Confirm root cause via DevTools (no code change)
**File:** N/A (diagnostic step)
**AC(s) covered:** AC1
**Changes:**
- Open staging in a real browser (claude-in-chrome once configured, or manual), DevTools → Network → WS
- Submit a real generation, observe the socket connection attempt's target host and status
- Record findings in STORY.md's "Root Cause Findings" section

### T2 — Fix the socket connection target
**File:** `client/src/hooks/useGenerationWebSocket.ts`
**AC(s) covered:** AC2
**Changes:** *(fill during implementation — depends on T1's findings; likely deriving from `window.location.origin` rather than `VITE_API_URL`, mirroring `client/src/lib/api.ts`'s same-origin resolution)*

### T3 — Live-staging re-verification (3x real generations)
**File:** N/A (manual verification)
**AC(s) covered:** AC3
**Changes:**
- Deploy the fix to staging
- Register a fresh account, submit 3 real generations via the actual AI chat UI
- Confirm all 3 render result cards within 30s of backend completion (cross-check against `railway logs`)

### T4 — Confirm no regressions
**File:** `e2e/us-design-003-generation-ux.spec.ts` (verify only, do not edit), local dev
**AC(s) covered:** AC4, AC5
**Changes:** *(fill during implementation)*

---

## File-to-Task Mapping

| File | Task(s) | AC(s) | Notes |
|------|---------|-------|-------|
| DevTools session | T1 | AC1 | no file change |
| `client/src/hooks/useGenerationWebSocket.ts` | T2 | AC2 | the actual fix |
| Live staging | T3 | AC3 | real generations, real cost (~$0.55 for 3) |
| `e2e/us-design-003-generation-ux.spec.ts`, local dev | T4 | AC4, AC5 | regression check |

---

## Exact Test Commands

```bash
npm run check
npm run test:unit
npx playwright test e2e/us-design-003-generation-ux.spec.ts   # AC4 — must still pass unmodified
npm run dev   # AC5 — manual local socket check
# AC3 — no CLI command; live-staging re-verification is manual/scripted per STORY.md's method
```

---

## Task Checklist

- [ ] T1 — root cause confirmed via DevTools, documented in STORY.md
- [ ] T2 — fix implemented
- [ ] T3 — 3/3 live-staging re-verification passed
- [ ] T4 — no regressions (mocked E2E + local dev)
- [ ] `npm run check` passes ✅
- [ ] `npm run test:unit` passes ✅
- [ ] PR opened with story card as description ✅
- [ ] STORY.md ACs updated ✅

---

## Test Is Truth

> Do not weaken, skip, or modify a failing test to make it pass. Fix the code.
> **This story's real "test" is a live staging environment, not a mock.** Do not mark AC3 done from local or mocked evidence alone.

---

## Anti-Patterns to Avoid in This Story

- Do NOT guess-patch by just adding `VITE_API_URL` to Railway without confirming via DevTools first (AC1 requires evidence, not assumption)
- Do NOT touch `ai-orchestrator.service.ts` or any backend generation logic — confirmed already correct
- Do NOT modify the mocked E2E test's `page.route`/`routeWebSocket` interception logic to make it "pass differently" — it must keep testing the same REST-fallback contract
- Do NOT consider this done after only a local (`npm run dev`) verification — the bug is environment-specific and only reproduces against a real deployed environment

---

*Tasks created: 2026-07-09*
