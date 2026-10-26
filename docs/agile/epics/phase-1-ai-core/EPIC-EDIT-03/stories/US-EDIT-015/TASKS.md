---
title: PR Task List — US-EDIT-015
type: tasks
updated: 2026-10-25
---

# PR Task List — US-EDIT-015 — Lane A · sidebar

> **Branch:** `feat/edit/m05-la-sidebar` (worktree `../bg-canvas`), squash into the milestone branch
> **Scope:** one input per fact in the Property and Agent tabs

---

## Four Pillars Pre-flight

- [ ] **Brain** — STORY.md filled, 6 typed ACs
- [ ] **Muscle** — T1–T4 below
- [ ] **Map** — runbook §Stage 3 · Lane A
- [ ] **Env** — no environment changes

---

## Task Breakdown

### T1 — Trim the field catalogues
In `TemplateSlotSection.tsx`, remove the Property/Agent fields that the forms own (STORY.md table); keep Hero/Secondary image, Open House, Report, Agent Photo, CTA. Replace the fabricated hints (AC5). Remove `brand.name` from `BRAND_SLOT_FIELDS` — the agency name is the Agent tab's Brokerage field (Q2); logo and accent colour stay.

### T2 — Forms write through the binding
`PropertyDetailsForm` / `AgentInfoForm` call `writeFieldToCanvas` for every bound field on change.

### T3 — Sidebar render rules
`RightSidebar.tsx`: Template Content renders only when the canvas has slots **and** a kept field applies; the forms always render (AC6).

### T4 — Test
Unit test for AC5 (fabricated hints absent). Manual checks per TC table.

---

## Gates

- [ ] Gate 1 — `npm run check`, `npm run test:unit:client`
- [ ] Gate 2 — runbook MV-05-01 and MV-05-03 in Chrome, exported file opened
