---
name: review-pr
version: 1.0.0
description: >
  Stage 6 of the AI-SDLC pipeline. Invoke reviewer-agent to review a PR against
  its STORY.md contract. Returns AC coverage, scope, quality, security verdict.
  Optionally posts the review to GitHub.
triggers:
  - "review pr"
  - "review this branch"
  - "review PR"
  - "code review"
  - "pr review"
domains:
  - all
agents:
  - reviewer-agent
---

# Skill: review-pr

## Purpose

Run an independent review of a PR against its STORY.md contract. Catches scope creep, missing test coverage, security issues, and quality regressions before a human reviewer wastes time on the same things.

## Input

Required (one of):
- **PR number** (e.g., `#42`) — fetches via `gh`
- **Branch name** — diffs against `main`

Optional:
- **Post to GitHub:** `y | n` (default `n` — produces review text, asks before posting)

## Protocol

### Step 1 — Identify the Story

Get PR metadata:
```bash
gh pr view {PR-number} --json title,body,headRefName,files
# Or for branch: git log main..{branch} --oneline
```

Extract story ID from PR title (format `[US-DOMAIN-NNN] ...`). If not found, ask the human.

### Step 2 — Load Context

Read:
- The story's STORY.md (the contract)
- The story's TASKS.md (the file list and test commands)
- The story's `scaffold.json` — declared `touches.layers` and `rules_loaded`
- Each file in `rules_loaded` — these are the rules the diff is judged against
- The PR diff: `gh pr diff {PR-number}` or `git diff main...{branch}`
- PROJECT_CONTEXT.yaml — for stack-specific rules

### Step 2.5 — Scope-Drift Soft Check

Compare diff file paths against the story's `scaffold.touches.layers`. If the diff touches files in layers not declared in scaffold.json:

- This is **soft drift** — flag it as a finding in the verdict, do NOT block.
- Example: scaffold says `layers: [backend, database]` but diff modifies `apps/web/...` files.
- Reviewer asks the author: "Was this intentional? If yes, update scaffold.json. If no, split into a separate story."

### Step 3 — Invoke reviewer-agent

```
reviewer-agent: review PR {PR-number} against US-{ID}

Pre-loaded:
  - STORY.md
  - TASKS.md
  - scaffold.json (touches.layers + rules_loaded)
  - All RULES.md files in rules_loaded
  - PR diff
  - PROJECT_CONTEXT.yaml.agent_flags.reviewer

Seven-dimension review:
  1. AC Coverage
  2. Scope Discipline (files in TASKS.md)
  3. Layer Drift (files inside scaffold.touches.layers) — SOFT
  4. Test Evidence
  5. Code Quality
  6. Security (cross-checked against .orion/rules/SECURITY.md)
  7. Stack-Specific (against loaded layer/tech RULES.md)
```

### Step 4 — Display Verdict

```
PR #{number} Review — US-{ID}

Verdict: 🟢 APPROVE | 🟡 REQUEST CHANGES | 🔴 BLOCK

Six dimensions:
  AC Coverage:    ✅
  Scope:          ⚠️ (2 files outside TASKS.md)
  Test Evidence:  ✅
  Code Quality:   ⚠️ (1 Required)
  Security:       ✅
  Stack:          ✅

Findings:
  🔴 Blockers ({N})
    [file:line] {issue} — {resolution}
  🟡 Required ({N})
    [file:line] {issue} — {resolution}
  ⚪ Suggestions ({N})
    [file:line] {suggestion}
  💚 Praise ({N})
    [file:line] {what was good}
```

### Step 5 — Optional GitHub Post

If user requests, post the review:

```bash
gh pr review {PR-number} \
  --request-changes \
  --body-file review.md
```

Use the appropriate flag based on verdict:
- APPROVE → `--approve`
- REQUEST CHANGES → `--request-changes`
- BLOCK → `--comment` (block in body text — GitHub doesn't have a "block" verdict)

Ask before posting: "Post this review to GitHub? (y/n)"

### Step 6 — Print Next Action

```
Review complete for PR #{number}.

{If APPROVE:} 🟢 Ready to merge. Suggest /ship-it after merge.
{If REQUEST CHANGES:} 🟡 Author needs to address {N} items before merge.
{If BLOCK:} 🔴 Cannot merge. Critical issues must be resolved.
```

## Edge Cases

| Situation | Rule |
|-----------|------|
| PR title has no story ID | Ask user to provide it. Do not invent. |
| Multiple stories in one PR | Review against all referenced stories. Flag as suspicious. |
| Diff is huge (>1000 lines) | Note in summary. Suggest splitting in future. Still review. |
| Story is `🔲 Not Started` | Inconsistent with an open PR. Flag this. |
| Tests run on PR — failing | Block. Tests must pass before merge. |

## Skipping This Step

You can merge without `/review-pr` if:
- Hotfix < 5 lines, well-scoped
- Doc-only PR
- Revert of a recent merge

For everything else, run this skill. It catches what tired humans miss.

---

*Skill version: 1.0.0 | Created: 2026-05-18*
