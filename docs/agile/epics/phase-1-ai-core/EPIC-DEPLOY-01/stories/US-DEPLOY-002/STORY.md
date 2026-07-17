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

- [ ] **AC1:** Opening a PR creates an **ephemeral Railway app** for that PR (auto-destroyed on close/merge).
- [ ] **AC2:** CI creates an **ephemeral Neon branch** off production per PR (Neon API/CLI), injects its direct `DATABASE_URL` into the preview app, and **deletes the branch** on PR close.
- [ ] **AC3:** The preview app boots with `APP_ENV=preview` + **TEST** RazorPay keys; US-LAUNCH-010's guard passes (non-production ⇒ `rzp_test_*`).
- [ ] **AC4:** The preview URL is **auto-posted as a PR comment** when ready.
- [ ] **AC5:** No preview ever uses LIVE keys or the production Neon branch; teardown leaves no orphaned Neon branches (verified by a listing check).
- [ ] **AC6:** `docs/DEPLOYMENT_STRATEGY.md` §6 updated with the concrete preview mechanics.

## Out of Scope
- Prod-data *anonymization* pipeline (use a scrubbed/seed branch initially; full anonymization is a follow-up).
- Preview for forked-repo PRs (secret exposure) — internal branches only for now.

## Primary files
- `.github/workflows/*` (preview create/teardown jobs; Neon branch CLI)
- Railway PR-environment settings (dashboard) · Neon API token (CI secret)
- `docs/DEPLOYMENT_STRATEGY.md` §6

## Test Cases
| TC | Scenario | Expect |
|----|----------|--------|
| TC-01 | Open a PR | preview URL comment appears; app boots `APP_ENV=preview` |
| TC-02 | Hit preview `/api/health` | `{"status":"ok","db":"connected"}` against the PR's Neon branch |
| TC-03 | Close the PR | Railway app + Neon branch both destroyed (no orphans) |

## Definition of Done
- [ ] ACs ✅ · one real PR demonstrates create→verify→teardown · docs updated · PR merged
