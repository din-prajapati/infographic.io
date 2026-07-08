---
title: S{NN} — {Session Title}
type: session
session_id: S{NN}
date: {YYYY-MM-DD}
slug: {kebab-case-slug}
status: planned   # planned | in-progress | closed
project: {project-name}
tags: [{project}, session, {topic}]
---

# S{NN} — {Session Title} ({YYYY-MM-DD})

> {One-sentence framing: what this session is for.}

---

## Context Snapshot

| Aspect | State at session open |
|---|---|
| **ORION version** | v{X.Y.Z} |
| **Branch at open** | `{branch}` |
| **Active milestone** | `{M-DOMAIN-NN-slug}` |
| **Stories in flight** | {US-IDs or "none"} |
| **Open blockers** | {summary or "none"} |

---

## Planned Focus

1. ▶ {Primary deliverable for this session}
2. ▶ {Secondary deliverable, if time}
3. ▶ {Decision to make, if any}

---

## Exit Criteria — "S{NN} done when…"

- [ ] {Concrete deliverable 1}
- [ ] {Gate 1 green on the relevant commit}
- [ ] {STORY.md/TASKS.md updated}
- [ ] This session's `<!-- ai-sdlc:session-log -->` entry in TEAM_STATUS.md is updated by `stop-session-summary.sh`

---

## References (open these first if needed)

- `docs/agile/memory/MEMORY.md` — project memory index
- `docs/agile/TEAM_STATUS.md` — current state
- {STORY.md path}
- {Any ADR or external doc relevant to this session}

---

<!-- ─────────────────────────────────────────────────────────────────────────
     The rest of the file is filled at session CLOSE.
     ───────────────────────────────────────────────────────────────────── -->

## What was shipped

### Code

- {US-ID — title} {✅ | ⚠ | ❌}
  - {file.ext}: {what changed}
  - {AC verification, Gate 1 result}
  - {PR # or "deferred — reason"}

### Standards / decisions (project-wide)

- {Any convention adopted, scope changed, or memory written}

### Branch state at session close

- **Branch:** `{branch}`
- **Commits (newest first):**
  - `{sha}` {commit subject}
  - `{sha}` {commit subject}

---

## Decisions made (worth surfacing for future-me)

1. {Decision} → {linked memory or ADR}
2. {Decision} → {linked memory or ADR}

---

## Open items / carry-over to S{NN+1}

- [ ] {Next move, with context}
- [ ] {Blocker that didn't resolve, with options}
- [ ] {Cross-repo carry-forward note, if any}

---

## Quick-start for S{NN+1} (first move tomorrow)

```text
1. Open this file. Scan "Open items".
2. Confirm branch: git status → expected: {branch}, clean.
3. {First concrete action}.
4. {Second action}.
```

---

*Session closed {YYYY-MM-DD}. Next session: S{NN+1} ({next focus}).*
