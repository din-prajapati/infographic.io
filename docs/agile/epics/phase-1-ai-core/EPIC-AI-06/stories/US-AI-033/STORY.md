# US-AI-033 — Synthetic-Content Guard

> **Epic:** [EPIC-AI-06](../../EPIC.md) · **Milestone:** [M-AI-17](../../milestones/M-AI-17-real-photo-background.md)
> **Size:** M · **Status:** 🔲 Not Started

---

## Story

As a **brokerage compliance officer (and as the product protecting its users)**, I want **generations for real listings to never contain AI-invented faces or property imagery presented as real**, so that **agents don't unknowingly publish misrepresentative marketing**.

## Acceptance Criteria (draft — deep-fill via /new-story before implementation)

- [ ] **AC1 [happy-path]:** Agent headshot: only the profile photo from the agent profile is used; if none exists, no face is rendered (prompt-level: no "agent portrait" elements in json_prompt)
- [ ] **AC2 [happy-path]:** Property imagery: when no listing photo is uploaded, the output is clearly stylized/illustrative OR the user is prompted to upload a real photo — no photorealistic fake houses on listing-type generations
- [ ] **AC3 [regression]:** Verify/repair layer extended to strip face/portrait elements the magic-prompt conversion invents
- [ ] **AC4 [edge-case]:** Demo/template generations (no real listing) exempt — guard applies to listing-type generations only
- [ ] **AC5 [error-path]:** If the magic-prompt conversion still produces a face/portrait element after the strip pass (guard failure) on a listing-type generation, the generation is blocked with a clear error rather than shipped to the user.

## Out of Scope

- Legal disclaimer text on outputs (US-KIT-006 compliance layer)
- Content moderation of user-uploaded photos

## Evidence

The 2026-07-03 E2E test (`APP-TEST-e2e-result.png`) rendered a synthetic male headshot labeled "JOHN SMITH" — a fabricated face on real-agent marketing.

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-AI-033-01 | Manual | P0 | Agent with no profile photo generates a listing → no face/portrait rendered anywhere in the output | 🔲 | |
| TC-AI-033-02 | Manual | P0 | Listing generation with no uploaded property photo → output is clearly stylized/illustrative, or user is prompted to upload a real photo | 🔲 | |
| TC-AI-033-03 | Manual | P1 | Run the JOHN SMITH-style regression prompt through the pipeline → verify/repair layer strips the invented face element before output | 🔲 | |
| TC-AI-033-04 | Manual | P2 | Generate a demo/template (non-listing) generation with a face element → guard does not block it (exempt) | 🔲 | |
| TC-AI-033-05 | Manual | P1 | Force a strip-pass failure on a listing-type generation → generation is blocked with an error, not shipped | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

> ⚠️ **Harden note:** This story is a draft stub (no "Primary Files Touched"/Engineering section, no TASKS.md) — deep-fill via `/new-story` recommended before `/implement-story`.

---

*Created: 2026-07-03*
