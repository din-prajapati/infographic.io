---
title: Backend Rules
type: rules
layer: backend
tags: [orion, rules, backend]
updated: 2026-05-20
---

# Backend Rules

> Cross-tech backend conventions. Tech-specific rules in `backend/<tech>/RULES.md`.

## Conventions

- [ ] **Idempotency for writes** — repeat the same request → same outcome. Especially webhooks and external integrations.
- [ ] **Error contracts:** `{code, message, details}` shape; never leak stack traces to clients.
- [ ] **HTTP status semantics honored.** 4xx = client problem, 5xx = server problem.
- [ ] **Validate at the edge.** DTOs / Pydantic / Zod validate before reaching service layer.
- [ ] **Auth before business logic.** Middleware/guards run first; service assumes authenticated.
- [ ] **Transactions for multi-write operations** — never leave the DB in a partial state.

## Anti-patterns

- [ ] Don't trust `user_id` from the client when the session carries one.
- [ ] Don't do business logic in controllers — push to a service.
- [ ] Don't catch + swallow — log, classify, rethrow or convert to a typed error.
- [ ] Don't issue N+1 queries in a request path — batch or use joins/include.

## References

- ADRs: [docs/agile/decisions/](../../../docs/agile/decisions/)
