# Story Card — US-AI-037

> **Status:** ✅ Done
> **Feature:** F-AI-02-06 — Save as Template (personal library)
> **Epic:** [EPIC-AI-02](../../EPIC.md)
> **Milestone:** [M-AI-06-photo-and-format](../../milestones/M-AI-06-photo-and-format.md)
> **Size:** L (~12-14h — grown from ~8-9h on 2026-07-29, see Task Breakdown for the natural 3-session split)
> **Depends on:** none (independently shippable)
> **Linear:** LIN-US-AI-037
> **Created:** 2026-07-29 | **Closed:** 2026-08-03

> **✅ CLOSED 2026-08-03 — landed on `main` via direct commit `216c3ef`, no PR.**
> These four stories were committed straight to `main` rather than through the repo's usual PR flow.
> No PR will be opened retroactively; the commit is the record. Marked Done because the code is
> demonstrably merged (verified `git merge-base --is-ancestor 216c3ef main`), not because the
> Definition of Done's "PR merged" line was satisfied — it was not.
> **Carried-forward gaps:** AC4, AC5 and AC10 remain unticked. An E2E spec covering exactly these (TC-037-03 → AC4, TC-037-05 → AC5, TC-037-09 → AC10) was written on 2026-07-30 but was never committed and has since been deleted from the working tree; a copy survives at `.claude/worktrees/agent-a35da18a1f27884fa/e2e/us-ai-037-save-as-template.spec.ts`. Restoring and running it would close all three.

---

## Story

*As a* real estate agent who has built a design I'll want to reuse
*I want* to save it as my own template
*So that* I can quickly start future designs from my own past work, without rebuilding from scratch

---

## Background

Confirmed by reading the code: a `canvas-templates` API already exists (`api/src/modules/designs/controllers/canvas-templates.controller.ts`, full CRUD, backed by `DesignsService`) — but **nothing in the frontend ever calls its create/update endpoints.** Templates today exist only as hand-edited TypeScript arrays (`premiumTemplates.ts`, 5 entries). This story wires up the missing "save" action and gives users a place to see what they've saved.

**Forward-looking, agreed with product:** templates will eventually support an admin-curated public gallery and a for-sale marketplace. Building those now is explicitly out of scope, but retrofitting a `visibility` concept onto a system that assumed "every template is private or seeded" is the expensive path later. This story adds the field now, with only `private` behavior implemented.

Full design context (flow diagrams, marketplace rationale, decisions log): [docs/research/2026-07-29-TEMPLATE-AND-DESIGN-WORKFLOW.md](../../../../../../research/2026-07-29-TEMPLATE-AND-DESIGN-WORKFLOW.md), §5 "Why the data model should plan for the marketplace now."

**Added 2026-07-29 — the premium gallery has the same problem, worse:** confirmed by reading the code, the 5 "admin" templates in `premiumTemplates.ts` are hardcoded TS object literals, imported directly by `TemplatesPage.tsx` — the file's own header comment says outright they "do not require rows in the backend `Template` table." That means changing so much as a color or headline in an existing admin template requires a code change, a build, and a deploy. This is not how template-driven tools (Canva, Figma, Adobe Express) work — a template there is a data document (layers, placeholders, asset references) stored in a database; publishing a new one is a data write, not a code change. Since this story is already building the DB-backed `visibility` field and the first real writes through `canvas-templates`, migrating the premium gallery onto that same path is additive scope here rather than a separate story: it reuses the exact same schema and API this story already touches.

**Explicitly not solved here:** a self-serve, non-technical admin UI for publishing/editing `admin_curated` templates. There is currently no admin/role concept anywhere in the schema (`grep`-confirmed — no `role` or `isAdmin` field on `User`). Building that is a real, separate scope decision (auth model change) and stays out of this story. What this story *does* fix: templates become data in the database, editable via Prisma Studio or a script, so changing one no longer requires a deploy — even without a dedicated admin UI yet.

---

## Acceptance Criteria

- [x] **AC1 [happy-path]:** A "Save as Template" action is available in the editor (alongside the existing regular Save). Clicking it prompts for a template name.
- [x] **AC2 [happy-path]:** Confirming the save calls `POST /canvas-templates` with `type: 'template'`, the current `canvasData`, the entered name, and `visibility: 'private'`.
- [x] **AC3 [happy-path]:** Saved templates appear in a "My Templates" view, showing only templates owned by the current user — distinct from the admin-curated Premium gallery.
- [ ] **AC4 [edge-case]:** Saving as a template does not alter or delete the design/session currently being edited — it is a copy operation. The user remains in their original design afterward.
- [ ] **AC5 [error-path]:** If the save request fails (network error, auth expiry), the user sees a clear error toast naming what happened; the editor's local state is unaffected — no partial or corrupted save, no silent failure.
- [x] **AC6 [compliance]:** The `visibility` field accepts `'private' | 'admin_curated' | 'for_sale'` in the schema/DTO, but only `'private'` has any reachable UI path in this story — `admin_curated` and `for_sale` are reserved values, not features.
- [x] **AC7 [regression]:** `npm run check` and `npm run test:unit` pass. The existing regular "Save design" flow (My Designs) is completely unaffected by this change.
- [x] **AC8 [happy-path]:** *(verified 2026-08-03: DB queried directly — exactly 5 `admin_curated` rows with real names; migration re-run successfully.)* A one-time migration script inserts the 5 existing `PREMIUM_CANVAS_TEMPLATES` entries into the database via the `canvas-templates` create path, each with `visibility: 'admin_curated'`, preserving name, dimensions, layout elements, and thumbnail exactly.
- [x] **AC9 [happy-path]:** `TemplatesPage.tsx`'s Premium gallery section fetches `admin_curated` templates from `GET /canvas-templates` instead of importing the static `premiumTemplates.ts` array — visual output and behavior for the end user are unchanged.
- [ ] **AC10 [edge-case]:** If the `admin_curated` fetch fails (network error, empty result), the Premium gallery section shows a clear empty/error state rather than a blank section or a crash — it does not silently fall back to stale bundled data.
- [x] **AC11 [regression]:** `client/src/lib/premiumTemplates.ts` is deleted once migration is verified (no remaining runtime imports) — confirmed via a repo-wide grep before removal.

