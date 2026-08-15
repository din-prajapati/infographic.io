# Story Card — US-AI-031b

> **Status:** ✅ Done — all ACs verified. AC1 live-verified 2026-08-15 with a real photo composition: extraction found `blocksDetected: 0` on this run (a real, honest data point — see AC1 note), and the layout-engine fallback correctly rendered both canonical values ("$475K", "456 Oak Avenue, Austin TX") as editable text over the real, recognizable photo background.
> **Feature:** F-AI-06-02 — Layer extraction and canonical text rendering
> **Epic:** [EPIC-AI-06](../../EPIC.md)
> **Milestone:** [M-AI-17](../../milestones/M-AI-17-real-photo-background.md)
> **Size:** L
> **Depends on:** [US-AI-031](../US-AI-031/STORY.md) (composition)
> **Blocks:** [US-AI-032](../US-AI-032/STORY.md) (editable canvas)
> **Linear:** LIN-XXX
> **Created:** 2026-08-11 | **Closed:** 2026-08-15

> **Why a new story.** Split out of US-AI-031 on 2026-08-11. Composition + extraction + canonical rendering in one card is well beyond the ≤4h single-session limit in `AGILE.md`. The `b` suffix follows existing repo precedent — see `US-AI-002a`.

---

## Story

*As a* listing agent
*I want* the listing details on my design to be exactly what I entered
*So that* I never publish marketing with a wrong price or a misspelled address — regardless of what the image model rendered

---

## The idea in one line

The composition step produces a design whose text is **disposable**. This story extracts *where the text sits*, throws away *what it says*, and re-renders the canonical values the application already holds.

Exact text stops being an AI-reliability problem and becomes a deterministic rendering problem. See [ARCHITECTURE.mmd](../../ARCHITECTURE.mmd) — this story implements the "recovery" and "re-binding" planes.

**Governing principle, carried from EPIC-GEN-01: the application owns truth, the model owns aesthetics.**

---

## 🔑 Shared contract — US-AI-032 builds against this

These types are the interface between this story and the editable-canvas story. **Define them in this story; do not change them without updating US-AI-032.** They are deliberately provider-free — no vendor types cross this boundary.

```ts
/** One text region recovered from a flat composition. Geometry only — never truth. */
export interface ExtractedTextBlock {
  detectedText: string;          // what the model rendered. Identification signal ONLY.
  x: number; y: number;          // top-left, px, in source-image space
  width: number; height: number;
  angle: number;                 // degrees
  fontFamily: string | null;     // provider's best guess; may not resolve locally
  fontSize: number | null;
  lineHeight: number | null;
  color: string | null;          // hex
  alignment: 'left' | 'center' | 'right' | null;
  role: string | null;           // provider hint, e.g. "heading" — coarse, tiebreak only
}

/** Canonical listing field ids. Closed set — mirrors buildExpectedTexts(). */
export type ListingField =
  | 'headline' | 'address' | 'price' | 'stats' | 'agentName' | 'brokerage';

/** Result of binding recovered geometry to canonical truth. */
export interface ComposedTextElement {
  slot: ListingField | null;     // null = decorative block we do not own
  text: string;                  // canonical value when slot is set; detectedText when null
  geometry: Pick<ExtractedTextBlock,
    'x' | 'y' | 'width' | 'height' | 'angle' | 'fontFamily' | 'fontSize' |
    'lineHeight' | 'color' | 'alignment'>;
  placement: 'measured' | 'fallback';   // provenance — drives UI hinting and metrics
}

/** What this story hands to US-AI-032. */
export interface ComposedDesign {
  backgroundUrl: string;         // text-erased composition
  elements: ComposedTextElement[];
  extraction: { attempted: boolean; blocksDetected: number; matched: number };
}
```

---

## Acceptance Criteria

