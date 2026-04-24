# EPIC-DESIGN-02 — UI/UX Redesign: Lovart.ai + FillinForm Reference Theme

> **Phase:** Phase 0 — MVP Launch  
> **Status:** 🔄 In Progress  
> **Depends on:** EPIC-DESIGN-01 M-DESIGN-02 closed (dark-mode tokens baseline must be in place)  
> **Linear Project:** LIN-EPIC-02 (create when setting up Linear)  
> **Target date:** 2026-05-31  
> **Owner:** Dinesh

---

## Goal

**Outcome:** Replace InfographicAI's current teal/cool-grey generic SaaS aesthetic with a warm, creative-tool visual identity synthesised from two reference products — Lovart.ai (canvas editor) and FillinForm (SaaS dashboard). All changes are token-layer only; no component structure, layout, or logic changes.

**Why now:** Design tokens are now centralised (EPIC-DESIGN-01 output). The colour scheme, typography, and domain colour system were never updated to reflect the product's real estate focus or the creative-tool positioning. The diff is documented in [`docs/DESIGN_TOKEN_DIFF.md`](../../../../DESIGN_TOKEN_DIFF.md).

**Reference artefacts produced this session:**
| Artefact | Path |
|---|---|
| Synthesised design token source | `client/src/design-tokens.css` |
| Token diff (old vs new) | `docs/DESIGN_TOKEN_DIFF.md` |
| Templates Gallery HTML preview | `design-preview-templates.html` |
| Canvas Editor HTML preview | `design-preview-canvas.html` |

**Success metric:** Theme toggle on all pages shows the new warm-cream (light) / warm-dark (dark) scheme. Templates page filter pills, card headers, and category dots use the real estate token palette. Editor floating toolbar uses dark-pill style. `npm run check` + `npm run test:unit` pass after all changes.

---

## What EPIC-DESIGN-01 covered vs what this epic adds

| Area                                            | EPIC-DESIGN-01   | EPIC-DESIGN-02 |
| ----------------------------------------------- | ---------------- | -------------- |
| Dark-mode token adoption (gray→token)           | ✅ Done (US-002) | Not touched    |
| Color scheme (primary / secondary / bg hues)    | ❌ Not changed   | ✅ This epic   |
| Display font (Outfit)                           | ❌ Not added     | ✅ This epic   |
| Real estate domain color system                 | ❌ Not done      | ✅ This epic   |
| Component-specific tokens (toolbar, card, chat) | ❌ Not done      | ✅ This epic   |
| Template badge tier tokens                      | ❌ Not done      | ✅ This epic   |
| Motion / z-index token layer                    | ❌ Not done      | ✅ This epic   |

---

## Milestones

| Milestone                                                                           | Scope                                                    | Target     | Status         |
| ----------------------------------------------------------------------------------- | -------------------------------------------------------- | ---------- | -------------- |
| [M-DESIGN-03 — Token Foundation](milestones/M-DESIGN-03-token-foundation.md)        | Replace globals.css color scheme + add Outfit font       | 2026-05-10 | ✅ Done — 2026-04-22 |
| [M-DESIGN-04 — Domain Color System](milestones/M-DESIGN-04-domain-colors.md)        | Migrate hardcoded category/chip/badge colors to tokens   | 2026-05-20 | ✅ Done — 2026-04-23 |
| [M-DESIGN-05 — Component Visual Polish](milestones/M-DESIGN-05-component-polish.md) | Apply component tokens to TemplatesPage, Editor, AI Chat | 2026-05-31 | 🔲 Not Started      |

---

## Stories in this Epic

