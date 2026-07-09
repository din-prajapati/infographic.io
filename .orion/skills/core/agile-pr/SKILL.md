---
name: agile-pr
version: 1.0.0
description: >
  Create a GitHub PR for the current story. Reads STORY.md and TASKS.md,
  runs Gate 1, builds the gh pr create command with full agile context,
  applies labels from PROJECT_CONTEXT.yaml, and opens the PR.
triggers:
  - "open pr"
  - "create pr"
  - "open pull request"
  - "agile pr"
  - "pr for story"
  - "ready to pr"
domains:
  - all
---

# Skill: agile-pr

## Purpose

Create a GitHub PR fully traceable to its story, pre-filled with AC checklist, test evidence, and agile metadata. Enforces Gate 1.

## Input

Required:
- **Story ID**

Optional:
- **PR type:** feat | fix | test | refactor | docs (default feat)
- **Priority:** P0 | P1 | P2 (default P1)

## Protocol

### Step 1 — Read Story Context

Read STORY.md (title, ACs, out-of-scope, Linear) and TASKS.md (branch, scope, tasks).

Validate:
- STORY.md exists
- Branch set in TASKS.md
- At least one task checked

### Step 2 — Enforce Gate 1

Run mandatory gates from `PROJECT_CONTEXT.yaml.gates[id=1].commands`:

```
⚠️ Gate 1 commands:
  - {gate 1 command 1}
  - {gate 1 command 2}
Have both passed? (y/n)
```

If no → STOP.

### Step 3 — Verify Branch

```bash
git branch --show-current
```

Should match TASKS.md branch name from `PROJECT_CONTEXT.yaml.git.branch_format`.

### Step 4 — Build PR Body

Use `{paths.templates}/PR_BODY.md` template. Populate from STORY.md:
- Story summary
- ACs with check state
- Out-of-scope (literal)
- Test evidence (gate results)
- Files changed (from TASKS.md)
- DoD checklist state

### Step 5 — Generate gh Command

```bash
gh pr create \
  --title "[{US-ID}] {title}" \
  --base {git.default_branch} \
  --label "{rendered labels from PROJECT_CONTEXT.yaml.git.pr_labels}" \
  --body "$(cat <<'EOF'
{pr body}
EOF
)"
```

Print for user review. Ask: "Run? (y/n)"

### Step 6 — Update Story Files

After PR opens:
- STORY.md PR: `#_____` → `#{number}`
- TASKS.md PR: `#_____` → `#{number}`
- STORY.md status: 🔲 → 🟡 (if was Not Started)

### Step 7 — Print Summary

```
✅ PR Opened: #{number}
   Story: {US-ID} — {title}
   Branch: {branch} → {git.default_branch}
   Labels: {labels}
   
   STORY.md / TASKS.md PR fields → #{number}
   STORY.md status → 🟡 In Progress

   Next: /review-pr {number}    → reviewer-agent verdict
         /close-story {US-ID} #{number}  (after merge)
```

## Label Setup (one-time per repo)

```bash
gh label create "epic:{domain}"   --color "#6366f1"
gh label create "type:feat"       --color "#3b82f6"
gh label create "type:fix"        --color "#ef4444"
gh label create "priority:P0"     --color "#dc2626"
gh label create "priority:P1"     --color "#ea580c"
gh label create "priority:P2"     --color "#78716c"
```

## Edge Cases

| Situation | Rule |
|-----------|------|
| Gate 1 fails | STOP. Fix first. |
| No branch in TASKS.md | Generate standard name |
| `gh` not auth'd | Print `gh auth login` instruction |
| PR exists for branch | Print existing URL, offer description update |

---

*Skill version: 1.0.0 | Created: 2026-05-18*
