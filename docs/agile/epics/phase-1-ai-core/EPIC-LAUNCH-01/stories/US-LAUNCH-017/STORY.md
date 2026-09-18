# Story Card — US-LAUNCH-017

> **Status:** 🔲 Not Started
> **Priority:** Backlog — should-have, not launch-blocking. Does NOT gate the M-LAUNCH-01 Acceptance checklist.
> **Feature:** F-LAUNCH-08 — Signup Onboarding
> **Epic:** [EPIC-LAUNCH-01](../../EPIC.md)
> **Milestone:** [M-LAUNCH-01-public-beta](../../milestones/M-LAUNCH-01-public-beta.md)
> **Size:** M (4–7 h)
> **Depends on:** [US-LAUNCH-016](../US-LAUNCH-016/STORY.md) merged (`UserProfile` model, `/onboarding` route, Screen 1 hand-off). US-INFRA-001 `StorageService` (R2) — already Done.
> **Related:** Delivers the persistence half of US-AI-028 ("Agent profile persistence", Phase 3 stub with no real ACs) — review that stub for supersession at closeout. Gives US-EDIT-007 the `headshotUrl` field it noted was missing; placing the headshot on canvas remains US-EDIT-007's job. Org-level brand sync stays B-07.
> **Note:** Adds columns to `UserProfile` — run `npx prisma generate --schema=api/prisma/schema.prisma` after the schema change.
> **Linear:** LIN-XXX
> **Created:** 2026-09-14 | **Closed:** —

---

## Story

*As a* newly signed-up agent who has just finished the onboarding profile screen
*I want* an optional "Set up your brand kit" step where I upload my logo (colors are pulled from it automatically) and enter my brokerage, headshot, phone, license number, Equal Housing preference and the channels I post on — saved to my account
*So that* my first generated designs already carry my branding, and I never retype agent details on a new device or after a reload.

---

## Acceptance Criteria

- [ ] **AC1 — Schema.** `UserProfile` gains: `brokerageName String?`, `phone String?`, `licenseNumber String?`, `logoUrl String?`, `headshotUrl String?`, `brandColors String[] @default([])`, `equalHousing Boolean @default(false)`, `channels String[] @default([])`, `brandKitCompletedAt DateTime?`. No change to `Organization.brandColors` / `Organization.logoUrl` (org-level brand sync is B-07).

- [ ] **AC2 — Asset upload endpoint.** `POST /api/v1/users/me/brand-assets` (guarded by `AuthGuard('jwt')`; 401 without JWT), `multipart/form-data` with field `file` and field `kind` ∈ `logo | headshot`:
  - accepts only `image/png`, `image/jpeg`, `image/webp` up to **5 MB** (`ParseFilePipe` with `MaxFileSizeValidator` + `FileTypeValidator`, mirroring `infographics.controller.ts` `uploadPhoto`); anything else — including `image/svg+xml` — returns HTTP 400
  - an invalid or missing `kind` returns HTTP 400
  - uploads via `StorageService.upload(buffer, key, mimetype)` with key `brand-assets/{req.user.id}/{kind}-{randomUUID()}.{ext}` and returns HTTP 201 `{ url }`
  - if `StorageService.upload` throws (e.g. R2 not configured), returns HTTP 503 `{ message: 'Upload is temporarily unavailable' }` and logs the error with the key — it never returns 500 with the raw storage error