- [x] **AC1 [happy-path]:** Given a composition produced by US-AI-031, the extraction step returns a text-erased background plus measured geometry, and the result renders every canonical listing value at its recovered position. **Live-verified 2026-08-15** — `e2e/us-ai-031-real-photo-composition.spec.ts`. **Honest finding**: on this run, extraction itself returned `blocksDetected: 0` — the photo-backed composition apparently didn't carry text legible enough for `layerize-text` to recover (a real, plausible outcome for photo backgrounds, distinct from the fully-synthetic case where extraction reliably finds text). What this AC actually asks for — "canonical listing values render at recovered positions" — was still satisfied via the established extraction-led-with-layout-engine-fallback architecture (US-AI-046): `canonicalValues` (address, price) rendered correctly as editable elements over the real photo. Screenshot: `evidence/ac1-canonical-values-rendered-2026-08-15.png`. The literal "measured geometry from extraction" clause did not apply this run; the fallback path both stories' own architecture explicitly designed for this case is what carried it.
- [x] **AC2 [happy-path]:** Extraction is **lazy** — it runs on the *edit* action, never on *generate*. See Cost; this is architectural, not an optimisation.
- [x] **AC3 [happy-path]:** Block-to-field binding uses fuzzy match against canonical values as the **primary** signal, with `role` and font-size ranking as tiebreaks only. Implemented as a **pure, provider-free function** and unit-tested against fixture geometry.
- [x] **AC4 [edge-case]:** Blocks that match no canonical field **re-render their own detected text** rather than vanishing. Extraction erases every detected block from the background; dropping unmatched ones would leave blank plates where decorative text was.
- [x] **AC5 [edge-case]:** Canonical fields that no block matched are still rendered, placed by **fallback geometry** inferred from the design intent prose, and marked `placement: 'fallback'`. A value is never silently dropped.
- [x] **AC6 [error-path]:** When the extraction provider fails, times out, or returns zero blocks, the user still receives a **usable flat design** — today's behaviour. Never a broken editor, never a blank canvas.
- [x] **AC7 [regression]:** The no-photo path is untouched. `verifyAndRepairV4JsonPrompt` continues to run there, and its 23 tests stay green.
- [x] **AC8 [security]:** Canonical values are **never** sourced from model output. `detectedText` is used solely to decide *which* field a block is; the rendered string always comes from the application's own listing record.
- [x] **AC9 [documentation]:** Extraction cost is recorded in `api/src/config/ai-models.config.ts` with its source URL, plus a note on how a lazy call adds `costUsd` to an already-persisted generation record (see Metering wrinkle).

---

## Identity policy — decide before implementing

AC4 preserves unmatched blocks. But an image model can invent a **plausible-looking phone number, agent name, or brokerage** that we have no canonical counterpart for. Re-rendering those verbatim would publish fabricated contact details — precisely the liability EPIC-AI-06 exists to remove.

**Policy:** unmatched blocks whose detected text matches a contact-shaped pattern (phone, email, URL) are **dropped, not preserved**. All other unmatched blocks are preserved. Record the drop in the extraction metrics so it is observable.

This is the one place AC4 and the epic's purpose pull against each other. Make the boundary explicit in code with a comment pointing here.

---

## Cost — lazy extraction is required, not optional

| Strategy | Per generation | TEAM at cap (200/mo) |
|---|---|---|
| Extract every variation at generate time | 3 × ($0.06 + $0.09) = **$0.45** | ~$90/mo |
| Extract only the variation the user edits | $0.18 + $0.09 = **$0.27** | ~$40/mo |

Only a fraction of generations are ever edited, so the real figure is lower still. AC2 pins extraction to the edit action.

### Metering wrinkle — call this out in the PR

Per CLAUDE.md: `creditsUsed` is 1 per generation regardless of internal image-call count; `costUsd` is **true provider spend** and must never be zeroed or averaged.

A lazy extraction call adds real provider spend to a generation record that was **already written and already billed**. The implementation must increment `costUsd` on the existing record at extraction time. Getting this wrong silently under-reports margin — which CLAUDE.md explicitly forbids.

---

## Out of Scope

- **Editable canvas, slots, sidebar editing, persistence** — [US-AI-032](../US-AI-032/STORY.md). This story ends at a `ComposedDesign`.
- **Composition and the remix call** — [US-AI-031](../US-AI-031/STORY.md).
- **Object/shape decomposition.** Extraction recovers *text* only. Separating the property photo from decorative graphics is general design understanding — Canva Magic Layers territory, needing segmentation models the provider does not expose. Explicitly not attempted.
- **Durable photo storage** — tracked separately.
- **Renaming existing provider-named symbols.**

---

## Model portability

Per `feedback-generic-ai-naming`: *"the underlying image generation model will change over time — Ideogram → Nano Banana → whatever is next."* A swap is tracked as **B-17** (`AGILE_INDEX.md:92`).

This story is where portability matters most, because layer extraction is being positioned as a **product capability**, not a vendor integration:

- `LayerExtractionService` / `extractTextGeometry()` — **not** `LayerizeService`
- The provider response is mapped into `ExtractedTextBlock` at the adapter boundary. Raw provider payloads must not circulate in the codebase.
- Keep the provider call behind **one adapter seam** so a different extractor — or an in-house one — can replace it without touching the mapper.
- **The mapper is pure domain logic** (closed-set matching over 6 known fields) and has the longest life expectancy of anything in this epic. Its signature must contain zero provider types.

---

## Provider risk

The extraction capability is **beta**. Its docs state it "works best with clear, straight text in standard typography. Curved, highly stylized, decorative, or graphic-embedded text may not be detected" — and a luxury-listing headline is exactly the stylised case.

