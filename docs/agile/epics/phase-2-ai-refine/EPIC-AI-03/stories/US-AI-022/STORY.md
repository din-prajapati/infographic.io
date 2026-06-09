# Story Card — US-AI-022

> **Status:** 🔲 Not Started
> **Feature:** F-AI-03-04 — Photo tools (background removal + upscale)
> **Epic:** [EPIC-AI-03](../../EPIC.md)
> **Milestone:** [M-AI-11-media-tools](../../milestones/M-AI-11-media-tools.md)
> **Capability:** CAP-17
> **Linear:** LIN-US-AI-022 | **Created:** 2026-04-28

---

## Story

*As a* real estate agent
*I want* to upscale my generated infographic to Print Quality (4K)
*So that* I can use it for yard signs, brochures, and other printed materials

---

## Acceptance Criteria

- [ ] **AC1:** An "Upscale to Print" button appears on generated infographics (or in the canvas editor)
- [ ] **AC2:** Clicking it triggers upscaling — the output is ≥3840px on the long side
- [ ] **AC3:** Upscaled image is stored in Cloudflare R2 and accessible via signed URL (requires US-AI-020 complete)
- [ ] **AC4:** Upscaling is available for TEAM+ plans only; FREE/SOLO sees an upgrade prompt
- [ ] **AC5:** `npm run check` passes

---

## Out of Scope

- Upscaling to 8K or beyond
- Video upscaling
- Upscaling of photos (only generated infographics)

---

## Engineering / PR

- **Branch:** `feat/ai-us-ai-022-upscale`
- **PR:** #_____ (fill when opened)
- **Primary files:** Determined during implementation session

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status |
|-------|------|----------|----------|--------|
| TC-AI-022-01 | Manual | P0 | TEAM plan: upscale button appears → upscaled image ≥3840px on long side | 🔲 |
| TC-AI-022-02 | Manual | P0 | FREE plan: upscale shows upgrade prompt | 🔲 |

---

## Definition of Done

- [ ] All ACs checked ✅ | `npm run check` ✅ | `npm run test:unit` ✅ | PR merged | [TASKS.md](./TASKS.md) checked

*Story created: 2026-04-28*
