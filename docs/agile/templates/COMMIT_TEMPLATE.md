---
title: Commit Template — US-{DOMAIN}-{NNN}
type: template
tags: [orion, template]
updated: 2026-05-21
---

# Commit Template — US-{DOMAIN}-{NNN}

> Generated per story by `/new-story`. Pre-fills the commit conventions for this story's PR so
> code-agent (and humans) can produce identical, story-tagged commits without thinking.

---

## Story commit format

Reads from `PROJECT_CONTEXT.yaml.git.commit_format`:

```
{type}({scope}): {summary} — US-{DOMAIN}-{NNN}
```

| Token | Allowed values | Notes |
|-------|----------------|-------|
| `{type}` | `feat` · `fix` · `ops` · `test` · `chore` · `docs` · `refactor` | Match the TASKS.md task's `Type:` field |
| `{scope}` | `{scope-from-this-story}` | Lower-kebab; pick the dominant module touched |
| `{summary}` | ≤ 60 chars, imperative | "add X", "fix Y", not "added/fixed" |
| `US-{DOMAIN}-{NNN}` | Always the parent story ID | Enables `gh pr view` cross-link |

---

## Per-task commit blocks

> One block per T# in TASKS.md. code-agent uses these verbatim.

### T1 — {Task title}
```
feat({scope}): {one-line summary} — US-{DOMAIN}-{NNN}
```

### T2 — {Task title}
```
fix({scope}): {one-line summary} — US-{DOMAIN}-{NNN}
```

### T3 — {Test task}
```
test({scope}): {one-line summary} — US-{DOMAIN}-{NNN}
```

---

## Squash-merge commit (for the PR itself)

When the PR squash-merges, GitHub will use the PR title. The PR title format is:

```
[US-{DOMAIN}-{NNN}] {short title}
```

…and the PR body lives in [PR_BODY.md](./PR_BODY.md).

---

## Branch name

```
{auto-derived from PROJECT_CONTEXT.yaml.git.branch_format}
```

Default branch_format: `feat/{domain-lower}-{story-id-lower}-{slug}`

---

*Generated per story by story-writer. Edit only if PROJECT_CONTEXT.yaml conventions change.*
