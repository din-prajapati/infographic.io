# Story PR workflow — open, review, merge

> **Audience:** Developers and AI sessions closing an agile **Story**  
> **Prerequisites:** [GIT_STRATEGY.md](../GIT_STRATEGY.md), story folder with `STORY.md` + `TASKS.md`  
> **Artifacts:** [`.github/pull_request_template.md`](../../../.github/pull_request_template.md) (default) · [`.github/PULL_REQUEST_TEMPLATE/story.md`](../../../.github/PULL_REQUEST_TEMPLATE/story.md) (story-shaped body)

---

## 1. Before you open a PR

1. Branch name follows `docs/agile/GIT_STRATEGY.md` (e.g. `feat/design-us-design-002-editor-tokens`).
2. `git diff origin/main --name-only` matches the story scope (no accidental `git add .`).
3. Run from repo root:

```bash
npm run check
npm run test:unit
```

4. Optional: add or refresh `PR_BODY.md` in the story folder (see §4).

---

## 2. GitHub PR template (UI)

When you click **Open pull request** on GitHub:

- If a **template dropdown** appears, choose **story** for story work, or edit the default body.
- To open with the story template via URL (replace `OWNER/REPO` and branch):

`https://github.com/OWNER/REPO/compare/main...YOUR_BRANCH?expand=1&template=story.md`

---

## 3. Open a PR from the CLI (`gh`)

Install [GitHub CLI](https://cli.github.com/) and run `gh auth login` once.

### Title format

```text
[US-DOMAIN-NNN] Short title matching STORY.md
```

### Body from a file (recommended)

Each story can ship a prewritten `PR_BODY.md` next to `STORY.md`:

```powershell
# Windows (PowerShell), from repo root
git push -u origin HEAD
gh pr create --base main --title "[US-DESIGN-002] Editor + AI chat design tokens & dark-mode polish" --body-file "docs/agile/epics/EPIC-DESIGN-01/stories/US-DESIGN-002/PR_BODY.md"
```

```bash
# macOS / Linux / Git Bash
git push -u origin HEAD
gh pr create --base main --title "[US-DESIGN-002] Editor + AI chat design tokens & dark-mode polish" --body-file docs/agile/epics/EPIC-DESIGN-01/stories/US-DESIGN-002/PR_BODY.md
```

Or use the helper:

```powershell
.\scripts\open-story-pr.ps1 -Title "[US-DESIGN-002] Editor + AI chat design tokens & dark-mode polish" -BodyFile "docs/agile/epics/EPIC-DESIGN-01/stories/US-DESIGN-002/PR_BODY.md"
```

### Labels (optional)

```bash
gh pr create ... --label "type:feat,epic:design"
```

Label names must exist on the repo (see `GIT_STRATEGY.md` § GitHub Labels).

---

## 4. `PR_BODY.md` per story

**Location:** `docs/agile/epics/{EPIC}/stories/{US-ID}/PR_BODY.md`

**Purpose:** One file the reviewer reads on GitHub; keep it in sync with `STORY.md` for ACs and test plan.

**When to update:** Before `gh pr create`, or when amending a PR after review.

---

## 5. Cursor: rule + command

| Artifact | Path |
|----------|------|
| Rule (when to link story, how to title PR) | [`.cursor/rules/pr-workflow.mdc`](../../../.cursor/rules/pr-workflow.mdc) |
| Command (copy-paste steps / `gh` lines) | [`.cursor/commands/pr-story-open.md`](../../../.cursor/commands/pr-story-open.md) |

In Cursor, use the **Commands** palette and search for **PR story** (or open the command file).

---

## 6. After merge

Follow [HOW_TO_USE.md §7](../HOW_TO_USE.md#7-close-a-story): update `STORY.md` (PR #), `EPIC.md`, `TEAM_STATUS.md`, milestone / `PR-PLAN` if applicable.

---

## 7. `package.json` shortcut

```bash
npm run pr:open:us-design-002
```

Runs `gh pr create` with the US-DESIGN-002 title and `PR_BODY.md` (push first if needed).
