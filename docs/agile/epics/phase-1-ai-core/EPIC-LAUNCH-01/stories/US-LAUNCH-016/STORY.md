# Story Card — US-LAUNCH-016

> **Status:** 🔲 Not Started
> **Priority:** Backlog — should-have, not launch-blocking. Like US-LAUNCH-014, it does NOT gate the M-LAUNCH-01 "Acceptance (Done When)" checklist.
> **Feature:** F-LAUNCH-08 — Signup Onboarding
> **Epic:** [EPIC-LAUNCH-01](../../EPIC.md)
> **Milestone:** [M-LAUNCH-01-public-beta](../../milestones/M-LAUNCH-01-public-beta.md)
> **Size:** M (4–7 h)
> **Depends on:** None logically. **File overlap with US-LAUNCH-014** (`auth.service.ts`, `App.tsx`, `shared/schema.ts`) — do not run the two in parallel worktrees; whichever lands second rebases.
> **Split from:** the post-signup onboarding request (2026-09-14). Screen 2 (brand kit) is [US-LAUNCH-017](../US-LAUNCH-017/STORY.md), which depends on this story.
> **Note:** Introduces a new `UserProfile` model and one new `User` field (`onboardingRequired`) — run `npx prisma generate --schema=api/prisma/schema.prisma` after the schema change.
> **Linear:** LIN-XXX
> **Created:** 2026-09-14 | **Closed:** —

---

## Story

*As a* real estate professional who has just created a Buildographic account (email/password or Google)
*I want* a short "tell us about you" screen before I land in the app, which then opens the gallery on the kind of asset I said I want to make first
*So that* I reach a relevant first design faster, and the business learns my role, team size, market and acquisition source — the segmentation and upgrade signals that today are never collected.

---

## Acceptance Criteria

- [ ] **AC1 — Schema.** `api/prisma/schema.prisma` has:
  - on `User`: `onboardingRequired Boolean @default(false)` and the relation `profile UserProfile?`
  - a new model `UserProfile` with `id String @id @default(cuid())`, `userId String @unique` (relation to `User`, `onDelete: Cascade`), `role String`, `teamSize String`, `primaryMarket String`, `firstAssetType String`, `acquisitionSource String?`, `acquisitionSourceOther String?`, `marketingOptIn Boolean @default(false)`, `marketingOptInAt DateTime?`, `createdAt DateTime @default(now())`, `updatedAt DateTime @updatedAt`.
  The `@default(false)` on `onboardingRequired` is deliberate: **existing users are never sent through onboarding** — no backfill is needed.

- [ ] **AC2 — Only new signups are flagged.** `AuthService.register()` creates the user with `onboardingRequired: true`. In `AuthService.googleLogin()`, **only** the branch that creates a brand-new user (neither `googleId` nor `email` matched) sets `onboardingRequired: true`; the "link Google to an existing email account" branch does not change it. The `user` object returned by `register()`, `login()` and the Google exchange (`googleLogin()` → `exchangeOAuthCode()`) includes `onboardingRequired` with the database value.

- [ ] **AC3 — Save endpoint.** `POST /api/v1/users/me/onboarding` (guarded by `AuthGuard('jwt')`; HTTP 401 without a valid JWT) accepts `OnboardingDto`:
  - `role` ∈ `agent | team_lead | broker_owner | marketing_coordinator | lender | other` (required)
  - `teamSize` ∈ `solo | 2_10 | 11_50 | 50_plus` (required)
  - `primaryMarket` — string, trimmed, 2–120 chars (required)
  - `firstAssetType` ∈ `just_listed | open_house | just_sold | market_update | social_post` (required)
  - `acquisitionSource` ∈ `google_search | social_media | referral | brokerage | event | other` (optional)
  - `acquisitionSourceOther` — string, max 200 chars (optional; persisted only when `acquisitionSource = other`, otherwise stored as null)
  - `marketingOptIn` — boolean (optional, default false)
  Any value outside these sets, or a missing required field, returns HTTP 400 and writes nothing. The user id is taken **only** from `req.user.id`; a `userId` field in the body is rejected by the global whitelist validation or ignored — it is never used.

