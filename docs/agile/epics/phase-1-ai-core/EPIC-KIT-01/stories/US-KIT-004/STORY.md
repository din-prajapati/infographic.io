# US-KIT-004 — Listing Lifecycle Assets

> **Epic:** [EPIC-KIT-01](../../EPIC.md) · **Milestone:** [M-KIT-02](../../milestones/M-KIT-02-retention-content.md)
> **Size:** M · **Status:** 🔲 Not Started
> **Depends on:** US-KIT-001

---

## Story

As a **listing agent**, I want **Just Listed → Open House → Price Improved → Just Sold assets generated from the listing I already entered**, so that **each milestone of the sale gets marketing without re-entering anything**.

## Acceptance Criteria (draft)

- [ ] **AC1 [happy-path]:** Listing (kit) has a lifecycle stage; changing it offers stage-specific asset generation (banner text, badge, urgency styling per stage)
- [ ] **AC2 [happy-path]:** Stage assets reuse the original extraction + brand profile; only stage-dependent text/badges change
- [ ] **AC3 [regression]:** Open House stage accepts date/time; rendered exactly (verify layer)
- [ ] **AC4 [edge-case]:** Just Sold auto-suggests a "sold" variant of the hero asset
- [ ] **AC5 [error-path]:** When the Open House stage is selected without a date/time provided, generation is blocked with a validation error instead of producing an asset with a missing or placeholder date.

## Out of Scope

- MLS status sync (future integration) · scheduling

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-KIT-004-01 | Manual | P0 | Change a listing's lifecycle stage → stage-specific asset generation options appear (banner/badge/urgency styling) | 🔲 | |
| TC-KIT-004-02 | Manual | P0 | Generate a stage asset → original extraction + brand profile reused, only stage text/badges differ | 🔲 | |
| TC-KIT-004-03 | Manual | P1 | Set Open House stage with a date/time → rendered exactly on the asset (verify layer) | 🔲 | |
| TC-KIT-004-04 | Manual | P1 | Move a listing to Just Sold → a "sold" variant of the hero asset is auto-suggested | 🔲 | |
| TC-KIT-004-05 | Manual | P1 | Select Open House stage without providing a date/time → generation blocked with a validation error | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

> ⚠️ **Harden note:** This story is a draft stub (no "Primary Files Touched"/Engineering section, no TASKS.md) — deep-fill via `/new-story` recommended before `/implement-story`.

---

*Created: 2026-07-03*
