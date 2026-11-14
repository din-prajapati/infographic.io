---

title: EPIC-EDIT-04 — V3 Editor Simplification

type: epic

tags: [orion, epic, edit, phase-1.5]

updated: 2026-10-31

---

# EPIC-EDIT-04 — V3 Editor Simplification

> **Phase:** Phase 1.5 — Property Foundation & V3 Editor

> **Status:** 🟡 21/25 implementation candidates including 1 formally Done; 4 deferred; release review/merge and UI acceptance pending

> **Owner:** Dinesh

> **Decision:** [ADR-003](../../../decisions/ADR-003-phase-1-close-and-phase-1.5.md) · **Approved visual source:** [V3 editor design bundle](../../../../../Mockups/approved-v3-editor/README.md), saved 2026-10-31. Earlier untracked V3 mockups are historical references.

---

## Goal

**Outcome:** The editor shows that the listing facts are connected: the agent sees which fact each text shows and can detach or

reconnect it, the Design tab answers "which look, which colour, which photo", AI lives in one Assistant panel with two clear

tasks, and Export checks the design before it downloads.

**Why now:** M-EDIT-05 and EPIC-PROP-01 make the facts trustworthy underneath; this epic makes that visible. The current Design

tab's Brand Styles mixes a colour theme with the canvas background (the source of the P-25/P-26 regressions), Quick Styles is an

"add text" tool in the wrong place, and AI is split between the sidebar's Quick Generate and a floating chat that never writes

facts back to the Property.

**Success metric:** On production, an agent can see and change what every text element is linked to, switch look without losing

facts, generate a background without touching the text, and is stopped at Export if the price or contact is missing.

---

## Milestones

| Milestone | Scope | Status |
|-----------|-------|:------:|
| [M-EDIT-03-single-editable-path](milestones/M-EDIT-03-single-editable-path.md) | One way to get editable text, on the canvas — *moved from EPIC-EDIT-03* | ✅ 2026-10-29 |
| [M-EDIT-06-linked-editing](milestones/M-EDIT-06-linked-editing.md) | Linked-element inspector + Manage links · export review dialog + out-of-date image guard | 🔲 |
| [M-EDIT-07-design-tab](milestones/M-EDIT-07-design-tab.md) | Design tab: Look · Accent · Property photo · Format & logo; Design/Property/Contact tabs | 🔲 |
| [M-EDIT-08-ai-assistant](milestones/M-EDIT-08-ai-assistant.md) | AI Assistant (Create design / Generate Background) · refine chips · quota badge | 🔲 |
| [M-EDIT-09-v3-shell](milestones/M-EDIT-09-v3-shell.md) | Approved V3 shell, floating Tools, footer Layers, Property and Agent panels, autosave — light and dark | 🟡 locally implemented |
| [M-EDIT-10-extraction-review](milestones/M-EDIT-10-extraction-review.md) | Edit Elements review — confirm links before a poster becomes editable | 🔲 |
| [M-EDIT-11-v3-editor-slice](milestones/M-EDIT-11-v3-editor-slice.md) | Opt-in fresh V3 shell: open → edit → save → reload → PNG export | 🟡 locally verified |

---

## Stories in this Epic

