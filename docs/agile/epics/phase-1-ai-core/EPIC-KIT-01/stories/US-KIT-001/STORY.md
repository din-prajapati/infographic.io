# US-KIT-001 — Kit Orchestration: One Extraction → Multi-Format Asset Batch

> **Epic:** [EPIC-KIT-01](../../EPIC.md) · **Milestone:** [M-KIT-01](../../milestones/M-KIT-01-kit-engine.md)
> **Size:** L · **Status:** 🔲 Not Started

---

## Story

As a **solo agent with a new listing**, I want **one input to produce every marketing format I need (IG post, story, A4 flyer, WhatsApp card, email header)**, so that **listing marketing takes 3 minutes instead of 2 hours of per-format work in Canva**.

## Acceptance Criteria (draft — deep-fill via /new-story before implementation)

- [ ] **AC1 [happy-path]:** `Kit` + `KitAsset` records (Prisma): one kit groups N assets, each with format, status, imageUrl
- [ ] **AC2 [happy-path]:** Kit generation runs ONE extraction + ONE headline call, then fans out per-format generations (format-specific orientation/resolution + prompt variant from `infographic-prompt.builder`)
- [ ] **AC3 [regression]:** Exact-text verification passes on every asset independently
- [ ] **AC4 [edge-case]:** Usage accounting: kit consumption against plan credits defined and enforced (product decision: 1 kit = N credits or 1 kit-credit)
- [ ] **AC5 [error-path]:** Partial failure tolerated: failed asset marked, others complete; retry per asset

## Out of Scope

- Kit UI (US-KIT-002) · preview/finalize flow (US-KIT-003) · scheduling/auto-posting

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-KIT-001-01 | Manual | P0 | Trigger kit generation for a listing → one Kit + N KitAsset records created, one per format | 🔲 | |
| TC-KIT-001-02 | Manual | P0 | Kit generation runs exactly one extraction + one headline call, then fans out per-format image generations | 🔲 | |
| TC-KIT-001-03 | Manual | P1 | Each asset in the kit independently passes exact-text verification | 🔲 | |
| TC-KIT-001-04 | Manual | P1 | Generate a kit → plan credits decrement per the defined kit-consumption policy | 🔲 | |
| TC-KIT-001-05 | Manual | P1 | Force one format's generation to fail → that asset is marked failed, remaining assets complete, failed asset is retryable individually | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

> ⚠️ **Harden note:** This story is a draft stub (no "Primary Files Touched"/Engineering section, no TASKS.md) — deep-fill via `/new-story` recommended before `/implement-story`.

---

*Created: 2026-07-03*
