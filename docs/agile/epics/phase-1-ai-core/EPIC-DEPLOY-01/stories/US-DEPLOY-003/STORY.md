# Story Card — US-DEPLOY-003

> **Status:** 🔲 Not Started
> **Feature:** F-DEPLOY-03 — Feature Flags (Deploy ≠ Release)
> **Epic:** [EPIC-DEPLOY-01](../../EPIC.md) · **Milestone:** [M-DEPLOY-01](../../milestones/M-DEPLOY-01-velocity-foundation.md)
> **Size:** S · **Estimate:** 0.5 day · **Created:** 2026-07-13
> **Related:** [US-LAUNCH-004](../../../EPIC-LAUNCH-01/stories/US-LAUNCH-004/STORY.md) — `BETA_MODE` should be the first flag through this helper (implement it *as* the flag, not a one-off).
> **Non-blocking to beta launch.**

---

## Story

*As a* developer merging unfinished or risky work to `main`
*I want* a minimal feature-flag helper so code can deploy **dark** and be released by flipping a flag
*So that* deploy ≠ release — merge continuously, expose features on our schedule, and disable a bad feature instantly without a rollback.

---

## Context

No flag system exists today (`grep` finds only `DEMO_MODE`). The strategy (§4) prescribes **env-var flags first**,
graduating to a `flags` table when per-user/percentage targeting is needed. `BETA_MODE` (US-LAUNCH-004, checkout
off) is the natural first consumer.

## Acceptance Criteria

- [ ] **AC1 [happy-path]:** A single helper `isFeatureEnabled(name)` reads env-var flags (`FEATURE_<NAME>_ENABLED=true`), defaulting to off, usable in both NestJS and the client (build-time `VITE_FEATURE_*` for the client).
- [ ] **AC2 [happy-path]:** Flags are per-environment (Railway var overrides): a feature can be on in staging/preview and off in production.
- [ ] **AC3 [happy-path]:** `BETA_MODE` (US-LAUNCH-004) is wired through the helper as the reference implementation — not a bespoke check.
- [ ] **AC4 [error-path]:** Unit tests: flag on/off/absent → correct boolean; unknown flag defaults off (fail-safe).
- [ ] **AC5 [documentation]:** `docs/DEPLOYMENT_STRATEGY.md` §4 updated with the naming convention + the `flags`-table graduation path.
- [ ] **AC6 [documentation]:** A **Release checklist** (feature enabled only in the intended environment(s)? preview verification passed? rollback plan = disable the flag?) is completed before flipping a flag in production. (Governance follow-up: [US-DEPLOY-006](../US-DEPLOY-006/STORY.md).)

## Out of Scope
- Per-user / percentage targeting, a `flags` DB table, or a hosted service (LaunchDarkly/Unleash) — documented as the next step, not built here.
- Migrating existing `DEMO_MODE` to the helper (leave as-is unless trivial).
- Formalizing "who" approves the release checklist beyond you — that's [US-DEPLOY-006](../US-DEPLOY-006/STORY.md).

## Primary files
- `api/src/config/feature-flags.ts` (new) · `client/src/lib/featureFlags.ts` (new)
- `client/src/pages/PricingPage.tsx` (BETA_MODE consumer) · `.env.example`

## Test Cases
| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-DEPLOY-003-01 | Auto (unit) | P0 | Given `FEATURE_X_ENABLED=true`, when `isFeatureEnabled('X')` is called, then it returns `true` | 🔲 | |
| TC-DEPLOY-003-02 | Auto (unit) | P0 | Given the env var is absent, when `isFeatureEnabled` is called, then it returns `false` (fail-safe off) | 🔲 | |
| TC-DEPLOY-003-03 | Manual | P1 | Given `BETA_MODE` is on in staging and off in production, when checkout renders, then it is hidden in staging and live in production | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

## Definition of Done
- [ ] ACs ✅ · unit tests pass · BETA_MODE uses the helper · docs updated · PR merged
