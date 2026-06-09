# Story Card — US-AI-011

> **Status:** 🔲 Not Started
> **Feature:** F-AI-02-02 — Multi-platform output format selector
> **Epic:** [EPIC-AI-02](../../EPIC.md)
> **Milestone:** [M-AI-06-photo-and-format](../../milestones/M-AI-06-photo-and-format.md)
> **Linear:** LIN-US-AI-011
> **Created:** 2026-04-28 | **Closed:** —

---

## Story

*As a* real estate agent
*I want* to choose the output format for my infographic (Instagram, Facebook, Story, or Print)
*So that* I get a correctly sized image for the platform I'm posting on

---

## Acceptance Criteria

- [ ] **AC1:** A format selector appears in the chat panel showing: Instagram Square, Facebook Cover, Story (9:16), Print (4:3)
- [ ] **AC2:** The selected format is sent with the generation request and the output image matches the correct aspect ratio
- [ ] **AC3:** Instagram Square (1:1) and Print (4:3) generate correctly verified by image dimensions
- [ ] **AC4:** Format selection is persisted per conversation (not reset when navigating away)
- [ ] **AC5:** Format labels are user-friendly — no aspect ratio numbers or technical specs visible to users
- [ ] **AC6:** `npm run check` passes

---

## Out of Scope

- Format Expand / Outpainting (EPIC-AI-04 — CAP-19)
- Custom aspect ratio input
- Video formats

---

## Engineering / PR

- **Branch:** `feat/ai-us-ai-011-format-selector`
- **PR:** #_____ (fill when opened)
- **Primary files touched:**
  - `client/src/components/ai-chat/AIChatBox.tsx`
  - `api/src/modules/ai-generation/services/image-generation.service.ts`

---

## AI Implementation Prompt

> Copy this block into Claude Code to implement the story.

```
Context: InfographicAI SaaS. CAP-07: Output format selector.

Story: US-AI-011 — Output format selector (Instagram/Facebook/Story/Print)

Format → aspect ratio mapping (internal, never shown to user):
- "Instagram Square" → 1:1 (1024×1024)
- "Facebook Cover"   → 1.91:1 (1200×628)
- "Story"           → 9:16 (1080×1920)
- "Print"           → 4:3 (1600×1200)

FRONTEND:
1. Add a compact format selector (tab pills or dropdown) in AIChatBox.tsx, above or beside the input
2. Default: Instagram Square
3. Store selection in conversation state (persisted via backend if conversation API supports it)

BACKEND:
4. Accept `outputFormat: 'instagram'|'facebook'|'story'|'print'` in generation request
5. Map to actual pixel dimensions in image-generation.service.ts
6. Pass correct dimensions to Nano Banana API

Labels shown to users: "Instagram", "Facebook", "Story", "Print"
Never show: "1:1", "1024×1024", or any resolution/model details.
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-AI-011-01 | Manual | P0 | Select Instagram Square → generate → verify 1:1 image | 🔲 | |
| TC-AI-011-02 | Manual | P0 | Select Print → generate → verify 4:3 image | 🔲 | |
| TC-AI-011-03 | Manual | P1 | Format selection persists after navigating away and back | 🔲 | |

---

## Definition of Done

- [ ] All ACs checked ✅
- [ ] `npm run check` passes
- [ ] Manual: all 4 formats generate correct aspect ratios ✅
- [ ] [TASKS.md](./TASKS.md) task list fully checked

---

*Story created: 2026-04-28*
