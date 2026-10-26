---
title: Story Card — US-EDIT-015
type: story
tags: [orion, edit, sidebar, binding]
updated: 2026-10-25
---

# Story Card — US-EDIT-015 — Lane A: one form per fact in the sidebar

> **Status:** 🔲 Not Started — **blocked on US-EDIT-014 merging**
> **Epic:** [EPIC-EDIT-03](../../EPIC.md)
> **Milestone:** [M-EDIT-05-one-source-of-truth](../../milestones/M-EDIT-05-one-source-of-truth.md)
> **Linear:** LIN-XXX
> **Size:** M
> **Stage:** Lane A — worktree `../bg-canvas`, supervised (the only lane a user sees immediately)
> **Engine:** Claude (primary)
> **Created:** 2026-10-25 | **Closed:** —

```yaml
depends_on: [US-EDIT-014]      # merged, not promised
owns:
  - client/src/components/editor/RightSidebar.tsx
  - client/src/components/editor/PropertyDetailsForm.tsx
  - client/src/components/editor/AgentInfoForm.tsx
  - client/src/components/editor/TemplateSlotSection.tsx
may_read:
  - client/src/lib/listingBindings.ts
forbidden:
  - client/src/lib/**                        # Foundation
  - client/src/components/canvas/**          # Lane B
  - client/src/components/editor/CustomizePanel.tsx   # Lane C deletes it
verification:
  - npm run check
  - npm run test:unit:client
risk: medium        # user-visible sidebar change
```

---

## User Story

**As** a listing agent,
**I want** one input per listing fact in the Property and Agent tabs,
**so that** I never see two different prices for the same listing.

---

## Context

`RightSidebar.tsx` renders *Template Content* (`TemplateSection` with `PROPERTY_SLOT_FIELDS`) and then
`PropertyDetailsForm` in the same panel (around `:1357-1367`); the Agent tab does the same with
`AGENT_SLOT_FIELDS` and `AgentInfoForm` (around `:1371-1381`). Per D1/D2 the forms win; Template
Content keeps only the fields the forms do not have.

| Template Content field | After this story |
|---|---|
| Headline, Price, Location, Key Facts, Specs, Description, Features | **Removed** — edited in `PropertyDetailsForm` |
| Agent Name, Phone, Email, RERA ID | **Removed** — edited in `AgentInfoForm` |
| Hero Image, Secondary Image, Open House Date/Time, Report Headline/KPIs/Period | **Kept** — no form counterpart |
| Agent Photo, Call-to-Action Text | **Kept** — no form counterpart |
| Brand / Agency Name (Design tab) | **Removed** — the agency name is the Agent tab's Brokerage field (Q2) |
| Brand logo, accent colour (Design tab) | **Unchanged** |

---

## Acceptance Criteria

- [ ] **AC1 [happy-path]:** The Property tab renders exactly **one** price input and the Agent tab
      exactly **one** agent-name input.
- [ ] **AC2 [happy-path]:** A value typed in `PropertyDetailsForm` or `AgentInfoForm` reaches the canvas
      through `writeFieldToCanvas` — the canvas price matches the typed price — in one Undo step.
- [ ] **AC3 [happy-path]:** The fields listed as **Kept** above still render and still edit their
      canvas layers directly, so the Open House and Market Report templates stay fully editable.
- [ ] **AC4 [happy-path]:** The agency name has one editor: typing in the Agent tab's **Brokerage**
      field changes the agency name on *Luxury Home Showcase* and *MLS Listing Sheet*, and the Design
      tab no longer shows a Brand / Agency Name field. Brand logo and accent colour stay in the Design
      tab, unchanged (Q2).
- [ ] **AC5 [error-path]:** The fabricated sample hints in `TemplateSlotSection.tsx` are gone —
      "Skyline Signature Residences", "From ₹1.18 Cr", "Sarjapur Road, Bengaluru", "3 BHK · 2,480
      sq.ft", "Aisha Sharma", "+91 90000 00000", "agent@agency.in", the sample RERA id, "Skyline
      Realty". Neutral bracketed hints replace them (BL-40 convention).
- [ ] **AC6 [error-path]:** A canvas with no slot tags degrades to today's behaviour (the forms render;
      Template Content does not), not to an empty tab.

---

## Out of Scope

- `client/src/lib/**` (Foundation) and canvas components (Lane B).
- Renaming tabs (spec §9.1).

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|:--------:|----------|:------:|---------|
| TC-EDIT-015-01 | Manual | P0 | Given a premium template, When the Property tab is read, Then exactly one price input exists | 🔲 | |
| TC-EDIT-015-02 | Manual | P0 | Given the price input, When `₹85,00,000` is typed, Then the canvas price reads `₹85,00,000`, and one Undo reverts it | 🔲 | |
| TC-EDIT-015-03 | Manual | P0 | Given *Open House Flyer* and *Market Report*, When their tabs are opened, Then the date / report fields are present and edit the canvas | 🔲 | |
| TC-EDIT-015-04 | Unit | P1 | Given `TemplateSlotSection.tsx`, When its hints are scanned, Then none of the fabricated strings remain | 🔲 | |
| TC-EDIT-015-05 | Manual | P1 | Given a blank canvas, When the Property tab opens, Then the form renders and nothing errors | 🔲 | |
| TC-EDIT-015-06 | Manual | P0 | Given *Luxury Home Showcase*, When Brokerage is typed in the Agent tab, Then the agency name on the canvas changes and the Design tab shows no agency-name field | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [ ] All ACs checked ✅
- [ ] All test cases run and recorded
- [ ] Gate 1 passes (`npm run check`, `npm run test:unit:client`)
- [ ] Gate 2 passes (runbook MV-05-01, MV-05-03, exported file opened)
- [ ] PR merged (milestone PR #_____)
- [ ] [TASKS.md](./TASKS.md) task list fully checked
- [ ] STORY.md status updated to ✅ Done

---

*Story created: 2026-10-25*