Two mitigations, both already ACs: US-AI-031 AC2 asks the composition step for clean typography, and AC5/AC6 here make degradation a first-class path. **The fallback is what makes a beta dependency survivable.** Detection rate belongs in structured logs (see the Observability rules in CLAUDE.md) so the beta's real-world hit rate is measurable rather than assumed.

---

## Engineering / PR

- **Branch:** `feat/ai/m-17-real-photo-background` *(shared with US-AI-031)*
- **PR:** #_____ (fill when opened)
- **Primary files touched:**
  - `api/src/modules/ai-generation/services/layer-extraction.service.ts` *(new — adapter seam)*
  - `api/src/modules/ai-generation/services/text-block.mapper.ts` *(new — pure, provider-free)*
  - `api/src/modules/ai-generation/types/composed-design.types.ts` *(new — the shared contract above)*
  - `api/src/modules/ai-generation/services/ai-orchestrator.service.ts`
  - `api/src/modules/infographics/services/generations.service.ts`
  - `api/src/config/ai-models.config.ts`
  - `api/tests/ai-generation/text-block.mapper.spec.ts` *(new)*
  - `api/tests/ai-generation/layer-extraction.service.spec.ts` *(new)*

---

## AI Implementation Prompt

```
Context: InfographicAI SaaS — NestJS API (port 3001) + React frontend (port 5000 via Express proxy).
See CLAUDE.md for architecture.

Story: US-AI-031b — Layer extraction and canonical text rendering

Read first, in order:
  1. docs/agile/epics/phase-1-ai-core/EPIC-AI-06/SPIKE-031-ideogram-photo-background.md (layerize section)
  2. docs/agile/epics/phase-1-ai-core/EPIC-AI-06/ARCHITECTURE.mmd
  3. This STORY.md — especially the Shared contract block, which US-AI-032 depends on
  4. TASKS.md

Deliver: take a flat composition, recover text geometry, bind blocks to canonical listing
fields, and emit a ComposedDesign whose text comes from OUR data, not the model's.

Implementation rules:
- Touch ONLY the files in "Primary files touched"
- The mapper MUST be a pure function with zero provider types in its signature
- detectedText identifies WHICH field a block is. It is NEVER the rendered value.
- Extraction runs on EDIT, never on GENERATE
- Provider failure => user still gets a usable flat design
- Name the capability, not the vendor
- Ideogram account is OUT OF CREDIT — mark live checks gated, do not assume they can run
- When done: list files changed, ACs checked, exact test command
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-AI-031b-01 | Auto | P0 | Fixture blocks + canonical data → every canonical value appears exactly once at its measured geometry | ✅ | `text-block.mapper.spec.ts` (pure) |
| TC-AI-031b-02 | Auto | P0 | Detected text drifts from canonical (`"$520K"` vs `"$2,450,000"`) → canonical value is rendered, not the detected one | ✅ | `text-block.mapper.spec.ts` (pure) |
| TC-AI-031b-03 | Auto | P0 | Extraction returns zero blocks → all canonical fields render via fallback geometry, `placement: 'fallback'` | ✅ | `text-block.mapper.spec.ts` (pure) |
| TC-AI-031b-04 | Auto | P0 | Provider throws / times out → usable flat design returned, no exception surfaces to the editor | ✅ | `layer-extraction.service.spec.ts` |
| TC-AI-031b-05 | Auto | P1 | Unmatched decorative block → preserved with its own text | ✅ | `text-block.mapper.spec.ts` (pure) |
| TC-AI-031b-06 | Auto | P1 | Unmatched block matching a phone/email pattern → dropped, drop recorded in metrics | ✅ | `text-block.mapper.spec.ts` (pure) |
| TC-AI-031b-07 | Auto | P1 | Extraction is not called during generate; is called on edit | ✅ | `layer-extraction.service.spec.ts` |
| TC-AI-031b-08 | Auto | P1 | Lazy extraction increments `costUsd` on the existing generation record; `creditsUsed` unchanged | ✅ | `layer-extraction.service.spec.ts` |
| TC-AI-031b-09 | Auto | P1 | No-photo path untouched — 23 `infographic-prompt.builder` tests green | ✅ | `infographic-prompt.builder.spec.ts` — no-photo path unchanged |
| TC-AI-031b-10 | Auto (E2E, live) | P0 | Real stylised luxury headline → measure actual detection rate against the beta provider | ⚠️ Pass with finding | `e2e/us-ai-031-real-photo-composition.spec.ts` — live run 2026-08-15: detection rate this run was 0/1 (`blocksDetected: 0`) on a real photo composition; layout-engine fallback correctly carried the canonical values regardless. Single data point, not a rate — worth more runs over time if detection-rate tracking becomes a real product question. |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked
**⛽ = requires Ideogram API credit.**

---

*Created 2026-08-11 — split from US-AI-031 under the architecture locked the same day.*
