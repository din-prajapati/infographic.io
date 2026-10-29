# Story Card — US-OBS-001

> **Status:** 🔲 Not Started
> **Feature:** F-OBS-00-01 — TelemetryService abstraction layer
> **Epic:** [EPIC-OBS-00](../../EPIC.md)
> **Milestone:** [M-OBS-01-sentry-integration](../../milestones/M-OBS-01-sentry-integration.md)
> **Linear:** LIN-US-OBS-001
> **Created:** 2026-06-17 | **Closed:** —
> **Must come before:** US-OBS-002, US-OBS-003, US-OBS-004

---

## Background

Phase 0.5 added `ai-gen-logger.ts` — a structured JSON logger that writes to NestJS Logger (stdout). This is instrumentation without a sink. Wiring it directly to Sentry would create a hard Sentry dependency; swapping to Prometheus later would require editing every call site.

The solution is a thin `TelemetryService` interface that sits between `logGen()` callers and the transport. `SentryTelemetryImpl` is the first implementation. Future implementations (Prometheus, Datadog, OTel exporter) swap in by changing the provider registration — caller code is untouched.

---

## Story

*As a* backend engineer,
*I want* a `TelemetryService` NestJS injectable with a stable interface,
*So that* I can wire observability signals to any backend (Sentry today, Prometheus later) without changing caller code.

---

## Acceptance Criteria

- [ ] **AC1:** `api/src/common/telemetry/telemetry.interface.ts` defines:
  ```typescript
  export interface TelemetryService {
    event(name: string, attrs?: Record<string, unknown>): void;
    error(err: Error | string, context?: Record<string, unknown>): void;
    gauge(metric: string, value: number, attrs?: Record<string, unknown>): void;
    span<T>(name: string, fn: () => Promise<T>): Promise<T>;
  }
  ```

- [ ] **AC2:** `api/src/common/telemetry/noop-telemetry.service.ts` is a `@Injectable()` no-op implementation — all methods are empty. Used as the default until Sentry is configured (US-OBS-002).

- [ ] **AC3:** `TelemetryModule` is a `@Global()` NestJS module that exports `TelemetryService`. Default provider is `NoopTelemetryService`. Switching to Sentry requires only replacing the provider in this module — no changes to consumers.

- [ ] **AC4:** `AiOrchestrator` optionally accepts `TelemetryService` via constructor injection. Existing `logGen()` calls are NOT replaced — telemetry calls supplement the structured logger.

- [ ] **AC5:** `npm run check` passes. No existing tests break.

---

## Out of Scope

- Actual Sentry dependency (US-OBS-002)
- Any frontend telemetry (US-OBS-003)
- Replacing `logGen()` calls — they remain as the server-side structured log; TelemetryService is additive

---

## Engineering Notes

```
api/src/common/telemetry/
  telemetry.interface.ts       ← TelemetryService interface (not class)
  noop-telemetry.service.ts    ← NoopTelemetryService implements TelemetryService
  telemetry.module.ts          ← @Global() module, exports TelemetryService token
```

Use an injection token (`TELEMETRY_SERVICE`) rather than class injection to allow the provider to swap without changing the `@Inject()` decorator on consumers.

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status |
|-------|------|----------|----------|--------|
| TC-OBS-001-01 | Unit | P0 | `NoopTelemetryService.event()` does not throw | 🔲 |
| TC-OBS-001-02 | Unit | P0 | `NoopTelemetryService.span()` executes and returns the inner function's result | 🔲 |
| TC-OBS-001-03 | Integration | P1 | `TelemetryModule` resolves and `TelemetryService` is injectable in a test module | 🔲 |

---

*Story created: 2026-06-17*
