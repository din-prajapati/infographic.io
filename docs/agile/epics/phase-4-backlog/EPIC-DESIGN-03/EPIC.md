# EPIC-DESIGN-03 — Component Visual Polish (Phase 4 Backlog)

> **Phase:** Phase 4 Backlog — promote after Phase 3 AI Advanced gate closes  
> **Status:** 🔲 Not Started (Deferred from EPIC-DESIGN-02 M-DESIGN-05, decision 2026-04-25)  
> **Depends on:** EPIC-DESIGN-02 closed (M-DESIGN-03 + M-DESIGN-04 shipped) ✅  
> **Owner:** Dinesh  
> **Backlog ref:** [Phase 4 Backlog B-01](../../phase-4-backlog/README.md#b-01--m-design-05--component-visual-polish)

---

## Goal

**Outcome:** Apply component-specific tokens from `design-tokens.css` to the three main UI surfaces — Templates page, Canvas Editor, and AI Chat panel. This delivers the full Lovart.ai + FillinForm visual identity to every user-facing screen. No logic, layout, or component structure changes — CSS class and inline-style updates only.

**Why deferred:** M-DESIGN-03 (color scheme + font) and M-DESIGN-04 (domain colors) shipped as the MVP visual baseline. M-DESIGN-05 was deferred to keep Phase 0 scope tight and ship on time.

**Reference artefacts:**
| Artefact | Path |
|---|---|
| Token source | `client/src/design-tokens.css` |
| Templates preview | `design-preview-templates.html` |
| Canvas preview | `design-preview-canvas.html` |

**Success metric:** Theme toggle on Templates + Editor + AI Chat in both Light and Dark matches the HTML preview files. `npm run check` + `npm run test:unit` green after all three PRs.

---

## Milestones

| Milestone | Scope | Status |
|-----------|-------|--------|
| [M-DESIGN-05 — Component Visual Polish](milestones/M-DESIGN-05-component-polish.md) | TemplatesPage, Editor, AI Chat token application | 🔲 Not Started |

---

## Stories

| Story ID | Title | Milestone | Status |
|----------|-------|-----------|--------|
| [US-DESIGN-009](stories/US-DESIGN-009/STORY.md) | TemplatesPage visual redesign (filter pills + card headers) | M-DESIGN-05 | 🔲 |
| [US-DESIGN-010](stories/US-DESIGN-010/STORY.md) | Editor component visual refinement (toolbar + sidebar tokens) | M-DESIGN-05 | 🔲 |
| [US-DESIGN-011](stories/US-DESIGN-011/STORY.md) | AI Chat panel visual refinement (surface + promo tokens) | M-DESIGN-05 | 🔲 |

---

## Key Files (no changes to structure — token updates only)

| Surface | File |
|---------|------|
| Templates page | `client/src/components/pages/TemplatesPage.tsx` |
| Editor floating toolbar | `client/src/components/editor/FloatingToolbar.tsx` |
| Editor layer sidebar | `client/src/components/editor/LayersPanel.tsx` |
| AI Chat panel | `client/src/components/ai-chat/AIChatBox.tsx` |

---

## Definition of Done

- [ ] US-DESIGN-009 PR merged — TemplatesPage filter pills + card headers + CTA match preview
- [ ] US-DESIGN-010 PR merged — editor floating toolbar is dark pill, layer sidebar is white panel
- [ ] US-DESIGN-011 PR merged — AI chat promo banner lime, user bubble blue, AI bubble warm grey
- [ ] `npm run check` + `npm run test:unit` green after all three PRs
- [ ] Manual smoke: theme toggle on Templates + Editor + AI chat in both Light and Dark
- [ ] HTML preview pages visually match the shipped UI
- [ ] AGILE_INDEX.md epic row updated to ✅ Done

---

*Epic created: 2026-04-29 — deferred from EPIC-DESIGN-02 M-DESIGN-05 (2026-04-25 decision)*
