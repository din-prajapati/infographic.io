---
title: Integrations Rules
type: rules
layer: integrations
tags: [orion, rules, integrations]
updated: 2026-05-20
---

# Integrations Rules

> Cross-vendor conventions for third-party APIs (payments, comms, error tracking, etc.). Vendor-specific rules live in `integrations/<vendor>/RULES.md`.

## Conventions

- [ ] **Webhook signature verification on every received event** — reject unsigned. Use the vendor's documented HMAC scheme.
- [ ] **Raw body preserved** for signature verification — middleware must not pre-parse JSON before the verify step.
- [ ] **Idempotency keys on every write** — store the vendor's transaction/event ID and dedupe on retry.
- [ ] **Vendor credentials via env vars** — never hardcoded; never committed.
- [ ] **Server-side authoritative state** — never trust client-supplied amounts, IDs, or status fields.
- [ ] **Vendor rate limits respected** — implement client-side backoff + circuit-breaker for hot paths.
- [ ] **Timeouts on every outbound call** — no default-infinite waits. ≤5s for sync, ≤30s for batch.

## Anti-patterns

- [ ] Don't skip signature verification "just for dev" — the dev path silently ships to prod.
- [ ] Don't log full webhook payloads — they routinely carry PII / payment data.
- [ ] Don't mix vendor SDK versions across services — pin one version per repo.
- [ ] Don't catch + ignore vendor errors — at minimum log with the vendor's request ID for support.

## References

- ADRs on integration choices: [docs/agile/decisions/](../../../docs/agile/decisions/)
- Vendor-specific rules: `razorpay/RULES.md`, `stripe/RULES.md`, `sentry/RULES.md`
