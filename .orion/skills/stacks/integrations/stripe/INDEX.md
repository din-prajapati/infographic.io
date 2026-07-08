---
title: Stripe Skill Pack — v0.2 (Planned)
type: skill-pack-index
layer: integrations
tech: stripe
tags: [orion, skills, stripe, payments, v0.2]
updated: 2026-05-21
---

# Stripe Skill Pack

> **Status:** 🔲 Planned for v0.2 — skeleton present, skill files not yet authored.

## Planned Skills
- `/setup-stripe` — Bootstrap Stripe SDK + webhook handler
- `/test-webhook` — Send a signed Stripe test webhook to local dev
- `/stripe-recon` — Reconcile Stripe charges/invoices against DB

## Loading
Auto-loads when `.orion/scaffold.json` declares `techs.integrations` includes `stripe`. Agents also auto-load `.orion/rules/integrations/stripe/RULES.md`.

## Contribute
See [docs/how-to/add-new-tech-stack-pack.md](../../../../docs/how-to/add-new-tech-stack-pack.md).
