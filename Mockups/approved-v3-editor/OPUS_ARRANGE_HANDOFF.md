# Opus handoff: V3 Arrange

Prepared 2026-11-07, Asia/Calcutta. This is the context transfer from the Codex session, not a completed Arrange implementation or an independent review approval.

## 1. Start here: repository, branch and safe baseline

| Item | Value |
|---|---|
| Primary repository | `D:/Dinesh/DCloud/GITDrive/Work/Products/InfographicEditor-Unified` |
| **Working checkout for this work** | `D:/Dinesh/DCloud/GITDrive/Work/Products/InfographicEditor-Unified/.codex-worktrees/v3-slice` |
| Protected V3 baseline branch | `codex/v3-editor-checkpoint-2026-11-05` |
| Protected V3 baseline commit | `b69074b` — V3 libraries, Layers and common actions, US-EDIT-039–043 |
| **Arrange branch** | `codex/v3-arrange-opus`, created from `b69074b` |
| Handoff change | This document only; committed on the Arrange branch |
| Browser URL | `http://localhost:5000/editor?editor=v3` |
| Current default route | Legacy editor remains the default at `/editor` |

Work in the checkout above, not the primary repository checkout. Confirm the current branch and status before any edit. The running development server was serving this V3 checkout during verification; confirm again rather than assuming. This handoff does not start Claude, implement Arrange, push, open/merge a PR, or deploy.

The baseline contains all prior completed V3 work. Leave that branch at its checkpoint. Commit subsequent Arrange work on the Arrange branch using the ORION task/story trace conventions. No destructive reset is needed for rollback: after committing/safely preserving any outstanding work, switch this checkout back to `codex/v3-editor-checkpoint-2026-11-05`. The Arrange commits remain recoverable on their own branch. A remote backup requires a separate push; neither branch creation nor a local commit is a remote backup.

## 2. User intent and decisions carried from the chat

- Buildographic editor V3 is an opt-in slice that reuses the existing canvas engine, document format and backend.
- Match the supplied Canva reference's compact control layout and icons while retaining the approved Navy/Teal shell and both existing themes.
- The user repeatedly prefers compact menus without excessive padding, redundant titles or Done buttons where choosing a value can close the menu.
- Layers was implemented first. Arrange was explicitly deferred during that work; this handoff now prepares the separate Arrange follow-up. It does not retroactively authorize unrelated roadmap features.
- **Latest Layers annotations supersede the older plan:** the bottom/footer Layers button opens/toggles the full sidebar, including with no selection. There is no compact footer Layers popup and no Layers shortcut in element toolbars.
- Closing Layers restores the preceding sidebar. Canvas selection keeps it open. Its close button, footer toggle and Escape dismiss it; Escape inside an open menu closes the menu first.
- Every element toolbar retains direct Lock, Duplicate, Delete and a final More button. More and layer-row menus share the same action component and compact visual design.
- Underline, strikethrough and the three-state case control are direct text toolbar controls; do not move them back into More.
- Professional property amenities are curated SVG icons; emoji are editable text. Preserve the existing shape/icon/emoji catalogs and replacement behavior.
- The user requested a separate branch/commit so rollback remains easy. Do not merge Arrange back into the baseline without authorization.

## 3. Read these sources before changing code

Paths below are relative to the **working checkout** above.

1. `AGENTS.md`, `PROJECT_CONTEXT.yaml`, `.orion/orion.yaml`.
2. `Mockups/approved-v3-editor/LAYERS_VERIFICATION.md` — current Layers behavior, exact test evidence and toolbar inventory.
3. `Mockups/approved-v3-editor/ELEMENTS_LIBRARY_PLAN.md` and `ELEMENTS_LIBRARY_VERIFICATION.md` — catalogs, actions and shortcut contracts.
4. `Mockups/approved-v3-editor/POSITION_LAYERS_PLAN.md` — original Arrange ASCII, core/advanced scope and estimates. Its original Layers/toolbar entry proposal is superseded by the final annotation section and this handoff. Its old runtime-chain paragraph is historical, not the current source map.
5. `docs/agile/epics/phase-1.5-foundation-v3/EPIC-EDIT-04/EPIC.md`, `ARCHITECTURE.mmd`, `ENV.yaml` and `milestones/M-EDIT-11-v3-editor-slice.md`.
6. Story contracts/TASKS/scaffolds under that epic: US-EDIT-039 (common controls), 040 (shapes), 041 (property icons), 042 (layer actions/geometry), 043 (Layers sidebar/latest annotation revision).
7. `client/src/components/editor/v3/`, its unit tests and the relevant V3 browser specs.

