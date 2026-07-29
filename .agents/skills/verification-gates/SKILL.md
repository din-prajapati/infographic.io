---
name: verification-gates
version: 1.0.0
description: >
  Run a tiered set of verification checks before marking any story or task Done.
  Gate 1 (TypeScript + unit tests) is always mandatory. Gates 2–4 are triggered
  by domain. No gate may be skipped silently — skip decisions must be documented.
domains:
  - all         # Gate 1 runs for every domain, always
  - frontend    # Gate 2 (visual checklist) and Gate 3 (E2E token tests)
  - backend     # Gate 4 (API smoke + integration tests)
triggers:
  - "done"
  - "mark as complete"
  - "story done"
  - "AC checked"
  - "ready to commit"
  - "ready to PR"
  - "implementation complete"
  - "finished implementing"
  - "all ACs pass"
when_to_skip:
  - Documentation-only changes — run Gate 1 only as a sanity check
  - Hotfix addressing a known failing test — run full gates after the fix
---

# Skill: verification-gates

## Problem

"Implementation complete" based on code review is not the same as "it works in the browser."

- Tokens can be correct in the file and wrong in the browser (cascade override)
- CSS can cascade incorrectly depending on load order
- A `backdrop-filter` on a parent can trap a child dropdown at z-index 9999
- Dark mode can break what light mode fixed
- A component change can visually regress a page you did not touch

The only reliable signal is: **run the gates, see them pass.**

**Real examples (M-DESIGN-03):**
- Story marked done → browser showed default Tailwind tokens (not ours) → Gate 3 would have caught it
- Dropdown appeared behind template cards → Gate 2 visual check would have caught it in 2 minutes
- Dark section cards appeared white on black → Gate 2 checklist covers dark-bg sections explicitly

---

## Gate Tiers

| Gate | Name | What it checks | Domain | Required |
|------|------|----------------|--------|----------|
| 1 | Automated | TypeScript errors + unit test suite | All | Always |
| 2 | Visual | Manual browser checklist — all pages, both themes | Frontend | Any UI change |
| 3 | E2E Token | Playwright computed CSS token assertions | Frontend/CSS | Any CSS/token change |
| 4 | API Smoke | Health + endpoint + integration tests | Backend | Any backend change |

---

## Gate 1 — TypeScript + Unit Tests (Always)

**Run before every commit, no exceptions.**

```bash
bash skills/verification-gates/scripts/pre-commit-gate.sh
```

Or manually:
```bash
npm run check          # TypeScript — 0 new errors vs baseline
npm run test:unit      # Unit tests — all green, no regressions
```

**Pass criteria:**
- `npm run check` exits 0. New errors = blocked. Pre-existing baseline errors are acceptable (document baseline count).
- `npm run test:unit` all green.

**If Gate 1 fails:** Do NOT commit. Fix the errors first.

---

## Gate 2 — Visual Checklist (Frontend)

**Run after any component, CSS, or token file change.**

Open `skills/verification-gates/scripts/visual-checklist.md` and work through it.

**Pages to verify (both Light and Dark mode):**

| Page | Critical checks |
|------|----------------|
| Landing Page | Dark-section cards (glass type), button hovers, FAQ accordion, CTA colors |
| Templates Page | Card grid, header, sidebar token consistency |
| Editor | Toolbar hover states, dropdown z-index, Generate button, AI button, AdjustmentsPanel |
| Account / Pricing | Overall palette consistency, no teal remnants |

**Non-negotiable checks in every run:**
- Background colors match warm palette (no teal, no navy)
- Primary buttons are blue `#0ca0eb`, not teal or purple
- Hover states never make text invisible
- Dropdowns and modals appear ABOVE all content (z-index correct)
- Dark sections use explicit dark glass — not theme-dependent glass

**If Gate 2 reveals an issue:** File it. Do not mark the story done. Fix and re-run Gate 2.

---

## Gate 3 — E2E Token Tests (Frontend / CSS)

**Run after any change to `index.css`, `globals.css`, `design-tokens.css`, or token-consuming components.**

