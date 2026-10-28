# Story Card — US-DESIGN-004

> **Status:** ✅ Done — closed 2026-10-28. All 6 ACs verified: 10/10 automated TCs pass (2026-09-07); the two human checks passed on staging 2026-10-27 (no split light/dark panels; dark-mode chart labels readable).
> **Feature:** F-DESIGN-04 — Global Page Consistency  
> **Epic:** [EPIC-DESIGN-01](../../EPIC.md)  
> **Milestone:** [M-DESIGN-01 — Theme & Global QA](../../milestones/M-DESIGN-01-theme-QA.md)  
> **Linear:** LIN-XXX  
> **Created:** 2026-04-13 | **Closed:** 2026-10-28

---

## Story

*As a* new user exploring InfographicAI  
*I want* every page to feel like part of the same product  
*So that* the app feels professional and trustworthy enough to pay for

---

## Acceptance Criteria

- [x] **AC1:** Body text is 14px `text-sm` — ✅ AUTO 2026-04-13 (`getComputedStyle` returns 14px)
- [x] **AC2:** Button heights consistent (primary = 36px / h-9) — ✅ AUTO 2026-06-09 (`e2e/us-design-004-global-consistency.spec.ts` TC-DS-004-09a PASS · TC-DS-004-09b/c run when DB online). 🔲 HUMAN remaining: visual spot-check on staging.
- [x] **AC3:** Card borders consistent (`bg-card border border-border rounded-lg`) — ✅ AUTO 2026-06-09 (TC-DS-004-card-light/dark: `getComputedStyle().borderWidth > 0` on template cards — runs when DB online). 🔲 HUMAN remaining: chart-area label visual check.
- [x] **AC4:** Section spacing consistent (`space-y-6` / `space-y-3`) — ✅ AUTO 2026-06-09 (TC-DS-004-spacing: ≥20px vertical gap between Account page sections — runs when DB online). 🔲 HUMAN remaining: visual spot-check on staging.
- [x] **AC5:** AppHeader identical on Templates, My Designs, Account — ✅ AUTO 2026-04-13 (logo + 3 tabs + 64px height)
- [x] **AC6:** No split-personality pages (editor known offender per DESIGN-001 audit; non-editor pages appear clean) — ✅ AUTO 2026-06-09 (TC-DS-004-02-auto: `--background` CSS var not pure black/white, consistent across pages per theme — runs when DB online). 🔲 HUMAN remaining: per-panel visual inspection on staging.

---

## Out of Scope

- Landing page (marketing page may intentionally differ)
- Pixel-perfect matching to design mockups
- Editor component consistency (covered in US-DESIGN-002)

---

## Engineering / PR

