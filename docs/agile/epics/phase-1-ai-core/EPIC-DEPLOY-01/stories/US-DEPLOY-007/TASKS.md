# PR Task List — US-DEPLOY-007

> **Story:** [STORY.md](./STORY.md)
> **Branch:** `feat/deploy/us-deploy-007-client-test-infra` *(based on `feat/ai/m-18-editable-text-overlay`)*
> **PR:** #_____ (fill when opened)
> **Linear:** LIN-XXX
> **Type:** feat
> **Estimated total:** ~3h

---

## Four Pillars Pre-flight

- [ ] **Brain** — [STORY.md](./STORY.md) read: 7 typed ACs, out-of-scope listed
- [ ] **Muscle** — file list + ordered tasks + exact commands below
- [ ] **Map** — [ARCHITECTURE.mmd](../../ARCHITECTURE.mmd) reviewed
- [ ] **Env** — no new env vars; no credentials or external services needed

> **Why this branch is based on m-18.** AC3 requires a suite for `client/src/lib/canvasExport.ts`. That file differs by 127 insertions / 33 deletions between `main` and `m-18` — US-AI-032 T6 added `document.fonts.ready`, the `padH = 8` padding offsets, `computeObjectFitDraw()` and crop handling. Writing the first tests against `main`'s copy would encode the **buggy** behaviour ("text has no padding", "images stretch") as expected, then break the moment m-18 merges. Base it on the fixed renderer.

---

## 🔑 Rule: every task ships with its own test

Per the [TASKS template](../../../../templates/TASKS.md): a task's test goes in the same commit as the code it verifies. This story is the one place that rule is awkward — the deliverable *is* the test harness — so the shape here is: **each task that adds capability must demonstrate that capability in the same commit.**

---

## PR Scope Summary

```
feat(test): stand up client-side unit test infrastructure — US-DEPLOY-007
```

---

## Task Breakdown

### T1 — Client test config with a DOM environment
**Files:**
- `client/vitest.config.ts` *(new)*
- `package.json` — devDependencies (`jsdom` or `happy-dom`)

**AC(s) covered:** AC1
**Estimate:** 40m

**Changes:**
- New config: `environment: 'jsdom'`, `include: ['src/**/*.spec.ts', 'src/**/*.spec.tsx']`
- Resolve the `@/*` → `client/src/*` alias **exactly as `vite.config.ts` does** — read it, do not re-derive. A test that resolves imports differently from the dev server is worse than no test.
- Do not touch `api/vitest.config.ts`.

**Demonstrate in the same commit:** one trivial spec that imports through the `@/*` alias and passes, proving resolution works.

**Commit:**
```bash
git add client/vitest.config.ts package.json client/src/**/*.spec.ts
git commit -m "feat(test): T1 add DOM-capable client test config — US-DEPLOY-007"
```

---

### T2 — Decide and document the canvas strategy
**Files:** `client/vitest.config.ts`, `client/src/test-setup.ts` *(new, if mocking)*
**AC(s) covered:** AC6
**Estimate:** 35m

**jsdom does not implement `<canvas>`.** `getContext('2d')` returns `null`, so `canvasExport.ts` cannot run unmodified. Decide explicitly — do not discover this mid-suite:

| Option | Cost | Buys |
|---|---|---|
| **(a)** Add `vitest-canvas-mock` / `jest-canvas-mock` | one dep, some fidelity loss | can call `exportCanvasToImage` end-to-end and assert on recorded `ctx` calls |
| **(b)** Test only the pure helpers (`computeObjectFitDraw`, `wrapTextToWidth`) | zero deps | real coverage of the geometry that actually broke, no ctx needed |

**Recommendation: (b) first, (a) later if needed.** The four T6 divergences (padding, objectFit, crop, font readiness) are mostly *pure geometry* — testable without a real context, and that is where the bugs were. Exporting `computeObjectFitDraw` for test access is a smaller change than mocking the whole canvas API.

**Record the decision in a comment at the top of the config**, and in AC6's evidence.

**Commit:**
```bash
git add client/vitest.config.ts client/src/test-setup.ts
git commit -m "feat(test): T2 decide and document the canvas testing strategy — US-DEPLOY-007"
```

---

### T3 — Wire into `npm run test:unit`
**Files:** `package.json`
**AC(s) covered:** AC2, AC4
**Estimate:** 25m

**Changes:**
- `test:unit` must run **both** suites and fail if either fails. Vitest workspace/projects config keeps one runner.
- Current script is `cd api && npx vitest run --config vitest.config.ts` — extend, do not replace.
- `test:integration` must stay untouched.

**Demonstrate in the same commit:** paste the run showing **both** suite headers and a combined pass count.

> ⚠️ **AC4 guard:** the backend suite is at **254 tests** on this branch. If that number changes, you broke something — stop and fix it, do not adjust the expectation.

**Commit:**
```bash
git add package.json
git commit -m "feat(test): T3 run client and backend suites under one gate — US-DEPLOY-007"
```

---

