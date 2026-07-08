---
title: Vitest Rules
type: rules
layer: testing
tech: vitest
tags: [orion, rules, testing, vitest]
updated: 2026-05-20
---

# Vitest Rules

## Conventions

- [ ] **`describe` per module / `it` per behavior.**
- [ ] **`vi.mock` for module-level mocks**; `vi.spyOn` for individual functions.
- [ ] **`expect(...).toMatchInlineSnapshot()`** only for stable data structures.
- [ ] **Setup/teardown via `beforeEach`/`afterEach`** — never share state across files.

## Anti-patterns

- [ ] Don't import the real module then `vi.mock` it after — hoist mocks to the top.
- [ ] Don't put time-dependent assertions without `vi.useFakeTimers()`.

## References

- ADRs: [docs/agile/decisions/](../../../../docs/agile/decisions/)
