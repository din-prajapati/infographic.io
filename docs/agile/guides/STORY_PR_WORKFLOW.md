# Story PR workflow — open, review, merge

> **Audience:** Developers and AI sessions closing an agile **Story**  
> **Prerequisites:** [GIT_STRATEGY.md](../GIT_STRATEGY.md), story folder with `STORY.md` + `TASKS.md`  
> **Artifacts:** [`.github/pull_request_template.md`](../../../.github/pull_request_template.md) (default) · [`.github/PULL_REQUEST_TEMPLATE/story.md`](../../../.github/PULL_REQUEST_TEMPLATE/story.md) (story-shaped body)

---

## 0. In the AI-assisted agile cycle

This workflow is the **last mile of a Story**: implementation is on a branch; the PR is how code enters `main` and how reviewers see intent (body) tied to **STORY.md** acceptance criteria.

### Where it sits in the hierarchy

| Level | Artifact | AI role |
|-------|----------|--------|
| Phase / Epic / Milestone | `PHASE_TRACKER.md`, `EPIC.md`, `MILESTONE*.md` | Read for scope; human usually owns updates |
| **Story** | `STORY.md`, `TASKS.md` | **Brain + Muscle** — AI implements against ACs and file list |
| **PR** | `PR_BODY.draft.md` → GitHub PR | **Review surface** — AI drafts body; human **approves** before `gh`; then draft → ready → merge |

### End-to-end flow (mermaid)

```mermaid
flowchart TB
  subgraph plan["1. Plan & pick"]
    TS[TEAM_STATUS.md]
    ST[STORY.md + TASKS.md]
    MP[Milestone / PR-PLAN.md]
    TS --> ST
    MP --> ST
  end

  subgraph build["2. AI build"]
    BR[feat/… story branch]
    CM[Commits: type(scope): … — US-XXX]
    ST --> AI[Cursor / AI session]
    AI --> CM
    CM --> BR
  end

  subgraph prdraft["3. PR body — local first"]
    RES["npm run pr:story -- resolve US-…"]
    PDB[PR_BODY.draft.md]
    BR --> RES
    RES --> PDB
    AI --> PDB
  end

  subgraph approve["4. Human gate"]
    Q1{Approve PR body?}
    PDB --> Q1
    Q1 -->|no| PDB
  end

  subgraph github["5. GitHub — draft first"]
    PUSH[git push origin HEAD]
    Q1 -->|yes| PUSH
    PUSH --> DRAFT["npm run pr:story -- create … --draft"]
    DRAFT --> DPR[Draft PR: CI + early review]
  end

  subgraph ship["6. Ship"]
    Q2{Ready for reviewers / merge?}
    DPR --> Q2
    Q2 -->|ready for review| RDY["npm run pr:story -- promote N"]
    Q2 -->|merge| MERGE[Merge PR]
    RDY --> MERGE
    MERGE --> CL[HOW_TO_USE §7: STORY + EPIC + TEAM_STATUS]
  end
```

### How to use it (operator checklist)

1. **Planning:** Story appears under an epic/milestone (`TEAM_STATUS.md` → story card folder `docs/agile/epics/…/stories/US-…/`).
2. **Before AI:** `STORY.md` + `TASKS.md` complete ([HOW_TO_USE.md §5](../HOW_TO_USE.md#5-run-an-ai-session)).
3. **During AI:** Work on one **story branch**; commits end with ` — US-…` ([GIT_STRATEGY.md](../GIT_STRATEGY.md)).
4. **When code is ready:** Run checks (`npm run check`, `npm run test:unit`), then resolve the story path:  
   `npm run pr:story -- resolve US-DOMAIN-NNN`
5. **Draft PR text:** Either you edit `PR_BODY.draft.md`, or invoke the Cursor command **“Story PR: draft body → review → GitHub”** (`.cursor/commands/pr-story-draft-publish.md`) and give the **story id** + body (paste, file, or “from STORY.md”). The AI should **not** call `gh pr create` until you explicitly approve.
6. **Open GitHub Draft PR** (recommended): after approval,  
   `npm run pr:story -- create US-DOMAIN-NNN --title "[US-…] …" --draft`  
   Uses `PR_BODY.draft.md` by default (`--body-file` to override).
7. **After CI / review:** mark draft ready if you want the full “ready for review” signal:  
   `npm run pr:story -- promote <PR_NUMBER>`  
   Or merge the draft PR when policy allows.
8. **After merge:** follow [HOW_TO_USE.md §7](../HOW_TO_USE.md#7-close-a-story) (PR # in `STORY.md`, epic row, team board, milestone).

### Cursor artifacts (same cycle)

| Step | Use |
|------|-----|
| Rule (draft → approve → `gh`) | `.cursor/rules/pr-workflow.mdc` |
| Command (story id + body + gates) | `.cursor/commands/pr-story-draft-publish.md` |
| Quick path (body already in `PR_BODY.md`) | `.cursor/commands/pr-story-open.md` |

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

### Two-phase flow (recommended — GitHub draft PRs)

1. **Local draft:** Put markdown in `PR_BODY.draft.md` next to `STORY.md` (AI or human). Optionally seed from `PR_BODY.md`:

   ```bash
   node scripts/pr-story.mjs init-draft US-DOMAIN-NNN
   ```

2. **Review:** Edit `PR_BODY.draft.md`; get explicit approval to open on GitHub.

3. **GitHub — Draft PR** (CI can run; merge blocked until ready):

   ```bash
   git push -u origin HEAD
   node scripts/pr-story.mjs create US-DOMAIN-NNN --title "[US-DOMAIN-NNN] Short title" --draft
   ```

4. **Ready for review:** When approved, mark the draft ready (notifies reviewers as appropriate):

   ```bash
   node scripts/pr-story.mjs promote <PR_NUMBER>
   ```

5. **Skip draft** (only if the team wants a normal PR immediately):

   ```bash
   node scripts/pr-story.mjs create US-DOMAIN-NNN --title "[US-DOMAIN-NNN] Short title" --ready
   ```

**Script help:** `node scripts/pr-story.mjs` (no args prints usage). **Resolve story path:** `node scripts/pr-story.mjs resolve US-DOMAIN-NNN`.

### Body from a file (recommended)

Each story can ship **`PR_BODY.md`** (canonical) and/or **`PR_BODY.draft.md`** (work in progress) next to `STORY.md`:

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

## 5. Cursor: rule + commands

| Artifact | Path |
|----------|------|
| Rule (draft → approve → `gh`; story id) | [`.cursor/rules/pr-workflow.mdc`](../../../.cursor/rules/pr-workflow.mdc) |
| Command — **draft → review → GitHub** | [`.cursor/commands/pr-story-draft-publish.md`](../../../.cursor/commands/pr-story-draft-publish.md) |
| Command — quick open (body already final) | [`.cursor/commands/pr-story-open.md`](../../../.cursor/commands/pr-story-open.md) |

In Cursor, use the **Commands** palette and search for **PR story** or **draft publish**.

---

## 6. After merge

Follow [HOW_TO_USE.md §7](../HOW_TO_USE.md#7-close-a-story): update `STORY.md` (PR #), `EPIC.md`, `TEAM_STATUS.md`, milestone / `PR-PLAN` if applicable.

---

## 7. `package.json` shortcuts

```bash
npm run pr:story -- resolve US-DESIGN-002
npm run pr:story -- create US-DESIGN-002 --title "[US-DESIGN-002] …" --draft
```

Legacy one-story shortcut (US-DESIGN-002 only):

```bash
npm run pr:open:us-design-002
```