The full Codex chat and private session memory are not automatically available to Claude Code. Treat this document as a curated handoff; inspect runtime/source and write explicit acceptance criteria rather than inventing missing decisions. No new Arrange story number is reserved: read the live counters first (the next EDIT number was 044 at this handoff).

## 4. ORION workflow and actual model selection

Use ORION's canonical skills, agent roles and rule loading; do not merely label a freeform implementation an ORION run.

1. Resolve skills through `.orion/orion.yaml`; read the corresponding `.orion/<source>/SKILL.md`.
2. Create the Arrange story/task contract before runtime changes. Specify exact primary files, typed ACs, out-of-scope boundaries, task estimates and Four Pillars readiness. Split core/advanced into separate stories if needed; the original combined estimate is 6–10 engineering hours including verification, not a few-minute styling change.
3. Load each story's scaffold `rules_loaded`, including frontend React/Tailwind and Vitest/Playwright rules.
4. Harden using the supported ORION CLI `ac-audit`, `tc-rows --write` and `lock-write` commands. Never import ORION framework internals. This host's CLI entry was `D:/Dinesh/DCloud/GITDrive/Repos/orion-ai-sdlc/bin/orion.mjs`; verify availability before reuse.
5. Trace the runtime chain and write contract-derived failing tests before implementation. Use the appropriate code/test/reviewer roles with clear file ownership; preserve peers' work.
6. Run the verification gates and record actual outputs. Commit per task with the new story ID, without AI attribution trailers. Formal Done is not the same as a local passing test run; follow the milestone delivery requirements.

**Opus is not implied by an ORION role name.** At the baseline, `.orion/agents/code-agent.md` and `reviewer-agent.md` declare `claude-sonnet-4-6`. ORION's configured CLI backend is Claude, but its default CLI args do not explicitly select Opus. Verify the actual main model and each delegated role's model. Use a documented, scoped Opus override supported by the installed tools; do not assume a top-level Opus setting overrides an explicitly pinned subagent. Do not hand-edit generated adapter files or silently change project-wide model defaults.

Earlier independent Opus reviews used a separate installed executable, `C:/Users/dinpr/AppData/Roaming/npm/node_modules/@anthropic-ai/claude-code/bin/claude.exe`, with `--print --model opus`, tools disabled and code supplied through a review prompt. That was an external CLI review, not a native Codex Opus subagent. **Do not reuse that read-only launcher as an implementation configuration.** Check the installed CLI's supported permissions/model options and use normal project-limited editing access. Never bypass approvals/sandboxing globally. Authentication and usage availability must be checked; a previous final review hit a usage limit.

The prior Opus approval covered the original US-EDIT-031 slice; it does **not** certify the latest Layers changes or future Arrange work. See US-EDIT-031/OPUS-REVIEW.md for historical review boundaries.

## 5. Current runtime map and reusable foundations

| Area | Source and responsibility |
|---|---|
| Shell and sidebar lifecycle | `client/src/components/editor/v3/V3Editor.tsx`: `layersOpen`, `openLayers`, `closeLayers`, previous-panel restoration, color/image/effects exclusivity, Preview/Escape |
| Canvas and footer entry | `V3Canvas.tsx`: actual canvas renderers, live geometry, footer Layers callback and expanded state; no legacy compact popup |
| Layers view | `V3LayersPanel.tsx`: All/Overlapping, preview rows, clicked-row targeting, drag insertion/auto-scroll, background row and keyboard stack movement |
| Shared More menu | `V3ElementActionsMenu.tsx`: Copy/Paste/Duplicate/Delete; four stack operations; Hide/Show; Lock/Unlock |
| Type-specific controls | `V3ElementToolbar.tsx`: text, shapes, photo/image, property icon and line controls |
| Stable stack operations | `client/src/lib/v3LayerActions.ts`: `orderedV3Layers`, `reorderV3Layer`, `canMoveV3Layer`, `moveV3Layer`, visibility/lock commands |
| Bounds and overlaps | `client/src/lib/v3LayerGeometry.ts`: `getV3ElementBounds`, `overlappingV3Layers`, `selectionIntersectsV3Page` |
| Atomic selection commands | `client/src/lib/v3EditorActions.ts`: internal clipboard, duplication/deletion, batch lock and nudge |
| Validated single-element edit | `client/src/lib/v3ElementEditing.ts`: `commitElementPatch`, numeric validation, line normalization |
| History/state | `client/src/hooks/useCanvasStore.ts`: `updateElement` already pushes history; inspect before composing operations |
| Transient style preview | `client/src/hooks/useV3ElementPreview.ts`: preview then commit/cancel without extra history |
| Line geometry | `client/src/lib/lineGeometry.ts`: path/control/endpoints/decorations/normalization |
| Live Layers presentation | `LayerPresentation` and optional RotationHandle preview callback; overlap follows temporary drag/resize/rotation |

