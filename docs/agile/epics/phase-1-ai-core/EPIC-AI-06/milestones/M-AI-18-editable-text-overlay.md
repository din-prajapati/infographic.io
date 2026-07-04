# M-AI-18 — Editable Text Overlay (Hybrid Render)

> **Epic:** [EPIC-AI-06](../EPIC.md) · **Status:** 🔲 Not Started · **Target:** TBD

## Scope
Hybrid output mode: AI generates the *text-free* background/layout; exact text is overlaid as editable canvas slot elements (reusing US-DESIGN-012 slot infrastructure). Users can edit any text after generation — the capability neither Ideogram nor Canva offers for this workflow.

## Stories
| Story | Title | Status |
|-------|-------|--------|
| US-AI-032 | Hybrid render — text-free background + editable canvas text overlay | 🔲 |

## Definition of Done
- [ ] Generated result opens in the canvas editor with each text value as an editable slot element
- [ ] Text position/style derived from the V4 json_prompt element descriptions
- [ ] Export (PNG/A4) matches the composed preview
- [ ] Gate 1 + Gate 2 (visual checklist) green

*Created: 2026-07-03*
