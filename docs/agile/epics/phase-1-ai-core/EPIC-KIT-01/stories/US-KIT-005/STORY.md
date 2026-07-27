# US-KIT-005 — Recurring Content Engine

> **Epic:** [EPIC-KIT-01](../../EPIC.md) · **Milestone:** [M-KIT-02](../../milestones/M-KIT-02-retention-content.md)
> **Size:** L · **Status:** 🔲 Not Started

---

## Story

As a **solo agent between listings**, I want **branded content (market updates, festival posts, tips) generated for me proactively every month**, so that **I stay visible to my audience — and keep paying for the product — during the 27 days a month I have nothing to list**.

## Why This Story Exists

This is the SOLO churn-killer identified in the 2026-07-03 strategy session: agents have 1–3 listings/month; subscriptions survive on what the product does *between* them. Canva requires the agent to make this content; we deliver it unprompted.

## Acceptance Criteria (draft)

- [ ] **AC1 [happy-path]:** Monthly content set auto-generated per user from their profile (name, photo, brand colors, service area): market-update template + 2–3 seasonal/festival posts
- [ ] **AC2 [happy-path]:** Surfaced in-app ("Your July content is ready") — push/email later
- [ ] **AC3 [regression]:** Market-update numbers: manual entry first (data feed integration out of scope); rendered exactly via verify layer
- [ ] **AC4 [edge-case]:** COGS budget: ≤ $0.20/user/month at Turbo preview quality until user finalizes
- [ ] **AC5 [edge-case]:** Opt-out per user
- [ ] **AC6 [error-path]:** When a user's profile is missing required fields (e.g., no brand colors or service area) at monthly-generation time, that user is skipped for the run with a logged reason rather than generating with broken defaults or halting the batch job for other users.

## Out of Scope

- Market data feed integration (EPIC-AI-05 market data) · auto-posting · email delivery infra

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-KIT-005-01 | Manual | P0 | Monthly job runs for an eligible user → market-update + 2-3 seasonal posts generated from their profile | 🔲 | |
| TC-KIT-005-02 | Manual | P0 | Log in after the monthly run → "Your {month} content is ready" surfaced in-app | 🔲 | |
| TC-KIT-005-03 | Manual | P1 | Enter market-update numbers manually → rendered exactly on the asset (verify layer) | 🔲 | |
| TC-KIT-005-04 | Manual | P1 | Run the monthly batch → per-user COGS stays ≤ $0.20 at Turbo preview quality pre-finalize | 🔲 | |
| TC-KIT-005-05 | Manual | P1 | User opts out → excluded from the next monthly run | 🔲 | |
| TC-KIT-005-06 | Manual | P1 | Run the monthly batch for a user missing brand colors/service area → that user is skipped with a logged reason, other users' runs unaffected | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

> ⚠️ **Harden note:** This story is a draft stub (no "Primary Files Touched"/Engineering section, no TASKS.md) — deep-fill via `/new-story` recommended before `/implement-story`.

---

*Created: 2026-07-03*
