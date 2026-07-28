# Story Card — US-DEPLOY-001

> **Status:** 🔲 Not Started
> **Feature:** F-DEPLOY-01 — Fast Test Gate
> **Epic:** [EPIC-DEPLOY-01](../../EPIC.md) · **Milestone:** [M-DEPLOY-01](../../milestones/M-DEPLOY-01-velocity-foundation.md)
> **Size:** S · **Estimate:** 0.5 day · **Created:** 2026-07-13
> **Non-blocking to beta launch.**

---

## Story

*As a* developer shipping small PRs
*I want* a CI gate that is **mandatory, fast (<10 min), and covers typecheck + unit + E2E + real boot**
*So that* a green PR is trustworthy enough to merge without manual re-verification — the foundation of shipping fast.

---

## Context (current state)

`.github/workflows/deploy.yml` today: runs on PR/push/tags, but `tsc --noEmit` has **`continue-on-error: true`**
(the typecheck gate is soft), there is **no Playwright E2E** in CI, and **no `smoke:boot`** (Gate 4a) — the exact
gap that let PT-12 (un-bootable `main`) through. Integration tests run only on push-to-main.

---

## Acceptance Criteria

- [ ] **AC1:** The typecheck step is **hard** — remove `continue-on-error` from `tsc`; a type error fails the PR.
- [ ] **AC2:** The PR job runs `npm run check` + `npm run test:unit` + `npm run build` + `npm run smoke:boot` (Gate 4a) + a Playwright E2E subset, all required to pass.
- [ ] **AC3:** Total PR CI wall-time is **< ~10 min** — achieved via `node_modules` + Playwright browser caching and job parallelization.
- [ ] **AC4:** The gate maps to the `verification-gates` skill (Gate 1 mandatory + Gate 4a boot); skip decisions are explicit in the workflow, never silent.
- [ ] **AC5:** README/`DEPLOYMENT_STRATEGY.md` §5 updated to state the enforced gate.
- [ ] **AC6:** `.github/pull_request_template.md` gets a **Merge checklist** (CI green ✅ · smoke boot passed ✅ · DB migration approach noted if applicable ✅ · flag plan noted if risky ✅), and `DEPLOYMENT_STRATEGY.md` states an explicit **Definition of Merge** = green CI + smoke boot + required notes present in the PR description. (Governance follow-up: [US-DEPLOY-006](../US-DEPLOY-006/STORY.md).)

## Out of Scope
- Preview environments (US-DEPLOY-002) · flags (US-DEPLOY-003).
- Running the *full* E2E suite on every PR if it blows the 10-min budget — pick a fast smoke subset; full suite runs on merge-to-main.
- Branch-protection enforcement of this gate and the broader approval model — that's [US-DEPLOY-006](../US-DEPLOY-006/STORY.md).

## Primary files
- `.github/workflows/deploy.yml` (or split into `ci.yml`)
- `package.json` (confirm `smoke:boot`, test scripts)
- `.github/pull_request_template.md` (AC6)

## Test Cases
| TC | Scenario | Expect |
|----|----------|--------|
| TC-01 | PR with a type error | CI **fails** (not warns) |
| TC-02 | PR with a boot-crash (DI/env) like PT-12 | `smoke:boot` fails the PR |
| TC-03 | Clean PR | green in <10 min |
| TC-04 (Manual) | PR with a schema/risky change, no migration or flag note | Merge checklist item unchecked — self-blocks merge until noted |

## Definition of Done
- [ ] ACs ✅ · CI green on a sample PR in <10 min · docs updated · PR merged
