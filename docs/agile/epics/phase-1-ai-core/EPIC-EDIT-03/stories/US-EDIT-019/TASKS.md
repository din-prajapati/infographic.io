---
title: PR Task List — US-EDIT-019
type: tasks
updated: 2026-10-26
---

# PR Task List — US-EDIT-019 — One fact per template element

> **Branch:** `feat/edit/m-05-one-source-of-truth` (milestone branch)

## Four Pillars Pre-flight

- [x] **Brain** — STORY.md filled, 6 typed ACs
- [x] **Muscle** — T1–T4 below
- [x] **Map** — Context section lists every mixed line
- [x] **Env** — operator `--refresh` on both databases (production needs user approval)

## Task Breakdown

### T1 — `slotFormat` in the binding (AC2–AC4)
### T2 — Split the template lines (AC1, AC5)
### T3 — Data test over the seeded templates (TC-EDIT-019-01)
### T4 — `--refresh` dev/staging, then production on approval (AC6)

## Gates

- [ ] Gate 1 — `npm run check`, `npm run test:unit`, `npm run test:unit:client`
- [ ] Gate 2 — TC-EDIT-019-06 in Chrome; TC-EDIT-019-07 at the data layer
