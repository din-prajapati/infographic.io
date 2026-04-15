# PR Task List — US-{DOMAIN}-{NNN}

> **Story:** [STORY.md](./STORY.md)  
> **Branch:** `feat/{domain}-us-{domain}-{nnn}-{slug}`  
> **PR:** #_____ (fill when opened)  
> **Linear:** LIN-XXX  
> **Type:** feat | fix | test | refactor

---

## Three Pillars Pre-flight (check before starting AI session)

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

## Task Breakdown

### T1 — {Task title}
**File:** `path/to/file.tsx`  
**AC(s) covered:** AC1, AC2  
**Changes:**
- Line {N}: `{old}` → `{new}`
- Line {M}: `{old}` → `{new}`

**Commit:**
```bash
git add path/to/file.tsx
git commit -m "feat(scope): T1 description — US-{DOMAIN}-{NNN}"
```

---

### T2 — {Task title}
**File:** `path/to/another/file.tsx`  
**AC(s) covered:** AC3  
**Changes:**
- Replace `{pattern}` with `{replacement}` (N occurrences)

**Commit:**
```bash
git add path/to/another/file.tsx
git commit -m "feat(scope): T2 description — US-{DOMAIN}-{NNN}"
```

---

### T3 — {Task title — e.g. Add/update test}
**File:** `api/tests/{domain}/{file}.spec.ts`  
**AC(s) covered:** AC4  
**Changes:**
- Add test: `it('should {condition}', ...)`

**Commit:**
```bash
git add api/tests/{domain}/{file}.spec.ts
git commit -m "test(scope): T3 description — US-{DOMAIN}-{NNN}"
```

---

## File-to-Task Mapping

| File | Task(s) | AC(s) | Notes |
|------|---------|-------|-------|
| `path/to/file.tsx` | T1 | AC1, AC2 | |
| `path/to/another/file.tsx` | T2 | AC3 | |
| `api/tests/.../file.spec.ts` | T3 | AC4 | new test |

---

## Exact Test Commands

```bash
# 1. TypeScript check — must pass before PR
npm run check

# 2. Unit tests — must pass before PR
npm run test:unit

# 3. Specific test file (if adding/changing tests)
cd api && npx vitest run tests/{domain}/{file}.spec.ts --reporter=verbose

# 4. E2E (if applicable)
npm run test:e2e -- --grep "{test suite name}"

# 5. Manual flow
# Open localhost:5000 → {describe what to do and what to verify}
```

---

## Task Checklist

- [ ] T1 — {title} (file: `…`)
- [ ] T2 — {title} (file: `…`)
- [ ] T3 — {title} (file: `…`)
- [ ] `npm run check` passes ✅
- [ ] `npm run test:unit` passes ✅
- [ ] Manual test: {what was verified} ✅
- [ ] PR opened with story card as description ✅
- [ ] STORY.md ACs updated ✅

---

## Test Is Truth

> **Rule (non-negotiable):** Do not weaken, skip, or modify a failing test to make it pass. Fix the code. Do not open a PR until all commands in "Exact Test Commands" pass or are explicitly marked N/A with a reason.
>
> If `npm run check` fails → fix the TypeScript error.  
> If `npm run test:unit` fails → fix the code, not the test assertion.  
> If a manual TC fails → record the finding in STORY.md, do not close the AC.

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
