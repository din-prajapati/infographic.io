# Story Card — US-DEPLOY-002

> **Status:** 🔲 Not Started
> **Feature:** F-DEPLOY-02 — Preview Environments
> **Epic:** [EPIC-DEPLOY-01](../../EPIC.md) · **Milestone:** [M-DEPLOY-01](../../milestones/M-DEPLOY-01-velocity-foundation.md)
> **Size:** L · **Estimate:** 1.5 days · **Created:** 2026-07-13
> **Depends on:** [US-LAUNCH-010](../../../EPIC-LAUNCH-01/stories/US-LAUNCH-010/STORY.md) — needs `APP_ENV` (adds the `preview` value).
> **Non-blocking to beta launch.**

---

## Story

*As a* reviewer / PM / QA
*I want* every PR to spin up a live, isolated preview URL with prod-shaped data
*So that* I can verify a change by clicking a link — no local pull, no "works on my machine" — the single biggest velocity unlock.

---

## Context

Today there is no preview tier — reviewers pull the branch locally. Railway supports **PR environments** (ephemeral
app), and **Neon supports instant copy-on-write branches**. Combined: a fresh app + a prod-shaped DB branch per PR.
`APP_ENV=preview` (from US-LAUNCH-010) lets the app + RazorPay guard treat previews as non-production (TEST keys).

## Acceptance Criteria

- [ ] **AC1 [happy-path]:** Opening a PR creates an **ephemeral Railway app** for that PR (auto-destroyed on close/merge).
- [ ] **AC2 [happy-path]:** CI creates an **ephemeral Neon branch** off production per PR (Neon API/CLI), injects its direct `DATABASE_URL` into the preview app, and **deletes the branch** on PR close.
- [ ] **AC3 [happy-path]:** The preview app boots with `APP_ENV=preview` + **TEST** RazorPay keys; US-LAUNCH-010's guard passes (non-production ⇒ `rzp_test_*`).
- [ ] **AC4 [happy-path]:** The preview URL is **auto-posted as a PR comment** when ready.
- [ ] **AC5 [security]:** No preview ever uses LIVE keys or the production Neon branch; teardown leaves no orphaned Neon branches (verified by a listing check).
- [ ] **AC6 [documentation]:** `docs/DEPLOYMENT_STRATEGY.md` §6 updated with the concrete preview mechanics.
- [ ] **AC7 [documentation]:** A short **Preview verification checklist** (core flows work · no obvious regressions · `/api/health` returns ok · new UI behavior looks correct) is completed against the preview URL before merging. (Governance follow-up: [US-DEPLOY-006](../US-DEPLOY-006/STORY.md) turns this into a PR-template item.)
- [ ] **AC8 [error-path]:** Given the Neon branch-creation API call fails (rate limit, auth error, quota exceeded), when the preview-environment CI job (`.github/workflows/*`) runs, then the job fails with a clear error message and does not leave an orphaned Railway app running without a database attached.

## Out of Scope
- Prod-data *anonymization* pipeline (use a scrubbed/seed branch initially; full anonymization is a follow-up).
- Preview for forked-repo PRs (secret exposure) — internal branches only for now.
- Enforcing AC7 as a required GitHub check — that's [US-DEPLOY-006](../US-DEPLOY-006/STORY.md).

## Primary files
- `.github/workflows/*` (preview create/teardown jobs; Neon branch CLI)
- Railway PR-environment settings (dashboard) · Neon API token (CI secret)
- `docs/DEPLOYMENT_STRATEGY.md` §6

## Test Cases
| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-DEPLOY-002-01 | Manual | P0 | Given a PR is opened, when the preview job runs, then a preview URL comment appears and the app boots with `APP_ENV=preview` | 🔲 | |
| TC-DEPLOY-002-02 | Manual | P1 | Given the preview app is live, when `/api/health` is hit, then it returns `{"status":"ok","db":"connected"}` against the PR's own Neon branch | 🔲 | |
| TC-DEPLOY-002-03 | Manual | P1 | Given a PR is closed, when teardown runs, then both the Railway app and Neon branch are destroyed with no orphans | 🔲 | |
| TC-DEPLOY-002-04 | Manual | P0 | Given the Neon API call fails during branch creation, when the preview job runs, then CI fails clearly and no orphaned Railway app is left running | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

## Definition of Done
- [ ] ACs ✅ · one real PR demonstrates create→verify→teardown · docs updated · PR merged
