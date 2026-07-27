# US-AI-031 — Real Listing Photo as Generation Background

> **Epic:** [EPIC-AI-06](../../EPIC.md) · **Milestone:** [M-AI-17](../../milestones/M-AI-17-real-photo-background.md)
> **Size:** L · **Status:** 🔲 Not Started
> **Depends on:** US-AI-010 (photo upload, EPIC-AI-02)

---

## Story

As a **listing agent**, I want **my actual property photo used as the infographic background**, so that **my marketing shows the real home I'm selling — not an AI-invented building I could be liable for misrepresenting**.

## Acceptance Criteria (draft — deep-fill via /new-story before implementation)

- [ ] **AC1 [happy-path]:** Generation request accepts an uploaded photo reference (from US-AI-010 storage); when present, the output background is recognizably that photo
- [ ] **AC2 [happy-path]:** V4 json_prompt background element references the photo (Ideogram image-reference/remix/edit — API approach to be spiked first)
- [ ] **AC3 [regression]:** Exact-text verification (`verifyAndRepairV4JsonPrompt`) still passes on photo-backed generations
- [ ] **AC4 [edge-case]:** Without an uploaded photo, behavior falls back to current pipeline unchanged
- [ ] **AC5 [documentation]:** Photo-backed generation cost documented in ai-models.config (reference/edit pricing differs from plain generate)
- [ ] **AC6 [error-path]:** When the referenced photo cannot be retrieved or is invalid at generation time (deleted, corrupted, unsupported format reaching the image API), the request fails with a clear user-facing error rather than silently falling back to a fabricated background.

## Out of Scope

- Photo upload UI/storage (US-AI-010)
- Editable text overlay (US-AI-032)
- Photo enhancement (EPIC-AI-04)

## Spike Needed

Which Ideogram capability fits best: V4 image reference vs Instructional Edit ($0.20 flat) vs V3 style reference ($0.10–0.20). Compare cost + fidelity before writing TASKS.md.

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-AI-031-01 | Manual | P0 | Generate with an uploaded photo reference → output background is recognizably that photo | 🔲 | |
| TC-AI-031-02 | Manual | P0 | Photo-backed generation still produces exact-text-matching V4 output (`verifyAndRepairV4JsonPrompt` passes) | 🔲 | |
| TC-AI-031-03 | Manual | P1 | Generate with no uploaded photo → current (non-photo) pipeline behavior unchanged | 🔲 | |
| TC-AI-031-04 | Manual | P1 | Generate with a deleted/invalid photo reference → clear user-facing error, no fabricated fallback background | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

> ⚠️ **Harden note:** This story is a draft stub (no "Primary Files Touched"/Engineering section, no TASKS.md) — the header's own "deep-fill via /new-story before implementation" still applies. Harden certified AC-type coverage only; run `/new-story` (or story-writer) for full elaboration before `/implement-story`.

---

*Created: 2026-07-03*
