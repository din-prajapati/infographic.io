# Project Skills Index

> Repeatable engineering and agile workflows for InfographicAI.
> Skills are **story-agnostic** and **model-agnostic** — they apply across any story, epic, or domain.
>
> Domain tags: `all` | `frontend` | `backend` | `testing` | `agile`
>
> See also: [`.claude/agents/`](../agents/) for named SubAgents (pm-agent, architect-agent, story-writer, qa-agent)

---

## Agile System Skills

These skills form the complete PRD → Roadmap → Story → PR → Done lifecycle.

| Skill | Domain | Invoke as | Problem Solved |
|-------|--------|-----------|----------------|
| [prd-to-roadmap](prd-to-roadmap/SKILL.md) | `agile` | `/prd-to-roadmap` | Convert a PRD into a full Phase→Epic→Feature→Milestone→Story hierarchy with all files and trackers |
| [new-epic](new-epic/SKILL.md) | `agile` | `/new-epic` | Scaffold one epic folder with EPIC.md, ARCHITECTURE.mmd, ENV.yaml, and subdirectories |
| [new-story](new-story/SKILL.md) | `agile` | `/new-story` | Create a detailed STORY.md + TASKS.md stub ready for an AI implementation session |
| [standup](standup/SKILL.md) | `agile` | `/standup` | Scan all TASKS.md files and generate a daily standup: done / in-progress / blocked / next |
| [close-story](close-story/SKILL.md) | `agile` | `/close-story` | Mark story Done, verify DoD, cascade status updates to milestone / epic / phase tracker |
| [agile-pr](agile-pr/SKILL.md) | `agile` | `/agile-pr` | Create a GitHub PR pre-filled with story ACs, test evidence, and agile labels |

---

## Engineering Quality Skills

These skills enforce code correctness, scope discipline, and testing standards.

| Skill | Domain | Invoke as | Problem Solved |
|-------|--------|-----------|----------------|
| [runtime-first-implementation](runtime-first-implementation/SKILL.md) | `all` | `/runtime-first-implementation` | Change has no effect because runtime loads a different file or overrides the edit |
| [enumerate-and-confirm-scope](enumerate-and-confirm-scope/SKILL.md) | `all` | `/enumerate-and-confirm-scope` | Broad instruction produces a silent incomplete sweep; gaps found via screenshots |
| [contract-first-testing](contract-first-testing/SKILL.md) | `testing` | `/contract-first-testing` | Tests check the wrong thing; false positives mask real failures |
| [verification-gates](verification-gates/SKILL.md) | `all` | `/verification-gates` | Visual/functional regressions committed because "code looks right" |

---

## Named SubAgents

Specialized reasoning agents invoked via the Agent tool. Each has a fixed persona and domain expertise.

| Agent | File | Persona | When to invoke |
|-------|------|---------|----------------|
| PM Agent | [pm-agent.md](../agents/pm-agent.md) | Jordan (Senior PM) | Breaking a PRD into phases/epics/features/milestones/stories |
| Architect Agent | [architect-agent.md](../agents/architect-agent.md) | Arjun (System Architect) | ARCHITECTURE.mmd diagrams, technical risk, effort estimates, ENV.yaml |
| Story Writer | [story-writer.md](../agents/story-writer.md) | Priya (Business Analyst) | Detailed STORY.md with INVEST-compliant ACs, test cases, implementation prompts |
| QA Agent | [qa-agent.md](../agents/qa-agent.md) | Kavya (QA Engineer) | Test plans, Playwright E2E stubs, verification gate assignments, risk matrix |

---

## Recommended Workflow

```
New PRD arrives
  └─ /prd-to-roadmap         ← generates the full hierarchy skeleton
       └─ /new-epic            ← deep-fill one epic (invokes architect-agent)
            └─ /new-story      ← write story card (invokes story-writer)
                 └─ implement  ← AI coding session using TASKS.md
                      └─ /verification-gates  ← Gate 1–4 before PR
                           └─ /agile-pr       ← open PR with full context
                                └─ /close-story  ← mark done, cascade updates

Daily routine:
  /standup → see what's done/next/blocked
```

---

## Skill Authoring Rules

1. Skills are **story-agnostic** — no hardcoded story IDs, token names, or component names
2. Frontend and backend workflows are **explicitly labeled** (`[FRONTEND]` / `[BACKEND]`)
3. Scripts in `scripts/` are executable — no manual steps embedded in bash blocks
4. Each skill must have: YAML frontmatter, problem statement, protocol (step-by-step), edge cases
5. Skills live in `skills/{name}/SKILL.md` — never inline in STORY.md or TASKS.md
6. Agents live in `agents/{name}.md` — never duplicate agent logic in skills

---

*Last updated: 2026-05-18*