- [ ] **AC4 — Save behavior.** On a valid request the service, in one `prisma.$transaction`: upserts `UserProfile` for `req.user.id` with the submitted fields; sets `marketingOptInAt = new Date()` when `marketingOptIn = true`, and `marketingOptInAt = null` when false; sets `User.onboardingRequired = false`. It returns HTTP 200 with `{ user: { id, email, name, organizationId, onboardingRequired: false } }`. A second call for the same user updates the existing profile row (no duplicate, no 500).

- [ ] **AC5 — Routing gate.** In `client/src/App.tsx`, `ProtectedRoute` redirects to `/onboarding` when `user.onboardingRequired === true`. This covers every route that uses `ProtectedRoute` today (`/templates`, `/my-designs`, `/account`, `/usage`, `/editor`). A user whose `onboardingRequired` is `false`, `undefined` (a stale `auth_user` from before this story) or who is logged out is **not** redirected to `/onboarding`. `/onboarding` itself is registered as an app-only, auth-required route that does **not** apply the onboarding redirect, and it redirects to `/templates` when `onboardingRequired` is not `true`.

- [ ] **AC6 — Screen 1 UI.** `client/src/pages/onboarding/OnboardingPage.tsx` renders one screen with:
  - a heading addressing the user by first name when `user.name` is set
  - single-choice option groups for Role, Team size and "What do you want to make first?", with labels: Agent / Team lead / Broker-owner / Marketing coordinator / Lender / Other; Just me / 2–10 / 11–50 / 50+; Just Listed / Open House / Just Sold / Market Update / Social post
  - a text input "Primary market" (placeholder e.g. "Austin, TX")
  - an optional "How did you hear about us?" select; choosing "Other" reveals a text input
  - a checkbox "Send me product updates and marketing tips", **unchecked by default**, visually separate from the Continue button
  The **Continue** button is disabled until Role, Team size, Primary market (≥ 2 non-space chars) and First asset are all set. It does not ask for name, email or photo.

- [ ] **AC7 — Submit and hand-off.** Clicking Continue calls `POST /api/v1/users/me/onboarding` with the JWT. On HTTP 200, the page calls `AuthProvider.login(response.user, existingToken)` so `localStorage.auth_user.onboardingRequired` becomes `false`, then navigates to `/templates?tag=<tag>` where `<tag>` comes from a `FIRST_ASSET_TAG` map keyed by `firstAssetType`; `social_post` maps to no tag and navigates to plain `/templates`. On a non-200 or network error, an inline error with a **Try again** button is shown and the user stays on the page — the JWT and form values are preserved.

- [ ] **AC8 — Gallery honours the tag.** `TemplatesPage` reads the `tag` query parameter with Wouter's `useSearch()` on mount. If the value is in `availableChips`, it starts with that chip active (same state as a user clicking the chip). If the value is absent or not in `availableChips`, the gallery renders unfiltered and no error is shown.

- [ ] **AC9 — Layout.** `OnboardingPage` renders without horizontal overflow at 375px and 1440px viewport widths, and all option groups are operable by keyboard (Tab to reach, Space/Enter to select).

- [ ] **AC10 — Unit tests** in `api/tests/users/onboarding.spec.ts` (mock-based, no DB) cover:
  (a) valid DTO → `userProfile.upsert` called with `where: { userId }` from the authenticated user, and `user.update` called with `{ onboardingRequired: false }`
  (b) `marketingOptIn: true` → `marketingOptInAt` is a `Date`; `marketingOptIn: false` → `marketingOptInAt` is `null`
  (c) `acquisitionSource: 'google_search'` with `acquisitionSourceOther: 'x'` → persisted `acquisitionSourceOther` is `null`
  (d) DTO validation rejects `role: 'ceo'` and a missing `primaryMarket` (class-validator `validate()` returns errors)
  (e) `register()` → `prisma.user.create` data includes `onboardingRequired: true`
  (f) `googleLogin()` new-user branch → `prisma.user.create` data includes `onboardingRequired: true`; existing-email link branch → `prisma.user.update` data has no `onboardingRequired` key

---

## Out of Scope

