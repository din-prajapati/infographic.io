---
title: Story → PR Workflow
type: template
tags: [orion, template, workflow]
updated: 2026-05-21
---

# Story → PR Workflow

> The detailed flow from "I picked up a story" to "PR merged + story closed."
> Pairs with `HOW_TO_USE.md` (high-level) and `GIT_STRATEGY.md` (commit/branch conventions).

---

## The full path

```
1. Pick story            (TEAM_STATUS.md → US-ID)
2. Pre-flight check      (Four Pillars on TASKS.md)
3. Create branch         (auto-named from PROJECT_CONTEXT.yaml.git.branch_format)
4. Implement task-by-task (T1 → Tn, one commit per task)
5. Run gates             (Gate 1 always; Gate 2/3/4 per domain)
6. Tick ACs              (STORY.md checkboxes)
7. Update logs           (EPIC.md Implementation Update entry)
8. Open PR               (/agile-pr — uses PR_BODY.md)
9. Address review        (push fixes; never weaken tests)
10. Merge                (squash-merge per GIT_STRATEGY.md)
11. Close                (/close-story — cascades status)
```

---

## Step 1 — Pick story

Open `docs/agile/TEAM_STATUS.md`. In your domain's section:

- 🟡 **In Progress (Now)** — you're already on one of these
- 🔲 **Ready to Start (Next)** — pick the top row. pm-agent ordered it.
- ⏸ **Blocked** — only resume after the blocker line items clear.

Note the `US-ID` and open its STORY.md.

---

## Step 2 — Pre-flight check

Inside `docs/agile/epics/{phase}/{EPIC-ID}/stories/{US-ID}/`, open **TASKS.md** and confirm the Four Pillars:

- [x] **Brain** — STORY.md has filled ACs (not placeholders)
- [x] **Muscle** — TASKS.md has T1..Tn with files, type, ACs
- [x] **Map** — `../../ARCHITECTURE.mmd` is more than a stub
- [x] **Env** — `../../ENV.yaml` lists actual variables (or is N/A in TASKS.md)

If any unchecked: stop and run `/new-story <US-ID>` to fix the contract. **Don't code on a broken contract.**

---

## Step 3 — Create branch

The branch name is in TASKS.md (auto-derived). Default format:

```bash
git checkout main
git pull
git checkout -b feat/{domain-lower}-{story-id-lower}-{slug}
```

If `/implement-story` is driving, it runs these for you after confirming a clean working tree.

---

## Step 4 — Implement task by task

For each task block in TASKS.md:

1. **Read** the target file end-to-end before editing
2. **Apply** only the changes in that task's "Changes" list
3. **Run** Gate 1 commands locally
4. **Tick** the task's checkbox in TASKS.md
5. **Commit** using the exact command block from COMMIT_TEMPLATE.md:

```bash
git add <file>
git commit -m "{type}({scope}): {summary} — US-{DOMAIN}-{NNN}"
```

Stop and ask if uncertain — never guess on the contract's behalf.

---

## Step 5 — Run gates

From `PROJECT_CONTEXT.yaml.gates`:

```bash
# Gate 1 (always)
npm run check
npm run test:unit

# Gate 2 (frontend) — manual visual checklist
# Gate 3 (frontend / token / critical flow)
npm run test:e2e

# Gate 4 (backend)
curl -fsS http://localhost:3001/health
```

If any gate fails: fix the code. Do not modify the test to make it pass.

---

## Step 6 — Tick ACs

Open STORY.md. Mark each AC `[x]` only if a real test covers it (or you wrote it down in
"DoD exception" with a reason).

code-agent does this automatically when it implements the story.

---

## Step 7 — Update the EPIC log

Open `EPIC.md` (one folder up). Append a dated entry under "Implementation Update":

```markdown
### YYYY-MM-DD — US-{DOMAIN}-{NNN} ready to PR
- Files touched: `path/to/file.ext`, `path/to/another.ext`
- ACs covered: AC1, AC2, AC3
- Notes: {anything reviewers should know}
```

code-agent does this automatically; humans add manual entries for design decisions or follow-ups.

---

## Step 8 — Open PR

```bash
/agile-pr US-{DOMAIN}-{NNN}
```

This:
1. Pushes the branch
2. Uses `PR_BODY.md` (already drafted by story-writer)
3. Applies labels from `PROJECT_CONTEXT.yaml.git.pr_labels`
4. Sets the title `[US-{DOMAIN}-{NNN}] {short title}`
5. Returns the PR URL

---

## Step 9 — Address review

reviewer-agent posts six-dimension feedback (AC coverage, scope, tests, quality, security, stack rules).

Fix each Blocker / Required item. Push to the same branch:

```bash
git add <fixed files>
git commit -m "fix({scope}): address review — US-{DOMAIN}-{NNN}"
git push
```

Never weaken a test. If a test must change for a legitimate reason, document it in the PR description.

---

## Step 10 — Merge

When all gates pass and reviewer-agent approves:

- **Squash-merge** if `PROJECT_CONTEXT.yaml.git.squash_merge` is `true` (default)
- The PR title becomes the squash commit
- The branch is deleted automatically (or run `git branch -D <branch>` locally)

---

## Step 11 — Close

```bash
/close-story US-{DOMAIN}-{NNN} {PR-number}
```

This cascades:
- STORY.md → ✅ Done
- TASKS.md → PR # filled, tasks checked
- MILESTONE.md row → ✅; if all stories done, milestone → ✅
- EPIC.md row → ✅; "Implementation Update" closure entry appended
- TEAM_STATUS.md → moves from "Now" to "Done (last 7 days)"
- PHASE_TRACKER.md + AGILE_INDEX.md → counts updated

---

## Common pitfalls

| Pitfall | Why it hurts | Fix |
|---------|-------------|-----|
| Skipping the Four Pillars check | Code-agent invents requirements | Always confirm before coding |
| Touching files outside TASKS.md | Scope creep; reviewer blocks | Open a new story for the extra scope |
| Weakening a test to make it pass | Hides regressions | Fix the code or document an exception |
| Committing without `US-ID` in message | Breaks cross-link | Use COMMIT_TEMPLATE.md verbatim |
| Editing status emojis by hand in multiple files | Drift | Run `/close-story` and let it cascade |
| Force-pushing to `main` | Loses other people's work | Never. Only force-push to your story branch |

---

*Updated when the workflow itself changes. For story-specific details, see the story's own STORY.md / TASKS.md / PR_BODY.md.*
