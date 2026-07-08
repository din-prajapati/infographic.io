---
name: next
version: 1.0.0
description: >
  Show what to implement next in a milestone: reads lock state, file-overlap
  graph, and AC coverage gaps to classify stories into four actionable buckets —
  IMPLEMENT NOW, PARALLEL-ELIGIBLE, NEEDS HARDENING, and BLOCKED.
triggers:
  - "orion next"
  - "what should i implement next"
  - "what's ready"
  - "what's next"
  - "next story"
  - "next implementation"
  - "what can i implement"
domains:
  - all
agents: []
---

# Skill: next  (`orion next`)

## Purpose

Lock-aware milestone scheduling. Reads the current state of every story in a
milestone — lock files, AC coverage gaps, file overlap, and blocked-by
dependencies — and outputs four actionable buckets:

| Bucket | Meaning |
|--------|---------|
| ✅ **IMPLEMENT NOW** | Locked, top-order, no conflicts with in-progress work |
| ⚡ **PARALLEL-ELIGIBLE** | Locked, no file overlap with the IMPLEMENT NOW story |
| 🔧 **NEEDS HARDENING** | Not locked — missing coverage or never hardened |
| ⛔ **BLOCKED** | Explicit upstream dependency not yet ✅ Done |

Stories already `✅ Done` or `🟡 In Progress` are reported in a separate status
summary and excluded from all four buckets.

## Input

Optional:
- **Milestone ID** (e.g., `M-AUTH-01`) — defaults to the active milestone inferred
  from in-progress stories or the lowest incomplete milestone in the current epic

## Data Sources

| Source | What it provides |
|--------|-----------------|
| `PROJECT_CONTEXT.yaml` | `paths.epics`, `ac_coverage.default`, `ac_coverage.per_domain` |
| `MILESTONE.md` | Story list, Order, Blocked By, Status columns |
| `STORY.md` (per story) | Status field, Primary files touched |
| `.orion/state/locks/<id>.json` | Lock state (locked? SHA match?) |
| `STORY.md` AC lines | Coverage gap when not locked (via `parseAcTypes` + `checkCoverage`) |

> **Note on file overlap:** reads the `**Primary files touched:**` list under the
> `## Engineering / PR` section of each story's STORY.md. If absent, falls back
> to `- **File:**` entries in the story's TASKS.md.

## Protocol

### Step 1 — Resolve Target Milestone

**If a Milestone ID was provided:**
- Locate `MILESTONE.md` via glob: `{paths.epics}/**/{milestone-id}*.md`
- Read the milestone and extract the stories table

**If no argument:**
1. Scan `{paths.epics}/**/STORY.md` for status `🟡 In Progress`
2. Use the parent milestone of the first in-progress story found
3. If none in progress, find the lowest-order incomplete milestone:
   - Glob `{paths.epics}/**/MILESTONE.md`; pick the one with the earliest `Order` that
     has at least one story in state `🔲 Not Started`
4. If still unresolved:
   ```
   ⚠️  Could not determine active milestone.
       Either pass a milestone ID: orion run next M-AUTH-01
       Or check that MILESTONE.md files exist in {paths.epics}.
   ```
   Exit 0.

### Step 2 — Parse Milestone Stories Table

Read the `## Stories in this Milestone` table from MILESTONE.md.

Parse each row into:
```
{
  order:    number (from Order column; same order = eligible to run in parallel)
  storyId:  "US-AUTH-031"
  title:    string
  size:     "S" | "M" | "L" | "XL"
  blockedBy: string[] (US-IDs listed in Blocked By column; "—" → empty array)
  status:   "🔲" | "🟡" | "✅"
}
```

Separate stories into two sets:
- `active` — stories with status `🔲 Not Started` (candidates for the buckets)
- `settled` — stories with status `🟡 In Progress` or `✅ Done` (reported separately)

### Step 3 — Load Per-Story State

For each story in `active`, load the following in parallel (no LLM):

#### 3a — Lock State
```
lock = readLock(storyId, hostRoot)          ← from story-lock.js
result = checkLock(storyId, storyMdContent, hostRoot)
locked  = result.locked && result.shaMatch  ← true only when lock exists AND SHA matches
```

