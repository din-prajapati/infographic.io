# Story Card — US-AI-031

> **Status:** 🟡 In Progress — AC2–AC7 verified; AC1 gated on Ideogram credit (TC-AI-031-01)
> **Feature:** F-AI-06-01 — Real property photo as composition source
> **Epic:** [EPIC-AI-06](../../EPIC.md)
> **Milestone:** [M-AI-17](../../milestones/M-AI-17-real-photo-background.md)
> **Size:** L
> **Depends on:** US-AI-010 (photo upload plumbing) — ✅ Done
> **Blocks:** [US-AI-031b](../US-AI-031b/STORY.md) (layer extraction), [US-AI-032](../US-AI-032/STORY.md) (editable canvas)
> **Linear:** LIN-XXX
> **Created:** 2026-07-03 | **Rewritten:** 2026-08-11 | **Closed:** —

---

## ⚠️ Rewritten 2026-08-11 — read before comparing to git history

The original ACs described something the image provider's API cannot do. [SPIKE-031](../../SPIKE-031-ideogram-photo-background.md) established that **no endpoint accepts both a structured `json_prompt` and an input image.** `json_prompt` exists only on `/v1/ideogram-v4/generate` and `/magic-prompt`; every image-conditioned endpoint (V3/V4 remix, `/v1/edit`, replace-background, reframe) takes a plain text prompt.

| Old AC | Fate |
|---|---|
| AC2 — "json_prompt background element references the photo" | **Deleted.** Structurally impossible. |
| AC3 — "`verifyAndRepairV4JsonPrompt` still passes on photo-backed generations" | **Split.** It cannot run on the photo path at all. Becomes AC3 here (no-photo path unchanged); the exact-text guarantee moves to [US-AI-031b](../US-AI-031b/STORY.md), where the application typesets text itself. |
| AC5 — "reference/edit pricing differs from plain generate" | **Inverted.** The spike proves remix is priced at generate tier. That finding is now the documentation AC. |

The epic's guarantee did not weaken — it moved. Exact text stops being something we hope the image model renders correctly and becomes something the application renders deterministically. See [ARCHITECTURE.mmd](../../ARCHITECTURE.mmd).

---

## Story

*As a* listing agent
*I want* my actual property photo to be the source image the design is composed around
*So that* my marketing shows the real home I am selling — not an AI-invented building I could be liable for misrepresenting

---

## Scope

This story delivers **composition only**. A real photo goes in; a flat design containing the real house comes out.

**Text correctness is explicitly not this story's problem.** The composition step may render approximate, misspelled or reflowed text — that text is discarded downstream by [US-AI-031b](../US-AI-031b/STORY.md), which extracts geometry and re-renders canonical values. Reviewers must not reject this story for imperfect text in its output.

---

## Acceptance Criteria

- [ ] **AC1 [happy-path]:** When a photo reference is supplied, it is sent as the **source image** to the composition provider's remix capability, and the resulting composition contains the recognizable actual property — not a stylistic lookalike.
- [x] **AC2 [happy-path]:** The composition prompt requests clean, straight, standard typography. This is *not* for text correctness (that text is discarded) but for **downstream detectability** — layer extraction in US-AI-031b degrades badly on curved or decorative type.
- [x] **AC3 [regression]:** The **no-photo path is byte-identical to today.** The existing structured-prompt pipeline and `verifyAndRepairV4JsonPrompt` are untouched, and all 23 existing tests in `api/tests/ai-generation/infographic-prompt.builder.spec.ts` pass unchanged.
- [x] **AC4 [error-path]:** When a photo reference is supplied but the file cannot be retrieved, **the generation fails with a clear user-facing error.** It must never silently proceed to produce a fabricated property. See "Behaviour change" — this inverts current production behaviour.
- [x] **AC5 [security]:** `photoReference` is validated as a UUID + permitted extension before reaching any filesystem call. Today it is `@IsString()` only (`api/src/modules/infographics/dto/generate-from-chat.dto.ts:111-113`) and flows into `path.join(PHOTO_UPLOADS_DIR, ...)` → `fs.readFileSync` (`api/src/modules/ai-generation/services/ideogram.service.ts:125`, `:242`), so a `../../` value reads arbitrary files.
- [x] **AC6 [documentation]:** `api/src/config/ai-models.config.ts` records the remix cost **with its source URL**, in the same evidence style as the existing `V4_MAGIC_PROMPT_COST` comment. It must state the spike's finding that remix is priced at generate tier — photo-backed composition is **cost-neutral** — and that the $0.20 flat instructional-edit path was rejected on unit economics.
- [x] **AC7 [edge-case]:** The `style_reference_images` append in the V4 generate path (`ideogram.service.ts:239-250`) is **removed.** That endpoint's documented parameters do not include it, so the attach is likely a silent no-op. Record the link to the open `TC-AI-010-02` verification below.

