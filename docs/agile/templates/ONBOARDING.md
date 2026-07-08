---
title: {PROJECT_NAME} — ORION Onboarding
type: onboarding
tags: [orion, onboarding]
updated: {TODAY}
---

# Onboarding — {PROJECT_NAME}

> This project uses **ORION AI-SDLC** for AI-native development. AI does the heavy lifting; you verify and ship.

---

## What ORION is (in 30 seconds)

A 7-stage pipeline (Discover → Design → Define → Develop → Test → Review → Ship) with 9 specialized AI agents, ~19 invocable skills, and a layered rules system. Each story flows through every stage with markdown artifacts as the only memory.

Full picture: **[github.com/din-prajapati/orion/blob/main/NORTH_STAR.md](https://github.com/din-prajapati/orion/blob/main/NORTH_STAR.md)**

---

## Your first hour

1. **Read this file** (you're doing it — 5 min)
2. **Read `.orion/rules/AGILE.md`** (5 min) — how we slice stories, definition of done, branch/commit conventions
3. **Skim your stack's rules** (10 min) — only the layers/techs this project uses:
{STACK_RULES_LINKS}
4. **Walk through one finished story** in `docs/agile/epics/.../stories/` to see real STORY.md / TASKS.md / scaffold.json / PR pattern (10 min)
5. **Read the worked sample** at [github.com/din-prajapati/orion → Tutorial 05](https://github.com/din-prajapati/orion/blob/main/docs/tutorials/05-worked-sample-story.md) (15 min)
6. **Ask a teammate to pair on your first story** so you see the live flow

After that, you should be able to take any `🔲 Not Started` story and run `/implement-story <ID>` confidently.

---

## Daily flow (the short version)

```
Morning      → Claude Code session opens
                ↳ session-start-recall.sh prints last session + planned focus
                ↳ run /standup to see all in-progress / blocked / ready-to-start

Mid-day      → pick a story
                ↳ /implement-story US-XXX-NNN   (code-agent writes the code)
                ↳ /test-story US-XXX-NNN       (unit + e2e tests written from ACs)
                ↳ /agile-pr US-XXX-NNN         (opens PR with full context)
                ↳ /review-pr <PR#>             (reviewer-agent verdict before merging)

Merge        → GitHub Action auto-runs cascade-close-story.sh
                ↳ STORY/TASKS/MILESTONE/EPIC/PHASE_TRACKER/AGILE_INDEX all flip ✅

End of day   → /plan-tomorrow  (picks tomorrow's focus, surfaces next session)
```

---

## Key folders in this repo

| Folder | What's there |
|--------|--------------|
| `PROJECT_CONTEXT.yaml` | The single config — tech stack, domains, gates, paths. Update when stack changes. |
| `.orion/scaffold.json` | Declares which layers/techs this project uses. Drives selective rule loading. |
| `.orion/rules/` | Team conventions. Living document — edit as practices emerge. |
| `.orion/ONBOARDING.md` | This file. |
| `docs/agile/epics/` | All epics, milestones, stories live here. |
| `docs/agile/decisions/` | Architecture Decision Records (ADRs). |
| `docs/agile/history/` | Weekly compacted session logs. |
| `.claude/agents/` | 9 specialized AI agents (read-only — framework owned). |
| `.claude/skills/` | Invocable `/slash` commands. |
| `.claude/hooks/` | Shell hooks (zero LLM cost). |
| `.github/workflows/` | CI automation, including auto-close-on-merge. |

---

## Common gotchas

| Symptom | Cause | Fix |
|---------|-------|-----|
| `/implement-story` complains "scaffold.json missing" | Story was created before ORION upgrade | Re-run `/new-story <ID>` to backfill |
| Agent touches a file outside `scaffold.touches.layers` | Soft drift — not blocked, just flagged | Either update scaffold.json to match the new reality, or split into a second story |
| `pre-push-gate1` hook blocks a push | Gate 1 (typecheck + unit tests) failed | Fix the failures; don't `--no-verify` |
| Multiple PRs for one story | Anti-pattern in this codebase | One PR = one story. Split or merge first. |

---

## Project-Specific Stack

{STACK_DESCRIPTION}

Domains in this project: {DOMAINS}

---

## Going Deeper

- **Why this framework exists:** [github.com/din-prajapati/orion/NORTH_STAR.md](https://github.com/din-prajapati/orion/blob/main/NORTH_STAR.md)
- **How rules load (scaffold.json):** [Manage Rules guide](https://github.com/din-prajapati/orion/blob/main/docs/how-to/manage-rules.md)
- **All skills reference:** [skills.md](https://github.com/din-prajapati/orion/blob/main/docs/reference/skills.md)
- **All agents:** [agents.md](https://github.com/din-prajapati/orion/blob/main/docs/reference/agents.md)
- **Worked sample story:** [Tutorial 05](https://github.com/din-prajapati/orion/blob/main/docs/tutorials/05-worked-sample-story.md)

---

*This file is yours to edit. The framework writes it once during `ai-sdlc init` — after that, the team owns it.*
