---
title: Sentry Rules
type: rules
layer: integrations
tech: sentry
tags: [orion, rules, integrations, sentry, observability]
updated: 2026-05-20
---

# Sentry Rules

## Conventions

- [ ] **DSN via env vars** — different per environment.
- [ ] **Tag events** with `release`, `environment`, `userId`.
- [ ] **`beforeSend` redacts PII** — emails, tokens, payment IDs before send.
- [ ] **Source maps uploaded** on every release for readable stacks.
- [ ] **Sample rate by tier** — 100% errors, lower for transactions.

## Anti-patterns

- [ ] Don't capture every console.warn — noise drowns real issues.
- [ ] Don't ignore Sentry alerts as "always fires" — fix or filter.

## References

- ADRs: [docs/agile/decisions/](../../../../docs/agile/decisions/)
