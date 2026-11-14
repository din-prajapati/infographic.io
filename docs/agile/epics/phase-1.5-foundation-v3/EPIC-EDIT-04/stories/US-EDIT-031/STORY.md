# Story Card — US-EDIT-031

> **Status:** 🟡 Implemented and locally verified — awaiting milestone verification, PR and human merge approval
> **Feature:** N/A — epic-level validation slice
> **Epic:** [EPIC-EDIT-04](../../EPIC.md)
> **Milestone:** [M-EDIT-11-v3-editor-slice](../../milestones/M-EDIT-11-v3-editor-slice.md)
> **Linear:** Unassigned
> **Size:** L
> **Created:** 2026-10-31 | **Closed:** —
> **Prerequisites:** Orion hardening lock and independent acceptance tests before implementation; no unfinished PROP or EDIT story prerequisite.

---

## Story

*As a* solo real estate agent reopening a saved canvas design
*I want* to edit its text and save and export it through the new V3 editor shell
*So that* I can validate the new workspace with my existing designs before the default editor changes.

---

## Acceptance Criteria

- [x] **AC1 [happy-path]:** Given an authenticated agent opens `/editor?editor=v3&designId=<cuid>`, `client/src/App.tsx` renders the fresh `V3Editor` under the existing ProtectedRoute: Projects links to `/my-designs`, editable title and status, Undo/Redo, Save/Export, honest workflow strip, Select/Text rail, dimension header, text inspector and bottom zoom controls follow the tracked composition snapshot below. After `GET /api/v1/designs/:id` succeeds and its canvasData is validated (object with elements array; element types exactly text, shape or image; both canvasWidth and canvasHeight satisfy typeof === 'number', Number.isFinite and > 0; missing/non-numeric dimensions fail; missing backgroundColor is accepted using the existing white default), V3 calls `usePropertyStore.getState().resetProperty()` and `useAgentStore.getState().resetAgent()` immediately before the shared `restoreCanvasData` hydrates all elements, dimensions, background and listing metadata, and the loaded title appears. The artboard carries `data-canvas-container` for shared thumbnail generation and its scroll viewport carries `data-canvas-viewport` for existing fit calculations. Clicking Text adds one new independent text element through the existing store as one undo step; Select returns to selection.
- [x] **AC2 [error-path]:** When GET is pending, the previous session's canvas is hidden, Opening design is visible, and editing, Save and Export are disabled. If GET fails, canvasData is missing/invalid, or `restoreCanvasData` returns false, an explicit load error and Retry appear, the previous canvas is neither shown as the requested design nor overwritten, and editing/save/export stay unavailable. Network failure or validation failure does not reset listing stores or call restore. Stale/unmounted-session responses are rejected before calling `restoreCanvasData` or touching any global store.
- [x] **AC3 [happy-path]:** Given one text element is selected, typing in `V3TextInspector` edits a local draft; clicking the explicit Apply text button commits the complete draft once through exactly one existing `updateElement` call as one undo step. `updateElement` already pushes history in useCanvasStore.ts, so do not add another `pushToHistory`; history.past grows by exactly one. Undo restores that element's content from before Apply text, Redo reapplies the committed text, and both actions mark the document dirty. Typing in the inspector without Apply text does not mutate canvas or history. Reused canvas inline editing, drag and resize retain their existing behaviour and all resulting element mutations count as document revisions; the one-step rule applies specifically to inspector Apply text. V3Editor.tsx owns the sole V3 canvas keyboard handler; it ignores input, textarea and contenteditable targets for Undo/Delete/Backspace and does not mount or modify a legacy shortcut hook so typing and native field undo do not mutate the selected canvas element.
- [x] **AC4 [happy-path]:** Given a loaded design has applied text or title changes, Save captures its current revision and complete canvas plus metadata. `designsApi.save` PUTs to that existing server ID, preserves `type`, `category` and `tags` exactly as returned by GET (absent optional fields stay omitted; no undefined placeholder values or invented replacements), and sends a thumbnail produced by existing `generateThumbnail()`; its existing caught-error placeholder fallback is accepted unchanged. The save acknowledgement must retain the loaded ID. Saved appears only after successful acknowledgement of the latest revision. Reloading the opt-in URL restores saved title, text, image/shape elements and listing metadata from that same server record.
- [x] **AC5 [error-path]:** When an existing `designId` fails `/^c[a-z0-9]{24}$/`, V3 shows Unsupported design ID and does not GET, POST or enable editing/save/export; local-only legacy IDs remain supported through the default editor. When an existing-record Save responds with a different ID or throws, V3 shows Save failed, retains edits and its original ID, leaves the document Unsaved, and permits Retry. No existing-record path POSTs or silently falls back to local storage.
- [x] **AC6 [happy-path]:** Given document revision A is being saved, only changes to title, elements, canvas width/height/background, including Undo/Redo, advance the persisted-document revision. Zoom, pan, fit, selection and capture timestamp do not advance it. Acknowledging A after document revision B exists leaves B Unsaved; zoom/fit after an unchanged load leaves Saved. Repeated Save clicks cannot overlap requests. Previous-session acknowledgements cannot change current ID, URL, canvas or save state. Existing fit timers may alter view zoom after a session switch, but cannot alter persisted revisions or save status.
- [x] **AC7 [happy-path]:** Given an authenticated agent opens `/editor?editor=v3` with no design ID, V3 resets both global canvas and listing state to the existing empty-document defaults (1200×800, white background, empty elements/history, no selection/pan, and resetProperty/resetAgent listing defaults) before enabling editing, so previous legacy/V3 elements and listing facts cannot be saved into the blank session. Blank metadata is `type: design`, `category: real-estate`, `tags: []`, with the current title and generated thumbnail. Its first Save POSTs once; after acknowledgement its returned ID must match `/^c[a-z0-9]{24}$/` or Save fails and remains Unsaved. A valid server ID is retained in the URL with `editor=v3` via `history.replaceState` without remounting V3, changing the hook session key or starting another GET; the hook captures its initial design ID in a stable session reference and does not derive its session key from live useSearch/useLocation after its own URL replacement; its next Save PUTs to that ID. Reload opens that record.
- [x] **AC8 [happy-path]:** Given a loaded or initialized design of W×H, clicking Export uses existing `downloadCanvas(name, 'png')` and downloads a decodable PNG with rendered text: decoded pixels inside the scaled bounding box of the text element must include pixels differing from the canvas background. The PNG is W×H when max(W,H) >= 2000 and 2W×2H otherwise, matching `exportCanvasToImage`'s existing automatic scale. The exporter and renderer remain unchanged.
- [x] **AC9 [error-path]:** When `downloadCanvas` returns false or throws, V3 shows Export failed and a retry action; it does not show a successful download status. Export failure leaves canvas content and save state unchanged.
- [x] **AC10 [theme]:** Given V3 at desktop widths 1280px and 1440px, switching the existing light/dark theme updates every new shell surface using existing tokens; text contrast is at least 4.5:1, checked in both themes using the existing in-browser WCAG relative-luminance probe from `e2e/design-contrast.spec.ts` (read-only reference, no new dependency) and top bar, rail, canvas and inspector do not overlap. Every enabled control is keyboard reachable and icon-only controls have accessible names. No unavailable Phase 1.5 action is enabled. The slice is explicitly desktop-only.
- [x] **AC11 [regression]:** Given `/editor` or `/editor?designId=<id>` without `editor=v3`, App still renders existing authenticated `EditorLayout`; unauthenticated access to either variant follows existing ProtectedRoute. V3 reuses the existing canvas store, serializer, element components and exporter without mounting EditorLayout/CenterCanvas or changing backend/storage/engine implementations. API-mocked browser tests are explicitly labelled mocked integration evidence and do not satisfy the separate authenticated real-server save/reload smoke.