- **Screen 2 / brand kit** (logo, colors, brokerage, headshot, phone, license, Equal Housing, channels) — [US-LAUNCH-017](../US-LAUNCH-017/STORY.md).
- **Feeding role or market into generation prompts** (tone by role, local market data). Stored only here; tone routing is US-AI-029 and live market data is US-AI-027 (EPIC-AI-05).
- **Sending anything to a marketing/email tool** (Resend audiences, CRM, analytics events). This story stores consent + attribution; syncing it out is a later story. Epic-level out-of-scope already excludes lifecycle campaigns.
- **Showing or editing these answers on `/account`** — a later profile-settings story.
- **Onboarding for existing users** or for users who join via the org invite flow — they keep `onboardingRequired = false`.
- **Mapping `teamSize` to a plan recommendation or upsell UI** — data capture only.
- **A "Skip" option on Screen 1** — the screen is required by design; the error path in AC7 is the only escape hatch needed.
- **Any change to US-LAUNCH-014's email verification** fields, endpoints or banner.

---

## Engineering / PR

- **Branch:** `feat/launch/us-launch-016-signup-onboarding` (escape-hatch story branch; or the milestone branch if taken together with 014/017)
- **PR:** #_____ (fill when opened)
- **Primary files touched:**
  - `api/prisma/schema.prisma` — `User.onboardingRequired`, `User.profile`, new `UserProfile` model
  - `api/src/modules/auth/services/auth.service.ts` — set `onboardingRequired: true` on new users in `register()` and `googleLogin()` new-user branch; include `onboardingRequired` in all returned `user` objects
  - `api/src/modules/users/dto/onboarding.dto.ts` — NEW: `OnboardingDto` with `@IsIn`, `@IsString`, `@Length`, `@IsOptional`, `@IsBoolean`
  - `api/src/modules/users/users.controller.ts` — `POST me/onboarding`
  - `api/src/modules/users/users.service.ts` — `saveOnboarding(userId, dto)`
  - `shared/schema.ts` — `onboardingRequired?: boolean` on `LegacyUser`
  - `client/src/App.tsx` — `ProtectedRoute` redirect; `/onboarding` route
  - `client/src/pages/onboarding/OnboardingPage.tsx` — NEW
  - `client/src/lib/onboarding.ts` — NEW: option lists, `FIRST_ASSET_TAG` map (tag values **(TBC)** — verify against the real `availableChips` values at implementation time)
  - `client/src/components/pages/TemplatesPage.tsx` — read `?tag=` into initial `activeChips`
  - `api/tests/users/onboarding.spec.ts` — NEW

---

## AI Implementation Prompt

> Copy this block into Claude Code to implement the story.

