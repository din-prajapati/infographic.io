---
title: Story Card — US-EDIT-030
type: story
tags: [orion, story, phase-1.5]
updated: 2026-10-30
---

# Story Card — US-EDIT-030 — For sale / For rent badge in the canvas header

> **Status:** 🔲 Not Started — created 2026-10-30 by /new-story (split from the US-EDIT-024 L draft)
> **Epic:** [EPIC-EDIT-04](../../EPIC.md)
> **Milestone:** [M-EDIT-09-v3-shell](../../milestones/M-EDIT-09-v3-shell.md)
> **Linear:** LIN-XXX
> **Size:** XS
> **Depends on:** [US-PROP-002](../../../EPIC-PROP-01/stories/US-PROP-002/STORY.md) on `main` (adds `transaction` to `PropertyInfo`; arrives with the M-PROP-01 milestone PR) **and** [US-EDIT-024](../US-EDIT-024/STORY.md) in the milestone branch (`CanvasHeader.tsx`). Start only after the M-EDIT-09 branch has been rebased onto `main` post-M-PROP-01.
> **Created:** 2026-10-30 | **Closed:** —
> **Source:** [US-EDIT-024](../US-EDIT-024/STORY.md) draft AC3; V3 canvas mockup (`span#listing-intent` in `div.canvas-top-actions`; untracked)

---

## Story

*As* an agent working on a listing design
*I want* the canvas header to say whether the listing is for sale or for rent
*So that* I can see at a glance that the design matches the listing's intent

---

## Acceptance Criteria

- [ ] **AC1 [happy-path]:** `CanvasHeader.tsx` shows a badge (`data-testid="listing-intent-badge"`, `aria-live="polite"`) reading **For sale** when `usePropertyStore` `property.transaction === 'sale'` and **For rent** when it is `'rent'`, placed before the Preview button.
- [ ] **AC2 [edge-case]:** When `transaction` is unset (`undefined` or empty), no badge renders — the header shows no placeholder or empty pill.
- [ ] **AC3 [happy-path]:** Changing the listing intent in the Property tab (US-PROP-007) updates the badge without a reload.
- [ ] **AC4 [theme]:** Theme tokens only (US-EDIT-024 AC6 grep); the badge text passes the scoped 4.5:1 probe in light and dark — added to `e2e/us-edit-024-v3-shell.spec.ts`.

---

## Out of Scope

- The "Sample listing" badge (Decision D2 on US-EDIT-024)
- Showing the rental period ("/ month") in the badge
- A "Sold" state (US-PROP-003 keeps `sold` out of `transaction`)
- Editing the intent from the badge

---

## Engineering / PR

- **Branch:** `feat/edit/m-09-v3-shell` (milestone branch)
- **PR:** #_____
- **Primary files touched:**
  - `client/src/components/editor/CanvasHeader.tsx` — the badge
  - `e2e/us-edit-024-v3-shell.spec.ts` — badge cases + contrast

---

## AI Implementation Prompt

> Paste this block into Claude Code to implement the story.

```
Context: Buildographic — React 18 + Vite, Zustand, Tailwind v3 + shadcn/ui.
Prerequisites: US-PROP-002 on main (PropertyInfo.transaction: 'sale' | 'rent'); US-EDIT-024 in the milestone branch
(CanvasHeader.tsx exists); milestone branch rebased onto main.

Story: US-EDIT-030 — For sale / For rent badge in the canvas header

AC1: CanvasHeader shows data-testid="listing-intent-badge" (aria-live="polite"): "For sale" for 'sale', "For rent" for 'rent',
     before the Preview button.
AC2: No badge when transaction is unset.
AC3: Badge follows Property-tab changes live (subscribe with usePropertyStore((s) => s.property.transaction)).
AC4: Token classes only; badge passes the scoped 4.5:1 probe in light and dark (extend e2e/us-edit-024-v3-shell.spec.ts).

Out of Scope: Sample listing badge · rental period · Sold · editing from the badge.

Primary files (do NOT touch others): client/src/components/editor/CanvasHeader.tsx · e2e/us-edit-024-v3-shell.spec.ts

Rules: touch only these files; run `npm run check` and `npm run test:unit`; report files changed, ACs checked, test output.
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|:--------:|----------|:------:|---------|
| TC-EDIT-030-01 | E2E | P0 | Given listing intent "For rent" chosen in the Property tab, then `listing-intent-badge` reads "For rent" | 🔲 | |
| TC-EDIT-030-02 | E2E | P0 | Given a new blank design (no intent), then `listing-intent-badge` is not in the DOM | 🔲 | |
| TC-EDIT-030-03 | E2E | P1 | When intent changes from sale to rent, the badge changes within 1 s without a reload | 🔲 | |
| TC-EDIT-030-04 | E2E | P1 | Scoped contrast probe including the badge, light and dark → 0 failures | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [ ] All ACs checked ✅ · all test cases run and recorded
- [ ] `npm run check` · `npm run test:unit` pass
- [ ] Gate 2 — browser checks in light **and** dark
- [ ] Merged into the M-EDIT-09 milestone branch (PR #_____)
- [ ] [TASKS.md](./TASKS.md) fully checked ✅ · STORY.md status `✅ Done`

---

## Implementation Update (log)

> Appended by code-agent during/after implementation. Newest entries on top.

### 2026-10-30 — created by /new-story (split from US-EDIT-024)
- Split out because `transaction` does not exist in `PropertyInfo` until US-PROP-002 lands on `main`; keeping it in US-EDIT-024 would have blocked the whole shell on M-PROP-01.

---

*Story created: 2026-10-30*