---

## Behaviour change — must appear in the PR body

Both current attach sites catch a missing photo, log a warning, and continue:

```ts
// ideogram.service.ts:130-133
// Non-fatal: file may have expired or path is wrong — proceed without reference
```

The result is a generation that produces **a fabricated house and reports success.** For a product whose premise is depicting the real listing, that is a trust and liability defect, and it is live on `main` today.

AC4 inverts it. Existing US-AI-010 users whose generations previously degraded silently will now see hard failures. That is the correct outcome, but it is user-visible and must be stated explicitly, not slipped in.

---

## Open verification this story may resolve

`TC-AI-010-02` is parked open on [US-AI-010](../../../EPIC-AI-02/stories/US-AI-010/STORY.md) with the recorded hypothesis that a 1×1 px PNG fixture caused the failure.

The spike surfaces a **more likely cause**: `style_reference_images` is not a documented parameter of `/v1/ideogram-v4/generate`, so the unexpected multipart field may be rejecting the whole request. AC7 removes that field. If `TC-AI-010-02` passes afterwards with an unchanged fixture, the fixture theory was wrong and the hypothesis recorded on US-AI-010 should be corrected.

---

## Out of Scope

- **Layer extraction, geometry recovery, canonical text rendering** — [US-AI-031b](../US-AI-031b/STORY.md). This story's output is still a flat raster.
- **Editable canvas, slots, persistence** — [US-AI-032](../US-AI-032/STORY.md).
- **Durable photo storage.** Photos live in `os.tmpdir()` with no DB record or TTL; Railway's filesystem is ephemeral, so a redeploy or restart orphans every upload. Tracked separately — must **not** be absorbed here. AC4 handles the *symptom* (fail loudly); it does not fix the storage layer.
- **Synthetic-content guard** — US-AI-033, scope under review.
- **Renaming existing provider-named symbols** (`ideogram.service.ts`, `IDEOGRAM_API_KEY`). New names follow the rule below; a rename sweep is separate unscoped work.
- **Changing the default variation count.** Flagged for the owner below, not silently changed.

---

## Model portability

Per the recorded team rule `feedback-generic-ai-naming`: *"the underlying image generation model will change over time — Ideogram → Nano Banana → whatever is next. Baking the vendor name into schema fields or service names creates churn."*

Load-bearing here, not cosmetic. The epic's moat is deliberately model-independent: *every generated listing contains the customer's actual property photo and authoritative listing data, while the final design remains editable.* A provider swap is already tracked as **B-17** (`AGILE_INDEX.md:92`).

- **New** symbols name the capability, not the vendor — e.g. `composeWithSourceImage()`, never anything containing "ideogram".
- Provider specifics (endpoint URL, multipart field names, `rendering_speed` values) live behind **one seam** rather than spreading through the orchestrator.
- **Do not rename** existing symbols — an accurate file list matters more than purity.
- Endpoint URLs and the spike's cost citations stay literal. They are vendor facts.

---

## Cost note (flagged for the owner — not implemented here)

