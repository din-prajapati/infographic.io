# PR Task List — US-AI-040

> **Story:** [STORY.md](./STORY.md)
> **Branch:** `feat/ai-us-ai-040-template-preview-tags`
> **PR:** #_____ (fill when opened)
> **Type:** feat

---

## Three Pillars Pre-flight (check before starting AI session)

- [x] **Brain** — STORY.md filled: ACs written, out-of-scope listed
- [x] **Muscle** — file list + ordered tasks + exact test commands (below)
- [x] **Map** — [ARCHITECTURE.mmd](../../ARCHITECTURE.mmd) exists for this epic
- [x] **Env** — N/A (no new env vars)
- [x] **Dependency** — None. Different file (`TemplatesPage.tsx`) from US-AI-039/US-AI-041 (`FormatPickerDialog.tsx`) — no sequencing constraint.

---

## PR Scope Summary

**One-liner:** Add a template preview modal (image/title/badges/CTA/"More like this") on card-thumbnail click, and replace the Template Gallery's badge-string-matched filter dropdowns with real tag-based chip filters.
```
feat(ai): US-AI-040 template preview modal + tag-based filters
```

> **Note on size:** Gap 2 (preview modal) and Gap 3 (tag filters) share `TemplatesPage.tsx`'s template-mapping code — done together so Gap 3's real tags make Gap 2's "More like this" rail accurate from day one.

---

## Task Breakdown

### T1 — Populate real tags in the premium-template seed script
**File:** `api/scripts/seed-premium-templates.ts`
- Change line 188 (`tags: []`) to a real array: `[tpl.badge.toLowerCase(), tpl.category]` (or equivalent), so every migrated premium template carries ≥2 tags
- No schema change — `tags` already lives inside `propertyData.canvasDesign` (same JSON-blob pattern as `visibility`)

### T2 — `tags` field on `TemplateItem` + real data wiring
**File:** `client/src/components/pages/TemplatesPage.tsx`
- Add `tags?: string[]` to the `TemplateItem` interface (~line 22-32)
- Populate it from `adminCuratedRaw[].tags` (premium mapping, ~line 93-102) and `myTemplatesRaw[].tags` (~line 69-78) — both already typed on `DesignMetadata`/`AdminCuratedTemplate`, no new fetch

### T3 — Rewrite filter matching logic to use tags
**File:** same component
- Replace the `matchesCategory`/`matchesStyle` logic in `filteredTemplates` (currently ~lines 117-134) with `template.tags?.includes(activeChipValue)` checks
- A template with zero/undefined `tags` simply never matches an active chip — must not throw (AC8)

### T4 — Chip-style filter controls
**File:** same component
- Replace the two `<Select>` dropdowns (~lines 167-189) with toggleable chip/pill buttons
- Chip option list is derived from the distinct tag values present across `allTemplates`, not a hardcoded list
- "Clear Filters" (~lines 322-331) deselects all active chips, same reset behavior as today

### T5 — Preview modal (thumbnail click, not "Use Template")
**File:** same component
- Add a `Dialog` (reuse `client/src/components/ui/dialog.tsx`) that opens on thumbnail/image click for a card
- Modal shows: image (via `ImageWithFallback`), title, badge(s), primary CTA calling the same `onOpenEditor(id)` the "Use Template" button already calls
- **Do NOT change the "Use Template" button's existing `onClick={() => onOpenEditor?.(...)}` wiring** (~line 309, and the My Templates equivalent ~line 231) — it must keep navigating directly with no modal (AC2)

### T6 — "More like this" rail
**File:** same component
- Inside the preview modal, client-side filter `allTemplates` for up to 4 templates sharing ≥1 tag with the previewed template
- Clicking a rail item swaps the modal's displayed template in place (no close/reopen)

### T7 — First E2E coverage for this flow
**File:** `e2e/us-ai-040-template-preview-tags.spec.ts` (new)
- Cover: thumbnail click opens preview modal / "Use Template" button still navigates directly with no modal / chip filter combo with zero matches shows empty state + Clear Filters works
- Reuse the auth/localStorage fixture pattern from `e2e/qa-canvas-editor.spec.ts`

---

## File-to-Task Mapping

| File | Tasks |
|------|-------|
| `api/scripts/seed-premium-templates.ts` | T1 |
| `client/src/components/pages/TemplatesPage.tsx` | T2, T3, T4, T5, T6 |
| `e2e/us-ai-040-template-preview-tags.spec.ts` | T7 |

---

## Exact Test Commands

```bash
npm run check
npm run test:unit
npm run test:e2e -- e2e/us-ai-040-template-preview-tags.spec.ts
# Regression (must remain unmodified and passing):
npm run test:e2e -- e2e/m-design-04-tc-targeted.spec.ts
npm run test:e2e -- e2e/m-design-04-domain-colors.spec.ts
# Manual: npx tsx api/scripts/seed-premium-templates.ts against a scratch DB -> verify tags populated
# Manual: click template thumbnail -> preview modal with More like this rail
# Manual: click "Use Template" directly -> editor opens immediately, no modal
```

---

## Task Checklist

- [x] T1 — Populate real tags in the premium-template seed script
- [x] T2 — `tags` field on `TemplateItem` + real data wiring
- [x] T3 — Rewrite filter matching logic to use tags
- [x] T4 — Chip-style filter controls
- [x] T5 — Preview modal (thumbnail click, not "Use Template")
- [x] T6 — "More like this" rail
- [x] T7 — First E2E coverage for this flow
- [x] `npm run check` passes
- [x] `npm run test:unit` passes
- [x] `npm run test:e2e` passes (new spec + the two badge-assertion specs unmodified)
- [x] Manual test recorded
- [ ] PR opened with story card as description
- [x] STORY.md ACs updated

---

## Test Is Truth

> Do not weaken, skip, or modify a failing test to make it pass. Fix the code.

---

## Anti-Patterns to Avoid in This Story

- Do NOT reroute the "Use Template" button's click through the new preview modal — it must keep navigating directly (AC2), or ~8 existing E2E specs break
- Do NOT touch on-card badge rendering/colors (`badgeStyle`, `--badge-*` tokens) — covered by two existing color-assertion specs (AC7)
- Do NOT add a Language/locale filter pill — no backing data exists for it
- Do NOT add a Prisma migration or a new `/canvas-templates?tags=` query param — filtering stays client-side against already-fetched data

---

*Tasks created: 2026-07-31*
