---
title: Prisma Skill Pack — v0.2 (Planned)
type: skill-pack-index
layer: database
tech: prisma
tags: [orion, skills, prisma, v0.2]
updated: 2026-05-21
---

# Prisma Skill Pack

> **Status:** 🔲 Planned for v0.2 — skeleton present, skill files not yet authored.

## Planned Skills
- `/new-model` — Add a Prisma model + generate migration
- `/db-migrate` — Run `prisma migrate dev` with safety checks
- `/db-audit` — Audit schema for missing indexes, N+1 risk, missing soft-delete

## Loading
Auto-loads when `.orion/scaffold.json` declares `techs.database` includes `prisma`. Agents also auto-load `.orion/rules/database/prisma/RULES.md`.

## Contribute
See [docs/how-to/add-new-tech-stack-pack.md](../../../../docs/how-to/add-new-tech-stack-pack.md).
