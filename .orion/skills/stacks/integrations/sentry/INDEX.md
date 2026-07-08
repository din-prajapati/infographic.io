---
title: Sentry Skill Pack — v0.2 (Planned)
type: skill-pack-index
layer: integrations
tech: sentry
tags: [orion, skills, sentry, observability, v0.2]
updated: 2026-05-21
---

# Sentry Skill Pack

> **Status:** 🔲 Planned for v0.2 — skeleton present, skill files not yet authored.

## Planned Skills
- `/sentry-link-release` — Wire current commit/release into Sentry deployment tracking
- `/sentry-test-event` — Send a test event to verify DSN + source maps
- `/sentry-redact-config` — Verify `beforeSend` redacts PII (emails, tokens, payment IDs)

## Loading
Auto-loads when `.orion/scaffold.json` declares `techs.integrations` includes `sentry`. Agents also auto-load `.orion/rules/integrations/sentry/RULES.md`.

## Contribute
See [docs/how-to/add-new-tech-stack-pack.md](../../../../docs/how-to/add-new-tech-stack-pack.md).
