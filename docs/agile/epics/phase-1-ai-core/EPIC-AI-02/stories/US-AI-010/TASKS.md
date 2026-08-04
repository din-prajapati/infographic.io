# PR Task List — US-AI-010

> **Story:** [STORY.md](./STORY.md)
> **Branch:** `feat/ai-us-ai-010-photo-upload`
> **PR:** #_____ (fill when opened)
> **Type:** feat

---

## PR Scope Summary

```
feat(ai): add property photo upload to chat with backend reference in generation — US-AI-010
```

---

## Task Breakdown

### T1 — Backend: photo upload endpoint
**File:** `api/src/modules/infographics/controllers/infographics.controller.ts` (corrected path 2026-07-27 — moved into `controllers/` subfolder since this story was written; `controllers/generations.controller.ts` is the alternative if this should live with the chat-generation endpoint instead)
- Add `POST /infographics/upload-photo` with `@UseInterceptors(FileInterceptor('photo'))` (no multer/FileInterceptor exists anywhere in the backend yet — this is net-new infra, not reuse)
- Store to `/tmp/uploads/{uuid}.jpg`, return `{ photoUrl, photoId }`

### T2 — Backend: pass photo reference to generation
**Files** (corrected 2026-07-27 — `image-generation.service.ts` no longer exists, this responsibility is now split):
- `api/src/modules/infographics/dto/generate-from-chat.dto.ts` — add optional `photoReference?: string`
- `api/src/modules/ai-generation/services/ai-orchestrator.service.ts` — thread `photoReference` through `generateInfographic()` the same way `orientation` is threaded today
- `api/src/modules/ai-generation/services/ideogram.service.ts` — attach the reference image to the actual Ideogram API call (confirmed: no reference/style-image support exists yet — research Ideogram's image-to-image API shape, this is genuinely new capability)

### T3 — Frontend: upload button + thumbnail
**File:** `client/src/components/ai-chat/AIChatBox.tsx`
- Add hidden `<input type="file" accept="image/*">` triggered by 📎 button
- On change: POST to `/api/v1/infographics/upload-photo` via FormData
- Store `photoId` in state; show thumbnail preview

### T4 — Frontend: pass photoId with generation
**File:** `client/src/components/ai-chat/AIChatBox.tsx`
- Include `photoId` in the generation request body

---

## Exact Test Commands

```bash
npm run check
npm run test:unit
# Manual: upload photo → generate → verify photo appears in result
```

---

## Task Checklist

- [x] T1 — Backend upload endpoint
- [x] T2 — Pass photo reference to generation
- [x] T3 — Frontend upload button + thumbnail
- [x] T4 — Pass photoId with generation request
- [x] `npm run check` passes ✅
- [ ] Manual: photo appears in generated infographic — **🔓 OPEN / BLOCKED**: TC-AI-010-02 must be
      re-run once Ideogram credits are topped up. Retest with a **real photo from `public/assets/`**,
      not the 1×1 px fixture that produced the recorded failure. See the "Open verification" block in
      [STORY.md](./STORY.md) for the command, cost, and the two competing hypotheses.

---

*Tasks created: 2026-04-28*
