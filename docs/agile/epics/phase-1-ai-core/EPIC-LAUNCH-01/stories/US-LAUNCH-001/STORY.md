# Story Card — US-LAUNCH-001

> **Status:** 🟡 Implemented — merged to `main` (51b0040, 2026-07-12); legal pages + footer live, Gate 1 green. Awaiting M-LAUNCH-01 close (blocked by Phase 0 Task 3 deploy).
> **Feature:** F-LAUNCH-01 — Legal & Trust Pages
> **Epic:** [EPIC-LAUNCH-01](../../EPIC.md)
> **Milestone:** [M-LAUNCH-01-public-beta](../../milestones/M-LAUNCH-01-public-beta.md)
> **Size:** M
> **Linear:** LIN-XXX
> **Created:** 2026-07-07 | **Closed:** —

---

## Story

*As a* prospective customer (and as RazorPay's live-activation reviewer)
*I want* Terms of Service, Privacy Policy, and Refund & Cancellation Policy pages on the site
*So that* I can trust the product with my money and data — and RazorPay can approve the account for live payments.

---

## Acceptance Criteria

- [x] **AC1 [happy-path]:** `/terms`, `/privacy`, and `/refund-policy` routes render in `client/src/App.tsx` (Wouter `<Route>`), publicly accessible without auth, returning styled content (no 404, no ProtectedRoute wrapper)
- [x] **AC2 [happy-path]:** Refund & Cancellation page states the subscription model (INR, monthly/annual via RazorPay), cancellation behavior (access until period end), and refund terms — the three things RazorPay's activation review looks for
- [x] **AC3 [happy-path]:** Privacy page discloses: account data stored, payment processing by RazorPay (no card data stored by us), AI providers process listing text/images to generate output
- [x] **AC4 [happy-path]:** Footer links to all three pages appear on LandingPage, PricingPage, and AuthPage
- [x] **AC5 [edge-case]:** Pages use the existing design token system (Warm-Cream palette, Outfit font) and are responsive — no horizontal scroll at 375px width

---

## Out of Scope

- Cookie-consent banner / GDPR data-export tooling
- Final legal review of the wording (HUMAN task — drafted content is a starting point, not legal advice)
- Terms acceptance checkbox on signup (can follow later; pages themselves are the launch blocker)
- Any pricing or plan changes

---

## Engineering / PR

- **Branch:** `feat/launch-us-launch-001-legal-pages`
- **PR:** #_____ (fill when opened)
- **Primary files touched:**
  - `client/src/App.tsx`
  - `client/src/pages/legal/TermsPage.tsx` (new)
  - `client/src/pages/legal/PrivacyPage.tsx` (new)
  - `client/src/pages/legal/RefundPolicyPage.tsx` (new)
  - `client/src/components/SiteFooter.tsx` (new — shared footer) `(TBC — reuse existing footer if one exists)`

---

## AI Implementation Prompt

> Copy this block into Claude Code / Cursor to implement the story.

```
Context: InfographicAI SaaS — NestJS API (port 3001) + React frontend (port 5000 via Express proxy).
See CLAUDE.md for architecture. Router is Wouter, NOT React Router.

Story: US-LAUNCH-001 — Legal & policy pages (Terms · Privacy · Refund)

Add three public pages — /terms, /privacy, /refund-policy — rendered without auth in
client/src/App.tsx, plus footer links on LandingPage, PricingPage, AuthPage.
Content: standard SaaS terms for an India-first subscription product (RazorPay, INR),
privacy disclosure covering AI processing of listing data, and a refund/cancellation
policy (cancel anytime, access until period end). Use one shared layout component for
the three pages. Follow the Blue/Amber/Warm-Cream design token system.

Implementation rules:
- Touch ONLY the files listed in "Primary files touched"
- Do NOT implement anything in "Out of scope"
- Model opacity rule: never name GPT-4o/Ideogram/Gemini in page copy — say "AI providers"
- When done: list files changed, ACs checked, test command to run
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-LAUNCH-001-01 | Auto (E2E) | P0 | Given a logged-out browser, when visiting /terms, /privacy, /refund-policy, then each returns styled content with page title (no 404, no auth redirect) | 🔲 | |
| TC-LAUNCH-001-02 | Auto (E2E) | P0 | Given the pricing page, when scrolling to footer, then links to all three legal pages exist and navigate correctly | 🔲 | |
| TC-LAUNCH-001-03 | Manual | P1 | Given /refund-policy, then cancellation + refund terms and INR/RazorPay billing are explicitly stated | 🔲 | |
| TC-LAUNCH-001-04 | Auto (E2E) | P1 | Given a 375px viewport, when viewing each legal page, then no horizontal scroll and readable typography | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [ ] All ACs checked ✅
- [ ] All test cases run and recorded
- [ ] `npm run check` passes
- [ ] `npm run test:unit` passes
- [ ] Manual flow verified on `localhost:5000`
- [ ] PR merged (PR #_____)
- [ ] No console errors for the changed flow
- [ ] [TASKS.md](./TASKS.md) task list fully checked

---

*Story created: 2026-07-07*
