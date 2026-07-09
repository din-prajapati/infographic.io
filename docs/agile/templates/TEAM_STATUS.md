---
title: Team Status — Per-Domain Board
type: template
tags: [orion, template]
updated: 2026-05-20
---

# Team Status — Per-Domain Board

> **Audience:** Engineers, designers, QA — anyone implementing
> **Purpose:** Quick "what's now / next / blocked" view per domain
> **Update cadence:** Weekly or after each story close
> **Last updated:** YYYY-MM-DD

---

## Quick Scan

| Domain | Active Story | Status | Blocker? |
|--------|--------------|--------|:--------:|
| {DOMAIN} | {US-ID} — {title} | 🟡 | — |

---

## Domain: {DOMAIN_1}

### 🟡 In Progress (Now)
| Story | Title | Owner | Started | ETA | Progress |
|-------|-------|-------|:-------:|:---:|----------|
| US-{NNN} | {title} | {name} | YYYY-MM-DD | YYYY-MM-DD | T1✅ T2🟡 T3🔲 |

### 🔲 Ready to Start (Next)
| Story | Title | Size | Priority | Notes |
|-------|-------|:----:|:--------:|-------|
| US-{NNN} | {title} | M | P0 | {1-line context} |

### ⏸ Blocked
| Story | Title | Blocker | Owner | Action |
|-------|-------|---------|:-----:|--------|
| US-{NNN} | {title} | {description} | {name} | {what unblocks it} |

### ✅ Recently Closed (last 7 days)
| Story | Title | PR | Closed | Notes |
|-------|-------|:--:|:------:|-------|
| US-{NNN} | {title} | #{N} | YYYY-MM-DD | {1-line outcome} |

---

## Domain: {DOMAIN_2}

{repeat structure}

---

## Cross-Domain Initiatives

> Work that spans multiple domains — track here so no one drops the handoff.

| Initiative | Domains | Lead | Status | Notes |
|------------|---------|------|:------:|-------|
| {e.g., "Move to canonical schema"} | DB + API + Frontend | {name} | 🟡 | {context} |

---

## Recent Activity (Auto-Logged)

> Auto-appended by `stop-session-summary` hook at session end.
> Manually edit to consolidate or remove obsolete entries.

<!-- ai-sdlc:session-log -->

---

## How to Use This Board

| Action | When |
|--------|------|
| **Move story to In Progress** | When `git checkout -b feat/...` runs for it |
| **Move story to Blocked** | When `ISSUES.md` has 🔴 Blocker open |
| **Move story to Closed** | When `/close-story` runs (auto-cascade) |
| **Add to Ready to Start** | When STORY.md status is 🔲 AND Four Pillars Pre-flight checked |
| **Update Cross-Domain row** | When initiative status changes |
| **Clean Recent Activity** | Weekly — consolidate, keep last 7 entries |

---

*Maintained by humans + auto-appended by `stop-session-summary` hook*
