---
name: new-milestone
version: 1.0.0
description: >
  Create a Milestone under an existing Epic (and optionally Feature). Scaffolds
  MILESTONE.md from template, adds the milestone row to parent EPIC.md and
  FEATURE.md, updates global milestone counter.
triggers:
  - "create milestone"
  - "new milestone"
  - "add milestone"
  - "scaffold milestone"
domains:
  - all
---

# Skill: new-milestone

## Purpose

Add one Milestone under an existing Epic. A milestone is the smallest demo-able unit — ~1 week, one shippable increment.

## Input

Required:
- **Epic ID**
- **Milestone slug** (2–4 words, kebab-case, describes what ships)
- **Goal** (one sentence — what is shippable)

Optional:
- **Feature ID** (if epic uses feature level)
- **Target date**
- **Stories to attach** (if known)

## Protocol

### Step 1 — Validate

Read `PROJECT_CONTEXT.yaml`. Confirm:
- Parent epic exists
- Get next global milestone # (milestone numbers are sequential across all domains)
- Compose Milestone ID: `M-{DOMAIN}-{NN}-{slug}`

### Step 2 — Create MILESTONE.md

```
{paths.epics}/{phase}/{EPIC-ID}/milestones/M-{DOMAIN}-{NN}-{slug}.md
```

Copy from `{paths.templates}/MILESTONE.md`. Fill:
- Milestone ID, slug, title
- Epic link, Feature link (if applicable)
- Goal (one sentence)
- Target date
- Stories table (placeholders if not yet defined)
- Acceptance criteria checklist

### Step 3 — Update Parent EPIC.md

Add row to Milestones table:
```
| [M-{DOMAIN}-{NN}-{slug}](milestones/M-{DOMAIN}-{NN}-{slug}.md) | {goal} | {date} | 🔲 |
```

### Step 4 — Update Parent FEATURE.md (if applicable)

Same row format.

### Step 5 — Update PROJECT_CONTEXT.yaml

The milestone counter is global. Maintain it as `counters._milestone_global` or just look up the highest existing milestone # across all domains.

### Step 6 — Print Summary

```
Milestone created: M-{DOMAIN}-{NN}-{slug}
  Epic: {EPIC-ID}
  Feature: {F-ID or N/A}
  Goal: {goal}
  Branch: feat/{domain-lower}-m-{domain-lower}-{nn}-{slug}  (shared by all stories in this milestone)
  Path: {paths.epics}/{phase}/{EPIC-ID}/milestones/M-{DOMAIN}-{NN}-{slug}.md

Next:
  /new-story    — add stories under this milestone
  docs/agile/memory/  — save any scoping decisions for this milestone (optional)
```

## Milestone Naming Conventions

| Good | Bad |
|------|-----|
| `M-AUTH-04-google-oauth` | `M-AUTH-04-auth` (too vague) |
| `M-USAGE-12-monthly-chart` | `M-USAGE-12-chart` (which chart?) |
| `M-AI-17-intent-detection` | `M-AI-17-intent` (incomplete noun) |

The slug should let a reader infer the milestone's scope without opening the file.

## When a Milestone Is "Done"

A milestone closes when:
- All stories in it are ✅ Done
- The acceptance criteria checklist is fully checked
- The shippable increment can be demoed end-to-end

Then update milestone status `🟡` → `✅` via `/close-story` cascade.

---

*Skill version: 1.0.0 | Created: 2026-05-18*