| # | Story | Title | Milestone | Size | Status |
|:-:|-------|-------|-----------|:----:|:------:|
| 1 | [US-EDIT-009](stories/US-EDIT-009/STORY.md) | Remove the pre-placement Flat/Editable toggle — *moved from EPIC-EDIT-03* | M-EDIT-03 | M | ✅ |
| 2 | [US-EDIT-020](stories/US-EDIT-020/STORY.md) | Linked-element inspector and Manage links | M-EDIT-06 | M | 🟡 Implemented locally; review/merge pending |
| 3 | [US-EDIT-021](stories/US-EDIT-021/STORY.md) | Export review dialog and out-of-date image guard | M-EDIT-06 | M | 🟡 Implemented locally; review/merge pending |
| 4 | [US-EDIT-022](stories/US-EDIT-022/STORY.md) | Design tab simplification | M-EDIT-07 | M | 🟡 Implemented locally; review/merge pending |
| 5 | [US-EDIT-023](stories/US-EDIT-023/STORY.md) | AI Assistant — Create design or Generate Background | M-EDIT-08 | L | 🔲 |
| 6 | [US-AI-015](stories/US-AI-015/STORY.md) | Quick Refine chips — *moved from EPIC-AI-03, re-scope before implementing* | M-EDIT-08 | M | 🔲 |
| 7 | [US-EDIT-008](stories/US-EDIT-008/STORY.md) | Editable quota badge + charge confirmation — *moved from EPIC-EDIT-03* | M-EDIT-08 | M | 🔲 |
| 8 | [US-EDIT-024](stories/US-EDIT-024/STORY.md) | Approved editor shell and existing capability adapters | M-EDIT-09 | L | 🟡 Implemented locally; review/merge pending |
| 9 | [US-EDIT-027](stories/US-EDIT-027/STORY.md) | Autosave and save status | M-EDIT-09 | M | 🟡 Implemented locally; review/merge pending |
| 10 | [US-EDIT-025](stories/US-EDIT-025/STORY.md) | Property and Contact tabs in the V3 layout | M-EDIT-09 | M | 🟡 Implemented locally; review/merge pending |
| 11 | [US-EDIT-026](stories/US-EDIT-026/STORY.md) | Edit Elements review — confirm links before a poster becomes editable | M-EDIT-10 | L | 🔲 |
| 12 | [US-EDIT-031](stories/US-EDIT-031/STORY.md) | Opt-in V3 editor vertical slice | M-EDIT-11 | L | 🟡 Locally verified; UI/review/merge pending |
| 13 | [US-EDIT-032](stories/US-EDIT-032/STORY.md) | Standalone straight, curved and elbow drawing | M-EDIT-11 | M | 🟡 Locally verified; UI/review/merge pending |
| 14 | [US-EDIT-033](stories/US-EDIT-033/STORY.md) | Modern element toolbars and image Edit sidebar | M-EDIT-11 | M | 🟡 Locally verified; UI/review/merge pending |
| 15 | [US-EDIT-034](stories/US-EDIT-034/STORY.md) | Rotation handles, borders and local shape shadows | M-EDIT-11 | M | 🟡 Locally verified; UI/review/merge pending |
| 16 | [US-EDIT-035](stories/US-EDIT-035/STORY.md) | Shared paint model, rendering and document persistence | M-EDIT-11 | M | 🟡 Locally verified; UI/review/merge pending |
| 17 | [US-EDIT-036](stories/US-EDIT-036/STORY.md) | Shared color sidebar, picker and transient paint editing | M-EDIT-11 | M | 🟡 Locally verified; UI/review/merge pending |
| 18 | [US-EDIT-037](stories/US-EDIT-037/STORY.md) | Compact stroke styling and line-type menus | M-EDIT-11 | M | 🟡 Locally verified; UI/review/merge pending |
| 19 | [US-EDIT-038](stories/US-EDIT-038/STORY.md) | Annotated Effects, opacity, text-anchor and image-Fit refinements | M-EDIT-11 | M | 🟡 Locally verified; UI/review/merge pending |
| 20 | [US-EDIT-039](stories/US-EDIT-039/STORY.md) | Common element actions and V3 keyboard parity | M-EDIT-11 | M | 🟡 Locally verified; UI/review/merge pending |
| 21 | [US-EDIT-040](stories/US-EDIT-040/STORY.md) | Compact shape editing and existing-shape library | M-EDIT-11 | M | 🟡 Locally verified; UI/review/merge pending |
| 22 | [US-EDIT-041](stories/US-EDIT-041/STORY.md) | Property SVG icon and emoji library | M-EDIT-11 | M | 🟡 Locally verified; UI/review/merge pending |
| 23 | [US-EDIT-042](stories/US-EDIT-042/STORY.md) | Stable layer ordering, overlap geometry and row actions | M-EDIT-11 | M | 🟡 Locally verified; UI/review/merge pending |
| 24 | [US-EDIT-043](stories/US-EDIT-043/STORY.md) | Layers sidebar with actual previews, row menus and drag ordering | M-EDIT-11 | M | 🟡 Locally verified; UI/review/merge pending |
| 25 | [US-EDIT-044](stories/US-EDIT-044/STORY.md) | Responsive V3 editor shell | M-EDIT-11 | M | 🟡 Locally verified; UI/review/merge pending |

