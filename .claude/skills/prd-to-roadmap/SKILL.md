---
name: prd-to-roadmap
version: 1.0.0
description: >
  Take a PRD and generate a complete execution roadmap: Phases → Epics → Features →
  Milestones → Stories → TASKS stubs. Creates all folder/file structure from templates,
  updates AGILE_INDEX.md, PHASE_TRACKER.md, and ROADMAP.md.
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
  - pm-agent        # Phase/Epic/Feature/Milestone decomposition
  - architect-agent # ARCHITECTURE.mmd + technical notes per epic
  - story-writer    # Story cards with AC + test cases
  - qa-agent        # Test plan per story (optional, invoke on request)
---

# Skill: prd-to-roadmap

## Purpose

Convert a Product Requirements Document into a fully-structured, execution-ready agile
roadmap. Output is not a planning artifact — it is the actual folder/file hierarchy Claude
Code uses to implement each story.

One `/prd-to-roadmap` run produces:
- A `ROADMAP.md` master view
- Epic folders with `EPIC.md` + `ARCHITECTURE.mmd` stubs
- Feature files (`FEATURE.md`) grouping related milestones
- Milestone files (`M-*.md`)
- Story stubs (`STORY.md` + `TASKS.md`) ready for AI implementation sessions
- Updated `AGILE_INDEX.md` and `PHASE_TRACKER.md`

---

## Input Formats

Accept the PRD in any of these forms:

| Format | How Claude handles it |
|--------|-----------------------|
| **Pasted text** | User pastes PRD content directly in chat |
| **File path** | Read from `docs/agile/PRD/{name}.md` using Read tool |
| **Partial PRD** | If the PRD covers only one domain/phase, scope accordingly |
| **Incremental** | If `ROADMAP.md` exists, append new phases/epics without disturbing existing ones |

**PRD Minimum Viable Content** (validate before proceeding):
- [ ] Product goal / business outcome stated
- [ ] At least one user persona identified
- [ ] Feature list (even if rough)
- [ ] Success metrics or acceptance signals

If any item is missing, ask the user to fill it before proceeding.

---

## Analysis Protocol (Follow in Order)

### Step 0 — Load Context

Read these files before analyzing:
1. `docs/agile/PROJECT_CONTEXT.md` — domain prefixes, ID counters, naming rules
2. `docs/agile/AGILE_INDEX.md` — existing epic registry (to avoid ID conflicts)
3. `docs/agile/PHASE_TRACKER.md` — existing phases (to know where to append)

### Step 1 — Phase Analysis

Identify **business phases** from the PRD. Each phase = a release milestone with a business outcome.

**Rules:**
- A phase must have a clear business outcome ("users can do X end-to-end")
- Map to existing phase folders when the PRD extends an existing phase
- New phases get the next sequential phase number
- Name format: `phase-{N}-{slug}` (e.g., `phase-1-ai-core`)
- Parallel phases (running alongside another phase) suffix with `.5` (e.g., `phase-0.5-foundation`)

**Output:** Ordered list of phases with business outcomes.

### Step 2 — Epic Analysis (invoke pm-agent for complex PRDs)

For each phase, identify **1–4 Epics**. An Epic = one major business capability.

**Rules:**
- Epic scope: 3–8 weeks of work, one cohesive business outcome
- Domain assignment: match to a domain prefix from `PROJECT_CONTEXT.md`. Create new domain if no match
- ID assignment: check AGILE_INDEX.md for last-used ID per domain; increment by 1
- If a PRD section maps to an existing open epic, extend it rather than creating a new one
- Maximum 4 epics per phase (if more, question whether phases are granular enough)

**Output per epic:**
```
EPIC-{DOMAIN}-{NN}: {title}
  Phase: {phase-folder}
  Goal: {one sentence outcome}
  Estimated effort: {N}–{M} weeks
  Domain: {DOMAIN}
```

### Step 3 — Feature Analysis

For each Epic, identify **1–4 Features**. A Feature = one cohesive capability area.

**Rules:**
- Feature scope: 1–2 weeks, one area a user would describe as "the X feature"
- Features group related milestones; if an epic has only 1–2 milestones, Feature = Epic (skip feature file, note it)
- ID: `F-{DOMAIN}-{NN}` using next available Feature # for that domain (from PROJECT_CONTEXT.md)
- Name: verb phrase describing user capability ("Intent Detection", "Photo Style Selection", "Campaign Builder")

