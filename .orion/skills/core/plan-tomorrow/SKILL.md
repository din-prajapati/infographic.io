---
name: plan-tomorrow
version: 1.0.0
description: >
  Pick the single highest-value story to start next session, list carry-over
  in-progress work, and write a 5-line block under <!-- ai-sdlc:tomorrow --> in
  TEAM_STATUS.md. Picked up automatically by session-start-recall.sh.
triggers:
  - "plan tomorrow"
  - "plan next session"
  - "north star"
  - "what should i do next"
  - "end of day"
domains:
  - all
---

# Skill: plan-tomorrow

## Purpose

Bridge today's session to tomorrow's. Picks one focus story (the "north star"), so when `session-start-recall.sh` fires next session, the dev sees exactly where to begin.

## Protocol

### Step 1 — Gather State (no file edits yet)

Equivalent to a mini `/standup`:
- Scan `{paths.epics}/**/STORY.md` for status fields
- Bucket: `🟡 In Progress`, `🔲 Ready to Start`, `⏸ Blocked`
- Read latest entries in `<!-- ai-sdlc:session-log -->` of `TEAM_STATUS.md` for momentum context

### Step 2 — Pick the North Star (one story)

Selection priority:
1. **Resume an in-progress story** if `🟡` exists with >0 AC unchecked → carry-over
2. Else **start a `🔲` Ready** with all Four Pillars checked (Brain/Muscle/Map/Env)
3. Else **clear a blocker** — pick a `⏸` story and surface what's blocking it

Pick exactly **one**. If multiple candidates rank equal, prefer the smallest (lowest effort estimate in TASKS.md).

### Step 3 — Write the Plan Block

Upsert this block in `TEAM_STATUS.md`. Replace existing `<!-- ai-sdlc:tomorrow -->` block if present.

```markdown
<!-- ai-sdlc:tomorrow -->
**Plan for {next session date}**

- 🎯 Focus: `US-{ID}` — {story title}
- 📍 State: {Resume from T3 | Fresh start | Unblock dependency on {US-Y}}
- ⏱ Est: {N}h | Gate priorities: {1,2,3}
- 🧱 Carry-over: {comma-separated US-IDs still 🟡, or "none"}
- ⚠ Blocked: {US-IDs in ⏸, or "none"}
<!-- /ai-sdlc:tomorrow -->
```

### Step 4 — Report

```
✅ Plan written. Tomorrow's focus: US-{ID}
   {one-line why this story}
   session-start-recall will surface this next time.
```

### Step 5 — Memory Prompt (if applicable)

If `docs/agile/memory/` exists, check whether today's session produced anything worth keeping
across sessions beyond the plan block:
- A non-obvious architectural decision → suggest `project_{slug}.md`
- A team preference or working rule discovered → suggest `feedback_{slug}.md`
- A link to an external resource (dashboard, Linear project) → suggest `reference_{slug}.md`

```
💡 Anything from today's session worth saving to docs/agile/memory/?
   If yes: create docs/agile/memory/{type}_{slug}.md and add a bullet to MEMORY.md.
   Format: see docs/agile/memory/MEMORY.md.
```

Only surface if the session had notable decisions or discoveries. Skip if purely routine work.

## Constraints

- One focus story, never multiple — forces a real choice.
- Do NOT write a multi-day plan; this is the *next session*, not the week.
- Do NOT invoke any agent — this is pure file analysis + write.

## When NOT to Invoke

- Mid-implementation (use `/standup` instead)
- When no stories are in `🟡` or `🔲` (use `/new-story` first)

---

*Skill version: 1.0.0 | Created: 2026-05-20*
