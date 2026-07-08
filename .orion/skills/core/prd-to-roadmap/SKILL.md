---
name: prd-to-roadmap
version: 2.0.0
description: >
  Take a PRD and generate a complete execution roadmap: Phases → Epics → Features →
  Milestones → Stories → TASKS stubs. Creates all folder/file structure from templates,
  populates EPIC.md story tables + DAG, milestone Order/Blocked-By, phase READMEs with
  epic-dep DAG, TEAM_STATUS.md board, HOW_TO_USE.md / GIT_STRATEGY.md / STORY_PR_WORKFLOW.md
  guides. Updates AGILE_INDEX.md, PHASE_TRACKER.md, ROADMAP.md.
triggers:
  - "prd to roadmap"
  - "generate roadmap"
  - "roadmap from prd"
  - "convert prd"
  - "break down this prd"
  - "plan from prd"
  - "create epics from prd"
domains:
  - all
agents:
  - pm-agent
  - architect-agent
  - story-writer
---

# Skill: prd-to-roadmap

## Purpose

Convert a PRD into a fully-structured, execution-ready agile roadmap. The output is the actual folder/file hierarchy used to implement each story — not a planning artifact.

One run produces:
- `ROADMAP.md` master view (path from `PROJECT_CONTEXT.yaml.paths.roadmap`)
- `HOW_TO_USE.md`, `GIT_STRATEGY.md`, `guides/STORY_PR_WORKFLOW.md` (one-time, only if missing)
- Per-phase `README.md` with epic-dependency DAG + gate + suggested first story
- Epic folders with `EPIC.md` (populated Stories table + Mermaid story-dep DAG) + `ARCHITECTURE.mmd` + `ENV.yaml` stubs
- Feature files (`FEATURE.md`) grouping related milestones
- Milestone files (`M-*.md`) with Order + Blocked By columns populated
- Story stubs (`STORY.md` + `TASKS.md` + `PR_BODY.md` + `COMMIT_TEMPLATE.md` + `scaffold.json`)
- Updated `AGILE_INDEX.md`, `PHASE_TRACKER.md`, populated `TEAM_STATUS.md`

---

## Input Formats

| Format | How Claude handles it |
|--------|-----------------------|
| **Pasted text** | User pastes PRD content directly in chat |
| **File path** | Read from `{paths.prd_inbox}/{name}.md` |
| **URL** | Fetch via WebFetch and treat as pasted text |
| **Partial PRD** | If the PRD covers only one domain/phase, scope accordingly |
| **Incremental** | If `ROADMAP.md` exists, append new phases/epics without disturbing existing ones |
| **`--phase=N`** | Process only the phase-N lens section from an annotated PRD (see `annotate-prd`) |

**PRD Minimum Viable Content** (validate before proceeding):
- [ ] Product goal / business outcome stated
- [ ] At least one user persona identified
- [ ] Feature list (even if rough)
- [ ] Success metrics or acceptance signals

If any item is missing, ask the user to fill it before proceeding.

---

## Analysis Protocol

### Step 0 — Load Context  *(enhanced: annotation detection)*

Read these files:
1. `PROJECT_CONTEXT.yaml` at project root — domains, ID counters, phase registry, naming rules, git format, **`ac_coverage`**
2. `{paths.agile_index}` — existing epic registry (to avoid ID conflicts)
3. `{paths.phase_tracker}` — existing phases (to know where to append)
4. `{paths.team_status}` — existing per-domain board (preserve "Done" history when re-populating)

If `PROJECT_CONTEXT.yaml` is missing, STOP and ask the user to set up ORION first.

**[Phase 4 — Annotation detection]**

After reading the PRD content:

```
prdLines    = content.split('\n').length
annotated   = /<!-- orion:phase=\d+/.test(content)
phaseArg    = the value of --phase=N if provided (integer or null)
```

If `prdLines > 1000` AND `annotated === false`:
```
⚠️  This PRD is {prdLines} lines and has no phase annotations.
    Processing a PRD this large in one pass risks shallow story generation
    and context loss on later phases.

    Consider annotating it first:
      orion run annotate-prd --prd={path}

    Then re-run with lens focus:
      orion run prd-to-roadmap --prd={path} --phase=1

    Proceed without annotation? [Y/n]
```

If user proceeds (or PRD < 1000 lines, or already annotated): continue to Step 1.

If `annotated === true` AND `phaseArg` is provided: set `lensMode = true`.
If `annotated === true` AND `phaseArg` is null: set `lensMode = false` (process all phases sequentially, one lens at a time — use a loop).

### Step 1 — Phase Analysis  *(enhanced: lens loading)*

