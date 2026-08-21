---
title: Story Card — US-INFRA-002
type: story
tags: [infra, storage, ai-generation]
updated: 2026-08-19
---

# Story Card — US-INFRA-002

> **Status:** 🔲 Not Started
> **Feature:** F-INFRA-01 — R2-backed storage service + persistence of generated images
> **Epic:** [EPIC-INFRA-02](../../EPIC.md)
> **Milestone:** [M-INFRA-01-durable-asset-storage](../../milestones/M-INFRA-01-durable-asset-storage.md)
> **Linear:** LIN-XXX
> **Size:** M
> **Created:** 2026-08-19 | **Closed:** —
>
> **Depends on:** US-INFRA-001 must be merged before this story can start — `StorageService` (`api/src/modules/storage/storage.service.ts`) must exist and be globally provided before this story's changes compile.

---

## Story

*As* the platform (AI generation pipeline)
*I want* every Ideogram-generated image URL collected in `AiOrchestrator.generateInfographic()` and every erased-text `backgroundUrl` returned by `LayerExtractionService.extractTextGeometry()` to be downloaded server-side and re-uploaded into Cloudflare R2 via `StorageService` immediately after the provider call succeeds
*So that* `Infographic.imageUrl` and every `ComposedDesign.backgroundUrl` written into the `composedDesigns` cache point at a URL Buildographic owns — meaning a paying customer's generated infographic deliverable survives Ideogram URL rotation, expiry, or CDN deletion

---

## Acceptance Criteria

> **Rule:** ACs are file-specific and binary. "Works correctly" is not an AC.

- [ ] **AC1 [happy-path]:** Given `AiOrchestrator.generateInfographic()` (`api/src/modules/ai-generation/services/ai-orchestrator.service.ts`) completes an Ideogram image generation successfully and `StorageService.upload()` resolves, the `imageUrl` argument in the `prisma.infographic.update({ data: { imageUrl, status: 'completed' } })` call begins with the value of `R2_PUBLIC_URL` and does NOT contain the substring `ideogram.ai`.

- [ ] **AC2 [happy-path]:** Given `AiOrchestrator.generateInfographic()` is called with `variations > 1` and `StorageService.upload()` resolves for every variation, every `imageUrl` value in the `updatedPropertyData.variations` array — written to `Infographic.propertyData` via the `prisma.infographic.update` call on the variations step (`ai-orchestrator.service.ts` around line 386) — begins with `R2_PUBLIC_URL` and does NOT contain `ideogram.ai`.

- [ ] **AC3 [happy-path]:** Given `AiOrchestrator.composeDesignForEdit()` (`ai-orchestrator.service.ts`) receives a non-null result from `LayerExtractionService.extractTextGeometry()` and `StorageService.upload()` resolves for the erased-text `backgroundUrl`, the `ComposedDesign.backgroundUrl` value written into the `composedDesigns` JSON cache via `prisma.infographic.update` begins with `R2_PUBLIC_URL` and does NOT contain `ideogram.ai`.

- [ ] **AC4 [error-path]:** Given `AiOrchestrator.generateInfographic()` completes an Ideogram generation successfully (raw Ideogram URL obtained) but `StorageService.upload()` then throws any error, the method does NOT throw and does NOT persist `status: 'failed'` to the `Infographic` record; `prisma.infographic.update({ data: { imageUrl, status: 'completed' } })` is still called with the original Ideogram URL as `imageUrl`; and a `logGen()` call at level `'warn'` with `event: 'storage:upload:warn'` is emitted before that DB write.

- [ ] **AC5 [error-path]:** Given `AiOrchestrator.composeDesignForEdit()` receives a non-null extraction result from `LayerExtractionService.extractTextGeometry()` but `StorageService.upload()` throws during the `backgroundUrl` upload step, the method still returns a `ComposedDesign` whose `backgroundUrl` field equals the original Ideogram layerize-text URL (the value in `extractionResult.backgroundUrl`) and does NOT propagate the storage error to its caller.

---

## Out of Scope

- Does not provision the Cloudflare R2 bucket or implement `StorageService` — that is US-INFRA-001.
- Does not change source-photo upload durability (`infographics.controller.ts` `FileInterceptor('photo')` writing to `PHOTO_UPLOADS_DIR`) — that is US-INFRA-003.
- Does not backfill existing `Infographic` rows whose `imageUrl` already contains `ideogram.ai` — explicitly deferred in EPIC-INFRA-02 "Out of Scope."
- Does not touch any frontend file — no component, page, or API client changes.
- Does not alter the `Infographic.imageUrl` column type in `api/prisma/schema.prisma` — the field remains `String` (line 104); only its source value changes.
- Does not implement retry logic or a background queue for failed R2 uploads — fallback-to-Ideogram-URL on failure is sufficient for the first pass.
- Does not persist canvas-editor export downloads (`canvasExport.ts` `downloadCanvas()`) — client-side only, see EPIC-INFRA-02 "Out of Scope."

