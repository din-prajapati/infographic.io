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
**File:** `api/src/modules/infographics/infographics.controller.ts`
- Add `POST /infographics/upload-photo` with `@UseInterceptors(FileInterceptor('photo'))`
- Store to `/tmp/uploads/{uuid}.jpg`, return `{ photoUrl, photoId }`

### T2 — Backend: pass photo reference to generation
**File:** `api/src/modules/ai-generation/services/image-generation.service.ts`
- Accept optional `photoReference?: string` in request
- Include photo URL in generation prompt as style/reference image

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

- [ ] T1 — Backend upload endpoint
- [ ] T2 — Pass photo reference to generation
- [ ] T3 — Frontend upload button + thumbnail
- [ ] T4 — Pass photoId with generation request
- [ ] `npm run check` passes ✅
- [ ] Manual: photo appears in generated infographic ✅

---

*Tasks created: 2026-04-28*
