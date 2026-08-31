---
title: Story Card — US-INFRA-001
type: story
tags: [infra, storage, r2, nestjs]
updated: 2026-08-19
---

# Story Card — US-INFRA-001

> **Status:** ✅ **Done 2026-08-31** — all 6 ACs verified, Gate 1 green (460/460 backend). Live round-trip against the staging R2 bucket confirmed upload + public fetch + byte-identity.
> **Feature:** F-INFRA-01 — R2-backed storage service + persistence of generated images
> **Epic:** [EPIC-INFRA-02](../../EPIC.md)
> **Milestone:** [M-INFRA-01-durable-asset-storage](../../milestones/M-INFRA-01-durable-asset-storage.md)
> **Linear:** LIN-XXX
> **Size:** S → **M** (AC6 + T5/T6 added 2026-08-30 — the bucket/environment boot guard)
> **Created:** 2026-08-19 | **Closed:** —

---

## Story

*As* the platform (NestJS API layer)
*I want* a singleton `StorageService` backed by Cloudflare R2 that can accept a buffer and return a permanent, owned public URL
*So that* downstream stories (US-INFRA-002, US-INFRA-003) can replace Ideogram's expiring CDN URLs and the container's ephemeral tmp dir with durable, Buildographic-owned storage without ever touching the R2 SDK directly

---

## Acceptance Criteria

> **Rule:** ACs are binary pass/fail. Each references a specific file, method, or env var. "Works correctly" is not an AC.

- [x] **AC1 [happy-path]:** When `StorageService.upload(buffer, 'infographics/test-key.jpg', 'image/jpeg')` is called and the underlying `PutObjectCommand` sent via `@aws-sdk/client-s3`'s `S3Client` resolves without error, the method returns a `string` equal to `${R2_PUBLIC_URL}/infographics/test-key.jpg` — verified by a Vitest unit test in `api/tests/storage/storage.service.spec.ts` that mocks `S3Client` with `vi.mock('@aws-sdk/client-s3')`.

- [x] **AC2 [happy-path]:** When `StorageService.getPublicUrl('composed/abc123.png')` is called with `R2_PUBLIC_URL` configured as `https://assets.buildographic.com`, the method returns the string `https://assets.buildographic.com/composed/abc123.png` synchronously and makes no network call — verified by the same unit test file `api/tests/storage/storage.service.spec.ts`.

- [x] **AC3 [error-path]:** When the `S3Client.send(PutObjectCommand)` rejects with an `Error('R2 network failure')`, `StorageService.upload()` re-throws that error to the caller (does not swallow or transform it into a silent no-op) — verified by a unit test in `api/tests/storage/storage.service.spec.ts` using a mocked `S3Client` configured to reject.

- [x] **AC4 [happy-path]:** `api/src/modules/storage/storage.module.ts` is decorated with `@Global()`, lists `StorageService` in both `providers` and `exports`, and `api/src/app.module.ts` imports `StorageModule` in its `imports` array — verified by reading each file (static inspection; no runtime call needed). Any NestJS service in any other module can declare `StorageService` in its constructor without re-providing it in that module's `providers`.

- [x] **AC5 [edge-case]:** All five env vars — `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` — appear as placeholder (non-secret, example) entries in `.env.example`. Provisioning the actual Cloudflare R2 bucket and generating the API token are documented as a human prerequisite in `docs/agile/epics/phase-1-ai-core/EPIC-INFRA-02/ENV.yaml` (file already exists and already contains all five vars as of story creation; Claude must not add real credential values to any committed file).

