---
title: M-EDIT-04-ai-composition-over-template — AI Composition Over a Template
type: milestone
domain: EDIT
created: 2026-10-24
---

# M-EDIT-04-ai-composition-over-template — AI Composition Over a Template

> **Epic:** [EPIC-EDIT-03](../EPIC.md)
> **Status:** 🔲 Not Started
> **Target date:** TBD — one build day once D1–D5 are decided
> **Branch:** `feat/edit/m-04-ai-composition-over-template` (shared by all three stories)
> **Closes:** [BL-27](../../../../BACKLOG.md) (P2)

---

## Goal

Placing an AI design onto a template renders **one** set of property facts instead of three, because
the server tells the canvas what it produced instead of making the canvas guess from pixels.

---

## Why this milestone exists

BL-27 is usually described as a layering bug. It is not. `splitElementsForAiBackground`
(`canvasState.ts:340`) keeps everything that is not an AI background or a `composed-` element and
places the AI image beneath them at `minZIndex - 1`. When that image is itself a finished poster
with "₹1.9 Cr" set large, the template's own still-populated slots survive on top of it. The Gate 2
capture from 2026-09-07 shows a canvas advertising **₹1.9 Cr** (baked into the image), **₹1.18 Cr**
(the template's placeholder) and neither matching the **₹1.85 Cr** the user typed.

Nothing is wrong with either half. What is missing is any rule about what an AI image *is*.

**The enabling fact:** the server already decides this and throws the answer away.

```ts
// ai-orchestrator.service.ts:274 — a local variable, used and discarded
const useTextFree = typeof photoReference === 'string' && photoReference.length > 0;
```

Persist that decision and carry it to the canvas element, and the layer rule becomes a branch on a
fact rather than an inference from pixels. `isAiImport` cannot substitute — it is `true` on both
paths.

---

## Stories in this Milestone

> **Reading the table:**
> - **Order** — work-execution order within this milestone. `1` is the first story to start;
>   ties indicate stories that can be done in parallel.
> - **Blocked By** — explicit dependencies on other stories (use the US-ID). Leave `—` if free to start.
> - Status is the per-story state from STORY.md (do not edit here — keep both in sync via `/close-story`).

| Order | Story | Title | Size | Blocked By | Status | PR |
|:-----:|-------|-------|:----:|------------|:------:|:--:|
| 1 | [US-EDIT-011](../stories/US-EDIT-011/STORY.md) | Persist the AI composition flag end to end | M | — | 🔲 | — |
| 2 | [US-EDIT-012](../stories/US-EDIT-012/STORY.md) | Branch the layer rule on composition, with one undo | M | US-EDIT-011 **merged** | 🔲 | — |
| 2 | [US-EDIT-013](../stories/US-EDIT-013/STORY.md) | Remove the dead AI chat panel code | S | — | 🔲 | — |

### Operating model — one engine, cross-model verification

Adopted 2026-10-24, replacing an earlier three-lane multi-model split. **All implementation is
Claude**, so one model holds one interpretation of the contract. A second model is used only where
independent skepticism pays: review and adversarial tests, read-only, after integration.

| Stage | Who | Parallel |
|-------|-----|:--------:|
| Architecture — D1–D5, contract, ownership | Human + Claude | No |
| **Foundation** — US-EDIT-011, merges before anything forks | Claude, milestone branch | No |
| **Lanes** — US-EDIT-012 `../bg-canvas` · US-EDIT-013 `../bg-cleanup` | Claude ×2 worktrees | Yes |
| Integration — squash L1 then L2, full gates | Claude | No |
| **Verification** — diff review, adversarial tests, negative cases | **Gemini, read-only** | Yes |
| Approval — Gate 2 step 5, merge to `main` | Human | No |

Two corrections this restructuring made, both worth keeping in mind when reading the stories:

- **US-EDIT-011 was a Foundation stage mis-filed as a lane.** It publishes `AiComposition`,
  `ResultVariation.composition?` and `ImageElement.aiComposition?` — generated types both lanes
  compile against. A type agreed in conversation but not merged is a promise, not a contract.
- **There is no `AIChatBox.tsx` handover.** It does not call `loadAiVariationToCanvas` — the callers
  are `CenterCanvas.tsx:111` and `RightSidebar.tsx:566` — so it belongs wholly to US-EDIT-013 and
  the two lanes share no file at all.

The Gemini verifier gets the contract, ACs, diff and test output — never an unconstrained "review
the repo". **Pin a strong model explicitly**: an unpinned run defaulted to `gemini-3.1-flash-lite`,
and a verifier weaker than the implementer produces a green tick that means nothing. It needs no
worktree and no hooks, which also makes the `${GEMINI_PROJECT_DIR}` hook defect irrelevant here.

---

## The contract (agreed before any story starts)

```ts
type AiComposition = 'background' | 'poster';

// 1 · derived where the decision already exists   ai-orchestrator.service.ts:274
// 2 · persisted into Infographic.propertyData     (already Json — no migration)
// 3 · returned on ResultVariation                 client/src/lib/api.ts:173
// 4 · set on ImageElement.aiComposition           client/src/lib/canvasTypes.ts
```

Both new fields are **optional**. Production holds 8 saved designs and staging 173, none of which
carry the field; absent must therefore mean "behave exactly as today", which is `'background'`.
This is what makes the whole milestone revertible without touching stored data.

---

## Acceptance (Milestone Done When…)

- [ ] Placing an AI poster over a template renders **one** price, one headline, one agent footer —
      the BL-27 capture is not reproducible.
- [ ] Placing an AI *background* (the real-photo path) is unchanged from today's behaviour.
- [ ] A design saved before this milestone reopens identically after it — verified against a real
      saved design, not a fixture.
- [ ] One Undo press restores the pre-placement state, whatever D2 decides that state includes.
- [ ] `composition` is readable on the generation record and on every returned variation.
- [ ] ~950 lines of unreachable AI-chat code are gone and the panel behaves identically.
- [ ] All stories above have status ✅ Done
- [ ] Verification gates pass for affected domains — Gate 1 mandatory; Gate 2 is the manual export
      inspection below.

### Gate 2 — by hand, and the step that decides ship or hold

1. Load a template → generate **with** a photo → place → one price on the canvas
2. Load a template → generate **without** a photo → place → one price on the canvas
3. Press Undo once → prior state fully restored
4. Save, reload the page, reopen the design → identical to step 3
5. **Export the image and open the file** → no overlap, no placeholder, no second price

Step 5 is non-negotiable. [BL-09](../../../../BACKLOG.md) records that the editable-canvas export
does not match the composed preview at full resolution, so a clean preview is not evidence of a
clean export.

---

## Decisions required before implementation

These are product calls. No agent can make them, and US-EDIT-012 cannot start without D1 and D2.

| ID | Question | Gates | Default if undecided |
|----|----------|-------|----------------------|
| D1 | Does "replace" mean the whole composition, or only template-owned slot-tagged layers? A user's own text box carries no slot tag and would otherwise float over the poster. | US-EDIT-012 | Warn-only; the defect survives |
| D2 | One undo spanning the canvas *and* the property store, or no store write at all on day one? | US-EDIT-012 | **No store write** — layer discard only |
| D3 | Warn at generate time rather than apply time, since the real choice is made by whether a photo was attached? | US-EDIT-011, copy | Defer — copy change, not architecture |
| D4 | What is a text-free background with no user photo? | the default | Answered by running M-EDIT-03 Gate 2 step 5 with a real photo |
| D5 | Persist `composition` in `propertyData` JSON or as a real column? | US-EDIT-011 | **JSON** — already `Json`, no migration, no deploy coupling |

---

## Notes / Blockers

- **Slot coverage is uneven, and it changes D1's reach.** `slot?: string` exists on `BaseElement`
  (`canvasTypes.ts:28`) and the five production templates carry 54 tags between them — but
  `property.price` is tagged on only **3 of 5** and `property.headline` on **4 of 5**. A
  discard-slot-tagged-layers rule therefore leaves an untagged price standing on two templates.
  Either tag the gaps in `api/scripts/data/premium-templates.data.ts` as part of US-EDIT-011, or
  state the partial coverage in US-EDIT-012's acceptance. Do not leave it implicit.
- **`loadComposedDesignToCanvas` is a second path to the canvas** and per
  [BL-23](../../../../BACKLOG.md) it is missing the same undo-history push. Decide whether the flag
  is set on both routes or whether the composed path is explicitly out of scope for this milestone;
  silence produces a rule that works on one route and not the other.
- **`restoreCanvasData` serves both template loading and saved-design restore** —
  `EditorLayout.tsx:86`/`:97`/`:120`, `TemplatesPanel.tsx:149`, `CenterCanvas.tsx:135`. Any rule that
  treats unedited slot content as disposable will treat a reopened customer design the same way.
  This is the single most likely source of a data-loss bug in the milestone.
- **`pushToHistory` records canvas elements only** (`canvasState.ts:441`). A property-store write
  made alongside it sits outside the history system, so a naive D2 implementation gives the user an
  Undo that restores their layers and silently keeps the overwritten price.
- **Cross-milestone:** hour zero's photo test closes [BL-26](../../../../BACKLOG.md), which is one of
  the two open items on [M-EDIT-03](M-EDIT-03-single-editable-path.md) (currently 5/7). It also
  answers D4. Highest-leverage single hour available.
- **BL-27 is P2.** This milestone is not a launch blocker; revenue-on closed 2026-10-19. It is
  sequenced here because the defect is the default result of "Use This Design" onto a template.

---

*Milestone created: 2026-10-24*
