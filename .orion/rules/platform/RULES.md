---
title: Platform Rules
type: rules
layer: platform
tags: [orion, rules, platform, deployment, runtime]
updated: 2026-05-20
---

# Platform Rules

> Deployment + runtime conventions. Tech-specific in `platform/<target>/RULES.md`.

## Conventions

- [ ] **Health endpoint** `/health` returns 200 quickly; `/ready` checks downstream deps.
- [ ] **Graceful shutdown** — handle SIGTERM, drain in-flight requests, close DB pool.
- [ ] **Env validation at boot** — fail fast on missing required vars; never default secrets.
- [ ] **Build is immutable.** Promote the same artifact from dev → staging → prod.
- [ ] **Zero-downtime deploys** — blue-green or rolling; never "stop then start."

## Anti-patterns

- [ ] Don't deploy on Friday afternoon without on-call coverage.
- [ ] Don't run migrations during deploy — separate, observable step.
- [ ] Don't share secrets across environments.

## References

- ADRs on platform choice: [docs/agile/decisions/](../../../docs/agile/decisions/)
