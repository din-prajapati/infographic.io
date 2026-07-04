# M-AI-17 — Real Photo Background

> **Epic:** [EPIC-AI-06](../EPIC.md) · **Status:** 🔲 Not Started · **Target:** TBD

## Scope
Uploaded listing photos (from US-AI-010) become the actual background of generated infographics via Ideogram's image-reference/edit capabilities, replacing synthetic property imagery. Includes the synthetic-content guard.

## Stories
| Story | Title | Status |
|-------|-------|--------|
| US-AI-031 | Real listing photo as generation background | 🔲 |
| US-AI-033 | Synthetic-content guard — no fake faces/buildings on real listings | 🔲 |

## Definition of Done
- [ ] Generation with an uploaded photo produces output whose background is recognizably that photo
- [ ] No synthetic agent faces or property imagery when real assets exist
- [ ] Exact-text verification still passes on photo-backed generations
- [ ] Gate 1 (check + unit tests) green

*Created: 2026-07-03*
