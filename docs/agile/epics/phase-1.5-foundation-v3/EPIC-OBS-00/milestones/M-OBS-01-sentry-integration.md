# M-OBS-01-sentry-integration — TelemetryService + Sentry Backend + Sentry Frontend

> **Epic:** [EPIC-OBS-00](../EPIC.md)
> **Status:** 🔲 Not Started
> **Target date:** 2026-07-31

---

## Goal

Install Sentry in both NestJS and React. Wire the existing `logGen()` pipeline to Sentry. Source maps resolve in production. Zero unhandled exceptions go unnoticed.

---

## Stories in this Milestone

| Story | Title | Status | PR |
|-------|-------|--------|----|
| [US-OBS-001](../stories/US-OBS-001/STORY.md) | TelemetryService abstraction interface | 🔲 | — |
| [US-OBS-002](../stories/US-OBS-002/STORY.md) | Sentry NestJS backend integration | 🔲 | — |
| [US-OBS-003](../stories/US-OBS-003/STORY.md) | Sentry React frontend integration | 🔲 | — |

---

## Acceptance (Milestone Done When…)

- [ ] `TelemetryService` is injectable in NestJS modules with `event()`, `error()`, `gauge()`, `span()` methods
- [ ] Sentry backend captures all unhandled NestJS exceptions with request context
- [ ] A deliberate `throw new Error('test')` in the generation pipeline appears in Sentry within 60s
- [ ] Sentry frontend captures uncaught browser errors with readable stack traces (not minified bundle)
- [ ] `SENTRY_DSN` and `VITE_SENTRY_DSN` are documented in `.env.production.example`
- [ ] Source maps upload is wired in the Vite production build
- [ ] `npm run check` passes; all new packages have type stubs

---

*Milestone created: 2026-06-17*
