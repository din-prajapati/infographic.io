# US-KIT-006 — Compliance Layer

> **Epic:** [EPIC-KIT-01](../../EPIC.md) · **Milestone:** [M-KIT-02](../../milestones/M-KIT-02-retention-content.md)
> **Size:** M · **Status:** 🔲 Not Started

---

## Story

As an **agent subject to RERA/MLS/brokerage rules**, I want **my license number, required disclaimers, and brokerage marks automatically on every asset**, so that **nothing I publish gets me fined or reprimanded — without me remembering the rules per format**.

## Acceptance Criteria (draft)

- [ ] **AC1 [happy-path]:** Agent profile gains compliance fields: license/RERA number, brokerage disclaimer text, required marks
- [ ] **AC2 [happy-path]:** When set, compliance text is appended to every generation's expected texts and verified like any other exact string
- [ ] **AC3 [edge-case]:** Placement: small footer text/marks that don't compete with marketing content (prompt-level placement guidance)
- [ ] **AC4 [regression]:** Per-format presence check: 100% of kit assets carry compliance text when profile fields are set
- [ ] **AC5 [error-path]:** When an org's compliance fields are required (e.g. BROKERAGE-tier policy) but a required field is missing or empty on the agent profile, generation is blocked with a clear prompt to complete the field, rather than shipping an asset silently missing compliance text.

## Out of Scope

- Jurisdiction rule database (user enters their own required text) · legal review of defaults

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-KIT-006-01 | Manual | P0 | Set license number + disclaimer + marks on agent profile → fields save correctly | 🔲 | |
| TC-KIT-006-02 | Manual | P0 | Generate an asset with compliance fields set → compliance text appears and passes exact-text verification | 🔲 | |
| TC-KIT-006-03 | Manual | P1 | Generate across all kit formats → compliance text placed as small footer text, doesn't overlap marketing content | 🔲 | |
| TC-KIT-006-04 | Manual | P1 | Generate a full kit with compliance fields set → 100% of assets carry the compliance text | 🔲 | |
| TC-KIT-006-05 | Manual | P1 | Attempt generation for a BROKERAGE-tier agent with a required compliance field left empty → generation blocked with a prompt to complete it | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

> ⚠️ **Harden note:** This story is a draft stub (no "Primary Files Touched"/Engineering section, no TASKS.md) — deep-fill via `/new-story` recommended before `/implement-story`.

---

*Created: 2026-07-03*
