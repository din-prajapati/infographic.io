---
title: Razorpay Skill Pack — v0.2 (Planned)
type: skill-pack-index
layer: integrations
tech: razorpay
tags: [orion, skills, razorpay, payments, v0.2]
updated: 2026-05-21
---

# Razorpay Skill Pack

> **Status:** 🔲 Planned for v0.2 — skeleton present, skill files not yet authored.

## Planned Skills
- `/verify-payments` — Verify webhook signatures + reconcile against DB
- `/test-webhook` — Send a signed test webhook to local dev server
- `/razorpay-recon` — Reconcile Razorpay payment IDs against DB transactions

## Loading
Auto-loads when `.orion/scaffold.json` declares `techs.integrations` includes `razorpay`. Agents also auto-load `.orion/rules/integrations/razorpay/RULES.md`.

## Contribute
See [docs/how-to/add-new-tech-stack-pack.md](../../../../docs/how-to/add-new-tech-stack-pack.md).