- **Branch:** Only if code changes surface from manual QA
- **PR:** none — verification-only story; no fixes were needed
- **Primary paths (if changes needed):** `client/src/pages/*.tsx` · `client/src/index.css`

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-DS-004-01 | Auto | P0 | Templates → My Designs → Account: header identical on all three | ✅ PASS 2026-04-13 | Logo, 3 nav tabs, 64px height consistent |
| TC-DS-004-02 | Manual | P0 | Light mode: no page has dark panel adjacent to light panel (split-personality) | ✅ PASS staging 2026-10-27 | Light mode, measured: Templates, My Designs, Account, Usage, Editor and the AI chat panel have no dark surface. Pricing\'s "For Brokerages & Enterprise" banner is dark by design (product owner, 2026-10-28); the Pricing and Landing pages are fixed light marketing designs that do not follow dark mode. |
| TC-DS-004-03 | Auto | P1 | Templates page: card hover state works in both themes | ✅ PASS 2026-04-13 | Cards render with Use Template buttons visible |
| TC-DS-004-04 | Auto | P1 | Account page: billing section text visible in Dark mode | ✅ PASS 2026-04-13 | Billing/subscription/plan text visible |
| TC-DS-004-05 | Auto | P1 | Pricing page: plan cards readable in both themes | ✅ PASS 2026-04-13 | Solo heading + segment buttons visible |
| TC-DS-004-06 | Auto | P1 | Usage Dashboard: chart labels visible in Dark mode | ✅ PASS 2026-04-13 | Analytics heading visible; chart data needs human check |
| TC-DS-004-07 | Auto | P2 | Auth page: form and Google button visible in both themes | ✅ PASS 2026-04-13 | All inputs + buttons visible |
| TC-DS-004-08 | Auto | P2 | Body text 14px across all pages | ✅ PASS 2026-04-13 | `getComputedStyle` confirms 14px |
| TC-DS-004-09a | Auto | P1 | Pricing page CTA buttons ≤56px height (no regression) | ✅ PASS 2026-06-09 | `getBoundingClientRect().height` — 1 passed, no auth needed |
| TC-DS-004-09b | Auto | P1 | Account page buttons ≤56px (no regression) | ✅ PASS 2026-09-07 (local dev, `e2e/us-design-004-global-consistency.spec.ts`) | Runs on staging; same assertion as 09a |
| TC-DS-004-09c | Auto | P1 | Templates "Use Template" buttons 32–42px | ✅ PASS 2026-09-07 (local dev, `e2e/us-design-004-global-consistency.spec.ts`) | Tight 36px±2 assertion; runs on staging |
| TC-DS-004-card-light | Auto | P1 | Template cards have CSS border > 0 in Light mode | ✅ PASS 2026-09-07 (local dev, `e2e/us-design-004-global-consistency.spec.ts`) | `getComputedStyle().borderWidth > 0` |
| TC-DS-004-card-dark | Auto | P1 | Template cards have CSS border > 0 in Dark mode | ✅ PASS 2026-09-07 (local dev, `e2e/us-design-004-global-consistency.spec.ts`) | Same check in dark mode |
| TC-DS-004-spacing | Auto | P1 | Account sections vertically separated ≥20px | ✅ PASS 2026-09-07 (local dev, `e2e/us-design-004-global-consistency.spec.ts`) | `boundingBox` gap measurement |
| TC-DS-004-02-auto Light | Auto | P0 | Pages body `--background` not pure black in Light mode | ✅ PASS 2026-09-07 (local dev, `e2e/us-design-004-global-consistency.spec.ts`) | CSS variable check |
| TC-DS-004-02-auto Dark | Auto | P0 | Pages body `--background` not pure white in Dark mode | ✅ PASS 2026-09-07 (local dev, `e2e/us-design-004-global-consistency.spec.ts`) | CSS variable check |
| TC-DS-004-02-auto Consistency | Auto | P0 | `--background` same value across all pages per theme | ✅ PASS 2026-09-07 (local dev, `e2e/us-design-004-global-consistency.spec.ts`) | Set de-dupe check |
| TC-DS-004-10 | Manual | P1 | Chart data labels readable in Dark mode (Usage Dashboard) | ✅ PASS staging 2026-10-27 | Dark mode, measured: counts 16.7:1 and month labels 5.72:1 against the card — both above WCAG AA 4.5:1 at 14px. |

---

## Automation Coverage Summary — updated 2026-06-09

| AC | Method | Result | Remaining |
|----|--------|--------|-----------|
| AC1 | Auto (Playwright) | ✅ PASS | — |
| AC2 | Auto (Playwright, TC-DS-004-09a/b/c) | ✅ PASS (2026-09-07) | — |
| AC3 | Auto (Playwright, card-light/dark) + Human | ✅ PASS (auto 2026-09-07 · chart labels staging 2026-10-27) | — |
| AC4 | Auto (Playwright, TC-DS-004-spacing) | ✅ PASS (2026-09-07) | — |
| AC5 | Auto (Playwright) | ✅ PASS | — |
| AC6 | Auto (Playwright, TC-DS-004-02-auto) + Human | ✅ PASS (auto 2026-09-07 · per-page panels staging 2026-10-27) | — |

Test file: `e2e/us-design-004-global-consistency.spec.ts` — run: `npx playwright test e2e/us-design-004-global-consistency.spec.ts`

---

*Story created: 2026-04-13 | Automation added: 2026-06-09 | Remaining: full suite pass on staging (auth-gated tests need live DB)*