**Output per feature:**
```
F-{DOMAIN}-{NN}: {Feature Name}
  Epic: EPIC-{DOMAIN}-{NN}
  Milestones: {count}
  Stories: {count}
  Estimated effort: {N}h
```

### Step 4 — Milestone Analysis

For each Feature, identify **1–3 Milestones**. A Milestone = one shippable/demonstrable increment.

**Rules:**
- Milestone scope: ~1 week, something the team can demo to stakeholders
- Milestone numbers are **globally sequential** (across all domains) — check PHASE_TRACKER.md for last-used number
- ID: `M-{DOMAIN}-{NN}-{slug}` (slug: 2–4 words, kebab-case, describes what ships)
- Each milestone must have a clear "done when" statement

**Output per milestone:**
```
M-{DOMAIN}-{NN}-{slug}: {title}
  Feature: F-{DOMAIN}-{NN}
  Done when: {specific demonstrable outcome}
  Stories: {count}
  Estimated effort: {N}h
```

### Step 5 — Story Analysis (invoke story-writer for detailed story cards)

For each Milestone, identify **2–5 Stories**. A Story = one user-facing capability.

**Rules:**
- Story scope: 1 AI session (2–4 hours), one thing a user can do
- **INVEST criteria:** Independent, Negotiable, Valuable, Estimable, Small, Testable
- Stories > L size (4–8h) must be split before being written
- ID: `US-{DOMAIN}-{NNN}` using next sequential 3-digit number for the domain
- Story numbers increment **globally per domain** — never reset between epics
- Order stories by dependency: prerequisite stories get lower numbers

**Output per story (stub level — full detail comes from story-writer agent):**
```
US-{DOMAIN}-{NNN}: {title}
  Milestone: M-{DOMAIN}-{NN}-{slug}
  As a {persona}, I want {capability} so that {outcome}
  Size: XS / S / M / L
  Primary files: {list 1–5 files}
```

### Step 6 — Create File Structure

Create all folders and files in this exact structure:

```
docs/agile/epics/{phase-folder}/{EPIC-ID}/
  EPIC.md                              ← from templates/EPIC.md
  ARCHITECTURE.mmd                     ← Mermaid stub (see below)
  ENV.yaml                             ← env var stub (see below)
  features/
    {F-ID}/
      FEATURE.md                       ← from templates/FEATURE.md
  milestones/
    {M-ID}.md                          ← from templates/MILESTONE.md
  stories/
    {US-ID}/
      STORY.md                         ← from templates/STORY.md
      TASKS.md                         ← from templates/TASKS.md
```

**ARCHITECTURE.mmd stub:**
```
flowchart LR
  subgraph Inputs["User / External"]
    A["{main trigger or input}"]
  end
  subgraph Domain["{Epic domain}: {Epic title}"]
    B["{key file 1}"]
    C["{key file 2}"]
  end
  A --> B --> C
  classDef good fill:#0b3b2e,stroke:#14532d,color:#ecfdf5;
  classDef bad  fill:#3b0b0b,stroke:#7f1d1d,color:#fef2f2;
```

**ENV.yaml stub:**
```yaml
# Environment variables required by this Epic
# Fill in values before starting implementation sessions
epic: {EPIC-ID}
required:
  - name: {ENV_VAR_NAME}
    description: "{what it's for}"
    example: "{example value}"
    set_in: ".env (local) | Railway (production)"
```

**Template population rules:**
- Replace all `{PLACEHOLDER}` tokens with real values
- Status starts at `🔲 Not Started`
- Target dates: leave as `YYYY-MM-DD` if unknown; fill if the PRD specifies
- Story size: use sizing guide from PROJECT_CONTEXT.md
- "Primary files touched": use your knowledge of the InfographicAI stack to identify likely files — mark uncertain ones with `(TBC)`
- "AI Implementation Prompt": write a concise 3–4 sentence implementation brief; the story writer agent will expand it

### Step 7 — Update Trackers

After all files are created:

**Update `docs/agile/AGILE_INDEX.md`:**
- Add each new epic to the relevant phase table
- Use the correct status icon `🔲 Not Started`
- Include story count and effort estimate

