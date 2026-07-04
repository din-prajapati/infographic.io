# Story Card — US-OBS-003

> **Status:** 🔲 Not Started
> **Feature:** F-OBS-00-03 — Sentry React frontend integration
> **Epic:** [EPIC-OBS-00](../../EPIC.md)
> **Milestone:** [M-OBS-01-sentry-integration](../../milestones/M-OBS-01-sentry-integration.md)
> **Linear:** LIN-US-OBS-003
> **Created:** 2026-06-17 | **Closed:** —
> **Depends on:** US-OBS-002 (Sentry DSN confirmed working on backend first)

---

## Background

Currently, frontend JavaScript errors are invisible unless a user opens DevTools and reports them. When a component crashes during generation (e.g., `ResultsVariations.tsx` fails to render a variation), the user sees a blank panel and the backend never knows. Source maps are not uploaded — Sentry would show minified bundle hashes even if frontend errors were captured.

`@sentry/react` provides:
- Error boundary wrapper (`Sentry.ErrorBoundary`) — catches React render errors
- Unhandled promise rejection capture
- User context (email, plan tier) attached to every event
- Replay (optional, Phase 2) — captures the user session as a video when an error fires

---

## Story

*As a* frontend engineer investigating a user-reported blank screen,
*I want* React component crashes to appear in Sentry with readable stack traces and user context,
*So that* I can reproduce the issue without needing to screen-share with the user.

---

## Acceptance Criteria

- [ ] **AC1:** `@sentry/react` is installed. Sentry is initialized in `client/src/main.tsx` using `VITE_SENTRY_DSN`. Missing DSN silently disables Sentry.

- [ ] **AC2:** `App.tsx` (or the top-level router wrapper) is wrapped in `Sentry.ErrorBoundary` with a fallback UI component — a simple "Something went wrong. Please reload the page." message that does not expose raw error details to the user.

- [ ] **AC3:** After successful login, `Sentry.setUser({ email, id, plan })` is called via `AuthProvider`. This attaches user identity to every subsequent Sentry event.

- [ ] **AC4:** Source maps are uploaded to Sentry during `npm run build`. The `@sentry/vite-plugin` is added to `vite.config.ts`. `SENTRY_AUTH_TOKEN` is documented in `.env.production.example`.

- [ ] **AC5:** A manual test confirms: trigger a React render error in dev → Sentry dashboard shows the error with the readable component stack trace (not `bundle.js:1:23456`).

- [ ] **AC6:** `npm run check` passes. `VITE_SENTRY_DSN` is a string (not undefined) in the Vite env type declarations if they exist.

---

## Out of Scope

- Sentry Session Replay (`replaysSessionSampleRate`) — Phase 2, adds significant bundle size
- Performance tracing on the frontend (browser transaction traces) — Phase 2
- Custom frontend metrics or breadcrumbs beyond the default unhandled errors

---

## Engineering Notes

```bash
cd client && npm install @sentry/react
npm install --save-dev @sentry/vite-plugin
```

Init in `client/src/main.tsx`:
```typescript
import * as Sentry from '@sentry/react';
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.05,
  });
}
```

Vite plugin in `vite.config.ts` (production only):
```typescript
import { sentryVitePlugin } from '@sentry/vite-plugin';
// Add to plugins array when building:
...(process.env.SENTRY_AUTH_TOKEN ? [sentryVitePlugin({ org: '...', project: '...' })] : [])
```

`SENTRY_AUTH_TOKEN` must be set in Railway build variables (not runtime variables) because source map upload happens at build time.

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status |
|-------|------|----------|----------|--------|
| TC-OBS-003-01 | Manual | P0 | Throw a deliberate error in `App.tsx` with `VITE_SENTRY_DSN` set → ErrorBoundary shows fallback UI, Sentry captures event | 🔲 |
| TC-OBS-003-02 | Manual | P0 | Log in as a test user → trigger an error → Sentry event shows `user.email` in the context | 🔲 |
| TC-OBS-003-03 | Manual | P1 | Run `npm run build` with `SENTRY_AUTH_TOKEN` → Sentry project → Source Maps tab shows uploaded map files | 🔲 |
| TC-OBS-003-04 | Manual | P1 | Missing `VITE_SENTRY_DSN` → app loads normally, no console errors about Sentry | 🔲 |

---

*Story created: 2026-06-17*
