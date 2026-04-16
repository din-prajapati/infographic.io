# Agile Hierarchy — Master Index

> **Entry point for all planning, story, and delivery work.**  
> Full hierarchy: **Phase → Epic → Milestone → Story → Task → PR**  
> Toolchain: GitHub (code + PR) · Linear (issue tracker) · Claude Code (AI implementation)

| I want to see… | Go to |
|----------------|-------|
| **How to use this whole system** | [HOW_TO_USE.md](HOW_TO_USE.md) ← start here |
| **Phase progress (executive view)** | [PHASE_TRACKER.md](PHASE_TRACKER.md) |
| **Domain team board (what's now / next / blocked)** | [TEAM_STATUS.md](TEAM_STATUS.md) |
| **Active story to implement next** | [TEAM_STATUS.md → Design → Ready to Start](TEAM_STATUS.md) |
| **Git branch/commit/PR conventions** | [GIT_STRATEGY.md](GIT_STRATEGY.md) |
| **Open a story PR (`gh`, `PR_BODY.md`, templates)** | [guides/STORY_PR_WORKFLOW.md](guides/STORY_PR_WORKFLOW.md) |
| **AI agile cycle: Story → PR (diagram + checklist)** | [guides/STORY_PR_WORKFLOW.md §0](guides/STORY_PR_WORKFLOW.md#0-in-the-ai-assisted-agile-cycle) |
| **Linear + GitHub integration setup** | [LINEAR_GITHUB.md](LINEAR_GITHUB.md) |

---

## How It Fits Together

```
EPIC         = large business outcome (3–8 weeks)
  MILESTONE  = shippable sub-goal within the epic (1–2 weeks)
    STORY    = one user-facing capability (1 AI session / 2–4 h)
      TASK   = one implementation step, mapped to files (≤ 5 files)
        PR   = one merged branch — named by Story or Task
```

Every PR is traceable from `git log` → Story → Milestone → Epic.

---

## Active Epics

| Epic ID | Title | Status | Milestones |
|---------|-------|--------|------------|
| [EPIC-DESIGN-01](epics/EPIC-DESIGN-01/EPIC.md) | MVP UI Design Consistency & Theme | 🟡 In Progress | M1 QA ✅ · M2 🟡 US-002 merged ([PR #1](https://github.com/din-prajapati/infographic.io/pull/1)); US-003 + gates — [M-DESIGN-02](epics/EPIC-DESIGN-01/milestones/M-DESIGN-02-editor-tokens.md) |
| [EPIC-PAY-01](epics/EPIC-PAY-01/EPIC.md) | MVP Payments Live | ✅ Done | All milestones closed |

> Add new epics to this table when you start them.

---

## Folder Layout

```
docs/agile/
  AGILE_INDEX.md            ← you are here
  GIT_STRATEGY.md           ← branch / commit / PR / label conventions
  LINEAR_GITHUB.md          ← Linear + GitHub integration setup
  templates/
    EPIC.md                 ← copy → epics/{EPIC-ID}/EPIC.md
    MILESTONE.md            ← copy → epics/{EPIC-ID}/milestones/{M-ID}.md
    STORY.md                ← copy → epics/{EPIC-ID}/stories/{US-ID}/STORY.md
    TASKS.md                ← copy → epics/{EPIC-ID}/stories/{US-ID}/TASKS.md
  epics/
    {EPIC-ID}/
      EPIC.md               ← epic definition + milestone list + story index
      milestones/
        {M-ID}.md           ← milestone scope, stories in it, DoD
      stories/
        {US-ID}/
          STORY.md          ← story card: ACs, test cases, out-of-scope
          TASKS.md          ← PR-based task breakdown (files, commands, checklist)
          PR-NNN.md         ← created when PR is opened (optional record)
```

---

## Naming Conventions

| Level | Format | Example |
|-------|--------|---------|
| Epic | `EPIC-{DOMAIN}-{NN}` | `EPIC-DESIGN-01` |
| Milestone | `M-{DOMAIN}-{NN}-{slug}` | `M-DESIGN-02-editor-tokens` |
| Story | `US-{DOMAIN}-{NNN}` | `US-DESIGN-002` |
| Task | `T{N}` (within a TASKS.md) | `T1`, `T2` |
| PR branch | `feat/{domain}-{story-slug}` | `feat/design-us-design-002-editor-tokens` |
| Linear issue | Sync with story ID in title | `[US-DESIGN-002] Editor token replacement` |

Domain prefixes: `DESIGN` · `PAY` · `AUTH` · `EDIT` · `AI` · `USAGE` · `INFRA` · `ORG`

---

## Start a New Story (quick-start)

```bash
# 1. Copy templates
cp docs/agile/templates/STORY.md  docs/agile/epics/{EPIC-ID}/stories/{US-ID}/STORY.md
cp docs/agile/templates/TASKS.md  docs/agile/epics/{EPIC-ID}/stories/{US-ID}/TASKS.md

# 2. Fill in STORY.md (5 min — write ACs before opening AI chat)

# 3. Create feature branch
git checkout -b feat/{domain}-{story-slug}

# 4. Paste TASKS.md into AI prompt → implement

# 5. Commit with story ID
git commit -m "feat(domain): what and why — US-{DOMAIN}-{NNN}"

# 6. Open PR → paste story card as PR body
# 7. Merge → update STORY.md status + this index
```

Full protocol: [workflow/AGILE_AI_WORKFLOW.md](../workflow/AGILE_AI_WORKFLOW.md)

---

## Definition of Done (any story)

- [ ] All ACs in STORY.md checked ✅
- [ ] All tasks in TASKS.md checked ✅
- [ ] `npm run check` passes (no TypeScript errors)
- [ ] `npm run test:unit` passes
- [ ] Manual test of changed flow on `localhost:5000`
- [ ] PR merged with story card as description
- [ ] STORY.md status updated to `✅ Done`
- [ ] This index updated (story count / epic status)
- [ ] [docs/MVP_LAUNCH_TRACKER.md](../MVP_LAUNCH_TRACKER.md) updated if applicable
