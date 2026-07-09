---
title: How to Use the Agile System
type: template
tags: [orion, template, how-to-use]
updated: 2026-05-21
---

# How to Use the Agile System

> **Audience:** Everyone who interacts with `docs/agile/` — engineers, designers, QA, PM, AI agents.
> **Purpose:** Explain the day-to-day workflow so anyone can pick up a story and ship it without
> reverse-engineering the structure.

---

## The Mental Model

```
PRD
 └─ Phase (release milestone — business outcome)
    └─ Epic (capability — 3–8 weeks)
       └─ Feature (one area users would name — 1–2 weeks)
          └─ Milestone (demo-able increment — ~1 week)
             └─ Story (one AI session — 2–4 hours)
                ├─ STORY.md           ← the contract
                ├─ TASKS.md           ← the file-level plan
                ├─ PR_BODY.md         ← drafted PR description
                ├─ COMMIT_TEMPLATE.md ← per-task commit format
                └─ scaffold.json      ← which rules apply
```

**Everything below `Story` is what an engineer (or code-agent) actually opens.**
The layers above are navigational only — you should never edit code at the epic level.

---

## Daily Workflow

### 1. Pick up a story

Open `docs/agile/TEAM_STATUS.md`. Find an "🔲 Ready to Start" row for your domain.
The first story listed in `Next` is the recommended pick — pm-agent ordered it to maximize unblocking.

### 2. Read its contract

In the story folder:

```
docs/agile/epics/{phase}/{EPIC-ID}/stories/{US-ID}/
  STORY.md     ← read this first
  TASKS.md     ← then this
  scaffold.json ← which rules apply (auto-loaded by agents)
```

Confirm the **Four Pillars** at the top of TASKS.md are checked:
- **Brain** — ACs written
- **Muscle** — file-level task list
- **Map** — ARCHITECTURE.mmd exists for the parent epic
- **Env** — ENV.yaml present

If any pillar is unchecked, run `/new-story <US-ID>` to fix the contract before coding.

### 3. Implement

```bash
# Either drive the AI:
/implement-story US-{DOMAIN}-{NNN}

# Or write code yourself, following TASKS.md task by task.
```

For each T# in TASKS.md:
1. Edit only the listed file
2. Commit with the listed message
3. Tick the checkbox

### 4. Test

Run the gates from `PROJECT_CONTEXT.yaml.gates`:
- Gate 1 — TypeScript + unit tests (always)
- Gate 2 — Visual checklist (frontend stories)
- Gate 3 — E2E (frontend / token / critical-flow stories)
- Gate 4 — API smoke (backend stories)

If any gate fails, **fix the code, not the test.**

### 5. Open the PR

```bash
/agile-pr US-{DOMAIN}-{NNN}
```

This uses the story's `PR_BODY.md` as the description. The PR title format is
`[US-{DOMAIN}-{NNN}] {short title}`.

### 6. Close

After merge:

```bash
/close-story US-{DOMAIN}-{NNN} {PR-number}
```

This cascades status updates: STORY → TASKS → MILESTONE → EPIC → PHASE_TRACKER → AGILE_INDEX → TEAM_STATUS.

---

## The Files That Matter

| File | What it is | Who edits |
|------|------------|-----------|
| `AGILE_INDEX.md` | Master registry of every epic + story count | Auto by skills |
| `PHASE_TRACKER.md` | Status of every phase + epic + gate | Auto by skills |
| `TEAM_STATUS.md` | Per-domain Now / Next / Blocked / Done board | Auto + human weekly |
| `ROADMAP.md` | High-level view of phases for stakeholders | Auto by `/prd-to-roadmap` |
| `epics/{phase}/README.md` | Phase intro, epic DAG, suggested first story | Auto by `/prd-to-roadmap` |
| `epics/{phase}/{EPIC}/EPIC.md` | Epic-level contract: outcome, stories, files, log | Auto + human edits |
| `epics/{phase}/{EPIC}/stories/{US}/STORY.md` | Story contract | story-writer or human |
| `epics/{phase}/{EPIC}/stories/{US}/TASKS.md` | File-level task list | story-writer or human |
| `epics/{phase}/{EPIC}/stories/{US}/PR_BODY.md` | Pre-drafted PR body | story-writer or `/agile-pr` |

---

## Skills Cheat-Sheet

| Skill | Use when |
|-------|----------|
| `/prd-to-roadmap` | You have a PRD; need the whole hierarchy scaffolded |
| `/new-epic` | You need to add one epic to an existing roadmap |
| `/design-epic` | An epic exists but ARCHITECTURE.mmd / ENV.yaml are stubs |
| `/new-story` | You need a full STORY.md + TASKS.md from a stub |
| `/implement-story` | STORY.md is ready; you want code-agent to build it |
| `/test-story` | Implementation done; need unit + E2E tests |
| `/agile-pr` | Tests pass; ready to open the PR |
| `/close-story` | PR merged; cascade status |
| `/standup` | Want a daily digest of where every story is |
| `/plan-tomorrow` | Want pm-agent to pick tomorrow's stories |

---

## Conventions in One Place

- **IDs:** `EPIC-{DOMAIN}-{NN}`, `F-{DOMAIN}-{NN}`, `M-{DOMAIN}-{NN}-{slug}`, `US-{DOMAIN}-{NNN}`, `TC-{DOMAIN-SHORT}-{NN}-{NN}`
- **Status emojis:** 🔲 Not Started · 🟡 In Progress · ✅ Done · ⏸ Blocked · ⚠️ Pass-with-finding · ❌ Fail
- **Status flow:** 🔲 → 🟡 → ✅ (or ⏸ when blocked)
- **Commit format:** see [GIT_STRATEGY.md](./GIT_STRATEGY.md)
- **PR workflow:** see [guides/STORY_PR_WORKFLOW.md](./guides/STORY_PR_WORKFLOW.md)

---

## Anti-Patterns

| ❌ Don't | ✅ Do instead |
|---------|--------------|
| Edit `EPIC.md` to track day-to-day progress | Use TEAM_STATUS.md; let `/close-story` cascade |
| Implement before STORY.md ACs are written | Run `/new-story` first |
| Touch files outside `TASKS.md "Primary files touched"` | Open a new story for the extra scope |
| Weaken or skip a failing test | Fix the code or document an exception |
| Bundle multiple stories in one PR | One PR = one story |
| Edit status emojis in multiple places by hand | Trust `/close-story` cascade |

---

*Maintained by ORION. Updated when the workflow changes — not when individual stories change.*
