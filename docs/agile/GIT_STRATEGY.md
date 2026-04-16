# Git Strategy — AI-Assisted Agile Development

> **Purpose:** Enforce traceability from `git log` → Task → Story → Milestone → Epic. Every commit names the story it serves; every PR is reviewable against ACs before merging.

---

## Branch Model

```
main ─────────────────────────────────────────────────── (protected, auto-deploys to Railway)
  │
  ├─ feat/design-us-design-002-editor-tokens   (story branch)
  ├─ feat/pay-us-pay-003-webhook-retry         (story branch)
  ├─ fix/auth-us-auth-001-token-refresh        (bug fix branch)
  └─ test/infra-us-infra-001-e2e-smoke         (test/infra-only branch)
```

### Rules
- `main` is the only long-lived branch. No `develop`, no `staging` branch.
- One branch per Story (or one branch per Task if a story spans independent PRs).
- Branch lives for exactly one PR — delete after merge.
- AI coding happens on the story branch. Never commit AI output directly to `main`.

---

## Branch Naming

```
{type}/{domain}-{story-slug}
```

| Type | When |
|------|------|
| `feat` | New capability |
| `fix` | Bug fix |
| `test` | Test-only changes |
| `docs` | Docs-only changes |
| `refactor` | Code restructure, no behavior change |
| `chore` | Tooling, deps, CI |

**Examples:**
```bash
feat/design-us-design-002-editor-tokens
feat/pay-us-pay-001-razorpay-checkout
fix/pay-us-pay-003-webhook-race
test/auth-us-auth-002-refresh-token
docs/agile-epic-design-01-story-cards
```

**Create the branch:**
```bash
git checkout main && git pull
git checkout -b feat/design-us-design-002-editor-tokens
```

---

## Commit Message Format

**Pattern:** `{type}({scope}): {what} — {story-id}`

```
feat(editor): replace hardcoded gray tokens with bg-background/muted — US-DESIGN-002
fix(payments): handle webhook PENDING→ACTIVE race condition — US-PAY-003
test(auth): add integration test for JWT refresh flow — US-AUTH-002
docs(agile): add EPIC-DESIGN-01 milestone and story structure — DESIGN-001
```

### Rules
- First line ≤ 72 characters
- Story ID always at the end after ` — `
- No ticket numbers in the subject line unless using Linear magic words (see below)
- Body is optional — use it for the "why" if not obvious from the AC
- Do **not** append tooling noise to the subject or body: no `Made-with: Cursor`, no `Co-authored-by: Cursor <…>`, and no similar Cursor-branded trailers. Keep messages human-reviewable and stable in `git log`.

### Stripping Cursor trailers from existing history (optional, local branch)

Prefer the **object-database rewrite** (works when `git filter-branch` refuses because `git update-index --refresh` marks the whole tree dirty on Windows):

```bash
git branch backup/my-branch-msg-before-rewrite my-branch
bash scripts/rewrite-commit-messages-strip-cursor.sh main my-branch
```

To remove a trailing `Made-with: Cursor` line from **HEAD** only (e.g. after a bad hook), from **Git Bash**:

```bash
bash scripts/strip-made-with-from-HEAD.sh
```

Alternative if you have a **clean** working tree: `git filter-branch` with `--msg-filter` and the same `sed` rules as in `scripts/rewrite-commit-messages-strip-cursor.sh`. See `git help filter-branch`.

Only rewrite branches you have **not** yet pushed, or coordinate a force-push with collaborators. Remove `refs/original/*` backup refs after `filter-branch` if you used it.

### Linear magic word in commit (auto-closes Linear issue on merge):
```
feat(editor): replace hardcoded gray tokens — US-DESIGN-002

Closes LIN-47
```

### Multi-task commit (rare — prefer atomic commits):
```
feat(editor): replace EditorToolbar + ZoomControls tokens — US-DESIGN-002

Tasks: T1, T2 of TASKS.md
Closes LIN-47
```

---

## PR Workflow

### 1. Open the PR

```bash
git push -u origin YOUR_BRANCH
gh pr create --base main --title "[US-…] …" --body-file docs/agile/epics/…/stories/US-…/PR_BODY.md
```

**Full workflow:** [docs/agile/guides/STORY_PR_WORKFLOW.md](guides/STORY_PR_WORKFLOW.md)  
**Templates:** [.github/pull_request_template.md](../.github/pull_request_template.md) · [.github/PULL_REQUEST_TEMPLATE/story.md](../.github/PULL_REQUEST_TEMPLATE/story.md)  
**US-DESIGN-002:** `npm run pr:open:us-design-002` (uses `PR_BODY.md` in that story folder)

Or use the inline PR description template below when not using `PR_BODY.md`.

### 2. PR Title Format
```
[{story-id}] {short title}
```
Examples:
```
[US-DESIGN-002] Editor design token replacement
[US-PAY-003] Webhook PENDING→ACTIVE race condition fix
[US-AUTH-002] JWT refresh token integration test
```

### 3. PR Description Template

Paste this into the PR body (fill from STORY.md + TASKS.md):

