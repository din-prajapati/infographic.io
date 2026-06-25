# Story Card — US-AI-023

> **Status:** 🔲 Not Started
> **Feature:** F-AI-04-01 | **Epic:** [EPIC-AI-04](../../EPIC.md)
> **Milestone:** [M-AI-12-mockup-expand](../../milestones/M-AI-12-mockup-expand.md)
> **Capability:** CAP-18 (18h) | **Created:** 2026-04-28

## Story

*As a* real estate agent or brokerage
*I want* Real estate mockup generator
*So that* I can produce professional-grade marketing output at scale

## Acceptance Criteria

- [ ] **AC1:** Core CAP-18 (18h) capability works end-to-end
- [ ] **AC2:** No model names or technical details exposed in UI or API response
- [ ] **AC3:** Plan enforcement correct (BROKERAGE/TEAM gate where applicable)
- [ ] **AC4:** `npm run check` passes

## Engineering / PR

- **Branch:** `feat/ai-us-ai-023-mockup`
- **Primary files:** Determined during implementation session (read EPIC-AI-04/EPIC.md first)

## AI Implementation Prompt

```
Context: InfographicAI SaaS — NestJS (port 3001) + React (port 5000). See CLAUDE.md.
Read EPIC-AI-04/EPIC.md and ARCHITECTURE.mmd before starting.
Capability: CAP-18 (18h) — Real estate mockup generator
Implement minimum viable version. No model names in UI or API responses.
When done: list files changed, ACs checked, test command to verify.
```

## Test Cases

| TC ID | Type | Priority | Scenario | Status |
|-------|------|----------|----------|--------|
| TC-US-AI-023-01 | Manual | P0 | Core capability works end-to-end | 🔲 |
| TC-US-AI-023-02 | Manual | P0 | Plan gate enforced correctly | 🔲 |

## Definition of Done

- [ ] All ACs ✅ | `npm run check` ✅ | `npm run test:unit` ✅ | PR merged | [TASKS.md](./TASKS.md) checked

*Story created: 2026-04-28*
