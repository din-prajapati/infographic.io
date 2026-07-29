# Story Card — US-AI-037

> **Status:** 🔲 Not Started
> **Feature:** F-AI-02-06 — Save as Template (personal library)
> **Epic:** [EPIC-AI-02](../../EPIC.md)
> **Milestone:** [M-AI-06-photo-and-format](../../milestones/M-AI-06-photo-and-format.md)
> **Size:** L (~8-9h — see Task Breakdown for the natural 2-session split)
> **Depends on:** none (independently shippable)
> **Linear:** LIN-US-AI-037
> **Created:** 2026-07-29 | **Closed:** —

---

## Story

*As a* real estate agent who has built a design I'll want to reuse
*I want* to save it as my own template
*So that* I can quickly start future designs from my own past work, without rebuilding from scratch

---

## Background

Confirmed by reading the code: a `canvas-templates` API already exists (`api/src/modules/designs/controllers/canvas-templates.controller.ts`, full CRUD, backed by `DesignsService`) — but **nothing in the frontend ever calls its create/update endpoints.** Templates today exist only as hand-edited TypeScript arrays (`premiumTemplates.ts`, 5 entries). This story wires up the missing "save" action and gives users a place to see what they've saved.

**Forward-looking, agreed with product:** templates will eventually support an admin-curated public gallery and a for-sale marketplace. Building those now is explicitly out of scope, but retrofitting a `visibility` concept onto a system that assumed "every template is private or seeded" is the expensive path later. This story adds the field now, with only `private` behavior implemented.

---

## Acceptance Criteria

- [ ] **AC1 [happy-path]:** A "Save as Template" action is available in the editor (alongside the existing regular Save). Clicking it prompts for a template name.
- [ ] **AC2 [happy-path]:** Confirming the save calls `POST /canvas-templates` with `type: 'template'`, the current `canvasData`, the entered name, and `visibility: 'private'`.
- [ ] **AC3 [happy-path]:** Saved templates appear in a "My Templates" view, showing only templates owned by the current user — distinct from the admin-curated Premium gallery.
- [ ] **AC4 [edge-case]:** Saving as a template does not alter or delete the design/session currently being edited — it is a copy operation. The user remains in their original design afterward.
- [ ] **AC5 [error-path]:** If the save request fails (network error, auth expiry), the user sees a clear error toast naming what happened; the editor's local state is unaffected — no partial or corrupted save, no silent failure.
- [ ] **AC6 [compliance]:** The `visibility` field accepts `'private' | 'admin_curated' | 'for_sale'` in the schema/DTO, but only `'private'` has any reachable UI path in this story — `admin_curated` and `for_sale` are reserved values, not features.
- [ ] **AC7 [regression]:** `npm run check` and `npm run test:unit` pass. The existing regular "Save design" flow (My Designs) is completely unaffected by this change.

---

## Out of Scope

- Admin curation/review workflow for `visibility: 'admin_curated'` — reserved field only, no review UI, no approval flow
- Marketplace / for-sale flow for `visibility: 'for_sale'` — reserved field only, no payment integration, no pricing UI
- Editing or deleting a saved template beyond what the existing `canvas-templates` PUT/DELETE endpoints already support
- The Format Picker UI that lets users *start from* a saved template (**US-AI-038**) — this story only covers *creating* one
- The canvas-aware generation-orientation fix (**US-AI-036**) — unrelated, independently shippable

---

## Engineering / PR

- **Branch:** `feat/ai-us-ai-037-save-as-template`
- **PR:** #_____ (fill when opened)
- **Primary files touched:**
  - `api/src/modules/designs/dto/create-design.dto.ts` (add `visibility?: 'private' | 'admin_curated' | 'for_sale'`, default `'private'`)
  - `api/src/modules/designs/services/designs.service.ts` (persist `visibility` into `propertyData.canvasDesign`; filter `findAll` by owner for the My Templates view)
  - `api/src/modules/designs/controllers/canvas-templates.controller.ts` (confirm/adjust `findAll` filtering — owner + `type: 'template'`)
  - `client/src/lib/api.ts` (`canvasTemplatesApi` — pass `visibility` on save)
  - `client/src/components/editor/` — new "Save as Template" trigger + naming dialog *(exact component TBC at implementation start — likely alongside the existing Save action)*
  - `client/src/components/pages/TemplatesPage.tsx` — new "My Templates" section/tab

---

## AI Implementation Prompt

> Copy this block into Claude Code to implement the story.

```
Context: Buildographic (React + NestJS + Prisma). See CLAUDE.md.

Story: US-AI-037 — Save as Template (personal library)

BACKEND:
1. Add optional `visibility?: 'private' | 'admin_curated' | 'for_sale'` to
   CreateDesignDto (api/src/modules/designs/dto/create-design.dto.ts), default 'private'.
2. In designs.service.ts's save(), persist visibility inside propertyData.canvasDesign
   alongside the existing name/type/category/thumbnail/canvasData/tags fields.
3. In canvas-templates.controller.ts's findAll(), filter to the requesting user's own
   templates only (type === 'template' AND owned by req.user.id) for the "My Templates"
   use case — confirm current filtering behavior first, extend rather than replace it.

FRONTEND:
4. Add a "Save as Template" action in the editor near the existing Save control.
   On click: prompt for a name, call canvasTemplatesApi.save() with the current
   canvasData, type: 'template', visibility: 'private'.
5. Do NOT mutate or navigate away from the user's current design/session — this is a
   copy, the user keeps editing what they were editing.
6. Add a "My Templates" section to TemplatesPage.tsx (or a new tab within it) that
   lists only the current user's saved templates via canvasTemplatesApi.getAll(),
   visually distinct from the curated Premium gallery.

Implementation rules:
- Touch ONLY the files listed in "Primary files touched"
- Do NOT implement anything in "Out of scope" — no admin review, no marketplace,
  no payment code, even as a stub
- `visibility` is a reserved-for-future field: only 'private' needs to actually work
- When done: list files changed, ACs checked, test command to run
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-AI-037-01 | Auto (unit) | P0 | `POST /canvas-templates` with `type:'template'` persists `visibility:'private'` by default when omitted | 🔲 | |
| TC-AI-037-02 | Manual | P0 | Build a design → "Save as Template" → name it → appears in My Templates | 🔲 | |
| TC-AI-037-03 | Manual | P0 | After saving as template, the original design/session is unchanged and still open | 🔲 | |
| TC-AI-037-04 | Manual | P1 | User A's saved templates are not visible in User B's My Templates | 🔲 | |
| TC-AI-037-05 | Manual | P1 | Simulate a failed save (network off) → clear error toast shown, editor state intact | 🔲 | |
| TC-AI-037-06 | Auto (unit) | P2 | DTO rejects a `visibility` value outside the three allowed enum values | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [ ] All ACs checked ✅
- [ ] All test cases run and recorded
- [ ] `npm run check` passes
- [ ] `npm run test:unit` passes
- [ ] Manual flow verified on `localhost:5000`
- [ ] PR merged (PR #_____)
- [ ] [TASKS.md](./TASKS.md) task list fully checked

---

*Story created: 2026-07-29*
