---
title: Railway Skill Pack — v0.2 (Planned)
type: skill-pack-index
layer: platform
tech: railway
tags: [orion, skills, railway, deploy, v0.2]
updated: 2026-05-21
---

# Railway Skill Pack

> **Status:** 🔲 Planned for v0.2 — skeleton present, skill files not yet authored.

## Planned Skills
- `/deploy-railway` — Deploy to Railway with pre-flight Gate 4 (health check)
- `/railway-logs` — Tail logs for a service with grep
- `/railway-env-sync` — Compare local `ENV.yaml` against Railway dashboard vars

## Loading
Auto-loads when `.orion/scaffold.json` declares `techs.platform` includes `railway`. Agents also auto-load `.orion/rules/platform/railway/RULES.md`.

## Contribute
See [docs/how-to/add-new-tech-stack-pack.md](../../../../docs/how-to/add-new-tech-stack-pack.md).
