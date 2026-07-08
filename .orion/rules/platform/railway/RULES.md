---
title: Railway Rules
type: rules
layer: platform
tech: railway
tags: [orion, rules, platform, railway]
updated: 2026-05-20
---

# Railway Rules

## Conventions

- [ ] **`railway.json` or `nixpacks.toml`** committed — reproducible builds.
- [ ] **One service per Railway project** — keep DBs and apps separate.
- [ ] **Env vars via Railway dashboard** — never commit to repo.
- [ ] **Use Railway's PostgreSQL** for app DB unless you have a reason not to.

## Anti-patterns

- [ ] Don't expose internal services publicly — use Railway private networking.
- [ ] Don't store secrets in service config — use shared variables / secret refs.

## References

- ADRs: [docs/agile/decisions/](../../../../docs/agile/decisions/)
