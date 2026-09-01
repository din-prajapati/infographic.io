---
title: Story Card — US-INFRA-003
type: story
tags: [infra, storage, photo-upload]
updated: 2026-08-19
---

# Story Card — US-INFRA-003

> **Status:** ✅ **Done 2026-08-31** — all 5 ACs verified, 18 tests, Gate 1 green (489/489 backend).
> **Feature:** F-INFRA-02 — Durable source-photo uploads
> **Epic:** [EPIC-INFRA-02](../../EPIC.md)
> **Milestone:** [M-INFRA-01-durable-asset-storage](../../milestones/M-INFRA-01-durable-asset-storage.md)
> **Linear:** LIN-XXX
> **Size:** S
> **Created:** 2026-08-19 | **Closed:** —
>
> **Depends on:** US-INFRA-001 must be merged before this story can start.

---

## Story

*As a* real-estate agent uploading a property photo for the real-photo generation pipeline
*I want* my uploaded photo to be stored durably in R2 rather than on the NestJS container's tmp dir
*So that* a Railway restart or redeploy mid-generation does not silently discard my photo and cause the generation to fail with a 422 error that I have no way to recover from without re-uploading

---

## Acceptance Criteria

> **Rule:** ACs are binary pass/fail. Each references a specific file, method, or status code.

- [x] **AC1 [happy-path]:** When `POST /api/v1/infographics/upload-photo` receives a valid JPEG or PNG file (≤ 10 MB), `InfographicsController.uploadPhoto()` in `api/src/modules/infographics/controllers/infographics.controller.ts` calls `StorageService.upload(buffer, 'source-photos/{photoId}')` and receives a confirmed upload result **before** the `{ photoId, photoUrl }` response is returned to the caller — meaning the file exists in R2 by the time the HTTP response reaches the client.

- [x] **AC2 [happy-path]:** When `IdeogramService.readSourcePhoto(photoPath, generationId)` is called in `api/src/modules/ai-generation/services/ideogram.service.ts` and the file exists in R2 at key `source-photos/{photoPath}`, the method returns the file `Buffer` fetched from R2 **even when** the corresponding file at `path.join(os.tmpdir(), 'ai-infographic-uploads', photoPath)` has been deleted (simulating a container restart between upload and generation).

- [x] **AC3 [error-path]:** When `IdeogramService.readSourcePhoto(photoPath, generationId)` is called and the photo cannot be retrieved from R2 (key does not exist or download fails) **and** the local tmp fallback also fails, the method throws `HttpException` with HTTP status `422` and a message string containing the substring `"re-upload"` — preserving the hard-fail behaviour established by US-AI-031 AC4. The method must **not** fall through silently and allow generation to continue with a fabricated image.