---

## Preview amendment — 2026-10-31

User requested the existing editor's Preview approach. This explicitly extends the pilot within its existing V3Editor/V3Canvas/browser-test file scope.

- [x] **AC12 [happy-path]:** When an opened design's Preview button is clicked, V3 uses the same canvas-only composition as EditorLayout's preview: top bar, workflow, tool rail, inspector, canvas header/hint and zoom footer are hidden, the existing artboard fits the expanded viewport and selection handles/editing are disabled. Exit preview or Escape restores the editing workspace, selected element, inspector draft, canvas content/history and save status without a server write. P toggles Preview only outside editable fields and without modifier keys; Escape exits regardless of focus. Preview is unavailable until the design is ready.

## Out of Scope

- Does not implement Property/Contact panels, Brand, linking UI, templates/gallery entry changes, AI Assistant, generation, extraction, autosave or export-review validation.
- Does not change the default editor, existing editor tools, backend endpoints, plan limits, canvas engine, serialized design format or existing export implementation.
- Does not add phone layouts, new themes, SVG/PDF export, collaboration, offline fallback, shared-operation refactoring or performance optimizations.
- Does not claim a full V3 replacement or remove legacy editor code. The reference mockup supplies composition, not fake links, fake facts or simulated saves.

---

## Engineering / PR

