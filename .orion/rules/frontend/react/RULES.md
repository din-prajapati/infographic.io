---
title: React Rules
type: rules
layer: frontend
tech: react
tags: [orion, rules, frontend, react]
updated: 2026-05-20
---

# React Rules

## Conventions

- [ ] **Functional components + hooks only.** No new class components.
- [ ] **Server state:** Tanstack Query (or project equivalent). UI state: `useState` / Zustand / Context — choose by scope.
- [ ] **Effects are last resort.** Derive state, don't sync it. No `useEffect` for data fetching — use the fetcher.
- [ ] **Component naming:** `PascalCase` files matching default export; one component per file.
- [ ] **Hooks named `useX`.** Custom hooks return a stable shape across renders.
- [ ] **Memoize when measured, not when feared.** Profile before adding `useMemo`/`useCallback`.

## Anti-patterns

- [ ] Don't `useEffect` to trigger another `setState` — derive instead.
- [ ] Don't pass JSX through props — pass components or children.
- [ ] Don't use `index` as `key` for lists that reorder or insert.
- [ ] Don't put context everywhere — it forces re-renders; split contexts by concern.

## References

- ADRs: [docs/agile/decisions/](../../../../docs/agile/decisions/)
