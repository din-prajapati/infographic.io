# Story Card — US-AI-024

> **Status:** 🔲 Not Started
> **Feature:** F-AI-04-02 | **Epic:** [EPIC-AI-04](../../EPIC.md)
> **Milestone:** [M-AI-12-mockup-expand](../../milestones/M-AI-12-mockup-expand.md)
> **Capability:** CAP-19 (14h) | **Created:** 2026-04-28

## Story

*As a* real estate agent or brokerage
*I want* Format Expand and Outpainting
*So that* I can produce professional-grade marketing output at scale

## Acceptance Criteria

- [ ] **AC1:** Core CAP-19 (14h) capability works end-to-end
- [ ] **AC2:** No model names or technical details exposed in UI or API response
- [ ] **AC3:** Plan enforcement correct (BROKERAGE/TEAM gate where applicable)
- [ ] **AC4:** `npm run check` passes

## Engineering / PR

- **Branch:** `feat/ai-us-ai-024-outpaint`
- **Primary files:** Determined during implementation session (read EPIC-AI-04/EPIC.md first)

## AI Implementation Prompt

```
Context: InfographicAI SaaS — NestJS (port 3001) + React (port 5000). See CLAUDE.md.
Read EPIC-AI-04/EPIC.md and ARCHITECTURE.mmd before starting.
Capability: CAP-19 (14h) — Format Expand and Outpainting
Implement minimum viable version. No model names in UI or API responses.
When done: list files changed, ACs checked, test command to verify.
```

## Test Cases

| TC ID | Type | Priority | Scenario | Status |
|-------|------|----------|----------|--------|
| TC-US-AI-024-01 | Manual | P0 | Core capability works end-to-end | 🔲 |
| TC-US-AI-024-02 | Manual | P0 | Plan gate enforced correctly | 🔲 |

## Definition of Done

- [ ] All ACs ✅ | `npm run check` ✅ | `npm run test:unit` ✅ | PR merged | [TASKS.md](./TASKS.md) checked

*Story created: 2026-04-28*
