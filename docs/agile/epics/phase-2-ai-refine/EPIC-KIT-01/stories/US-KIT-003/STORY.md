# US-KIT-003 — Preview/Finalize Cost Flow

> **Epic:** [EPIC-KIT-01](../../EPIC.md) · **Milestone:** [M-KIT-01](../../milestones/M-KIT-01-kit-engine.md)
> **Size:** M · **Status:** 🔲 Not Started

---

## Story

As **the product owner watching COGS**, I want **variations generated as cheap Turbo previews with only the user's chosen design re-rendered at full quality**, so that **users get better final quality at ~⅓ of the naive cost** ($0.09 previews + $0.06–0.10 final ≈ $0.19 vs $0.54 for 3× Quality).

## Acceptance Criteria (draft)

- [ ] **AC1 [happy-path]:** Variation requests render at TURBO regardless of selected tier; marked `isPreview` on the record
- [ ] **AC2 [happy-path]:** "Use this design" re-renders the chosen variation's json_prompt at the user's tier (DEFAULT/QUALITY); V4 seed/style consistency preserved as closely as the API allows
- [ ] **AC3 [regression]:** Usage record reflects actual per-image costs (preview + final), not flat per-generation estimate
- [ ] **AC4 [edge-case]:** UX: previews visibly labeled; finalize step < 15s
- [ ] **AC5 [edge-case]:** Applies to both single generations and kits
- [ ] **AC6 [error-path]:** If the full-quality re-render fails after the user selects "Use this design", the user sees a clear error with a retry option — the low-quality preview is never silently promoted to final output.

## Out of Scope

- Plan price changes · caching/dedup of identical prompts (Phase 3)

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-KIT-003-01 | Manual | P0 | Request variations → all render at TURBO and are marked `isPreview: true` regardless of the user's plan tier | 🔲 | |
| TC-KIT-003-02 | Manual | P0 | Select "Use this design" → chosen variation re-renders at the user's actual tier with preserved style/seed | 🔲 | |
| TC-KIT-003-03 | Manual | P1 | After preview + finalize, UsageRecord cost reflects real preview + final costs, not a flat estimate | 🔲 | |
| TC-KIT-003-04 | Manual | P1 | Previews are visibly labeled in the UI; finalize completes in under 15s | 🔲 | |
| TC-KIT-003-05 | Manual | P1 | Run the preview→finalize flow inside a kit generation, not just a single generation | 🔲 | |
| TC-KIT-003-06 | Manual | P1 | Force the final re-render to fail → user sees an error with retry, preview is never silently used as the final output | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

> ⚠️ **Harden note:** This story is a draft stub (no "Primary Files Touched"/Engineering section, no TASKS.md) — deep-fill via `/new-story` recommended before `/implement-story`.

---

*Created: 2026-07-03*
