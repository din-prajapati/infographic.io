# M-AI-18 — Editable Text Overlay (Hybrid Render)

> **Epic:** [EPIC-AI-06](../EPIC.md) · **Status:** 🟡 In Progress · **Target:** TBD

## Scope
Editable canvas output: generated designs can be loaded as independently editable text elements over the background, not just a flat raster. Originally scoped as AI-first (text-free background + layout-engine overlay); **live verification on 2026-08-13 proved extraction-led composition (Ideogram layerize-text detecting the design's own baked-in text) is the higher-fidelity default** — see [EPIC.md's 2026-08-13 log entry](../EPIC.md). The text-free AI-first path remains in scope specifically for the real-photo flow (US-AI-051), where baking marketing text onto the user's own listing photo is undesirable regardless of extraction.

## Stories
| Story | Title | Status |
|-------|-------|--------|
| US-AI-032 | Hybrid render — editable canvas text overlay | 🟡 T1/T6 done; T2–T5 open |
| US-AI-043 | Layout engine (templates + flow renderer) | 🟡 Implementation complete (pre-PR) |
| US-AI-048 | Cache ComposedDesign per (generation, variation) | 🔲 Not Started |
| US-AI-049 | Map extracted fonts to real editor typography | 🔲 Not Started |
| US-AI-050 | Progress affordance for the editable compose wait | 🔲 Not Started |
| US-AI-051 | Text-free background for real-photo + editable | 🔲 Not Started |

> Also shipped under this milestone without dedicated story cards, per EPIC.md 2026-08-13 log: the generation-id pairing fix, the layerize multipart fix (US-AI-031b's actual root cause — extraction had never worked), and the extraction-led ordering. Retroactive cards are a documented gap, not silently dropped.

## Definition of Done
- [ ] Generated result opens in the canvas editor with each text value as an editable slot element — ✅ proven live 2026-08-13 (blocksDetected:4, matched:4)
- [ ] Text position/style derived from the design's own detected geometry/typography — 🟡 geometry ✅, typography pending US-AI-049 (font mapping)
- [ ] Repeat loads are cost-bounded — pending US-AI-048
- [ ] Editable is priced/gated per plan tier — pending [US-LAUNCH-015](../../EPIC-LAUNCH-01/stories/US-LAUNCH-015/STORY.md)
- [ ] Export (PNG/A4) matches the composed preview
- [ ] Gate 1 + Gate 2 (visual checklist) green

*Created: 2026-07-03 · Status corrected 2026-08-13 (was showing "Not Started" while 3 stories had already shipped)*
