---
title: Security Rules
type: rules
layer: cross-cutting
tags: [orion, rules, security]
updated: 2026-05-20
---

# Security Rules

> Cross-cutting security baseline. Applies to every layer regardless of tech.

## Conventions

- [ ] **Secrets only in `.env*`** — never hardcoded, never logged, never committed.
- [ ] **Auth at the boundary** — every protected endpoint enforces the project auth strategy; never inside business logic.
- [ ] **Validate at trust edges** — sanitize all input from external sources (HTTP, queues, webhooks); trust internal calls.
- [ ] **Webhooks preserve raw body** for signature verification — never parse-then-verify.
- [ ] **CSRF / SameSite cookies** — set on all session-authenticated routes.
- [ ] **Rate-limit auth endpoints** — login, password reset, OTP — at minimum.
- [ ] **Time-bound tokens** — reset, invite, magic-link tokens expire ≤24h.

## Anti-patterns

- [ ] Don't put secrets in client-side bundles — even for "internal" tools.
- [ ] Don't log full request bodies on auth endpoints — redact tokens, passwords, OTPs.
- [ ] Don't bypass auth with feature flags — flags hide behavior, not access.
- [ ] Don't return generic 500 to the client when auth fails — return 401/403.
- [ ] Don't accept `user_id` from the client when the session has one — always use `req.user.id`.

## OWASP Top 10 — Quick Map

| Risk | Where we enforce |
|------|-------------------|
| Broken Access Control | Backend auth middleware + RBAC checks per resource |
| Crypto Failures | TLS-only; secrets via env; hashed passwords (bcrypt/argon2) |
| Injection | ORM with parameterized queries; input validation library |
| Insecure Design | Threat-modeled at architect-agent stage |
| Security Misconfiguration | `pre-edit-env-secret` hook + managed-settings deny list |

## References

- [pre-edit-env-secret.sh](../../.orion/hooks/pre-edit-env-secret.sh) — auto-blocks .env edits with real values
- ADRs on auth/security: [docs/agile/decisions/](../../docs/agile/decisions/)
