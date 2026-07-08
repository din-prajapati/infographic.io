---
title: Tailwind Rules
type: rules
layer: frontend
tech: tailwind
tags: [orion, rules, frontend, tailwind, styling]
updated: 2026-05-20
---

# Tailwind Rules

## Conventions

- [ ] **Design tokens in `tailwind.config`** — colors, spacing, fonts. No magic literals in components.
- [ ] **Component classes via `cn()`/`clsx`** for conditional styling.
- [ ] **Mobile-first**: base styles for mobile, `sm:`/`md:`/`lg:` for larger.
- [ ] **Extract repeated chains** into a component or `@apply` block, not into class soup.

## Anti-patterns

- [ ] Don't `@apply` everywhere — defeats utility-first benefits.
- [ ] Don't use arbitrary values for tokens that should be design-system (`text-[#ff0000]` → use `text-red-500`).

## References

- ADRs: [docs/agile/decisions/](../../../../docs/agile/decisions/)
