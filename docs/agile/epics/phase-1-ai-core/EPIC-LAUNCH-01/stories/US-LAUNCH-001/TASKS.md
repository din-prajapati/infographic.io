# PR Task List — US-LAUNCH-001

> **Story:** [STORY.md](./STORY.md)
> **Branch:** `feat/launch-us-launch-001-legal-pages`
> **PR:** #_____ (fill when opened)
> **Linear:** LIN-XXX
> **Type:** feat

---

## Three Pillars Pre-flight (check before starting AI session)

- [ ] **Brain** — STORY.md is filled: ACs written, out-of-scope listed, "AI Implementation Prompt" ready
- [ ] **Muscle** — This TASKS.md has file list + ordered tasks + exact test commands
- [ ] **Map** — [ARCHITECTURE.mmd](../../ARCHITECTURE.mmd) exists for this epic
- [ ] **Env** — [ENV.yaml](../../ENV.yaml) loaded

---

## PR Scope Summary

**One-liner:** Add public /terms, /privacy, /refund-policy pages + shared footer links
```
feat(launch): legal & policy pages + footer links — US-LAUNCH-001
```

---

## Task Breakdown

### T1 — Shared legal-page layout + three pages
**Files:** `client/src/pages/legal/TermsPage.tsx`, `PrivacyPage.tsx`, `RefundPolicyPage.tsx` (new)
**AC(s) covered:** AC2, AC3, AC5
**Changes:** *(fill during implementation session)*

### T2 — Register public routes
**File:** `client/src/App.tsx`
**AC(s) covered:** AC1
**Changes:** *(fill during implementation session — insert above the 404 catch-all, no ProtectedRoute)*

### T3 — Footer links on Landing / Pricing / Auth
**Files:** `client/src/components/SiteFooter.tsx` (TBC), `LandingPage.tsx`, `PricingPage.tsx`, `AuthPage.tsx`
**AC(s) covered:** AC4
**Changes:** *(fill during implementation session)*

---

## File-to-Task Mapping

| File | Task(s) | AC(s) | Notes |
|------|---------|-------|-------|
| `client/src/pages/legal/*.tsx` | T1 | AC2, AC3, AC5 | new |
| `client/src/App.tsx` | T2 | AC1 | public routes |
| footer + 3 pages | T3 | AC4 | reuse existing footer if present |

---

## Exact Test Commands

```bash
npm run check
npm run test:unit
# Manual: open localhost:5000/terms, /privacy, /refund-policy logged OUT → styled pages render;
# footer links present on /, /pricing, /auth; shrink to 375px → no horizontal scroll
```

---

## Task Checklist

- [ ] T1 — legal pages (files: `client/src/pages/legal/*`)
- [ ] T2 — routes (file: `client/src/App.tsx`)
- [ ] T3 — footer links
- [ ] `npm run check` passes ✅
- [ ] `npm run test:unit` passes ✅
- [ ] Manual test recorded ✅
- [ ] PR opened with story card as description ✅
- [ ] STORY.md ACs updated ✅

---

## Test Is Truth

> Do not weaken, skip, or modify a failing test to make it pass. Fix the code.

---

## Anti-Patterns to Avoid in This Story

- Do NOT wrap the legal routes in `ProtectedRoute` — they must be public (RazorPay reviewer is logged out)
- Do NOT name AI vendors (GPT-4o, Ideogram, Gemini) in page copy — "AI providers" only (model opacity rule)
- Do NOT restyle existing pages while adding footer links

---

*Tasks created: 2026-07-07*
