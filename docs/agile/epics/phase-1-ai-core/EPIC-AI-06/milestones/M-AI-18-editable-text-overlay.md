# M-AI-18 — Editable Text Overlay (Hybrid Render)

> **Epic:** [EPIC-AI-06](../EPIC.md) · **Status:** 🟡 Content-complete — all 10 stories Done or resolved-superseded as of 2026-08-15; only blocked on pricing/gating (US-LAUNCH-015, a separate, unstarted story) · **Target:** TBD

## Scope
Editable canvas output: generated designs can be loaded as independently editable text elements over the background, not just a flat raster. Originally scoped as AI-first (text-free background + layout-engine overlay); **live verification on 2026-08-13 proved extraction-led composition (Ideogram layerize-text detecting the design's own baked-in text) is the higher-fidelity default** — see [EPIC.md's 2026-08-13 log entry](../EPIC.md). The text-free AI-first path remains in scope specifically for the real-photo flow (US-AI-051), where baking marketing text onto the user's own listing photo is undesirable regardless of extraction.

## Stories
| Story | Title | Status |
|-------|-------|--------|
| US-AI-032 | Hybrid render — editable canvas text overlay | ✅ Done — all 7 ACs, 2026-08-15 (AC5/BL-09 turned out already fixed by prior work; found [BL-10](../../../../BACKLOG.md) along the way) |
| US-AI-043 | Layout engine (templates + flow renderer) | ✅ Done — all 8 ACs, 132 tests, re-verified 2026-08-15 |
| US-AI-044 | LLM layout planner | ✅ Done — all 8 ACs, 49 tests, re-verified 2026-08-15. Unwired by design (see its Notes) — narrower remaining job is [BL-07](../../../../BACKLOG.md) |
| US-AI-045 | Pipeline integration (planner → engine → canvas) | ⛔ Closed 2026-08-14 — superseded by extraction-led composition; planner's narrower remaining job deferred to [BL-07](../../../../BACKLOG.md) |
| US-AI-046 | Connect the layout engine to the editable canvas | ✅ Done |
| US-AI-047 | Shared render-mode across generation surfaces | ✅ Done |
| US-AI-048 | Cache ComposedDesign per (generation, variation) | ✅ Done — 7/7 ACs, live-verified 2026-08-15 (2.97s cached round trip vs. 15-90s real) |
| US-AI-049 | Map extracted fonts to real editor typography | ✅ Done — 6/6 ACs; AC5 failed live 2026-08-14 (found [BL-08](../../../../BACKLOG.md)), fixed + re-verified 2026-08-15 |
| US-AI-050 | Progress affordance for the editable compose wait | ✅ Done — 6/6 ACs, AC3 live-verified 2026-08-14 |
| US-AI-051 | Text-free background for real-photo + editable | ✅ All 7 ACs verified, live on staging |

> US-AI-046 and US-AI-047 previously shipped without dedicated story cards (2026-08-13). Backfilled 2026-08-14 — see their STORY.md/TASKS.md for the retroactive AC record and the "written after the fact" Notes sections.

## Open decision — resolved 2026-08-15
**US-AI-045 needed re-scope before implementation.** It was written 2026-08-12 to wire `LayoutPlannerService` (US-AI-044's GPT-4o Vision intent planner) into the pipeline. By 2026-08-13 the epic's actual shipped path had moved to extraction-led composition (Ideogram layerize-text detecting baked-in text) as the default, with the layout engine as fallback for genuinely text-free backgrounds — a different mechanism than what US-AI-045 assumed. **Resolved**: extraction-led composition covers what US-AI-045 was meant to solve for the common case; US-AI-045 closed as superseded. The planner's narrower remaining job — photo-aware template selection for the real-photo fallback only — is tracked as [BL-07](../../../../BACKLOG.md), deliberately not built.

## Definition of Done
- [x] Generated result opens in the canvas editor with each text value as an editable slot element — ✅ proven live 2026-08-14, end to end against staging (US-AI-051 TC-05)
- [x] Text position/style derived from the design's own detected geometry/typography — geometry ✅, typography mapping (US-AI-049) live-verified 2026-08-15 after fixing a real regression ([BL-08](../../../../BACKLOG.md))
- [x] Repeat loads are cost-bounded — US-AI-048 live-verified 2026-08-15 (2.97s cached vs. 15-90s real)
- [ ] Editable is priced/gated per plan tier — pending [US-LAUNCH-015](../../EPIC-LAUNCH-01/stories/US-LAUNCH-015/STORY.md) (unblocked, not started — editable is currently free and cost-uncapped). **This is the one remaining gate on this milestone.**
- [x] Export (PNG/A4) matches the composed preview — live-verified 2026-08-15 ([BL-09](../../../../BACKLOG.md), turned out already fixed by prior work)
- [x] Gate 1 green throughout (tsc clean, backend 350/350, client 225/225) — Gate 2 (visual checklist) not separately tracked; live E2E verification across US-AI-032/048/049/050/051 substitutes for it

*Created: 2026-07-03 · Status corrected 2026-08-13 (was showing "Not Started" while 3 stories had already shipped) · Fully refreshed 2026-08-14 (046/047 backfilled, 044/045 added post-merge, statuses reconciled against actual AC counts) · Content-complete 2026-08-15 (043/044 closed, only US-LAUNCH-015 pricing/gating remains)*