Reuse the stable layer-order helpers. Legacy store Forward/Backward commands can create colliding zIndex values; do not introduce them into Arrange. Existing bounds were designed for frame/line overlap, not pixel-alpha collision or shadow extents. Inspect their exact meaning before using them for alignment. There is no verified `PositionTab.tsx` implementation to copy.

Shared menus intentionally use Radix **nonmodal** interaction so opening them does not clear canvas selection. Content explicitly clears generated `aria-labelledby` so accessible names remain `Element actions` or `Actions for <name>`. Preserve both fixes.

## 6. Arrange scope to turn into the next contract

### Core delivery

- Four stack actions: Forward, Backward, To front, To back, reusing stable existing layer commands.
- Six **page** alignment actions: Left, Horizontal center, Right, Top, Vertical center, Bottom.
- A single visible unlocked element can align by its transformed frame bounds. For a multi-selection, translate the combined bounds as a unit and preserve relative positions. Define how hidden/locked/stale selected IDs are handled before implementation; recommended behavior is disabling the whole group action when any target is ineligible, rather than silently moving only part of a selection.
- One completed action creates exactly one Undo entry; boundary/no-op/invalid/cancelled actions create none. Selection, metadata, paints, icon identity, image fit and line style survive.
- Empty selection and unavailable operations show clear disabled states. Do not add nonfunctional future placeholders.

### Advanced delivery from the original proposal

Single-selection X/Y, local Width/Height, aspect-ratio lock and rotation in degrees. The original plan marked these as a separate optional delivery after core; agree their inclusion in the new scope before implementing them. Do not quietly treat them as already approved by the older Layers-only request.

If included, explicitly define finite/min/max rules, off-page negative X/Y, angle normalization, ratio behavior and text/image/line resizing semantics in the contract. X/Y refer to the stored frame origin; dimensions remain local dimensions even when rotated. Lines require transforming endpoints/control/elbow geometry, not just width/height fields. Horizontal/vertical zero-span lines need explicit safe handling. Temporary previews, Enter/blur commits and Escape cancellation must preserve history boundaries.

### Proposed sidebar integration — settle in the contract first

Preserve the footer-only Layers entry. A suggested integration is to add sibling Arrange/Layers tabs **inside the same sidebar**, with footer Layers opening the Layers tab. Keep the current Layers content/title behavior when that tab is active; an Arrange heading can identify the Arrange view. Do not reintroduce a Layers/Position shortcut in every element toolbar. The exact new tab/header layout has not yet been reviewed by the user.

```text
+-----------------------------------+
| Arrange                         X |
| [ Arrange ===== ] [ Layers ]      |
|                                   |
| Stacking                          |
| [Forward]       [Backward]        |
| [To front]      [To back]         |
|-----------------------------------|
| Align to page                     |
| [Left] [H-center] [Right]          |
| [Top ] [V-center] [Bottom]         |
|-----------------------------------|
| Advanced (separate scope decision) |
| Width  [320]   Height [180]        |
| [Ratio lock]                      |
| X      [120]   Y      [240]        |
| Rotate [  0] degrees              |
+-----------------------------------+

Footer [Layers] -> same sidebar, Layers tab
Layers tab -> existing All / Overlapping unchanged
```

### Exclusions

No distribute/tidy-up/equal-spacing, align-to-selection modes, persistent groups, block layer dragging, pixel-alpha overlap, crop, multi-page features, backend/auth/schema changes, paid generation, default-editor switch or shell redesign. Multi-selection numeric scaling/rotation is separate work. No external libraries unless the contract establishes a real need.