**[Phase 4 — Lens loading when annotated]**

If `lensMode === true` (annotated PRD + `--phase=N` provided):

```
Extract the lens slice — content between the two markers:
  start: /<!-- orion:phase={phaseArg}\b/
  end:   /<!-- orion:phase=\d+/ (the NEXT marker) OR /<!-- orion:prd-end -->/ OR EOF

Set prdContent = the extracted slice only.
All subsequent analysis uses this slice exclusively.
```

Print at top of output:
```
🔭 Lens mode: processing Phase {phaseArg} only
   ({N} lines from {total} total)
```

If `lensMode === false` and `annotated === true` (no `--phase` arg but PRD has markers):

Process each `<!-- orion:phase=N -->` section sequentially, running the full
Steps 2–8 pipeline for each phase, then merging the tracker updates at the end.
Print progress:
```
📖 Annotated PRD detected — processing 3 phases sequentially
   Phase 1 "{name}" ...
   Phase 2 "{name}" ...
   Phase 3 "{name}" ...
```

If `annotated === false` (no markers): use full PRD content. Proceed as pre-Phase-4 behaviour.

---

Identify **business phases** from the PRD content (full or sliced). Each phase = a release milestone with a business outcome.

**Rules:**
- A phase must have a clear business outcome ("users can do X end-to-end")
- Map to existing phase folders when the PRD extends an existing phase
- New phases get the next sequential phase number
- Name format: `phase-{N}-{slug}` (e.g., `phase-1-ai-core`)
- Parallel phases suffix with `.5` (e.g., `phase-0.5-foundation`)

### Step 2 — Epic Analysis (invoke pm-agent for complex PRDs)

For each phase, identify **1–4 Epics**. An Epic = one major business capability.

**Rules:**
- Epic scope: 3–8 weeks of work, one cohesive business outcome
- Domain assignment: match to a domain prefix from PROJECT_CONTEXT.yaml. Create new domain if no match
- ID assignment: check AGILE_INDEX.md for last-used ID per domain; increment by 1
- If a PRD section maps to an existing open epic, extend it rather than creating a duplicate
- Maximum 4 epics per phase
- pm-agent must also surface **epic-level dependencies** (which epic blocks which) — used to render the phase-README DAG

### Step 3 — Feature Analysis

For each Epic, identify **1–4 Features**. A Feature = one cohesive capability area.

**Rules:**
- Feature scope: 1–2 weeks, one area a user would describe as "the X feature"
- ID: `F-{DOMAIN}-{NN}` using next available Feature # for that domain
- Skip the feature level for simple epics with 1–2 milestones (note this in EPIC.md)

### Step 4 — Milestone Analysis

For each Feature, identify **1–3 Milestones**. A Milestone = one shippable/demonstrable increment.

**Rules:**
- Milestone scope: ~1 week, something the team can demo
- Milestone numbers are **globally sequential** (across all domains)
- ID: `M-{DOMAIN}-{NN}-{slug}` (slug: 2–4 words, kebab-case)

### Step 5 — Story Analysis (invoke story-writer for detailed cards)

For each Milestone, identify **2–5 Stories**.

**Rules:**
- Story scope: 1 AI session (2–4 hours), one user-facing capability
- INVEST criteria
- Stories > L size (4–8h) must be split before being written
- ID: `US-{DOMAIN}-{NNN}` using next sequential 3-digit number for the domain
- Order stories by dependency
- pm-agent must surface **per-story `blocked_by`** (which other US-IDs must complete first) — used to render the EPIC.md story-dep DAG and the MILESTONE.md `Blocked By` column

**[Phase 4 — Typed Acceptance Criteria generation]**

After structuring each story (statement, size, blockers), generate **Typed Acceptance Criteria**
from `PROJECT_CONTEXT.yaml.ac_coverage`. The developer never writes or labels ACs manually —
the framework seeds them correctly from the roadmap generation step.

```
domain        = storyId.split('-')[1]             // e.g. "AUTH" from "US-AUTH-031"
requiredTypes = ac_coverage.per_domain[domain]
                ?? ac_coverage.default
                ?? ['happy-path', 'error-path']
```

For each type in `requiredTypes` (in order), generate exactly one AC:

```markdown
- [ ] **AC{N} [{type}]:** <specific, binary, references a real file or API endpoint>
```

**AC writing rules:**
- Every AC is binary pass/fail — observable from the outside
- Reference a specific file, endpoint, or UI component (use `(TBC)` when unknown)
- Use the exact format `**ACN [type]:**` with the colon INSIDE the bold span
- `happy-path` AC always comes first; `error-path` second; remaining types in `requiredTypes` order
- Do NOT write generic ACs like "the feature works correctly" — each AC must be specific

