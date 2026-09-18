# PR Task List — US-LAUNCH-016

> **Story:** [STORY.md](./STORY.md) | **Branch:** `feat/launch/us-launch-016-signup-onboarding` | **Type:** feat

```
feat(launch): post-signup onboarding screen 1 — US-LAUNCH-016
```

Backlog item — not launch-blocking. Adds a `UserProfile` model + `User.onboardingRequired` flag, one JWT-guarded endpoint, and a routing gate. Shares files with US-LAUNCH-014 — sequence, don't parallelize.

## Four Pillars Pre-flight

- [ ] **Brain** — STORY.md ACs written and read
- [ ] **Muscle** — File list + ordered tasks confirmed below
- [ ] **Map** — ARCHITECTURE.mmd (EPIC-LAUNCH-01) reviewed; confirmed `req.user.id` shape in JWT strategy
- [ ] **Env** — local `DATABASE_URL` points at dev DB; no new env vars needed

## PR Scope

One-liner: new signups (email + Google) must answer a 4-question profile screen (plus optional attribution and unticked marketing opt-in) before entering the app, then land in the gallery filtered to their first asset type; existing users are untouched.

## Task Breakdown

- **T1** — `api/prisma/schema.prisma`: `User.onboardingRequired` (default false) + `UserProfile` model; `npx prisma generate`
- **T2** — `api/src/modules/auth/services/auth.service.ts`: flag new users in `register()` + `googleLogin()` new-user branch; expose `onboardingRequired` in returned user objects
- **T3** — `api/src/modules/users/dto/onboarding.dto.ts` (new) + `users.service.ts` + `users.controller.ts`: `POST /users/me/onboarding`
- **T4** — `api/tests/users/onboarding.spec.ts` (new): AC10 (a)–(f)
- **T5** — `shared/schema.ts` + `client/src/lib/onboarding.ts` (new) + `client/src/pages/onboarding/OnboardingPage.tsx` (new): Screen 1 UI + submit
- **T6** — `client/src/App.tsx`: `ProtectedRoute` redirect + `/onboarding` route
- **T7** — `client/src/components/pages/TemplatesPage.tsx`: `?tag=` initial chip

## File-to-Task Mapping

| File | Task |
|---|---|
| `api/prisma/schema.prisma` | T1 |
| `api/src/modules/auth/services/auth.service.ts` | T2 |
| `api/src/modules/users/dto/onboarding.dto.ts` | T3 |
| `api/src/modules/users/users.service.ts` | T3 |
| `api/src/modules/users/users.controller.ts` | T3 |
| `api/tests/users/onboarding.spec.ts` | T4 |
| `shared/schema.ts` | T5 |
| `client/src/lib/onboarding.ts` | T5 |
| `client/src/pages/onboarding/OnboardingPage.tsx` | T5 |
| `client/src/App.tsx` | T6 |
| `client/src/components/pages/TemplatesPage.tsx` | T7 |

## Exact Test Commands

```bash
npx prisma generate --schema=api/prisma/schema.prisma
npm run check && npm run test:unit
cd api && npx vitest run tests/users/onboarding.spec.ts --reporter=verbose
npm run dev   # manual: TC-07..TC-12 — note api/ edits need a full dev-server restart
```

## Anti-patterns to avoid

- Do not default `onboardingRequired` to `true` in the schema — that silently forces every existing user through onboarding on next page load.
- Do not put the redirect in `AuthPage` / `AuthCallbackPage` — one check in `ProtectedRoute` covers both signup paths; two places will drift.
- Do not trust a `userId` from the request body — `req.user.id` only.
- Do not let `/onboarding` sit behind the same onboarding redirect (infinite loop).

*Tasks created: 2026-09-14*