- **Branch:** `feat/edit/m-11-v3-editor-slice`
- **PR:** #_____ (milestone review; no merge/deploy authorized by this card)
- **Primary files touched:**
  - `PROJECT_CONTEXT.yaml` — planning counters only, as required by new-story/new-milestone.
  - `client/src/App.tsx` — opt-in V3 route under existing auth boundary.
  - `client/src/components/editor/v3/V3Editor.tsx` — new shell and working actions.
  - `client/src/components/editor/v3/V3Canvas.tsx` — viewport composed from existing canvas element components.
  - `client/src/components/editor/v3/V3TextInspector.tsx` — selected text content editing.
  - `client/src/hooks/useV3DesignSession.ts` — acknowledged server load/save lifecycle, dirty state and race guards.
  - `client/src/lib/v3DesignSession.ts` — mandatory pure session revision/load/save operations and stale-response guards.
  - `client/src/lib/__tests__/v3DesignSession.spec.ts` — session contracts and negative cases.
  - `e2e/us-edit-031-v3-slice.spec.ts` — browser workflows with explicitly mocked API responses.
  - `e2e/v3-slice.config.ts` — isolated browser verification configuration.

Runtime references (read/reuse only): `client/src/lib/api.ts` (`designsApi`), `client/src/lib/canvasState.ts`, `client/src/lib/canvasExport.ts`, `client/src/hooks/useCanvasStore.ts`, existing canvas elements and `ZoomControls`, `client/src/lib/storage.ts` (types only), `client/src/lib/listingBindings.ts`, `client/src/hooks/usePropertyStore.ts` and `client/src/hooks/useAgentStore.ts` (existing listing hydration/reset functions). Legacy `saveDesign` swallows server errors through local fallback; do not use it for V3 server acknowledgement. `designsApi.save` chooses PUT for canonical server IDs and POST for blank/local IDs. Composition reference: `Mockups/buildographic-canvas-simplification-v3/index.html` in the primary checkout; it is untracked and must not become a runtime dependency.

---

## AI Implementation Prompt

> Paste this block into Codex to implement the story.