**Example** (domain AUTH, `requiredTypes: ['happy-path', 'error-path', 'security', 'session-expiry']`):

```markdown
- [ ] **AC1 [happy-path]:** When valid credentials are submitted, `src/auth/login.service.ts`
      returns a signed JWT with 1h expiry and a 200 response.
- [ ] **AC2 [error-path]:** When credentials are invalid, `src/auth/login.controller.ts`
      returns HTTP 401 with `{ code: "INVALID_CREDENTIALS" }`.
- [ ] **AC3 [security]:** When the same IP submits 10 failed logins within 60s,
      `src/auth/rate-limiter.ts` blocks further attempts and returns HTTP 429.
- [ ] **AC4 [session-expiry]:** When a JWT older than 1h is sent,
      `src/auth/guards/jwt.guard.ts` returns HTTP 401 with `{ code: "TOKEN_EXPIRED" }`.
```

**Effect on downstream harden:** ACs generated here are already fully typed. When `harden` runs:
- Step 1.5 (auto-type) is **skipped** (all ACs already have type labels)
- Step 2 coverage audit may already be **complete** (no gap-fill needed)
- This makes harden fast: Steps 1 → 2 → 4 → 5 → 6 with no LLM calls required

### Step 6 — Create File Structure

Create all folders and files in this exact structure:

```
{paths.epics}/{phase-folder}/
  README.md                              ← from templates/phase-README.md (NEW in v2)
  {EPIC-ID}/
    EPIC.md                              ← from templates/EPIC.md (populated, not stub)
    ARCHITECTURE.mmd                     ← Mermaid stub
    ENV.yaml                             ← env var stub
    features/
      {F-ID}/
        FEATURE.md                       ← from templates/FEATURE.md
    milestones/
      {M-ID}.md                          ← from templates/MILESTONE.md (Order + Blocked By filled)
    stories/
      {US-ID}/
        STORY.md                         ← from templates/STORY.md
        TASKS.md                         ← from templates/TASKS.md
        PR_BODY.md                       ← from templates/PR_BODY.md (NEW in v2)
        COMMIT_TEMPLATE.md               ← from templates/COMMIT_TEMPLATE.md (NEW in v2)
        scaffold.json                    ← from templates/per-story-scaffold.json
```

Replace all `{PLACEHOLDER}` tokens with real values. Status starts at `🔲 Not Started`.

### Step 6.5 — Populate phase + epic content (NEW in v2)

For each **phase folder**, create `README.md` from `templates/phase-README.md` and populate:
- **Epics in this Phase** table — rows are the epics in the phase, ordered by dep
- **Epic Dependency DAG** — Mermaid `flowchart LR` from pm-agent's epic-dep output
- **Critical path** — longest chain through the DAG
- **Parallel tracks** — groups of epics with no inter-dependency
- **Suggested first story** — the story with no `blocked_by` and the most downstream `blocks` count
- **Phase Gate** — copy gate criteria from PROJECT_CONTEXT.yaml.gates + phase-specific gates

For each **EPIC.md**, populate at generation time (do NOT leave the Stories table empty):
- **Features in this Epic** table — every F-ID from Step 3
- **Milestones** table — every M-ID from Step 4
- **Stories in this Epic** table — every US-ID from Step 5 with Order + Blocked By
- **Story Dependency DAG** — Mermaid `flowchart LR` from `blocked_by` data
- **Files touched (inventory)** — populated from each story's "Primary files touched" if available; otherwise scaffold rows with "Owner Story" filled
- **Pre-Story Analysis** — auto-filled from PRD's "problem statement" / "why" sections; flag for human review if PRD has no problem narrative

For each **MILESTONE.md**, populate the Stories table with:
- `Order` column (1, 2, 2, 3 — ties for parallelizable stories)
- `Blocked By` column (cross-story US-IDs)

### Step 7 — Update Trackers

- **AGILE_INDEX.md:** Add each new epic to the relevant phase table
- **PHASE_TRACKER.md:** Add new phases or epics with deliverables-per-phase + gate detail
- **PROJECT_CONTEXT.yaml:** Increment all `counters` entries for affected domains
- **ROADMAP.md:** Create or update master view

### Step 7.5 — Populate TEAM_STATUS.md (NEW in v2)

Replace the template placeholder with a **populated board**:

