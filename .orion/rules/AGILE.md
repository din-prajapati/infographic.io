---
title: AGILE Workflow Rules
type: rules
layer: cross-cutting
tags: [orion, rules, agile, workflow, git]
updated: 2026-05-26
---

# AGILE Workflow Rules

> Team conventions for how we plan, slice, and ship work in an AI-native flow. Update as cadence stabilizes.

## Conventions

- **Story size:** Each story = one Claude session (≤4h work). Larger → split via story-writer.
- **DoD:** All ACs ✅, Gate 1 passes, milestone PR merged, TASKS.md fully checked. Non-negotiable.
- **Out-of-Scope is law.** code-agent never touches Out-of-Scope items, even "while we're here."
- **Test Is Truth.** Do not weaken or skip failing tests to make them pass. Fix the code.

## Anti-patterns

- Don't write a story without ACs — story-writer must fill INVEST criteria first.
- Don't carry forward unfinished stories across milestones — split or descope.
- Don't merge with Gate 1 failing, even temporarily — re-open the PR.
- Don't skip `/new-story` and jump straight to `/implement-story` — TASKS.md scope-locks the work.

## Estimation

- Effort estimates live in TASKS.md per-task, not in STORY.md.
- Stories without a Four-Pillars Pre-flight (Brain/Muscle/Map/Env) are not ready to implement.

---

## Git Standards (AI-native)

### Default branching unit: **milestone**

> A milestone is the demo-able unit of work (3–7 stories) defined under each epic. Match git to it.

**Why milestone, not story:**
- Stories in this codebase are XS–S, often sequential. Five PRs for five stories that all touch the same service is review-churn, not review-value.
- AI implements in minutes per task — the historical reason for very small branches (long-lived branches drift) does not apply at AI speed.
- The reviewer's natural unit is "did the tracker scaffold ship cleanly," not "did task T1 of story 1 land correctly."

### Branch naming

| Use case | Format | Example |
|---|---|---|
| Milestone work (default) | `feat/<domain-lower>/<milestone-slug>` | `feat/plat/m-01-tracker-scaffold` |
| XL story / parallel agents / risky one-off | `feat/<domain-lower>/<story-id-lower>-<slug>` | `feat/plat/us-plat-006-railway-deploy` |
| Hotfix | `hotfix/<domain-lower>/<slug>` | `hotfix/plat/pixel-double-fire` |
| Spike / experiment (never merges) | `spike/<slug>` | `spike/headless-claude` |

Milestone slug is the part of the milestone file name after the domain prefix — e.g., `M-PLAT-01-tracker-scaffold.md` → slug `m-01-tracker-scaffold`.

### Commits inside a milestone branch

- **Format:** `{type}({scope}): T{n} {summary} — {US-ID}` (Conventional Commits + task trace + story trace).
- **Granularity:** one commit per task in TASKS.md. This lets you bisect to a story and to a task.
- **Closeout commits** (status updates to STORY.md/TASKS.md) use `docs({scope}): close US-XXX-NNN — ...`.
- **No AI/tool attribution trailers.** Do not append `Co-Authored-By: Claude …`, `🤖 Generated with [Claude Code]`, or similar prefix/postfix to commit messages or PR bodies. Commits read as plain authored work.

### When to open the PR

- **Milestone branch:** when the milestone's "Acceptance" checklist is complete AND Gate 1 is green for the most recent commit. PR title: `[<milestone-id>] <milestone title>`. PR body: milestone doc + closed-stories table + Gate evidence.
- **Story escape-hatch branch:** when the story's ACs are complete and Gate 1 is green. PR title: `[<US-ID>] <story title>`. PR body: STORY.md.
- **Hotfix:** as soon as the fix passes Gate 1.
- **Spike:** never. Capture findings as an ADR or session note.

### Merge strategy

| Branch type | Strategy | Why |
|---|---|---|
| Milestone | **rebase-and-merge** | Preserves per-task and per-story commits on `main`. `git log --grep "US-PLAT-003"` still works after merge. |
| Story (escape hatch) | squash | One story = one squashed commit on `main`. |
| Hotfix | squash | Same as story. |

### Parallel agents inside a milestone

If multiple agents work the same milestone concurrently on independent stories:

1. Each agent uses a per-story branch off the milestone branch.
2. Each per-story branch PR merges *into* the milestone branch (squash).
3. The milestone branch PR merges into `main` (rebase).

Two-level merge keeps the milestone as the human review unit while unblocking parallel agents.

### Long-lived branches

- **`main`** only. There is no `develop` branch.
- Release tags (`v0.1.0`, `v0.2.0`, …) live on `main`.

### Closeout cascade

When a milestone PR merges:
1. All STORY.md statuses in the milestone → [DONE]
2. Milestone status → [DONE]
3. Parent epic's story table updates ✅
4. `docs/agile/TEAM_STATUS.md` records the merge
5. `docs/agile/ROADMAP.md` phase completion table updates

The `cascade-close-story.sh` hook (in `.claude/hooks/`) needs to be milestone-aware. Until then, run the closeout manually.

---

## References

- [PROJECT_CONTEXT.yaml](../../PROJECT_CONTEXT.yaml) — `git.*` keys are the machine-readable form of this policy.
- [NORTH_STAR.md](../../docs/NORTH_STAR.md) — vision + principles.
- ADRs: [docs/agile/decisions/](../../docs/agile/decisions/) — record any deviation from this standard with an ADR.
