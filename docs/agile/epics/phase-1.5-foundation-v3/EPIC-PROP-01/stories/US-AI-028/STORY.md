# Story Card — US-AI-028

> **Status:** 🔲 Not Started
> **Feature:** F-AI-05-02 | **Epic:** [EPIC-PROP-01](../../EPIC.md) (was EPIC-AI-05)
> **Milestone:** [M-PROP-02-brand-profile](../../milestones/M-PROP-02-brand-profile.md)
> **Moved 2026-10-29:** from EPIC-AI-05 / M-AI-15 (Phase 3) to EPIC-PROP-01 / M-PROP-02 (Phase 1.5) by the Phase 1.5 restructure — [ADR-003](../../../../../decisions/ADR-003-phase-1-close-and-phase-1.5.md). Pulled forward: every asset fills its contact details from this profile, so it is a foundation, not an enrichment.
> **Capability:** CAP-22 (10h) | **Created:** 2026-04-28

## Story

*As a* real estate agent
*I want* Agent profile persistence
*So that* I get smarter, more personalized infographics with less manual effort

## Acceptance Criteria

- [ ] **AC1:** Core CAP-22 (10h) capability works end-to-end
- [ ] **AC2:** No model names or technical details exposed in UI or API response
- [ ] **AC3:** Feature degrades gracefully if external API is unavailable
- [ ] **AC4:** `npm run check` passes

## Engineering / PR

- **Branch:** `feat/ai-us-ai-028-agent-profile`
- **Primary files:** Determined during implementation session (read EPIC-AI-05/EPIC.md first)

## AI Implementation Prompt

```
Context: InfographicAI SaaS — NestJS (port 3001) + React (port 5000). See CLAUDE.md.
Read EPIC-AI-05/EPIC.md and ARCHITECTURE.mmd before starting.
Capability: CAP-22 (10h) — Agent profile persistence
Implement minimum viable version. Graceful degradation if external API unavailable.
When done: list files changed, ACs checked, test command to verify.
```

## Test Cases

| TC ID | Type | Priority | Scenario | Status |
|-------|------|----------|----------|--------|
| TC-US-AI-028-01 | Manual | P0 | Core capability works end-to-end | 🔲 |
| TC-US-AI-028-02 | Manual | P1 | Feature degrades gracefully if external API unavailable | 🔲 |

## Definition of Done

- [ ] All ACs ✅ | `npm run check` ✅ | `npm run test:unit` ✅ | PR merged | [TASKS.md](./TASKS.md) checked

*Story created: 2026-04-28*