For each domain (from PROJECT_CONTEXT.yaml.domains):
- **🟡 In Progress (Now):** stories already started (look at git branches matching `branch_format` + STORY.md status 🟡)
- **🔲 Ready to Start (Next):** stories where `blocked_by` is empty or all-resolved, ordered by pm-agent's recommended pick
- **⏸ Blocked:** stories with open dependencies + the specific blocker
- **✅ Recently Closed (last 7 days):** preserve existing entries; do not overwrite

Also populate the **Quick Scan** table at the top — one row per domain showing the current Active Story.

Compute and surface **cross-domain initiatives** in the dedicated section (rows where a story in domain A explicitly `blocked_by` a story in domain B).

### Step 7.6 — Generate workflow guides (one-time per project) (NEW in v2)

If these files do not exist at `{paths.agile_root}/`:
1. **HOW_TO_USE.md** — copy from `templates/HOW_TO_USE.md` (no token replacement needed)
2. **GIT_STRATEGY.md** — copy from `templates/GIT_STRATEGY.md`, replace `{default_branch}`, `{branch_format}`, `{commit_format}`, `{squash_merge}` from PROJECT_CONTEXT.yaml.git
3. **guides/STORY_PR_WORKFLOW.md** — copy from `templates/guides/STORY_PR_WORKFLOW.md`

If a file already exists, leave it alone (the user may have customized it).

### Step 7.7 — Cross-epic dependency + critical-path analysis (NEW in v2)

After all stories are scaffolded, run two analyses and append findings:

1. **Cross-epic dependencies** — when story X in epic A `blocked_by` story Y in epic B, surface in:
   - TEAM_STATUS.md "Cross-Domain Initiatives" section
   - Each affected phase-README's "Cross-Phase Dependencies" section (if epics are in different phases)
   - Affected EPIC.md "Implementation Update" with an initial dated entry

2. **Critical path per phase** — longest dependency chain through the phase's story DAG. Emit in:
   - phase-README "Critical path:" line
   - TEAM_STATUS.md "Cross-Domain Initiatives" if it spans domains

### Step 8 — Print Summary

```
/prd-to-roadmap Complete
─────────────────────────────────────────────────────
Phases:     {N} ({list phase IDs})
Epics:      {N} ({list EPIC-IDs})
Features:   {N} ({list F-IDs})
Milestones: {N} ({list M-IDs})
Stories:    {N} ({list US-IDs range per domain})
─────────────────────────────────────────────────────
Per-phase READMEs:    {N} created
Cross-epic deps:      {N} surfaced
Critical paths:       {N} computed (one per phase)
Total estimated effort: {N}–{M} hours
Files created: {N}
Workflow guides: {created | already present}
Trackers updated: AGILE_INDEX · PHASE_TRACKER · PROJECT_CONTEXT · ROADMAP · TEAM_STATUS
─────────────────────────────────────────────────────
Next:
  /design-epic {EPIC-ID}    — deep-fill the first epic
  /new-story  {US-ID}        — write the first story card
```

---

## Decision Rules (Edge Cases)

| Situation | Rule |
|-----------|------|
| PRD covers multiple domains | Create separate epics per domain, even if the feature feels unified |
| PRD is vague about scope | Create epics and features but mark stories as `⚠️ TBD — needs AC before implementing` |
| Epic already exists for this capability | Extend the existing epic; do NOT create a duplicate |
| A story is clearly XL size | Split into 2 stories before writing STORY.md |
| PRD mentions a new domain | Add the domain to PROJECT_CONTEXT.yaml with prefix and starting counters |
| PRD conflicts with existing roadmap | Flag the conflict explicitly, do not silently overwrite |
| TEAM_STATUS.md has hand-curated "Recently Closed" entries | Preserve them — only append new ones |
| HOW_TO_USE.md / GIT_STRATEGY.md already exist | Do not overwrite — assume user customization |
| pm-agent cannot determine `blocked_by` | Mark `—` and add a row to phase-README's open-questions list |

---

## Agent Invocation Guide

| Agent | When to invoke |
|-------|---------------|
| `pm-agent` | PRD is complex (> 5 epics), need dependency analysis, or need a second opinion on phasing |
| `architect-agent` | Before writing ARCHITECTURE.mmd for any epic |
| `story-writer` | After milestones are defined and you want detailed STORY.md cards |

---

## Related Skills

- `/new-epic` — Deep-fill one epic after roadmap skeleton
- `/design-epic` — Architect-driven design of one epic
- `/new-story` — Detailed story card for one story
- `/standup` — Daily standup from all TASKS.md files

---

*Skill version: 2.1.0 | Updated: 2026-05-27 | Changes: ORION v0.4.0 — Phase 4: annotation detection (Step 0), lens loading (Step 1), typed AC generation from ac_coverage (Step 5), --phase=N input support*
