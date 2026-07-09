---
name: agile-pr
version: 1.0.0
description: >
  Create a GitHub PR for the current story. Reads STORY.md and TASKS.md,
  runs verification-gates Gate 1, builds the gh pr create command with full
  agile context (story ID, ACs, Linear link, labels), and opens the PR.
triggers:
  - "open pr"
  - "create pr"
  - "open pull request"
  - "agile pr"
  - "pr for story"
  - "ready to pr"
  - "submit pr"
domains:
  - all
---

# Skill: agile-pr

## Purpose

Create a GitHub PR that is fully traceable to its story, pre-filled with AC checklist,
test evidence, and agile metadata. Enforces Gate 1 before PR creation.

---

## Input

Required (ask if not provided):
- **Story ID:** `US-{DOMAIN}-{NNN}` (e.g., `US-AI-031`)

Optional:
- **PR type:** `feat | fix | test | refactor | docs` (default: `feat`)
- **Priority:** `P0 | P1 | P2` (default: `P1`)

---

## Protocol

### Step 1 — Read Story Context

Find and read:
1. `STORY.md` → Story title, ACs, out-of-scope, PR fields, Linear ID
2. `TASKS.md` → Branch name, PR scope one-liner, task checklist

Validate:
- STORY.md exists for this story ID
- Branch name is set in TASKS.md
- At least one task is checked in TASKS.md (implementation has started)

### Step 2 — Enforce Gate 1

Before creating the PR, Gate 1 MUST pass:

```bash
npm run check     # TypeScript — 0 new errors
npm run test:unit # Unit tests — all green
```

If the user has not confirmed Gate 1 passed, ask:
```
⚠️ Gate 1 check required before PR.
Run these commands and confirm they pass:
  npm run check
  npm run test:unit
Have both passed? (y/n)
```

If no → STOP. Do not create the PR.
If yes → proceed.

### Step 3 — Check Branch

```bash
git branch --show-current
```

Confirm the current branch matches TASKS.md branch name: `feat/{domain}-us-{domain}-{nnn}-{slug}`

If branch doesn't match, warn:
```
⚠️ Current branch ({current}) doesn't match TASKS.md branch ({expected}).
Confirm you want to open the PR from the current branch? (y/n)
```

### Step 4 — Build PR Body

Generate the PR body from STORY.md content:

```markdown
## {US-ID} — {Story Title}

> **Epic:** {EPIC-ID} · **Milestone:** {M-ID} · **Linear:** {LIN-ID}

### Story

*As a* {persona}
*I want* {capability}
*So that* {outcome}

### Acceptance Criteria

- [x] **AC1:** {text} ✅
- [x] **AC2:** {text} ✅
- [ ] **AC3:** {text} (verify manually on staging)

### Out of Scope

{paste out-of-scope list}

### Test Evidence

- `npm run check` — ✅ Passed
- `npm run test:unit` — ✅ Passed
- Manual flow on localhost:5000 — ✅ Verified: {brief description of what was verified}

### Files Changed

{list files from TASKS.md file-to-task mapping}

### Definition of Done

{paste DoD checklist from STORY.md with checked/unchecked state}

---

🤖 Generated with [Claude Code](https://claude.ai/code) | Skill: agile-pr
```

### Step 5 — Generate gh Command

```bash
gh pr create \
  --title "[{US-ID}] {story title}" \
  --base main \
  --label "epic:{domain-lowercase},type:{pr-type},priority:{P-N}" \
  --body "$(cat <<'EOF'
{pr body from Step 4}
EOF
)"
```

Print the command for user review before running.

Ask: "Run this gh pr create command? (y/n)"

If yes → execute and print the PR URL.
If no → print the command for manual execution.

### Step 6 — Update Story Files After PR Opens

Once PR is created (or user confirms it's open):

1. **STORY.md:** Fill in PR number: `**PR:** #_____` → `**PR:** #{number}`
2. **TASKS.md:** Fill in PR number field: `**PR:** #_____` → `**PR:** #{number}`
3. **STORY.md status:** If currently `🔲 Not Started` → update to `🟡 In Progress`

### Step 7 — Print PR Summary

```
✅ PR Opened: #{number}
   Story: {US-ID} — {title}
   Branch: {branch-name} → main
   Labels: epic:{domain}, type:{type}, priority:{P-N}
   
   Updated:
     ✅ STORY.md PR field → #{number}
     ✅ TASKS.md PR field → #{number}
     ✅ STORY.md status → 🟡 In Progress

   Next:
     • Request review if team PR workflow requires it
     • After merge → run /close-story {US-ID} #{number}
```

---

## PR Label Taxonomy

| Label | Values | Source |
|-------|--------|--------|
| `epic:` | domain lowercase (e.g., `epic:ai`, `epic:design`) | STORY.md Epic field |
| `type:` | `feat`, `fix`, `test`, `refactor`, `docs` | User input |
| `priority:` | `P0`, `P1`, `P2` | User input (default P1) |
| `size:` | `XS`, `S`, `M`, `L` | STORY.md Size field (add if set) |

---

## Edge Cases

| Situation | Rule |
|-----------|------|
| Gate 1 fails | STOP. Print exact error. Do not create PR. Fix, then retry. |
| Story has no branch in TASKS.md | Ask user for branch name. Generate the standard name: `feat/{domain}-us-{domain}-{nnn}-{slug}` |
| `gh` CLI not authenticated | Print: "Run `gh auth login` first, then retry." |
| PR already exists for this branch | gh will error. Print the existing PR URL. Ask if user wants to update the PR description instead. |
| Multiple stories in one branch (rare) | Include all US-IDs in PR title: `[US-AI-031, US-AI-032]` and all ACs. |

---

## GitHub Labels Setup

If labels don't exist yet, create them first:

```bash
# Create domain labels
gh label create "epic:ai"     --color "#6366f1" --description "AI domain epic"
gh label create "epic:design" --color "#f59e0b" --description "Design domain epic"
gh label create "epic:pay"    --color "#10b981" --description "Payments domain epic"

# Create type labels
gh label create "type:feat"     --color "#3b82f6" --description "New feature"
gh label create "type:fix"      --color "#ef4444" --description "Bug fix"
gh label create "type:test"     --color "#8b5cf6" --description "Test only"
gh label create "type:refactor" --color "#6b7280" --description "Refactor"

# Create priority labels
gh label create "priority:P0" --color "#dc2626" --description "Launch blocker"
gh label create "priority:P1" --color "#ea580c" --description "Important"
gh label create "priority:P2" --color "#78716c" --description "Nice to have"
```

---

*Skill version: 1.0.0 | Created: 2026-05-18*
