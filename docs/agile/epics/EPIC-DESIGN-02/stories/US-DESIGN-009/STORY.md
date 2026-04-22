# Story Card — US-DESIGN-009

> **Status:** 🔲 Not Started  
> **Feature:** F-DESIGN-09 — Component Visual Polish  
> **Epic:** [EPIC-DESIGN-02](../../EPIC.md)  
> **Milestone:** [M-DESIGN-05 — Component Visual Polish](../../milestones/M-DESIGN-05-component-polish.md)  
> **Linear:** LIN-XXX  
> **Created:** 2026-04-17 | **Closed:** —

---

## Story

*As a* real estate agent browsing the templates library  
*I want* the Templates page to look like a polished creative tool (inspired by FillinForm)  
*So that* the interface feels premium and visually distinct from generic SaaS dashboards

---

## Acceptance Criteria

- [ ] **AC1:** Filter pills — active pill uses `--filter-pill-active-bg` (solid dark `#0f1729`) + white text; inactive uses transparent background with border
- [ ] **AC2:** Template card header — each card has a colored block header using the `--category-*` color token (not photo-only cards)
- [ ] **AC3:** "Use Template" button — uses `--btn-cta-bg` dark navy style, not default shadcn primary
- [ ] **AC4:** Search bar — uses `--search-radius` pill shape and `--search-shadow` subtle lift
- [ ] **AC5:** Category overview cards — icon container uses `--category-surface-*` background with left-border accent color
- [ ] **AC6:** No component logic, routing, or data changes — only visual CSS/class changes
- [ ] **AC7:** All changes work in both Light and Dark modes
- [ ] **AC8:** `npm run check` passes — zero TypeScript errors
- [ ] **AC9:** `npm run test:unit` passes — no regressions

---

## Visual Reference

**Target:** `design-preview-templates.html` (project root) — open in browser for exact visual target.

Key visual elements to match:
- Filter pills: active = solid dark pill, inactive = transparent outlined pill
- Card grid: each card has a 120px colored header block at top, with title/category overlay
- CTA button: dark navy `#0f1729`, white text, full-width on card hover
- Search: large pill-shaped input with soft shadow, placeholder "Search templates..."
- Category overview: icon in colored rounded square, category name, template count, left accent border

---

## Token References

| Element | Token | Value |
|---------|-------|-------|
| Active filter pill bg | `--filter-pill-active-bg` | `#0f1729` |
| Active filter pill text | `--filter-pill-active-text` | `#ffffff` |
| Inactive filter pill border | `--filter-pill-inactive-border` | `rgba(15,23,41,0.2)` |
| CTA button bg | `--btn-cta-bg` | `#0f1729` |
| CTA button text | `--btn-cta-text` | `#ffffff` |
| Search border radius | `--search-radius` | `9999px` |
| Search shadow | `--search-shadow` | `0 2px 8px rgba(0,0,0,0.06)` |
| Category surface (listings) | `--category-surface-listing-announcements` | `#EFF6FF` |
| Category surface (features) | `--category-surface-property-features` | `#F5F3FF` |
| Category surface (status) | `--category-surface-status-updates` | `#ECFDF5` |
| Category surface (branding) | `--category-surface-agent-branding` | `#FFFBEB` |

---

## Out of Scope

- Changing template data, filtering logic, or routing
- Adding new templates or categories
- Template card hover animation (motion is M-DESIGN-05 extended scope if needed)
- AI Chat panel changes (US-DESIGN-011)
- Dark-mode specific layout changes — only token swaps

---

## Engineering / PR

- **Branch:** `feat/design-us-design-009-templates-page-visual`
- **PR:** #_____
- **Primary files touched:**
  - `client/src/components/pages/TemplatesPage.tsx`

---

## AI Implementation Prompt

> Copy this block into Claude Code to implement the story.

```
Context: InfographicAI SaaS — React frontend (Tailwind v4 + shadcn/ui).
See CLAUDE.md for architecture. Token reference: client/src/design-tokens.css
Visual target: design-preview-templates.html (open in browser for reference)

Story: US-DESIGN-009 — TemplatesPage visual redesign

File: client/src/components/pages/TemplatesPage.tsx

Changes required (visual only — no logic changes):

1. Filter pills:
   - Active pill: replace current active class with style={{ backgroundColor: 'var(--filter-pill-active-bg)', color: 'var(--filter-pill-active-text)' }}
   - Inactive pill: transparent background + border using border-border class

2. Template card header block:
   - Add a colored 80-120px header div at top of each card using the template's category color
   - style={{ backgroundColor: 'var(--category-' + template.category + ')' }} or use the template color property

3. "Use Template" CTA button:
   - style={{ backgroundColor: 'var(--btn-cta-bg)', color: 'var(--btn-cta-text)' }}

4. Search bar:
   - Add className="rounded-full shadow-sm" or style={{ borderRadius: 'var(--search-radius)', boxShadow: 'var(--search-shadow)' }}

5. Category overview cards (if present):
   - Icon container: style={{ backgroundColor: 'var(--category-surface-' + slug + ')' }}
   - Left border accent: style={{ borderLeftColor: 'var(--category-' + slug + ')' }}

Rules:
- Do NOT change any filtering logic, routing, or data fetching
- Do NOT add new files — only edit TemplatesPage.tsx
- Do NOT change template count, pagination, or sort controls
- When done: confirm npm run check passes
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-DS-009-01 | Manual | P0 | Active filter pill is solid dark navy, not primary blue | 🔲 | |
| TC-DS-009-02 | Manual | P0 | Template cards have colored header block (not image-only) | 🔲 | |
| TC-DS-009-03 | Manual | P0 | "Use Template" CTA is dark navy, not default shadcn button | 🔲 | |
| TC-DS-009-04 | Manual | P1 | Search bar has pill shape with subtle shadow | 🔲 | |
| TC-DS-009-05 | Manual | P1 | Category overview cards have icon bg + left accent border | 🔲 | |
| TC-DS-009-06 | Manual | P1 | Dark mode: all visual changes remain coherent | 🔲 | |
| TC-DS-009-07 | Manual | P0 | Filtering still works — clicking filter pill filters templates | 🔲 | |
| TC-DS-009-08 | Auto | P0 | `npm run check` — zero TypeScript errors | 🔲 | |
| TC-DS-009-09 | Auto | P0 | `npm run test:unit` — all unit tests pass | 🔲 | |

---

## Definition of Done

- [ ] All ACs checked ✅
- [ ] All test cases run and recorded
- [ ] `npm run check` passes
- [ ] `npm run test:unit` passes
- [ ] Manual smoke: Templates page Light + Dark — filter pills, card headers, CTA, search, category cards
- [ ] Visual match to `design-preview-templates.html` confirmed
- [ ] PR merged (PR #_____)
- [ ] TASKS.md task list fully checked

---

*Story created: 2026-04-17*