---

## Design Notes

**Synchronous upload (first pass):** The R2 upload happens synchronously inside `generateInfographic()` — after `imageUrls` is populated from Ideogram but before `prisma.infographic.update({ data: { imageUrl, status: 'completed' } })`. The client's `completed` status therefore fires only after the asset is durably stored, which is the correct behaviour for a paid deliverable. The added latency (a server-side fetch of roughly 4–6 MB + an R2 `PutObject`) is expected to be 2–5 s, absorbed within a generation flow that already takes 10–30 s; no perceptible change to the user.

**Fallback contract:** The Ideogram API fee is spent the moment `imageUrls` is populated. A storage failure must never cause the generation to be marked `failed` or the `Infographic` record to be lost. The fallback is to store the original Ideogram URL unchanged — the deliverable degrades in durability but not in immediate availability.

**Stable storage key format:**
- Generated images: `infographics/${infographicId}/image-v${i}.jpg` where `i` is the 0-based variation index.
- Composed backgrounds: `infographics/${infographicId}/bg-${composeCacheKey(imageUrl).replace(/[^a-z0-9]/gi, '-').slice(-24)}.jpg` — deriving the suffix from `composeCacheKey(imageUrl)` (already exported from `ai-orchestrator.service.ts`) ensures the key is stable across URL-signature rotations for the same underlying image.

**MIME type:** Ideogram V2/V3/V4 CDN URLs serve JPEG by default. Use `image/jpeg` unless the URL path explicitly ends in `.png`.

**`infographic.processor.ts` (Bull queue):** This legacy queue-based path also calls `ideogramService.generateImage()` and writes the raw URL directly to `Infographic.imageUrl`. It must receive the same upload+fallback treatment with key `infographics/${infographicId}/image-v0.jpg`. The processor injects `OpenAiService` and `IdeogramService` via `@Inject()` — add `StorageService` the same way.

---

## Engineering / PR

- **Branch:** `feat/infra/m-01-durable-asset-storage`
- **PR:** #_____ (milestone PR — opens when M-INFRA-01 Acceptance checklist is complete; see AGILE.md "Git Standards")
- **Primary files touched:**
  - `api/src/modules/ai-generation/services/ai-orchestrator.service.ts` — inject `StorageService`; add private `uploadAndFallback(ideogramUrl, storageKey, generationId)` helper; call it on every element of `imageUrls` after Ideogram calls return and before the primary DB write; call it on `backgroundUrl` in `composeDesignForEdit()` before the cache write
  - `api/src/modules/ai-generation/services/infographic.processor.ts` — inject `StorageService` via `@Inject()`; call `uploadAndFallback` (or inline equivalent) on `imageUrl` after `generateImage()` returns and before `prisma.infographic.update`
  - `api/src/modules/ai-generation/ai-generation.module.ts` — add `StorageModule` to `imports` if `StorageService` injection token is unresolved without an explicit import (if `StorageModule` is `@Global()` and registered in `AppModule`, this import may be a no-op — verify at compile time and only add if needed)
  - `api/tests/ai-generation/image-persistence.spec.ts` (new) — unit tests covering AC1, AC2, AC3, AC4, AC5

---

## AI Implementation Prompt

> Paste this block into Claude Code to implement the story.

