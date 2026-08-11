# US-AI-033 — Synthetic-Content Guard

> **Epic:** [EPIC-AI-08](../../EPIC.md) · **Milestone:** — (undecided; assign when the scope review resolves)
> **Size:** M · **Status:** 🔲 Not Started — ⚠️ **scope under review, do not implement as written** (see [Scope review](#scope-review--2026-08-07-not-decided))
> **Decision trigger:** revisit when real user demand appears; see the review below for what is and is not worth building
> **Backlog ref:** B-18

> **Moved to the Phase 4 backlog 2026-08-11.** Previously sat in EPIC-AI-06 / M-AI-17. It was holding that milestone open: M-AI-17's Definition of Done carried a synthetic-content line that only this story could satisfy, so the milestone could never close on the strength of US-AI-031 and US-AI-031b alone — even though this story has no agreed scope to build. A milestone blocked by an undecided story tracks nothing useful. The scope review below is unchanged and still governs; nothing here is decided by the move.

---

## Story

As a **brokerage compliance officer (and as the product protecting its users)**, I want **generations for real listings to never contain AI-invented faces or property imagery presented as real**, so that **agents don't unknowingly publish misrepresentative marketing**.

## Scope review — 2026-08-07 (NOT DECIDED)

> **Status of this section:** analysis only. No AC below has been changed, no decision taken. The
> story owner is holding it to see whether real users ask for it. Recorded so the reasoning is not
> re-derived from scratch later.

### The story's framing is wrong: the axis is *attribution*, not *synthesis*

The title says "no fake faces/buildings". But plenty of fabricated imagery is exactly what a
marketing asset should contain — a family on a sofa, a couple at a viewing, an illustrative
skyline on a market report. Banning synthetic content bans normal marketing design.

The harm in the Evidence section below was never *"a face was generated"*. It was **a generated
face captioned "JOHN SMITH"** — a synthetic person presented as a specific named real one. That is
identity misattribution. Three buckets, not two:

| Bucket | Synthetic OK? | Why |
|---|---|---|
| **Identity slots** — `agent.photo`, agent name, RERA ID | ❌ Never | A fabricated face under a real agent's name is the actual liability |
| **Lifestyle / illustrative humans** | ✅ Yes | Makes no claim about any real person — this is what marketing imagery *is* |
| **Property imagery** | Depends | Constrained only when the asset claims a *specific listing* |

AC4 already gestures at this (*"demo/template generations exempt"*) but buries it as an exception
instead of making it the organising principle.

### AC-by-AC verdict

| AC | Verdict | Reasoning |
|----|---------|-----------|
| **AC1** — no invented agent portrait | 🟢 **Keep the negative half only** | *"Do not emit a portrait element unless a real photo exists"* is a one-line prompt directive. Its **positive** half — *"use the profile photo from the agent profile"* — is **unreachable**: no agent headshot exists in the generation path (see dependency below). Ship suppression; drop sourcing. |
| **AC2** — no photorealistic fake houses | 🔴 **Cut** | Largely delivered by US-AI-031 — a real photo background means no invented house. What remains is unmeasurable (*"clearly stylized"* has no test) and actively harmful: it blocks the illustrative imagery market reports, tips and festival posts legitimately need (US-KIT-005). |
| **AC3** — strip invented faces in verify/repair | 🟢 **Keep — this is the one that matters** | Prompt instructions are advisory; the model ignores them sometimes. That is precisely why `verifyAndRepairV4JsonPrompt` exists. AC3 is the only thing that **guarantees** the outcome, and the machinery is already built. **If only one AC survives, make it this one.** |
| **AC4** — demo/template exempt | 🔴 **Not an AC** | A scoping condition on the others, not testable behaviour of its own. |
| **AC5** — block if a face survives the strip | 🔴 **Cut** | Guards against a bug in our own strip pass, and introduces a path where a legitimate generation is refused. Do not add a false-block risk to defend code we control. |

### Dependency that makes AC1's happy path dead today

AC1 reads *"only the profile photo from the agent profile is used; if none exists, no face is
rendered."* In the generation path **no such photo can exist**:

- `AGENT_SLOT_FIELDS` (`TemplateSlotSection.tsx:63-70`) **does** define `agent.photo` with
  `control: "image"` — but that is the **canvas-template** path only.
- `useAgentStore` — what actually feeds AI generation — holds name, phone, email, brokerage,
  website, license, `logoPreview`. **No photo field.**

So AC1 permanently resolves to its degraded branch. Same shape as the dead ACs harden caught in
US-PANEL-01 and US-GEN-003. An **agent-profile feature** (headshot upload, and possibly social
handles as on-asset content) is the prerequisite for AC1 having a happy path — and US-PANEL-01
already deferred the brand-colour picker to exactly that future story. `logoPreview` is the
pattern to copy for an image on the agent store.

**Note:** suppression does *not* need that feature. It works with no headshot on file. The agent
profile is what later upgrades "no face" into "your actual face".

### If it is built, what it becomes

**One rule: never fabricate a human face in an identity slot.** Prompt-level suppression plus a
strip pass in the layer that already performs this class of repair. Touches the same two files as
US-AI-031 (`infographic-prompt.builder.ts`, the verify/repair layer), so there is little marginal
cost running them together.

**Size drops M → S: ~6–8h → ~2–3h.** That also revises the EPIC-AI-06 MVP slice
(US-AI-031 + trimmed US-AI-033) from ~16–20h to **~12–15h**.

**Keep the story ID rather than folding it into US-AI-031.** It is a compliance item, EPIC-AI-06
and ROADMAP both reference it, and when someone asks *"what stops us putting fake faces on real
agents' marketing?"* the answer should be a story with evidence attached, not a line buried in
another story's ACs.

### Open questions if it is picked up

1. **Where is the line for property imagery on non-listing assets?** Market reports, tips and
   festival posts want illustrative buildings. The discriminator already exists — the extractor
   returns `listingType: for_sale | for_rent | sold`, and the taxonomy separates
   `curated-market-report` from listing formats.
2. **AC2's "clearly stylized" is untestable.** For a listing with no photo, pick one: *block and
   prompt for upload*, or *render deliberately non-photographic*. Leaving both makes it a coin
   flip at implementation time.

---

## Acceptance Criteria (draft — deep-fill via /new-story before implementation)

> ⚠️ **Unchanged and not yet re-scoped** — read the Scope review above before implementing any of
> these. AC1's positive half and ACs 2/4/5 are all flagged there.

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
