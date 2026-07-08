---
name: new-feature
version: 1.0.0
description: >
  Create a Feature under an existing Epic. Scaffolds FEATURE.md from template,
  adds the feature row to parent EPIC.md, updates PROJECT_CONTEXT.yaml counter.
triggers:
  - "create feature"
  - "new feature"
  - "add feature"
  - "scaffold feature"
domains:
  - all
---

# Skill: new-feature

## Purpose

Add a Feature (between Epic and Milestone) under an existing Epic. Useful when a PRD identifies a cohesive capability area that groups multiple milestones.

## Input

Required:
- **Epic ID** (parent epic)
- **Feature name** (verb phrase, user-facing language)

Optional:
- **Milestone IDs to attach** (if known)
- **Stories to attach** (if known)

## Protocol

### Step 1 — Validate

Read `PROJECT_CONTEXT.yaml`. Confirm:
- Parent epic exists
- Domain has next Feature # available
- Feature ID does not collide

### Step 2 — Create FEATURE.md

```
{paths.epics}/{phase}/{EPIC-ID}/features/F-{DOMAIN}-{NN}/FEATURE.md
```

Copy from `{paths.templates}/FEATURE.md`. Fill:
- Feature ID, name, domain
- Epic link
- Phase reference
- Summary (What/Why/Who/Success signal)
- Milestone table (placeholders if not yet defined)
- Out of scope

### Step 3 — Update Parent EPIC.md

Add row to Features table:
```
| F-{DOMAIN}-{NN} | {name} | {comma-separated stories} | 🔲 |
```

### Step 4 — Update PROJECT_CONTEXT.yaml

Increment domain's `counters.feature`.

### Step 5 — Print Summary

```
Feature created: F-{DOMAIN}-{NN} — {name}
  Epic: {EPIC-ID}
  Path: {paths.epics}/{phase}/{EPIC-ID}/features/F-{DOMAIN}-{NN}/
  Files: FEATURE.md
  Counters updated: feature → {NN+1}

Next:
  /new-milestone        — add milestones under this feature
  /new-story            — add stories
```

## When to Use Features vs. Skip

Use a Feature level when:
- The epic has 3+ milestones that cluster naturally
- Stakeholders refer to a sub-capability by name ("the campaign builder", "the usage dashboard")
- You want a mid-level view between Epic and Milestone

Skip Features (go Epic → Milestone directly) when:
- The epic has 1–2 milestones
- All milestones address the same single capability
- The epic IS the feature

Note in EPIC.md if Feature level is skipped: `> Features: skipped — epic has 1 cohesive capability.`

---

*Skill version: 1.0.0 | Created: 2026-05-18*