## 7. History, geometry and interaction pitfalls

- Do not loop `updateElement` for a batch alignment: that method records history per call. Validate the complete target set, calculate all patches, detect no-op, then commit the batch once using the existing atomic patterns.
- Avoid double history pushes before a single-element `commitElementPatch`/`updateElement`.
- Re-read current selected IDs/elements before committing; reject stale/deleted/locked targets and clear obsolete preview state.
- Preview and view-only navigation must not dirty the saved document. Keyboard shortcuts inside input/contenteditable/menu must retain normal behavior.
- Alignment must account for rotation and actual line bounds; test horizontal/vertical/curved/elbowed lines and decorations. Do not redefine persisted X/Y meaning as the item rotates.
- Keep transient presentation consistent between canvas and Layers Overlapping until commit/cancel.
- Background is a special fixed row, not a selectable CanvasElement. Never include it in alignment/duplication/deletion or stacking mutations.
- Use Wouter, existing Zustand/history/session paths and current shadcn/Radix/lucide tools. Canonical backend is NestJS/Prisma; this work should not need backend changes.

## 8. Verification baseline and required next checks

Baseline `b69074b` evidence:

- Frontend + API type checks passed.
- **1,515 unit tests passed:** 811 API + 704 client; one existing client skip.
- **124 distinct browser contracts covered across runs:** full suite 116/124; seven accessible-name failures repaired and one blank-save timeout passed on rerun; final affected suite 28/28, including every prior failure and all Layers/library cases. This is not a claim of one all-green 124-case invocation.
- Both desktop themes visually inspected; retained screenshots and exact run-level explanation are in `LAYERS_VERIFICATION.md`. No new Opus approval of these latest changes is claimed.

Run from the V3 working checkout:

```powershell
npm run check
npm run test:unit
npx playwright test --config=e2e/v3-slice.config.ts
```

The isolated Playwright configuration uses Vite on `127.0.0.1:5181`, intercepted API/auth fixtures and no real backend or paid calls. **Each run clears its output directory** `.e2e-artifacts/us-edit-031`; use separate `--output` directories for parallel/focused runs and copy final evidence to the tracked evidence folder after the last run. Do not overwrite prior evidence with an incomplete run.

Add acceptance-derived Arrange tests for exact geometry, all element types (text/emoji, shape, photo, icon, line), rotated bounds, mixed locked/hidden/stale selection, no-op/boundary handling, one-step batch Undo/Redo, ratio and invalid/cancelled numeric edits if included, save/reload and actual exported PNG alignment. Preserve existing Layers drag/menus/overlap, footer behavior, type-specific controls, shortcuts, Preview and legacy-default regression tests. Inspect both themes at 1242x668 and 1440px; preserve the existing 375px fallback rather than promising a mobile editor.

Mocked save/reload is not proof of authenticated database persistence. Label that limitation honestly. Gate 4 should remain not applicable unless the authorized scope changes. Existing test failures must be fixed or accurately reported, not skipped/weakened to force green. Retain logs without secrets; do not commit `.env`, credentials, browser state, node_modules or generated test traces.

## 9. Paste this into the new Opus session

> Continue the V3 Arrange follow-up in `D:/Dinesh/DCloud/GITDrive/Work/Products/InfographicEditor-Unified/.codex-worktrees/v3-slice`, branch `codex/v3-arrange-opus`, based on protected checkpoint `b69074b`. First read `Mockups/approved-v3-editor/OPUS_ARRANGE_HANDOFF.md` completely, then AGENTS.md and the referenced current contracts/runtime. Use ORION's canonical story/hardening/implementation/testing/review workflow and verify that Opus is the actual model for the work assigned to it; role names alone are not proof. Prepare a concrete Arrange story and exact file/task scope before runtime edits, explicitly settling core versus advanced controls and the sidebar-tab integration. Preserve the footer-only Layers entry, current Layer functionality and all type-specific controls. Keep changes isolated and commit verified tasks on the Arrange branch; no push, merge, deployment or baseline-branch rewrite. Report completed scope, tests, evidence, commit IDs and remaining decisions accurately. The full prior chat is not inherited; this handoff supplies its relevant context.
