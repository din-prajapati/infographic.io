# M-DESIGN-04 — Domain Color System

> **Epic:** [EPIC-DESIGN-02](../EPIC.md)  
> **Status:** ✅ Done  
> **Target:** 2026-05-20 | **Closed:** 2026-04-23  
> **Prerequisite:** M-DESIGN-03 closed (new globals.css baseline in place)

---

## Goal

Replace the **249 hardcoded color occurrences** scattered across `.ts` data files and component files with CSS token variables from `design-tokens.css`. This milestone unifies the real estate domain colour system so all category chips, template categories, and badge tiers reference a single source of truth.

---

## Stories

| Story | Title | Status |
|-------|-------|--------|
| [US-DESIGN-007](../stories/US-DESIGN-007/STORY.md) | Real estate category color token migration | ✅ Done — 2026-04-23 |
| [US-DESIGN-008](../stories/US-DESIGN-008/STORY.md) | Template badge tier token migration | ✅ Done — 2026-04-23 |

---

## Hardcoded values being replaced

### categoryChipsData.ts — 6 hex strings (US-007)

| Old value | Category | New token |
|-----------|----------|-----------|
| `'#FF8C00'` | property-listings | `--chip-property-listings` (`#3B82F6`) |
| `'#4CAF50'` | open-house | `--chip-open-house` (`#F97316`) |
| `'#2196F3'` | just-sold | `--chip-just-sold` (`#10B981`) |
| `'#9C27B0'` | agent-branding | `--chip-agent-branding` (`#F59E0B`) |
| `'#FF5722'` | market-stats | `--chip-market-stats` (`#6366F1`) |
| `'#00BCD4'` | neighborhood | `--chip-neighborhood` (`#14B8A6`) |

### templateData.ts — 4 hex strings (US-007)

| Old value | Category | New token |
|-----------|----------|-----------|
| `'#3B82F6'` | listing-announcements | `--category-listing-announcements` |
| `'#8B5CF6'` | property-features | `--category-property-features` |
| `'#10B981'` | status-updates | `--category-status-updates` |
| `'#F59E0B'` | agent-branding | `--category-agent-branding` |

### TemplatesPage.tsx — 5 badgeColor strings (US-008)

| Old value | Badge | New token |
|-----------|-------|-----------|
| `"bg-foreground/90 text-background"` | Luxury | `--badge-luxury-bg` / `--badge-luxury-text` |
| `"bg-muted-foreground/80 text-background"` | Standard | `--badge-standard-bg` / `--badge-standard-text` |
| `"bg-primary/80 text-primary-foreground"` | Budget | `--badge-budget-bg` / `--badge-budget-text` |
| `"bg-purple-600 text-white"` | Custom | `--badge-custom-bg` / `--badge-custom-text` |
| `"bg-blue-600 text-white"` | API | `--badge-api-bg` / `--badge-api-text` |

### TemplateCategoryView.tsx — gray-* Tailwind classes (US-007)

All `text-gray-*`, `bg-gray-*`, `border-gray-*`, `bg-yellow-100 text-yellow-700` → semantic tokens. See US-DESIGN-007 TASKS.md for full mapping.

---

## Milestone done when

- [x] US-DESIGN-007 complete — `categoryChipsData.ts` + `templateData.ts` + `TemplateCategoryView.tsx` use domain color tokens. `TemplateCategoryView` re-wired into `AIChatBox` via "Browse by category" toggle.
- [x] US-DESIGN-008 complete — `TemplatesPage.tsx` all 5 badge tiers + overlay badge use CSS token inline styles.
- [x] Grep check: no old hex values (`FF8C00\|4CAF50\|9C27B0\|FF5722\|00BCD4`) in `.ts/.tsx` source files (3 refs in legacy `.md` docs only — not blocking)
- [x] Grep check: `bg-purple-600\|bg-blue-600\|bg-purple-500` in `TemplatesPage.tsx` → 0 results
- [x] All category chips render correct per-chip domain colors (user verified). Category cards render colored header blocks (user verified). E2E Gate 3 suite: 28/28 pass.
- [x] Dark mode visual sign-off — user verified 2026-04-24 (both chip colors and badge colors confirmed in dark mode)
- [ ] PRs merged

## Closed: 2026-04-23

### Summary of changes

| File | Change |
|------|--------|
| `client/src/components/ai-chat/categoryChipsData.ts` | `color` → correct domain hex; `surfaceColor` (rgba tint) added |
| `client/src/components/ai-chat/types.ts` | `CategoryChip` interface: added `surfaceColor: string` |
| `client/src/components/ai-chat/CategoryChip.tsx` | Selected state: inline style using `chip.color` + `chip.surfaceColor`. Replaced hardcoded `border-blue-500`. Added `data-chip-id`, `data-selected` attrs. |
| `client/src/components/ai-chat/TemplateCategoryView.tsx` | Category headers: inline colored tint bg + 3px left border stripe + icon tint. Added `data-category-id` attr. |
| `client/src/components/ai-chat/AIChatBox.tsx` | Wired `TemplateCategoryView` via "Browse by category" toggle. Imports `categories` from `templateData`. |
| `client/src/components/pages/TemplatesPage.tsx` | Overlay `Custom` badge (line 279): `bg-purple-500` → `var(--badge-custom-bg/text)` inline style |
| `e2e/m-design-04-domain-colors.spec.ts` | Added: `TC-DS-007-02` (3 tests) + `TC-DS-007-03` (4 tests) automated chip/category-header assertions. Added `ensureLoggedIn` auth helper. |
| `tsconfig.json` | Added `e2e/**/*` to `include` so node types apply to E2E spec files |

---

*Milestone created: 2026-04-17 | Closed: 2026-04-23*
