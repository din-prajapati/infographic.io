# Story Card — US-AI-028

> **Status:** 🔲 Not Started
> **Feature:** F-AI-05-02 | **Epic:** [EPIC-PROP-01](../../EPIC.md) (was EPIC-AI-05)
> **Milestone:** [M-PROP-02-brand-profile](../../milestones/M-PROP-02-brand-profile.md)
> **Moved 2026-10-29:** from EPIC-AI-05 / M-AI-15 (Phase 3) to EPIC-PROP-01 / M-PROP-02 (Phase 1.5) by the Phase 1.5 restructure — [ADR-003](../../../../../decisions/ADR-003-phase-1-close-and-phase-1.5.md). Pulled forward: every asset fills its contact details from this profile, so it is a foundation, not an enrichment.
> **Capability:** CAP-22 (10h) | **Created:** 2026-04-28

## Story

*As a* real estate agent
*I want* Agent profile persistence
*So that* I get smarter, more personalized infographics with less manual effort

## Acceptance Criteria

- [ ] **AC1 [happy-path]:** `api/prisma/schema.prisma` gains a `UserProfile` model (`id String @id @default(cuid())`, `userId String @unique`, relation to `User` with `onDelete: Cascade`, `phone String?`, `brokerageName String?`, `licenseNumber String?`, `cta String?`, `website String?`, `logoUrl String?`, `brandColors String[] @default([])`, `createdAt DateTime @default(now())`, `updatedAt DateTime @updatedAt`) plus the `User.profile UserProfile?` relation, applied as a migration that `prisma migrate deploy` runs cleanly on an empty database.
- [ ] **AC2 [security]:** `GET /api/v1/users/me/profile` (guarded by `AuthGuard('jwt')`; 401 without a valid JWT) returns the `UserProfile` fields for `req.user.id`. When no profile row exists it returns all-null / empty-array defaults rather than 404.
- [ ] **AC3 [security]:** `PUT /api/v1/users/me/profile` (JWT-guarded) accepts an optional subset of the AC1 fields (`phone`, `brokerageName`, `licenseNumber`, `cta`, `website`, `logoUrl`, `brandColors`), upserts the `UserProfile` row for `req.user.id`, and returns the saved fields. A `userId` in the request body is ignored; identity comes only from `req.user.id`.
- [ ] **AC4:** `npm run check` passes

## Engineering / PR

- **Branch:** `feat/ai-us-ai-028-agent-profile`
- **Primary files touched:**
  - `api/prisma/schema.prisma` — `UserProfile` model + `User.profile` relation
  - `api/src/modules/users/dto/profile.dto.ts` — new: all-optional `ProfileDto`
  - `api/src/modules/users/users.service.ts` — `getProfile(userId)`, `saveProfile(userId, dto)`
  - `api/src/modules/users/users.controller.ts` — `GET me/profile`, `PUT me/profile`
  - `api/tests/users/profile.spec.ts` — new

## AI Implementation Prompt

```
Context: InfographicAI SaaS — NestJS (port 3001) + React (port 5000). See CLAUDE.md.
This story is the M-PROP-02 schema foundation. US-LAUNCH-016 and US-LAUNCH-017 both extend the UserProfile model and User.profile relation it creates.
Deliver: (1) UserProfile Prisma model per AC1 + User.profile relation + prisma generate; (2) ProfileDto (all fields optional) + users.service.ts getProfile/saveProfile + users.controller.ts GET me/profile and PUT me/profile, both JWT-guarded, req.user.id only; (3) api/tests/users/profile.spec.ts: a valid dto upserts with the right userId, GET with no row returns null defaults, a body userId is never used.
Out of scope: onboarding fields (role, teamSize — US-LAUNCH-016), brand-kit additions (headshotUrl, equalHousing — US-LAUNCH-017), any frontend UI. Touch only the Primary files listed above.
When done: list files changed, ACs checked, test command to verify.
```

## Test Cases

| TC ID | Type | Priority | Scenario | Status |
|-------|------|----------|----------|--------|
| TC-US-AI-028-01 | Manual | P0 | Core capability works end-to-end | 🔲 |
| TC-US-AI-028-02 | Manual | P1 | Feature degrades gracefully if external API unavailable | 🔲 |

## Definition of Done

- [ ] All ACs ✅ | `npm run check` ✅ | `npm run test:unit` ✅ | PR merged | [TASKS.md](./TASKS.md) checked

*Story created: 2026-04-28*
