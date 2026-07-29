# Story Card — US-AI-011

> **Status:** ⏭️ Superseded by [US-AI-036](../US-AI-036/STORY.md), [US-AI-037](../US-AI-037/STORY.md), [US-AI-038](../US-AI-038/STORY.md) (2026-07-29)
> **Feature:** F-AI-02-02 — Multi-platform output format selector
> **Epic:** [EPIC-AI-02](../../EPIC.md)
> **Milestone:** [M-AI-06-photo-and-format](../../milestones/M-AI-06-photo-and-format.md)
> **Linear:** LIN-US-AI-011
> **Created:** 2026-04-28 | **Closed:** —

---

> **⏭️ SUPERSEDED — no separate work needed.** A pre-implementation readiness check (2026-07-27) found this story's "Primary files touched" were stale (the backend module structure moved since 2026-04-28), and a deeper design discussion (2026-07-27/28) found this story's core premise didn't fit the real architecture: `AIChatBox.tsx` already has a fully-built, working orientation picker (landscape/portrait/square), and Ideogram doesn't natively support most of the named platform aspect ratios this story asked for (Facebook Cover 1.91:1, Print 4:3) as generation-time options anyway.
>
> Investigation also surfaced that the actual template system (`premiumTemplates.ts` + the unused `canvas-templates` API) already solves "generate in the right format" via **template selection**, Canva-style, not a generation-time dropdown — the real gaps were (1) generation not respecting an already-open canvas's shape, (2) no way for users to save their own templates, and (3) no picker to choose a format up front when starting new. Those three gaps became:
> - **[US-AI-036](../US-AI-036/STORY.md)** — canvas-aware generation orientation + insert-as-layer (the actual bug fix)
> - **[US-AI-037](../US-AI-037/STORY.md)** — Save as Template (personal library, `visibility` field for a future marketplace)
> - **[US-AI-038](../US-AI-038/STORY.md)** — unified Format Picker for New Design / New Template, with finer-grained platform taxonomy than this story's original 4 options
>
> Keeping this card as a record of the original ask. Do not implement it separately.

---

## Story

*As a* real estate agent
*I want* to choose the output format for my infographic (Instagram, Facebook, Story, or Print)
*So that* I get a correctly sized image for the platform I'm posting on

---

## Acceptance Criteria

- [ ] **AC1 [happy-path]:** A format selector appears in the chat panel showing: Instagram Square, Facebook Cover, Story (9:16), Print (4:3)
- [ ] **AC2 [happy-path]:** The selected format is sent with the generation request and the output image matches the correct aspect ratio
- [ ] **AC3 [happy-path]:** Instagram Square (1:1) and Print (4:3) generate correctly verified by image dimensions
- [ ] **AC4 [edge-case]:** Format selection is persisted per conversation (not reset when navigating away)
- [ ] **AC5 [compliance]:** Format labels are user-friendly — no aspect ratio numbers or technical specs visible to users
- [ ] **AC6 [error-path]:** When a persisted format value is missing, malformed, or not one of the four known formats on conversation load, `AIChatBox.tsx` falls back to the default "Instagram Square" instead of erroring or leaving no selection.
- [ ] **AC7 [regression]:** `npm run check` passes

---

## Out of Scope

- Format Expand / Outpainting (EPIC-AI-04 — CAP-19)
- Custom aspect ratio input
- Video formats

---

## Engineering / PR

- **Branch:** `feat/ai-us-ai-011-format-selector`
- **PR:** #_____ (fill when opened)
- **Primary files touched** (corrected 2026-07-27 — `image-generation.service.ts` no longer exists; also see the ⚠️ note below about an existing overlapping feature, unresolved as of this correction):
  - `client/src/components/ai-chat/AIChatBox.tsx` (⚠️ already has a fully-built `generationOrientation` state / orientation picker — see note below)
  - `api/src/modules/infographics/dto/generate-from-chat.dto.ts` (already has an `orientation?: 'landscape'|'portrait'|'square'` field — decide whether `outputFormat` is additive or replaces it)
  - `api/src/modules/ai-generation/services/ai-orchestrator.service.ts` (already threads `orientation` through `generateInfographic()`)
  - `api/src/modules/ai-generation/services/ideogram.service.ts` (already maps `orientation` → Ideogram aspect ratio in `generateImage()`/`generateImageV4()`)
  - `api/src/config/image-generation.config.ts` (already holds `ORIENTATION_TO_IDEOGRAM_ASPECT` / `ORIENTATION_TO_IDEOGRAM_ASPECT_V3` dimension maps — the new format→dimension mapping likely belongs here too)

> ⚠️ **Unresolved overlap, flagged 2026-07-27, not yet decided:** `AIChatBox.tsx` already has a live, end-to-end orientation picker (`landscape | portrait | square`) wired through the DTO, orchestrator, Ideogram service, and its own icon-bar UI — built after this story was written. This story's 4-option format selector (Instagram/Facebook/Story/Print) is a different, more granular abstraction over the same underlying concept (output aspect ratio / dimensions). **Before implementing:** decide whether to (a) extend the existing orientation picker with named platform presets, (b) replace it outright, or (c) add a genuinely separate second control. Implementing this story verbatim without that decision risks a redundant or conflicting UI.

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
| TC-AI-011-04 | Manual | P2 | Load a conversation with a corrupted/missing format value → selector falls back to Instagram Square | 🔲 | |

---

## Definition of Done

- [ ] All ACs checked ✅
- [ ] `npm run check` passes
- [ ] Manual: all 4 formats generate correct aspect ratios ✅
- [ ] [TASKS.md](./TASKS.md) task list fully checked

---

*Story created: 2026-04-28*
