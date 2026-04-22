# Story Card — US-DESIGN-008

> **Status:** 🔲 Not Started  
> **Feature:** F-DESIGN-08 — Domain Color System  
> **Epic:** [EPIC-DESIGN-02](../../EPIC.md)  
> **Milestone:** [M-DESIGN-04 — Domain Color System](../../milestones/M-DESIGN-04-domain-colors.md)  
> **Linear:** LIN-XXX  
> **Created:** 2026-04-17 | **Closed:** —

---

## Story

*As a* real estate agent browsing the templates library  
*I want* template badge tiers (Luxury, Standard, Budget, Custom, API) to use distinct, premium-feeling colors  
*So that* tier differentiation is immediately clear and reinforces the quality positioning of each tier

---

## Acceptance Criteria

- [ ] **AC1:** `TemplatesPage.tsx` — `badgeColor` for `Luxury` uses CSS token class instead of `bg-foreground/90 text-background`
- [ ] **AC2:** `TemplatesPage.tsx` — `badgeColor` for `Standard` uses CSS token class instead of `bg-muted-foreground/80 text-background`
- [ ] **AC3:** `TemplatesPage.tsx` — `badgeColor` for `Budget` uses CSS token class instead of `bg-primary/80 text-primary-foreground`
- [ ] **AC4:** `TemplatesPage.tsx` — `badgeColor` for `Custom` uses CSS token class instead of `bg-purple-600 text-white`
- [ ] **AC5:** `TemplatesPage.tsx` — `badgeColor` for `API` uses CSS token class instead of `bg-blue-600 text-white`
- [ ] **AC6:** Grep check: `grep "bg-purple-600\|bg-blue-600\|bg-purple-500" client/src/components/pages/TemplatesPage.tsx` → 0 results
- [ ] **AC7:** Badge colors render correctly in both Light and Dark modes
- [ ] **AC8:** `npm run check` passes — zero TypeScript errors
- [ ] **AC9:** `npm run test:unit` passes — no regressions

---

## Token Replacement Map

| Badge | Old Tailwind | New CSS token class | Token value |
|-------|-------------|---------------------|-------------|
| Luxury | `bg-foreground/90 text-background` | `badge-luxury` | `--badge-luxury-bg: #92400E` dark amber |
| Standard | `bg-muted-foreground/80 text-background` | `badge-standard` | `--badge-standard-bg: #1E3A5F` dark blue |
| Budget | `bg-primary/80 text-primary-foreground` | `badge-budget` | `--badge-budget-bg: #14532D` dark green |
| Custom | `bg-purple-600 text-white` | `badge-custom` | `--badge-custom-bg: #4C1D95` dark purple |
| API | `bg-blue-600 text-white` | `badge-api` | `--badge-api-bg: #0C3461` navy |

> **Implementation note:** Since design-tokens.css defines `--badge-*-bg` and `--badge-*-text` as hex values (not HSL), the approach is to add utility CSS classes in `globals.css` that use these tokens, or apply inline styles with `style={{ backgroundColor: 'var(--badge-luxury-bg)', color: 'var(--badge-luxury-text)' }}`. The inline style approach is simpler and avoids adding new Tailwind utility classes.

---

## Out of Scope

- Adding new badge tiers
- Changing badge shape, size, or typography
- Updating badge logic or the template tier assignment in data files
- Category color migration (US-DESIGN-007)

---

## Engineering / PR

- **Branch:** `feat/design-us-design-008-badge-tier-colors`
- **PR:** #_____
- **Primary files touched:**
  - `client/src/components/pages/TemplatesPage.tsx` (badge color values only)

---

## AI Implementation Prompt

> Copy this block into Claude Code to implement the story.

```
Context: InfographicAI SaaS — React frontend (Tailwind v4 + shadcn/ui).
See CLAUDE.md for architecture. Token reference: client/src/design-tokens.css

Story: US-DESIGN-008 — Template badge tier token migration

File: client/src/components/pages/TemplatesPage.tsx

Find the badge tier color definitions (search for badgeColor or badge tier object).
Replace the hardcoded Tailwind classes with inline style objects using CSS token vars:

  Luxury:   { backgroundColor: 'var(--badge-luxury-bg)',   color: 'var(--badge-luxury-text)' }
  Standard: { backgroundColor: 'var(--badge-standard-bg)', color: 'var(--badge-standard-text)' }
  Budget:   { backgroundColor: 'var(--badge-budget-bg)',   color: 'var(--badge-budget-text)' }
  Custom:   { backgroundColor: 'var(--badge-custom-bg)',   color: 'var(--badge-custom-text)' }
  API:      { backgroundColor: 'var(--badge-api-bg)',      color: 'var(--badge-api-text)' }

If the current implementation uses a string className pattern, switch to an object + 
style prop pattern. If the element already accepts a style prop, use it directly.

Rules:
- Touch ONLY the badge color values — do not change badge logic, layout, or other classes
- Do NOT add new CSS variables in globals.css
- Do NOT change any other part of TemplatesPage.tsx
- When done: confirm npm run check passes and grep for bg-purple-600 returns 0
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-DS-008-01 | Auto | P0 | Grep: no `bg-purple-600\|bg-blue-600` in TemplatesPage.tsx | 🔲 | |
| TC-DS-008-02 | Manual | P0 | Luxury badge renders dark amber (brownish) background | 🔲 | |
| TC-DS-008-03 | Manual | P0 | Custom badge renders dark purple, API badge renders navy | 🔲 | |
| TC-DS-008-04 | Manual | P1 | Badge colors visible and distinct in Dark mode | 🔲 | |
| TC-DS-008-05 | Manual | P1 | No other template card elements changed (regression check) | 🔲 | |
| TC-DS-008-06 | Auto | P0 | `npm run check` — zero TypeScript errors | 🔲 | |
| TC-DS-008-07 | Auto | P0 | `npm run test:unit` — all unit tests pass | 🔲 | |

---

## Definition of Done

- [ ] All ACs checked ✅
- [ ] All test cases run and recorded
- [ ] `npm run check` passes
- [ ] `npm run test:unit` passes
- [ ] Manual smoke: Templates page — all 5 badge tier colors visible in Light + Dark
- [ ] PR merged (PR #_____)
- [ ] TASKS.md task list fully checked

---

*Story created: 2026-04-17*
