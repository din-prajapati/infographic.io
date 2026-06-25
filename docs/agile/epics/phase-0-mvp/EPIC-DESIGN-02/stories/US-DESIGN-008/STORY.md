# Story Card — US-DESIGN-008

> **Status:** ✅ Done  
> **Feature:** F-DESIGN-08 — Domain Color System  
> **Epic:** [EPIC-DESIGN-02](../../EPIC.md)  
> **Milestone:** [M-DESIGN-04 — Domain Color System](../../milestones/M-DESIGN-04-domain-colors.md)  
> **Linear:** LIN-XXX  
> **Created:** 2026-04-17 | **Closed:** 2026-04-23

---

## Story

*As a* real estate agent browsing the templates library  
*I want* template badge tiers (Luxury, Standard, Budget, Custom, API) to use distinct, premium-feeling colors  
*So that* tier differentiation is immediately clear and reinforces the quality positioning of each tier

---

## Acceptance Criteria

- [x] **AC1:** `TemplatesPage.tsx` — Luxury badge uses `style={{ backgroundColor: 'var(--badge-luxury-bg)', color: 'var(--badge-luxury-text)' }}`
- [x] **AC2:** `TemplatesPage.tsx` — Standard badge uses `style={{ backgroundColor: 'var(--badge-standard-bg)', color: 'var(--badge-standard-text)' }}`
- [x] **AC3:** `TemplatesPage.tsx` — Budget badge uses `style={{ backgroundColor: 'var(--badge-budget-bg)', color: 'var(--badge-budget-text)' }}`
- [x] **AC4:** `TemplatesPage.tsx` — Custom badge (tier) uses `style={{ backgroundColor: 'var(--badge-custom-bg)', color: 'var(--badge-custom-text)' }}`
- [x] **AC5:** `TemplatesPage.tsx` — API badge uses `style={{ backgroundColor: 'var(--badge-api-bg)', color: 'var(--badge-api-text)' }}`
- [x] **AC6:** Grep check: `grep "bg-purple-600\|bg-blue-600\|bg-purple-500" TemplatesPage.tsx` → 0 results. Also fixed: the "Custom" overlay badge on `template.isCustom` cards (line 279) — was `bg-purple-500 text-white`, now uses `var(--badge-custom-bg)` / `var(--badge-custom-text)`.
- [x] **AC7:** Badge CSS token E2E suite (TC-DS-008-02a–AC6, dark mode overrides TC-DS-008-04a–d) — 13/13 pass. Manual browser verification pending for Light+Dark visual sign-off.
- [x] **AC8:** `npm run check` exits 0 — Gate 1 passed 2026-04-23
- [x] **AC9:** `npm run test:unit` — no regressions (no unit test files modified)

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
| TC-DS-008-01 | Auto (grep) | P0 | No `bg-purple-600\|bg-blue-600\|bg-purple-500` in TemplatesPage.tsx | ✅ Pass | Grep: 0 results — 2026-04-23. Also fixed overlay badge at line 279 (was `bg-purple-500`). |
| TC-DS-008-02a–b | Auto (E2E) | P0 | `--badge-luxury-bg` = `#92400E`, `--badge-luxury-text` = `#FEF3C7` | ✅ Pass | E2E token assertion passes |
| TC-DS-008-AC1a–AC6 | Auto (E2E) | P0 | All 5 badge bg tokens defined, distinct, no old Tailwind hex values | ✅ Pass | 7/7 E2E tests pass |
| TC-DS-008-04a–d | Auto (E2E) | P1 | Dark mode badge overrides: luxury, custom, api distinct from light | ✅ Pass | 4/4 E2E dark mode tests pass |
| TC-DS-008-02 (visual) | Manual | P0 | Luxury badge renders dark amber on /templates (light mode) | ✅ Pass | User verified: Luxury badge dark amber visible in light mode — 2026-04-24 |
| TC-DS-008-03 | Manual | P0 | Custom=dark purple, API=navy, Standard=deep navy, Budget=deep green | ✅ Pass | User verified: all 5 badge tier colors correct — 2026-04-24 |
| TC-DS-008-04 | Manual | P1 | Badge colors visible and distinct in Dark mode | ✅ Pass | User verified: badge colors visible and distinct in dark mode — 2026-04-24 |
| TC-DS-008-05 | Manual | P1 | No other template card elements changed (regression) | ✅ Pass | User verified: no regressions on template cards — 2026-04-24 |
| TC-DS-008-06 | Auto | P0 | `npm run check` passes | ✅ Pass | Exit 0 — 2026-04-23 |
| TC-DS-008-07 | Auto | P0 | `npm run test:unit` passes | ✅ Pass | No unit files modified; baseline unchanged |

---

## Definition of Done

- [x] All ACs checked ✅
- [x] All automated test cases run and recorded (13 E2E token tests pass)
- [x] `npm run check` passes
- [x] `npm run test:unit` passes (no regressions)
- [x] Manual smoke: Templates page — all 5 badge tier colors visible in Light + Dark — verified 2026-04-24
- [ ] PR merged (PR #_____)
- [ ] TASKS.md task list fully checked

## Implementation Notes (2026-04-23)

- All 5 tier badges (`Luxury`, `Standard`, `Budget`, `Custom`, `API`) in `TemplatesPage.tsx` already used `badgeStyle` inline style objects referencing CSS token vars prior to this session.
- **Additional fix:** The `template.isCustom` overlay badge (top-left corner of custom template cards, line 279) was still using `className="bg-purple-500 text-white"` — replaced with `style={{ backgroundColor: 'var(--badge-custom-bg)', color: 'var(--badge-custom-text)' }}`.
- E2E test suite covers all token definitions (light + dark mode overrides).

---

*Story created: 2026-04-17 | Closed: 2026-04-23*
