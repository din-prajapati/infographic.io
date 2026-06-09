# Story Card — US-AI-025

> **Status:** 🔲 Not Started
> **Feature:** F-AI-04-03 | **Epic:** [EPIC-AI-04](../../EPIC.md)
> **Milestone:** [M-AI-13-photo-cleanup](../../milestones/M-AI-13-photo-cleanup.md)
> **Capability:** CAP-20 (16h) | **Created:** 2026-04-28

## Story

*As a* real estate agent or brokerage
*I want* Property photo cleanup — object removal
*So that* I can produce professional-grade marketing output at scale

## Acceptance Criteria

- [ ] **AC1:** Core CAP-20 (16h) capability works end-to-end
- [ ] **AC2:** No model names or technical details exposed in UI or API response
- [ ] **AC3:** Plan enforcement correct (BROKERAGE/TEAM gate where applicable)
- [ ] **AC4:** `npm run check` passes

## Engineering / PR

- **Branch:** `feat/ai-us-ai-025-photo-cleanup`
- **Primary files:** Determined during implementation session (read EPIC-AI-04/EPIC.md first)

## AI Implementation Prompt

```
Context: InfographicAI SaaS — NestJS (port 3001) + React (port 5000). See CLAUDE.md.
Read EPIC-AI-04/EPIC.md and ARCHITECTURE.mmd before starting.
Capability: CAP-20 (16h) — Property photo cleanup — object removal
Implement minimum viable version. No model names in UI or API responses.
When done: list files changed, ACs checked, test command to verify.
```

## Test Cases

| TC ID | Type | Priority | Scenario | Status |
|-------|------|----------|----------|--------|
| TC-US-AI-025-01 | Manual | P0 | Core capability works end-to-end | 🔲 |
| TC-US-AI-025-02 | Manual | P0 | Plan gate enforced correctly | 🔲 |

## Definition of Done

- [ ] All ACs ✅ | `npm run check` ✅ | `npm run test:unit` ✅ | PR merged | [TASKS.md](./TASKS.md) checked

*Story created: 2026-04-28*
