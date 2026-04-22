# Story Card — US-DESIGN-007

> **Status:** 🔲 Not Started  
> **Feature:** F-DESIGN-07 — Domain Color System  
> **Epic:** [EPIC-DESIGN-02](../../EPIC.md)  
> **Milestone:** [M-DESIGN-04 — Domain Color System](../../milestones/M-DESIGN-04-domain-colors.md)  
> **Linear:** LIN-XXX  
> **Created:** 2026-04-17 | **Closed:** —

---

## Story

*As a* real estate agent browsing templates  
*I want* category chips and template cards to use a consistent, semantically meaningful color system  
*So that* each category (listings, open house, sold, agent branding, etc.) has a visually distinct and brand-appropriate color that doesn't look like a generic SaaS tool

---

## Acceptance Criteria

- [ ] **AC1:** `categoryChipsData.ts` — all 6 `color` values replaced with CSS `var(--chip-*)` token references
- [ ] **AC2:** `templateData.ts` — all 4 `color` values replaced with CSS `var(--category-*)` token references
- [ ] **AC3:** `TemplateCategoryView.tsx` — all `text-gray-*`, `bg-gray-*`, `border-gray-*` Tailwind classes replaced with semantic token equivalents
- [ ] **AC4:** `TemplateCategoryView.tsx` — `bg-yellow-100 text-yellow-700` replaced with semantic token equivalent
- [ ] **AC5:** Grep check: `grep -r "FF8C00\|4CAF50\|9C27B0\|FF5722\|00BCD4\|2196F3" client/src` → 0 results
- [ ] **AC6:** Category chips render with correct domain colors in Light mode (blue=listings, orange=open-house, emerald=just-sold, amber=agent-branding, indigo=market-stats, teal=neighborhood)
- [ ] **AC7:** Template category cards render correct colored header blocks in both Light and Dark modes
- [ ] **AC8:** `npm run check` passes — zero TypeScript errors
- [ ] **AC9:** `npm run test:unit` passes — no regressions

---

## Token Replacement Map

### categoryChipsData.ts

| Old hex | Category | New CSS var | New color |
|---------|----------|-------------|-----------|
| `'#FF8C00'` | property-listings | `var(--chip-property-listings)` | `#3B82F6` blue |
| `'#4CAF50'` | open-house | `var(--chip-open-house)` | `#F97316` orange |
| `'#2196F3'` | just-sold | `var(--chip-just-sold)` | `#10B981` emerald |
| `'#9C27B0'` | agent-branding | `var(--chip-agent-branding)` | `#F59E0B` amber |
| `'#FF5722'` | market-stats | `var(--chip-market-stats)` | `#6366F1` indigo |
| `'#00BCD4'` | neighborhood | `var(--chip-neighborhood)` | `#14B8A6` teal |

### templateData.ts

| Old hex | Category | New CSS var |
|---------|----------|-------------|
| `'#3B82F6'` | listing-announcements | `var(--category-listing-announcements)` |
| `'#8B5CF6'` | property-features | `var(--category-property-features)` |
| `'#10B981'` | status-updates | `var(--category-status-updates)` |
| `'#F59E0B'` | agent-branding | `var(--category-agent-branding)` |

### TemplateCategoryView.tsx

| Old Tailwind class | New token class / inline style |
|--------------------|-------------------------------|
| `text-gray-400` | `text-muted-foreground` |
| `text-gray-500` | `text-muted-foreground` |
| `text-gray-600` | `text-muted-foreground` |
| `text-gray-700` | `text-foreground/70` |
| `text-gray-900` | `text-foreground` |
| `bg-gray-50` | `bg-muted/30` |
| `bg-gray-100` | `bg-muted/50` |
| `bg-gray-200` | `bg-muted` |
| `border-gray-100` | `border-border/50` |
| `border-gray-200` | `border-border` |
| `border-gray-300` | `border-border` |
| `bg-yellow-100 text-yellow-700` | `bg-amber-100 text-amber-700` (or token equiv) |

