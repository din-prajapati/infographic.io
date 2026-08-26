---
title: Story Card — US-EDIT-006
type: story
tags: [orion, edit, canvas, brand]
updated: 2026-08-26
---

# Story Card — US-EDIT-006

> **Status:** 🔲 Not Started
> **Epic:** [EPIC-EDIT-03](../../EPIC.md)
> **Milestone:** [M-EDIT-02-brand-layers](../../milestones/M-EDIT-02-brand-layers.md)
> **Size:** M
> **Created:** 2026-08-26 | **Closed:** —

---

## Story

*As* a real-estate agent
*I want* my brokerage logo and licence number to appear on every generated design as real,
movable canvas elements
*So that* the design is publishable as **mine** without me pasting anything on by hand — and I can
reposition them when the AI's composition puts them somewhere awkward

---

## Context

Verified 2026-08-26 (`infographic-prompt.builder.ts`): the image prompt asks the model for the
headline, price, address, facts, agent name and brokerage — but **never** for a logo, headshot,
QR code or licence number. Those are not baked into the raster; they are **absent from the
product**. `useAgentStore` already holds `license` and `logoPreview`, and neither ever reaches the
canvas.

This story is therefore purely additive. It does not compete with the model's typography, does
not touch extraction, and does not touch any credit or gating path. See
[M-EDIT-02](../../milestones/M-EDIT-02-brand-layers.md) §"Which mechanism, when" for why brand
furniture is composed forward while typography stays with extraction.

---

## Acceptance Criteria

- [ ] **AC1 [happy-path]:** When a generation is placed on the canvas and
      `useAgentStore.agent.logoPreview` is a non-empty string, the logo renders as a **real
      `ImageElement`** on the canvas — selectable, movable and resizable with the existing
      transform handles, not drawn into the background image.
- [ ] **AC2 [happy-path]:** When `useAgentStore.agent.license` is a non-empty string, the licence
      number renders as a **real `TextElement`**, editable via the normal text-editing path.
- [ ] **AC3 [edge-case]:** When an asset is absent (`logoPreview === null`, or `license === ''`),
      **nothing is placed for it** — no placeholder box, no generic avatar, no empty text element.
      A generation for an agent with no saved brand data is byte-identical to today's output.
- [ ] **AC4 [happy-path]:** Brand elements carry a provenance marker (`brand-` id prefix, mirroring
      the existing `composed-` convention in `canvasState.ts`) so they are distinguishable from
      both template layers (`ps-*`) and extraction output (`composed-*`).
- [ ] **AC5 [error-path]:** Placement costs **$0** and issues **no** network call — no
      `POST /:id/compose`, no credit metering, no plan gating. Asserted on the network log, not by
      inspection.
- [ ] **AC6 [regression]:** Existing extraction behaviour is unchanged — `US-EDIT-005`'s live spec
      (`e2e/us-edit-005-canvas-edit-toolbar.spec.ts`) still passes, and clicking "Edit elements"
      on a design carrying brand layers does not treat them as extracted layers.

---

## Out of Scope

- **Agent headshot and QR code** — `AgentInfo` has no headshot field and no QR exists anywhere;
  both need new capture or a new dependency. That is [US-EDIT-007](../US-EDIT-007/STORY.md).
- **Durable brand storage.** `logoPreview` lives in a client-side Zustand store and does not
  survive a different device. A real `brandKit` model is its own story.
- **`brandColors` → canvas palette.** Already on `AgentInfo`, already unused. Related, but that
  is palette work, not layer work.
- **Any change to the image prompt.** We are not asking the model to leave space, reserve a
  corner, or render brand furniture. The prompt is untouched in this story.
- **Any change to extraction, compose caching, credits or plan gating.**
- **Compose-forward for typography.** Explicitly rejected 2026-08-26 — see the
  [findings doc](../../../../../PRD/2026-08-26-compose-forward-findings.md).

---

## Open decision — settle in T1, do not let it grow

The model composes the full frame, so there is no guaranteed empty space for a logo. Two options:

| Option | Cost | Risk |
|---|---|---|
| **A — safe-margin heuristic**: fixed corner + padding, respecting canvas orientation | XS | may land the logo over a busy region of the photo |
| **B — wire `LayoutPlannerService.planLayout()`** (US-AI-044: built, 49 tests, registered, **never invoked**) to find low-detail regions | S–M | first production use of the planner; adds a server call to the generation path |

Recommended: **ship A, structure the code so B drops in behind the same interface.** B is the
better answer and this is its natural first job, but it should not be what makes this story slip.

---

## Engineering / PR