```
Context: Buildographic (code name InfographicAI) — NestJS API (port 3001) + React frontend (port 5000 via Express proxy).
Stack: React 18 + Vite, NestJS 11, Prisma 6, Tailwind v3 + shadcn/ui, Wouter router (never React Router), Zustand + React Query.
See CLAUDE.md for architecture.

Story: US-LAUNCH-016 — Post-signup onboarding, Screen 1 (required profile)

New users (email/password AND Google) see a one-screen "about you" form before entering the app:
role, team size, primary market, first asset type, optional acquisition source, unticked marketing opt-in.
On submit they land in /templates pre-filtered to their first asset type. Existing users are never affected.

Verified facts about the current code (2026-09-14):
- AuthService (api/src/modules/auth/services/auth.service.ts):
  - register() creates user with select { id, email, name, organizationId } and returns { user, token }.
  - login() returns user { id, email, name, organizationId }.
  - googleLogin() has three branches: found by googleId; found by email (prisma.user.update links Google);
    neither (creates Organization + prisma.user.create). It stores userData in an in-memory oauthCodes map;
    exchangeOAuthCode() returns that userData. Add onboardingRequired to userData.
- JWT guard puts the user on req.user with req.user.id and req.user.organizationId
  (see users.controller.ts getOrganizationInfo). Use req.user.id — never a body field.
- Prisma access pattern: import { prisma } from '../../../database/prisma.client' (singleton).
- Frontend auth: client/src/lib/auth.tsx AuthProvider.login(user, token) writes localStorage auth_user/auth_token.
  AuthPage.tsx redirects authenticated users; AuthCallbackPage.tsx navigates to '/templates' after Google exchange.
  Both will hit ProtectedRoute on /templates, so ONE redirect in ProtectedRoute covers both signup paths —
  do not add onboarding logic to AuthPage or AuthCallbackPage.
- client/src/App.tsx: ProtectedRoute({ component }) and AppOnlyRoute wrap app routes.
- TemplatesPage.tsx already has tag chips: state activeChips, derived availableChips, toggleChip().

Schema (api/prisma/schema.prisma):
  model User { ... onboardingRequired Boolean @default(false)  profile UserProfile? }
  model UserProfile {
    id                     String    @id @default(cuid())
    userId                 String    @unique
    user                   User      @relation(fields: [userId], references: [id], onDelete: Cascade)
    role                   String
    teamSize               String
    primaryMarket          String
    firstAssetType         String
    acquisitionSource      String?
    acquisitionSourceOther String?
    marketingOptIn         Boolean   @default(false)
    marketingOptInAt       DateTime?
    createdAt              DateTime  @default(now())
    updatedAt              DateTime  @updatedAt
  }
Then: npx prisma generate --schema=api/prisma/schema.prisma

Backend:
1. auth.service.ts: onboardingRequired: true in register() create data and googleLogin() new-user create data
   ONLY. Include onboardingRequired in the user object returned by register(), login(), googleLogin() userData.
2. api/src/modules/users/dto/onboarding.dto.ts (NEW): OnboardingDto per AC3 using class-validator
   (@IsIn([...]), @IsString, @Transform trim + @Length(2,120) for primaryMarket, @IsOptional, @MaxLength(200), @IsBoolean).
   Export the allowed-value arrays as constants.
3. users.service.ts: saveOnboarding(userId, dto) — prisma.$transaction([
     prisma.userProfile.upsert({ where: { userId }, create: {...}, update: {...} }),
     prisma.user.update({ where: { id: userId }, data: { onboardingRequired: false },
       select: { id, email, name, organizationId, onboardingRequired } }) ])
   marketingOptInAt = dto.marketingOptIn ? new Date() : null.
   acquisitionSourceOther = dto.acquisitionSource === 'other' ? dto.acquisitionSourceOther ?? null : null.
   Return { user }.
4. users.controller.ts: @Post('me/onboarding') @UseGuards(AuthGuard('jwt')) @ApiBearerAuth() → saveOnboarding(req.user.id, dto).

Frontend:
5. shared/schema.ts LegacyUser: onboardingRequired?: boolean
6. client/src/lib/onboarding.ts (NEW): ROLE_OPTIONS, TEAM_SIZE_OPTIONS, FIRST_ASSET_OPTIONS, SOURCE_OPTIONS
   ({ value, label }) and FIRST_ASSET_TAG: Record<FirstAssetType, string | null>.
   BEFORE filling tag values, inspect the real template tags (availableChips in TemplatesPage) and pick the
   matching tag for just_listed/open_house/just_sold/market_update. social_post → null.
7. client/src/pages/onboarding/OnboardingPage.tsx (NEW): per AC6/AC7. Use shadcn RadioGroup/ToggleGroup or
   buttons with role="radio"; Input; Select; Checkbox (unchecked by default). POST with Authorization Bearer token.
   On 200: login(res.user, token) then navigate(FIRST_ASSET_TAG[x] ? `/templates?tag=${encodeURIComponent(tag)}` : '/templates').
   On error: inline error + "Try again"; keep form values.
8. App.tsx:
   - ProtectedRoute: after isLoading/isAuthenticated checks, if user?.onboardingRequired === true → <Redirect to="/onboarding" />.
   - Add <Route path="/onboarding" .../> wrapped in AppOnlyRoute; it must require auth (redirect to /auth if not)
     but must NOT use the onboarding redirect (no loop); if onboardingRequired !== true → <Redirect to="/templates" />.
9. TemplatesPage.tsx: on mount read `tag` from useSearch(); once availableChips is non-empty, if it contains
   the tag and no chip is active yet, setActiveChips([tag]) — once only.

Tests: api/tests/users/onboarding.spec.ts covering AC10 (a)–(f). vi.mock the prisma singleton (use vi.hoisted —
see api/tests/payments/renewal-reminder.spec.ts for the pattern); $transaction mock should run the array.

Out of Scope — do NOT:
- build Screen 2 / brand kit (US-LAUNCH-017)
- use role/market in AI prompts
- sync consent/attribution to any external tool
- add a Skip button, show answers on /account, or onboard existing/invited users
- touch US-LAUNCH-014 email-verification code
- touch files outside the Primary files list

Rules:
- Run npx prisma generate after schema change
- npm run check && npm run test:unit before declaring done
- When done: list files changed, ACs checked ✅, test output
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-LAUNCH-016-01 | Auto (unit) | P0 | Given a valid OnboardingDto, when saveOnboarding(userId) runs, then userProfile.upsert uses where.userId = the authenticated id and user.update sets onboardingRequired=false | 🔲 | |
| TC-LAUNCH-016-02 | Auto (unit) | P0 | Given register() for a new email, when prisma.user.create is called, then its data includes onboardingRequired: true | 🔲 | |
| TC-LAUNCH-016-03 | Auto (unit) | P0 | Given googleLogin() where neither googleId nor email matches, then prisma.user.create data includes onboardingRequired: true; given email matches, then prisma.user.update data has no onboardingRequired key | 🔲 | |
| TC-LAUNCH-016-04 | Auto (unit) | P1 | Given marketingOptIn true / false, then marketingOptInAt is a Date / null | 🔲 | |
| TC-LAUNCH-016-05 | Auto (unit) | P1 | Given role 'ceo' or missing primaryMarket, when the DTO is validated, then validation errors are returned | 🔲 | |
| TC-LAUNCH-016-06 | Auto (unit) | P2 | Given acquisitionSource 'google_search' with acquisitionSourceOther 'x', then persisted acquisitionSourceOther is null | 🔲 | |
| TC-LAUNCH-016-07 | Manual | P0 | Given a fresh email/password registration on localhost, when registration completes, then the browser lands on /onboarding (not /templates) | 🔲 | |
| TC-LAUNCH-016-08 | Manual | P0 | Given a fresh Google sign-in with an email never used before, when the callback completes, then the browser lands on /onboarding | 🔲 | |
| TC-LAUNCH-016-09 | Manual | P0 | Given an existing account created before this story, when it logs in, then it lands on /templates and never sees /onboarding | 🔲 | |
| TC-LAUNCH-016-10 | Manual | P0 | Given Screen 1 completed with "Open House", when Continue succeeds, then /templates opens with the matching chip active, and reloading /onboarding redirects to /templates | 🔲 | |
| TC-LAUNCH-016-11 | Manual | P1 | Given the API is stopped, when Continue is clicked, then an inline error with "Try again" shows and the form values remain | 🔲 | |
| TC-LAUNCH-016-12 | Manual | P1 | Given a logged-in user with onboardingRequired=true, when /editor or /account is opened directly, then they are redirected to /onboarding | 🔲 | |
| TC-LAUNCH-016-13 | Manual | P1 | Security: given a POST to /users/me/onboarding with no JWT → 401; with body { userId: '<other user>' } → only the JWT user's profile is written | 🔲 | |
| TC-LAUNCH-016-14 | Manual | P2 | Given 375px and 1440px widths, then OnboardingPage has no horizontal overflow and option groups work via keyboard | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [ ] All ACs checked ✅
- [ ] All test cases run and recorded
- [ ] `npm run check` passes (0 new TypeScript errors)
- [ ] `npm run test:unit` passes (no regressions)
- [ ] `npx prisma generate --schema=api/prisma/schema.prisma` run; `prisma db push` applied to staging before deploy
- [ ] Manual flow verified (TC-LAUNCH-016-07, -08, -09, -10 minimum)
- [ ] PR merged (PR #_____)
- [ ] [TASKS.md](./TASKS.md) task list fully checked

---

*Story created: 2026-09-14*
