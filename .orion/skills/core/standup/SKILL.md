---
name: standup
version: 1.0.0
description: >
  Scan all TASKS.md files across the agile epics tree and generate a daily standup report:
  Done (since last commit or date), In Progress, Blocked, Next.
  Also surfaces stories nearing DoD and milestones close to closing.
triggers:
  - "standup"
  - "daily standup"
  - "what did we do"
  - "what's next"
  - "team status update"
  - "morning check"
domains:
  - all
---

# Skill: standup

## Purpose

Generate a structured daily standup from the actual state of TASKS.md and STORY.md files. No manual updates required.

## Protocol

### Step 1 — Read Context

Load `PROJECT_CONTEXT.yaml` to get `paths.epics`.

### Step 2 — Scan All Story Files

Glob: `{paths.epics}/**/{STORY,TASKS}.md` and `{paths.epics}/**/scaffold.json`

For each story directory:
- STORY.md → status, ACs checked count, Closed date
- TASKS.md → task checklist (checked vs unchecked)
- scaffold.json → `touches.layers` (display as compact tag list in the In-Progress table)

### Step 3 — Classify Stories

| Status | Criteria |
|--------|----------|
| **Done (recently)** | STORY.md status = ✅ Done AND Closed ≥ 3 days ago |
| **In Progress** | STORY.md = 🟡 OR any TASKS.md task checked |
| **Ready to Start** | STORY.md = 🔲 AND Three Pillars Pre-flight all checked |
| **Blocked** | TASKS.md has ⏸ task OR STORY.md has open ISSUES.md |
| **Near DoD** | ≥ 80% of ACs checked |
| **Milestone Closing** | All stories in milestone are ✅ or 🟡 |

### Step 4 — Check Git Log (optional)

```bash
git log --oneline --since="1 day ago" --pretty=format:"%h %s"
```

Parse for `US-{DOMAIN}-{NNN}` references to confirm shipped work.

### Step 5 — Generate Report

```markdown
# Daily Standup — {YYYY-MM-DD}

## Done (Last Session)
| Story | Title | Milestone | Notes |
|-------|-------|-----------|-------|

## In Progress
| Story | Title | Epic | Layers | Progress | Blocker? |
|-------|-------|------|--------|----------|----------|

## Blocked
| Story | Title | Blocker | Owner |
|-------|-------|---------|-------|

## Ready to Start Next
| Story | Title | Epic | Milestone | Size |
|-------|-------|------|-----------|------|

## Near DoD (≥ 80% ACs Checked)
| Story | ACs Done | Missing | Action |
|-------|----------|---------|--------|

## Milestone Pulse
| Milestone | Status | Stories Done | Left | On Track? |
|-----------|--------|:------------:|:----:|-----------|
```

### Step 6 — Flag Anomalies

```
⚠️ ANOMALIES
- {US-ID} "In Progress" > 5 days with no new commits
- Milestone {M-ID} has 0 stories started but target date < 7 days
- {US-ID} TASKS.md empty but status = In Progress
- {US-ID} STORY.md has no ACs written
```

### Step 7 — Memory Prompt (if applicable)

If `docs/agile/memory/` exists, check whether any standup finding is worth persisting:
- Recurring blockers (same story blocked 2+ standups) → suggest saving as a `project_` memory
- Patterns across stories (e.g., "E2E tests consistently flaky on this milestone") → suggest `feedback_` memory
- Team decisions surfaced during review → suggest `project_` or `feedback_` memory

Format the suggestion as a one-liner the user can copy-paste:

```
💡 Worth saving to docs/agile/memory/?
   Create docs/agile/memory/project_{slug}.md — "{one-line hook}"
   (see docs/agile/memory/MEMORY.md for format)
```

Only surface this if there is a genuinely non-obvious finding. Do not prompt on every standup.

## Quick Format

If user asks for short version:
```
DONE:    {1-liner per closed}
TODAY:   {1-liner per in-progress}
BLOCKED: {1-liner per blocker}
NEXT:    {top 2 ready to start}
```

---

*Skill version: 1.0.0 | Created: 2026-05-18*
