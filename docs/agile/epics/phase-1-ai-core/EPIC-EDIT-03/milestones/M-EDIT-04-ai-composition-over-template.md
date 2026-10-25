---
title: M-EDIT-04-ai-composition-over-template — AI Composition Over a Template
type: milestone
domain: EDIT
created: 2026-10-24
---

# M-EDIT-04-ai-composition-over-template — AI Composition Over a Template

> **Epic:** [EPIC-EDIT-03](../EPIC.md)
> **Status:** ✅ Done — closed 2026-10-25, merged in [#64](https://github.com/din-prajapati/infographic.io/pull/64) (rebase-and-merge)
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
| 1 | [US-EDIT-011](../stories/US-EDIT-011/STORY.md) | Persist the AI composition flag end to end | M | — | ✅ | [#64](https://github.com/din-prajapati/infographic.io/pull/64) |
| 2 | [US-EDIT-012](../stories/US-EDIT-012/STORY.md) | Branch the layer rule on composition, with one undo | M | US-EDIT-011 **merged** | ✅ | [#64](https://github.com/din-prajapati/infographic.io/pull/64) |
| 2 | [US-EDIT-013](../stories/US-EDIT-013/STORY.md) | Remove the dead AI chat panel code | S | — | ✅ | [#64](https://github.com/din-prajapati/infographic.io/pull/64) |

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

- [x] Placing an AI poster over a template renders **one** price, one headline, one agent footer —
      the BL-27 capture is not reproducible.
- [x] Placing an AI *background* (the real-photo path) is unchanged from today's behaviour.
- [x] _(Verified on production after deploy, 2026-10-25)_ A design saved before this milestone reopens identically after it — verified against a real
      saved design, not a fixture.
- [x] One Undo press restores the pre-placement state, whatever D2 decides that state includes.
- [x] `composition` is readable on the generation record and on every returned variation.
- [x] ~950 lines of unreachable AI-chat code are gone and the panel behaves identically.
- [x] All stories above have status ✅ Done
- [x] Verification gates pass for affected domains — Gate 1 mandatory; Gate 2 is the manual export
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

### Gate 2 — RUN 2026-10-25, through Claude in Chrome, on local dev

Real dev server, real signed-in session, real generations. Template: *Premium Listing — Story*.
Saved design: "M-EDIT-04 Gate2 poster".

| Step | Result | Evidence |
|:----:|:------:|----------|
| 1 — generate **with** a photo | ⛔ **Blocked, not failed** | Generation errors before any placement: *"Failed to compose image with source photo"*. Root-caused to [BL-42](../../../../BACKLOG.md) — unrelated to this milestone. **The one path M-EDIT-04 leaves unchanged is the one that cannot be exercised.** |
| 2 — generate **without** a photo → place | ✅ **Pass** | Poster placed over the template renders **one** price (₹1.9 Cr), one headline, one brand mark. Zero bracketed placeholders survive. **BL-27 is not reproducible.** |
| 3 — one Undo press | ✅ **Pass** | Single press restored every discarded layer — `[Property name]`, `[Price]`, 3×`[Key fact]`, the CTA footer — and the sidebar's *Template Content* section reappeared with it. |
| 4 — save, reload, reopen | ✅ **Pass** | Full page reload: design reopens identically, one price, no placeholders resurrected. `restoreCanvasData` did **not** treat the reopened design's content as disposable — the hazard this milestone's notes called the most likely source of a data-loss bug. |
| 5 — open the exported file | ❌ **FAIL** | The exported PNG contains the navy background, one orphaned pill and one blue bar. **The AI poster is absent entirely.** Cause is [BL-41](../../../../BACKLOG.md), pre-existing and not caused by this milestone. |

**Verdict: the milestone's own fix is verified; its acceptance checklist is not satisfiable.**
Steps 2–4 demonstrate BL-27 is fixed, including the undo and the saved-design safety case. Step 5
fails for a reason this milestone does not touch and cannot fix within scope, and step 1 is blocked
by a second unrelated defect. Both are filed as P1.

Two findings the decision record did not anticipate:

- **D1 discards slot-tagged *text* but keeps its untagged *background***. The template's price pill
  and CTA bar are shapes carrying no `slot`, so they survive by rule while the text they existed to
  frame is discarded — leaving empty furniture floating over the poster. Visible in steps 2 and 4
  and in the export. Not a BL-27 regression; a real gap in D1's reasoning, since a slot-tagged text
  layer routinely sits on an untagged shape.
- **Gate 2's own step sequence is incoherent.** Step 4 restores "identical to step 3" — the
  *undone*, all-placeholder state — and step 5 then demands "no placeholder" in the export. Export
  is only meaningful on a placed poster. This run redid the placement before saving, which tests
  strictly more; the checklist should be amended to say so.

---

### Gate 2 — RE-RUN 2026-10-25, after BL-41 (#62) and BL-42 (#63), on the rebased branch

Branch rebased onto `main` @ `fe63e31`. Gate 1 re-run green (check, 776 backend, 301 client) and
Gate 4 green (19/19). Generations used the seeded unlimited QA account, since the dev account had
reached its 3/3 free limit.

| Step | Result | Evidence |
|:----:|:------:|----------|
| 1 — generate **with** a photo → place | ✅ **Pass** | Real panel flow: photo attached, 3 variations returned (3× `image:remix:ok`), Variation 1 placed. One price on the canvas — the template's own `[Price]`; the image carries no text. `composition: "background"` on the generation record and on all 3 variations. |
| 5 — open the exported file | ✅ **Pass** | Poster design re-exported on this branch: the full AI poster, one price (₹1.9 Cr), no placeholder, no overlap. The photo design's export matches the editor exactly. |

Steps 2–4 passed in the first run and are untouched by the rebase. As noted above, this run
re-placed the poster before exporting rather than exporting the undone state.

**One new finding**, filed as [BL-43](../../../../BACKLOG.md): on this portrait template the photo
shows as a thin strip. BL-42's fix makes the output take the photo's own aspect (2560×1440),
`objectFit: contain` fits that into ~32% of the 9:16 canvas, and the template's opaque hero
placeholder covers most of it. Not caused by this milestone — AC2 holds, the background path behaves
as before — but it is what a customer with a photo now sees. The D1 "empty furniture" finding above
is filed as [BL-44](../../../../BACKLOG.md).

---

### Post-deploy verification — 2026-10-25

`c9e908d` deployed to both environments (`/api/health` reports it on staging and production).

| Check | Result |
|-------|:------:|
| `R2_PUBLIC_URL` set on both environments (BL-41's proxy depends on it) | ✅ staging: r2.dev bucket · production: `assets.buildographic.com` |
| Image proxy allows our asset host and refuses a lookalike, both environments | ✅ 404 from upstream for a missing key · 403 for `evil-ideogram.ai` |
| Staging: generation with a photo (BL-42) | ✅ completed, `composition: "background"`, image fetched through the proxy (200, PNG, 2560×1440) |
| Production: existing design reopened (AC6) and exported (BL-41) | ✅ checked by Dinesh — reopens as before; the exported file matches the canvas |

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

- **Slot coverage is adequate — an earlier note here said otherwise and was wrong.** `slot?: string`
  exists on `BaseElement` (`canvasTypes.ts:28`) and the five templates carry 54 tags. This document
  previously claimed `property.price` was missing on 2 of 5 and that the discard rule would leave
  an untagged price standing. **It would not.** *Market Report — Email Header* carries only
  `report.*` slots and has no listing price by design; *MLS Listing Sheet* has no price element at
  all. US-EDIT-011 AC7 is therefore a verification pass, not a tagging job.
- **BL-27 reproduces less severely than its backlog row describes.** The row cites three
  contradictory prices — ₹1.9 Cr baked, ₹1.18 Cr placeholder, ₹1.85 Cr typed. BL-40 replaced that
  fabricated ₹1.18 Cr with the bracketed placeholder `[Price]` on 2026-10-21. Today it reproduces
  as one real price plus a visible `[Price]` overlapping it — still a defect, no longer a listing
  advertising two prices that disagree. The fix is unchanged; the urgency is lower.
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
