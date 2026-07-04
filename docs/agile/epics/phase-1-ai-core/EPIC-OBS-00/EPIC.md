# EPIC-OBS-00 — Structured Observability Pipeline

> **Phase:** Phase 1 — AI Core (Month 1–3)
> **Status:** 🔲 Not Started
> **Depends on:** EPIC-AI-00 complete (structured logs from `ai-gen-logger.ts` already in place)
> **Linear Project:** LIN-EPIC-OBS-00
> **Target date:** 2026-08-31
> **Owner:** Dinesh

---

## Goal

**Outcome:** Every generation error, latency spike, and unexpected cost event surfaces in Sentry within 60 seconds. The backend structured logs written by `logGen()` are promoted to Sentry transactions and breadcrumbs. The frontend catches and reports uncaught exceptions with readable stack traces via source maps.

**Why now:** Phase 0.5 added structured JSON logging to the AI pipeline (`ai-gen-logger.ts`). That is instrumentation without a sink — it writes to stdout only. Without connecting it to a real observability backend, errors go unnoticed until a user complains. EPIC-OBS-00 adds the sink (Sentry) behind an abstraction layer (TelemetryService) so it can be swapped for Prometheus/Grafana/Datadog in Phase 2–3 without touching caller code.

**Why Sentry first (not Prometheus/Grafana):** Sentry v8+ is OpenTelemetry-native internally. Migrating from Sentry to any OTel-compatible backend later requires only a transport swap — no instrumentation rewrites. Starting with Prometheus would require running a separate scrape server and dashboards before any value is delivered. Sentry gives error tracking + performance tracing + source maps in a single free-tier integration.

**Success metric:**
- A `gen:failed` log event triggers a Sentry error with full context (generationId, textModel, imageModel, durationMs, error message) within 60 seconds
- Browser uncaught exceptions appear in Sentry with readable file names (not bundle hashes)
- P95 generation latency is visible in the Sentry Performance dashboard

---

## Milestones

| Milestone | Scope | Target | Status |
|-----------|-------|--------|--------|
| [M-OBS-01-sentry-integration](milestones/M-OBS-01-sentry-integration.md) | TelemetryService interface + Sentry backend + Sentry frontend | 2026-07-31 | 🔲 |
| [M-OBS-02-ai-metrics](milestones/M-OBS-02-ai-metrics.md) | AI generation performance traces + cost alerts + error rate alerts | 2026-08-31 | 🔲 |

---

## Stories

| Story | Title | Milestone | Size | Status |
|-------|-------|-----------|------|--------|
| [US-OBS-001](stories/US-OBS-001/STORY.md) | TelemetryService abstraction interface | M-OBS-01 | S | 🔲 |
| [US-OBS-002](stories/US-OBS-002/STORY.md) | Sentry NestJS backend integration | M-OBS-01 | M | 🔲 |
| [US-OBS-003](stories/US-OBS-003/STORY.md) | Sentry React frontend integration | M-OBS-01 | S | 🔲 |
| [US-OBS-004](stories/US-OBS-004/STORY.md) | AI generation metrics + alerting | M-OBS-02 | M | 🔲 |

---

## Non-Goals (Deferred)

| Item | Phase |
|------|-------|
| Prometheus metrics endpoint (`/metrics`) | Phase 2–3 — only needed when you have external scraping infra |
| Grafana dashboard | Phase 2–3 — follows Prometheus |
| Datadog APM | Phase 3+ — cost-justified at >10k MAU |
| Custom `/admin/metrics` page | Phase 3+ |
| Log aggregation (Loki / CloudWatch) | Phase 3+ |

---

## Architecture Decision — OpenTelemetry as Abstraction

```
logGen() / NestJS Logger
         │
         ▼
TelemetryService (interface)
   ├── event(name, attrs)
   ├── error(err, context)
   ├── gauge(metric, value)
   └── span(name, fn)
         │
         ▼
SentryTelemetryImpl   ← Phase 1 (this epic)
         │
   (future swap)
         ▼
PrometheusTelemetryImpl  ← Phase 2–3
OpenTelemetryImpl        ← Phase 3+
```

Sentry v8+ (`@sentry/nestjs`) is OpenTelemetry-based internally — migrating to a pure OTel exporter later is a provider swap, not a re-instrumentation.

---

*Epic created: 2026-06-17*
