---
name: new-adr
version: 1.0.0
description: >
  Create a new Architecture Decision Record (ADR) from templates/DECISION.md.
  Auto-increments ID from PROJECT_CONTEXT.yaml.counters.ADR. Stores at
  docs/agile/decisions/ADR-NNN-{slug}.md. Cross-references STORY/EPIC if provided.
triggers:
  - "new adr"
  - "record decision"
  - "log decision"
  - "create adr"
  - "architecture decision"
domains:
  - all
---

# Skill: new-adr

## Purpose

Capture *why* a technical choice was made — separately from `ARCHITECTURE.mmd` (which captures *what*). Keeps decisions findable when the rationale isn't obvious from the resulting code.

## Input

Required: `title` (kebab-case slug or short phrase)
Optional: `--scope EPIC-ID|domain:PREFIX|repo`, `--story US-XXX-NNN`

## Protocol

### Step 1 — Allocate ID

Read `counters.ADR` from `PROJECT_CONTEXT.yaml` (default 1 if absent). Allocate `NNN` zero-padded 3 digits. Increment and write back.

### Step 2 — Copy + Fill Template

Copy `templates/DECISION.md` to `docs/agile/decisions/ADR-{NNN}-{slug}.md`. Fill frontmatter:
- `{NNN}` → allocated ID
- `{short title}` → human-friendly version of slug
- `Status` → 🟡 Proposed
- `Date` → today (ISO)
- `Scope` → from flag or "repo-wide"

Leave body sections (Context/Decision/Alternatives/Consequences/References) as placeholders for the user to fill.

### Step 3 — Cross-Link

If `--story` provided, append to the story's STORY.md "References" section:
```
- ADR-{NNN} — {title}  (docs/agile/decisions/ADR-{NNN}-{slug}.md)
```

If `--scope` is an EPIC-ID, append same line to EPIC.md.

### Step 4 — Report

```
✅ ADR-{NNN} created: {title}
   File: docs/agile/decisions/ADR-{NNN}-{slug}.md
   Status: 🟡 Proposed — fill Context/Decision/Consequences, then flip to ✅ Accepted.
   {if linked:} Linked from: STORY-{ID} | EPIC-{ID}
```

## When to Invoke

- Choosing one library/framework over another for non-trivial scope
- Schema migration strategy (additive vs. breaking)
- Auth model selection
- External integration choice (which payment provider, which queue)
- Any reversal of a prior decision (then add `Superseded by ADR-{NNN}` to the old one)

## When NOT to Invoke

- Routine code style (lint rules go in config)
- One-file refactors (commit message is enough)
- Decisions already captured in ARCHITECTURE.mmd

## Anti-Patterns

- ADRs longer than one screen — keep it terse; link out for detail
- ADR written *after* the code is merged with no Context — defeats the purpose
- Reusing an ADR ID — never overwrite; supersede

---

*Skill version: 1.0.0 | Created: 2026-05-20*
