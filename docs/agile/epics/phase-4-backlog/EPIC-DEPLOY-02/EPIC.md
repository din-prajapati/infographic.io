---
title: EPIC-DEPLOY-02 — Deployment Velocity (remainder)
type: epic
tags: [orion, epic, deploy, backlog]
updated: 2026-10-29
---

# EPIC-DEPLOY-02 — Deployment Velocity (remainder)

> **Phase:** Phase 4 Backlog — created 2026-10-29 to hold the open stories of [EPIC-DEPLOY-01](../../phase-1-ai-core/EPIC-DEPLOY-01/EPIC.md),
> which closed at Phase 1 scope ([ADR-003](../../../decisions/ADR-003-phase-1-close-and-phase-1.5.md))
> **Status:** 🔲 Not Started
> **Trigger:** pull a story forward when its pain is real — e.g. BL-36 (staging scale-to-zero breaks cold E2E) for the CI gate

## Stories

| Story | Title | Size | Status |
|-------|-------|:----:|:------:|
| [US-DEPLOY-001](stories/US-DEPLOY-001/STORY.md) | Harden the CI gate (fast, mandatory, + E2E) | S | 🔲 |
| [US-DEPLOY-002](stories/US-DEPLOY-002/STORY.md) | Preview environment per PR (Railway PR env + Neon branch) | L | 🔲 |
| [US-DEPLOY-003](stories/US-DEPLOY-003/STORY.md) | Feature-flag mechanism (env-var first, table later) | S | 🔲 |
| [US-DEPLOY-005](stories/US-DEPLOY-005/STORY.md) | Progressive delivery + auto-rollback (canary, health-gated) | M | 🔲 |
| [US-DEPLOY-006](stories/US-DEPLOY-006/STORY.md) | Approval governance — RACI, required checks, runbook (solo → team) | S | 🔲 |

The cards are unchanged from EPIC-DEPLOY-01 (written 2026-07-13); re-check them against today's pipeline before implementing —
both environments deploy from `main` (BL-35) and migrations already run as a `preDeployCommand` (US-DEPLOY-004).