---

## Out of Scope (this epic)

- Phone/tablet responsiveness is in scope under US-EDIT-044 (approved 2026-11-13); remaining UI/font annotations await user review. Historical scope note: *Amended 2026-10-29:* the V3 shell **is** in scope (US-EDIT-024), in both light and dark themes.

- Removing the free-form design tools (shapes, fonts, crop, adjustments) — they stay; V3 drops them, we do not.

- SVG export and export history. *(Autosave moved into scope as US-EDIT-027; the Projects breadcrumb is part of US-EDIT-024.)*

- Conversational AI (EPIC-AI-01, moved to the backlog).

---

*Epic created: 2026-10-29*

## Implementation Update — 2026-10-31

US-EDIT-031 / M-EDIT-11 implemented in an isolated branch, with fresh V3 shell and reused canvas/backend. Local gates and authenticated save/reload/export passed; Opus code/security review approved. [Evidence](stories/US-EDIT-031/VERIFICATION.md). Not formally Done: milestone verification, PR and human merge approval remain pending. This pilot does not close the broader V3 shell/panel stories.

### 2026-11-01 — Approved design integration (US-EDIT-024 / US-EDIT-027)

Reconciled the obsolete shell contract to the approved Navy/Teal layout and implemented its React shell, real existing-capability adapters and guarded autosave on the dependent V3 foundation branch. Type checks, 1,237 unit tests (one existing skip), production build and fresh authenticated browser/API/database save/reload/export smoke pass. Final browser regression evidence and remaining feature details are recorded in `Mockups/approved-v3-editor/IMPLEMENTATION_STATUS.md`. Line drawing and the archived crop workspace remain explicit gaps; US-EDIT-020/021/022/023/025/026 are not completed by shell composition. Independent review, milestone PR and main merge remain pending.

### 2026-11-01 — Modern element editing (US-EDIT-032/033/034)

Implemented and verified locally: standalone lines, old-editor toolbar parity, image Edit sidebar/replacement, rotation handles, border styles and local shape shadows. The approved Navy/Teal skeleton and legacy default route remain. 48 browser cases, 811 backend +465 client unit tests (one existing skip), type checks, build and authenticated API/database save/reload/export smoke pass. Independent code-review findings corrected. [Evidence](../../../../../Mockups/approved-v3-editor/TOOLBAR_VERIFICATION.md). PR/main merge, Crop, attached connectors and unrelated V3 roadmap work remain pending.

- 2026-11-05: US-EDIT-035-037 implemented locally against the approved color/paint plan. Type checks, 1,425 unit tests and 89 browser cases pass; six themed screenshots retained. [Evidence](../../../../../Mockups/approved-v3-editor/COLOR_PAINT_VERIFICATION.md). Existing work preserved; no commit, push, merge or deployment. Formal Done remains pending milestone merge.

- 2026-11-05: US-EDIT-038 implemented locally for the four browser annotations. Shape Effects sidebar and seven named presets, clean opacity suffix, anchor guidance and V3 image-frame resizing are verified. Frontend/API type checks, 1,445 unit tests and 98 browser cases passed; five captures retained in Mockups/approved-v3-editor/evidence. Formal Done and milestone merge remain pending. No commit, push, merge or deployment.

### 2026-11-06 — US-EDIT-039 annotation follow-up

Compacted V3 Layers and added non-consuming outside-pointer dismissal; moved text toggles directly after Italic. Type checks, 1,476 unit tests and 113 browser tests pass; light/dark visual evidence retained. Existing uncommitted work preserved; milestone merge pending.

### 2026-11-07 — US-EDIT-042/043 Layers-only implementation

Added actual layer previews, row-specific menus, stable atomic ordering/drag/keyboard controls, fixed background and live Overlapping. Compact footer popup retained; full/sidebar views mutually exclusive. Arrange excluded. Type checks, 1,506 unit tests, 122 regression + 1 live-overlap browser checks pass; both themes visually reviewed. Existing uncommitted work preserved, no new commit/push/merge.