Photo-backed compositions pin the background, so N variations buy far less differentiation than for fully synthetic generations, at exactly N× cost. `api/src/modules/infographics/services/generations.service.ts:192` currently defaults `variations || 3`.

Per the spike, a photo-mode default of 1 moves TEAM-at-cap provider spend from **$36/mo to $12/mo** — a larger lever than the endpoint choice. Left as an owner decision rather than changed inside this story.

---

## Engineering / PR

- **Branch:** `feat/ai/m-17-real-photo-background`
- **PR:** #_____ (fill when opened)
- **Primary files touched:**
  - `api/src/modules/ai-generation/services/ideogram.service.ts`
  - `api/src/modules/ai-generation/services/ai-orchestrator.service.ts`
  - `api/src/modules/infographics/dto/generate-from-chat.dto.ts`
  - `api/src/modules/infographics/services/generations.service.ts`
  - `api/src/config/ai-models.config.ts`
  - `api/src/config/image-generation.config.ts`
  - `api/tests/ai-generation/ideogram.service.spec.ts` *(new — no test exists for this service today)*
  - `api/tests/ai-generation/infographic-prompt.builder.spec.ts`

---

## AI Implementation Prompt

```
Context: InfographicAI SaaS — NestJS API (port 3001) + React frontend (port 5000 via Express proxy).
See CLAUDE.md for architecture.

Story: US-AI-031 — Real property photo as composition source

Read first, in order:
  1. docs/agile/epics/phase-1-ai-core/EPIC-AI-06/SPIKE-031-ideogram-photo-background.md
     (authoritative on API capability and cost — section 7 has the file-level change list)
  2. docs/agile/epics/phase-1-ai-core/EPIC-AI-06/ARCHITECTURE.mmd
  3. This STORY.md, then TASKS.md

Deliver: a real uploaded photo becomes the SOURCE IMAGE for a remix call, producing a flat
composition containing the actual house. Text correctness is NOT this story's problem — a
sibling story re-renders canonical text from extracted geometry.

Implementation rules:
- Touch ONLY the files in "Primary files touched"
- Do NOT implement anything in "Out of Scope" — especially durable photo storage
- The no-photo path must be byte-identical: all 23 existing infographic-prompt.builder tests
  pass unchanged
- Photo present but unreadable => THROW. Never warn-and-continue. This inverts current
  behaviour on purpose.
- New names describe the capability, not the vendor. Do not rename existing symbols.
- The Ideogram account is OUT OF CREDIT — do not write code that assumes a live generation can
  be run to verify. Mark such checks as gated.
- When done: list files changed, ACs checked, and the exact test command to run
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-AI-031-01 | Manual ⛽ | P0 | Generate with a real listing photo → composition contains the recognizable actual property | 🔲 | Gated on credit top-up |
| TC-AI-031-02 | Auto | P0 | Photo reference present but file absent → generation throws a clear error; no image call is made | 🔲 | |
| TC-AI-031-03 | Auto | P0 | No photo reference → request path and payload identical to today; all 23 builder tests green | 🔲 | |
| TC-AI-031-04 | Auto | P0 | `photoReference` = `"../../etc/passwd"` → rejected by DTO validation before any filesystem call | 🔲 | |
| TC-AI-031-05 | Auto | P1 | V4 generate payload no longer contains a `style_reference_images` field | 🔲 | |
| TC-AI-031-06 | Auto | P1 | Composition prompt contains the clean-typography instruction | 🔲 | |
| TC-AI-031-07 | Manual ⛽ | P1 | Re-run `TC-AI-010-02` with the unchanged fixture → settles fixture theory vs undocumented-parameter theory | 🔲 | Gated on credit top-up |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked
**⛽ = requires Ideogram API credit.** The account is currently out of credit; these are gated, consistent with how `TC-AI-010-02` is parked on US-AI-010.

---

*Created 2026-07-03 · Rewritten 2026-08-11 after SPIKE-031 and the architecture lock.*
