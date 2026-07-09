# Project Memory Index

> Single source of truth for persistent project memory.
> Surfaced at session start by `.claude/hooks/session-start-recall.sh`.
> Do **not** mirror these files to `~/.claude/projects/.../memory/` — in-repo is the source of truth for this project.

> **How to use:**
> - To add a memory, create `docs/agile/memory/<type>_<slug>.md` and add a one-line bullet under the matching section below.
> - Bullet format: `- [Short title](file.md) — one-line hook (≤150 chars total)`.
> - Keep this file an *index*, not the memory itself. Long-form content lives in the linked files.
> - Update or remove entries that turn out to be wrong or outdated.

## Feedback (rules to apply)

> Guidance from the user/team about how to approach work — what to do AND what to avoid.

_(none yet — examples: "no AI/tool trailers in commits", "integration tests must hit a real DB", "prefer one bundled PR over many small ones for refactors")_

## Project (active context, decays fast)

> Who is doing what, why, by when. Convert relative dates to absolute when saving.

_(none yet — examples: "merge freeze starts 2026-03-05 for mobile release cut", "auth rewrite is driven by compliance, not tech debt")_

## Reference (where to find things outside the repo)

> Pointers to external systems and dashboards.

_(none yet — examples: "bugs tracked in Linear project INGEST", "oncall watches grafana.internal/d/api-latency")_

## User (the human's role + preferences)

> Role, expertise, working style — informs how to frame explanations and trade-offs.

_(none yet — examples: "senior backend engineer, new to React in this repo", "prefers terse responses with no trailing summaries")_
