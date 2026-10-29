# M-OBS-02-ai-metrics — AI Generation Performance Traces + Cost Alerts

> **Epic:** [EPIC-OBS-00](../EPIC.md)
> **Status:** 🔲 Not Started
> **Depends on:** M-OBS-01 complete (TelemetryService + Sentry wired)
> **Target date:** 2026-08-31

---

## Goal

Every AI generation run produces a Sentry Performance transaction with spans for each pipeline step. Cost-per-generation and error-rate alert rules fire before a user notices a problem.

---

## Stories in this Milestone

| Story | Title | Status | PR |
|-------|-------|--------|----|
| [US-OBS-004](../stories/US-OBS-004/STORY.md) | AI generation metrics + alerting | 🔲 | — |

---

## Acceptance (Milestone Done When…)

- [ ] Sentry Performance dashboard shows a transaction per `generateInfographic()` call with child spans: `gpt-4o:analyze`, `gpt-4o:prompt`, `ideogram:generate` (×variations), `db:update`, `db:usage`
- [ ] `costUsd` per generation is emitted as a Sentry metric gauge (visible in Metrics explorer)
- [ ] Alert rule: error rate > 5% over 5 min → Sentry alert fires
- [ ] Alert rule: p95 latency > 30s over 5 min → Sentry alert fires
- [ ] Alert rule: total cost in 24h > $5 → Sentry alert fires
- [ ] Alert destination configured (email or Slack)

---

*Milestone created: 2026-06-17*