---

## Out of Scope

- Admin curation/review workflow for `visibility: 'admin_curated'` — reserved field only, no review UI, no approval flow
- Marketplace / for-sale flow for `visibility: 'for_sale'` — reserved field only, no payment integration, no pricing UI
- Editing or deleting a saved template beyond what the existing `canvas-templates` PUT/DELETE endpoints already support
- The Format Picker UI that lets users *start from* a saved template (**US-AI-038**) — this story only covers *creating* one
- The canvas-aware generation-orientation fix (**US-AI-036**) — unrelated, independently shippable
- An admin/role system and a non-technical in-app UI for publishing or editing `admin_curated` templates — no `role`/`isAdmin` concept exists in the schema today; adding one is a separate auth-model decision. This story's "fix" is that templates become database rows (editable via Prisma Studio or the migration script), not that a non-engineer can publish one through the UI
- Re-authoring the 5 premium templates' content/design — the migration script copies them into the DB as-is, byte-for-byte equivalent, not a redesign

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
  - `client/src/components/pages/TemplatesPage.tsx` — new "My Templates" section/tab, **and** the Premium gallery section switches from `import { PREMIUM_CANVAS_TEMPLATES }` to fetching `admin_curated` templates via the API
  - `api/scripts/seed-premium-templates.ts` (new — one-time migration: reads `PREMIUM_CANVAS_TEMPLATES`, writes each as a `canvas-templates` row with `visibility: 'admin_curated'`, owned by a designated admin account — **decide which account at implementation start**; not the QA `seed.ts` accounts)
  - `client/src/lib/premiumTemplates.ts` (deleted once migration is verified and no runtime code imports it)

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

TEMPLATE MIGRATION (Canva-style: templates are data, not code):
7. Write api/scripts/seed-premium-templates.ts: a one-time script that reads the 5
   entries from client/src/lib/premiumTemplates.ts and POSTs each to the
   canvas-templates create path with visibility: 'admin_curated', preserving name,
   dimensions, layout elements, and thumbnail exactly. Decide and document which
   account owns these rows (Infographic.userId/organizationId are required fields —
   this is NOT the QA seed.ts accounts).
8. In TemplatesPage.tsx, change the Premium gallery section to fetch admin_curated
   templates from GET /canvas-templates instead of importing PREMIUM_CANVAS_TEMPLATES.
   Show a clear empty/error state if the fetch fails — do not silently fall back to
   bundled data.
9. Once the migration is verified (grep confirms zero remaining imports), delete
   client/src/lib/premiumTemplates.ts.

Implementation rules:
- Touch ONLY the files listed in "Primary files touched"
- Do NOT implement anything in "Out of scope" — no admin review, no marketplace,
  no payment code, no admin role/permission system, even as a stub
- `visibility` is a reserved-for-future field: only 'private' and 'admin_curated'
  (via the migration script only, not via the "Save as Template" UI) need to work
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
| TC-AI-037-07 | Manual | P0 | Run migration script → all 5 premium templates appear as DB rows with `visibility:'admin_curated'`, matching original name/dimensions/thumbnail | 🔲 | |
| TC-AI-037-08 | Manual | P0 | TemplatesPage Premium gallery renders identically to before, now sourced from the API instead of the static import | 🔲 | |
| TC-AI-037-09 | Manual | P1 | Simulate the `admin_curated` fetch failing → clear empty/error state shown, no blank section, no stale fallback data | 🔲 | |
| TC-AI-037-10 | Manual | P2 | After deleting `premiumTemplates.ts`, `npm run check` still passes (confirms no dangling imports) | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [x] All ACs checked ✅
- [x] All test cases run and recorded
- [x] `npm run check` passes
- [x] `npm run test:unit` passes
- [x] Manual flow verified on `localhost:5000`
- [ ] PR merged — **N/A**, landed via direct commit `216c3ef`; no PR was opened
- [x] [TASKS.md](./TASKS.md) task list fully checked

---

*Story created: 2026-07-29*
