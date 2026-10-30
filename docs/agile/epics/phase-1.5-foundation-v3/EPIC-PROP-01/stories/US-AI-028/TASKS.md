# PR Task List — US-AI-028

> **Story:** [STORY.md](./STORY.md) | **Branch:** `feat/prop/m-02-brand-profile` | **Type:** feat
> **PR scope:** `UserProfile` model + migration; `GET`/`PUT /users/me/profile` with validation and the logo-URL check; unit tests. No UI.

## Four-Pillars Pre-flight

- [ ] **Brain** — Read `users.controller.ts` route order (static `me/...` before `:userId`) and how `req.user.id` is read.
- [ ] **Muscle** — `StorageService.getPublicUrl(key)` exists (`api/src/modules/storage/services/storage.service.ts`); check whether `StorageModule` is `@Global()`.
- [ ] **Map** — `npx prisma migrate status --schema=api/prisma/schema.prisma` is clean on the dev DB before generating.
- [ ] **Env** — `npm run check` and `npm run test:unit` green at baseline.

## Tasks

### T1 — Model + migration
- [ ] `UserProfile` + `User.profile`; `npx prisma migrate dev --name user_profile`; `prisma generate`.

**ACs:** AC1 · **Effort:** XS

### T2 — DTO, service, controller
- [ ] `ProfileDto` with AC3 validators. `getProfile` (defaults when no row), `saveProfile` (upsert; AC4 logo check).
- [ ] `GET`/`PUT me/profile`, JWT-guarded; `StorageService` injectable in the users module if needed.

**ACs:** AC2, AC3, AC4 · **Effort:** S

### T3 — Tests + verify
- [ ] `api/tests/users/profile.spec.ts` — TC-01 to -04. Manual TC-05; TC-06 after deploy.

**ACs:** AC5 · **Effort:** S

## File → Task Map

| File | Task | Change type |
|---|:--:|---|
| `api/prisma/schema.prisma` | T1 | model + relation (+ generated migration) |
| `api/src/modules/users/dto/profile.dto.ts` | T2 | new |
| `api/src/modules/users/users.service.ts` | T2 | get/save |
| `api/src/modules/users/users.controller.ts` | T2 | routes |
| `api/src/modules/users/users.module.ts` | T2 | StorageService import (if needed) |
| `api/tests/users/profile.spec.ts` | T3 | new |

## Exact Test Commands

```bash
npm run check && npm run test:unit
cd api && npx vitest run tests/users/profile.spec.ts --reporter=verbose
```

## Anti-patterns for this story

- **`prisma db push`.** Migrations deploy via `migrate deploy` (BL-33); a pushed table is drift.
- **Taking `userId` from the body.** Identity is `req.user.id` only.
- **Accepting any `logoUrl`.** It must be under the caller's own `brand-assets/` prefix — this endpoint is the only writer.

*Tasks created: 2026-04-28 · detailed: 2026-10-30*
