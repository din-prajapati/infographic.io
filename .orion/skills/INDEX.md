---
title: Skills — INDEX
type: index
tags: [orion, index]
updated: 2026-05-20
---

# Skills — INDEX

> Invocable workflows triggered by `/skill-name`.
> Skills are split into **core** (framework-agnostic) and **stacks** (tech-specific).

---

## Core Skills (Framework-Agnostic)

Loaded automatically. See [core/INDEX.md](core/INDEX.md) for full catalog.

### By SDLC Stage

| Stage | Skill | Purpose |
|:-----:|-------|---------|
| 1 · Discover | [`/prd-to-roadmap`](core/prd-to-roadmap/SKILL.md) | PRD → full hierarchy |
| 1 · Discover | [`/new-epic`](core/new-epic/SKILL.md) | Scaffold one epic |
| 1 · Discover | [`/new-feature`](core/new-feature/SKILL.md) | Scaffold a feature under an epic |
| 1 · Discover | [`/new-milestone`](core/new-milestone/SKILL.md) | Scaffold a milestone |
| 2 · Design | [`/design-epic`](core/design-epic/SKILL.md) | Invoke architect-agent for ARCHITECTURE.mmd |
| 2 · Design | [`/new-adr`](core/new-adr/SKILL.md) | Record an Architecture Decision (ADR) |
| 2 · Design | [`/manage-rules`](../../docs/how-to/manage-rules.md) | Edit `.orion/rules/*.md` — team's living conventions (loaded per scaffold.json) |
| 3 · Define | [`/new-story`](core/new-story/SKILL.md) | STORY.md + TASKS.md from milestone |
| 4 · Develop | [`/implement-story`](core/implement-story/SKILL.md) | Invoke code-agent to write the code |
| 5 · Test | [`/test-story`](core/test-story/SKILL.md) | Invoke unit + e2e agents |
| 6 · Review | [`/review-pr`](core/review-pr/SKILL.md) | Invoke reviewer-agent on a PR |
| 6 · Review | [`/agile-pr`](core/agile-pr/SKILL.md) | Open the GitHub PR |
| 7 · Ship | [`/ship-it`](core/ship-it/SKILL.md) | Invoke devops-agent for deploy |
| 7 · Ship | [`/close-story`](core/close-story/SKILL.md) | Mark Done, cascade updates |

### Cross-Stage

| Skill | Purpose |
|-------|---------|
| [`/standup`](core/standup/SKILL.md) | Scan TASKS.md → daily standup report |
| [`/plan-tomorrow`](core/plan-tomorrow/SKILL.md) | Pick next session's focus — written to TEAM_STATUS for recall |
| [`/verification-gates`](core/verification-gates/SKILL.md) | Run gates 1–4 before declaring done |
| [`/contract-first-testing`](core/contract-first-testing/SKILL.md) | Test-writing discipline |
| [`/runtime-first-implementation`](core/runtime-first-implementation/SKILL.md) | Implementation discipline — trace before editing |
| [`/enumerate-and-confirm-scope`](core/enumerate-and-confirm-scope/SKILL.md) | Scope discipline — never silently partial-sweep |

---

## Stack Packs (Tech-Specific, Opt-In)

Loaded based on `load_stacks` in PROJECT_CONTEXT.yaml. See [stacks/INDEX.md](stacks/INDEX.md).

| Pack | Status | Skills |
|------|:------:|--------|
| `react` | 🔲 v0.2 | `/new-component`, `/new-hook`, `/new-page` |
| `nestjs` | 🔲 v0.2 | `/new-module`, `/new-controller`, `/new-service`, `/new-dto` |
| `prisma` | 🔲 v0.2 | `/db-migrate`, `/db-audit`, `/new-model` |
| `playwright` | 🔲 v0.2 | `/new-e2e`, `/run-e2e` |
| `vitest` | 🔲 v0.2 | `/new-unit`, `/run-unit-coverage` |
| `razorpay` | 🔲 v0.2 | `/verify-payments`, `/test-webhook` |

---

## Recommended Workflow

```
New PRD                /prd-to-roadmap     → ROADMAP + tree
   ↓
Epic to design         /design-epic        → ARCHITECTURE.mmd + ENV.yaml
   ↓
Milestone to plan      /new-story          → STORY.md + TASKS.md
   ↓
Story to build         /implement-story    → code-agent writes implementation
   ↓
Story to test          /test-story         → unit + e2e agents write tests
   ↓
Gates                  /verification-gates → gate 1–4 pass
   ↓
PR                     /agile-pr           → GitHub PR opened
   ↓
PR review              /review-pr          → reviewer-agent verdict
   ↓
Merge + deploy         /ship-it            → devops-agent runs deploy + smoke
   ↓
Done                   /close-story        → cascades ✅ to milestone/epic/tracker

Daily routine          /standup            → see done/today/blocked
```

---

## How to Add a Skill

See [docs/how-to/add-new-skill.md](../../docs/how-to/add-new-skill.md).

Skill files live in `.orion/skills/{category}/{skill-name}/SKILL.md` with YAML frontmatter.

---

*Last updated: 2026-05-18*
