# Story Card — US-OBS-002

> **Status:** 🔲 Not Started
> **Feature:** F-OBS-00-02 — Sentry NestJS backend integration
> **Epic:** [EPIC-OBS-00](../../EPIC.md)
> **Milestone:** [M-OBS-01-sentry-integration](../../milestones/M-OBS-01-sentry-integration.md)
> **Linear:** LIN-US-OBS-002
> **Created:** 2026-06-17 | **Closed:** —
> **Depends on:** US-OBS-001 (TelemetryService interface)

---

## Background

`logGen()` in `ai-gen-logger.ts` writes structured JSON to NestJS Logger (stdout). Railway captures this as container logs — searchable but not queryable, no alerts, no aggregation. When `gen:failed` fires at 3 AM, nothing notifies anyone.

Sentry v8+ (`@sentry/nestjs`) uses OpenTelemetry internally. Installing it gives us:
- Automatic NestJS exception capture (unhandled exceptions → Sentry error events)
- Performance transaction per HTTP request
- Manual error capture for domain errors (`gen:failed`, `gen:db:error`, `gen:usage:lost`)

**Why `@sentry/nestjs` not `@sentry/node`:** `@sentry/nestjs` provides NestJS-native interceptors and decorators that capture HTTP context (route, user, request ID) automatically. Lower boilerplate than wiring `@sentry/node` manually.

---

## Story

*As a* backend engineer on call,
*I want* every `gen:failed` event and unhandled NestJS exception to appear in Sentry automatically,
*So that* I am alerted within 60 seconds rather than finding out from a user complaint.

---

## Acceptance Criteria

- [ ] **AC1:** `@sentry/nestjs` is installed and initialized in `api/src/main.ts` before NestJS app is created. `SENTRY_DSN` env var gates initialization — missing DSN silently disables Sentry (no throw).

- [ ] **AC2:** `SentryTelemetryService implements TelemetryService` is created in `api/src/common/telemetry/sentry-telemetry.service.ts`. Its `error()` method calls `Sentry.captureException()` with the provided context as extra data.

- [ ] **AC3:** `TelemetryModule` provider is updated to use `SentryTelemetryService` when `SENTRY_DSN` is set, `NoopTelemetryService` otherwise. No consumer changes required.

- [ ] **AC4:** `AiOrchestrator.generateInfographic()` calls `telemetry.error()` at the `gen:failed` event branch (in addition to existing `logGen()`). The error carries `{ generationId, textModel, imageModel, durationMs }` as context.

- [ ] **AC5:** `SENTRY_DSN` is added to `.env.production.example` with a comment explaining it is required for production and optional for staging.

- [ ] **AC6:** A deliberate test error (triggered manually in dev or staging) appears in Sentry within 60 seconds with a stack trace.

- [ ] **AC7:** `npm run check` passes. Unit tests that mock `TelemetryService` continue to work.

---

## Out of Scope

- Sentry Performance traces for AI generation spans (US-OBS-004)
- Frontend Sentry integration (US-OBS-003)
- Alert rules configuration (US-OBS-004)
- Source map upload (covered separately in US-OBS-003 since maps are a Vite/frontend concern)

---

## Engineering Notes

```bash
cd api && npm install @sentry/nestjs @sentry/profiling-node
```

Init pattern (must be before NestJS bootstrap):
```typescript
// api/src/main.ts — top of file, before imports
import * as Sentry from '@sentry/nestjs';
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.1,  // 10% of requests for performance monitoring
  });
}
```

SentryTelemetryService skeleton:
```typescript
@Injectable()
export class SentryTelemetryService implements TelemetryService {
  event(name: string, attrs?: Record<string, unknown>): void {
    Sentry.addBreadcrumb({ message: name, data: attrs });
  }
  error(err: Error | string, context?: Record<string, unknown>): void {
    Sentry.withScope(scope => {
      if (context) scope.setExtras(context);
      Sentry.captureException(err instanceof Error ? err : new Error(String(err)));
    });
  }
  gauge(metric: string, value: number, attrs?: Record<string, unknown>): void {
    // Sentry metrics are behind a flag in v8 — use addBreadcrumb as fallback
    Sentry.addBreadcrumb({ category: 'metric', message: metric, data: { value, ...attrs } });
  }
  async span<T>(name: string, fn: () => Promise<T>): Promise<T> {
    return Sentry.startSpan({ name }, fn);
  }
}
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status |
|-------|------|----------|----------|--------|
| TC-OBS-002-01 | Manual | P0 | Start `npm run dev` with `SENTRY_DSN` set → generate an infographic → Sentry dashboard shows a `generation` breadcrumb trail | 🔲 |
| TC-OBS-002-02 | Manual | P0 | Force `gen:failed` (disconnect `IDEOGRAM_API_KEY`) → Sentry shows error event with `generationId` in extra context | 🔲 |
| TC-OBS-002-03 | Unit | P1 | `SentryTelemetryService.error()` calls `Sentry.captureException` (mock Sentry module) | 🔲 |
| TC-OBS-002-04 | Manual | P1 | Missing `SENTRY_DSN` → app starts normally, no exception, no Sentry errors | 🔲 |

---

*Story created: 2026-06-17*
