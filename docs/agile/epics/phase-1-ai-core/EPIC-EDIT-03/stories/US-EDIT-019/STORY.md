---
title: Story Card — US-EDIT-019
type: story
tags: [orion, edit, templates, binding]
updated: 2026-10-26
---

# Story Card — US-EDIT-019 — One fact per template element

> **Status:** 🔲 Not Started
> **Epic:** [EPIC-EDIT-03](../../EPIC.md)
> **Milestone:** [M-EDIT-05-one-source-of-truth](../../milestones/M-EDIT-05-one-source-of-truth.md)
> **Linear:** LIN-XXX
> **Size:** M
> **Engine:** Claude (primary)
> **Created:** 2026-10-26 | **Closed:** —

```yaml
depends_on: [US-EDIT-014]
owns:
  - api/scripts/data/premium-templates.data.ts
  - client/src/lib/canvasTypes.ts            # optional slotFormat on elements
  - client/src/lib/listingBindings.ts
  - client/src/lib/__tests__/**
  - api/tests/**
verification:
  - npm run check
  - npm run test:unit
  - npm run test:unit:client
operator:
  - seed-premium-templates.ts --refresh on dev/staging, then production (user approval)
risk: medium
```

---

## User Story

**As** a listing agent,
**I want** each fact on a template to sit in its own text layer,
**so that** typing my name does not erase my RERA number, and typing my phone does not leave `[Your email]` behind.

---

## Context

Found in M-EDIT-05 Gate 2 (2026-10-26). Several template lines hold more than one fact or a fixed label
around a fact: `[Your name] · RERA [Your RERA number]`, `[Your phone] · [Your email]`,
`By [Your name] · [Your brand]`, `RERA: [Your RERA number] · [Your brand]`, `• [Feature]…`,
`Beds: [n]…Price: [Price]`, `Schedule a Site Visit · [Your phone]`. A field write replaces the whole line.

Fix in the data, not in a token-replacement rule: one fact per element, and an optional `slotFormat`
(`"RERA {}"`, `"• {}"`) for a fixed label around the value.

---

## Acceptance Criteria

- [x] **AC1 [happy-path]:** No seeded template has a slot-tagged text element whose placeholder holds more
      than one fact. Each split-out fact gets its own element and slot, inside the original line's area.
- [x] **AC2 [happy-path]:** An element may carry `slotFormat` with one `{}`. A field write renders
      `slotFormat` around the value; for a multi-line value (features) it applies per line. An empty value
      writes empty.
- [x] **AC3 [happy-path]:** Hydration and canvas write-back strip the `slotFormat` label before storing, so
      `RERA PRM/KA/1` stores `PRM/KA/1` and `RERA [Your RERA number]` stores empty.
- [x] **AC4 [error-path]:** Text that no longer matches its `slotFormat` (the user rewrote the label on the
      canvas) is stored as typed — nothing is dropped, nothing throws.
- [x] **AC5 [happy-path]:** Placeholder words that name no field are removed rather than kept as fake
      content (`— [What makes this location worth noting]`, `— [Configuration]`).
- [ ] **AC6 [happy-path]:** `seed-premium-templates.ts --refresh` updates the five rows on dev/staging and
      production; verified at the data layer.

---

## Out of Scope

- Open House date/time and Market Report lines (`[DAY DATE]…`, `[Metric]…`, `[PERIOD]…`) — no field owns them.
- User-saved designs and templates (no migration, D4).

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|:--------:|----------|:------:|---------|
| TC-EDIT-019-01 | Unit (api) | P0 | For every seeded template, no slot-tagged text element contains two bracketed tokens unless its slot has no field | ✅ | Fails on the old data with the 11 mixed lines, passes on the new |
| TC-EDIT-019-02 | Unit | P0 | Given `slotFormat: "RERA {}"`, When license `PRM/KA/1` is written, Then content is `RERA PRM/KA/1` | ✅ |  |
| TC-EDIT-019-03 | Unit | P0 | Given `"• {}"`, When features Pool, Garage are written, Then content is `• Pool\n• Garage` | ✅ |  |
| TC-EDIT-019-04 | Unit | P0 | Given `RERA [Your RERA number]` with the format, When hydrated, Then license is empty; `RERA PRM/KA/1` gives `PRM/KA/1` | ✅ |  |
| TC-EDIT-019-05 | Unit | P1 | Given content that does not match the format, When written back, Then the field holds the content as typed | ✅ |  |
| TC-EDIT-019-06 | Manual | P0 | Chrome: Story template — name, phone and RERA typed in the Agent tab each show in their own place | ✅ | Story footer: `Priya Shah | +91 98200 12345 | RERA PRM/KA/0001`; reopen stored license bare |
| TC-EDIT-019-07 | Data | P0 | After `--refresh`, each DB has 5 premium rows and the split elements present | ⚠️ | dev/staging (`ep-billowing-cell`) refreshed 2026-10-26: 5 curated rows, 7 split ids, 7 slotFormats, 0 old lines. Production pending approval |

---

## Definition of Done

- [ ] All ACs checked ✅
- [ ] All test cases run and recorded
- [ ] Gate 1 passes
- [ ] Gate 2 passes (TC-EDIT-019-06, TC-EDIT-019-07)
- [ ] PR merged (milestone PR #_____)
- [ ] [TASKS.md](./TASKS.md) task list fully checked
- [ ] STORY.md status updated to ✅ Done

---

*Story created: 2026-10-26*
