---
title: Agile Hierarchy — Master Index
type: template
tags: [orion, template]
updated: 2026-05-20
---

# Agile Hierarchy — Master Index

> **Entry point for all planning, story, and delivery work.**
> Full hierarchy: **Phase → Epic → Feature → Milestone → Story → Task → PR**
> Maintained by: `/prd-to-roadmap`, `/new-epic`, `/close-story` skills (auto) + humans (status edits)

| I want to see… | Go to |
|----------------|-------|
| **How AI-SDLC works in this project** | [aine/NORTH_STAR.md](../../aine/NORTH_STAR.md) |
| **Phase progress (executive view)** | [PHASE_TRACKER.md](PHASE_TRACKER.md) |
| **Domain team board (now / next / blocked)** | [TEAM_STATUS.md](TEAM_STATUS.md) |
| **Master roadmap from PRD** | [ROADMAP.md](ROADMAP.md) |
| **Git branch/commit/PR conventions** | [GIT_STRATEGY.md](GIT_STRATEGY.md) |
| **Project-wide context for AI** | [../../PROJECT_CONTEXT.yaml](../../PROJECT_CONTEXT.yaml) |
| **All skills + agents reference** | [aine/docs/INDEX.md](../../aine/docs/INDEX.md) |

---

## How It Fits Together

```
EPIC         = large business outcome (3–8 weeks)
  FEATURE    = cohesive capability area (1–2 weeks) — optional layer
    MILESTONE = shippable sub-goal (1 week)
      STORY    = one user-facing capability (1 AI session / 2–4 h)
        TASK   = one implementation step (≤ 5 files)
          PR   = one merged branch — named by Story
```

Every PR is traceable from `git log` → Story → Milestone → Epic → Phase.

---

## Active Epics — Phase 0

| Epic ID | Title | Status | Stories | Pending |
|---------|-------|--------|---------|---------|
| [EPIC-{D}-{NN}](epics/phase-0-{slug}/EPIC-{D}-{NN}/EPIC.md) | {title} | 🔲 | 0 / 0 | — |

## Active Epics — Phase 1

| Epic ID | Title | Status | Stories | Pending |
|---------|-------|--------|---------|---------|
| {empty until /prd-to-roadmap populates} | | | | |

---

## Naming Conventions

| Level | Format | Example | Source |
|-------|--------|---------|--------|
| Epic | `EPIC-{DOMAIN}-{NN}` | `EPIC-AUTH-01` | This index |
| Feature | `F-{DOMAIN}-{NN}` | `F-AUTH-01` | EPIC.md |
| Milestone | `M-{DOMAIN}-{NN}-{slug}` | `M-AUTH-01-google-oauth` | EPIC.md |
| Story | `US-{DOMAIN}-{NNN}` | `US-AUTH-001` | This index |
| Task | `T{N}` (local to TASKS.md) | `T1`, `T2` | TASKS.md |
| PR branch | `feat/{domain}-{story-slug}` | `feat/auth-us-auth-001-google` | GIT_STRATEGY.md |
| Linear issue | `[{US-ID}] {short title}` | `[US-AUTH-001] Google OAuth login` | Linear |

Domain prefixes are defined in [PROJECT_CONTEXT.yaml](../../PROJECT_CONTEXT.yaml).

---

## Folder Layout

```
docs/agile/
  AGILE_INDEX.md            ← you are here
  PHASE_TRACKER.md          ← executive phase progress
  TEAM_STATUS.md            ← per-domain board (now / next / blocked)
  ROADMAP.md                ← master roadmap from PRD
  GIT_STRATEGY.md           ← branch / commit / PR conventions
  PRD/                      ← saved PRDs that fed into roadmaps
  templates/                ← (linked from aine/templates/ via install)
  epics/
    phase-0-{slug}/
      {EPIC-ID}/
        EPIC.md
        ARCHITECTURE.mmd
        ENV.yaml
        features/
          {F-ID}/FEATURE.md
        milestones/
          {M-ID}.md
        stories/
          {US-ID}/
            STORY.md
            TASKS.md
            ISSUES.md     (optional, created on demand)
    phase-1-{slug}/
    ...
```

---

## Start a New Story (Quick-Start)

```bash
# From any Claude Code session:
/new-story

# Or for one-off creation:
cp aine/templates/STORY.md docs/agile/epics/{phase}/{EPIC-ID}/stories/{US-ID}/STORY.md
cp aine/templates/TASKS.md docs/agile/epics/{phase}/{EPIC-ID}/stories/{US-ID}/TASKS.md
# Then edit + run /new-story to populate
```

Full pipeline: see [aine/NORTH_STAR.md](../../aine/NORTH_STAR.md#the-7-stage-ai-sdlc).

---

## Definition of Done (any story)

- [ ] All ACs in STORY.md checked ✅
- [ ] All tasks in TASKS.md checked ✅
- [ ] Verification gates pass (per PROJECT_CONTEXT.yaml)
- [ ] Manual flow verified
- [ ] PR merged
- [ ] STORY.md status → ✅ Done
- [ ] This index epic row updated

---

*Maintained by AI-SDLC skills + humans | Schema version: 1.0*
