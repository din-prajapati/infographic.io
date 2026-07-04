# US-AI-032 — Hybrid Render: Text-Free Background + Editable Canvas Text Overlay

> **Epic:** [EPIC-AI-06](../../EPIC.md) · **Milestone:** [M-AI-18](../../milestones/M-AI-18-editable-text-overlay.md)
> **Size:** L · **Status:** 🔲 Not Started
> **Depends on:** US-AI-031, US-DESIGN-012 (slot infrastructure)

---

## Story

As an **agent who spots a typo or wants to tweak a headline after generation**, I want **the infographic text to be editable elements on the canvas instead of baked pixels**, so that **I can fix and restyle text instantly without regenerating (and without paying for another generation)**.

## Acceptance Criteria (draft — deep-fill via /new-story before implementation)

- [ ] **AC1** — "Editable" generation mode: the AI generates the background/layout with NO text baked in (json_prompt text elements omitted or replaced with placement-only obj elements)
- [ ] **AC2** — Each text value (headline, price, address, stats, agent) is placed as a canvas slot element (`slot` tags from US-DESIGN-012) positioned/styled from the V4 json_prompt element descriptions
- [ ] **AC3** — Result opens directly in the editor; sidebar slot sections edit each value live
- [ ] **AC4** — Export matches the composed preview at full resolution
- [ ] **AC5** — Flat (current) mode remains available; user chooses per generation

## Out of Scope

- Font matching to the AI's rendered typography beyond family/weight approximation
- Editing the background image itself (EPIC-AI-04)

## Why This Matters

This is the epic's moat story: output that is simultaneously AI-designed, exact-text-guaranteed, and user-editable — structurally unavailable in Ideogram (flat raster) and Canva (no listing pipeline).

---

*Created: 2026-07-03*
