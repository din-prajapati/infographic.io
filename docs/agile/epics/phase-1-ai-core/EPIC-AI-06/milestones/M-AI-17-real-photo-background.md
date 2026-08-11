# M-AI-17 — Real Photo Background

> **Epic:** [EPIC-AI-06](../EPIC.md) · **Status:** 🟡 In Progress · **Target:** TBD

## Scope
The agent's uploaded listing photo becomes the **source image** for the composition, so the design is built around the real property. The composition's own text is then discarded: layer extraction recovers its measured geometry, and the application re-renders canonical listing values at those positions.

> **Architecture changed 2026-08-11.** This milestone previously assumed the photo could be referenced from inside a structured `json_prompt`. [SPIKE-031](../SPIKE-031-ideogram-photo-background.md) established that no provider endpoint accepts both a structured prompt and an input image — every image-conditioned endpoint takes plain text. The exact-text guarantee therefore moved out of the image model and into our own renderer. See [ARCHITECTURE.mmd](../ARCHITECTURE.mmd).

## Stories
| Story | Title | Status |
|-------|-------|--------|
| US-AI-031 | Real property photo as composition source | 🟡 AC2–AC7 verified; AC1 gated on Ideogram credit |
| US-AI-031b | Layer extraction and canonical text rendering | 🟡 AC2–AC9 verified; AC1 gated on Ideogram credit |
| US-AI-033 | Synthetic-content guard — no fake faces/buildings on real listings | 🔲 ⚠️ scope under review 2026-08-07 — do not implement as written; see [Scope review](../stories/US-AI-033/STORY.md#scope-review--2026-08-07-not-decided) |

## Definition of Done
- [ ] Generation with an uploaded photo produces output whose background is recognizably that photo
- [ ] No synthetic agent faces or property imagery when real assets exist
- [ ] **Every canonical listing value renders exactly** — headline, address, price, stats, agent, brokerage. Note this is now a *deterministic rendering* property, not a verification of model output: the application typesets the text, so correctness no longer depends on the image model. The previous wording ("exact-text verification still passes on photo-backed generations") described `verifyAndRepairV4JsonPrompt`, which cannot run on this path at all.
- [ ] Degradation paths hold: extraction failure still yields a usable flat design; undetected fields still render via fallback geometry
- [ ] Gate 1 (check + unit tests) green
- [ ] ⛽ **Live verification run** — the ~$1 spike open-questions (real-photo fidelity, `image_weight` calibration, stylised-headline detection rate) executed against a credited account. This gates AC1 on both US-AI-031 and US-AI-031b and must clear before the milestone PR merges.

*Created: 2026-07-03*