- [ ] **AC3 — Save / read endpoints.** `PUT /api/v1/users/me/brand-kit` (JWT-guarded) accepts `BrandKitDto`, all fields optional:
  - `brokerageName` ≤ 120 chars · `phone` ≤ 30 chars, matching `/^[0-9+()\-.\s]*$/` · `licenseNumber` ≤ 60 chars
  - `logoUrl`, `headshotUrl` — each either `null` or a string starting with `StorageService.getPublicUrl('brand-assets/' + req.user.id + '/')`; any other URL (another user's prefix, external host) → HTTP 400
  - `brandColors` — array of ≤ 5 strings matching `/^#[0-9a-fA-F]{6}$/`
  - `equalHousing` — boolean · `channels` — array, each ∈ `instagram | facebook | linkedin | email | print`, no duplicates
  On success it updates the `UserProfile` of `req.user.id`, sets `brandKitCompletedAt = new Date()`, and returns HTTP 200 with the saved brand-kit fields. If the user has no `UserProfile` row, returns HTTP 409 `{ message: 'Complete onboarding first' }`.
  `GET /api/v1/users/me/brand-kit` (JWT-guarded) returns the same field set (nulls / empty arrays when unset), or all-empty values if no profile exists. The user id is taken only from `req.user.id`.

- [ ] **AC4 — Screen 2 UI.** `client/src/pages/onboarding/BrandKitPage.tsx` at route `/onboarding/brand-kit` (app-only, auth-required, not behind the onboarding redirect) shows the title "Set up your brand kit" and:
  - **Logo** upload (click or drop). On file select, before uploading, dominant colors are extracted client-side from the local file (object URL → offscreen `<canvas>` → `extractBrandColors()` in `client/src/lib/brandColors.ts`), returning 1–3 hex colors that ignore near-white (all channels ≥ 240), near-black (all ≤ 15) and fully transparent pixels. The colors show as swatches, each removable; **no color picker** is rendered. The file is then uploaded (kind `logo`).
  - **Headshot** upload (kind `headshot`), with a circular preview
  - text inputs **Brokerage name**, **Phone**, **License #**
  - a switch **"Add Equal Housing Opportunity logo to my designs"** (off by default)
  - multi-select chips **Where do you post?** Instagram / Facebook / LinkedIn / Email / Print
  - buttons **Save and continue** and **Skip for now**
  If an upload returns 503 or fails, an inline message "Upload unavailable — you can add this later" shows next to that field, and Save still works for the other fields.

- [ ] **AC5 — Flow.** US-LAUNCH-016's Screen 1 hand-off changes to navigate to `/onboarding/brand-kit?next=<the /templates URL it previously navigated to>`. On this page, **Skip for now** navigates to `next` without any API call. **Save and continue** calls `PUT /users/me/brand-kit`; on 200 it hydrates the agent store (AC6) and navigates to `next`; on error it shows an inline error and stays. `next` is only honoured when it starts with `/templates`; anything else falls back to `/templates` (no open redirect).

- [ ] **AC6 — Generation picks it up.** A `useBrandKitHydration()` hook, mounted once inside `AuthProvider` in `App.tsx`, calls `GET /users/me/brand-kit` when the user becomes authenticated and calls `useAgentStore.getState().setAgent()` for each of `brokerage ← brokerageName`, `phone`, `license ← licenseNumber`, `brandColors`, `logoPreview ← logoUrl`, `name ← user.name`, `email ← user.email` **only where the current store value is empty** (`''`, `null` or `[]`), so edits made in the editor this session are not overwritten. Because `AIChatBox.tsx` (`agentInfo`) and `RightSidebar.tsx` (`useAgentStore.getState().agent`) already read this store, a new generation after hydration sends the saved `brandColors` without any change to those files. A failed GET is swallowed (logged to console in dev only) and the app renders normally.

- [ ] **AC7 — No cross-user leak.** `AuthProvider.logout()` in `client/src/lib/auth.tsx` calls `useAgentStore.getState().resetAgent()` alongside the existing `clearCanvas()`. Given User A (with a brand kit) logs out and User B logs in within the same tab, User B's agent store contains none of User A's values (the PT-07 class of bug).

- [ ] **AC8 — Layout.** `BrandKitPage` has no horizontal overflow at 375px and 1440px; upload areas, switch and chips are keyboard-operable.

- [ ] **AC9 — Tests.**
  `api/tests/users/brand-kit.spec.ts` (mock-based) covers: (a) valid DTO → `userProfile.update` with `where: { userId }` and `brandKitCompletedAt` a Date; (b) `logoUrl` with another user's prefix → `BadRequestException`, no update; (c) `brandColors: ['red']` and `channels: ['tiktok']` fail DTO validation; (d) no profile row → 409 `ConflictException`; (e) upload with `StorageService.upload` rejecting → 503 `ServiceUnavailableException`, and on success the key matches `^brand-assets/{userId}/logo-[0-9a-f-]{36}\.png$`.
  `client/src/lib/brandColors.test.ts` **(TBC — only if a client vitest config exists; otherwise move these cases into a pure-function test under `api/tests/` importing via `@shared` or document as manual)** covers `extractBrandColors()` on a synthetic pixel array: returns the dominant non-white color as `#rrggbb`, ignores transparent/white/black, returns ≤ 3 colors.

---

## Out of Scope

- **Rendering** the Equal Housing logo, license number or headshot **onto generated/composed designs** — stored only. Canvas placement is US-EDIT-007 / brand-layer work (M-EDIT-02); the Equal Housing mark needs its own asset + placement story.
- **Using `channels` to preselect sizes** in `FormatPickerDialog` — stored only; follow-up story.
- **A way back to the brand kit after skipping** (Account → Brand kit page, or the "prompt on first export" nudge) — follow-up story; the data model and endpoints here are what it will reuse.
- **Organization-level brand kit** (`Organization.brandColors` / `logoUrl`, team inheritance) — B-07.
- **Deleting old uploads from R2** — `StorageService` has no `delete()` by design (token scope); replaced assets are orphaned.
- **Image cropping, background removal or resizing** of logo/headshot.
- **SVG logos** — rejected (public-bucket XSS risk); raster only.
- **Role/market-aware prompts** — US-AI-029 / US-AI-027.

---

## Engineering / PR

- **Branch:** `feat/launch/us-launch-017-onboarding-brand-kit`
- **PR:** #_____ (fill when opened)
- **Primary files touched:**
  - `api/prisma/schema.prisma` — brand-kit columns on `UserProfile`
  - `api/src/modules/users/dto/brand-kit.dto.ts` — NEW
  - `api/src/modules/users/users.controller.ts` — `POST me/brand-assets`, `PUT me/brand-kit`, `GET me/brand-kit`
  - `api/src/modules/users/users.service.ts` — `getBrandKit`, `saveBrandKit`, `uploadBrandAsset`
  - `api/src/modules/users/users.module.ts` — import `StorageModule` **(TBC — check whether it is `@Global()`)**
  - `client/src/lib/brandColors.ts` — NEW: `extractBrandColors(pixels: Uint8ClampedArray, max = 3): string[]`
  - `client/src/pages/onboarding/BrandKitPage.tsx` — NEW
  - `client/src/pages/onboarding/OnboardingPage.tsx` — hand-off goes via `/onboarding/brand-kit?next=`
  - `client/src/hooks/useBrandKitHydration.ts` — NEW
  - `client/src/lib/auth.tsx` — `resetAgent()` on logout
  - `client/src/App.tsx` — `/onboarding/brand-kit` route; mount hydration hook
  - `api/tests/users/brand-kit.spec.ts` — NEW

---

## AI Implementation Prompt

> Copy this block into Claude Code to implement the story.

```
Context: Buildographic (code name InfographicAI) — NestJS API (port 3001) + React frontend (port 5000 via Express proxy).
Stack: React 18 + Vite, NestJS 11, Prisma 6, Tailwind v3 + shadcn/ui, Wouter, Zustand + React Query. See CLAUDE.md.

Story: US-LAUNCH-017 — Onboarding Screen 2: optional brand kit, persisted and fed into generation.
PREREQUISITE: US-LAUNCH-016 is merged (UserProfile model, /onboarding page, users/me/onboarding endpoint).

Verified facts (2026-09-14):
- StorageService (api/src/modules/storage/services/storage.service.ts): upload(buffer, key, contentType) → public URL,
  re-throws on failure; getPublicUrl(key) = R2_PUBLIC_URL (trailing slash stripped) + '/' + key. Lazy S3 client —
  throws a named error if R2 env vars are missing.
- Upload pattern to mirror: infographics.controller.ts uploadPhoto — FileInterceptor + ParseFilePipe
  (MaxFileSizeValidator, FileTypeValidator), randomUUID keys.
- Client agent store: client/src/hooks/useAgentStore.ts — Zustand, NOT persisted, fields
  { name, phone, email, brokerage, website, license, brandColors: string[], logoPreview: string|null },
  setAgent(patch), resetAgent(). Consumers: AIChatBox.tsx (const agentInfo = useAgentStore(s => s.agent), uses
  agentInfo.brandColors when building the generation request) and RightSidebar.tsx (useAgentStore.getState().agent).
  AgentInfoForm.tsx edits it. So hydrating this store is how saved brand data reaches generation.
- auth.tsx logout() clears queryClient, localStorage, clearUserStorage(), clearCanvas() — but NOT the agent store.
- JWT guard: req.user.id.

Schema: add to UserProfile
  brokerageName String?  phone String?  licenseNumber String?  logoUrl String?  headshotUrl String?
  brandColors String[] @default([])  equalHousing Boolean @default(false)  channels String[] @default([])
  brandKitCompletedAt DateTime?
Then npx prisma generate --schema=api/prisma/schema.prisma

Backend:
1. brand-kit.dto.ts per AC3 (class-validator: @IsOptional, @MaxLength, @Matches, @IsArray, @ArrayMaxSize(5),
   @Matches(/^#[0-9a-fA-F]{6}$/, { each: true }), @IsIn([...], { each: true }), @ArrayUnique, @IsBoolean).
   logoUrl/headshotUrl: @IsOptional @IsString — prefix check is done in the service (needs req.user.id).
2. users.service.ts:
   - uploadBrandAsset(userId, kind, file): key = `brand-assets/${userId}/${kind}-${randomUUID()}.${ext}`
     (ext from mimetype: png|jpg|webp); try storage.upload; catch → log + throw ServiceUnavailableException('Upload is temporarily unavailable').
   - saveBrandKit(userId, dto): prefix = storage.getPublicUrl(`brand-assets/${userId}/`); reject logoUrl/headshotUrl
     that are non-null and don't start with prefix (BadRequestException). findUnique profile → none → ConflictException('Complete onboarding first').
     update with dto fields + brandKitCompletedAt: new Date(). Return brand-kit field set.
   - getBrandKit(userId): select brand-kit fields; defaults when no row.
3. users.controller.ts: POST me/brand-assets (FileInterceptor('file'), 5MB, /image\/(png|jpeg|webp)/, @Body('kind') validated ∈ logo|headshot),
   PUT me/brand-kit, GET me/brand-kit — all @UseGuards(AuthGuard('jwt')).
   Declare static 'me/...' routes so they do not collide with 'organization/members/:userId'.
4. users.module.ts: make StorageService injectable (import StorageModule unless it is @Global).

Frontend:
5. client/src/lib/brandColors.ts: pure extractBrandColors(pixels, max=3): skip alpha<128, all-channels>=240, all<=15;
   quantize each channel to 32 buckets, count, sort desc, merge colors within distance ~40, return top `max` as #rrggbb.
   Plus a small async helper fileToPixels(file) using an object URL + offscreen canvas scaled to ≤100px.
6. BrandKitPage.tsx per AC4/AC5. Extract colors from the LOCAL file first (no CORS), then upload.
   `next` param: use only if it startsWith('/templates'), else '/templates'.
7. OnboardingPage.tsx: change success navigation to `/onboarding/brand-kit?next=${encodeURIComponent(previousTarget)}`.
8. useBrandKitHydration.ts: when isAuthenticated && token, fetch GET brand-kit once per user id; setAgent only for empty fields (AC6).
   Mount it in App.tsx inside AuthProvider (e.g. a tiny <BrandKitHydrator /> component rendering null).
9. auth.tsx logout(): add useAgentStore.getState().resetAgent().
10. App.tsx: <Route path="/onboarding/brand-kit"> BEFORE "/onboarding" (Wouter Switch matches in order), app-only + auth-required.

Tests: api/tests/users/brand-kit.spec.ts — AC9 (a)–(e). Mock prisma singleton with vi.hoisted and StorageService with vi.fn().

Out of Scope — do NOT:
- render Equal Housing logo / license / headshot onto designs; use channels for format defaults
- add an Account-page brand kit or export-time prompt
- touch Organization.brandColors/logoUrl
- add delete() to StorageService, image cropping, SVG support
- modify AIChatBox.tsx, RightSidebar.tsx, AgentInfoForm.tsx or useAgentStore.ts
- touch files outside the Primary files list

Rules: prisma generate after schema change · npm run check && npm run test:unit · report files, ACs ✅, test output.
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-LAUNCH-017-01 | Auto (unit) | P0 | Given a valid BrandKitDto and an existing profile, when saveBrandKit runs, then userProfile.update uses the JWT user id and sets brandKitCompletedAt | 🔲 | |
| TC-LAUNCH-017-02 | Auto (unit) | P0 | Given logoUrl under another user's brand-assets prefix, when saveBrandKit runs, then BadRequestException is thrown and nothing is written | 🔲 | |
| TC-LAUNCH-017-03 | Auto (unit) | P0 | Given StorageService.upload rejects, when uploadBrandAsset runs, then ServiceUnavailableException is thrown (not a raw 500) | 🔲 | |
| TC-LAUNCH-017-04 | Auto (unit) | P1 | Given brandColors ['red'] or channels ['tiktok'], when the DTO is validated, then errors are returned | 🔲 | |
| TC-LAUNCH-017-05 | Auto (unit) | P1 | Given no UserProfile row, when saveBrandKit runs, then ConflictException is thrown | 🔲 | |
| TC-LAUNCH-017-06 | Manual | P0 | Given Screen 1 completed, then /onboarding/brand-kit shows; "Skip for now" lands on the same /templates URL Screen 1 would have used, with no network call | 🔲 | |
| TC-LAUNCH-017-07 | Manual | P0 | Given a PNG logo with a strong brand color on white, when selected, then 1–3 swatches appear, none white/black, and no color picker is shown | 🔲 | |
| TC-LAUNCH-017-08 | Manual | P0 | Given the brand kit saved, when a new AI generation is started, then the request payload's agent.brandColors equals the saved colors (network tab) | 🔲 | |
| TC-LAUNCH-017-09 | Manual | P0 | Given User A with a brand kit logs out and User B logs in in the same tab, then the Agent Info form shows none of A's values | 🔲 | |
| TC-LAUNCH-017-10 | Manual | P1 | Given R2 env vars unset locally, when a logo is uploaded, then "Upload unavailable — you can add this later" shows and Save still persists the text fields | 🔲 | |
| TC-LAUNCH-017-11 | Manual | P1 | Given a reload or a second device, when the editor opens, then brokerage/phone/license/colors are pre-filled; a value typed in AgentInfoForm this session is not overwritten | 🔲 | |
| TC-LAUNCH-017-12 | Manual | P1 | Security: SVG upload → 400; 6 MB PNG → 400; `?next=https://evil.example` → lands on /templates | 🔲 | |
| TC-LAUNCH-017-13 | Manual | P2 | 375px / 1440px — no horizontal overflow; upload, switch, chips keyboard-operable | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [ ] All ACs checked ✅
- [ ] All test cases run and recorded
- [ ] `npm run check` passes (0 new TypeScript errors)
- [ ] `npm run test:unit` passes (no regressions)
- [ ] `npx prisma generate` run; `prisma db push` applied to staging before deploy
- [ ] Manual flow verified on staging with real R2 (TC-LAUNCH-017-06, -07, -08, -09 minimum)
- [ ] US-AI-028 stub reviewed for supersession (note in closeout)
- [ ] PR merged (PR #_____)
- [ ] [TASKS.md](./TASKS.md) task list fully checked

---

*Story created: 2026-09-14*
