# Story Card — US-AI-028 — Saved agent profile (the one profile endpoint)

> **Status:** 🔲 Not Started
> **Feature:** F-AI-05-02 | **Epic:** [EPIC-PROP-01](../../EPIC.md) (was EPIC-AI-05)
> **Milestone:** [M-PROP-02-brand-profile](../../milestones/M-PROP-02-brand-profile.md)
> **Moved 2026-10-29:** from EPIC-AI-05 / M-AI-15 (Phase 3) to EPIC-PROP-01 / M-PROP-02 (Phase 1.5) by the Phase 1.5 restructure — [ADR-003](../../../../../decisions/ADR-003-phase-1-close-and-phase-1.5.md). Pulled forward: every asset fills its contact details from this profile, so it is a foundation, not an enrichment.
> **Size:** S
> **Unblocks:** [US-LAUNCH-016](../US-LAUNCH-016/STORY.md) and [US-LAUNCH-017](../US-LAUNCH-017/STORY.md) (both extend this model and this endpoint); [US-EDIT-006](../US-EDIT-006/STORY.md), [US-EDIT-007](../US-EDIT-007/STORY.md) (read it)
> **Capability:** CAP-22 | **Created:** 2026-04-28 | **Hardened:** 2026-10-30

## Story

*As a* real estate agent
*I want* my phone, brokerage, licence, call to action, website, logo and brand colors saved to my account
*So that* every design fills my contact details without retyping, on any device

## Design decision — one write endpoint

`PUT /api/v1/users/me/profile` is the **only** endpoint that writes `UserProfile` profile and brand fields. US-LAUNCH-016
adds its own `POST me/onboarding` for the onboarding answers (different columns); US-LAUNCH-017 adds new columns to
this endpoint's DTO and an upload endpoint, but no second save endpoint. Two writers for the same columns would let one
skip the other's validation (the logo-URL check below).

## Acceptance Criteria