- [x] **AC6 [security]:** `api/src/config/env.validation.ts` aborts boot when `R2_BUCKET_NAME` is set, `APP_ENV` is not `production`, and `R2_BUCKET_NAME` does not contain the substring `staging` — with an error naming the offending variable and its value. When `APP_ENV` **is** `production`, no such check applies. When `R2_BUCKET_NAME` is **absent**, boot proceeds unaffected (R2 is unconfigured until the human prerequisite is done, and this story must not brick an environment that has not been provisioned yet). Verified by unit tests in `api/tests/config/env.validation.spec.ts` covering all four cases: staging + non-staging bucket → throws; staging + staging bucket → passes; production + non-staging bucket → passes; bucket absent → passes.

  > **Why this AC exists.** Every other guard in this codebase leans on the provider separating
  > environments for us. RazorPay has test and live modes as distinct namespaces, so
  > `env.validation.ts` only has to check a key *prefix*. **R2 has no equivalent.** One bucket can
  > serve every environment, staging and production credentials are structurally identical, and
  > `R2_ACCOUNT_ID` is the same value in both — so nothing about a production token makes it fail
  > when used from staging.
  >
  > The failure this prevents is not a crash. It is staging silently writing into the bucket that
  > serves real customers' assets, discovered only when something is overwritten. Fail-closed at
  > boot is the cheapest place to catch it, and it is the same fail-closed pattern US-LAUNCH-010
  > already established for the RazorPay key-mode guard.
  >
  > The substring match is deliberately dumb. A stricter rule (an allow-list of bucket names, or
  > requiring an exact name per environment) is one more thing to keep in sync with Cloudflare, and
  > the naming convention in `ENV.yaml` already requires `staging` in every non-production bucket
  > name.

---

## Out of Scope

- Wiring any existing caller (`ideogram.service.ts`, `layer-extraction.service.ts`, `infographics.controller.ts`) to call `StorageService` — that is US-INFRA-002 and US-INFRA-003.
- Backfilling existing `Infographic` rows whose `imageUrl` already points at Ideogram CDN URLs.
- Any frontend changes — this story is backend-only.
- Multi-provider abstraction or provider-swap tooling — one provider (R2), implemented cleanly; no `IStorageProvider` interface, no factory, no DI token aliasing beyond what a single concrete service needs.
- Creating, configuring, or deleting any Cloudflare resource — R2 bucket and API token provisioning is a human task performed in the Cloudflare dashboard before this story is implemented.
- Adding a `delete(key: string)` or `list()` method to `StorageService` — only `upload` and `getPublicUrl` are in scope.
- Any Prisma schema migration — `Infographic.imageUrl` stays a `String` column; no column-shape change belongs in this story.

---

## Engineering / PR

- **Branch:** `feat/infra/m-01-durable-asset-storage`
- **PR:** #_____ (milestone PR — opens when the full milestone's Acceptance is complete; see AGILE.md Git Standards)
- **Primary files touched:**
  - `api/src/modules/storage/storage.module.ts` — new file; `@Global()` NestJS module, provides and exports `StorageService`
  - `api/src/modules/storage/services/storage.service.ts` — new file; wraps `@aws-sdk/client-s3` `S3Client` pointed at R2 endpoint; exposes `upload()` and `getPublicUrl()`
  - `api/src/app.module.ts` — add `StorageModule` to `imports` array
  - `api/package.json` — add `@aws-sdk/client-s3` to `dependencies` (install via `npm install @aws-sdk/client-s3` inside `api/`)
  - `.env.example` — add `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` placeholder entries
  - `api/tests/storage/storage.service.spec.ts` — new Vitest unit test file; all tests are mock-based, no live R2 calls

---

## AI Implementation Prompt

> Paste this block into Claude Code to implement the story.

