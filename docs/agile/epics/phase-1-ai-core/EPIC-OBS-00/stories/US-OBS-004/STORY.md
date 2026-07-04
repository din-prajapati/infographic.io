# Story Card — US-OBS-004

> **Status:** 🔲 Not Started
> **Feature:** F-OBS-00-04 — AI generation performance traces + cost + alert rules
> **Epic:** [EPIC-OBS-00](../../EPIC.md)
> **Milestone:** [M-OBS-02-ai-metrics](../../milestones/M-OBS-02-ai-metrics.md)
> **Linear:** LIN-US-OBS-004
> **Created:** 2026-06-17 | **Closed:** —
> **Depends on:** US-OBS-002 (Sentry wired), US-OBS-001 (TelemetryService with `span()`)

---

## Background

After M-OBS-01, Sentry captures exceptions. This story adds **performance visibility** — how long each step of the AI pipeline takes, what each generation costs, and proactive alerts before costs or latency become a crisis.

The existing `logGen()` events carry all the data needed:
- `gen:start` / `gen:complete` → total generation duration
- `gen:headline:ok` → GPT-4o latency
- `image:api:ok` → Ideogram latency (per variation)
- `gen:complete.costUsd` → cost per generation

This story promotes those log fields into Sentry Performance spans and metric gauges, and configures alert rules that fire before the problem reaches users.

---

## Story

*As a* product owner,
*I want* the AI generation pipeline latency and cost visible in a dashboard with automatic alerts,
*So that* I know about degradations or runaway costs before users complain.

---

## Acceptance Criteria

- [ ] **AC1:** `AiOrchestrator.generateInfographic()` wraps its execution in a `telemetry.span('ai.generation', ...)` call. The outer span contains child spans:
  - `ai.generation.headline` (GPT-4o property analysis)
  - `ai.generation.prompt` (GPT-4o image prompt)
  - `ai.generation.image` (Ideogram, one span per variation)
  - `ai.generation.db` (Prisma update)

- [ ] **AC2:** At `gen:complete`, `telemetry.gauge('ai.generation.cost_usd', costUsd)` is emitted.

- [ ] **AC3:** At `gen:usage:lost`, `telemetry.error()` is called with severity `warning` and the context `{ generationId, imageModel, costUsd }` — billing loss is surfaced as a warning-level Sentry issue.

- [ ] **AC4:** Three Sentry alert rules are configured (documented in this story — manual setup in Sentry dashboard):
  | Alert | Condition | Threshold | Action |
  |-------|-----------|-----------|--------|
  | High error rate | `gen:failed` / total gen > 5% | 5-min window | Email to owner |
  | P95 latency spike | p95 transaction duration > 30s | 5-min window | Email to owner |
  | Daily cost overrun | `ai.generation.cost_usd` sum > $5 | 24h window | Email to owner |

- [ ] **AC5:** Sentry Performance dashboard shows the `ai.generation` transaction with all child spans for a test generation run.

- [ ] **AC6:** `npm run check` passes.

---

## Out of Scope

- Prometheus metrics endpoint (Phase 3)
- Grafana dashboard (Phase 3)
- Per-user cost attribution in Sentry (Phase 2 — requires user context enrichment)
- PagerDuty or Slack alert routing (Phase 2 — email is sufficient for solo product)

---

## Engineering Notes

Child span pattern using `TelemetryService.span()`:
```typescript
await this.telemetry.span('ai.generation', async () => {
  headline = await this.telemetry.span('ai.generation.headline', () =>
    this.openAiService.analyzeProperty(propertyData)
  );
  // ... etc
});
this.telemetry.gauge('ai.generation.cost_usd', costUsd);
```

Sentry alert rule setup is manual (Sentry dashboard → Alerts → New Alert Rule). Document the exact rule configuration in this story's test cases so a future engineer can reproduce it.

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status |
|-------|------|----------|----------|--------|
| TC-OBS-004-01 | Manual | P0 | Run a generation → Sentry Performance → Transactions → find `ai.generation` transaction with 4 child spans | 🔲 |
| TC-OBS-004-02 | Manual | P0 | Run 3 generations → Sentry Metrics → find `ai.generation.cost_usd` gauge entries | 🔲 |
| TC-OBS-004-03 | Manual | P1 | Force `gen:usage:lost` (mock DB failure in dev) → Sentry shows warning-level issue with `generationId` | 🔲 |
| TC-OBS-004-04 | Manual | P1 | Sentry Alerts dashboard shows all 3 configured rules with correct thresholds | 🔲 |

---

*Story created: 2026-06-17*
