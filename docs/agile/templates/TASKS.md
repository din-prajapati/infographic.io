---
title: PR Task List — US-{DOMAIN}-{NNN}
type: template
tags: [orion, template]
updated: 2026-05-21
---

# PR Task List — US-{DOMAIN}-{NNN}

> **Story:** [STORY.md](./STORY.md)
> **Milestone branch:** `{milestone branch — shared with sibling stories in this milestone, per PROJECT_CONTEXT.yaml.git.branch_format}`
> **PR:** #_____ (milestone PR — see .orion/rules/AGILE.md §"Git Standards")
> **Linear:** LIN-XXX

---

## Four Pillars Pre-flight

- [ ] **Brain** — STORY.md is filled: ACs written, out-of-scope listed, AI Implementation Prompt ready
- [ ] **Muscle** — This TASKS.md has T1..Tn (one per AC × file) + exact test commands
- [ ] **Map** — [ARCHITECTURE.mmd](../../ARCHITECTURE.mmd) exists for this epic
- [ ] **Env** — [ENV.yaml](../../ENV.yaml) loaded (paths not guessed)

> Incomplete context = wasted AI session.

---

## PR Scope Summary

**One-liner:** {what this PR does — becomes the squash commit message}

```
{type}({scope}): {what and why} — US-{DOMAIN}-{NNN}
```

**Allowed `type` values:** `feat | fix | ops | test | chore | docs | refactor`

---

## How to read this file

> **Rule:** one task = one file change = one commit. Each task maps to at least one AC.
> code-agent works T1 → Tn in order, committing per task. If a task touches >1 AC, list them all in the AC(s) column.
> If a task touches >1 file, split it.

---

## Task Breakdown

### T1 — {Task title}
- **File:** `path/to/file.ext`
- **Type:** `feat` _(feat | fix | ops | test | chore | docs | refactor)_
- **AC(s) covered:** AC1, AC2
- **Changes:**
  - {Specific change 1}
  - {Specific change 2}

**Commit:**
```bash
git add path/to/file.ext
git commit -m "feat({scope}): {one-line summary of T1} — US-{DOMAIN}-{NNN}"
```

---

### T2 — {Task title}
- **File:** `path/to/another/file.ext`
- **Type:** `fix`
- **AC(s) covered:** AC3
- **Changes:**
  - {Specific change}

**Commit:**
```bash
git add path/to/another/file.ext
git commit -m "fix({scope}): {one-line summary of T2} — US-{DOMAIN}-{NNN}"
```

---

### T3 — {Test task}
- **File:** `path/to/test.spec.ext`
- **Type:** `test`
- **AC(s) covered:** AC4
- **Changes:**
  - Add test: `it('should …', …)`

**Commit:**
```bash
git add path/to/test.spec.ext
git commit -m "test({scope}): {one-line summary of T3} — US-{DOMAIN}-{NNN}"
```

---

## File-to-Task Mapping

| File | Task(s) | AC(s) | Notes |
|------|---------|-------|-------|
| `path/to/file.ext` | T1 | AC1, AC2 | |
| `path/to/another/file.ext` | T2 | AC3 | |
| `path/to/test.spec.ext` | T3 | AC4 | new test |

---

## Exact Test Commands

Read from `PROJECT_CONTEXT.yaml.gates`. Typical:

```bash
# Gate 1 — mandatory
{gate-1-commands}

# Gate 3 — E2E (if applicable)
{gate-3-commands}

# Manual flow
# {describe steps + what to verify}
```

---

## Task Checklist

- [ ] T1 — {title} (file: `…`, type: `feat`)
- [ ] T2 — {title} (file: `…`, type: `fix`)
- [ ] T3 — {title} (file: `…`, type: `test`)
- [ ] Gate 1 passes ✅
- [ ] Gate 2/3/4 passes for applicable domains ✅
- [ ] Manual test verified ✅
- [ ] PR opened with story card as description ✅
- [ ] STORY.md ACs ticked off ✅
- [ ] EPIC.md "Implementation Update" log appended ✅ (by code-agent)

---

## Test Is Truth

> **Rule (non-negotiable):** Do not weaken, skip, or modify a failing test to make it pass. Fix the code. Do not open a PR until all commands in "Exact Test Commands" pass or are explicitly marked N/A with a written reason.

---

## Anti-Patterns to Avoid in This Story

> Auto-populated from STORY.md "Out of Scope". Add story-specific traps you want code-agent to refuse.

- {Specific thing the AI tends to do that's out of scope for this story}
- {e.g., "Do NOT refactor surrounding component logic"}

---

## PR Open Command

```bash
gh pr create \
  --title "[US-{DOMAIN}-{NNN}] {short title}" \
  --label "epic:{domain},type:{type},priority:P{N}" \
  --body-file docs/agile/epics/{phase}/{EPIC-ID}/stories/{US-ID}/PR_BODY.md
```

---

*Tasks created: YYYY-MM-DD*
