# M-EDIT-11-v3-editor-slice — Opt-in V3 editor vertical slice

> **Epic:** [EPIC-EDIT-04](../EPIC.md)
> **Feature:** N/A — validation slice
> **Status:** 🟡 In Progress — local delivery packet prepared; Arrange independently approved after repair; whole-milestone closure/main merge remain unauthorized.
> **Target date:** Not committed; validate effort after first working slice.
> **Branch:** `codex/v3-arrange-opus` (current delivery candidate); protected checkpoint `codex/v3-editor-checkpoint-2026-11-05` at `b69074b`

---

## Goal

An authenticated agent can open an existing saved design, edit text, undo/redo, save to the same server record, reload and export PNG in a fresh V3 shell while the current editor remains the default.

Approved extension (2026-11-01): draw and edit standalone straight/curved/elbow lines, restore old text/shape/image toolbar capabilities in modern contextual controls, and add image Edit sidebar, rotation handles, borders and local shadows without changing the approved shell.

## Stories in this Milestone

| Order | Story | Title | Size | Blocked By | Status | PR |
|:-----:|-------|-------|:----:|------------|:------:|:--:|
| 1 | [US-EDIT-031](../stories/US-EDIT-031/STORY.md) | V3 shell: open → edit → save → reload → export | L | harden lock + independent tests | 🟡 locally verified | — |
| 2 | [US-EDIT-032](../stories/US-EDIT-032/STORY.md) | Standalone straight, curved and elbow drawing | M | US-EDIT-031 | Implemented; merge pending | — |
| 3 | [US-EDIT-033](../stories/US-EDIT-033/STORY.md) | Modern element toolbars and image Edit sidebar | M | shared 032/034 interfaces | Implemented; merge pending | — |
| 4 | [US-EDIT-034](../stories/US-EDIT-034/STORY.md) | Rotation handles, borders and local shape shadows | M | shared 032/034 interfaces | Implemented; merge pending | — |
| 5 | [US-EDIT-035](../stories/US-EDIT-035/STORY.md) | Shared paint model, rendering and document persistence | M | existing 031–034 runtime | In Progress - locally verified; merge pending | — |
| 6 | [US-EDIT-036](../stories/US-EDIT-036/STORY.md) | Shared color sidebar, picker and transient paint editing | M | US-EDIT-035 | In Progress - locally verified; merge pending | — |
| 7 | [US-EDIT-037](../stories/US-EDIT-037/STORY.md) | Compact stroke styling and line-type menus | M | US-EDIT-035/036 | In Progress - locally verified; merge pending | — |
| 8 | [US-EDIT-038](../stories/US-EDIT-038/STORY.md) | Annotated Effects, opacity, text-anchor and image-Fit refinements | M | existing US-EDIT-031–037 runtime | Locally verified; merge pending | — |
| 9 | [US-EDIT-039](../stories/US-EDIT-039/STORY.md) | Common element actions and V3 keyboard parity | M | existing checkpoint and coordinated shared seams | 🟡 Locally verified; merge pending | — |
| 10 | [US-EDIT-040](../stories/US-EDIT-040/STORY.md) | Compact shape editing and existing-shape library | M | existing checkpoint and coordinated shared seams | 🟡 Locally verified; merge pending | — |
| 11 | [US-EDIT-041](../stories/US-EDIT-041/STORY.md) | Property SVG icon and emoji library | M | existing checkpoint and coordinated shared seams | 🟡 Locally verified; merge pending | — |
| 12 | [US-EDIT-042](../stories/US-EDIT-042/STORY.md) | Stable layer ordering, overlap geometry and row actions | M | existing checkpoint; 043 consumes042 helpers | 🟡 Locally verified; merge pending | — |
| 13 | [US-EDIT-043](../stories/US-EDIT-043/STORY.md) | Layers sidebar with actual previews, row menus and drag ordering | M | existing checkpoint; 043 consumes042 helpers | 🟡 Locally verified; merge pending | — |
| 14 | [US-EDIT-044](../stories/US-EDIT-044/STORY.md) | Responsive V3 editor shell | M | existing V3 listing/Arrange runtime; harden | 🔲 Not Started | — |

## Acceptance (Milestone Done When…)

- [x] New V3 composition is visible only with `editor=v3`; current default/auth behaviour is preserved.
- [x] Existing designs retain canvas elements and metadata through text edits and server save/reload.
- [x] Save/load/export failures are visible and retryable; stale responses cannot claim newer work is saved.
- [x] Light/dark desktop visual and browser checks pass, PNG output is verified and authenticated real-server smoke is recorded separately.
- [ ] All stories above have status ✅ Done; applicable gates and independent review pass.

## Notes / Blockers

- 2026-11-05 user approved implementation of [shared color/paint and compact stroke plan](../../../../../../Mockups/approved-v3-editor/COLOR_PAINT_PLAN.md). US-EDIT-035–037 explicitly add the paint-engine scope previously excluded from033/034; prior verification does not certify these new stories. Preserve existing uncommitted work and approved shell. No commit, push, merge or deployment without user permission.

