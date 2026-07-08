---
title: Frontend Rules
type: rules
layer: frontend
tags: [orion, rules, frontend]
updated: 2026-05-20
---

# Frontend Rules

> Cross-tech frontend conventions. Tech-specific rules live in `frontend/<tech>/RULES.md`.

## Conventions

- [ ] **Accessibility:** All interactive elements keyboard-navigable; semantic HTML; ARIA only when semantics don't fit.
- [ ] **Performance budget:** LCP <2.5s, CLS <0.1, INP <200ms on target devices.
- [ ] **Image policy:** Modern format (WebP/AVIF), explicit `width`/`height`, lazy-load below-the-fold.
- [ ] **Bundle hygiene:** Code-split per route; tree-shake unused exports; no full library imports for one util.
- [ ] **State scope:** Server state ≠ UI state — use a fetcher for server, local store for UI.
- [ ] **Error boundaries** at route level minimum; show recovery action, not blank screen.

## Anti-patterns

- [ ] Don't fetch in tight loops — batch, debounce, or move to a hook.
- [ ] Don't sync server state into local state — it drifts. Read from the fetcher.
- [ ] Don't ship without a loading and an empty state for every async list.
- [ ] Don't suppress a11y lint warnings — fix or document.

## References

- ADRs: [docs/agile/decisions/](../../../docs/agile/decisions/)
