# PR Task List — US-EDIT-027

## Four Pillars Pre-flight

- [x] Brain — existing ACs reconciled to approved V3 plan and explicit recovery safety.
- [x] Muscle — ordered scoped task below, no legacy autosave changes.
- [x] Map — ../../ARCHITECTURE.mmd traces V3 session and existing API.
- [x] Env — ../../ENV.yaml loaded; no new environment variables.

## Primary files touched

- client/src/lib/v3DesignSession.ts
- client/src/hooks/useV3DesignSession.ts
- client/src/lib/v3Autosave.ts
- client/src/lib/__tests__/v3Autosave.spec.ts
- client/src/lib/__tests__/v3DesignSession.spec.ts
- This story's STORY.md, TASKS.md, scaffold.json, VERIFICATION.md

## Tasks

- [x] T1 — Existing guarded session implements two-second idle autosave, acknowledgement timestamp, user/design-scoped local recovery, beforeunload and the explicit navigation confirmation API. Covers AC1–3 and AC5–8 plus the unload/Projects portion of AC4; this records existing implementation, not new code in this reconciliation.
- [ ] T2 — Remaining AC4: protect same-document browser Back/Forward and other programmatic route transitions with a central Wouter-compatible dirty-navigation guard. Define exact runtime file scope and browser acceptance tests before implementing; current source does not provide this interception. No speculative router rewrite is authorized by this checklist entry.
- [x] T3 — Reconcile story/task/evidence state against current source and tests on2026-11-07, preserving AC4 as partial and formal Done/merge as pending.

Commit: `feat(edit): T1 add guarded V3 autosave and draft recovery — US-EDIT-027`

## Verification

Focused: `cd client && npx vitest run src/lib/__tests__/v3Autosave.spec.ts src/lib/__tests__/v3DesignSession.spec.ts --reporter=verbose`.
Gate 1: `npm run check`, `npm run test:unit` (root coordinator runs full suites).
Gate 2/3: shell integration browser checks coordinated under US-EDIT-024. Gate 4: no backend files changed; live acknowledged save smoke remains required for release.


## Current delivery boundary

Current branch for reconciliation: `codex/v3-arrange-opus`. No US-EDIT-027 runtime changed. T2 is intentionally open. Existing tests can certify autosave/recovery/unload/explicit confirmation, not missing same-document routing. M-EDIT-09 cannot be marked complete from the Arrange work. No merge to main is permitted.