---

## Out of Scope

- Badge tier colors (US-DESIGN-008)
- TemplatesPage filter pill redesign (US-DESIGN-009)
- Adding new color categories beyond what exists in the data files
- Dark-mode specific overrides for chip/category colors (use existing CSS variable light/dark logic)

---

## Engineering / PR

- **Branch:** `feat/design-us-design-007-category-color-migration`
- **PR:** #_____
- **Primary files touched:**
  - `client/src/components/ai-chat/categoryChipsData.ts`
  - `client/src/components/ai-chat/templateData.ts`
  - `client/src/components/ai-chat/TemplateCategoryView.tsx`

---

## AI Implementation Prompt

> Copy this block into Claude Code to implement the story.

```
Context: InfographicAI SaaS — React frontend (Tailwind v4 + shadcn/ui).
See CLAUDE.md for architecture. Token reference: client/src/design-tokens.css

Story: US-DESIGN-007 — Real estate category color token migration

File 1: client/src/components/ai-chat/categoryChipsData.ts
Replace hardcoded hex color values with CSS var() references:
  '#FF8C00' → 'var(--chip-property-listings)'
  '#4CAF50' → 'var(--chip-open-house)'
  '#2196F3' → 'var(--chip-just-sold)'
  '#9C27B0' → 'var(--chip-agent-branding)'
  '#FF5722' → 'var(--chip-market-stats)'
  '#00BCD4' → 'var(--chip-neighborhood)'

File 2: client/src/components/ai-chat/templateData.ts
Replace hardcoded hex color values with CSS var() references:
  '#3B82F6' → 'var(--category-listing-announcements)'
  '#8B5CF6' → 'var(--category-property-features)'
  '#10B981' → 'var(--category-status-updates)'
  '#F59E0B' → 'var(--category-agent-branding)'

File 3: client/src/components/ai-chat/TemplateCategoryView.tsx
Replace hardcoded Tailwind gray-* classes with semantic token equivalents:
  text-gray-400/500/600 → text-muted-foreground
  text-gray-700 → text-foreground/70
  text-gray-900 → text-foreground
  bg-gray-50 → bg-muted/30
  bg-gray-100 → bg-muted/50
  bg-gray-200 → bg-muted
  border-gray-100 → border-border/50
  border-gray-200/300 → border-border
  bg-yellow-100 text-yellow-700 → bg-amber-100 text-amber-700

Rules:
- Do NOT change component logic, layout, or structure
- Do NOT add new CSS variables — use existing tokens only
- Do NOT touch TemplatesPage.tsx (that is US-DESIGN-008/009)
- When done: confirm npm run check passes
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-DS-007-01 | Auto | P0 | Grep: no `#FF8C00\|#4CAF50\|#9C27B0\|#FF5722\|#00BCD4` in client/src | 🔲 | |
| TC-DS-007-02 | Manual | P0 | AI Chat category chips show blue/orange/emerald/amber/indigo/teal colors | 🔲 | |
| TC-DS-007-03 | Manual | P0 | Template category cards show correct header block colors | 🔲 | |
| TC-DS-007-04 | Manual | P1 | TemplateCategoryView: no gray-* classes visible, uses token colors | 🔲 | |
| TC-DS-007-05 | Manual | P1 | Dark mode: category colors visible and not washed out | 🔲 | |
| TC-DS-007-06 | Auto | P0 | `npm run check` — zero TypeScript errors | 🔲 | |
| TC-DS-007-07 | Auto | P0 | `npm run test:unit` — all unit tests pass | 🔲 | |

---

## Definition of Done

- [ ] All ACs checked ✅
- [ ] All test cases run and recorded
- [ ] `npm run check` passes
- [ ] `npm run test:unit` passes
- [ ] Manual smoke: AI Chat chips + TemplatesPage category view in Light + Dark
- [ ] PR merged (PR #_____)
- [ ] TASKS.md task list fully checked

---

*Story created: 2026-04-17*
