---
name: new-story
version: 1.0.0
description: >
  Create a fully-populated STORY.md and stub TASKS.md for one user story.
  Invokes story-writer agent for detailed AC writing. Updates parent milestone
  and epic story tables. Updates PROJECT_CONTEXT.md story counter.
triggers:
  - "create story"
  - "new story"
  - "add story"
  - "write story card"
  - "scaffold story"
  - "write story for"
domains:
  - all
agents:
  - story-writer  # For detailed AC writing and test cases
  - qa-agent      # For test case generation (optional)
---

# Skill: new-story

## Purpose

Create one complete, implementation-ready story card. After this skill runs, an AI
coding agent should be able to open the STORY.md + TASKS.md and implement the story
in a single session without asking for context.

---

## Input

Required (ask if not provided):
- **Story context:** Title + persona + capability ("As a solo agent, I want to select portrait orientation before generating, so that the image fits my listing post template")
- **Epic ID:** Which epic this belongs to (e.g., `EPIC-AI-01`)
- **Milestone:** Which milestone this closes (e.g., `M-AI-05-suggestion-chips`)
- **Feature ID:** Which feature group (e.g., `F-AI-12`) — skip if feature level not used for this epic

Optional but strongly recommended:
- **Size estimate:** XS / S / M / L (default M if not provided)
- **Primary files:** List of 1–5 files likely to be touched

---

## Protocol

### Step 1 — Validate IDs

1. Read `docs/agile/PROJECT_CONTEXT.md` — get Next Story # for the domain
2. Read the parent `EPIC.md` — confirm epic exists and milestone is listed
3. Assign Story ID: `US-{DOMAIN}-{NNN}` (3-digit, zero-padded)

### Step 2 — Write STORY.md (invoke story-writer)

Use the story-writer agent to produce a full STORY.md from the stub. The agent returns:
- Story statement (As a / I want / So that)
- 3–5 acceptance criteria
- Out-of-scope list (minimum 2 items)
- AI Implementation Prompt block
- Test cases table (minimum 2 P0 + 2 P1)

If not invoking the agent, follow the template in `docs/agile/templates/STORY.md` and fill all sections manually.

**Non-negotiable STORY.md rules:**
- Every AC must be binary pass/fail
- Every AC must reference something specific (UI element, API endpoint, DB field, Socket event)
- "Out of scope" must list at least 2 things that seem related but are NOT in this story
- "Primary files touched" must list real file paths (mark uncertain ones `(TBC)`)
- "AI Implementation Prompt" must be a self-contained paste-and-go brief

### Step 3 — Create TASKS.md Stub

Create `TASKS.md` in the same directory as STORY.md with:
- Story + branch + PR fields filled
- Three Pillars Pre-flight checklist (leave all as `[ ]` — filled during implementation)
- PR scope one-liner
- Task breakdown: T1, T2, T3 matching the primary files from STORY.md
- File-to-Task mapping table
- Exact test commands (fill from the standard commands)
- Anti-patterns section (fill with 2–3 specific things to avoid for this story)

**TASKS.md is a stub at creation time.** The developer fills in exact line-level changes during the implementation session. Do NOT pre-fill "Changes" subsections — they depend on runtime inspection.

### Step 4 — Update Parent Files

**Update parent MILESTONE.md** — add story to Stories table:
```
| [US-{DOMAIN}-{NNN}](../stories/US-{DOMAIN}-{NNN}/STORY.md) | {title} | 🔲 | — |
```

**Update parent EPIC.md** — add story to Stories table:
```
| [US-{DOMAIN}-{NNN}](stories/US-{DOMAIN}-{NNN}/STORY.md) | {title} | M-{DOMAIN}-{NN} | 🔲 | — |
```

**Update parent FEATURE.md** (if feature level used) — add story to Stories table.

### Step 5 — Update PROJECT_CONTEXT.md

Increment the "Next Story #" for the relevant domain.

### Step 6 — Print Summary

```
Story created: {US-ID} — {title}
  Path: docs/agile/epics/{phase}/{EPIC-ID}/stories/{US-ID}/
  Files: STORY.md · TASKS.md
  Size: {size}
  Milestone: {M-ID}
  Parent epic: updated · Parent milestone: updated
  PROJECT_CONTEXT.md: Next Story # → {NNN+1}

Implementation checklist:
  [ ] Three Pillars Pre-flight in TASKS.md
  [ ] git checkout -b feat/{domain}-us-{domain}-{nnn}-{slug}
  [ ] Paste AI Implementation Prompt into Claude Code
  [ ] Run verification-gates before PR
```

---

## Splitting Large Stories

If the story is **L size (4–8h) or XL (> 8h)**, split it first:

**Split rule:** Divide along the layer boundary or the AC boundary:
- Frontend vs backend = two stories
- Happy path vs error path = two stories (if error handling is genuinely complex)
- Read vs write = two stories (e.g., "display usage chart" vs "export usage CSV")

Do NOT split by component or endpoint if a user would experience them as one thing.

**After split:** Create two STORY.md files, each M size, with explicit dependency noted:
```
> **Depends on:** US-{DOMAIN}-{NNN-1} must be merged before this story can start.
```

---

## Story ID Assignment

```
Domain: AI
Current last story: US-AI-030
Next story: US-AI-031

Domain: DESIGN
Current last story: US-DESIGN-011
Next story: US-DESIGN-012
```

Always check `docs/agile/PROJECT_CONTEXT.md` "Next Story #" column for the domain.
If in doubt, grep AGILE_INDEX.md for the highest existing US-{DOMAIN}-{NNN} to confirm.

---

*Skill version: 1.0.0 | Created: 2026-05-18*