- [ ] **AC1 [happy-path]:** `api/prisma/schema.prisma` gains a `UserProfile` model (`id String @id @default(cuid())`, `userId String @unique`, relation to `User` with `onDelete: Cascade`, `phone String?`, `brokerageName String?`, `licenseNumber String?`, `cta String?`, `website String?`, `logoUrl String?`, `brandColors String[] @default([])`, `createdAt DateTime @default(now())`, `updatedAt DateTime @updatedAt`) plus the `User.profile UserProfile?` relation. The migration is generated with `npx prisma migrate dev --name user_profile`, committed under `api/prisma/migrations/`, and applies cleanly with `prisma migrate deploy` (the Railway pre-deploy step since BL-33). No `db push`.
- [ ] **AC2 [security]:** `GET /api/v1/users/me/profile` (guarded by `AuthGuard('jwt')`; 401 without a valid JWT) returns the `UserProfile` fields for `req.user.id`. When no profile row exists it returns all-null / empty-array defaults rather than 404.
- [ ] **AC3 [security]:** `PUT /api/v1/users/me/profile` (JWT-guarded) accepts an optional subset of the AC1 fields, upserts the `UserProfile` row for `req.user.id`, and returns the saved fields. Validation (`ProfileDto`): `phone` ≤ 30 chars matching `/^[0-9+()\-.\s]*$/`; `brokerageName` ≤ 120; `licenseNumber` ≤ 60; `cta` ≤ 80; `website` `@IsUrl({ require_protocol: true })` ≤ 200; `brandColors` ≤ 5 strings matching `/^#[0-9a-fA-F]{6}$/`. A `userId` (or any unknown key) in the body is rejected by the global `forbidNonWhitelisted` validation; identity comes only from `req.user.id`.
- [ ] **AC4 [security]:** `logoUrl` in `PUT` must be `null` or a string starting with `StorageService.getPublicUrl('brand-assets/' + req.user.id + '/')`; any other value (another user's prefix, an external host, a `data:` URL) returns HTTP 400 and writes nothing. The check lives in `users.service.ts` (it needs `req.user.id`). US-LAUNCH-017 reuses the same check for `headshotUrl`.
- [ ] **AC5 [happy-path]:** `api/tests/users/profile.spec.ts` (mock-based) covers: valid DTO upserts with `where: { userId }` from the JWT user; GET with no row returns the defaults; `logoUrl` under another user's prefix → `BadRequestException`, no upsert; `brandColors: ['red']` and `phone: 'abc'` fail DTO validation. `npm run check` and `npm run test:unit` pass.

## Out of Scope

- Onboarding answers (`role`, `teamSize`, … — US-LAUNCH-016, its own endpoint)
- Brand-kit additions (`headshotUrl`, `equalHousing`, `channels`) and the upload endpoint — US-LAUNCH-017
- Any frontend UI or hydration of the agent store (US-LAUNCH-017 AC6, US-EDIT-006/007)
- Organization-level brand (B-07)

## Engineering / PR

- **Branch:** `feat/prop/m-02-brand-profile`
- **Primary files touched:**
  - `api/prisma/schema.prisma` — `UserProfile` model + `User.profile` relation
  - `api/prisma/migrations/<ts>_user_profile/` — generated
  - `api/src/modules/users/dto/profile.dto.ts` — new: all-optional `ProfileDto`
  - `api/src/modules/users/users.service.ts` — `getProfile(userId)`, `saveProfile(userId, dto)` with the AC4 check
  - `api/src/modules/users/users.controller.ts` — `GET me/profile`, `PUT me/profile` (declared before any `:userId` route)
  - `api/src/modules/users/users.module.ts` — make `StorageService` injectable (TBC — skip if `StorageModule` is `@Global()`)
  - `api/tests/users/profile.spec.ts` — new

## AI Implementation Prompt

```
Context: Buildographic (code name InfographicAI) — NestJS (port 3001) + React (port 5000). See CLAUDE.md.
This story is the M-PROP-02 schema foundation and the ONLY write endpoint for profile/brand fields.
US-LAUNCH-016 and US-LAUNCH-017 extend the UserProfile model; US-LAUNCH-017 extends ProfileDto.

Deliver:
1. UserProfile model per AC1 + User.profile relation. Generate the migration: npx prisma migrate dev --name user_profile
   (never db push — migrations deploy via `migrate deploy`, BL-33). Then prisma generate.
2. ProfileDto (all optional, AC3 validators). users.service.ts getProfile/saveProfile (upsert by userId).
   saveProfile rejects a logoUrl that is not null and not under storage.getPublicUrl(`brand-assets/${userId}/`) (AC4).
3. users.controller.ts GET/PUT me/profile, JWT-guarded, req.user.id only; declare static 'me/...' routes so they do not
   collide with 'organization/members/:userId'.
4. api/tests/users/profile.spec.ts per AC5 (vi.hoisted prisma mock — see api/tests/payments/renewal-reminder.spec.ts).

Out of scope: onboarding fields (US-LAUNCH-016) · headshotUrl/equalHousing/channels + upload (US-LAUNCH-017) · any UI.
Touch only the Primary files. When done: files changed, ACs checked, test output.
```

## Test Cases

| TC ID | Type | Priority | Scenario | Status |
|-------|------|----------|----------|--------|
| TC-US-AI-028-01 | Unit | P0 | Valid `ProfileDto` → `userProfile.upsert` with `where: { userId }` from the JWT user | 🔲 |
| TC-US-AI-028-02 | Unit | P0 | `logoUrl` under another user's `brand-assets/` prefix → `BadRequestException`, no upsert | 🔲 |
| TC-US-AI-028-03 | Unit | P1 | No profile row → GET returns null / `[]` defaults (no 404) | 🔲 |
| TC-US-AI-028-04 | Unit | P1 | `brandColors: ['red']`, `phone: 'abc'` → DTO validation errors | 🔲 |
| TC-US-AI-028-05 | Manual | P0 | `PUT /users/me/profile` with `{ userId: '<other>' }` → 400; without JWT → 401 | 🔲 |
| TC-US-AI-028-06 | Manual | P1 | On staging after deploy: `prisma migrate status` shows no drift; the `UserProfile` table exists | 🔲 |

## Definition of Done

- [ ] All ACs ✅ | `npm run check` ✅ | `npm run test:unit` ✅ | migration applied on staging by `migrate deploy`, no drift | PR merged | [TASKS.md](./TASKS.md) checked

## Implementation Update (log)

### 2026-10-30 — Opus review of PR #83
- Became the single write endpoint for profile/brand fields: US-LAUNCH-017 had a second `PUT me/brand-kit` writing the same columns, and only it checked `logoUrl` — so this endpoint would have bypassed that check. AC4 moves the check here.
- Migration is generated and deployed via `migrate deploy`, not `db push` (BL-33). Real test cases replace the generic stubs.

*Story created: 2026-04-28 · hardened: 2026-10-30*