**Update `docs/agile/PHASE_TRACKER.md`:**
- Add new phases if created
- Add new epics to the "Planned Epics" table for the relevant phase
- Update "Phase Overview" at-a-glance table if new phases added

**Update `docs/agile/PROJECT_CONTEXT.md`:**
- Increment all "Next #" counters for affected domains

**Create or update `docs/agile/ROADMAP.md`:**
See ROADMAP.md output format below.

### Step 8 — Print Summary

After all files are created and trackers updated, print:

```
/prd-to-roadmap Complete
─────────────────────────────────────────────────────
Phases:     {N} ({list phase IDs})
Epics:      {N} ({list EPIC-IDs})
Features:   {N} ({list F-IDs})
Milestones: {N} ({list M-IDs})
Stories:    {N} ({list US-IDs range per domain})
─────────────────────────────────────────────────────
Total estimated effort: {N}–{M} hours
─────────────────────────────────────────────────────
Files created: {N}
Trackers updated: AGILE_INDEX.md · PHASE_TRACKER.md · PROJECT_CONTEXT.md · ROADMAP.md
─────────────────────────────────────────────────────
Next: Run /new-epic {EPIC-ID} to deep-fill the first epic,
      or /new-story {US-ID} to write the first story card.
```

---

## ROADMAP.md Output Format

Generate or update `docs/agile/ROADMAP.md` with:

```markdown
# InfographicAI — Master Execution Roadmap

> Generated: {date} | PRD source: {file or "pasted"}
> Last updated: {date}

## Quick View

| Phase | Release | Epics | Features | Stories | Est. Effort | Status |
|-------|---------|:-----:|:--------:|:-------:|:-----------:|--------|
| Phase 0 | v1.0 | 7 | 12 | 32 | ~200h | 🟡 99% |
| …new phases… |

## Dependency Flow

> Phases that must complete before next can start are connected with →

Phase 0 → Phase 0.5 (parallel) → Phase 1 → Phase 2 → Phase 3

## Phase {N} — {Name} (v{X.Y})

**Outcome:** {business outcome}
**Gate criteria:** {what must be true before this phase is done}

| Epic | Domain | Title | Features | Stories | Effort | Status |
|------|--------|-------|:--------:|:-------:|:------:|--------|
| EPIC-{}-{} | {DOMAIN} | {title} | {N} | {N} | {N}h | 🔲 |
```

---

## Decision Rules (Edge Cases)

| Situation | Rule |
|-----------|------|
| PRD covers multiple domains | Create separate epics per domain, even if the feature feels unified |
| PRD is vague about scope | Create epics and features but mark stories as `⚠️ TBD — needs AC before implementing` |
| Epic already exists for this capability | Extend the existing epic with new milestones; do NOT create a duplicate epic |
| A story is clearly XL size | Split it into 2 stories before writing STORY.md; note the split reason in both stories |
| PRD mentions a new domain | Add the domain to PROJECT_CONTEXT.md with prefix and starting counters |
| PRD conflicts with existing roadmap | Flag the conflict explicitly, do not silently overwrite |
| Phase already exists in PHASE_TRACKER.md | Append new epics to the existing phase; do not create a duplicate phase section |

---

## Agent Invocation Guide

Use these agents from within the roadmap generation session:

| Agent | When to invoke | What you get |
|-------|---------------|-------------|
| `pm-agent` | PRD is complex (> 5 epics) or you need a second opinion on phasing | Phase/Epic/Feature breakdown with reasoning |
| `architect-agent` | Before writing ARCHITECTURE.mmd for any epic | Mermaid diagram + technical risk notes |
| `story-writer` | After milestones are defined and you want detailed STORY.md cards | STORY.md with ACs, test cases, implementation prompt |
| `qa-agent` | After stories are written, to generate test plans | Test cases + Playwright E2E stubs |

---

## Related Skills

- `/new-epic` — Deep-fill one epic after roadmap skeleton is created
- `/new-story` — Write a detailed story card for one story
- `/standup` — Scan all TASKS.md and generate daily standup
- `/close-story` — Mark a story done and cascade updates to trackers
- `/agile-pr` — Create a GitHub PR from the current story context

---

*Skill version: 1.0.0 | Created: 2026-05-18*
