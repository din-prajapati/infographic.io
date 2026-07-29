# Story Card — US-DEPLOY-005

> **Status:** 🔲 Not Started
> **Feature:** F-DEPLOY-05 — Progressive Delivery
> **Epic:** [EPIC-DEPLOY-01](../../EPIC.md) · **Milestone:** [M-DEPLOY-01](../../milestones/M-DEPLOY-01-velocity-foundation.md)
> **Size:** M · **Estimate:** 1 day · **Created:** 2026-07-13
> **Depends on:** EPIC-INFRA-01 Task 3 (production must exist).
> **Non-blocking to beta launch.**

---

## Story

*As an* operator releasing to production
*I want* new prod versions rolled out gradually with health checks and automatic rollback
*So that* a bad deploy hits a small % of users and self-heals — not 100% of customers.

---

## Context

Production deploys are single-shot today (tag → 100%). Strategy §1/§7 prescribes canary 1%→10%→100% gated on
health (Sentry error-rate, `/api/health`, p95 latency) with auto-rollback. Railway supports staged rollouts +
health-gated deploys; Sentry is already wired (`SENTRY_DSN`).

## Acceptance Criteria

- [ ] **AC1 [happy-path]:** A production release rolls out in stages (canary → full) rather than switching 100% at once, using Railway's deploy/health mechanism.
- [ ] **AC2 [error-path]:** An **SLO/health gate** (error rate + `/api/health` + p95) halts promotion when breached.
- [ ] **AC3 [rollback]:** A breached gate triggers **automatic rollback** to the previous healthy release.
- [ ] **AC4 [regression]:** A **drill** proves it: intentionally ship a failing canary → rollout halts → auto-rolls-back → the bad version never reaches 100%.
- [ ] **AC5 [regression]:** Alerting notifies on halted/rolled-back deploys.
- [ ] **AC6 [documentation]:** `docs/DEPLOYMENT_STRATEGY.md` §1/§7 updated with the concrete rollout + rollback runbook.

## Out of Scope
- Per-user/percentage feature targeting (that's flags — US-DEPLOY-003).
- Multi-region failover · full OpenTelemetry→Grafana/Datadog pipeline (scale later).

## Primary files
- `railway.json` / Railway deploy settings · Sentry alert rules · `docs/DEPLOYMENT_STRATEGY.md` §7

## Test Cases
| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-DEPLOY-005-01 | Manual | P0 | Given a healthy release, when it rolls out, then canary progresses to 100% with no manual step | 🔲 | |
| TC-DEPLOY-005-02 | Manual | P0 | Given a canary with elevated error rate, when the SLO gate evaluates, then promotion halts and an alert fires | 🔲 | |
| TC-DEPLOY-005-03 | Manual | P1 | Given the auto-rollback drill (AC4) runs, when a failing canary is intentionally shipped, then the previous version is restored and the bad build never reaches 100% | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

## Definition of Done
- [ ] ACs ✅ · rollback drill passed · alerting verified · runbook documented · PR merged
