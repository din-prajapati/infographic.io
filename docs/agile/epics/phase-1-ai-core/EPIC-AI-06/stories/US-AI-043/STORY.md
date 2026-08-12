# Story Card — US-AI-043

> **Status:** ✅ Implementation Complete (pre-PR)
> **Feature:** F-AI-06-04 — Layout engine (templates + flow renderer)
> **Epic:** [EPIC-AI-06](../../EPIC.md)
> **Milestone:** TBD — M-AI-17/18 are being re-scoped after the 2026-08-12 architecture change
> **Size:** L
> **Depends on:** [US-DEPLOY-007](../../../EPIC-DEPLOY-01/stories/US-DEPLOY-007/STORY.md) (client test infra) — ✅ Done
> **Blocks:** LLM layout planner (next story), pipeline integration
> **Linear:** LIN-XXX
> **Created:** 2026-08-12 | **Closed:** —

---

## Why this story exists

Two spikes on 2026-08-12 replaced this epic's mechanism.

**[OQ-2](../../../../../testing/reports/oq2-image-weight-2026-08-12/FINDINGS.md)** proved remix cannot preserve the property *and* compose a design at any `image_weight`. At 75 you get the photo and no design; at 30 you get a beautiful card of a different building, a fabricated agent face and an invented phone number. The middle is degenerate — at 65 the real photo carries illegible text and a wrong price.

**[The pure-canvas spike](../../../../../testing/reports/spike-pure-canvas-2026-08-12/FINDINGS.md)** proved the alternative works: keep the photograph as an untouched canvas layer, render design and copy as native objects over it. Zero fabrication, pixel-exact fidelity, $0 image-model cost, editable by construction.

It also proved the **LLM cannot place pixels**. It reasons about a photo correctly — *"the subject is the seating area and stairs, so the scrim goes left"* — but has no font metrics, so absolute coordinates collide: the constrained run rendered the headline and price on top of each other.

**Therefore the planner emits intent and the renderer computes geometry.** This story builds the renderer half — the part everything else depends on.

---

## Story

*As a* listing agent
*I want* my listing laid out cleanly whatever my photo and however long my text
*So that* my price is never overlapping my headline and my address is never running off the edge

---

## Scope

A **pure, deterministic layout engine**: given a template id, listing values and a canvas size, it returns positioned elements. No LLM call, no network, no canvas context required for the geometry.

This is the piece the spike's hand-authored composite proved out, generalised — and the piece the LLM must *not* do.

---

## Acceptance Criteria

- [x] **AC1 [happy-path]:** A template registry exports **at least 3** templates, each declaring named regions (e.g. `scrim`, `headlineBlock`, `statsBar`, `agentBlock`) as fractions of canvas size, so templates are resolution-independent.
- [x] **AC2 [happy-path]:** `layoutDesign(templateId, values, canvasSize, palette)` returns positioned elements carrying `slot`, `text`, geometry and style — consumable by `loadComposedDesignToCanvas` from [US-AI-032](../US-AI-032/STORY.md) without translation.
- [x] **AC3 [happy-path]:** Text is **measured and flowed**, not placed at fixed offsets. A long headline wraps and pushes subsequent elements down; a short one leaves the block compact. Measurement is injected so it is testable without a real canvas context.
- [x] **AC4 [error-path]:** **No two elements may ever overlap.** This is the defect that killed the LLM-coordinate approach. The engine must guarantee it structurally, and a test must assert non-overlap across the long/short/empty matrix in AC7.
- [x] **AC5 [edge-case]:** Text that cannot fit its region degrades deterministically — shrink within a declared range, then truncate with an ellipsis. It must **never** overflow the region, overlap a neighbour, or silently vanish.
- [x] **AC6 [edge-case]:** Missing or empty values collapse their block and reflow the rest. No gaps, no orphaned accent rules, no reserved space for absent content.
- [x] **AC7 [regression]:** A fixture matrix — every template × {long, typical, empty} values × {landscape, portrait, square} — produces valid non-overlapping layouts with every supplied value present exactly once.
- [x] **AC8 [documentation]:** Adding a template is documented as a data change, with the region schema specified. No renderer edits required for a new template.

---

## Explicitly not in this story

- **The LLM planner.** Template choice, scrim side and palette arrive as arguments. Selecting them is the next story.
- **Contrast safety against photo pixels.** Both spike planner runs put text over busy regions; the fix needs pixel sampling and belongs with the compositor.
- **Any image-model call.** This story makes no network requests.
- **Rendering to a real canvas.** `loadComposedDesignToCanvas` (US-AI-032) already consumes the element shape; this story produces it.
- **Removing the remix code.** US-AI-031's implementation stays on its branch pending the milestone re-scope decision.
- **Slot vocabulary changes** — `client/src/lib/slotIds.ts` is the source of truth.

