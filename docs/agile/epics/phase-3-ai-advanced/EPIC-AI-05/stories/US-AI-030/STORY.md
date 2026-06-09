# Story Card — US-AI-030

> **Status:** 🔲 Not Started
> **Feature:** F-AI-05-04 | **Epic:** [EPIC-AI-05](../../EPIC.md)
> **Milestone:** [M-AI-16-status-search](../../milestones/M-AI-16-status-search.md)
> **Capability:** CAP-24 (8h) | **Created:** 2026-04-28

## Story

*As a* real estate agent
*I want* In-chat search
*So that* I get smarter, more personalized infographics with less manual effort

## Acceptance Criteria

- [ ] **AC1:** Core CAP-24 (8h) capability works end-to-end
- [ ] **AC2:** No model names or technical details exposed in UI or API response
- [ ] **AC3:** Feature degrades gracefully if external API is unavailable
- [ ] **AC4:** `npm run check` passes

## Engineering / PR

- **Branch:** `feat/ai-us-ai-030-chat-search`
- **Primary files:** Determined during implementation session (read EPIC-AI-05/EPIC.md first)

## AI Implementation Prompt

```
Context: InfographicAI SaaS — NestJS (port 3001) + React (port 5000). See CLAUDE.md.
Read EPIC-AI-05/EPIC.md and ARCHITECTURE.mmd before starting.
Capability: CAP-24 (8h) — In-chat search
Implement minimum viable version. Graceful degradation if external API unavailable.
When done: list files changed, ACs checked, test command to verify.
```

## Test Cases

| TC ID | Type | Priority | Scenario | Status |
|-------|------|----------|----------|--------|
| TC-US-AI-030-01 | Manual | P0 | Core capability works end-to-end | 🔲 |
| TC-US-AI-030-02 | Manual | P1 | Feature degrades gracefully if external API unavailable | 🔲 |

## Definition of Done

- [ ] All ACs ✅ | `npm run check` ✅ | `npm run test:unit` ✅ | PR merged | [TASKS.md](./TASKS.md) checked

*Story created: 2026-04-28*
