# EPIC-DEPLOY-01 — Deployment Velocity & Safety (Cursor-style shipping)

> **Phase:** Phase 1 — Platform / Velocity
> **Status:** 🔲 Not Started
> **Depends on:** EPIC-INFRA-01 Task 3 (production exists) for US-DEPLOY-005 only · [US-LAUNCH-010](../EPIC-LAUNCH-01/stories/US-LAUNCH-010/STORY.md) (`APP_ENV`) for US-DEPLOY-002/003
> **Target date:** rolling (non-blocking) — see timeline
> **Owner:** Dinesh
>
> ## 🚦 This epic does NOT block the beta launch
> The public beta ships on the existing 2-tier pipeline (merge→staging, tag→production) the moment
> **[PHASE_0_HUMAN_QA_CHECKLIST.md](../../../testing/PHASE_0_HUMAN_QA_CHECKLIST.md) Task 3 (~1 hr)** is signed off.
> Everything in this epic is *best-practice velocity/safety* work that runs **in parallel** with — and after —
> the beta, so the product can be marketed to potential customers while these land. **Do not gate go-live on
> any US-DEPLOY story.**

---

## Goal

**Outcome:** Adopt the six levers from [docs/DEPLOYMENT_STRATEGY.md](../../../DEPLOYMENT_STRATEGY.md) so the team
ships many small changes a day — **small, auto-verified, independently releasable, instantly reversible** — the
way Cursor / Linear / Vercel operate.

**Why now (but not urgent):** the beta launches on a working-but-minimal pipeline. As soon as we have real beta
users + marketing traffic, the *speed* of iterating on feedback matters more than the launch itself. The three
levers that actually create that speed — **preview environments, feature flags, and a fast/hard test gate** — are
missing today. This epic closes that gap without ever pausing the beta.

**Success metric:** a PR opens → CI is green in <10 min → a reviewer clicks a live preview URL with prod-shaped
data → merge deploys to staging automatically → the feature ships dark behind a flag → flipping the flag releases
it to a % of users → a bad release auto-rolls-back on health check.

---

## Target environment ladder (the design)

| Env | Trigger | `APP_ENV` | DB (Neon branch) | RazorPay | Flags | Audience |
|---|---|---|---|---|---|---|
| **dev** | `npm run dev` | `local` (inferred) | personal / shared staging branch | TEST | all-on locally | each engineer |
| **preview** | PR opened → ephemeral Railway app | `preview` *(new)* | ephemeral Neon branch off prod | TEST | per-PR overrides | reviewer/PM/QA |
| **staging** | merge to `main` → auto-deploy | `staging` | long-lived `staging` branch | TEST | staging-on (dark) | E2E + manual QA |
| **production** | `v*` tag / promote | `production` | `main`/`production` branch | **LIVE** | flip = release | customers |

`dev`, `staging`, `production` already exist. **`preview` is the new tier** (US-DEPLOY-002).

---

## Milestones

| Milestone | Scope | Target | Status |
|-----------|-------|--------|--------|
| [M-DEPLOY-01-velocity-foundation](milestones/M-DEPLOY-01-velocity-foundation.md) | CI gate · preview envs · feature flags · migrations · progressive delivery | rolling / post-beta | 🔲 |

---

## Stories in this Epic

| Story ID | Title | Size | Est. | Status | Depends on |
|----------|-------|------|------|--------|-----------|
| [US-DEPLOY-001](stories/US-DEPLOY-001/STORY.md) | Harden the CI gate (fast, mandatory, + E2E) | S | 0.5 day | 🔲 | — |
| [US-DEPLOY-002](stories/US-DEPLOY-002/STORY.md) | Preview environment per PR (Railway PR env + Neon branch) | L | 1.5 days | 🔲 | US-LAUNCH-010 (`APP_ENV`) |
| [US-DEPLOY-003](stories/US-DEPLOY-003/STORY.md) | Feature-flag mechanism (env-var first, table later) | S | 0.5 day | 🔲 | US-LAUNCH-004 (first consumer) |
| [US-DEPLOY-004](stories/US-DEPLOY-004/STORY.md) | Production migration workflow (`migrate deploy` + expand/contract) | M | 1 day | 🔲 | prod has real data |
| [US-DEPLOY-005](stories/US-DEPLOY-005/STORY.md) | Progressive delivery + auto-rollback (canary, health-gated) | M | 1 day | 🔲 | EPIC-INFRA-01 Task 3 |

**Total engineering effort: ~4.5 focused days** (see timeline below for calendar).

---

## Effort & timeline

> Estimates are *focused working time* including infra trial-and-error (Railway/Neon dashboard + CI runs),
> not just code. AI implements the code in minutes; the time sink is CI iteration and deploy verification.

| Story | Code | Infra/CI iteration | Total | Blast radius if it slips |
|---|---|---|---|---|
| US-DEPLOY-001 | ~2 h | ~2 h (tune CI <10 min) | **0.5 day** | none — CI only |
| US-DEPLOY-002 | ~3 h | ~6–8 h (PR envs + Neon branch automation + teardown) | **1.5 days** | none — ephemeral |
| US-DEPLOY-003 | ~2 h | ~2 h (wire `BETA_MODE` through it) | **0.5 day** | none — additive |
| US-DEPLOY-004 | ~2 h | ~4 h (baseline migration + staging dry-run) | **1 day** | ⚠️ touches prod DB — do carefully, post-data |
| US-DEPLOY-005 | ~3 h | ~4 h (canary + Sentry SLO wiring) | **1 day** | prod rollout — validate on staging first |

- **Calendar:** ~1.5–2 weeks elapsed if done alongside beta/marketing work (not full-time).
- **Recommended order:** 001 → 003 → 002 → 004 → 005. (Cheap wins first; 004/005 wait until prod has real data + traffic.)
- **Marketing runs unblocked the entire time** — beta is live from Phase 0 Task 3.

---

## Out of Scope (Epic Level)

- A hosted flag service (LaunchDarkly/Unleash/Flagsmith) — env-var + `flags` table is enough for now (US-DEPLOY-003).
- Multi-region / blue-green infra — single-region Railway is fine at beta scale.
- Load/perf testing + security audit — Phase 6 (EPIC-INFRA-03).
- Replacing Railway or Neon — the Neon+Railway split is a locked decision (DEPLOYMENT_STRATEGY §6).
- `APP_ENV` itself — that is [US-LAUNCH-010](../EPIC-LAUNCH-01/stories/US-LAUNCH-010/STORY.md); this epic *consumes* it.

---

## Definition of Done (Epic)

- [ ] All milestones closed
- [ ] Preview URL auto-posts on every PR with prod-shaped data
- [ ] CI gate is mandatory (no `continue-on-error`), runs check + unit + E2E + smoke:boot, <10 min
- [ ] At least one feature shipped dark and released via a flag flip
- [ ] `db:deploy` uses `prisma migrate deploy` with a committed baseline migration
- [ ] A bad canary auto-rolled-back at least once in a drill
- [ ] AGILE_INDEX.md epic row updated to ✅ Done

---

## References

- [docs/DEPLOYMENT_STRATEGY.md](../../../DEPLOYMENT_STRATEGY.md) — the source strategy (all six levers).
- [PHASE_0_HUMAN_QA_CHECKLIST.md](../../../testing/PHASE_0_HUMAN_QA_CHECKLIST.md) — the beta-launch gate this epic must NOT block.
- [EPIC-INFRA-01] — MVP deployment (2-tier pipeline this epic extends).

---

*Epic created: 2026-07-13*