```bash
# M-DESIGN-03 token suite
npx playwright test e2e/m-design-03-token-foundation.spec.ts --reporter=list

# Future story suites (add as stories ship)
# npx playwright test e2e/m-design-04-domain-colors.spec.ts --reporter=list
# npx playwright test e2e/m-design-05-component-polish.spec.ts --reporter=list
```

**Pass criteria:** All tests green. Zero regressions from the previous run.

**If a test fails:**
1. Read the failure message — it names the token and the actual vs expected value
2. Use the `runtime-first-implementation` skill to trace why the value is wrong
3. Fix, re-run Gate 3
4. Then re-run Gate 1 to confirm no regressions introduced

---

## Gate 4 — API Smoke (Backend)

**Run after any change to a NestJS module, controller, service, Prisma schema, or middleware.**

```bash
# 4a — MANDATORY for any DI/module/provider change: does the app actually boot?
npm run smoke:boot

# 4b — Always: health check
curl http://localhost:3001/api/v1/health

# Changed module: run its unit test
cd api && npx vitest run tests/<module>/<service>.spec.ts --reporter=verbose

# Schema change: run integration tests (requires .env.test with Neon DB URL)
npm run test:integration
```

> **Why 4a is mandatory:** `tsc` + mocked unit tests can BOTH pass while the app
> crashes at startup — e.g. a service injecting a provider that isn't in the DI
> graph. That's PT-12: `EmailService`→`ConfigService` left `main` un-bootable with
> all of tsc + 7 unit tests green. `npm run smoke:boot` boots the real app on a
> scratch port and is the only gate that catches it.

**Pass criteria:**
- `npm run smoke:boot` → `✅ BOOT OK` (exit 0)
- Health endpoint returns `200 { status: 'ok' }`
- Unit tests for the changed module all green
- No `404` on previously-working routes
- Integration tests pass (if schema changed)

---

## Workflow — Before Any Commit

```
1. Gate 1 always
2. UI change?     → Gate 2 + Gate 3
3. Backend change? → Gate 4
4. All gates pass → commit
```

## Workflow — Before Marking a Story Done

Update STORY.md DoD checklist:
```markdown
- [x] Gate 1: `npm run check` + `npm run test:unit` pass
- [x] Gate 2: Visual checklist — all pages light + dark (frontend stories)
- [x] Gate 3: E2E token tests pass (CSS/token stories)
- [x] Gate 4: API smoke + integration pass (backend stories)
```

---

## Applies to Future Stories

| Story | Gates Required | Notes |
|-------|---------------|-------|
| US-DESIGN-007 | 1 + 2 + 3 | Domain token migration — CSS cascade risk same as M-DESIGN-03 |
| US-DESIGN-008 | 1 + 2 | Badge component — visual verification of all tier variants |
| US-DESIGN-009 | 1 + 2 + 3 | TemplatesPage polish — computed style assertions per component |
| US-DESIGN-010 | 1 + 2 + 3 | Editor toolbar — z-index, hover, active state checks |
| US-DESIGN-011 | 1 + 2 | AI Chat — panel layering, input state, send button |

---

## Edge Cases

| Scenario | Resolution |
|----------|------------|
| Pre-existing TypeScript errors | Document baseline count. Gate passes if count does not increase. |
| Gate 2 impossible (no display / headless) | Document: "Gate 2 skipped — no display. Manual verification required before merge." |
| E2E tests fail due to dev server not running | Start `npm run dev` first. Gate 3 requires a live browser session. |
| Dark mode toggle not working | Check `localStorage.getItem('theme')`. Clear and hard reload. |
| Neon DB auto-paused (integration test timeout) | `afterAll` has reconnect logic. Wait 30s, retry once. |
| Visual issue in Gate 2 after Gate 1 passed | Fix the visual issue. Re-run Gate 1. Re-run Gate 2. Then commit. |
| New E2E spec added but not run in CI | Add to `playwright.config.ts` test list and confirm in CI pipeline. |

---

## Scripts

- [`scripts/pre-commit-gate.sh`](scripts/pre-commit-gate.sh) — executes Gate 1: TypeScript check + unit tests with pass/fail summary
- [`scripts/visual-checklist.md`](scripts/visual-checklist.md) — Gate 2: guided browser checklist for all pages and both themes

---

*Skill created: 2026-04-22*