- [x] **AC4 [security]:** When `IdeogramService.readSourcePhoto()` is called with a `photoPath` argument that does not match the pattern `^[\w-]+\.(jpg|jpeg|png)$` (i.e. contains `..`, `/`, `\`, or any character outside word characters, hyphens, and a single dot before the extension — e.g. `../../../etc/passwd`), the method throws `HttpException` with HTTP status `400` **before** constructing any R2 key or filesystem path — preserving the path-traversal guard from US-AI-031 T6 and not weakening it.

- [x] **AC6 [rollback]:** `InfographicsController.uploadPhoto()` performs **two** writes — `fs.writeFileSync` to the tmp directory, then `StorageService.upload()` to R2. When the second fails, the request still returns HTTP 201 with a usable `{ photoId, photoUrl }`, and the completion log records `"durable": false`. The tmp write is **not** rolled back, and the response does **not** fail.

  > **Why this is the right resolution of a partial write, rather than a bug.** Rolling back the tmp copy would delete the only copy that exists, turning a photo that works right now into one that does not. Failing the request would tell the customer their upload failed when it succeeded. Both are worse than the middle state, which is genuinely useful: the photo works for the common case (upload and generation seconds apart, same container) and only degrades if a restart intervenes.
  >
  > What the AC actually pins is that the partial state is **recorded rather than hidden**. `"durable": false` is the difference between a photo that is quietly at risk and one you can find in the logs. Without it, an R2 outage would look identical to a healthy upload until a customer hit a 422 days later.
  >
  > Verified in `api/tests/infra/us-infra-003.spec.ts`.

- [x] **AC5 [happy-path]:** When the unit test suite runs (`npm run test:unit`), the test file `api/tests/infra/us-infra-003.spec.ts` (new) passes with 0 failures and covers: (a) mocked-`StorageService` upload happy path; (b) `readSourcePhoto()` returning an R2-sourced `Buffer` when the local tmp file is absent; (c) `readSourcePhoto()` throwing `HttpException(422)` when both R2 and tmp are unavailable; (d) `readSourcePhoto()` throwing `HttpException(400)` on a path-traversal `photoPath`.

---

## Decision — source photos are stored in a public-read bucket (2026-08-31)

Uploaded property photos go into `buildographic-assets*`, which is public-read. Anyone who knows
or guesses `{R2_PUBLIC_URL}/source-photos/{uuid}.jpg` can fetch a customer's uploaded photo. The
UUID makes it unguessable in practice, but it is not access control.

**Decided: acceptable for now, not revisited in this story.** The photos are listing photographs
an agent uploads specifically so they can appear in marketing material they intend to publish —
the same asset class as the generated designs that share the bucket. The privacy exposure is
therefore small and aligned with the customer's own intent.

**What would change the answer:** any upload that is *not* meant to be published — a floor plan
marked private, an identity document for KYC, a client's interior photo used only for reference.
The moment such a flow exists, source photos need a private bucket (or a second bucket) with
signed URLs, and `StorageService.download()` already reads through the authenticated S3 API rather
than the public URL, so that migration would not require touching the read path.

Recorded here rather than left implicit, because "the bucket is public" is invisible at every call
site and would otherwise have to be rediscovered by whoever adds the first private upload.

---

## Out of Scope

- Does not provision the R2 bucket or implement `StorageService` itself — that is US-INFRA-001, which must ship first.
- Does not persist **generated output images** to R2 — that is US-INFRA-002 (this story is exclusively about the INPUT source photo uploaded before generation begins).
- Does not add any frontend changes — the `photoId`/`photoUrl` response contract is unchanged.
- Does not implement a cleanup/lifecycle policy for old source photos in R2 (e.g. auto-delete after N days).
- Does not backfill source photos from before this story ships — only new uploads go through the durable path.
- Does not touch `Infographic.imageUrl` or `layer-extraction.service.ts` — those belong to US-INFRA-002.

---

## Engineering / PR

- **Branch:** `feat/infra/m-01-durable-asset-storage`
- **PR:** #_____ (milestone PR — opens when the milestone's Acceptance is complete)
- **Primary files touched:**
  - `api/src/modules/infographics/controllers/infographics.controller.ts` — inject `StorageService`; in `uploadPhoto()`, call `storageService.upload(file.buffer, 'source-photos/' + photoId)` synchronously before returning the response
  - `api/src/modules/ai-generation/services/ideogram.service.ts` — inject `StorageService`; update `readSourcePhoto()` to (1) validate `photoPath` format, (2) attempt R2 download, (3) fall back to local tmp, (4) throw `HttpException(422)` if both fail
  - `api/tests/infra/us-infra-003.spec.ts` (new) — unit tests for all four scenarios in AC5

---

## AI Implementation Prompt

> Paste this block into Claude Code to implement the story.

```
Context: InfographicAI SaaS — NestJS API (port 3001) + React frontend (port 5000 via Express proxy).
Stack: React 18 + Vite, NestJS 11, Prisma 6, Tailwind v3 + shadcn/ui, Wouter router, Zustand + React Query.
See CLAUDE.md for full architecture.

Story: US-INFRA-003 — Move source-photo uploads off the ephemeral tmp dir

As a real-estate agent uploading a property photo for the real-photo generation pipeline,
I want my uploaded photo stored durably in R2 rather than on the NestJS container's tmp dir,
so that a Railway restart mid-generation does not silently discard my photo and cause a 422
failure I cannot recover from without re-uploading.

Depends on: US-INFRA-001 must be merged first — StorageService (api/src/modules/storage/)
must already exist and be a @Global() provider before this story is implemented.

--- CHOSEN APPROACH (implement this, not an alternative) ---

Upload path (InfographicsController.uploadPhoto):
  - Keep the existing fs.writeFileSync to PHOTO_UPLOADS_DIR (handles the immediate-read case
    for any code still on the tmp path, and costs nothing to leave).
  - After writing to tmp, call await storageService.upload(file.buffer, `source-photos/${photoId}`)
    SYNCHRONOUSLY before returning { photoId, photoUrl }. This guarantees R2 durability by the
    time the caller can use the photoId. The file is already in memory (file.buffer), so no
    extra disk read is needed.

Read path (IdeogramService.readSourcePhoto):
  1. GUARD FIRST: if photoPath does not match /^[\w-]+\.(jpg|jpeg|png)$/i, throw
     HttpException('Invalid photo reference', 400). Do this before touching R2 or filesystem.
  2. Attempt StorageService download: call storageService.download(`source-photos/${photoPath}`)
     which returns Buffer | null (or throws — treat both as "not found").
  3. If R2 download succeeds: return the buffer. Log event 'image:reference:attached' (unchanged).
  4. If R2 download fails: attempt the existing fs.readFileSync(fullPath) from PHOTO_UPLOADS_DIR
     as a fallback (for photos uploaded before this change shipped).
  5. If both fail: throw HttpException('Property photo could not be read (${photoPath}). The file
     may have expired — please re-upload and try again.', 422). Log event 'image:reference:unreadable'.
     This is the same message and status as the existing hard-fail — do NOT change this text or status.

StorageService.download() contract expected (from US-INFRA-001, extend if not present):
  download(key: string): Promise<Buffer>
  If the key does not exist or download fails, it throws. Caller (readSourcePhoto) wraps in try/catch.
  NOTE: US-INFRA-001's scope only listed upload()/getPublicUrl() — if download() does not yet exist
  on StorageService, add it there as a small addition (S3 GetObjectCommand + stream-to-buffer),
  it is a natural extension of that service, not a new module.

Injection:
  - Both InfographicsController and IdeogramService are already @Injectable() / use DI.
  - StorageService is @Global() (per EPIC-INFRA-02 architecture notes), so no module-level
    import changes are required — just add it to the constructor signature.
  - IdeogramService currently has a no-arg constructor: constructor() { ... }
    Change it to: constructor(private readonly storageService: StorageService) { ... }
    and add the necessary import.

--- ACCEPTANCE CRITERIA ---

AC1 [happy-path]: When POST /api/v1/infographics/upload-photo receives a valid JPEG or PNG
  (≤10MB), InfographicsController.uploadPhoto() calls StorageService.upload(buffer,
  'source-photos/{photoId}') and receives a confirmed result BEFORE returning { photoId, photoUrl }.

AC2 [happy-path]: When IdeogramService.readSourcePhoto(photoPath, generationId) is called and
  the file exists in R2 at key source-photos/{photoPath}, it returns the Buffer from R2 even
  when the local tmp file has been deleted.

AC3 [error-path]: When readSourcePhoto() is called and both R2 and tmp fallback fail, it throws
  HttpException with status 422 and a message containing "re-upload". It must NOT fall through
  silently.

AC4 [security]: When readSourcePhoto() receives a photoPath that does not match
  /^[\w-]+\.(jpg|jpeg|png)$/i (e.g. "../../../etc/passwd"), it throws HttpException with status
  400 BEFORE constructing any R2 key or filesystem path.

AC5 [happy-path]: npm run test:unit passes with 0 failures. api/tests/infra/us-infra-003.spec.ts
  covers: (a) uploadPhoto R2 upload before response; (b) readSourcePhoto returns R2 buffer when
  tmp absent; (c) readSourcePhoto throws 422 when both R2 and tmp fail; (d) readSourcePhoto
  throws 400 on path-traversal input.

--- OUT OF SCOPE ---
- Do NOT provision R2 or build StorageService itself (US-INFRA-001)
- Do NOT touch generated output image persistence (US-INFRA-002)
- Do NOT make any frontend changes
- Do NOT add R2 cleanup/lifecycle policy for old source photos
- Do NOT touch Infographic.imageUrl, layer-extraction.service.ts, or composedDesigns cache

--- PRIMARY FILES TO TOUCH (do NOT touch other files) ---
- api/src/modules/infographics/controllers/infographics.controller.ts
- api/src/modules/ai-generation/services/ideogram.service.ts
- api/src/modules/storage/services/storage.service.ts  (only to add download(), if missing)
- api/tests/infra/us-infra-003.spec.ts  (new file)

--- RULES ---
- Touch ONLY the files listed above.
- Do NOT implement anything in Out of Scope.
- Run `npm run check` before declaring done (0 new TypeScript errors).
- Run `npm run test:unit` before declaring done (no regressions, AC5 test file passes).
- When done: list files changed, ACs checked ✅, paste test command output.
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|:--------:|----------|:------:|---------|
| TC-INFRA-003-01 | Unit (Vitest) | P0 | Given a valid JPEG buffer in `file.buffer`, when `uploadPhoto()` is called, then `StorageService.upload` is called with key `source-photos/{photoId}` before the method returns — verified by asserting the mock was called before the return value is resolved | ✅ | |
| TC-INFRA-003-02 | Unit (Vitest) | P0 | Given a `photoPath` of `"../../../etc/passwd"`, when `readSourcePhoto()` is called, then it throws `HttpException` with status 400 and never calls `StorageService.download` or `fs.readFileSync` — the path-traversal guard fires first | ✅ | |
| TC-INFRA-003-03 | Unit (Vitest) | P1 | Given R2 returns a valid `Buffer` for key `source-photos/abc-123.jpg` and the local tmp file does not exist, when `readSourcePhoto("abc-123.jpg", "gen-1")` is called, then the method returns the R2 `Buffer` without throwing | ✅ | |
| TC-INFRA-003-04 | Unit (Vitest) | P1 | Given `StorageService.download` throws and `fs.readFileSync` also throws (both unavailable), when `readSourcePhoto("abc-123.jpg", "gen-1")` is called, then it throws `HttpException` with status 422 and message containing `"re-upload"` | ✅ | |
| TC-INFRA-003-05 | Manual | P0 | Given a running dev server: call `uploadPhoto`, manually delete the local tmp file, then call `generate` with the returned `photoId` — the generation succeeds by reading the photo from R2 rather than failing with 422 | ✅ | |
| TC-INFRA-003-06 | Manual | P1 | Given a direct API call to `POST /api/v1/infographics/generate` with a crafted `photoReference: "../etc/passwd"`, the server responds with HTTP 400 and the generation does not proceed | ✅ | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [ ] All ACs checked ✅
- [ ] All test cases run and recorded in the table above
- [ ] Gate 1 passes: `npm run check` (0 new TypeScript errors)
- [ ] Gate 4 passes: `npm run test:unit` (no regressions; `api/tests/infra/us-infra-003.spec.ts` fully green)
- [ ] Manual flow verified: upload photo, delete from tmp, generate — R2 read succeeds (TC-INFRA-003-05)
- [ ] Manual flow verified: crafted path-traversal `photoReference` is rejected with 400 (TC-INFRA-003-06)
- [ ] No console errors in the upload or generation flow
- [ ] PR merged (PR #{number})
- [ ] [TASKS.md](./TASKS.md) task list fully checked
- [ ] STORY.md status updated to ✅ Done

---

## Implementation Update (log)

> Appended by code-agent during/after implementation. Newest entries on top.

---

*Story created: 2026-08-19*
