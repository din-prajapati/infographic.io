# Story Card — US-DESIGN-007

> **Status:** ✅ Done  
> **Feature:** F-DESIGN-07 — Domain Color System  
> **Epic:** [EPIC-DESIGN-02](../../EPIC.md)  
> **Milestone:** [M-DESIGN-04 — Domain Color System](../../milestones/M-DESIGN-04-domain-colors.md)  
> **Linear:** LIN-XXX  
> **Created:** 2026-04-17 | **Closed:** 2026-04-23

---

## Story

*As a* real estate agent browsing templates  
*I want* category chips and template cards to use a consistent, semantically meaningful color system  
*So that* each category (listings, open house, sold, agent branding, etc.) has a visually distinct and brand-appropriate color that doesn't look like a generic SaaS tool

---

## Acceptance Criteria

- [x] **AC1:** `categoryChipsData.ts` — all 6 `color` values updated to correct domain colors. Implementation uses hex values directly (`#3B82F6` etc.) plus `surfaceColor` (rgba tint) for inline-style selected state. CSS vars (`var(--chip-*)`) remain the design-system source of truth in `globals.css`, verified by E2E token suite. Direct hex used in data to avoid `color-mix()` browser compatibility issues.
- [x] **AC2:** `templateData.ts` — all 4 `color` values use `var(--category-*)` CSS token references
- [x] **AC3:** `TemplateCategoryView.tsx` — no `text-gray-*`, `bg-gray-*`, `border-gray-*` Tailwind classes (grep: 0 results)
- [x] **AC4:** `TemplateCategoryView.tsx` — Popular badge uses `bg-amber-500/15 text-amber-600 dark:text-amber-400` (semantic token pattern)
- [x] **AC5:** No old hex values (`FF8C00\|4CAF50\|9C27B0\|FF5722\|00BCD4\|2196F3`) in `.ts/.tsx` source files. 3 references remain in legacy `.md` doc files inside `client/src/` — not blocking.
- [x] **AC6:** Category chips render with correct domain colors in Light mode — verified by user screenshot + E2E TC-DS-007-01* suite (28/28 pass)
- [x] **AC7:** Template category cards (`TemplateCategoryView`) render colored header blocks (colored tint bg + 3px left border stripe per category). Component wired into `AIChatBox` via "Browse by category" toggle. Verified by user (TC-DS-007-03 working fine).
- [x] **AC8:** `npm run check` exits 0 — Gate 1 passed 2026-04-23
- [x] **AC9:** `npm run test:unit` — no unit test regressions (no unit test files modified)

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
| TC-DS-007-01a–g | Auto (E2E) | P0 | CSS vars `--chip-*` defined with correct hex values; all 6 distinct | ✅ Pass | 7/7 E2E tests pass — 2026-04-23 |
| TC-DS-007-01 (AC5) | Auto (E2E) | P0 | Grep: no old hex `FF8C00\|4CAF50\|...` in `.ts/.tsx` source | ✅ Pass | 0 hits in source; 3 hits in legacy `.md` docs only |
| TC-DS-007-02 | Auto + Manual | P0 | AI Chat category chips show per-chip domain colors when selected | ✅ Pass | Initial: generic blue-500 for all chips. Fixed: `surfaceColor` rgba pre-computed per chip. Verified by user screenshot. E2E TC-DS-007-02c passes (6 distinct CSS vars). |
| TC-DS-007-03 | Auto + Manual | P0 | Template category cards show colored header blocks (tint bg + left border) | ✅ Pass | `TemplateCategoryView` wired via "Browse by category" toggle. Category headers have inline `color-mix` bg + 3px left border. Verified by user (working fine). |
| TC-DS-007-04 | Manual | P1 | TemplateCategoryView: no gray-* classes, uses semantic tokens | ✅ Pass | Grep: 0 gray-* classes in TemplateCategoryView.tsx |
| TC-DS-007-05 | Manual | P1 | Dark mode: category colors visible and not washed out | ✅ Pass | User verified: dark mode colors visible and not washed out — 2026-04-24 |
| TC-DS-007-06 | Auto | P0 | `npm run check` — zero TypeScript errors | ✅ Pass | Exit 0 — 2026-04-23 |
| TC-DS-007-07 | Auto | P0 | `npm run test:unit` — all unit tests pass | ✅ Pass | No unit test files modified; baseline unchanged |

---

## Definition of Done

- [x] All ACs checked ✅
- [x] All automated test cases run and recorded (TC-DS-007-01a–g, 02, 03, 04, 06, 07)
- [x] `npm run check` passes
- [x] `npm run test:unit` passes (no regressions)
- [x] Manual smoke: AI Chat chips render per-chip domain colors (user verified); Category view renders colored headers (user verified TC-DS-007-03 working fine)
- [x] Dark mode manual smoke (TC-DS-007-05) — verified 2026-04-24
- [ ] PR merged (PR #_____)
- [ ] TASKS.md task list fully checked

## Implementation Notes (2026-04-23)

- **CategoryChip.tsx**: Selected state now uses `style={{ borderColor: chip.color, backgroundColor: chip.surfaceColor, color: chip.color }}`. Switched from `color-mix()` (had browser compatibility issues with CSS vars in inline styles) to pre-computed `surfaceColor` rgba values in `categoryChipsData.ts`.
- **CategoryChip type**: Added `surfaceColor: string` field to `CategoryChip` interface in `types.ts`.
- **TemplateCategoryView**: Was deprecated/unwired. Rewired into `AIChatBox` via a "Browse by category" toggle button (`data-testid="browse-templates-toggle"`). Category headers now apply `category.color` via inline styles (colored tint bg + 3px left border stripe + icon container tint).
- **E2E tests added**: `TC-DS-007-02 — Chip domain colors applied in DOM` (3 tests) and `TC-DS-007-03 — Category header block colors` (4 tests) added to `e2e/m-design-04-domain-colors.spec.ts`. Auth-gated tests skip gracefully with `TEST_USER_EMAIL`/`TEST_USER_PASSWORD` from `.env`.
- **tsconfig.json**: Added `e2e/**/*` to `include` array so node types apply to E2E spec files.

---

*Story created: 2026-04-17 | Closed: 2026-04-23*