| Story ID                                        | Title                                                         | Milestone   | Status | PR  |
| ----------------------------------------------- | ------------------------------------------------------------- | ----------- | ------ | --- |
| [US-DESIGN-005](stories/US-DESIGN-005/STORY.md) | New color scheme in globals.css                               | M-DESIGN-03 | ✅     | —   |
| [US-DESIGN-006](stories/US-DESIGN-006/STORY.md) | Outfit display font integration                               | M-DESIGN-03 | ✅     | —   |
| [US-DESIGN-007](stories/US-DESIGN-007/STORY.md) | Real estate category color token migration                    | M-DESIGN-04 | ✅     | —   |
| [US-DESIGN-008](stories/US-DESIGN-008/STORY.md) | Template badge tier token migration                           | M-DESIGN-04 | ✅     | —   |
| [US-DESIGN-009](stories/US-DESIGN-009/STORY.md) | TemplatesPage visual redesign (filter pills + card headers)   | M-DESIGN-05 | 🔲     | —   |
| [US-DESIGN-010](stories/US-DESIGN-010/STORY.md) | Editor component visual refinement (toolbar + sidebar tokens) | M-DESIGN-05 | 🔲     | —   |
| [US-DESIGN-011](stories/US-DESIGN-011/STORY.md) | AI Chat panel visual refinement (surface + promo tokens)      | M-DESIGN-05 | 🔲     | —   |

---

## Features in this Epic

| Feature ID  | Scope                                                      | Stories                                     |
| ----------- | ---------------------------------------------------------- | ------------------------------------------- |
| F-DESIGN-05 | Token foundation — color scheme + typography               | US-DESIGN-005, US-DESIGN-006                |
| F-DESIGN-06 | Domain color system — real estate categories + badge tiers | US-DESIGN-007, US-DESIGN-008                |
| F-DESIGN-07 | Component visual polish — templates, editor, AI chat       | US-DESIGN-009, US-DESIGN-010, US-DESIGN-011 |

---

## Key Token Changes (summary — full diff in `docs/DESIGN_TOKEN_DIFF.md`)

```
PRIMARY    174 72% 40%  (teal)      →  207 90% 49%  (#0ca0eb blue)
SECONDARY  239 84% 67%  (purple)    →  38  93% 66%  (#f9b959 amber)
BACKGROUND 220 20% 97%  (cool grey) →  45  13% 97%  (#f9f8f6 warm cream)
DARK BG    228 20%  6%  (navy)      →  45  30%  4%  (#100f09 warm black)
FONT       Inter only               →  Inter + Outfit (display)
NEW        —                        →  category-*, chip-*, badge-*, toolbar-*, chat-*
```

---

## Architecture Notes

```
Design token source:    client/src/design-tokens.css      ← new reference file
Active token file:      client/src/styles/globals.css     ← file to update
Tailwind config:        tailwind.config.ts                ← fontFamily.display added
HTML entry:             index.html / vite config           ← Google Fonts <link>
Category data:          client/src/components/ai-chat/categoryChipsData.ts
Template data:          client/src/components/ai-chat/templateData.ts
Templates page:         client/src/components/pages/TemplatesPage.tsx
Editor toolbar:         client/src/components/editor/FloatingToolbar.tsx
Layer sidebar:          client/src/components/editor/LayersPanel.tsx
AI Chat:                client/src/components/ai-chat/AIChatBox.tsx
```

---

## Out of Scope (Epic Level)

- Canvas artboard drawing area (intentionally neutral background)
- Landing page (may differ for marketing reasons)
- Any logic, event handler, or prop type changes
- Backend / API changes
- Component structure or layout changes
- Pixel-perfect match to reference sites (inspiration only)
- Accessibility audit (separate epic)

---

## Definition of Done (Epic)

- [x] M-DESIGN-03 closed (color scheme + font shipped) — 2026-04-22
- [x] M-DESIGN-04 closed (category/badge tokens migrated) — 2026-04-23
- [ ] M-DESIGN-05 closed (component visual polish shipped)
- [ ] All stories ✅ Done
- [ ] `npm run check` + `npm run test:unit` passing
- [ ] design-preview-templates.html + design-preview-canvas.html visually match shipped UI
- [ ] AGILE_INDEX.md epic row updated to ✅ Done
- [ ] docs/MVP_LAUNCH_TRACKER.md design QA task ticked

---

_Epic created: 2026-04-17 | Design tokens synthesised from Lovart.ai + FillinForm reference session_