If `locked === false` and a lock file does exist (`result.locked === true` but
`result.shaMatch === false`), record this as a stale lock:
```
[stale lock — story edited after harden; re-run harden]
```

#### 3b — Coverage Gap (only when not locked)
If `locked === false`:
1. Read STORY.md, call `parseAcTypes(storyMdContent)` → `parsedAcs`
2. Determine required types:
   ```
   domain   = storyId.split('-')[1]          // "AUTH" from "US-AUTH-031"
   required = ac_coverage.default + (ac_coverage.per_domain[domain] ?? [])
   ```
3. Call `checkCoverage(parsedAcs, required)` → `{ present, missing, complete }`
4. Record `coverage.missing` for the NEEDS HARDENING bucket message

#### 3c — File Set (for overlap detection)
From each story's STORY.md, extract all paths from:
```markdown
**Primary files touched:**
  - `path/to/file.ext`
```
Parse each `` `backtick-wrapped` `` path. Store as a `Set<string>`.

If the section is absent (story created before the Engineering/PR format), fall back
to TASKS.md `- **File:** path/to/file.ext` lines.

#### 3d — Blocked-By Validation
For each storyId listed in `blockedBy[]`:
- Check that story's status in the milestone table
- If status is NOT `✅ Done` → this story is genuinely blocked

### Step 4 — Classify Into Buckets

Process stories in ascending `order` within `active`:

**BLOCKED** — classified first (takes precedence over all other states):
- Story has ≥ 1 entry in `blockedBy[]` AND that upstream story is not `✅ Done`

**NEEDS HARDENING** — classified second:
- Not blocked AND (`locked === false`)
- Includes both "never hardened" and "stale lock" cases

**IMPLEMENT NOW** — one story maximum (the highest-priority unlocked candidate):
- Not blocked AND `locked === true`
- Has the lowest `order` value among locked stories
- Has no file overlap with `🟡 In Progress` stories

**PARALLEL-ELIGIBLE** — zero or more:
- Not blocked AND `locked === true`
- NOT the IMPLEMENT NOW story
- **File set has no intersection with the IMPLEMENT NOW story's file set**
- If same `order` as IMPLEMENT NOW → parallel-eligible by design (milestone author
  indicated they can run together)

> **Tie-breaking for IMPLEMENT NOW:** if multiple locked stories share the lowest
> `order`, pick the one with the smallest size estimate. If still tied, use
> lexicographic order of story ID.

### Step 5 — Build Suggested Next Actions

Produce a priority-ordered list of `orion run` commands:

1. `orion run implement-story {IMPLEMENT-NOW-id}` (if one exists)
2. `orion run implement-story {PARALLEL-id}` `(parallel)` — one per parallel-eligible story
3. `orion run harden {NEEDS-HARDENING-id}` — ordered by severity (most missing types first)

Omit any action that has no applicable story.

### Step 6 — Output

```
📋  orion next — {milestone-id}: {milestone title}

  ✅ IMPLEMENT NOW:
     {story-id}  {title}  [{size}]  [locked ✅, no file conflicts]
       → orion run implement-story {story-id}

  ⚡ PARALLEL-ELIGIBLE (no file overlap with {implement-now-id}):
     {story-id}  {title}  [{size}]  [locked ✅]
       → orion run implement-story {story-id}
     {story-id}  {title}  [{size}]  [locked ✅]
       → orion run implement-story {story-id}

  🔧 NEEDS HARDENING FIRST:
     {story-id}  {title}  [{size}]  [missing: {type1}, {type2}]
       → orion run harden {story-id}
     {story-id}  {title}  [{size}]  [never hardened]
       → orion run harden {story-id}
     {story-id}  {title}  [{size}]  [⚠️  stale lock — story edited after harden]
       → orion run harden {story-id}

  ⛔ BLOCKED (upstream dependency not yet done):
     {story-id}  {title}  [{size}]  [blocked by: {upstream-id}]
       Wait for {upstream-id} to complete.

  ─────────────────────────────────────────────────────────────────
  🟡 IN PROGRESS:   {story-id} ({title}), {story-id} ({title})
  ✅ DONE:          {story-id} ({title}), {story-id} ({title})
  ─────────────────────────────────────────────────────────────────

  📌 SUGGESTED NEXT ACTIONS (in order):
     1. orion run implement-story {implement-now-id}
     2. orion run implement-story {parallel-id}  (parallel)
     3. orion run harden {needs-hardening-id}
```

