# Story Card — US-AI-010

> **Status:** 🔲 Not Started
> **Feature:** F-AI-02-01 — Property photo upload and reference
> **Epic:** [EPIC-AI-02](../../EPIC.md)
> **Milestone:** [M-AI-06-photo-and-format](../../milestones/M-AI-06-photo-and-format.md)
> **Linear:** LIN-US-AI-010
> **Created:** 2026-04-28 | **Closed:** —

---

## Story

*As a* real estate agent
*I want* to upload my own listing photos to the AI chat
*So that* the generated infographic uses my actual property images

---

## Acceptance Criteria

- [ ] **AC1:** A photo upload button (📎 or camera icon) appears in the chat input area
- [ ] **AC2:** Agent can upload JPG/PNG up to 10MB; a thumbnail preview appears in the chat
- [ ] **AC3:** The uploaded photo is sent to the backend and referenced in the image generation prompt — the generated infographic incorporates the property photo as a visual element
- [ ] **AC4:** Only one photo can be active per generation (uploading a new one replaces the previous)
- [ ] **AC5:** `npm run check` passes

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
- **Primary files touched:**
  - `client/src/components/ai-chat/AIChatBox.tsx`
  - `api/src/modules/infographics/infographics.controller.ts` (or new upload endpoint)
  - `api/src/modules/ai-generation/services/image-generation.service.ts` (pass photo ref)

---

## AI Implementation Prompt

> Copy this block into Claude Code to implement the story.

```
Context: InfographicAI SaaS — NestJS API (port 3001) + React frontend (port 5000 via Express proxy).
See CLAUDE.md for architecture. CAP-06: Property photo upload.

Story: US-AI-010 — Property photo upload + reference in generation

BACKEND:
1. Add POST /infographics/upload-photo endpoint that accepts multipart/form-data
   - Store photo temporarily (local disk, /tmp or uploads/) for this session
   - Return { photoUrl: string, photoId: string }
2. In image-generation.service.ts: accept optional photoReference in the generation request
   - Include photo in the image generation prompt as a reference image

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
| TC-AI-010-01 | Manual | P0 | Upload a property photo → thumbnail appears in chat input | 🔲 | |
| TC-AI-010-02 | Manual | P0 | Generate with photo uploaded → property image visible in the result | 🔲 | |
| TC-AI-010-03 | Manual | P1 | Upload second photo → replaces first (one active at a time) | 🔲 | |

---

## Definition of Done

- [ ] All ACs checked ✅
- [ ] All test cases run and recorded
- [ ] `npm run check` passes
- [ ] `npm run test:unit` passes
- [ ] Manual flow verified on `localhost:5000`
- [ ] PR merged (PR #{number})
- [ ] [TASKS.md](./TASKS.md) task list fully checked

---

*Story created: 2026-04-28*
