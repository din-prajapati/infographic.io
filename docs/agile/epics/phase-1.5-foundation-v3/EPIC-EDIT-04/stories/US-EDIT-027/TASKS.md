# PR Task List — US-EDIT-027

## Four Pillars Pre-flight

- [x] Brain — existing ACs reconciled to approved V3 plan and explicit recovery safety.
- [x] Muscle — ordered scoped task below, no legacy autosave changes.
- [x] Map — ../../ARCHITECTURE.mmd traces V3 session and existing API.
- [x] Env — ../../ENV.yaml loaded; no new environment variables.

## Primary files touched

- client/src/App.tsx — initialize history tracking before any SPA navigation
- client/src/lib/v3NavigationGuard.ts — central Wouter-compatible history boundary
- client/src/lib/__tests__/v3NavigationGuard.spec.ts — exact dirty/clean navigation contracts
- client/src/components/editor/v3/V3Editor.tsx — route both Projects/logo through guarded Wouter navigation
- e2e/us-edit-031-v3-slice.spec.ts — browser Back/Forward, go, push/replace, document-switch and consent regressions
- ../../EPIC.md — implementation update only
- .orion/state/_replay.log and .orion/state/_replay/ — invocation evidence
- client/src/lib/v3DesignSession.ts
- client/src/hooks/useV3DesignSession.ts
- client/src/lib/v3Autosave.ts
- client/src/lib/__tests__/v3Autosave.spec.ts
- client/src/lib/__tests__/v3DesignSession.spec.ts
- This story's STORY.md, TASKS.md, scaffold.json, VERIFICATION.md

## Tasks

- [x] T1 — Existing guarded session implements two-second idle autosave, acknowledgement timestamp, user/design-scoped local recovery, beforeunload and the explicit navigation confirmation API. Covers AC1–3 and AC5–8 plus the unload/Projects portion of AC4; this records existing implementation, not new code in this reconciliation.
- [x] T2 — Remaining AC4: protect same-document browser Back/Forward and other programmatic route transitions with a central Wouter-compatible dirty-navigation guard. Define exact runtime file scope and browser acceptance tests before implementing; current source does not provide this interception. No speculative router rewrite is authorized by this checklist entry.

### T2 contract (2026-11-08, before implementation)

App initializes a history boundary before routing; only a mounted V3 session supplies a dirty predicate. Rejected pushState/replaceState retain the exact editor URL and live title/elements; accepted navigation changes to the requested destination once. Capture-phase popstate checks consent before Wouter receives a transition; rejection traverses back to the original indexed history entry without replacing either entry or reloading the session. Back, Forward and multi-entry go preserve history order. Clean navigation and unmounted/legacy routes remain unrestricted. First-save canonical-ID replacement is an explicitly scoped internal operation and never prompts or reloads the active document. Existing beforeunload and confirmation API remain covered.

Browser acceptance: reject/accept dirty Back and Forward; reject multi-entry go; reject/accept push and replace (including another design ID and legacy-editor query); reject/accept Projects with exactly one prompt; clean navigation/no prompt; first-save adoption/no prompt; returned editor guard is active. Unit contracts cover wrapper preservation/disposal and internal replacement.

T2 commit: `feat(edit): T2 guard V3 same-document navigation — US-EDIT-027`
- [x] T3 — Reconcile story/task/evidence state against current source and tests on2026-11-07, preserving AC4 as partial and formal Done/merge as pending.

Commit: `feat(edit): T1 add guarded V3 autosave and draft recovery — US-EDIT-027`

## Verification

Focused: `cd client && npx vitest run src/lib/__tests__/v3Autosave.spec.ts src/lib/__tests__/v3DesignSession.spec.ts --reporter=verbose`.
Gate 1: `npm run check`, `npm run test:unit` (root coordinator runs full suites).
Gate 2/3: shell integration browser checks coordinated under US-EDIT-024. Gate 4: no backend files changed; live acknowledged save smoke remains required for release.


## Current delivery boundary

Current branch for reconciliation: `codex/v3-arrange-opus`. T2 implemented and locally verified 2026-11-08; current evidence below supersedes the 2026-11-07 open-gap state. M-EDIT-09 cannot be marked complete from the Arrange work. No merge to main is permitted.

## T4 — Authorized release hardening (2026-11-14)

- [x] Release hardening: edits during thumbnail preparation are a superseded save attempt, not a transport failure. Retain latest edits/draft, serialize writes, schedule retry of latest state, never acknowledge stale revision or advance lastSavedAt falsely. Files: client/src/hooks/useV3DesignSession.ts, client/src/lib/v3DesignSession.ts and existing session/autosave tests, e2e/us-edit-031-v3-slice.spec.ts only jointly with fixture owner. No CSS/font changes.

User authorized standup points2/3. Root owns evidence, tracker reconciliation and commits; independent source/test ownership is coordinated. Existing ACs and exclusions remain unchanged. All applicable gates and independent review required; no merge/deploy. Physical-device acceptance and ongoing font annotations remain pending.


2026-11-14: release-hardening automated verification and independent review are recorded in docs/research/2026-11-14-V3-RELEASE-HARDENING.md. Historical fixture failures are reconciled without removed cases; font/device/UI acceptance and merge remain open.
