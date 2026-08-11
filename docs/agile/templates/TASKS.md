# PR Task List — US-{DOMAIN}-{NNN}

> **Story:** [STORY.md](./STORY.md)  
> **Branch:** `feat/{domain}-us-{domain}-{nnn}-{slug}`  
> **PR:** #_____ (fill when opened)  
> **Linear:** LIN-XXX  
> **Type:** feat | fix | test | refactor

---

## Four Pillars Pre-flight (check before starting AI session)

- [ ] **Brain** — STORY.md is filled: ACs written, out-of-scope listed, "AI Implementation Prompt" ready
- [ ] **Muscle** — This TASKS.md has file list + ordered tasks + exact test commands
- [ ] **Map** — [ARCHITECTURE.mmd](../../ARCHITECTURE.mmd) exists for this epic (AI has spatial context)
- [ ] **Env** — [ENV.yaml](../../ENV.yaml) loaded (paths not guessed)

> If any pillar is missing, fill it before opening the AI chat. Incomplete context = wasted session.

---

## PR Scope Summary

**One-liner:** {what this PR does — becomes the squash commit message}
```
feat({scope}): {what and why} — US-{DOMAIN}-{NNN}
```

---

## 🔑 Rule: every task ships with its own test

**A task's test goes in the same commit as the code it verifies.** Do not collect the story's tests into a trailing "add tests" task.

Three reasons this is non-negotiable:

1. **Bisect stays meaningful.** [GIT_STRATEGY.md](../GIT_STRATEGY.md) justifies per-task commits so you can *"bisect to a story and to a task."* A commit carrying implementation without its test is not a bisectable point — it is a point where you cannot tell whether the code worked.
2. **Gate 1 means something at every commit**, not only at the last one.
3. **It preserves contract-first testing.** See the [contract-first-testing](../../../.claude/skills/contract-first-testing/SKILL.md) skill. Tests must assert what the **AC** requires, not what the implementation happens to do. An agent that writes all the code and *then* all the tests will describe its own implementation back to itself — the suite goes green while the contract goes unverified.

**Preferred order within a task:** write the failing test from the AC first, then implement until it passes.

**The one legitimate exception:** a layer with no test infrastructure. Say so explicitly in the task and link the story that will fix it — never let it pass silently as "covered".

---

## Task Breakdown

### T1 — {Task title}
**Files:**
- `path/to/file.tsx` — implementation
- `api/tests/{domain}/{file}.spec.ts` — its test

**AC(s) covered:** AC1, AC2  
**Changes:**
- Line {N}: `{old}` → `{new}`
- Test: `it('should {condition described by AC1}', ...)` — assert the AC's specific value at its specific location

**Commit:** *(implementation + test together)*
```bash
git add path/to/file.tsx api/tests/{domain}/{file}.spec.ts
git commit -m "feat(scope): T1 description — US-{DOMAIN}-{NNN}"
```

---

### T2 — {Task title}
**Files:**
- `path/to/another/file.tsx` — implementation
- `api/tests/{domain}/{other}.spec.ts` — its test

**AC(s) covered:** AC3  
**Changes:**
- Replace `{pattern}` with `{replacement}` (N occurrences)
- Test: `it('should {condition described by AC3}', ...)`

**Commit:**
```bash
git add path/to/another/file.tsx api/tests/{domain}/{other}.spec.ts
git commit -m "feat(scope): T2 description — US-{DOMAIN}-{NNN}"
```

---

### T3 — {Task title — untestable layer, if applicable}
**File:** `client/src/{path}.tsx`  
**AC(s) covered:** AC4  
**Test coverage:** ⚠️ **None — {reason}.** Tracked by {US-XXX-NNN}. Verified by `npm run check` only.

> Use this shape **only** when the layer genuinely has no test harness. Never as a shortcut.
> State it in the task, in the commit body, and in the report — a reader must not be able to
> mistake "compiles" for "verified".

**Commit:**
```bash
git add client/src/{path}.tsx
git commit -m "feat(scope): T3 description — US-{DOMAIN}-{NNN}"
```

---

## File-to-Task Mapping

| File | Task(s) | AC(s) | Test coverage |
|------|---------|-------|---------------|
| `path/to/file.tsx` | T1 | AC1, AC2 | ✅ `tests/{domain}/{file}.spec.ts` (same commit) |
| `path/to/another/file.tsx` | T2 | AC3 | ✅ `tests/{domain}/{other}.spec.ts` (same commit) |
| `client/src/{path}.tsx` | T3 | AC4 | ⚠️ none — see task note |

---

## Exact Test Commands

```bash
# 1. TypeScript check — must pass before PR
npm run check

# 2. Unit tests — must pass before PR
npm run test:unit

# 3. Specific test file
cd api && npx vitest run tests/{domain}/{file}.spec.ts --reporter=verbose

# 4. E2E (if applicable)
npm run test:e2e -- --grep "{test suite name}"

# 5. Manual flow
# Open localhost:5000 → {describe what to do and what to verify}
```

> ⚠️ **`npm run test:unit` runs backend tests only** (`api/vitest.config.ts` → `api/tests/**`).
> A change touching only `client/**` can produce a fully green run having been verified by
> nothing but `tsc`. Never report such a run as evidence for frontend work — name the gap instead.

---

## Task Checklist

- [ ] T1 — {title} (impl + test in one commit)
- [ ] T2 — {title} (impl + test in one commit)
- [ ] T3 — {title} (coverage gap declared, if applicable)
- [ ] `npm run check` passes ✅
- [ ] `npm run test:unit` passes ✅
- [ ] Every AC maps to a test, or to an explicitly declared coverage gap ✅
- [ ] Manual test: {what was verified} ✅
- [ ] PR opened with story card as description ✅
- [ ] STORY.md ACs updated — only ACs actually verified are ticked ✅

---

## Test Is Truth

> **Rule (non-negotiable):** Do not weaken, skip, or modify a failing test to make it pass. Fix the code. Do not open a PR until all commands in "Exact Test Commands" pass or are explicitly marked N/A with a reason.
>
> If `npm run check` fails → fix the TypeScript error.  
> If `npm run test:unit` fails → fix the code, not the test assertion.  
> If a manual TC fails → record the finding in STORY.md, do not close the AC.
> If an AC could not be verified (no credit, no infrastructure, no environment) → **leave it unticked** and say why. A ticked AC is a claim that someone checked.

---

## Anti-Patterns to Avoid in This Story

- {Specific thing the AI tends to do that's out of scope for this story}
- {e.g. "Do NOT refactor surrounding component logic"}
- {e.g. "Do NOT change canvas drawing code"}

---

## PR Open Command

```bash
gh pr create \
  --title "[US-{DOMAIN}-{NNN}] {short title}" \
  --label "epic:{domain},type:{type},priority:P{N}" \
  --body "$(cat docs/agile/epics/{EPIC-ID}/stories/{US-ID}/STORY.md)"
```

---

*Tasks created: YYYY-MM-DD*
