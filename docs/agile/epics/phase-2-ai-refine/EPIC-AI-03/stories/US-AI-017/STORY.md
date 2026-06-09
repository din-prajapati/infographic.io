# Story Card — US-AI-017

> **Status:** 🔲 Not Started
> **Feature:** F-AI-03-02
> **Epic:** [EPIC-AI-03](../../EPIC.md)
> **Milestone:** [M-AI-09-element-edit](../../milestones/M-AI-09-element-edit.md)
> **Capability:** CAP-13
> **Linear:** LIN-US-AI-017 | **Created:** 2026-04-28

---

## Story

*As a* real estate agent
*I want* Element Edit Mode — targeted modifications
*So that* I can produce higher-quality infographics more efficiently

---

## Acceptance Criteria

- [ ] **AC1:** Core capability (CAP-13) implemented and working end-to-end
- [ ] **AC2:** Feature works within existing NestJS + React architecture without breaking existing flows
- [ ] **AC3:** No model names, technical details, or internal routing logic exposed in any UI element or API response
- [ ] **AC4:** `npm run check` passes

---

## Out of Scope

- Capabilities outside CAP-13 scope
- UI redesign beyond what's necessary for this feature

---

## Engineering / PR

- **Branch:** `feat/ai-us-ai-017-element-edit`
- **PR:** #_____ (fill when opened)
- **Primary files:** Determined during implementation session (read EPIC.md architecture notes first)

---

## AI Implementation Prompt

> Copy this block into Claude Code to implement the story.

```
Context: InfographicAI SaaS — NestJS (port 3001) + React (port 5000). See CLAUDE.md.
Capability: CAP-13 — Element Edit Mode — targeted modifications

Read EPIC-AI-03/EPIC.md and EPIC-AI-03/ARCHITECTURE.mmd before starting.
Implement the minimum viable version of this capability.
Do NOT expose model names or technical details in any UI or API response.
When done: list files changed, ACs checked, test command to verify.
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status |
|-------|------|----------|----------|--------|
| TC-US-AI-017-01 | Manual | P0 | Core CAP-13 capability works end-to-end | 🔲 |
| TC-US-AI-017-02 | Manual | P1 | No model/technical details visible in UI | 🔲 |

---

## Definition of Done

- [ ] All ACs checked ✅ | `npm run check` ✅ | `npm run test:unit` ✅ | PR merged | [TASKS.md](./TASKS.md) checked

*Story created: 2026-04-28*
