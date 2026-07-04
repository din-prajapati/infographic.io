# US-AI-033 — Synthetic-Content Guard

> **Epic:** [EPIC-AI-06](../../EPIC.md) · **Milestone:** [M-AI-17](../../milestones/M-AI-17-real-photo-background.md)
> **Size:** M · **Status:** 🔲 Not Started

---

## Story

As a **brokerage compliance officer (and as the product protecting its users)**, I want **generations for real listings to never contain AI-invented faces or property imagery presented as real**, so that **agents don't unknowingly publish misrepresentative marketing**.

## Acceptance Criteria (draft — deep-fill via /new-story before implementation)

- [ ] **AC1** — Agent headshot: only the profile photo from the agent profile is used; if none exists, no face is rendered (prompt-level: no "agent portrait" elements in json_prompt)
- [ ] **AC2** — Property imagery: when no listing photo is uploaded, the output is clearly stylized/illustrative OR the user is prompted to upload a real photo — no photorealistic fake houses on listing-type generations
- [ ] **AC3** — Verify/repair layer extended to strip face/portrait elements the magic-prompt conversion invents
- [ ] **AC4** — Demo/template generations (no real listing) exempt — guard applies to listing-type generations only

## Out of Scope

- Legal disclaimer text on outputs (US-KIT-006 compliance layer)
- Content moderation of user-uploaded photos

## Evidence

The 2026-07-03 E2E test (`APP-TEST-e2e-result.png`) rendered a synthetic male headshot labeled "JOHN SMITH" — a fabricated face on real-agent marketing.

---

*Created: 2026-07-03*
