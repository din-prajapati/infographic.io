# US-KIT-003 — Preview/Finalize Cost Flow

> **Epic:** [EPIC-KIT-01](../../EPIC.md) · **Milestone:** [M-KIT-01](../../milestones/M-KIT-01-kit-engine.md)
> **Size:** M · **Status:** 🔲 Not Started

---

## Story

As **the product owner watching COGS**, I want **variations generated as cheap Turbo previews with only the user's chosen design re-rendered at full quality**, so that **users get better final quality at ~⅓ of the naive cost** ($0.09 previews + $0.06–0.10 final ≈ $0.19 vs $0.54 for 3× Quality).

## Acceptance Criteria (draft)

- [ ] **AC1** — Variation requests render at TURBO regardless of selected tier; marked `isPreview` on the record
- [ ] **AC2** — "Use this design" re-renders the chosen variation's json_prompt at the user's tier (DEFAULT/QUALITY); V4 seed/style consistency preserved as closely as the API allows
- [ ] **AC3** — Usage record reflects actual per-image costs (preview + final), not flat per-generation estimate
- [ ] **AC4** — UX: previews visibly labeled; finalize step < 15s
- [ ] **AC5** — Applies to both single generations and kits

## Out of Scope

- Plan price changes · caching/dedup of identical prompts (Phase 3)

---

*Created: 2026-07-03*
