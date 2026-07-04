# US-KIT-001 — Kit Orchestration: One Extraction → Multi-Format Asset Batch

> **Epic:** [EPIC-KIT-01](../../EPIC.md) · **Milestone:** [M-KIT-01](../../milestones/M-KIT-01-kit-engine.md)
> **Size:** L · **Status:** 🔲 Not Started

---

## Story

As a **solo agent with a new listing**, I want **one input to produce every marketing format I need (IG post, story, A4 flyer, WhatsApp card, email header)**, so that **listing marketing takes 3 minutes instead of 2 hours of per-format work in Canva**.

## Acceptance Criteria (draft — deep-fill via /new-story before implementation)

- [ ] **AC1** — `Kit` + `KitAsset` records (Prisma): one kit groups N assets, each with format, status, imageUrl
- [ ] **AC2** — Kit generation runs ONE extraction + ONE headline call, then fans out per-format generations (format-specific orientation/resolution + prompt variant from `infographic-prompt.builder`)
- [ ] **AC3** — Exact-text verification passes on every asset independently
- [ ] **AC4** — Usage accounting: kit consumption against plan credits defined and enforced (product decision: 1 kit = N credits or 1 kit-credit)
- [ ] **AC5** — Partial failure tolerated: failed asset marked, others complete; retry per asset

## Out of Scope

- Kit UI (US-KIT-002) · preview/finalize flow (US-KIT-003) · scheduling/auto-posting

---

*Created: 2026-07-03*
