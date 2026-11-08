# Claude Opus hand-off — V3 remaining feature milestones

Date: 2026-11-08 (Asia/Calcutta).

## Scope and safety

User request: first finish US-EDIT-027 navigation protection in the same V3 branch; then group previous task-list points #4–#9 and check existing planning records for Claude Opus. This document is the planning hand-off only. No implementation of those six feature stories is authorized by this document; Dinesh should select the next milestone in the receiving session.

- Checkout: `D:/Dinesh/DCloud/GITDrive/Work/Products/InfographicEditor-Unified/.codex-worktrees/v3-slice`.
- Branch: `codex/v3-arrange-opus`. Starting checkpoint for this session: `2492925`.
- Read `SESSION_HANDOFF_2026-11-07.md` in this folder first. Check current branch/status and latest commits; preserve all existing work.
- Main must not be merged, reset, rebased or deployed. No push, PR publication, default-editor rollout or formal story closure is authorized. Main reference: `4334eab289c1a9b0af294444dba9750b2c673a53`.
- Current US-EDIT-027 implementation and verification outcome belongs in its `STORY.md`, `TASKS.md`, `VERIFICATION.md` and the navigation result section appended below. Historical 7/8 references describe the earlier checkpoint.
- Wouter, NestJS, Prisma, existing canvas renderer/store/session/export remain canonical. Preserve approved Navy/Teal shell, footer Layers entry and current Arrange/Layers behavior.

## Existing milestone grouping — do not create duplicate IDs

All paths in the table are relative to `docs/agile/epics/phase-1.5-foundation-v3/EPIC-EDIT-04/` in the active worktree.

| Broad work package | Existing milestone document | Previous point | Existing story cards | Complexity / next preparation |
|---|---|---|---|---|
| Linked editing and export safety | `milestones/M-EDIT-06-linked-editing.md` | #4 and #7 | `stories/US-EDIT-020/STORY.md`; `stories/US-EDIT-021/STORY.md` | High overall. Inspector/Manage links first, export review second; confirm binding and structured-price foundations. |
| Design / Look workflow | `milestones/M-EDIT-07-design-tab.md` | #5 | `stories/US-EDIT-022/STORY.md` | Medium. Reconcile existing controls, proven templates, accent/photo/format/logo and atomic fact-preserving application. |
| Property and Contact workflow (remaining shell milestone scope) | `milestones/M-EDIT-09-v3-shell.md` | #6 | `stories/US-EDIT-025/STORY.md` | High. Paste-first reviewed import, profile persistence, CTA/registration bindings and validation. Existing shell/forms do not fulfill this whole story. |
| Extraction and link confirmation | `milestones/M-EDIT-10-extraction-review.md` | #8 | `stories/US-EDIT-026/STORY.md` | Very high. Mandatory five-real-poster extraction spike precedes UI implementation. |
| AI Assistant creation workflow | `milestones/M-EDIT-08-ai-assistant.md` | #9 | `stories/US-EDIT-023/STORY.md` | High. Create design / Generate Background, listing review, preview/Use/Keep current and credit display. |

M-EDIT-08 also contains existing `US-AI-015` (refine chips) and `US-EDIT-008` (quota/charge confirmation). They are broader milestone scope, not automatically added to Dinesh's six selected feature stories. M-EDIT-09 also includes US-EDIT-024/027; preserve that existing scope and avoid rebuilding the shell.

## Planning inventory — checked on 2026-11-08

