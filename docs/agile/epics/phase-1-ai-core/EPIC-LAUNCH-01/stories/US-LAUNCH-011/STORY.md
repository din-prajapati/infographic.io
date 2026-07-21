# Story Card — US-LAUNCH-011

> **Status:** 🟡 In Review (PR #16)
> **Feature:** F-LAUNCH-07 — Brand Identity
> **Epic:** [EPIC-LAUNCH-01](../../EPIC.md)
> **Milestone:** [M-LAUNCH-01-public-beta](../../milestones/M-LAUNCH-01-public-beta.md)
> **Linear:** LIN-XXX
> **Created:** 2026-07-17 | **Closed:** —
>
> **Context:** Official product name **Buildographic** (domain `buildographic.com` purchased 2026-07-17) replaces the working code name *InfographicAI* on every user-facing surface. Ship **before marketing traffic** — legal pages carrying the wrong product name undermine their purpose, and the first password-reset emails should carry the real brand. Enumerated 2026-07-17: **42 occurrences across 12 files** (marketing pages, auth pages, legal pages, footer, HTML title, Swagger title, email subjects). Internal naming (repo, docs, config, storage keys) is deliberately out of scope.

---

## Story

*As a* real estate agent visiting the product for the first time
*I want* every page, email, and document to consistently say **Buildographic**
*So that* the brand I see in marketing, on the site, in my inbox, and in the Terms I agree to is one and the same product — no trust-eroding name mismatch at signup or checkout.

---

## Acceptance Criteria

- [x] **AC1 [happy-path]:** The brand renders as **"Buildographic"** on every user-visible app surface: `client/index.html:7` `<title>` reads `Buildographic - AI Infographic Generator`; the header/footer brand spans and body copy in `client/src/pages/LandingPage.tsx` (10 occurrences), `client/src/pages/PricingPage.tsx` (8), `client/src/pages/AuthPage.tsx` (header + signup toast), `client/src/pages/auth/ForgotPasswordPage.tsx:30`, `client/src/pages/auth/ResetPasswordPage.tsx:40`, and `client/src/components/SiteFooter.tsx:25` contain zero `InfographicAI` occurrences (verify: `grep -ri "infographicai" client/src client/index.html` over these files returns empty).
- [x] **AC2 [error-path]:** With `RESEND_API_KEY` unset (EmailService console-fallback mode), triggering forgot-password logs an email whose subject is `Reset your Buildographic password` — the rebrand holds even on the degraded email path. Subjects at `api/src/modules/auth/services/auth.service.ts:257` (`Signing in to Buildographic`) and `:281` are updated; unit test asserts the new subject string.
- [x] **AC3 [edge-case]:** All three legal pages (`client/src/pages/legal/TermsPage.tsx` — 6 occurrences, `PrivacyPage.tsx` — 5, `RefundPolicyPage.tsx` — 4) say Buildographic in header brand, body text, and `©` line, with **no other change to legal wording** — the diff on these files touches only the product name.
- [x] **AC4 [edge-case]:** Developer-visible but public surfaces follow: Swagger docs title at `api/src/main.ts:93` reads `Buildographic API`. New assertions added to the existing legal-pages E2E spec (brand text on `/terms`, `/privacy`, `/refund-policy`) pass; `npm run check` and `npm run test:unit` pass.

---

## Out of Scope

- **localStorage prefix migration** — `VITE_STORAGE_PREFIX=infographicai` and legacy `brainwave_*` keys (`client/src/lib/storage.ts`) stay untouched; renaming them requires a one-time user-data migration → separate post-launch story.
- **Internal/tooling naming** — CLAUDE.md, PROJECT_CONTEXT.yaml `project.name`, `.orion/orion.yaml`, agile docs, `package.json` name, repo/folder names all keep *InfographicAI*; a docs-wide rename is deliberate churn with zero user value right now.
- ~~**Logo / visual identity** — this is a text rebrand only; no new logo, colors, or favicon artwork.~~ **Superseded 2026-07-20** — see "Logo Exploration (follow-up)" below. The user supplied 8 candidate logo images mid-implementation and asked to explore/apply them; that work now lives on this branch.
- **Landing page for apex `buildographic.com`** — separate unscoped story; this story only renames the existing in-app `LandingPage.tsx`.
- **Stale copyright year** — `COPYRIGHT InfographicAI 2025` on Landing/Pricing pages becomes `COPYRIGHT Buildographic 2025`; fixing the hardcoded year is a separate cleanup.

---

## Engineering / PR

- **Branch:** `feat/launch/us-launch-011-rebrand-buildographic`
- **PR:** [#16](https://github.com/din-prajapati/infographic.io/pull/16)
- **Primary files touched:**
  - `client/index.html`
  - `client/src/components/SiteFooter.tsx`
  - `client/src/pages/LandingPage.tsx`
  - `client/src/pages/PricingPage.tsx`
  - `client/src/pages/AuthPage.tsx`
  - `client/src/pages/auth/ForgotPasswordPage.tsx`
  - `client/src/pages/auth/ResetPasswordPage.tsx`
  - `client/src/pages/legal/TermsPage.tsx`
  - `client/src/pages/legal/PrivacyPage.tsx`
  - `client/src/pages/legal/RefundPolicyPage.tsx`
  - `api/src/main.ts`
  - `api/src/modules/auth/services/auth.service.ts`
  - `api/tests/auth/password-reset.spec.ts` (subject assertion)
  - `e2e/us-launch-001-legal-pages.spec.ts` (brand assertions)
  - `client/src/components/legal/LegalLayout.tsx` (logo exploration, see below)
  - `client/public/logo-icon-option{1,2,3,4,5,6,7,8}.png` (new)
  - `client/public/logo-icon-option6-original-backup.png` (new)
  - `client/public/logo-option3-lockup.png` (new)

---

## Logo Exploration (follow-up, 2026-07-20/21)

Added mid-implementation at the user's request, after the text rebrand above was already complete.
Not covered by the original ACs — recorded here for traceability rather than retrofitted into AC1–AC4.

- User supplied 8 candidate logo images (WhatsApp exports). Reviewed via a side-by-side artifact
  comparison mocked into the real `LegalLayout.tsx` header; recommended Option 1 (flat house+bars,
  navy/teal) with Option 3 as runner-up.
- Extracted icon-only, transparent-background PNGs for all 8 candidates into `client/public/`
  (background-removal + crop, since the source JPEGs are full lockups with wordmark + tagline baked in).
- Iterated live on Options 1 & 3 in `LegalLayout.tsx`: fixed a baseline-alignment issue (switched the
  flex container from `items-center` to `items-baseline` — more robust than a manual pixel offset),
  enlarged the icon, moved to a stacked icon-over-wordmark layout with live text (not baked into the
  image), and increased the nav bar height (`h-14` → `h-20`) so the stack has breathing room.
- Recolored Option 6 (gold/navy "arrow" mark) to the Option 3 navy/teal brand palette, preserving the
  original gradient/highlight shading. Original backed up as `logo-icon-option6-original-backup.png`.
- **Final decision (2026-07-21): Option 6 (recolored)** — `LegalLayout.tsx` now renders
  `logo-icon-option6.png` (navy house + teal upward arrow, gradient shading preserved) in the stacked
  icon-over-wordmark layout, 80px header. This is the confirmed choice, not an in-progress comparison.
- This only touches the **legal-page header** (`LegalLayout.tsx`); the logo has not been propagated to
  `LandingPage.tsx`, `PricingPage.tsx`, `SiteFooter.tsx`, or the auth pages, which still use the lucide
  `Building2` icon placeholder. Propagating a final choice everywhere is follow-up work.

---

## AI Implementation Prompt

> Copy this block into Claude Code / Cursor to implement the story.

```
Context: Buildographic (codebase still named InfographicAI) — NestJS API (port 3001) + React frontend
(port 5000 via Express proxy). See CLAUDE.md for architecture.

Story: US-LAUNCH-011 — Rebrand user-facing surfaces to Buildographic

{paste Story + ACs from above}

Implementation rules:
- Pure string replacement: "InfographicAI" → "Buildographic" ONLY in the files listed in
  "Primary files touched". 42 occurrences total; the per-file counts in AC1/AC3 are the contract.
- Touch ONLY the files listed in "Primary files touched"
- Do NOT implement anything in "Out of scope" — especially: no storage-key renames, no
  docs/config renames, no legal-wording edits beyond the name, no copyright-year fix
- On legal pages the diff must show ONLY name changes (AC3 is verified by reading the diff)
- Update/add tests for the new brand strings (email subject unit test; legal-pages E2E brand text)
- When done: list files changed, per-file occurrence counts replaced, ACs checked, run
  npm run check && npm run test:unit
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-LAUNCH-011-01 | Auto | P0 | Given the app is built, when `/` and `/pricing` render, then header/footer brand spans and `<title>` say "Buildographic" and contain no "InfographicAI" | ✅ | |
| TC-LAUNCH-011-02 | Auto | P0 | Given `RESEND_API_KEY` is unset, when forgot-password is triggered for a known user, then the console-logged email subject is exactly `Reset your Buildographic password` | ✅ | |
| TC-LAUNCH-011-03 | Auto | P1 | Given the E2E suite runs, when `/terms`, `/privacy`, `/refund-policy` load, then each shows "Buildographic" in header brand and © line | ✅ | `npm run test:e2e -- --grep "legal\|password"` run against `PLAYWRIGHT_BASE_URL=http://localhost:5000` (repo `.env` defaults `PLAYWRIGHT_BASE_URL` to the Railway staging URL — override needed to test locally) — 13 passed, 1 pre-existing skip unrelated to this story |
| TC-LAUNCH-011-04 | Manual | P1 | Sweep `localhost:5000` — `/`, `/pricing`, `/auth`, `/auth` signup toast, forgot/reset pages, all 3 legal pages: zero visible "InfographicAI" | ⚠️ | Brand name is clean on every route. Contact emails `support@`/`privacy@`/`billing@infographicai.in` still render on the 3 legal pages (2 occurrences each) — pre-existing, out of scope (mailbox/DNS migration, not a text rebrand); signup toast verified by source grep only (not clicked, to avoid creating a live account) |
| TC-LAUNCH-011-05 | Auto | P2 | `GET /api/docs` (Swagger UI) page title shows "Buildographic API" | ✅ | Verified via source (`api/src/main.ts:93`) + `npm run check` pass; Swagger UI itself not opened in browser |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [x] All ACs checked ✅
- [x] All test cases run and recorded
- [x] `npm run check` passes
- [x] `npm run test:unit` passes
- [x] Manual flow verified on `localhost:5000` (TC-04 sweep) — pass with finding, see TC-LAUNCH-011-04
- [ ] PR merged (PR #{number})
- [ ] No console errors for the changed flow
- [x] [TASKS.md](./TASKS.md) task list fully checked

---

*Story created: 2026-07-17*
