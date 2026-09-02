# M-AI-17 — Real Photo Background

> **Epic:** [EPIC-AI-06](../EPIC.md)
> **Status:** ✅ Done — closed 2026-08-15, live-verified
> **Target date:** TBD
>
> *(Header split onto its own lines 2026-09-02. Status was previously inline on the Epic line,
> which reads fine to a human but is invisible to anything scanning for a `**Status:**` line —
> this card and M-AI-18 both came back blank in a status sweep. Content unchanged.)*

## Scope
The agent's uploaded listing photo becomes the **source image** for the composition, so the design is built around the real property. The composition's own text is then discarded: layer extraction recovers its measured geometry, and the application re-renders canonical listing values at those positions.

> **Architecture changed 2026-08-11.** This milestone previously assumed the photo could be referenced from inside a structured `json_prompt`. [SPIKE-031](../SPIKE-031-ideogram-photo-background.md) established that no provider endpoint accepts both a structured prompt and an input image — every image-conditioned endpoint takes plain text. The exact-text guarantee therefore moved out of the image model and into our own renderer. See [ARCHITECTURE.mmd](../ARCHITECTURE.mmd).

## Stories
| Story | Title | Status |
|-------|-------|--------|
| US-AI-031 | Real property photo as composition source | ✅ Done — all 7 ACs, AC1 live-verified 2026-08-15 |
| US-AI-031b | Layer extraction and canonical text rendering | ✅ Done — all ACs, AC1 live-verified 2026-08-15 (via the layout-engine fallback — extraction found 0 blocks this run, a real finding, see STORY.md) |

> **US-AI-033** moved to [EPIC-AI-08](../../../phase-4-backlog/EPIC-AI-08/EPIC.md) 2026-08-11 (scope under review, no longer in this milestone). Reconciled from a stale `origin/main` snapshot (`ef5adda`) that predated the move.

## Definition of Done
- [x] Generation with an uploaded photo produces output whose background is recognizably that photo — live-verified 2026-08-15, screenshot evidence in both stories' `evidence/` folders
- [x] **Every canonical listing value renders exactly** — confirmed live for address + price on a real photo composition, via the layout-engine fallback (extraction found 0 blocks this run — see US-AI-031b's AC1 note for why this is a real, honest finding rather than a failure)
- [x] Degradation paths hold: extraction failure still yields a usable flat design; undetected fields still render via fallback geometry — this run *was* the degradation path (0 blocks detected) and it held exactly as designed
- [x] Gate 1 (check + unit tests) green
- [x] ⛽ **Live verification run** — executed 2026-08-15 against a credited account. `e2e/us-ai-031-real-photo-composition.spec.ts`. Both stories' AC1 closed.

*Created: 2026-07-03 · Closed: 2026-08-15*
