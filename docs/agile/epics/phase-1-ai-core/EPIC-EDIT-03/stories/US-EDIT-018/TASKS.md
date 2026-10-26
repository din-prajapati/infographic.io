---
title: PR Task List — US-EDIT-018
type: tasks
updated: 2026-10-26
---

# PR Task List — US-EDIT-018 — Listing facts persist with the design

> **Branch:** `feat/edit/m-05-one-source-of-truth` (milestone branch)

## Four Pillars Pre-flight

- [x] **Brain** — STORY.md filled, 7 typed ACs
- [x] **Muscle** — T1–T4 below
- [x] **Map** — Context section; server text from `buildExpectedTexts`
- [x] **Env** — no environment or schema changes (`propertyData` is JSON)

## Task Breakdown

### T1 — Save and restore the listing (AC1–AC3)
`captureCanvasData` writes `listing`; `restoreCanvasData` resets and applies it before hydrating from slot text.

### T2 — Server returns what it printed (AC4)
Orchestrator stores `printedListing` with the variations; `getVariations` returns it as `listing`.

### T3 — Poster placement fills the fields (AC5, AC6)
AIChatBox → Template → CenterCanvas → `loadAiVariationToCanvas(…, listing)`; fill when slot layers were removed.

### T4 — Poster note in the sidebar (AC7)

## Gates

- [ ] Gate 1 — `npm run check`, `npm run test:unit`, `npm run test:unit:client`
- [ ] Gate 2 — TC-EDIT-018-07 in Chrome
