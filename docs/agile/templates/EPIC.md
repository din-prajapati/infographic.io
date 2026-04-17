# EPIC-{DOMAIN}-{NN} — {Short Epic Title}

> **Phase:** Phase {N} — {Phase name}  
> **Status:** 🔲 Not Started | 🟡 In Progress | ✅ Done  
> **Linear Project:** LIN-EPIC-XXX  
> **Target date:** YYYY-MM-DD  
> **Owner:** {name}

---

## Goal

**Outcome:** {One sentence — what changes for the user when this epic is done}

**Why now:** {The business or product reason driving this work}

**Success metric:** {How we know it's done — e.g. "X works end-to-end on staging"}

---

## Milestones

| Milestone | Scope | Target | Status |
|-----------|-------|--------|--------|
| [M-{DOMAIN}-01-{slug}](milestones/M-{DOMAIN}-01-{slug}.md) | {one-liner} | YYYY-MM-DD | 🔲 |
| [M-{DOMAIN}-02-{slug}](milestones/M-{DOMAIN}-02-{slug}.md) | {one-liner} | YYYY-MM-DD | 🔲 |

---

## Stories in this Epic

| Story ID | Title | Milestone | Status | PR |
|----------|-------|-----------|--------|----|
| [US-{DOMAIN}-001](stories/US-{DOMAIN}-001/STORY.md) | {title} | M-{DOMAIN}-01 | 🔲 | — |
| [US-{DOMAIN}-002](stories/US-{DOMAIN}-002/STORY.md) | {title} | M-{DOMAIN}-01 | 🔲 | — |

---

## Features in this Epic

| Feature ID | Scope | Stories |
|------------|-------|---------|
| F-{DOMAIN}-01 | {feature name} | US-{DOMAIN}-001 |
| F-{DOMAIN}-02 | {feature name} | US-{DOMAIN}-002 |

---

## Out of Scope (Epic Level)

- {Thing that explicitly does NOT belong in this epic}
- {Another out-of-scope item}

---

## Definition of Done (Epic)

- [ ] All milestones closed
- [ ] All stories have PR merged and STORY.md status = ✅ Done
- [ ] Verified on staging environment
- [ ] `npm run check` + `npm run test:unit` passing
- [ ] [docs/MVP_LAUNCH_TRACKER.md](../../MVP_LAUNCH_TRACKER.md) or roadmap updated
- [ ] AGILE_INDEX.md epic row updated to ✅ Done

---

## Architecture Notes

> **Gauntlet Pillar 3 — Map:** Every epic must have an `ARCHITECTURE.mmd` Mermaid diagram showing the data flow, system boundaries, and which components this epic touches. AI reads this before starting any session.

See [ARCHITECTURE.mmd](./ARCHITECTURE.mmd) — create this file alongside EPIC.md.

```
# Minimal Mermaid template:
# flowchart LR
#   subgraph Inputs["User / External"]
#     A["input or trigger"]
#   end
#   subgraph Domain["Module / Component Group"]
#     B["key file"]:::good
#     C["problem file"]:::bad
#   end
#   A --> B --> C
#   classDef good fill:#0b3b2e,stroke:#14532d,color:#ecfdf5;
#   classDef bad  fill:#3b0b0b,stroke:#7f1d1d,color:#fef2f2;
```

Key files relevant to this epic:
```
- path/to/key/file.ts
- path/to/another/file.tsx
```

---

*Epic created: YYYY-MM-DD | Last updated: YYYY-MM-DD*