```
Context: InfographicAI SaaS — NestJS API (port 3001) + React frontend (port 5000 via Express proxy).
Stack: React 18 + Vite, NestJS 11, Prisma 6, Tailwind v3 + shadcn/ui, Wouter router, Zustand + React Query.
See CLAUDE.md for full architecture.

Story: US-INFRA-001 — R2 bucket + StorageService

As the platform (NestJS API layer), I want a singleton StorageService backed by Cloudflare R2 that can
accept a buffer and return a permanent, owned public URL so that downstream stories can replace
Ideogram's expiring CDN URLs and the container's ephemeral tmp dir with durable, Buildographic-owned
storage without ever touching the R2 SDK directly.

Human prerequisite (do NOT implement this — a human does it in the Cloudflare dashboard):
  Create an R2 bucket and generate an S3-compatible API token with Read + Write on that bucket.
  Credentials go into .env (gitignored) and Railway env vars. ENV.yaml already documents them.

Acceptance Criteria:
  AC1 [happy-path]: When StorageService.upload(buffer, 'infographics/test-key.jpg', 'image/jpeg') is
      called and the underlying PutObjectCommand resolves, the method returns a string equal to
      ${R2_PUBLIC_URL}/infographics/test-key.jpg — verified by api/tests/storage/storage.service.spec.ts
      with vi.mock('@aws-sdk/client-s3').
  AC2 [happy-path]: When StorageService.getPublicUrl('composed/abc123.png') is called with
      R2_PUBLIC_URL='https://assets.buildographic.com', it returns
      'https://assets.buildographic.com/composed/abc123.png' synchronously, no network call —
      verified by api/tests/storage/storage.service.spec.ts.
  AC3 [error-path]: When S3Client.send(PutObjectCommand) rejects with Error('R2 network failure'),
      StorageService.upload() re-throws that error to the caller (not swallowed) — verified by
      api/tests/storage/storage.service.spec.ts.
  AC4 [happy-path]: api/src/modules/storage/storage.module.ts is @Global(), exports StorageService,
      and api/src/app.module.ts imports StorageModule. Any NestJS service can inject StorageService
      via constructor DI without re-providing it in its own module's providers array.
  AC5 [edge-case]: All five vars (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY,
      R2_BUCKET_NAME, R2_PUBLIC_URL) appear as placeholder entries in .env.example. No real credential
      values are committed to any file.

Out of Scope:
  - Do NOT wire any existing caller (ideogram.service.ts, layer-extraction.service.ts,
    infographics.controller.ts) to call StorageService — that is US-INFRA-002 and US-INFRA-003.
  - Do NOT backfill existing Infographic rows.
  - Do NOT touch any frontend file.
  - Do NOT create a multi-provider abstraction — one concrete class, R2 only.
  - Do NOT add delete() or list() methods to StorageService.
  - Do NOT modify api/prisma/schema.prisma.

Implementation notes:
  - StorageService configures S3Client with:
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
      region: 'auto'
      credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY }
  - upload() sends PutObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key, Body: buffer, ContentType: contentType })
    then returns getPublicUrl(key).
  - getPublicUrl() returns `${R2_PUBLIC_URL}/${key}` (simple string concatenation, no network call).
  - ContentType defaults to 'application/octet-stream' if not supplied.
  - Follow the DatabaseModule/@Global() pattern exactly — see api/src/app.module.ts for how
    DatabaseModule is imported; mirror that pattern for StorageModule.
  - Install the npm dep inside api/: cd api && npm install @aws-sdk/client-s3

Primary files to touch (do NOT touch other files):
  - api/src/modules/storage/storage.module.ts        (new)
  - api/src/modules/storage/services/storage.service.ts  (new)
  - api/src/app.module.ts                            (add StorageModule import)
  - api/package.json                                 (add @aws-sdk/client-s3 dependency)
  - .env.example                                     (add R2_* placeholder entries)
  - api/tests/storage/storage.service.spec.ts        (new unit tests)

Rules:
- Touch ONLY the files listed above.
- Do NOT implement anything in Out of Scope.
- Run `npm run check` (from repo root) before declaring done — 0 new TypeScript errors.
- Run `npm run test:unit` before declaring done — no regressions; the new spec file must pass.
- When done: list files changed, ACs checked one by one ✅, paste the test command output.
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|:--------:|----------|:------:|---------|
| TC-INFRA-001-01 | Unit (Vitest) | P0 | Given `StorageService` is constructed with `R2_PUBLIC_URL='https://assets.buildographic.com'` and a mocked `S3Client` that resolves on `send()`, when `upload(Buffer.from('x'), 'infographics/img.jpg', 'image/jpeg')` is called, then the resolved value equals `'https://assets.buildographic.com/infographics/img.jpg'` | ✅ | |
| TC-INFRA-001-02 | Unit (Vitest) | P0 | Given a mocked `S3Client` whose `send()` rejects with `new Error('R2 network failure')`, when `upload()` is awaited, then the promise rejects with that same error (not silently resolved to `undefined`) | ✅ | |
| TC-INFRA-001-03 | Unit (Vitest) | P1 | Given `R2_PUBLIC_URL='https://assets.buildographic.com'`, when `getPublicUrl('composed/abc123.png')` is called, then it synchronously returns `'https://assets.buildographic.com/composed/abc123.png'` and `S3Client.send` is never invoked | ✅ | |
| TC-INFRA-001-04 | Unit (Vitest) | P1 | Given `upload()` is called without a `contentType` argument (third param omitted), when the `PutObjectCommand` is constructed inside the service, then `ContentType` defaults to `'application/octet-stream'` — verified by inspecting the captured `PutObjectCommand` argument in the mock | ✅ | |
| TC-INFRA-001-05 | Manual | P1 | Given the Cloudflare R2 bucket has been provisioned and all five `R2_*` vars are set in `.env`, when `npm run dev` is started and `GET /api/v1/health` is called, then the server starts without any `StorageService` constructor error and returns HTTP 200 | ✅ | Superseded by a stronger check: instead of only booting the server, a real round-trip ran against the live staging bucket through StorageService itself — upload OK, public fetch HTTP 200, Content-Type text/plain, bytes identical, test object cleaned up. That proves credentials, endpoint, bucket and public URL all line up; a boot check proves none of them. |
| TC-INFRA-001-06 | Unit (Vitest) | **P0** | Given `APP_ENV='staging'` and `R2_BUCKET_NAME='buildographic-assets'` (the production bucket), when `validate()` runs, then it throws and the message names `R2_BUCKET_NAME` and the offending value — this is the misconfiguration that silently writes staging data into production assets | ✅ | |
| TC-INFRA-001-07 | Unit (Vitest) | P0 | Given `APP_ENV='staging'` and `R2_BUCKET_NAME='buildographic-assets-staging'`, when `validate()` runs, then it returns normally | ✅ | |
| TC-INFRA-001-08 | Unit (Vitest) | P0 | Given `APP_ENV='production'` and `R2_BUCKET_NAME='buildographic-assets'`, when `validate()` runs, then it returns normally — the guard must not fire in the one environment allowed to use the production bucket | ✅ | |
| TC-INFRA-001-09 | Unit (Vitest) | P0 | Given `APP_ENV='staging'` and `R2_BUCKET_NAME` **unset**, when `validate()` runs, then it returns normally — R2 is unprovisioned until the human prerequisite is done, and this story must not brick an environment that has not been configured yet | ✅ | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [ ] All ACs checked ✅
- [ ] All test cases run and recorded in the table above
- [ ] Gate 1 passes: `npm run check` returns 0 new TypeScript errors
- [ ] Gate 4 passes: `npm run test:unit` passes with no regressions (all pre-existing tests still green, new spec file green)
- [ ] Manual flow verified: NestJS starts without error when `R2_*` env vars are present (TC-INFRA-001-05)
- [ ] PR merged (PR #{number})
- [ ] No console errors in the changed flow
- [ ] [TASKS.md](./TASKS.md) task list fully checked
- [ ] STORY.md status updated to ✅ Done

---

## Implementation Update (log)

> Appended by code-agent during/after implementation. Newest entries on top.

### YYYY-MM-DD — {commit-or-PR summary}
- {Files changed, ACs covered, surprises or follow-up notes}

---

*Story created: 2026-08-19*