---

## Design notes

**Regions as fractions, not pixels.** A template describes `{ x: 0.06, y: 0.26, w: 0.32 }`. Resolution-independence is what makes one template serve landscape, portrait and square, and it is why AC7 sweeps all three.

**Measurement must be injectable.** jsdom has no canvas (see [US-DEPLOY-007](../../../EPIC-DEPLOY-01/stories/US-DEPLOY-007/STORY.md)), so `layoutDesign` takes a `measureText` function. Production passes a real 2D context; tests pass a proportional stub. This is exactly the pattern `wrapTextToWidth` already uses in `canvasExport.ts`.

**Flow, don't position.** Each region stacks its children in order, measuring as it goes. That is what structurally guarantees AC4 — non-overlap becomes a property of the algorithm rather than something to check afterwards.

**Reuse what exists.** `wrapTextToWidth`, `TEXT_PAD_H` and `TEXT_PAD_TOP` were exported by US-DEPLOY-007 and are already unit-tested. Import them; do not reimplement.

---

## Engineering / PR

- **Branch:** `feat/ai/us-ai-043-layout-engine` *(based on `feat/deploy/us-deploy-007-client-test-infra`)*
- **PR:** #_____ (fill when opened)
- **Primary files touched:**
  - `client/src/lib/layout/templates.ts` *(new — registry, data only)*
  - `client/src/lib/layout/layoutEngine.ts` *(new — pure flow renderer)*
  - `client/src/lib/layout/types.ts` *(new — `Template`, `Region`, `LayoutInput`, `LayoutResult`)*
  - `client/src/lib/layout/__tests__/layoutEngine.spec.ts` *(new)*
  - `client/src/lib/layout/__tests__/templates.spec.ts` *(new)*
  - `docs/agile/epics/phase-1-ai-core/EPIC-AI-06/ARCHITECTURE.mmd`

---

## AI Implementation Prompt

```
Context: InfographicAI — React 18 + Vite client, Zustand canvas store, Tailwind.
See CLAUDE.md. Client tests run under client/vitest.config.ts (jsdom, no canvas).

Story: US-AI-043 — Layout engine (templates + flow renderer)

Read first:
  1. docs/testing/reports/spike-pure-canvas-2026-08-12/FINDINGS.md — why this exists
  2. This STORY.md, then TASKS.md
  3. client/src/lib/canvasExport.ts — wrapTextToWidth, TEXT_PAD_H, TEXT_PAD_TOP (reuse)
  4. client/src/lib/slotIds.ts — slot vocabulary

Deliver: a PURE layout engine. Given template id + values + canvas size, return
positioned, non-overlapping elements. No LLM, no network, no canvas context.

Rules:
- measureText is INJECTED — production passes a 2D context, tests pass a stub
- Regions are FRACTIONS of canvas size, never pixels
- Flow and measure; never fixed offsets. Non-overlap must be structural.
- Overflow degrades: shrink in range, then ellipsis. Never overflow or vanish.
- Adding a template must be a data change only
- Tests ship in the same commit as the code they cover (see the TASKS template)
- When done: list files, ACs ticked, exact test command, Gate 1 output
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-AI-043-01 | Auto | P0 | Typical values, each template → all slots present exactly once, none overlapping | 🔲 | |
| TC-AI-043-02 | Auto | P0 | Very long headline → wraps, pushes following blocks down, still no overlap | 🔲 | |
| TC-AI-043-03 | Auto | P0 | Full matrix (templates × long/typical/empty × 3 aspects) → no overlap anywhere | 🔲 | |
| TC-AI-043-04 | Auto | P0 | Text exceeding its region → shrinks then ellipsises; never exceeds region bounds | 🔲 | |
| TC-AI-043-05 | Auto | P1 | Empty agent/brokerage → block collapses, others reflow, no orphaned rule | 🔲 | |
| TC-AI-043-06 | Auto | P1 | Same input + same canvas → byte-identical output (determinism) | 🔲 | |
| TC-AI-043-07 | Auto | P1 | Portrait and square canvases → regions scale by fraction, no clipping | 🔲 | |
| TC-AI-043-08 | Auto | P2 | Output shape is accepted by `loadComposedDesignToCanvas` without translation | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

*Created 2026-08-12, replacing the remix mechanism disproven by OQ-2 the same day.*
