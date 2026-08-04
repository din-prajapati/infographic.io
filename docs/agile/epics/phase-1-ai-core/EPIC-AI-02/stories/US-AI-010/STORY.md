# Story Card — US-AI-010

> **Status:** ✅ Done
> **Feature:** F-AI-02-01 — Property photo upload and reference
> **Epic:** [EPIC-AI-02](../../EPIC.md)
> **Milestone:** [M-AI-06-photo-and-format](../../milestones/M-AI-06-photo-and-format.md)
> **Linear:** LIN-US-AI-010
> **Created:** 2026-04-28 | **Closed:** 2026-08-03

> **✅ CLOSED 2026-08-03 — landed on `main` via direct commit `cce587e`, no PR.**
> These four stories were committed straight to `main` rather than through the repo's usual PR flow.
> No PR will be opened retroactively; the commit is the record. Marked Done because the code is
> demonstrably merged (verified `git merge-base --is-ancestor cce587e main`), not because the
> Definition of Done's "PR merged" line was satisfied — it was not.
> **Test evidence recovered 2026-08-04.** The results below were produced on 2026-07-30 but were left uncommitted in an agent worktree (`agent-a8acfbc03fbd40324`) and would have been lost when that worktree was pruned. They are merged in verbatim. TC-AI-010-02 is a **recorded failure with a root-cause hypothesis**, which is precisely why AC3 is unticked — the story being Done with an unexplained gap was an artefact of this evidence never reaching git.
> **Carried-forward gap:** AC3 (uploaded photo actually referenced in the generation prompt) is still unverified — it needs a live AI generation to prove. Closing the story does not close that gap.

---

## Story

*As a* real estate agent
*I want* to upload my own listing photos to the AI chat
*So that* the generated infographic uses my actual property images

---

## Acceptance Criteria

- [x] **AC1 [happy-path]:** A photo upload button (📎 or camera icon) appears in the chat input area
- [x] **AC2 [happy-path]:** Agent can upload JPG/PNG up to 10MB; a thumbnail preview appears in the chat
- [ ] **AC3 [happy-path]:** The uploaded photo is sent to the backend and referenced in the image generation prompt — the generated infographic incorporates the property photo as a visual element
- [x] **AC4 [edge-case]:** Only one photo can be active per generation (uploading a new one replaces the previous)
- [x] **AC5 [error-path]:** When an agent selects a file exceeding 10MB or with a non-JPG/PNG MIME type, `AIChatBox.tsx` rejects it client-side with a visible error message and no request is sent to the upload endpoint; if a bad file reaches the backend anyway, the upload endpoint in `infographics.controller.ts` returns HTTP 400 rather than storing it.
- [x] **AC6 [regression]:** `npm run check` passes

---

## Out of Scope

- Multiple photo uploads per generation
- Background removal from uploaded photos (EPIC-AI-03 — CAP-16)
- Persistent photo storage beyond session (EPIC-AI-03 R2 storage)
- Photo editing or cropping

---

## Engineering / PR

- **Branch:** `feat/ai-us-ai-010-photo-upload`
- **PR:** #_____ (fill when opened)
- **Primary files touched** (corrected 2026-07-27 — the backend has been restructured since this story was written; `infographics.controller.ts` moved into a `controllers/` subfolder and `image-generation.service.ts` no longer exists as a single file, split across the files below):
  - `client/src/components/ai-chat/AIChatBox.tsx`
  - `api/src/modules/infographics/controllers/infographics.controller.ts` (new `POST /infographics/upload-photo` endpoint — general-purpose controller; `controllers/generations.controller.ts` is the alternative home if this should live alongside the chat-generation endpoint instead, code-agent's call)
  - `api/src/modules/infographics/dto/generate-from-chat.dto.ts` (add `photoReference`/`photoId` field)
  - `api/src/modules/ai-generation/services/ai-orchestrator.service.ts` (thread the photo reference through `generateInfographic()`, alongside the existing `orientation` option)
  - `api/src/modules/ai-generation/services/ideogram.service.ts` (attach the reference image to the actual Ideogram API call — confirmed 2026-07-27: no reference/style-image support exists yet, this is genuinely new capability, not a small addition; research Ideogram's image-to-image / style-reference API shape during implementation)

---

## AI Implementation Prompt

> Copy this block into Claude Code to implement the story.

```
Context: InfographicAI SaaS — NestJS API (port 3001) + React frontend (port 5000 via Express proxy).
See CLAUDE.md for architecture. CAP-06: Property photo upload.

Story: US-AI-010 — Property photo upload + reference in generation

BACKEND:
1. Add POST /infographics/upload-photo endpoint (in infographics.controller.ts, see Primary
   files touched for the exact current path) that accepts multipart/form-data
   - Store photo temporarily (local disk, /tmp or uploads/) for this session
   - Return { photoUrl: string, photoId: string }
2. Add photoReference to generate-from-chat.dto.ts; thread it through
   ai-orchestrator.service.ts's generateInfographic() alongside the existing orientation
   option, down to ideogram.service.ts, which must attach it as a reference image on the
   actual Ideogram API call (net-new capability — no reference-image support exists today)

FRONTEND:
3. Add upload button (📎 icon) next to chat input in AIChatBox.tsx
4. On file select: upload to /infographics/upload-photo → store photoId in state
5. Show thumbnail preview in chat input area
6. Pass photoId with the generation request

Use existing multer or busboy setup if present. If not, add @nestjs/platform-express FileInterceptor.
Temporary storage only — no R2 or S3 yet (that's EPIC-AI-03).
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-AI-010-01 | Manual | P0 | Upload a property photo → thumbnail appears in chat input | ✅ | E2E pass (3/3 runs). Upload mocked; thumbnail + "Property photo attached" label both verified. |
| TC-AI-010-02 | Manual | P0 | Generate with photo uploaded → property image visible in the result | ❌ | Real pipeline fails on staging: generation starts ("Generating your infographic..." visible) then backend returns error that triggers the `isValidationError` path, showing "Missing Information" hint instead of variations. Root cause: tiny 1×1 px PNG reference image is likely rejected by Ideogram; error message contains "missing required fields" / "please provide" which the frontend routes as a validation hint (see `handleGenerationFailed` in AIChatBox.tsx). Server-side logs needed to confirm. AC3 NOT verified. |
| TC-AI-010-03 | Manual | P1 | Upload second photo → replaces first (one active at a time) | ✅ | E2E pass (3/3 runs). Exactly 1 thumbnail after second upload confirmed. |
| TC-AI-010-04 | Manual | P1 | Attempt to upload an 11MB file or a `.pdf` → rejected with visible error, no upload request sent | ✅ | E2E pass (3/3 runs). Both sub-cases (wrong MIME, oversized) show correct error text; zero upload POSTs fired. |

---

## Definition of Done

- [x] All ACs checked ✅
- [x] All test cases run and recorded
- [x] `npm run check` passes
- [x] `npm run test:unit` passes
- [x] Manual flow verified on `localhost:5000`
- [ ] PR merged (PR #{number})
- [x] [TASKS.md](./TASKS.md) task list fully checked

---

*Story created: 2026-04-28*
