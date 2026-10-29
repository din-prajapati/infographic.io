# PR Task List — US-LAUNCH-017

> **Story:** [STORY.md](./STORY.md) | **Branch:** `feat/launch/us-launch-017-onboarding-brand-kit` | **Type:** feat

```
feat(launch): onboarding brand kit screen — US-LAUNCH-017
```

Backlog item — not launch-blocking. Depends on US-LAUNCH-016. Adds brand-kit columns to `UserProfile`, three JWT-guarded endpoints (one multipart upload to R2), an optional onboarding screen, and store hydration so saved branding reaches generation.

## Four Pillars Pre-flight

- [ ] **Brain** — STORY.md ACs written and read; US-LAUNCH-016 confirmed merged
- [ ] **Muscle** — File list + ordered tasks confirmed below
- [ ] **Map** — ARCHITECTURE.mmd (EPIC-LAUNCH-01) reviewed; `StorageModule` global-or-not confirmed
- [ ] **Env** — `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` present locally (and deliberately unset once for TC-10)

## PR Scope

One-liner: optional, skippable brand-kit step after Screen 1 — logo (auto-extracted colors), headshot, brokerage, phone, license, Equal Housing flag, channels — saved server-side and hydrated into the agent store that generation already reads.

## Task Breakdown

- **T1** — `api/prisma/schema.prisma`: brand-kit columns on `UserProfile`; `npx prisma generate`
- **T2** — `api/src/modules/users/dto/brand-kit.dto.ts` (new) + `users.service.ts` + `users.controller.ts` + `users.module.ts`: upload / save / read endpoints
- **T3** — `api/tests/users/brand-kit.spec.ts` (new): AC9 backend cases
- **T4** — `client/src/lib/brandColors.ts` (new): pure color extraction + file-to-pixels helper
- **T5** — `client/src/pages/onboarding/BrandKitPage.tsx` (new) + `OnboardingPage.tsx` hand-off + `App.tsx` route
- **T6** — `client/src/hooks/useBrandKitHydration.ts` (new) + `App.tsx` mount + `client/src/lib/auth.tsx` `resetAgent()` on logout

## File-to-Task Mapping

| File | Task |
|---|---|
| `api/prisma/schema.prisma` | T1 |
| `api/src/modules/users/dto/brand-kit.dto.ts` | T2 |
| `api/src/modules/users/users.service.ts` | T2 |
| `api/src/modules/users/users.controller.ts` | T2 |
| `api/src/modules/users/users.module.ts` | T2 |
| `api/tests/users/brand-kit.spec.ts` | T3 |
| `client/src/lib/brandColors.ts` | T4 |
| `client/src/pages/onboarding/BrandKitPage.tsx` | T5 |
| `client/src/pages/onboarding/OnboardingPage.tsx` | T5 |
| `client/src/App.tsx` | T5, T6 |
| `client/src/hooks/useBrandKitHydration.ts` | T6 |
| `client/src/lib/auth.tsx` | T6 |

## Exact Test Commands

```bash
npx prisma generate --schema=api/prisma/schema.prisma
npm run check && npm run test:unit
cd api && npx vitest run tests/users/brand-kit.spec.ts --reporter=verbose
npm run dev   # manual: TC-06..TC-12 — api/ edits need a full dev-server restart
```

## Anti-patterns to avoid

- Do not accept arbitrary `logoUrl`/`headshotUrl` strings — only URLs under the caller's own `brand-assets/{userId}/` prefix, or one user can point their kit at another user's (or an external) asset.
- Do not extract colors from the uploaded R2 URL — read the local file; the R2 host isn't CORS-configured for canvas reads.
- Do not overwrite non-empty agent-store fields during hydration — it would clobber what the user just typed in the editor.
- Do not ship hydration without `resetAgent()` on logout — that reintroduces the PT-07 cross-user leak with real brokerage data.

*Tasks created: 2026-09-14*
