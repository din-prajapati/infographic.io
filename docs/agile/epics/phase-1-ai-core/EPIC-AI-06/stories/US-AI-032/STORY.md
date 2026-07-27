# US-AI-032 — Hybrid Render: Text-Free Background + Editable Canvas Text Overlay

> **Epic:** [EPIC-AI-06](../../EPIC.md) · **Milestone:** [M-AI-18](../../milestones/M-AI-18-editable-text-overlay.md)
> **Size:** L · **Status:** 🔲 Not Started
> **Depends on:** US-AI-031, US-DESIGN-012 (slot infrastructure)

---

## Story

As an **agent who spots a typo or wants to tweak a headline after generation**, I want **the infographic text to be editable elements on the canvas instead of baked pixels**, so that **I can fix and restyle text instantly without regenerating (and without paying for another generation)**.

## Acceptance Criteria (draft — deep-fill via /new-story before implementation)

- [ ] **AC1 [happy-path]:** "Editable" generation mode: the AI generates the background/layout with NO text baked in (json_prompt text elements omitted or replaced with placement-only obj elements)
- [ ] **AC2 [happy-path]:** Each text value (headline, price, address, stats, agent) is placed as a canvas slot element (`slot` tags from US-DESIGN-012) positioned/styled from the V4 json_prompt element descriptions
- [ ] **AC3 [happy-path]:** Result opens directly in the editor; sidebar slot sections edit each value live
- [ ] **AC4 [regression]:** Export matches the composed preview at full resolution
- [ ] **AC5 [edge-case]:** Flat (current) mode remains available; user chooses per generation
- [ ] **AC6 [error-path]:** When the V4 json_prompt is missing a slot's position/style description or returns malformed element data, that slot renders with a safe default placement/style instead of crashing the editor or silently dropping the value.

## Out of Scope

- Font matching to the AI's rendered typography beyond family/weight approximation
- Editing the background image itself (EPIC-AI-04)

## Why This Matters

This is the epic's moat story: output that is simultaneously AI-designed, exact-text-guaranteed, and user-editable — structurally unavailable in Ideogram (flat raster) and Canva (no listing pipeline).

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-AI-032-01 | Manual | P0 | Generate in editable mode → background has no baked-in text; slot elements appear for each value | 🔲 | |
| TC-AI-032-02 | Manual | P0 | Open result in editor → edit a slot value live (e.g. price) → change reflects immediately | 🔲 | |
| TC-AI-032-03 | Manual | P1 | Export an edited editable-mode design → export matches composed preview at full resolution | 🔲 | |
| TC-AI-032-04 | Manual | P1 | Generate in flat (current) mode → unchanged existing behavior, no slots created | 🔲 | |
| TC-AI-032-05 | Manual | P2 | Generate with a V4 json_prompt missing a slot's position/style data → slot renders with a safe default, no crash, no dropped value | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

> ⚠️ **Harden note:** This story is a draft stub (no "Primary Files Touched"/Engineering section, no TASKS.md) — the header's own "deep-fill via /new-story before implementation" still applies. Harden certified AC-type coverage only; run `/new-story` (or story-writer) for full elaboration before `/implement-story`.

---

*Created: 2026-07-03*