- 2026-11-01 approved extension: [toolbar/drawing plan](../../../../../../Mockups/approved-v3-editor/TOOLBAR_DRAWING_PLAN.md), implemented through hardened US-EDIT-032–034. The original slice evidence does not verify these new capabilities. Milestone remains in progress until all added stories meet acceptance and delivery gates.

- Approved first experiment on 2026-10-31. Does not supersede or close US-EDIT-024/028/029/030 or promise full V3 parity; reconcile their remaining scope after reviewing this slice.
- No dependency on unfinished Property, Brand, template or Assistant stories. No production default switch or deployment is part of the slice.
- Milestone number follows the existing EDIT sequence (11); historical global milestone IDs already overlap across domains. Global next-ID mirror remains at least 22.
- Approved skeleton and Navy & Teal design are now retained in the [tracked design bundle](../../../../../../Mockups/approved-v3-editor/README.md). See its integration plan before reconciling US-EDIT-024/025/027; this approval does not claim those runtime capabilities are implemented.

*Milestone created: 2026-10-31*


## Local verification — 2026-10-31

[US-EDIT-031 verification](../stories/US-EDIT-031/VERIFICATION.md): TypeScript, 1,210 unit tests, 25 browser tests, four painted-artboard/contrast checks, production build and authenticated API/browser/database smoke passed. One existing client skip retained. Opus approved code/security; Gemini whole-milestone verification and human-approved delivery remain pending. The existing editor is still the default.

The later Preview amendment raised the scoped browser suite to 27 passing tests. Its final independent re-review remains pending after reviewer usage limits; see the story's current VERIFICATION.md. Design approval on 2026-10-31 accepts the saved presentation, not a runtime review/merge waiver.

### 2026-11-01 — Modern element editing (US-EDIT-032/033/034)

Implemented and verified locally: standalone lines, old-editor toolbar parity, image Edit sidebar/replacement, rotation handles, border styles and local shape shadows. The approved Navy/Teal skeleton and legacy default route remain. 48 browser cases, 811 backend +465 client unit tests (one existing skip), type checks, build and authenticated API/database save/reload/export smoke pass. Independent code-review findings corrected. [Evidence](../../../../../../Mockups/approved-v3-editor/TOOLBAR_VERIFICATION.md). PR/main merge, Crop, attached connectors and unrelated V3 roadmap work remain pending.

- 2026-11-05: US-EDIT-035-037 implemented locally against the approved color/paint plan. Type checks, 1,425 unit tests and 89 browser cases pass; six themed screenshots retained. [Evidence](../../../../../../Mockups/approved-v3-editor/COLOR_PAINT_VERIFICATION.md). Existing work preserved; no commit, push, merge or deployment. Formal Done remains pending milestone merge.

- 2026-11-05: US-EDIT-038 implemented locally for the four browser annotations. Shape Effects sidebar and seven named presets, clean opacity suffix, anchor guidance and V3 image-frame resizing are verified. Frontend/API type checks, 1,445 unit tests and 98 browser cases passed; five captures retained in Mockups/approved-v3-editor/evidence. Formal Done and milestone merge remain pending. No commit, push, merge or deployment.

- 2026-11-07 annotation revision: footer Layers now opens the full sidebar, toolbar Layers shortcut removed, shared row/toolbar action menu implemented. Element-specific controls inventoried in LAYERS_VERIFICATION.md. Type checks +1,515 unit tests pass;124 distinct browser contracts verified across full run and final28/28 affected rerun. No Arrange, commit, push or merge; formal delivery pending.


## Delivery preparation — 2026-11-07

User authorized committing V3 work, independent Arrange review, US-EDIT-027 reconciliation and local milestone delivery preparation. **Do not merge to main.** Reference styling checkpoint:3b8a150. Arrange extends the local candidate under the documented no-new-story-card exception; it must be included in review/evidence without inventing US-EDIT-044/045 completion.

Independent Arrange review initially found3 required issues (tab focus and legacy-line numeric semantics); repairs and final review are tracked in `Mockups/approved-v3-editor/ARRANGE_INDEPENDENT_REVIEW.md`. The complete local delivery checklist/draft PR text is `Mockups/approved-v3-editor/V3_DELIVERY_PACKET.md`. No PR is opened, branch pushed or deployment performed by preparation.

US-EDIT-027 belongs to M-EDIT-09. Its autosave/recovery work is already implemented, but same-document navigation confirmation (AC4) remains incomplete. This is explicitly retained as a broader V3 release gap; M-EDIT-09 is not closed by M-EDIT-11/Arrange work. Historic authenticated smoke evidence is not a new current-branch database certification.

Final local evidence: Arrange repairs `7ae0fe0` approved independently; frontend/API types,1,550 unit tests (1 existing skip) and production build pass. Browser full132 passes/1 timeout +passing isolatedPreview rerun covers133 distinct cases; not a single all-green invocation. Both theme captures inspected. See V3_DELIVERY_PACKET.md for exact logs, open US-EDIT-027 AC4, review-unit boundaries and main-merge prohibition.
