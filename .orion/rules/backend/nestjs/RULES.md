---
title: NestJS Rules
type: rules
layer: backend
tech: nestjs
tags: [orion, rules, backend, nestjs]
updated: 2026-05-20
---

# NestJS Rules

## Conventions

- [ ] **Module per feature** — `auth`, `billing`, `lead` each get their own module.
- [ ] **Controllers HTTP-thin** — extract logic to service.
- [ ] **DTOs with `class-validator`** for every endpoint input.
- [ ] **Providers `@Injectable()`** — never instantiate manually.
- [ ] **Guards for auth, Interceptors for cross-cutting** (logging, timeouts), Pipes for transform.
- [ ] **Use `ConfigService` for env vars** — never `process.env` directly in services.

## Anti-patterns

- [ ] Don't share state in services — they're singletons; mutable state leaks across requests.
- [ ] Don't catch errors in controllers — let a global filter handle them.
- [ ] Don't put DB queries in controllers — services own data access.

## References

- ADRs: [docs/agile/decisions/](../../../../docs/agile/decisions/)
