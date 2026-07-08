---
title: Observability Rules
type: rules
layer: cross-cutting
tags: [orion, rules, observability, logging, metrics]
updated: 2026-05-20
---

# Observability Rules

> Logging, metrics, and tracing conventions. Cross-cutting across every layer.

## Conventions

- [ ] **Structured logs** — JSON, never free-text. Fields: `level`, `msg`, `traceId`, `userId`, `request_id`.
- [ ] **Log levels honored:** `error` for caller-actionable failures, `warn` for degraded paths, `info` for state changes, `debug` opt-in only.
- [ ] **Every external call wrapped in a span** — DB, queue, third-party API, webhook delivery.
- [ ] **Errors carry context** — `cause`, the operation, the inputs that failed (redacted if sensitive).
- [ ] **Metrics named consistently** — `verb_subject_unit` (e.g., `requests_processed_total`, `db_query_duration_ms`).
- [ ] **One SLO per critical path** — define what "working" means before measuring it.

## Anti-patterns

- [ ] Don't log secrets, tokens, PII — even at debug.
- [ ] Don't catch errors silently — re-throw or log with context.
- [ ] Don't use `console.log` in production code — use the project logger.
- [ ] Don't sample logs randomly — sample by tier (always log errors; sample info).
- [ ] Don't ship without an error monitor wired (Sentry / Datadog) for a non-trivial release.

## Minimum Production Telemetry

- Request rate, error rate, p95 latency per endpoint
- DB query count + duration per request
- External API call counts per provider
- Background job durations + failure rate

## References

- ADRs on observability stack: [docs/agile/decisions/](../../docs/agile/decisions/)
- Project monitor config: see `stack.monitoring` in PROJECT_CONTEXT.yaml