- Epic record exists: `EPIC-EDIT-04/EPIC.md`, with all six story rows and all five milestone links.
- All five milestone documents above exist with goal, story table, dependencies and milestone acceptance.
- All six selected story cards exist, each with acceptance criteria, out-of-scope and expected files. Their recorded status is Not Started / drafted 2026-10-29.
- Each selected story folder currently contains **only `STORY.md`**. None has `TASKS.md`, `scaffold.json`, story-level `VERIFICATION.md`, or `.orion/state/locks/<story-id>.json`.
- Separate feature cards are **not created** for this epic: there is no `EPIC-EDIT-04/features/` directory and no matching feature document was found in the agile file inventory. Feature intent is captured in the epic, milestones and story cards. Do not claim the complete Epic → Feature → Milestone → implementation-ready Story scaffold exists.
- No new feature/story/milestone cards were created by this inventory. If separate feature records are required by the selected canonical workflow, scaffold them deliberately without duplicating existing stories.
- The draft expected file paths include older `RightSidebar.tsx`, `EditorLayout.tsx`, `ContextualToolbar.tsx` and `LayersPanel.tsx`. Trace actual opt-in V3 imports and reconcile contracts to `components/editor/v3/` before implementation. Do not implement these features in the legacy editor merely because a draft lists its file.

## Dependency checks and suggested sequence

This is a document-status audit, not a fresh runtime proof of dependency completion or a lock-ready scheduling verdict.

1. Reconcile the foundations first. Existing cards under sibling `EPIC-PROP-01` record US-PROP-002 (structured price), US-PROP-003 (reviewed text import), US-PROP-004 (binding types), US-PROP-005 (proven template metadata), and US-AI-028 (saved agent profile) as **Not Started**. Some say hardened in prose; do not infer a current valid lock from that. Check source, TASKS, tests, current lock SHA and actual branch integration.
2. Follow transitive dependencies: US-PROP-002 requires US-PROP-001; US-PROP-003 also requires US-PROP-007. M-PROP-02-brand-profile exists and is recorded Not Started; it includes the profile/logo foundations. Resolve necessary foundations rather than silently expanding editor stories to own backend contracts.
3. After binding/price foundations, prepare US-EDIT-020; US-EDIT-021 follows it and also depends on US-EDIT-009 (Make editable).
4. Prepare US-EDIT-022 after template/brand foundations; US-EDIT-025 follows US-EDIT-022 plus price/import/profile foundations. Preserve shared-file ordering.
5. US-EDIT-026 requires US-EDIT-009 and US-PROP-004; its spike uses US-AI-048. The US-AI-048 card exists under `phase-1-ai-core/EPIC-AI-06` and records Done with historical live verification. Recheck current runtime extraction quality on five real posters. If fewer than four are usable, the story explicitly drops Locate and keeps text/suggested links.
6. US-EDIT-023 requires reviewed text import (US-PROP-003) and US-EDIT-009. Prepare it after those contracts; do not equate functional prototype generation with production generation.

Dependency relationships above allow several future sequences; select one bounded story after the audit. Do not launch all five milestones together.

## The three references

- Actual product: `http://localhost:5000/editor?editor=v3` (authenticated, opt-in). Ordinary `/editor` remains legacy.
- Approved visual layout: `http://127.0.0.1:5193/index.html`, active worktree `Mockups/approved-v3-editor/`. Preserve later toolbar/Layers/Arrange approvals over old reference details. Light/dark/system review controls are not production UI.
- Functional sample: `http://127.0.0.1:4180/?design=v3-generated-sample`; text-import entry: `http://127.0.0.1:4180/?design=v3-ready-to-generate&assistant=1`.

Functional prototype files are in the **primary repository**, `D:/Dinesh/DCloud/GITDrive/Work/Products/InfographicEditor-Unified/Mockups/buildographic-canvas-simplification-v3`, currently untracked and not protected by V3 branch commits. Preserve `data.json`, `generated/` and assets; do not stage the primary checkout wholesale or overwrite sample records during review.

Read its README.md, USE-CASE-WORKFLOW.md, VERIFICATION.md, bindings.mjs, extraction.mjs and studio.mjs before integration planning. It demonstrates real local bindings/history/review/saving/export, but extraction uses saved sample geometry and generation locally composes sample artwork. It is not live arbitrary-image OCR, a new provider-generated image, or authenticated database persistence. Prototype SVG export does not expand the production stories' PNG/JPG scope.

## Execution protocol for the receiving Opus session

