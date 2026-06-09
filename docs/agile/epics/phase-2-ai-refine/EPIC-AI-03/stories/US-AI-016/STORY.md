# Story Card — US-AI-016

> **Status:** 🔲 Not Started
> **Feature:** F-AI-03-01
> **Epic:** [EPIC-AI-03](../../EPIC.md)
> **Milestone:** [M-AI-08-quick-refine](../../milestones/M-AI-08-quick-refine.md)
> **Capability:** CAP-12
> **Linear:** LIN-US-AI-016 | **Created:** 2026-04-28

---

## Story

*As a* real estate agent
*I want* Refine with AI from canvas editor
*So that* I can produce higher-quality infographics more efficiently

---

## Acceptance Criteria

- [ ] **AC1:** Core capability (CAP-12) implemented and working end-to-end
- [ ] **AC2:** Feature works within existing NestJS + React architecture without breaking existing flows
- [ ] **AC3:** No model names, technical details, or internal routing logic exposed in any UI element or API response
- [ ] **AC4:** `npm run check` passes

---

## Out of Scope

- Capabilities outside CAP-12 scope
- UI redesign beyond what's necessary for this feature

---

## Engineering / PR

- **Branch:** `feat/ai-us-ai-016-refine-from-canvas`
- **PR:** #_____ (fill when opened)
- **Primary files:** Determined during implementation session (read EPIC.md architecture notes first)

---

## AI Implementation Prompt

> Copy this block into Claude Code to implement the story.

```
Context: InfographicAI SaaS — NestJS (port 3001) + React (port 5000). See CLAUDE.md.
Capability: CAP-12 — Refine with AI from canvas editor

Read EPIC-AI-03/EPIC.md and EPIC-AI-03/ARCHITECTURE.mmd before starting.
Implement the minimum viable version of this capability.
Do NOT expose model names or technical details in any UI or API response.
When done: list files changed, ACs checked, test command to verify.
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status |
|-------|------|----------|----------|--------|
| TC-US-AI-016-01 | Manual | P0 | Core CAP-12 capability works end-to-end | 🔲 |
| TC-US-AI-016-02 | Manual | P1 | No model/technical details visible in UI | 🔲 |

---

## Definition of Done

- [ ] All ACs checked ✅ | `npm run check` ✅ | `npm run test:unit` ✅ | PR merged | [TASKS.md](./TASKS.md) checked

*Story created: 2026-04-28*
