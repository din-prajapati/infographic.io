# M-DESIGN-05 — Component Visual Polish

> **Epic:** [EPIC-DESIGN-02](../EPIC.md)  
> **Status:** 🔲 Not Started  
> **Target:** 2026-05-31  
> **Prerequisite:** M-DESIGN-04 closed (domain color tokens in place)

---

## Goal

Apply the component-specific tokens from `design-tokens.css` to the three main UI areas: Templates page, Canvas Editor, and AI Chat panel. This delivers the full Lovart.ai + FillinForm visual identity to the user-facing surfaces. No logic or layout changes — only CSS class and inline-style updates.

Reference: `design-preview-templates.html` and `design-preview-canvas.html` show the target visual.

---

## Stories

| Story | Title | Status |
|-------|-------|--------|
| [US-DESIGN-009](../stories/US-DESIGN-009/STORY.md) | TemplatesPage visual redesign | 🔲 |
| [US-DESIGN-010](../stories/US-DESIGN-010/STORY.md) | Editor component visual refinement | 🔲 |
| [US-DESIGN-011](../stories/US-DESIGN-011/STORY.md) | AI Chat panel visual refinement | 🔲 |

---

## Visual targets per story

### US-DESIGN-009 — TemplatesPage (FillinForm reference)
- Filter pills: active = `--filter-pill-active-bg` solid dark, inactive = transparent
- Template card header: colored block using `--category-*` token, not photo-only
- "Use Template" button: `--btn-cta-bg` dark navy style
- Search bar: `--search-radius` pill shape, `--search-shadow` subtle lift
- Category overview cards: `--category-surface-*` icon backgrounds with left-border accent

### US-DESIGN-010 — Editor (Lovart.ai reference)
- Floating toolbar: `--toolbar-floating-bg: #2c2c2c` dark pill shape
- Layer sidebar panel: `--sidebar-panel-*` tokens (white bg, subtle borders)
- Active layer item: `--sidebar-panel-item-bg-active` blue tint
- Canvas outer area: `--canvas-bg: #f5f5f5` (already close — verify token usage)
- Canvas selection: `--canvas-selection-stroke: #3b82f6`

### US-DESIGN-011 — AI Chat (Lovart.ai reference)
- Chat panel background: `--chat-panel-bg` white
- AI message bubble: `--chat-message-ai-bg` warm grey
- User message bubble: `--chat-message-user-bg` brand blue
- Promo banner: `--chat-promo-banner-bg: #e0ff66` lime
- Chat input: `--chat-input-bg` + `--chat-input-border` tokens
- Bottom action chips: `--chat-action-chip` style

---

## Milestone done when

- [ ] US-DESIGN-009 PR merged — TemplatesPage filter pills + card headers + CTA match preview
- [ ] US-DESIGN-010 PR merged — editor floating toolbar is dark pill, layer sidebar is white panel
- [ ] US-DESIGN-011 PR merged — AI chat promo banner lime, user bubble blue, AI bubble warm grey
- [ ] `npm run check` + `npm run test:unit` green after all three PRs
- [ ] Manual smoke: theme toggle on Templates + Editor + AI chat in both Light and Dark
- [ ] design-preview HTML pages visually match the shipped UI

---

*Milestone created: 2026-04-17*
