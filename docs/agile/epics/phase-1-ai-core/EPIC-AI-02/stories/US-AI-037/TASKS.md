# PR Task List — US-AI-037

> **Story:** [STORY.md](./STORY.md)
> **Branch:** `feat/ai-us-ai-037-save-as-template`
> **PR:** #_____ (fill when opened)
> **Type:** feat

---

## Three Pillars Pre-flight (check before starting AI session)

- [ ] **Brain** — STORY.md filled: ACs written, out-of-scope listed
- [ ] **Muscle** — file list + ordered tasks + exact test commands (below)
- [ ] **Map** — [ARCHITECTURE.mmd](../../ARCHITECTURE.mmd) exists for this epic
- [ ] **Env** — N/A (no new env vars)

---

## PR Scope Summary

**One-liner:** Wire the existing (unused) canvas-templates API to a real "Save as Template" action, with a `visibility` field reserved for future admin-curated/marketplace states.
```
feat(ai): save as template + My Templates + visibility field — US-AI-037
```

> **Note on size:** this story is naturally two sessions — T1-T3 (backend) can land and be verified independently of T4-T5 (frontend UI). Consider splitting into two PRs if a single session runs long; both halves are individually testable.

---

## Task Breakdown

### T1 — Backend: `visibility` field on the DTO
**File:** `api/src/modules/designs/dto/create-design.dto.ts`
- Add `visibility?: 'private' | 'admin_curated' | 'for_sale'`, default `'private'` when omitted

### T2 — Backend: persist + filter by visibility/owner
**Files:** `api/src/modules/designs/services/designs.service.ts`, `api/src/modules/designs/controllers/canvas-templates.controller.ts`
- Persist `visibility` inside `propertyData.canvasDesign`
- Confirm/extend `findAll()` to filter to the requesting user's own templates for the My Templates use case

### T3 — Backend tests
**File:** new/extended spec under `api/tests/designs/`
- Default-visibility test, enum-rejection test (TC-037-01, TC-037-06)

### T4 — Frontend: "Save as Template" action
**File:** editor component near existing Save control *(confirm exact location at implementation start)*
- Name-entry prompt → `canvasTemplatesApi.save()` with `type: 'template'`, `visibility: 'private'`
- Must not mutate/navigate away from the current design session

### T5 — Frontend: "My Templates" surface
**File:** `client/src/components/pages/TemplatesPage.tsx`
- New section/tab listing only the current user's saved templates, visually distinct from the curated Premium gallery

---

## Exact Test Commands

```bash
npm run check
npm run test:unit
cd api && npx vitest run tests/designs/ --reporter=verbose
# Manual: build a design -> Save as Template -> confirm it appears in My Templates
#         -> confirm original design session is untouched
```

---

## Task Checklist

- [ ] T1 — `visibility` field on DTO
- [ ] T2 — Persist + filter by visibility/owner
- [ ] T3 — Backend tests
- [ ] T4 — "Save as Template" action
- [ ] T5 — "My Templates" surface
- [ ] `npm run check` passes ✅
- [ ] `npm run test:unit` passes ✅
- [ ] Manual test recorded ✅
- [ ] PR opened with story card as description ✅
- [ ] STORY.md ACs updated ✅

---

## Test Is Truth

> Do not weaken, skip, or modify a failing test to make it pass. Fix the code.

---

## Anti-Patterns to Avoid in This Story

- Do NOT build any admin-review or marketplace UI, even a stub — `visibility` is reserved, not implemented, beyond `'private'`
- Do NOT let "Save as Template" mutate the user's original design — it must be a copy
- Do NOT expose other users' templates in "My Templates"
- Do NOT build the Format Picker here (US-AI-038) — this story only covers creating templates, not starting from them

---

*Tasks created: 2026-07-29*
