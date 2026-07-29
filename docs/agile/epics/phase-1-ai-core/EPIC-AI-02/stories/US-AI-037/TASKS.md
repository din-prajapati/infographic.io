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

**One-liner:** Wire the existing (unused) canvas-templates API to a real "Save as Template" action, with a `visibility` field reserved for future admin-curated/marketplace states — and migrate the 5 hardcoded premium templates into the database on that same path, so template changes stop requiring a code deploy.
```
feat(ai): save as template + My Templates + admin-template DB migration — US-AI-037
```

> **Note on size (grown 2026-07-29):** naturally three sessions now — T1-T3 (backend: visibility field + save/filter + tests) → T4-T5 (frontend: Save as Template action + My Templates surface) → T6-T8 (premium-template migration script + Premium gallery API-fetch swap + cleanup). Each block is independently testable; split into up to three PRs if any single session runs long.

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

### T6 — Migration script: premium templates → DB
**File:** `api/scripts/seed-premium-templates.ts` (new)
- Reads the 5 entries from `client/src/lib/premiumTemplates.ts`, writes each as a `canvas-templates` row via the create path with `visibility: 'admin_curated'`
- Decide and document the owning account (`Infographic.userId`/`organizationId` are required — not the QA `seed.ts` accounts)
- Verify each migrated row matches the original name/dimensions/layout/thumbnail exactly

### T7 — Frontend: Premium gallery reads from the API
**File:** `client/src/components/pages/TemplatesPage.tsx`
- Replace `import { PREMIUM_CANVAS_TEMPLATES }` with a fetch of `admin_curated` templates via `canvasTemplatesApi`
- Add a clear empty/error state on fetch failure — no blank section, no silent fallback to bundled data

### T8 — Cleanup: delete the static template file
**File:** `client/src/lib/premiumTemplates.ts`
- Grep the repo to confirm zero remaining runtime imports, then delete the file
- Run `npm run check` to confirm nothing broke

---

## Exact Test Commands

```bash
npm run check
npm run test:unit
cd api && npx vitest run tests/designs/ --reporter=verbose
# Manual: build a design -> Save as Template -> confirm it appears in My Templates
#         -> confirm original design session is untouched
# Manual: run seed-premium-templates.ts -> confirm 5 rows appear via canvas-templates API
# Manual: TemplatesPage Premium gallery renders identically, now from the API
# Manual: kill the API / simulate fetch failure -> Premium gallery shows a clear error state
```

---

## Task Checklist

- [x] T1 — `visibility` field on DTO
- [x] T2 — Persist + filter by visibility/owner
- [x] T3 — Backend tests
- [x] T4 — "Save as Template" action
- [x] T5 — "My Templates" surface
- [x] T6 — Migration script: premium templates → DB
- [x] T7 — Premium gallery reads from the API
- [x] T8 — Delete `premiumTemplates.ts`
- [x] `npm run check` passes ✅
- [x] `npm run test:unit` passes ✅
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
- Do NOT build an admin role/permission system or an in-app "publish as admin_curated" UI — the migration script is the only way `admin_curated` rows get created in this story
- Do NOT redesign or alter the 5 premium templates' content during migration — copy them into the DB as-is

---

*Tasks created: 2026-07-29*