```markdown
## Story
**[US-{DOMAIN}-{NNN}]({story-path})** — {short title}
**Epic:** EPIC-{DOMAIN}-{NN} | **Milestone:** M-{DOMAIN}-{NN}-{slug}
**Linear:** LIN-XXX

## What & Why
{one paragraph — same as story's "So that" clause}

## Acceptance Criteria
- [ ] AC1: {copy from STORY.md}
- [ ] AC2: …

## Files Changed
| File | Task | AC |
|------|------|----|
| `path/to/file.tsx` | T1 | AC1, AC2 |

## Test Commands
\```bash
npm run check           # TypeScript — must pass
npm run test:unit       # unit tests — must pass
\```
Manual: {what to click/verify on localhost:5000}

## Out of Scope
{copy "Out of scope" from STORY.md}

🤖 AI-assisted via Claude Code · Closes LIN-XXX
```

### 4. Review Checklist (before merging)
- [ ] Each AC checkbox verified (not just "looks done")
- [ ] `npm run check` passes in CI or locally
- [ ] `npm run test:unit` passes
- [ ] No unintended files staged (`git diff --name-only origin/main`)
- [ ] PR description has story card + AC checklist
- [ ] STORY.md ACs updated with ✅ or 🔲

---

## GitHub Labels

Set these up once in the repo (`gh label create`):

### Domain labels (map to Epic domains)
```
epic:design     #6366f1   purple
epic:payments   #22c55e   green
epic:auth       #f59e0b   amber
epic:editor     #06b6d4   cyan
epic:ai         #ec4899   pink
epic:infra      #94a3b8   gray
epic:org        #f97316   orange
```

### Type labels
```
type:feat       #3b82f6   blue
type:fix        #ef4444   red
type:test       #84cc16   lime
type:docs       #a8a29e   stone
type:chore      #d4d4d4   neutral
```

### Status labels
```
status:in-progress    #fbbf24
status:needs-review   #60a5fa
status:blocked        #f87171
status:ready-to-merge #4ade80
```

### Priority labels
```
priority:P0   #dc2626   (launch blocker)
priority:P1   #f97316   (pre-GA)
priority:P2   #facc15   (nice-to-have)
```

**Apply to PR on open:**
```bash
gh pr edit {PR-number} --add-label "epic:design,type:feat,priority:P1"
```

---

## Linear ↔ GitHub Integration

### Setup (one-time)
1. In Linear: **Settings → Integrations → GitHub** → connect repo
2. Enable: "Sync PR status" + "Auto-close issues on merge"
3. In Linear: set branch naming template to match this guide

### Workflow
```
Linear issue (LIN-47)          GitHub PR (#23)
  title: [US-DESIGN-002] …   ←→  title: [US-DESIGN-002] …
  status: In Progress         ←→  branch opened
  status: In Review           ←→  PR opened (draft → ready)
  status: Done                ←→  PR merged (via "Closes LIN-47")
```

### Branch from Linear (optional, for clean traceability)
In Linear, open the issue → "Create branch" → copy the auto-generated branch name.  
It will follow `feat/lin-47-us-design-002-editor-tokens` — rename to match this guide's convention if needed.

### Commit reference formats Linear recognizes
```
Closes LIN-47       → closes the issue on merge
Fixes LIN-47        → same
Relates to LIN-47   → links without closing
```

---

## Protected Branch Rules (GitHub Settings)

For `main`:
- ✅ Require PR before merging
- ✅ Require 1 approving review (or waive for solo — but at least require CI)
- ✅ Require status checks: `test:unit` (if CI configured)
- ✅ No force-push
- ✅ No direct commits
- ✅ Delete head branch after merge

---

## Atomic Commit Discipline

**One commit = one task from TASKS.md** (preferred):
```bash
git add client/src/components/editor/EditorToolbar.tsx
git commit -m "feat(editor): EditorToolbar bg-gray-900 → bg-background — US-DESIGN-002"

git add client/src/components/editor/ZoomControls.tsx
git commit -m "feat(editor): ZoomControls token replacement — US-DESIGN-002"
```

**Why atomic:** If a regression appears, `git bisect` identifies the exact file. AI-generated changes are easier to review file-by-file.

**Squash on merge:** For AI sessions that produce many micro-commits, squash into one clean commit per story on merge:
```
feat(editor): replace hardcoded gray tokens with design system vars — US-DESIGN-002 (#23)
```

---

## AI-Session Git Checklist

Before starting an AI session:
```bash
git checkout main && git pull
git checkout -b feat/{domain}-{story-slug}
```

During the session:
```bash
# Stage specific files only — never git add -A
git add path/to/changed/file.tsx
git commit -m "feat(scope): description — US-XXX-NNN"
```

After the session, before PR:
```bash
npm run check          # TypeScript must pass
npm run test:unit      # unit tests must pass
git diff origin/main --name-only   # verify only expected files changed
git log --oneline origin/main..HEAD   # review all commits in this branch
```

---

## Hotfix Flow

For production bugs (skip story process — but link story retroactively):

```bash
git checkout main && git pull
git checkout -b fix/{domain}-{short-description}
# ... fix ...
git commit -m "fix({scope}): {what was broken and why} — {ticket or PT-XX}"
gh pr create --title "hotfix: {description}" --label "type:fix,priority:P0"
# Merge immediately after CI green + manual verify
```

---

*See also: [AGILE_INDEX.md](AGILE_INDEX.md) · [LINEAR_GITHUB.md](LINEAR_GITHUB.md) · [../workflow/AGILE_AI_WORKFLOW.md](../workflow/AGILE_AI_WORKFLOW.md)*
