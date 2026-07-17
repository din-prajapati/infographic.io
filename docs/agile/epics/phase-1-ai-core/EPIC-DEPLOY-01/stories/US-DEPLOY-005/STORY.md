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

- [ ] **AC1:** A production release rolls out in stages (canary → full) rather than switching 100% at once, using Railway's deploy/health mechanism.
- [ ] **AC2:** An **SLO/health gate** (error rate + `/api/health` + p95) halts promotion when breached.
- [ ] **AC3:** A breached gate triggers **automatic rollback** to the previous healthy release.
- [ ] **AC4:** A **drill** proves it: intentionally ship a failing canary → rollout halts → auto-rolls-back → the bad version never reaches 100%.
- [ ] **AC5:** Alerting notifies on halted/rolled-back deploys.
- [ ] **AC6:** `docs/DEPLOYMENT_STRATEGY.md` §1/§7 updated with the concrete rollout + rollback runbook.

## Out of Scope
- Per-user/percentage feature targeting (that's flags — US-DEPLOY-003).
- Multi-region failover · full OpenTelemetry→Grafana/Datadog pipeline (scale later).

## Primary files
- `railway.json` / Railway deploy settings · Sentry alert rules · `docs/DEPLOYMENT_STRATEGY.md` §7

## Test Cases
| TC | Scenario | Expect |
|----|----------|--------|
| TC-01 | Healthy release | canary → 100%, no manual step |
| TC-02 | Canary with elevated error rate | promotion halts, alert fires |
| TC-03 | Auto-rollback drill (AC4) | previous version restored, bad build never at 100% |

## Definition of Done
- [ ] ACs ✅ · rollback drill passed · alerting verified · runbook documented · PR merged