- **Branch:** `feat/edit/m-02-brand-layers`
- **PR:** #_____
- **Primary files touched:**
  - `client/src/lib/canvasState.ts` — new `placeBrandLayers()`, called after an AI variation lands
  - `client/src/lib/layout/connectLayout.ts` — extend beyond text-only slots (`FIELD_TO_SLOT` is
    text-only today, line 37) *(TBC — may not be needed if placement lives in `canvasState.ts`)*
  - `client/src/components/editor/RightSidebar.tsx` — call the placement after
    `loadAiVariationToCanvas`
  - `client/src/hooks/useAgentStore.ts` — read-only consumer, no shape change expected
  - `e2e/us-edit-006-brand-layers.spec.ts` (new) — live verification

---

## AI Implementation Prompt

> Paste this block into Claude Code to implement the story.

```
Project context: see PROJECT_CONTEXT.yaml at repo root.

Story: US-EDIT-006 — Brand layers from existing data (logo + licence)

As a real-estate agent, I want my brokerage logo and licence number to appear on every generated
design as real, movable canvas elements, so the design is publishable as mine without pasting
anything on by hand.

VERIFIED CONTEXT (do not re-derive):
- infographic-prompt.builder.ts never asks the model for a logo, headshot, QR or licence. Brand
  furniture is ABSENT from generated output, not baked in. This story is purely additive.
- useAgentStore.agent already has `license: string` and `logoPreview: string | null`. Neither
  reaches the canvas today.
- canvasState.ts uses id prefixes as provenance: `composed-` = extraction output, `ai-gen-` = the
  AI raster, `ps-*` = template layers. Use `brand-` for these.

Acceptance Criteria:
  AC1: logoPreview non-empty -> real ImageElement on canvas (selectable/movable/resizable), not
       drawn into the background.
  AC2: license non-empty -> real TextElement, editable via the normal text path.
  AC3: asset absent -> place NOTHING for it. No placeholder, no generic avatar, no empty element.
       Output for an agent with no brand data is identical to today.
  AC4: brand elements carry a `brand-` id prefix.
  AC5: placement costs $0 and issues NO network call. Assert on the network log.
  AC6: extraction unchanged — e2e/us-edit-005-canvas-edit-toolbar.spec.ts still passes, and
       "Edit elements" does not treat brand layers as extracted layers.

OPEN DECISION (settle in T1, keep it small):
  Placement position. Option A = safe-margin heuristic (fixed corner + padding, orientation
  aware). Option B = wire LayoutPlannerService.planLayout() (US-AI-044, built but never invoked)
  to find low-detail regions. SHIP A, structured so B drops in behind the same interface.

Out of Scope:
  Agent headshot and QR code (US-EDIT-007 — no headshot field exists, no QR dependency exists).
  Durable brandKit persistence. brandColors -> palette. ANY change to the image prompt. Any
  change to extraction, compose caching, credits, or plan gating. Compose-forward for typography
  (explicitly rejected 2026-08-26).

Primary files (do NOT touch others):
  client/src/lib/canvasState.ts            (new placeBrandLayers())
  client/src/components/editor/RightSidebar.tsx  (call it after loadAiVariationToCanvas)
  client/src/hooks/useAgentStore.ts        (read-only)
  e2e/us-edit-006-brand-layers.spec.ts     (new)

Rules:
- Touch ONLY the files listed above
- Do NOT implement anything in Out of Scope
- Run verification gates (PROJECT_CONTEXT.yaml.gates) before declaring done
- When done: list files changed, ACs checked, test command output
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|:--------:|----------|:------:|---------|
| TC-EDIT-006-01 | E2E | P0 | Given an agent with a saved `logoPreview`, when a generation is placed, then the logo appears as a selectable canvas element with transform handles | 🔲 | |
| TC-EDIT-006-02 | E2E | P0 | Given an agent with a saved `license`, when a generation is placed, then the licence renders as an editable text element | 🔲 | |
| TC-EDIT-006-03 | E2E | P0 | Given an agent with **no** brand data, when a generation is placed, then no brand element is created and the canvas matches today's output | 🔲 | |
| TC-EDIT-006-04 | E2E | P1 | Given brand layers on canvas, when the network log is inspected, then no `/compose` request was issued during placement | 🔲 | |
| TC-EDIT-006-05 | E2E | P1 | Given brand layers on canvas, when "Edit elements" is clicked, then the control still offers extraction (brand layers are not mistaken for `composed-` output) | 🔲 | |
| TC-EDIT-006-06 | Unit | P1 | `placeBrandLayers()` returns an empty result for every combination of absent assets, and never throws on malformed input | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [ ] All ACs checked ✅
- [ ] All test cases run and recorded
- [ ] Gate 1 passes (`npm run check`, `npm run test:unit`)
- [ ] Gate 2 passes (frontend, browser-verified)
- [ ] Manual flow verified with a real saved logo
- [ ] PR merged
- [ ] No console errors for the changed flow
- [ ] [TASKS.md](./TASKS.md) task list fully checked
- [ ] STORY.md status updated to ✅ Done

---

*Story created: 2026-08-26*
