---
name: verification-gates
version: 1.0.0
description: >
  Run a tiered set of verification checks before marking any story or task Done.
  Gates are defined in PROJECT_CONTEXT.yaml. Gate 1 is always mandatory.
  No gate may be skipped silently — skip decisions must be documented in STORY.md.
triggers:
  - "done"
  - "mark as complete"
  - "story done"
  - "AC checked"
  - "ready to commit"
  - "ready to PR"
  - "implementation complete"
  - "finished implementing"
domains:
  - all
---

# Skill: verification-gates

## Problem

"Implementation complete" based on code review is not the same as "it works in production."

The only reliable signal is: **run the gates, see them pass.**

## Gate Tiers (read from PROJECT_CONTEXT.yaml)

The actual gate definitions come from `PROJECT_CONTEXT.yaml.gates`. Default structure:

| Gate | Name | What it checks | Required when |
|:----:|------|----------------|---------------|
| 1 | Automated baseline | Compile + unit tests | Always |
| 2 | Visual / manual | Layout, hover, theme | Any UI change |
| 3 | E2E | End-to-end browser tests | Frontend / CSS change |
| 4 | API smoke | Health + endpoint + integration | Backend change |

## Gate 1 — Mandatory

**Run before every commit, no exceptions.**

Commands come from `PROJECT_CONTEXT.yaml.gates[id=1].commands`. Typical examples:
- `npm run check` (TypeScript) + `npm run test:unit` (unit tests)
- `tsc --noEmit` + `vitest run`
- `mypy .` + `pytest -q` (Python)

**Pass criteria:**
- Compile/type-check exits 0 (pre-existing baseline errors acceptable if documented)
- Unit tests all green

**If Gate 1 fails:** Do NOT commit. Fix first.

## Gate 2 — Visual (Frontend)

**Run after any component, CSS, or token file change.**

Domains: `frontend` (from PROJECT_CONTEXT.yaml). Skipped if backend-only change.

Use the project's visual checklist at the path in `PROJECT_CONTEXT.yaml.gates[id=2].checklist`.

Standard checks:
- Layout works in light + dark mode (if dark mode supported)
- Hover states never make text invisible
- Dropdowns/modals appear above all content
- Primary brand color used (not placeholder)
- Mobile (375px) and desktop (1440px) both functional

**If Gate 2 reveals an issue:** Do not close story. Fix, re-run Gate 2.

## Gate 3 — E2E

**Run after any change to design tokens, CSS architecture, or critical user flow.**

Commands from `PROJECT_CONTEXT.yaml.gates[id=3].commands`. Typical:
- Playwright: `npx playwright test`
- Cypress: `npx cypress run`

**Pass criteria:** All tests green. Zero regressions.

**If a test fails:**
1. Read the message — it names the expected vs actual
2. Use `runtime-first-implementation` to trace why
3. Fix, re-run Gate 3, then re-run Gate 1

## Gate 4 — API Smoke (Backend)

**Run after any change to a backend module, controller, service, schema, or middleware.**

**4a — Boot smoke (MANDATORY for any DI/module/provider change):**
```bash
npm run smoke:boot
```
Starts the real NestJS app on a scratch port and confirms it boots and serves. This
catches the class of bug that passes `tsc` **and** mocked unit tests but crashes at
startup — e.g. a service injecting a provider that isn't in the DI graph (see PT-12:
`EmailService`→`ConfigService` left `main` un-bootable; tsc + 7 mocked unit tests were
all green). **A boot crash cannot reach `main` if this gate runs.**

**4b — Endpoint smoke:**
- Health check: `curl -fsS {api-url}/health`
- Module unit test
- Integration tests (if schema changed)

**Pass criteria:**
- `npm run smoke:boot` → `✅ BOOT OK` (exit 0)
- Health endpoint returns success
- Unit tests for changed module pass
- No `404` on previously-working routes

## Workflow — Before Any Commit

```
1. Gate 1 always
2. UI change?     → Gate 2 + Gate 3
3. Backend change? → Gate 4
4. All gates pass → commit
```

## Workflow — Before Marking Story Done

Update STORY.md DoD checklist:
```markdown
- [x] Gate 1: {commands} pass
- [x] Gate 2: Visual checklist (frontend stories only)
- [x] Gate 3: E2E pass (frontend/css stories only)
- [x] Gate 4: API smoke + integration pass (backend stories only)
```

## Edge Cases

| Scenario | Resolution |
|----------|------------|
| Pre-existing compile errors | Document baseline count. Gate passes if count does not increase. |
| Gate 2 impossible (no display) | Document: "Gate 2 skipped — no display. Manual before merge." |
| E2E fail: dev server not running | Start `{dev command}` first. Gate 3 requires live session. |
| Integration test timeout | Check DB connection. Retry once after 30s. |
| Visual issue after Gate 1 passed | Fix. Re-run Gate 1. Re-run Gate 2. Then commit. |

## Skip Protocol

If a gate must be skipped, the skip is documented in STORY.md:

```markdown
- [ ] Gate 2: Visual — SKIPPED. Reason: backend-only change, no UI touched. Approved: {name}, {date}.
```

No silent skips. Every skip has a reason and an approver.

---

*Skill version: 1.0.0 | Created: 2026-05-18*
