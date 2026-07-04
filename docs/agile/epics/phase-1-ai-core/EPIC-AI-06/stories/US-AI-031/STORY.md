# US-AI-031 — Real Listing Photo as Generation Background

> **Epic:** [EPIC-AI-06](../../EPIC.md) · **Milestone:** [M-AI-17](../../milestones/M-AI-17-real-photo-background.md)
> **Size:** L · **Status:** 🔲 Not Started
> **Depends on:** US-AI-010 (photo upload, EPIC-AI-02)

---

## Story

As a **listing agent**, I want **my actual property photo used as the infographic background**, so that **my marketing shows the real home I'm selling — not an AI-invented building I could be liable for misrepresenting**.

## Acceptance Criteria (draft — deep-fill via /new-story before implementation)

- [ ] **AC1** — Generation request accepts an uploaded photo reference (from US-AI-010 storage); when present, the output background is recognizably that photo
- [ ] **AC2** — V4 json_prompt background element references the photo (Ideogram image-reference/remix/edit — API approach to be spiked first)
- [ ] **AC3** — Exact-text verification (`verifyAndRepairV4JsonPrompt`) still passes on photo-backed generations
- [ ] **AC4** — Without an uploaded photo, behavior falls back to current pipeline unchanged
- [ ] **AC5** — Photo-backed generation cost documented in ai-models.config (reference/edit pricing differs from plain generate)

## Out of Scope

- Photo upload UI/storage (US-AI-010)
- Editable text overlay (US-AI-032)
- Photo enhancement (EPIC-AI-04)

## Spike Needed

Which Ideogram capability fits best: V4 image reference vs Instructional Edit ($0.20 flat) vs V3 style reference ($0.10–0.20). Compare cost + fidelity before writing TASKS.md.

---

*Created: 2026-07-03*
