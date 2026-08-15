# Story Card — US-DEPLOY-007

> **Status:** ✅ Done — all 7 ACs and all 6 TCs live-verified 2026-08-15 (TASKS.md's T5 checkbox had no retrievable transcript behind it — no PR was ever opened — so TC-02/TC-05 were re-proven live rather than trusted)
> **Feature:** F-DEPLOY-01 — Fast, mandatory verification gate
> **Epic:** [EPIC-DEPLOY-01](../../EPIC.md)
> **Milestone:** [M-DEPLOY-01](../../milestones/M-DEPLOY-01-velocity-foundation.md)
> **Size:** M
> **Related:** [US-DEPLOY-001](../US-DEPLOY-001/STORY.md) (CI gate hardening — adjacent, does not overlap)
> **Blocks:** [US-AI-032](../../../EPIC-AI-06/stories/US-AI-032/STORY.md) AC5
> **Linear:** LIN-XXX
> **Created:** 2026-08-11 | **Closed:** 2026-08-15

---

## ⚠️ Priority note — this epic is otherwise non-blocking

[EPIC-DEPLOY-01](../../EPIC.md) states plainly that it does **not** block the beta and runs rolling. **This story is the exception.** It became a hard blocker on 2026-08-11 when US-AI-032 AC5 ("export matches composed preview at full resolution") turned out to be unverifiable: the repo has no way to test client code at all.

Treat its priority as inherited from EPIC-AI-06, not from this epic.

---

## Story

*As an* engineer changing rendering code in `client/src/`
*I want* client-side unit tests to run in the same gate as the backend ones
*So that* "Gate 1 green" actually means my change was verified — not that unrelated backend tests still pass

---

## The gap, concretely

`api/vitest.config.ts` is the only test config in the repo:

```ts
include: ['tests/**/*.spec.ts'],   // relative to api/
environment: 'node',
```

`package.json` wires `test:unit` to `cd api && npx vitest run`. So:

- **Every one of the 193 unit tests is backend.** A `find` for client spec files returns nothing.
- A change touching only `client/src/**` can produce a fully green Gate 1 while being **completely unverified**.
- This is not hypothetical. On 2026-08-11, four non-trivial rendering fixes landed in `client/src/lib/canvasExport.ts` — web-font readiness, an 8px/4px text-padding offset with a changed wrap width, a new `computeObjectFitDraw()` implementing contain/cover/fill, and a 9-argument `drawImage` crop path — and reported "Gate 1: clean, 193 tests passing." Not one of those tests executes a single line of that file. `tsc` was the only check that ran on it.

`environment: 'node'` also means canvas/DOM code could not be tested even if specs existed.

---

## Acceptance Criteria

- [x] **AC1 [happy-path]:** A client-side test config exists with a DOM-capable environment (jsdom or equivalent) and the `@/*` → `client/src/*` alias resolving as it does in Vite.
- [x] **AC2 [happy-path]:** `npm run test:unit` runs **both** backend and client suites. A failing client test fails the command.
- [x] **AC3 [happy-path]:** At least one real client test exists and passes, exercising `client/src/lib/canvasExport.ts` — the file whose untested state motivated this story. Assert specific values at specific locations (e.g. text draw offsets matching `TextElement.tsx`'s `px-2 py-1`), not the absence of errors.
- [x] **AC4 [regression]:** All 193 existing backend tests still pass, and `npm run test:integration` is unaffected.
- [x] **AC5 [error-path]:** A deliberately broken client test fails the gate with a clear, attributable message — verify the wiring actually reports, rather than silently skipping when zero specs match.
- [x] **AC6 [edge-case]:** Canvas APIs (`getContext('2d')`, `document.fonts.ready`, `drawImage`) are available or cleanly mockable in the chosen environment. Document which, since jsdom does not implement canvas natively.
- [x] **AC7 [documentation]:** `CLAUDE.md`'s Testing section and the Commands block record how to run client tests, and the verification-gates skill's Gate 1 definition is updated to include them.

---

## Out of Scope

- **Rewriting or expanding backend test coverage** — untouched beyond confirming it still runs.
- **E2E/Playwright changes** — [US-DEPLOY-001](../US-DEPLOY-001/STORY.md) owns the E2E half of the gate.
- **Component/interaction testing** (React Testing Library patterns, user-event flows). This story establishes the *runner*; broad component coverage is separate, larger work.
- **Visual regression / screenshot diffing.** Tempting for AC5 of US-AI-032, but a different tool class and a different story.
- **Backfilling tests for every untested client file.** AC3 requires one meaningful suite, not a coverage target.

---

## Notes for implementation

- The repo already uses Vitest for the backend, so a client Vitest project keeps one runner and one mental model. Vitest workspace/projects config can hold both suites under a single `npm run test:unit`.
- `client/src/lib/canvasExport.ts` is the natural first target: pure-ish functions, no React tree, and the file with the most consequential untested logic.
- jsdom does **not** implement `<canvas>`. Either add `vitest-canvas-mock`/`jest-canvas-mock`, or structure the first tests around the pure geometry helpers (`computeObjectFitDraw`, `wrapTextToWidth`) which need no real 2D context. AC6 exists to force this decision explicitly rather than discovering it mid-implementation.
- Keep the gate fast — EPIC-DEPLOY-01's success metric is CI green in under 10 minutes.

---

## Engineering / PR

- **Branch:** `feat/deploy/us-deploy-007-client-test-infra`
- **PR:** #_____ (fill when opened)
- **Primary files touched:**
  - `client/vitest.config.ts` *(new)* or a root workspace config
  - `package.json` — `test:unit` script
  - `client/src/lib/__tests__/canvasExport.spec.ts` *(new)*
  - `CLAUDE.md` — Testing + Commands sections
  - `.claude/skills/verification-gates/SKILL.md` — Gate 1 definition

---

## AI Implementation Prompt

```
Context: InfographicAI SaaS — NestJS API (port 3001) + React 18/Vite frontend (port 5000 via
Express proxy). See CLAUDE.md. Backend tests use Vitest (api/vitest.config.ts).

Story: US-DEPLOY-007 — Client-side unit test infrastructure

Problem: there is NO client test infrastructure. api/vitest.config.ts covers only
api/tests/**, environment 'node'. A client-only change can pass Gate 1 having been
verified by nothing but tsc. This has already happened.

Deliver: a DOM-capable client test setup wired into `npm run test:unit`, plus one real
suite covering client/src/lib/canvasExport.ts.

Implementation rules:
- Touch ONLY the files in "Primary files touched"
- Do NOT modify existing backend tests or api/vitest.config.ts behaviour — all 193 must
  still pass
- jsdom does not implement canvas. Decide explicitly: mock it, or test the pure geometry
  helpers only. Document the choice (AC6).
- Prove the gate actually fails on a broken client test before declaring done (AC5)
- Keep it fast — CI target is <10 min
- When done: list files changed, ACs checked, exact test command
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-DEPLOY-007-01 | Auto | P0 | `npm run test:unit` runs backend + client suites; both report | ✅ Pass | Live re-run 2026-08-15: `Test Files 28 passed` (backend) + `Test Files 10 passed` (client) both print, exit 0 |
| TC-DEPLOY-007-02 | Auto | P0 | A failing client test fails `npm run test:unit` with a non-zero exit code | ✅ Pass | Live-proven 2026-08-15: deliberately broke `TEXT_PAD_H is 8px` → exit 1, backend suite unaffected (still 350/350, proving isolation), failure names the exact file/describe/test. Reverted immediately after. |
| TC-DEPLOY-007-03 | Auto | P0 | Client suite for `canvasExport.ts` passes and asserts concrete draw geometry | ✅ Pass | `canvasExport.spec.ts` — 21 tests, concrete values (padding constants, `computeObjectFitDraw` rects, `computeCropSourceRect` coordinates), not "does not throw" |
| TC-DEPLOY-007-04 | Auto | P0 | All pre-existing backend tests still pass | ✅ Pass | 350/350 as of 2026-08-15 (grew from 193 at story creation — expected drift, not a break) |
| TC-DEPLOY-007-05 | Auto | P1 | Zero matching client specs does **not** silently report green | ✅ Pass | Live-proven 2026-08-15: temporarily pointed `include` at a non-matching glob → `"No test files found, exiting with code 1"`, backend suite still ran and passed (350/350) independently. Reverted immediately after. |
| TC-DEPLOY-007-06 | Auto | P1 | `@/*` alias resolves in tests exactly as in Vite | ✅ Pass | `alias-resolution.spec.ts` — imports `@/lib/canvasTypes`, passes |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

*Created 2026-08-11 — surfaced by the US-AI-032 export-parity work, which shipped four rendering changes that no test could reach.*
