---
name: implement-story
version: 2.0.0
description: >
  Invoke code-agent to implement one story end-to-end. Reads STORY.md and TASKS.md,
  runs Four Pillars Pre-flight check, delegates to code-agent, then runs Gate 1
  before declaring done. After implementation, code-agent ticks AC checkboxes in
  STORY.md, appends a dated entry to EPIC.md "Implementation Update" log, and
  commits one-task-one-commit using TASKS.md commit templates.
triggers:
  - "implement story"
  - "build story"
  - "code this story"
  - "start implementation"
  - "implement US-"
domains:
  - all
agents:
  - code-agent
---

# Skill: implement-story

## Purpose

Stage 4 of the AI-SDLC pipeline. Take a fully-defined story (STORY.md + TASKS.md exist) and produce a working implementation that satisfies all ACs.

## Input

Required:
- **Story ID** (e.g., `US-AUTH-031`)

Optional:
- **Branch name** (defaults to TASKS.md branch field)

## Protocol

### Step 0 — Harden Lock Check (CLI enforces before this skill runs)

> **This check is performed by the `orion` CLI, not by the LLM.** If you reach
> Step 1, the lock was valid when `orion run implement-story` was invoked.

The CLI reads `.orion/state/locks/<story-id>.json` before invoking this skill.

**If lock is absent:**
```
⛔  US-{ID} is not hardened.
    Run: orion run harden US-{ID}
```
Process exits with code 1. No LLM call is made.

**If lock exists but SHA doesn't match current STORY.md:**
```
⚠️   US-{ID} story has changed since last harden (SHA mismatch).
    Re-run harden to update the lock: orion run harden US-{ID}
```
Process exits with code 1. This protects against ACs being added or removed
after the coverage audit — re-running harden re-locks instantly (< 2s) when
coverage is already complete.

**If lock exists and SHA matches:** proceed to Step 1.

---

### Step 1 — Validate Story Is Ready

Locate STORY.md and TASKS.md. Run the Four Pillars Pre-flight check:

| Pillar | Check |
|--------|-------|
| **Brain** | STORY.md ACs are written, out-of-scope listed |
| **Muscle** | TASKS.md has primary files + ordered tasks |
| **Map** | ARCHITECTURE.mmd exists for parent epic |
| **Env** | ENV.yaml present (or marked N/A in TASKS.md) |
| **Rules** | scaffold.json exists with `rules_loaded` populated |

If any pillar is unchecked, STOP and report:
```
⚠️ Story US-{ID} not ready for implementation.

Missing pillars:
  ❌ Muscle — TASKS.md has no task breakdown
  ❌ Map — ARCHITECTURE.mmd does not exist
  ❌ Rules — scaffold.json missing or rules_loaded is empty

Run /new-story to complete the contract before implementing.
```

### Step 1.5 — Load Rules from scaffold.json

Read `{paths.epics}/{phase}/{EPIC-ID}/stories/{US-ID}/scaffold.json`.

For each path in `scaffold.rules_loaded`, read the file. Pass the loaded rules content (or file paths if context is tight) to code-agent in Step 3.

If `scaffold.json` is absent, fall back to project-level `.orion/scaffold.json` and load **all** declared layer/tech rules. Warn the user that per-story scaffold is missing — this is the less-efficient path.

### Step 2 — Check Branch State

```bash
git branch --show-current
git status --short
```

Confirm:
- On the branch expected by TASKS.md (or create it: `git checkout -b {branch-name}`)
- Working tree is clean

If branch needs to be created from `main`:
```bash
git checkout main
git pull
git checkout -b {branch-name}
```

### Step 3 — Invoke code-agent

Spawn code-agent with this prompt:

```
Implement US-{ID} per STORY.md and TASKS.md.

Pre-loaded context:
  - PROJECT_CONTEXT.yaml at repo root
  - {paths.epics}/{phase}/{EPIC-ID}/stories/{US-ID}/STORY.md
  - {paths.epics}/{phase}/{EPIC-ID}/stories/{US-ID}/TASKS.md
  - {paths.epics}/{phase}/{EPIC-ID}/stories/{US-ID}/scaffold.json (rules_loaded list)
  - {paths.epics}/{phase}/{EPIC-ID}/ARCHITECTURE.mmd
  - {paths.epics}/{phase}/{EPIC-ID}/ENV.yaml

Rules:
- Touch ONLY files in TASKS.md "Primary files touched"
- Implement NOTHING in STORY.md "Out of Scope"
- Run Gate 1 commands after each task complete
- Commit per-task using the commit-message template in TASKS.md (one task = one commit)
- Update TASKS.md task checkboxes as you go
- Tick STORY.md AC checkboxes that your implementation actually covers (leave others unchecked)
- After all tasks done, append a dated entry to the parent EPIC.md "Implementation Update" log
- Stop and ask when uncertain — do not guess
```

### Step 4 — Watch for Code-Agent Output

Code-agent will produce:
- Files edited (matching TASKS.md)
- TASKS.md task checkboxes updated
- STORY.md AC checkboxes ticked for covered ACs
- One commit per task with the TASKS.md commit-message template
- Gate 1 output after each task
- A new dated entry appended to the parent EPIC.md "Implementation Update" log
- A final report

If code-agent reports uncertainty, surface the question to the human. Do not let it guess.

### Step 5 — Post-Implementation Gate Check

After code-agent declares done, independently verify:

```bash
{gate-1-commands}     # From PROJECT_CONTEXT.yaml.gates[id=1]
```

If frontend story, also note Gate 2 + 3 need manual/E2E runs (handled by `/test-story`).

If backend story, also note Gate 4.

### Step 6 — Print Summary

```
✅ Implementation Complete for US-{ID}

Branch: {branch}
Commits: {N}
Files changed: {N}

ACs satisfied:
  ✅ AC1, AC2, AC3, ⏸ AC4 (E2E — covered next step)

Gate 1: ✅ Passed
Gate 2/3/4: pending /test-story

Next:
  /test-story US-{ID}    — write unit + E2E tests
  /agile-pr  US-{ID}     — open PR (after tests pass)
```

## Edge Cases

| Situation | Rule |
|-----------|------|
| TASKS.md is empty or stub | Run `/new-story` first to fill it |
| Code-agent halts with uncertainty | Surface to human; do not guess on their behalf |
| Gate 1 fails after implementation | Re-invoke code-agent with the failure detail |
| Story is too large (code-agent reports > 8 hours estimated) | STOP. Split via story-writer first |
| Implementation requires a new dependency | Code-agent will ask — confirm and add to package.json |

## Anti-Patterns This Skill Prevents

- Starting implementation before ACs are written
- Touching files outside the planned scope
- Skipping Gate 1 between tasks
- Mixing multiple stories in one branch
- Implementing "Out of Scope" items because they seem useful

---

*Skill version: 2.0.0 | Updated: 2026-05-21 | Changes: ORION v0.2.0 — code-agent ticks ACs, appends EPIC.md Implementation Update entry, one-commit-per-task enforced*
