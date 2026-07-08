---
title: Issues Log — US-{DOMAIN}-{NNN}
type: template
tags: [orion, template]
updated: 2026-05-20
---

# Issues Log — US-{DOMAIN}-{NNN}

> **Story:** [STORY.md](./STORY.md)
> **Purpose:** Track bugs, blockers, and findings discovered DURING implementation of this story.
> **Audience:** Whoever picks up this story next — including future-you.
>
> Items here are scoped to this story. Cross-story issues belong in the issue tracker (Linear / GitHub Issues).

---

## Active Issues

| ID | Severity | Type | Description | Discovered | Status | Resolution |
|----|:--------:|:----:|-------------|:----------:|:------:|------------|
| I-1 | 🔴 Blocker | Bug | {what's broken} | YYYY-MM-DD | Open | — |
| I-2 | 🟡 Required | Tech debt | {issue} | YYYY-MM-DD | Open | — |
| I-3 | ⚪ Minor | UX nit | {issue} | YYYY-MM-DD | Open | — |

**Severity:** 🔴 Blocker (story can't ship) · 🟡 Required (must fix this story) · ⚪ Minor (track, may defer)
**Status:** Open · In progress · ✅ Resolved · ⏸ Deferred (→ new story ID)

---

## Issue Detail

### I-1 — {Short title}

**Discovered:** YYYY-MM-DD during T{N} ({task title})
**Severity:** 🔴 Blocker

**What happened:**
{Specific reproduction steps — what was done, what was expected, what actually happened}

**Stack / file / line:**
- `path/to/file.ext:NN`
- Stack trace or error message

**Hypothesis:**
{Best guess at root cause — confirmed via inspection / log / test}

**Resolution options:**
1. **Option A** — {fix description}. Impact: {effort, blast radius}.
2. **Option B** — {alternative}. Impact: {effort, blast radius}.

**Decision:** {Chosen option + reason}

**Resolved by:** {file change / commit SHA / new story ID}

---

### I-2 — {Short title}
{repeat structure}

---

## Closed Issues (Archive)

| ID | Severity | Description | Resolved | Resolution |
|----|:--------:|-------------|:--------:|------------|
| I-{N} | | | YYYY-MM-DD | {1-line summary} |

---

## How to Use This File

- **Add an issue:** during implementation, when you hit a bug or blocker that affects THIS story
- **Resolve:** once fixed, move to Closed Issues with a 1-line resolution
- **Defer:** if not in scope, create a new story ID and link it
- **Cross-story bugs:** don't put them here — file in the project issue tracker

> If this file stays empty for a story, that's a good sign. Most stories ship without an ISSUES.md.

---

*Tracked by: humans during implementation | Read by: code-agent, reviewer-agent for context*