```
Context: InfographicAI SaaS — NestJS API (port 3001) + React frontend (port 5000 via Express proxy).
Stack: React 18 + Vite, NestJS 11, Prisma 6, Tailwind v3 + shadcn/ui, Wouter router, Zustand + React Query.
See CLAUDE.md for full architecture.

Story: US-INFRA-002 — Persist generated images to owned storage

As the platform (AI generation pipeline), I want every Ideogram-generated image URL to be
downloaded and re-uploaded into Cloudflare R2 via StorageService immediately after generation
so that Infographic.imageUrl and ComposedDesign.backgroundUrl in the composedDesigns cache
point at a URL Buildographic owns, so that a paying customer's deliverable survives Ideogram
URL expiry or deletion.

PREREQUISITE: US-INFRA-001 must already be merged. StorageService exists at
api/src/modules/storage/storage.service.ts and exposes:
  upload(buffer: Buffer, key: string): Promise<string>   — returns the owned public URL
  getPublicUrl(key: string): string
StorageModule is @Global() and registered in AppModule.

Acceptance Criteria:
  AC1 [happy-path]: Given AiOrchestrator.generateInfographic() (ai-orchestrator.service.ts)
    completes and StorageService.upload() resolves, the imageUrl argument in
    prisma.infographic.update({ data: { imageUrl, status: 'completed' } }) begins with
    R2_PUBLIC_URL and does NOT contain 'ideogram.ai'.

  AC2 [happy-path]: Given generateInfographic() with variations > 1 and
    StorageService.upload() resolves for each, every imageUrl in updatedPropertyData.variations[]
    (written to Infographic.propertyData) begins with R2_PUBLIC_URL and does NOT contain
    'ideogram.ai'.

  AC3 [happy-path]: Given composeDesignForEdit() receives a non-null extraction result and
    StorageService.upload() resolves for backgroundUrl, the ComposedDesign.backgroundUrl written
    into the composedDesigns cache begins with R2_PUBLIC_URL and does NOT contain 'ideogram.ai'.

  AC4 [error-path]: Given generateInfographic() obtains a raw Ideogram URL but
    StorageService.upload() then throws, the method does NOT throw; prisma.infographic.update
    is called with the original Ideogram URL and status 'completed'; and a logGen() at level
    'warn' with event 'storage:upload:warn' is emitted before that DB write.

  AC5 [error-path]: Given composeDesignForEdit() receives a non-null extraction result but
    StorageService.upload() throws during background URL upload, the method returns a
    ComposedDesign whose backgroundUrl equals the original Ideogram layerize-text URL and
    does NOT propagate the storage error.

Out of Scope:
  - Provisioning R2 or implementing StorageService (US-INFRA-001)
  - Source-photo durability (US-INFRA-003)
  - Backfilling existing Infographic rows
  - Any frontend files
  - Changing Infographic.imageUrl column type in schema.prisma
  - Retry logic or background queuing for failed uploads

Primary files to touch (do NOT touch other files):
  - api/src/modules/ai-generation/services/ai-orchestrator.service.ts
  - api/src/modules/ai-generation/services/infographic.processor.ts
  - api/src/modules/ai-generation/ai-generation.module.ts  (only if StorageService injection token is unresolved without it)
  - api/tests/ai-generation/image-persistence.spec.ts  (new file)

Implementation guide:

1. Add a private async helper to AiOrchestrator. This is the ONLY place that knows about
   the fallback contract; callers must not catch anything themselves:

   private async uploadAndFallback(
     ideogramUrl: string,
     storageKey: string,
     generationId: string,
   ): Promise<string> {
     try {
       const res = await axios.get(ideogramUrl, { responseType: 'arraybuffer', timeout: 30_000 });
       const owned = await this.storageService.upload(Buffer.from(res.data), storageKey);
       logGen({ generationId, event: 'storage:upload:ok', storageKey });
       return owned;
     } catch (err: any) {
       logGen({ generationId, event: 'storage:upload:warn', storageKey, error: err?.message }, 'warn');
       return ideogramUrl;   // AC4 / AC5 fallback — never throw
     }
   }

2. In generateInfographic(), AFTER imageUrls is fully populated (after both the
   photo-remix branch (line ~228) and the no-photo branch (line ~294)) and BEFORE
   `const imageUrl = imageUrls[0] || ''` (line ~318):

   imageUrls = await Promise.all(
     imageUrls.map((url, i) =>
       this.uploadAndFallback(url, `infographics/${infographicId}/image-v${i}.jpg`, infographicId)
     )
   );

   The rest of the method is unchanged — imageUrl, updatedPropertyData.variations, and
   all DB writes use the already-replaced array.

3. In composeDesignForEdit(), AFTER extractionResult is confirmed non-null (line ~493)
   and BEFORE building the `result: ComposedDesign` object (line ~545):

   const ownedBackgroundUrl = await this.uploadAndFallback(
     extractionResult.backgroundUrl,
     `infographics/${infographicId}/bg-${composeCacheKey(imageUrl).replace(/[^a-z0-9]/gi, '-').slice(-24)}.jpg`,
     infographicId,
   );
   // replace backgroundUrl in the destructure:
   const { blocks } = extractionResult;
   const backgroundUrl = ownedBackgroundUrl;

   Then build `result` using the replaced `backgroundUrl`. The cache write is unchanged.

4. In infographic.processor.ts, after `imageUrl = await this.ideogramService.generateImage(...)`
   (line ~64), add the same upload-and-fallback inline (or inject StorageService and call
   uploadAndFallback). Key: `infographics/${infographicId}/image-v0.jpg`.
   The processor does not have access to the private helper — implement the try/catch inline
   or extract a shared utility if desired, but DO NOT move it outside the files listed above.

5. In ai-generation.module.ts: add `StorageModule` (from api/src/modules/storage/storage.module.ts)
   to the `imports` array IF TypeScript reports the injection token as unresolvable at compile
   time. If the module is already @Global() in AppModule and the token resolves, skip this.

6. Unit tests in api/tests/ai-generation/image-persistence.spec.ts:
   Follow the pattern in api/tests/ai-generation/ai-orchestrator.textfree-fallback.spec.ts:
   - vi.mock('axios', ...)
   - vi.mock('fs', ...)
   - Construct AiOrchestrator with a mock StorageService injected as a constructor arg
     (after LayerExtractionService).
   - Test TC-INFRA-002-01: StorageService.upload() rejects → method resolves, prisma.update
     called with original Ideogram URL, status 'completed'.
   - Test TC-INFRA-002-02: StorageService.upload() rejects during composeDesignForEdit() background
     upload → method resolves, returned ComposedDesign.backgroundUrl equals original Ideogram URL.
   - Test TC-INFRA-002-03: StorageService.upload() resolves to owned URL → prisma.update called
     with owned URL (not 'ideogram.ai').
   - Test TC-INFRA-002-04: StorageService.upload() resolves during composeDesignForEdit() →
     returned ComposedDesign.backgroundUrl is the owned URL (not 'ideogram.ai').

Rules:
- Touch ONLY the files listed above
- Do NOT implement anything in Out of Scope
- Run `npm run check` before declaring done
- Run `npm run test:unit` before declaring done
- When done: list files changed, ACs checked, test command output
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|:--------:|----------|:------:|---------|
| TC-INFRA-002-01 | Unit (Vitest) | P0 | Given AiOrchestrator with `StorageService.upload()` mocked to reject, when `generateInfographic()` obtains a successful Ideogram URL, then the method resolves without throwing AND `prisma.infographic.update` is called with the original Ideogram URL in `imageUrl` with `status: 'completed'` — NOT an error state | 🔲 | |
| TC-INFRA-002-02 | Unit (Vitest) | P0 | Given AiOrchestrator with `StorageService.upload()` mocked to reject, when `composeDesignForEdit()` receives a non-null extraction result, then the method resolves and the returned `ComposedDesign.backgroundUrl` equals the original Ideogram layerize-text URL — not null, not empty, not an error | 🔲 | |
| TC-INFRA-002-03 | Unit (Vitest) | P1 | Given AiOrchestrator with `StorageService.upload()` mocked to resolve to `'https://assets.buildographic.com/infographics/inf-1/image-v0.jpg'`, when `generateInfographic()` completes (single variation), then `prisma.infographic.update`'s `imageUrl` argument contains `'assets.buildographic.com'` and does not contain `'ideogram.ai'` | 🔲 | |
| TC-INFRA-002-04 | Unit (Vitest) | P1 | Given AiOrchestrator with `StorageService.upload()` mocked to resolve to an owned URL, when `composeDesignForEdit()` receives a non-null extraction result, then the `ComposedDesign.backgroundUrl` in the `composedDesigns` cache-write payload contains the owned domain and does not contain `'ideogram.ai'` | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [ ] All ACs checked ✅
- [ ] All test cases run and recorded in the table above
- [ ] Gate 1 passes: `npm run check` — 0 new TypeScript errors
- [ ] Gate 4 passes: `npm run test:unit` — no regressions in existing suite, new tests all pass
- [ ] Manual flow verified on `localhost:5000`: generate an infographic, open Prisma Studio, confirm the saved `Infographic.imageUrl` begins with the value of `R2_PUBLIC_URL` (e.g. `assets.buildographic.com`) and does not contain `ideogram.ai`
- [ ] Manual flow verified: disable or ignore the original Ideogram URL and confirm the image still renders in the browser from the R2 copy
- [ ] PR merged (PR #{number})
- [ ] No console errors in the generation flow
- [ ] [TASKS.md](./TASKS.md) task list fully checked
- [ ] STORY.md status updated to ✅ Done

---

## Implementation Update (log)

> Appended by code-agent during/after implementation. Newest entries on top.

---

*Story created: 2026-08-19*
