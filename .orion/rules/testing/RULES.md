---
title: Testing Rules
type: rules
layer: testing
tags: [orion, rules, testing]
updated: 2026-05-20
---

# Testing Rules

> Cross-cutting test discipline. Applies across all framework choices.

## Conventions

- [ ] **Contract-first** — tests derived from ACs in STORY.md, not from existing code.
- [ ] **Negative tests required** — error paths, empty states, auth failures, plan-tier gating.
- [ ] **One assertion focus per test** — multiple expectations OK if all probe the same behavior.
- [ ] **AAA layout** — Arrange / Act / Assert; visible in the test body.
- [ ] **Test names describe behavior** — `it("returns 401 when token missing")`, not `it("works")`.
- [ ] **No mocks for the system under test.** Mock dependencies, not the thing you're testing.

## Anti-patterns

- [ ] Don't weaken a failing assertion to make it pass — fix the code.
- [ ] Don't snapshot-test trivial DOM — assertions on visible behavior beat snapshot diffs.
- [ ] Don't share state across tests — each test owns its fixtures.
- [ ] Don't test framework code — test your code.

## Coverage

- 80% statement coverage is a floor, not a goal. Coverage of critical paths matters more than total %.
- Story DoD requires: at least 1 test per AC + 1 negative case minimum.

## References

- [`/contract-first-testing`](../../../.orion/skills/core/contract-first-testing/SKILL.md)
- ADRs: [docs/agile/decisions/](../../../docs/agile/decisions/)