**Empty-bucket rules:**
- If IMPLEMENT NOW is empty and PARALLEL-ELIGIBLE is empty: print
  `  (No stories are locked and ready — run hardening first)`
- If NEEDS HARDENING is empty: omit the section entirely
- If BLOCKED is empty: omit the section entirely
- If all stories are Done: print `  🎉 All stories in {milestone-id} are done!`

**Stale lock annotation:**
When a story has a lock file but SHA mismatch, show the annotation inline:
```
  🔧 NEEDS HARDENING FIRST:
     US-AUTH-032  OAuth callback  [M]  [⚠️  stale lock — re-run: orion run harden US-AUTH-032]
```

## Example Output

```
📋  orion next — M-AUTH-01: Login & Session Hardening

  ✅ IMPLEMENT NOW:
     US-AUTH-031  User login endpoint    [M]  [locked ✅, no file conflicts]
       → orion run implement-story US-AUTH-031

  ⚡ PARALLEL-ELIGIBLE (no file overlap with US-AUTH-031):
     US-CORE-005  Health check route     [S]  [locked ✅]
       → orion run implement-story US-CORE-005

  🔧 NEEDS HARDENING FIRST:
     US-AUTH-032  OAuth callback handler [M]  [missing: security, session-expiry]
       → orion run harden US-AUTH-032
     US-AUTH-033  Token refresh          [S]  [never hardened]
       → orion run harden US-AUTH-033

  ⛔ BLOCKED (upstream dependency not yet done):
     US-PAYMENTS-011  Stripe webhook     [L]  [blocked by: US-AUTH-031]
       Wait for US-AUTH-031 to complete.

  ─────────────────────────────────────────────────────────────────
  🟡 IN PROGRESS:   (none)
  ✅ DONE:          (none)
  ─────────────────────────────────────────────────────────────────

  📌 SUGGESTED NEXT ACTIONS (in order):
     1. orion run implement-story US-AUTH-031
     2. orion run implement-story US-CORE-005  (parallel)
     3. orion run harden US-AUTH-032
     4. orion run harden US-AUTH-033
```

## Edge Cases

| Situation | Rule |
|-----------|------|
| No milestone argument, no in-progress stories | Scan for lowest incomplete milestone; if multiple, list them and ask user to specify |
| Story in MILESTONE.md but STORY.md file missing | Mark as `[⚠️ STORY.md not found]` in NEEDS HARDENING; suggest `/new-story` |
| Lock file exists, STORY.md missing | Can't verify SHA → treat as stale lock → NEEDS HARDENING |
| All stories in milestone already ✅ Done | Print `🎉 All stories in {milestone-id} are complete!` and exit 0 |
| IMPLEMENT NOW story has file overlap with in-progress work | Demote it to a warning: `[locked ✅ but conflicts with in-progress US-{X} — review before starting]` |
| `ac_coverage` missing from PROJECT_CONTEXT.yaml | Fall back to `[happy-path, error-path]` only; do not error |
| Two locked stories share the same lowest order | Both become IMPLEMENT NOW; note they were designed as parallel by the milestone author |
| TASKS.md "Primary files touched" absent AND STORY.md section absent | Assume empty file set — story has no known overlaps; mark `[file overlap unknown]` |

## Connection to Phase 5 (Fleet)

The IMPLEMENT NOW and PARALLEL-ELIGIBLE lists produced by `orion next` are exactly
the input the Phase 5 fleet reads when dispatching parallel implementation agents:

```bash
orion fleet --milestone=M-AUTH-01 --max=3
```

The fleet calls the same lock-state and file-overlap logic `orion next` already
uses — no extra wiring. `harden` certifies stories; `orion next` schedules them;
the fleet executes them. A story that isn't in IMPLEMENT NOW or PARALLEL-ELIGIBLE
will never be handed to a fleet agent.

---

*Skill version: 1.0.0 | Added: 2026-05-27 | ORION v0.4.0 — Phase 3 redesign*
