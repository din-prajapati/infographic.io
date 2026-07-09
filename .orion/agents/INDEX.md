---
title: Agents — INDEX
type: index
tags: [orion, index]
updated: 2026-05-20
---

# Agents — INDEX

> Named SubAgents with fixed personas and single specializations.
> Each agent owns one stage of the [7-stage AI SDLC pipeline](../../NORTH_STAR.md#the-7-stage-ai-sdlc).

---

## Roster

| # | Agent | Persona | Stage | Specialty |
|:-:|-------|---------|:-----:|-----------|
| 1 | [pm-agent](pm-agent.md) | Jordan — Senior PM | 1 · Discover | PRD → Phase/Epic/Feature/Milestone/Story breakdown |
| 2 | [architect-agent](architect-agent.md) | Arjun — System Architect | 2 · Design | ARCHITECTURE.mmd, technical risk, effort estimates |
| 3 | [story-writer](story-writer.md) | Priya — BA / Product Owner | 3 · Define | STORY.md with INVEST acceptance criteria |
| 4 | [code-agent](code-agent.md) | Diego — Senior Full-Stack Engineer | 4 · Develop | Implementation code respecting Out-of-Scope |
| 5 | [unit-test-agent](unit-test-agent.md) | Mia — Test Engineer (TDD) | 5 · Test | Mock-based unit tests, contract-first |
| 6 | [e2e-test-agent](e2e-test-agent.md) | Tomas — QA Automation | 5 · Test | Black-box E2E from user perspective |
| 7 | [qa-agent](qa-agent.md) | Kavya — QA Manager | 5 · Test (plan) | Test plans, risk matrix, gate assignment |
| 8 | [reviewer-agent](reviewer-agent.md) | Lin — Tech Lead | 6 · Review | PR review: AC coverage, scope, quality |
| 9 | [devops-agent](devops-agent.md) | Sam — SRE | 7 · Ship | Deploy, env validation, production smoke |

---

## When to Invoke Each Agent

| Situation | Invoke |
|-----------|--------|
| "Here's a PRD" | `pm-agent` |
| "I need an ARCHITECTURE.mmd for this epic" | `architect-agent` |
| "Write me the story card for US-XXX-NNN" | `story-writer` |
| "Implement US-XXX-NNN" | `code-agent` |
| "Write unit tests for the new service" | `unit-test-agent` |
| "Write Playwright tests for this user flow" | `e2e-test-agent` |
| "Give me a test plan with risk matrix" | `qa-agent` |
| "Review this PR before I merge" | `reviewer-agent` |
| "Deploy this to staging" | `devops-agent` |

---

## How They Hand Off

```
pm-agent → produces ROADMAP.md, ID list
   ↓
architect-agent → reads epic, produces ARCHITECTURE.mmd + ENV.yaml
   ↓
story-writer → reads milestone + architecture, produces STORY.md
   ↓
code-agent → reads STORY.md + TASKS.md + ARCHITECTURE.mmd, writes code
   ↓
unit-test-agent + e2e-test-agent → read STORY.md ACs, write tests
   ↓
reviewer-agent → reads diff + STORY.md, produces review verdict
   ↓
devops-agent → reads PR + ENV.yaml, runs deploy + smoke
```

**Each hand-off is via a markdown file, not chat memory.** That's how a new contributor (or a new AI session) can resume mid-pipeline.

---

## Agent Authoring Rules

1. **One persona per agent.** Each agent has a fixed name, role, and communication style.
2. **One specialty per agent.** No "generalist" agents. If a task spans two specialties, invoke two agents.
3. **Reads PROJECT_CONTEXT.yaml first.** Every agent grounds itself in project context before acting.
4. **Outputs to a file, not chat.** The artifact must persist where the next agent can find it.
5. **Tools list is minimum sufficient.** Don't give an agent tools it doesn't need.
6. **Refuses to invent.** When information is missing, agents ask — they do not guess.

To add a new agent, see [docs/how-to/add-new-agent.md](../../docs/how-to/add-new-agent.md).

---

*Last updated: 2026-05-18*