```
Context: InfographicAI SaaS; read PROJECT_CONTEXT.yaml and AGENTS.md.
React 18/Vite, Wouter, Zustand, React Query; NestJS API behind Express :5000.
Story: US-EDIT-031 — opt-in V3 editor vertical slice.
As a solo real estate agent reopening a saved canvas design, I want to edit text,
save and export through a new V3 shell so I can validate it before default rollout.
Acceptance Criteria: satisfy AC1–AC11 in this STORY.md verbatim, including the
acknowledged server save/reload flow, loading/error and stale-response handling,
light/dark desktop accessibility, legacy/default/auth compatibility and PNG export.
Out of Scope: no Property/Brand/AI/autosave, default switch, backend/engine/storage
changes, new formats, mobile, duplicated canvas engine or simulated controls.
Primary files to touch (do NOT touch other production/test files):
client/src/App.tsx
client/src/components/editor/v3/V3Editor.tsx
client/src/components/editor/v3/V3Canvas.tsx
client/src/components/editor/v3/V3TextInspector.tsx
client/src/hooks/useV3DesignSession.ts
client/src/lib/v3DesignSession.ts (mandatory pure session controller)
client/src/lib/__tests__/v3DesignSession.spec.ts
e2e/us-edit-031-v3-slice.spec.ts
e2e/v3-slice.config.ts
Rules: use the existing canvas elements/store/serializer/exporter and designsApi;
never wrap the old EditorLayout or use silent local save fallback. Match V3
composition with honest controls. Use scoped TASKS.md and authoritative harden
lock before code changes. Run npm run check, npm run test:unit and the scoped
browser command. Record real-server smoke separately from mocked browser tests.
When done: list changed files, AC evidence and exact command output; do not claim
Done or checked gates without evidence.
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-EDIT-031-01 | Unit | P0 | happy-path: Given an authenticated agent opens , renders the fresh `V… | ✅ | See VERIFICATION.md and retained evidence |
| TC-EDIT-031-02 | Unit | P0 | error-path: When GET is pending, the previous session's canvas is hid… | ✅ | See VERIFICATION.md and retained evidence |
| TC-EDIT-031-03 | Unit | P0 | happy-path: Given one text element is selected, typing in `V3TextInsp… | ✅ | See VERIFICATION.md and retained evidence |
| TC-EDIT-031-04 | Unit | P0 | happy-path: Given a loaded design has applied text or title changes, … | ✅ | See VERIFICATION.md and retained evidence |
| TC-EDIT-031-05 | Unit | P0 | error-path: When an existing `designId` fails , V3 shows Unsupported … | ✅ | See VERIFICATION.md and retained evidence |
| TC-EDIT-031-06 | Unit | P0 | happy-path: Given document revision A is being saved, only changes to… | ✅ | See VERIFICATION.md and retained evidence |
| TC-EDIT-031-07 | Unit | P0 | happy-path: Given an authenticated agent opens with no design ID, V3 … | ✅ | See VERIFICATION.md and retained evidence |
| TC-EDIT-031-08 | Unit | P0 | happy-path: Given a loaded or initialized design of W×H, clicking Exp… | ✅ | See VERIFICATION.md and retained evidence |
| TC-EDIT-031-09 | Unit | P0 | error-path: When `downloadCanvas` returns false or throws, V3 shows E… | ✅ | See VERIFICATION.md and retained evidence |
| TC-EDIT-031-10 | Unit | P1 | theme: Given V3 at desktop widths 1280px and 1440px, switching t… | ✅ | See VERIFICATION.md and retained evidence |
| TC-EDIT-031-11 | Unit | P1 | regression: Given or without `editor=v3`, App still renders existing … | ✅ | See VERIFICATION.md and retained evidence |
| TC-EDIT-031-20 | E2E | P0 | AC12: canvas-only Preview; TC-21 additionally verifies P/Escape | ✅ | evidence/preview-browser.log |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [x] All ACs checked with recorded evidence.
- [x] All test cases run and recorded, including live-server smoke.
- [x] `npm run check` passes (0 new TypeScript errors).
- [x] `npm run test:unit` passes (no regressions).
- [x] Gate 2 light/dark desktop visual checks and scoped Gate 3 browser tests pass.
- [x] Existing editor regression checked; no console errors in changed flow.
- [x] Manual open → edit → save → reload → PNG export verified on local server.
- [ ] Independent review completed and milestone PR merged (PR #_____).
- [ ] [TASKS.md](./TASKS.md) fully checked and STORY.md updated to ✅ Done.

---

## Implementation Update (log)

2026-10-31 — Implemented the fresh opt-in V3 shell and verified open/edit/history/server-save/reload/PNG export. Gate 1 passed: 811 backend + 399 client tests, 1 existing skip; TypeScript passed. Scoped browser suite: 25 passed; additional painted-artboard/contrast check: 4 passed. Production build passed. Authenticated real-server smoke and direct database assertion passed; disposable fixtures removed. Independent Opus code APPROVE and SECURITY PASS. See [VERIFICATION.md](VERIFICATION.md) for exact commands, trace, visual review and limitations. Formal Done remains pending whole-milestone verification and approved merge.

## Architecture review decisions — 2026-10-31

Owner architecture decisions from independent Opus review: explicit Apply text commit creates one undo boundary; persisted-document revision excludes view state and timestamp; direct server acknowledgement preserves metadata and canonical ID; pure `v3DesignSession.ts` controller is mandatory; stale guards precede global restore; blank sessions reset canvas and listing; export retains the existing scale and false-return contract. No production code edits were made during this planning correction.

### Reproducible V3 composition snapshot

Top horizontal bar: Buildographic/V3 identity → Projects → editable design title → save status → Undo/Redo → Save → Export. Below it, a compact honest open/edit/save/export workflow strip. Workspace: narrow left Select/Text rail; central canvas column with Page 1 and real dimensions above, selection hint, scrollable artboard, and zoom controls below; right text inspector with draft content and Apply text. Use the existing light/dark tokens. The source mockup also shows Templates, Elements, Uploads, Layers, Assistant, listing badges and Property/Contact tabs; those controls are omitted from this limited slice rather than simulated. This text snapshot is the tracked composition reference; untracked mockup HTML is not required to build or review.



### Existing adapter acknowledgement boundary

`designsApi.save` resolves only after its HTTP call succeeds. For existing records this successful HTTP PUT plus the adapter's returned ID equal to the loaded ID is the observable acknowledgement. The adapter returns its input if a successful raw response omits ID, so this slice cannot distinguish a missing raw PUT response ID without expanding API scope; that adapter limitation is accepted and documented. A different returned ID is rejected. A blank input uses no canonical ID, so a missing raw POST response ID fails canonical-ID validation. No changes to `api.ts` are authorized.

### Planning size and review boundary

This is a narrowly scoped validation slice, but nine files plus integration verification may exceed one M session. The independent Opus reviewer explicitly approved retaining this integrated L slice without splitting, because splitting breaks the end-to-end proof. Retain the approved capability scope and 2–3 day milestone envelope; task estimates are preliminary and no completion claim follows from them. The independent Opus review defines the architecture boundaries above. Remaining full-editor capability stories stay separate.

### Final planning approval and accepted adapter limits — 2026-10-31

Independent Opus architecture review: approved once five documentation corrections were applied. Those corrections are recorded above: binary validation, sole V3 keyboard handler, one existing updateElement call per Apply text, stable initial session key across URL adoption and L sizing. useCanvasStore.ts confirms updateElement already pushes history; no additional push is permitted. No production implementation begins before the authoritative hardening lock.

Take the Saved revision baseline only after restoreCanvasData returns true, after its synchronous listing hydration; restore itself must not dirty the loaded document. A blank POST can commit remotely but return no usable ID or time out: Retry may create a duplicate under the existing adapter. This limitation is accepted here; API/idempotency changes and retry workarounds are out of scope. Mocked browser images use data URLs or mocked proxy responses, so PNG export does not depend on external image availability. Contrast verification reuses the existing browser WCAG probe rather than adding axe dependencies.


## Fresh release verification — 2026-11-14

docs/research/2026-11-14-V3-RELEASE-HARDENING.md records the current full-unit/browser/live results and bounded independent review. Historical navigation/fixture findings above are superseded only by the repaired cases verified in this pass. User UI/font/device acceptance and actual milestone merge remain pending.