### T4 — First real suite: `canvasExport.ts`
**Files:**
- `client/src/lib/canvasExport.ts` — export the pure helpers for test access (no behaviour change)
- `client/src/lib/__tests__/canvasExport.spec.ts` *(new)*

**AC(s) covered:** AC3
**Estimate:** 50m

Assert **specific values at specific locations** per the [contract-first-testing](../../../../../.claude/skills/contract-first-testing/SKILL.md) skill — not "does not throw".

Cover the four T6 divergences, since those are the ones that silently broke exports:
- text draw X/Y includes `padH = 8` / `padTop = 4`, matching `TextElement.tsx:185`'s `px-2 py-1`
- wrap width is `element.width - 16`, not the full element width
- `computeObjectFitDraw` returns correct `contain` / `cover` / `fill` rects for known inputs
- `element.crop` produces the 9-argument `drawImage` source rect matching `getCroppedImageStyle()` in `ImageElement.tsx:85-105`

> **Do NOT re-implement logic inside the spec.** Import the real functions. A mirror that "keeps in sync" with the source verifies nothing — that mistake is already documented in US-AI-032's verification block.

**Commit:**
```bash
git add client/src/lib/canvasExport.ts client/src/lib/__tests__/canvasExport.spec.ts
git commit -m "feat(test): T4 cover canvasExport geometry against the preview contract — US-DEPLOY-007"
```

---

### T5 — Prove the gate actually fails
**Files:** none committed — this is a verification step
**AC(s) covered:** AC5
**Estimate:** 15m

Temporarily break one assertion in T4's suite, run `npm run test:unit`, and confirm:
1. non-zero exit code
2. the failure names the client spec, not a generic error
3. zero matching specs does **not** silently report green

Revert the break. **Paste both outputs (failing and passing) in the PR body** — that transcript is AC5's only evidence.

**Commit:** none (revert leaves the tree clean). Record the transcript in the PR.

---

### T6 — Documentation
**Files:** `CLAUDE.md`, `.claude/skills/verification-gates/SKILL.md`
**AC(s) covered:** AC7
**Estimate:** 20m

- `CLAUDE.md` Testing + Commands sections: how to run client tests, and the canvas decision from T2
- Gate 1's definition must now include the client suite
- **Remove the warning** added to the TASKS template that `test:unit` is backend-only — once this ships, that statement is false and a stale warning is worse than none

**Commit:**
```bash
git add CLAUDE.md .claude/skills/verification-gates/SKILL.md
git commit -m "docs(test): T6 record client test commands and update Gate 1 — US-DEPLOY-007"
```

---

## File-to-Task Mapping

| File | Task(s) | AC(s) | Test coverage |
|------|---------|-------|---------------|
| `client/vitest.config.ts` | T1, T2 | AC1, AC6 | ✅ alias spec (same commit) |
| `package.json` | T1, T3 | AC1, AC2, AC4 | ✅ combined run output |
| `client/src/lib/canvasExport.ts` | T4 | AC3 | ✅ `__tests__/canvasExport.spec.ts` (same commit) |
| `client/src/lib/__tests__/canvasExport.spec.ts` | T4 | AC3 | is the test |
| `CLAUDE.md`, verification-gates skill | T6 | AC7 | n/a — docs |

---

## Exact Test Commands

```bash
npm run check                 # TypeScript — both projects
npm run test:unit             # MUST run backend (254) + client after T3
npm run test:integration      # must be unaffected
cd client && npx vitest run   # client suite alone
```

---

## Task Checklist

- [ ] T1 — client config + alias proof (same commit)
- [ ] T2 — canvas strategy decided and documented
- [ ] T3 — both suites under one gate; backend still 254
- [ ] T4 — real `canvasExport` suite, importing real functions
- [ ] T5 — gate proven to fail on a broken client test (transcript in PR)
- [ ] T6 — docs updated, stale backend-only warning removed
- [ ] `npm run check` passes ✅
- [ ] `npm run test:unit` passes ✅
- [ ] STORY.md ACs updated — only ACs actually verified ✅

---

## Test Is Truth

> Do not weaken a failing test to make it pass. If an AC could not be verified, leave it unticked and say why.
> **Do not write mirror-tests.** Import the real function. A copy declared inside the spec verifies nothing — see US-AI-032's verification block for what that failure looks like in practice.

---

## Anti-Patterns to Avoid in This Story

- Do **NOT** modify `api/vitest.config.ts` or any existing backend test
- Do **NOT** re-implement source logic inside a spec to make it testable — export the real function instead
- Do **NOT** add React component/interaction tests — this story delivers the *runner*, not broad coverage
- Do **NOT** attempt visual regression or screenshot diffing — different tool class, different story
- Do **NOT** chase 100% coverage; AC3 asks for one meaningful suite

---

## Downstream

Once this merges, **US-AI-032's TC-03, TC-04, TC-05 and TC-06 become runnable**, and its AC1/AC2/AC3/AC6 become verifiable. Those are currently ⏸ blocked solely on this story.

---

*Tasks created: 2026-08-12*
