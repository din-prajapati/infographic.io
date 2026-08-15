# M-AI-18 — Editable Text Overlay (Hybrid Render)

> **Epic:** [EPIC-AI-06](../EPIC.md) · **Status:** 🟡 In Progress · **Target:** TBD

## Scope
Editable canvas output: generated designs can be loaded as independently editable text elements over the background, not just a flat raster. Originally scoped as AI-first (text-free background + layout-engine overlay); **live verification on 2026-08-13 proved extraction-led composition (Ideogram layerize-text detecting the design's own baked-in text) is the higher-fidelity default** — see [EPIC.md's 2026-08-13 log entry](../EPIC.md). The text-free AI-first path remains in scope specifically for the real-photo flow (US-AI-051), where baking marketing text onto the user's own listing photo is undesirable regardless of extraction.

## Stories
| Story | Title | Status |
|-------|-------|--------|
| US-AI-032 | Hybrid render — editable canvas text overlay | 🔶 In Progress — AC1/2/3 live-verified 2026-08-14; AC5 (export parity), AC6 (malformed geometry) open |
| US-AI-043 | Layout engine (templates + flow renderer) | 🟡 Implementation complete (pre-PR) |
| US-AI-044 | LLM layout planner | 🟡 Implementation complete; unwired to the pipeline |
| US-AI-045 | Pipeline integration (planner → engine → canvas) | ⛔ Closed 2026-08-14 — superseded by extraction-led composition; planner's narrower remaining job deferred to [BL-07](../../../../BACKLOG.md) |
| US-AI-046 | Connect the layout engine to the editable canvas | ✅ Done |
| US-AI-047 | Shared render-mode across generation surfaces | ✅ Done |
| US-AI-048 | Cache ComposedDesign per (generation, variation) | 🟡 6/7 ACs; one manual live-latency TC deferred |
| US-AI-049 | Map extracted fonts to real editor typography | ✅ Done — 6/6 ACs; AC5 failed live 2026-08-14 (found [BL-08](../../../../BACKLOG.md)), fixed + re-verified 2026-08-15 |
| US-AI-050 | Progress affordance for the editable compose wait | ✅ Done — 6/6 ACs, AC3 live-verified 2026-08-14 |
| US-AI-051 | Text-free background for real-photo + editable | ✅ All 7 ACs verified, live on staging |

> US-AI-046 and US-AI-047 previously shipped without dedicated story cards (2026-08-13). Backfilled 2026-08-14 — see their STORY.md/TASKS.md for the retroactive AC record and the "written after the fact" Notes sections.

## Open decision
**US-AI-045 needs re-scope before implementation.** It was written 2026-08-12 to wire `LayoutPlannerService` (US-AI-044's GPT-4o Vision intent planner) into the pipeline. By 2026-08-13 the epic's actual shipped path had moved to extraction-led composition (Ideogram layerize-text detecting baked-in text) as the default, with the layout engine as fallback for genuinely text-free backgrounds — a different mechanism than what US-AI-045 assumed. Whether the planner step is still the intended path for the real-photo flow, or whether extraction-led composition + the layout-engine fallback already cover what it was meant to solve, is a product call.

## Definition of Done
- [x] Generated result opens in the canvas editor with each text value as an editable slot element — ✅ proven live 2026-08-14, end to end against staging (US-AI-051 TC-05)
- [ ] Text position/style derived from the design's own detected geometry/typography — 🟡 geometry ✅, typography mapping done (US-AI-049) but its own live-verify AC still open
- [ ] Repeat loads are cost-bounded — US-AI-048 implemented, one live TC open
- [ ] Editable is priced/gated per plan tier — pending [US-LAUNCH-015](../../EPIC-LAUNCH-01/stories/US-LAUNCH-015/STORY.md) (unblocked, not started — editable is currently free and cost-uncapped)
- [ ] Export (PNG/A4) matches the composed preview
- [ ] Gate 1 + Gate 2 (visual checklist) green

*Created: 2026-07-03 · Status corrected 2026-08-13 (was showing "Not Started" while 3 stories had already shipped) · Fully refreshed 2026-08-14 (046/047 backfilled, 044/045 added post-merge, statuses reconciled against actual AC counts)*