- 2026-11-07 annotation revision: footer Layers now opens the full sidebar, toolbar Layers shortcut removed, shared row/toolbar action menu implemented. Element-specific controls inventoried in LAYERS_VERIFICATION.md. Type checks +1,515 unit tests pass;124 distinct browser contracts verified across full run and final28/28 affected rerun. No Arrange, commit, push or merge; formal delivery pending.


### 2026-11-07 — Local V3 delivery preparation; main merge prohibited

Current candidate branch `codex/v3-arrange-opus`; baseline V3 checkpoint `b69074b`, latest reference styling `3b8a150`. Independent Arrange review/required remediation and fresh verification are in progress; results belong to the current delivery packet, not historical Opus approvals. Reconciled US-EDIT-027 as7/8 ACs with explicit same-document routing remainder, not Done. Corrected the stale US-EDIT-038 milestone row to locally verified/merge pending. No new story number, main merge, push or deployment. See `Mockups/approved-v3-editor/V3_DELIVERY_PACKET.md` for remaining acceptance and draft review sequencing.

2026-11-07 final local delivery record: styling `3b8a150`, required Arrange repairs `7ae0fe0`; independent Arrange APPROVE; type/unit/build gates pass,1,550 unit passes (1 existing skip),133 distinct browser cases verified across full run +Preview rerun. Packet retains the full-run timeout caveat and broader release/review gaps. US-EDIT-027 remains7/8 ACs. No main merge/push/PR publication/deployment or formal closure.

### 2026-11-08 — US-EDIT-027 remaining same-document navigation guard

T2/AC4 implemented on `codex/v3-arrange-opus`: central Wouter-compatible history consent for Back/Forward/go and programmatic push/replace, preserving rejected drafts and history order; explicit first-save adoption bypass and one Projects/logo confirmation. Types pass;811 backend+751 client unit passes (1 existing skip);39 distinct browser contracts pass across the retained38-case run plus final11-case navigation rerun. [Evidence](stories/US-EDIT-027/VERIFICATION.md). All eight ACs locally verified; independent review/PR/milestone merge still pending. No main merge, push, deployment or linked-editing/Look/import/export/extraction/assistant feature work.

## Approved listing integration reconciliation — 2026-11-13

Selected existing stories: US-EDIT-025 (Listing welcome/overview, Property/Agent/Brand, saved search, reviewed paste and manual media), US-EDIT-020 (Template Fields), US-EDIT-022 (reusable Template/independent Designs with existing save path), US-EDIT-021 (actual reviewed PNG export). These contracts supersede historical Contact rename, immediate source-to-canvas behavior and proven-Look dependencies for this slice. Titles in the historical story table are draft lineage; reconciled cards are authoritative. All remain Not Started until verified.

US-EDIT-027 is an existing session/autosave foundation, not a reimplementation story: US-PROP-004 adds only new listing snapshot persistence integration in its existing session files. Broader autosave completion/merge is not claimed. Stop before M-EDIT-08 Assistant. [Integration matrix](../../../../research/2026-11-13-LISTING-V3-INTEGRATION-MATRIX.md).

## Implementation Update — 2026-11-13
Listing mockup integration through persistence and reviewed PNG export implemented locally. See docs/research/2026-11-13-V3-LISTING-IMPLEMENTATION.md. AI Assistant/providers remain deferred; no merge/Done claim.

### 2026-11-13 — US-EDIT-044 responsive V3 implementation
Phone canvas-first/bottom sheet, compact tablet shell and measured V3 viewport fit implemented on codex/v3-arrange-opus. Gate1/full units/build pass;29 scoped responsive/Layers browser checks pass. Historical shell Listing/template fixture debt remains documented in story; review/merge pending.


## Release reconciliation — 2026-11-14

2026-11-14 — reconciled from committed Opus baseline3e95a40; implementation present, release hardening/review and UI/font acceptance in progress; not merged Done. See docs/research/2026-11-14-V3-RELEASE-HARDENING.md. The implementation count includes existing locally verified cards, not merged story closures. No Assistant/provider/cutover implementation is added.
