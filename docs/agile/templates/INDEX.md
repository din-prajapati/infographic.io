---
title: Templates — INDEX
type: index
tags: [orion, index]
updated: 2026-05-21
---

# Templates — INDEX

> Markdown templates used by skills and agents. Copy and replace `{PLACEHOLDERS}`.

---

## Customization

| Template | Status | Used By |
|----------|:------:|---------|
| [PROJECT_CONTEXT.yaml](PROJECT_CONTEXT.yaml) | ✅ | One per host project — the customization layer |

## Input

| Template | Status | Used By |
|----------|:------:|---------|
| [PRD.md](PRD.md) | 🚧 | Format guide for what to feed `/prd-to-roadmap` |

## Generated Outputs (created by skills)

| Template | Status | Used By |
|----------|:------:|---------|
| [ROADMAP.md](ROADMAP.md) | ✅ | `/prd-to-roadmap` master output |
| [EPIC.md](EPIC.md) | ✅ | `/new-epic`, `/prd-to-roadmap` |
| [FEATURE.md](FEATURE.md) | ✅ | `/new-feature`, `/prd-to-roadmap` |
| [MILESTONE.md](MILESTONE.md) | ✅ | `/new-milestone`, `/prd-to-roadmap` |
| [STORY.md](STORY.md) | ✅ | `/new-story`, story-writer agent |
| [TASKS.md](TASKS.md) | ✅ | `/new-story`, code-agent |
| [ARCHITECTURE.mmd](ARCHITECTURE.mmd) | ✅ | architect-agent |
| [DECISION.md](DECISION.md) | ✅ | `/new-adr` — Architecture Decision Records |
| [ENV.yaml](ENV.yaml) | ✅ | architect-agent |
| [PR_BODY.md](PR_BODY.md) | ✅ | `/agile-pr` — per-story PR body (drafted by story-writer) |
| [COMMIT_TEMPLATE.md](COMMIT_TEMPLATE.md) | ✅ | story-writer, code-agent — per-story commit conventions |
| [ISSUES.md](ISSUES.md) | ✅ | Bug log per story (optional) |
| [phase-README.md](phase-README.md) | ✅ | `/prd-to-roadmap`, `/new-epic` — phase folder intro + epic DAG |

## Trackers

| Template | Status | Used By |
|----------|:------:|---------|
| [AGILE_INDEX.md](AGILE_INDEX.md) | ✅ | Master epic registry per project |
| [PHASE_TRACKER.md](PHASE_TRACKER.md) | ✅ | Executive phase progress view |
| [TEAM_STATUS.md](TEAM_STATUS.md) | ✅ | Domain-level now/next/blocked (carries `<!-- ai-sdlc:session-log -->` + `<!-- ai-sdlc:tomorrow -->` blocks) |

## Workflow Guides (one-time per project)

| Template | Status | Used By |
|----------|:------:|---------|
| [HOW_TO_USE.md](HOW_TO_USE.md) | ✅ | `/prd-to-roadmap` — copied once into `docs/agile/HOW_TO_USE.md` |
| [GIT_STRATEGY.md](GIT_STRATEGY.md) | ✅ | `/prd-to-roadmap` — generated from PROJECT_CONTEXT.yaml.git |
| [guides/STORY_PR_WORKFLOW.md](guides/STORY_PR_WORKFLOW.md) | ✅ | `/prd-to-roadmap` — copied once into `docs/agile/guides/` |

## Settings

| Template | Status | Used By |
|----------|:------:|---------|
| [managed-settings.example.json](managed-settings.example.json) | ✅ | Enterprise IT — deploy to `C:\ProgramData\ClaudeCode\` or `/Library/Application Support/ClaudeCode/` |

**Legend:** ✅ Built · 🚧 In current build cycle · 🔲 Planned later

---

## Placeholder Conventions

All templates use `{PLACEHOLDER}` for replaceable values:

| Placeholder | Replaced with |
|-------------|--------------|
| `{DOMAIN}` | Uppercase domain prefix from PROJECT_CONTEXT.yaml |
| `{NN}` | 2-digit zero-padded number |
| `{NNN}` | 3-digit zero-padded number |
| `{slug}` | kebab-case slug |
| `{PROJECT_NAME}` | `project.name` from PROJECT_CONTEXT.yaml |
| `{STACK_*}` | Tech stack values from PROJECT_CONTEXT.yaml |
| `YYYY-MM-DD` | ISO date (filled in by skill or left blank) |

---

*Last updated: 2026-05-18*
