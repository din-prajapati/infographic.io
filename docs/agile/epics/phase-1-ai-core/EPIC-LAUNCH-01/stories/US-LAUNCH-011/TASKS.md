# PR Task List — US-LAUNCH-011

> **Story:** [STORY.md](./STORY.md)
> **Branch:** `feat/launch/us-launch-011-rebrand-buildographic`
> **PR:** [#16](https://github.com/din-prajapati/infographic.io/pull/16)
> **Linear:** LIN-XXX
> **Type:** feat

---

## Three Pillars Pre-flight (check before starting AI session)

- [x] **Brain** — STORY.md is filled: ACs written, out-of-scope listed, "AI Implementation Prompt" ready
- [x] **Muscle** — This TASKS.md has file list + ordered tasks + exact test commands
- [x] **Map** — [ARCHITECTURE.mmd](../../ARCHITECTURE.mmd) exists for this epic (AI has spatial context)
- [x] **Env** — [ENV.yaml](../../ENV.yaml) loaded (paths not guessed)

> If any pillar is missing, fill it before opening the AI chat. Incomplete context = wasted session.

---

## PR Scope Summary

**One-liner:** Rename the product on all user-facing surfaces from InfographicAI to Buildographic (42 occurrences, 12 files) — strings only, no behavior change.
```
feat(brand): rebrand user-facing surfaces to Buildographic — US-LAUNCH-011
```

---

## Task Breakdown

### T1 — Marketing surfaces + app shell
**Files:** `client/index.html` (1) · `client/src/pages/LandingPage.tsx` (10) · `client/src/pages/PricingPage.tsx` (8) · `client/src/components/SiteFooter.tsx` (1)
**AC(s) covered:** AC1
**Changes:** replace `InfographicAI` → `Buildographic` (counts above); title becomes `Buildographic - AI Infographic Generator`.

---

### T2 — Auth surfaces
**Files:** `client/src/pages/AuthPage.tsx` (2 — header span + signup toast) · `client/src/pages/auth/ForgotPasswordPage.tsx` (1) · `client/src/pages/auth/ResetPasswordPage.tsx` (1)
**AC(s) covered:** AC1

---

### T3 — Legal pages (name-only diff)
**Files:** `client/src/pages/legal/TermsPage.tsx` (6) · `client/src/pages/legal/PrivacyPage.tsx` (5) · `client/src/pages/legal/RefundPolicyPage.tsx` (4)
**AC(s) covered:** AC3
**Rule:** the diff on these three files must contain ONLY the name substitution — no wording, punctuation, or structure edits.

---

### T4 — Backend strings: email subjects + Swagger title
**Files:** `api/src/modules/auth/services/auth.service.ts` (`:257` → `Signing in to Buildographic`, `:281` → `Reset your Buildographic password`) · `api/src/main.ts` (`:93` → `Buildographic API`)
**AC(s) covered:** AC2, AC4

---

### T5 — Tests: new brand as contract
**Files:** password-reset unit spec under `api/tests/` — assert new email subject; legal-pages E2E spec under `e2e/` — assert "Buildographic" header brand + © line on all 3 routes *(confirm exact filenames at implementation start; both exist from US-LAUNCH-001/003 work)*
**AC(s) covered:** AC2, AC4

---

## File-to-Task Mapping

| File | Task(s) | AC(s) | Notes |
|------|---------|-------|-------|
| `client/index.html` | T1 | AC1 | 1 occurrence |
| `client/src/pages/LandingPage.tsx` | T1 | AC1 | 10 |
| `client/src/pages/PricingPage.tsx` | T1 | AC1 | 8 |
| `client/src/components/SiteFooter.tsx` | T1 | AC1 | 1 |
| `client/src/pages/AuthPage.tsx` | T2 | AC1 | 2 |
| `client/src/pages/auth/ForgotPasswordPage.tsx` | T2 | AC1 | 1 |
| `client/src/pages/auth/ResetPasswordPage.tsx` | T2 | AC1 | 1 |
| `client/src/pages/legal/TermsPage.tsx` | T3 | AC3 | 6 — name-only diff |
| `client/src/pages/legal/PrivacyPage.tsx` | T3 | AC3 | 5 — name-only diff |
| `client/src/pages/legal/RefundPolicyPage.tsx` | T3 | AC3 | 4 — name-only diff |
| `api/src/modules/auth/services/auth.service.ts` | T4 | AC2 | 2 email subjects |
| `api/src/main.ts` | T4 | AC4 | Swagger title |
| `api/tests/…password-reset….spec.ts` | T5 | AC2 | update subject assertion |
| `e2e/…legal….spec.ts` | T5 | AC4 | add brand assertions |

---

## Exact Test Commands

```bash
# 1. TypeScript check — must pass before PR
npm run check

# 2. Unit tests — must pass before PR
npm run test:unit

# 3. E2E — legal pages + auth pages suites
npm run test:e2e -- --grep "legal|password"

# 4. Leftover-brand sweep (should return ONLY out-of-scope internal files)
grep -rn "InfographicAI" client/src client/index.html api/src

# 5. Manual flow
# Open localhost:5000 → sweep /, /pricing, /auth (+ signup toast), /forgot-password,
# /reset-password, /terms, /privacy, /refund-policy — zero visible "InfographicAI"
```

---

## Task Checklist

- [x] T1 — Marketing + shell (index.html, LandingPage, PricingPage, SiteFooter)
- [x] T2 — Auth surfaces (AuthPage, ForgotPasswordPage, ResetPasswordPage)
- [x] T3 — Legal pages, name-only diff (Terms, Privacy, RefundPolicy)
- [x] T4 — Email subjects + Swagger title (auth.service.ts, main.ts)
- [x] T5 — Tests updated/added (unit subject + E2E brand)
- [x] `npm run check` passes ✅
- [x] `npm run test:unit` passes ✅
- [x] E2E: `npm run test:e2e -- --grep "legal|password"` passes (13 passed, 1 pre-existing unrelated skip) — run with `PLAYWRIGHT_BASE_URL=http://localhost:5000`, see note below
- [x] Manual test: TC-LAUNCH-011-04 sweep ✅ (pass with finding — see STORY.md Test Cases)
- [x] PR opened with story card as description ✅ ([#16](https://github.com/din-prajapati/infographic.io/pull/16))
- [x] STORY.md ACs updated ✅
- [x] T6 (follow-up) — Logo exploration: extracted 8 icon-only PNGs, iterated live on Options 1 & 3 in `LegalLayout.tsx` (baseline fix, size, stacked layout, taller header), recolored Option 6 to Option 3's palette. **Final pick: Option 6 (recolored)** — applied in `LegalLayout.tsx`. See STORY.md "Logo Exploration" section.
- [x] T7 (follow-up) — Propagated Option 6 across the whole site: `LandingPage.tsx`, `PricingPage.tsx`, `AuthPage.tsx`, `ForgotPasswordPage.tsx`, `ResetPasswordPage.tsx`. Added `logo-icon-option6-light.png` for dark surfaces; theme-reactive surfaces use both variants gated by Tailwind `dark:`. Non-brand `Building2` icons left untouched. Confirmed no email templates exist to update.
- [x] T8 (follow-up) — Made the stacked icon-over-wordmark lockup (already used on legal pages) consistent site-wide: compact version for the fixed-height Landing/Pricing top nav, left-aligned stacked version for their footer brand columns, full-scale stacked version for Auth/Forgot/Reset password cards.

**Note on E2E run:** repo `.env` sets `PLAYWRIGHT_BASE_URL` to the Railway staging URL by default, so plain `npm run test:e2e` exercises staging (still on old branding, unrelated to this change) rather than the local dev server. Override with `PLAYWRIGHT_BASE_URL=http://localhost:5000` to test this branch's changes locally, as TC-LAUNCH-011-04 requires.

---

## Test Is Truth

> **Rule (non-negotiable):** Do not weaken, skip, or modify a failing test to make it pass. Fix the code. Do not open a PR until all commands in "Exact Test Commands" pass or are explicitly marked N/A with a reason.
>
> Note for this story: changing existing test expectations from "InfographicAI" to "Buildographic" is a **legitimate contract change** (the story redefines the brand contract) — but only for brand-string assertions listed in T5. Any other failing test = fix the code.

---

## Anti-Patterns to Avoid in This Story

- Do NOT touch `VITE_STORAGE_PREFIX`, `brainwave_*` keys, or anything in `client/src/lib/storage.ts` — out of scope (needs data migration).
- Do NOT rename internal identifiers, docs, CLAUDE.md, PROJECT_CONTEXT.yaml, package.json — user-facing strings only.
- Do NOT "improve" legal wording, fix the hardcoded copyright year, or reflow copy while replacing names — name-only diffs.
- Do NOT do a blind repo-wide find-and-replace — the 12-file list is the scope lock.

---

## PR Open Command

```bash
gh pr create \
  --title "[US-LAUNCH-011] Rebrand user-facing surfaces to Buildographic" \
  --label "epic:launch,milestone:m-launch-01,type:feat,priority:P1" \
  --body "$(cat docs/agile/epics/phase-1-ai-core/EPIC-LAUNCH-01/stories/US-LAUNCH-011/STORY.md)"
```

---

*Tasks created: 2026-07-17*
