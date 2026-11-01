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

- [ ] T1 — Extend guarded session with two-second idle autosave, acknowledgement timestamp, user/design scoped local recovery, beforeunload and explicit navigation API; preserve existing slice contracts. AC1–AC8; estimate 90m.

Commit: `feat(edit): T1 add guarded V3 autosave and draft recovery — US-EDIT-027`

## Verification

Focused: `cd client && npx vitest run src/lib/__tests__/v3Autosave.spec.ts src/lib/__tests__/v3DesignSession.spec.ts --reporter=verbose`.
Gate 1: `npm run check`, `npm run test:unit` (root coordinator runs full suites).
Gate 2/3: shell integration browser checks coordinated under US-EDIT-024. Gate 4: no backend files changed; live acknowledged save smoke remains required for release.