1. Read applicable AGENTS.md and `.orion/orion.yaml`; resolve canonical skills and required locks. Do not bypass hardening.
2. Select the requested existing story, reconcile its ACs against current V3 runtime, create detailed TASKS/scaffold/test contracts and required lock through canonical workflows before implementing. Split large L stories where needed.
3. Trace runtime before editing. Use meaningful contract-first tests for state/history/validation/recovery; preserve invalid-input behavior and atomic undo.
4. Run mandatory type/unit checks, focused browser coverage, both themes for new surfaces, and backend smoke when backend/schema changes warrant it. Record actual outcomes; preserve failed-run evidence.
5. Scope commits to this worktree and the selected contract. Never weaken tests, claim prototype behavior shipped, mark locally tested stories formally Done, or merge main without Dinesh's authorization.

## Copy into Claude Opus

> Continue the existing opt-in V3 editor in `D:/Dinesh/DCloud/GITDrive/Work/Products/InfographicEditor-Unified/.codex-worktrees/v3-slice`, branch `codex/v3-arrange-opus`. Read `Mockups/approved-v3-editor/SESSION_HANDOFF_2026-11-07.md` and `CLAUDE_OPUS_HANDOFF_2026-11-08.md`, then AGENTS.md and `.orion/orion.yaml`. Verify current branch/status and the current US-EDIT-027 result. The six remaining feature stories already exist, grouped under M-EDIT-06/07/08/09/10, but are draft-only with no TASKS/scaffold/locks; separate feature cards are absent. Audit dependencies and reconcile selected story paths against current V3 imports before hardening. Preserve the approved shell/Arrange/Layers and untracked functional prototype in the primary checkout. No main merge, push, PR publication, deployment or default-editor rollout. Wait for Dinesh to select the next milestone/story before feature implementation.

## Navigation protection result — 2026-11-08

US-EDIT-027 T2 is now implemented locally on the same `codex/v3-arrange-opus` branch. AC4 covers dirty Back/Forward/multi-entry history traversal, programmatic push/replace (including design-ID switches and V3 opt-out), one-prompt Projects/logo navigation, clean exits and first-save URL adoption. Cancel retains the active draft and history direction; native hash entries are tracked without unnecessary leave prompts. History state and the tracked navigation chain remain valid after a full page reload. The original unload guard remains.

Fresh verification: frontend/API type checks pass; 811 backend + 751 client unit tests pass (one existing client skip). The retained V3 browser file passes 38/38; the final focused navigation rerun passes 11/11, including the added real-reload regression. Thus 39 distinct browser contracts pass across those runs, including 11 navigation cases. The retained browser suite covers first-save/recovery, legacy default and desktop light/dark checks. See `docs/agile/epics/phase-1.5-foundation-v3/EPIC-EDIT-04/stories/US-EDIT-027/VERIFICATION.md` for exact logs/artifacts and current gate limitations. No fresh authenticated database persistence smoke or whole-candidate review is claimed.

The story's ACs are locally verified; formal Done remains pending review/milestone merge. This result supersedes the earlier 7/8 AC status in historical documents. No implementation of US-EDIT-020/021/022/023/025/026 occurred in this session. Use the latest scoped navigation commit in `git log` as the receiving session's checkpoint.

Navigation checkpoints: initial implementation `0cc5f6a`; final reload-safe correction and evidence `01b6b49`. Final mandatory checks passed on the corrected runtime (1,562 unit passes, one existing skip).

## Fresh real-backend persistence audit — 2026-11-08

The current actual V3 editor has now passed a fresh real-auth/API/Prisma database save/reopen audit, including UI-created first save, same-ID idle autosave and a rich five-element specimen. Fresh browser contexts restored the exact saved artwork; before/reopened artboards and downloaded PNGs had zero differing RGBA pixels for both designs. See [the detailed evidence and limits](LIVE_PERSISTENCE_VERIFICATION_2026-11-08.md). This supersedes the earlier statement that no fresh authenticated persistence smoke was claimed. My Designs still opens the legacy editor by default; verified V3 reopen explicitly uses `editor=v3`. No default change or #4–#9 implementation occurred.
