# Linear + GitHub Integration Guide

> **Purpose:** Map the Agile hierarchy (Epic → Milestone → Story → Task → PR) onto Linear issues and GitHub branches/PRs so every delivery artifact is traceable in both tools.

---

## Hierarchy Mapping

| Agile Level | Linear | GitHub |
|-------------|--------|--------|
| **Epic** | Linear Epic | — (no direct GitHub equiv — tracked via labels) |
| **Milestone** | Linear Milestone / Project target | GitHub Milestone (optional) |
| **Story** | Linear Issue (type: Story) | PR — one PR per story |
| **Task** | Linear Sub-issue | Individual commits within the story branch |
| **PR** | Linear Issue (auto-linked via branch) | GitHub Pull Request |

---

## One-Time Setup

### 1. Install Linear GitHub App
1. Linear → **Settings → Integrations → GitHub**
2. Click **Connect** → authorize for your repo
3. Enable options:
   - ✅ Sync pull request status
   - ✅ Auto-close issues when PR merges
   - ✅ Create branches from issues

### 2. Configure Linear Project Structure
Create one **Linear Project** per Epic:

```
Linear Workspace: InfographicAI
  └── Project: EPIC-DESIGN-01 — MVP UI Design Consistency   (maps to Epic)
        Status: In Progress
        Target date: {milestone date}
        Members: Dinesh
        Issues:
          US-DESIGN-001 — Theme system works on all non-editor screens
          US-DESIGN-002 — Editor adopts design token colors
          US-DESIGN-003 — AI Generation flow has consistent UX states
          US-DESIGN-004 — All pages have consistent typography and nav
```

### 3. Set Linear Issue Labels
Mirror GitHub labels in Linear for status visibility:

```
epic:design · epic:payments · epic:auth · epic:editor · epic:ai · epic:infra
type:feat · type:fix · type:test · type:docs
priority:P0 · priority:P1 · priority:P2
```

### 4. Configure Branch Naming in Linear (optional)
Linear → Settings → Git → Branch format:
```
{type}/{linear-id}-{title-slug}
```
Example: `feat/lin-47-us-design-002-editor-tokens`

Rename to the canonical format from GIT_STRATEGY.md before pushing if you prefer the `feat/{domain}-{story-slug}` format.

---

## Day-to-Day Workflow

### Starting a Story

1. **In Linear:** Open the story issue → set status to **In Progress**
2. **In terminal:**
   ```bash
   git checkout main && git pull
   git checkout -b feat/design-us-design-002-editor-tokens
   ```
3. **In docs:** Open `docs/agile/epics/{EPIC-ID}/stories/{US-ID}/TASKS.md` — use as AI prompt

### Committing Work

Include the Linear issue ID to create a link without closing it:
```bash
git commit -m "feat(editor): EditorToolbar token replacement — US-DESIGN-002

Relates to LIN-47"
```

Or close the issue on merge:
```bash
git commit -m "feat(editor): all editor token replacements complete — US-DESIGN-002

Closes LIN-47"
```

### Opening a PR

```bash
gh pr create \
  --title "[US-DESIGN-002] Editor design token replacement" \
  --label "epic:design,type:feat,priority:P1" \
  --body "$(cat <<'EOF'
## Story
[US-DESIGN-002](docs/agile/epics/EPIC-DESIGN-01/stories/US-DESIGN-002/STORY.md) — Editor design token adoption
**Epic:** EPIC-DESIGN-01 | **Linear:** LIN-47

## Acceptance Criteria
- [ ] AC1: EditorToolbar uses bg-background not bg-gray-900
- [ ] AC2: Light mode toolbar matches AppHeader background
- [ ] AC3: Dark mode renders with correct dark theme
- [ ] AC4: ZoomControls + FloatingToolbar use text-foreground / hover:bg-muted
- [ ] AC5: LayersPanel + AdjustmentsPanel + PropertyPanel use sidebar tokens
- [ ] AC6: No canvas editing regressions

## Test Commands
\`\`\`bash
npm run check
npm run test:unit
\`\`\`
Manual: open editor in Light + Dark, verify toolbar/sidebar appearance

## Files Changed
See [TASKS.md](docs/agile/epics/EPIC-DESIGN-01/stories/US-DESIGN-002/TASKS.md)

Closes LIN-47
🤖 AI-assisted via Claude Code
EOF
)"
```

### After Merge

1. Linear issue auto-closes (via `Closes LIN-47`)
2. Update `docs/agile/epics/{EPIC-ID}/stories/{US-ID}/STORY.md`:
   - Fill in `**PR:** #{number}`
   - Check all verified ACs
   - Set status to `✅ Done`
3. Update `docs/agile/epics/{EPIC-ID}/EPIC.md` — mark story done in the index
4. Update `docs/AGILE_INDEX.md` if epic/milestone status changed
5. Update [docs/MVP_LAUNCH_TRACKER.md](../MVP_LAUNCH_TRACKER.md) if applicable

---

## Linear Board View Recommendations

### Project View: Kanban by Story
```
Backlog | In Progress | In Review | Done
  US-001      US-002       #23 PR    US-004 ✅
```

### Cycles (Sprints)
- Map to Milestones: one Linear Cycle = one Milestone
- Cycle duration: 1–2 weeks (match milestone scope)
- Name cycles: `M-DESIGN-02 — Editor Tokens` so they're searchable

### Roadmap View
Use Linear's Roadmap to see all Epics on a timeline — maps to `docs/roadmap/PRODUCT_ROADMAP.md`.

---

## GitHub Projects Board (alternative to Linear for simpler setups)

If not using Linear, mirror the hierarchy in GitHub Projects:

```
GitHub Project: InfographicAI Roadmap
  Fields:
    Epic      (select: EPIC-DESIGN-01, EPIC-PAY-01, …)
    Milestone (select: M-DESIGN-01, M-DESIGN-02, …)
    Story     (text: US-DESIGN-002)
    Priority  (select: P0, P1, P2)
    Status    (built-in: Backlog, In Progress, In Review, Done)
```

Link every PR to the project — GitHub auto-moves to "Done" when PR merges.

---

## Automation Rules (GitHub Actions — optional)

### Auto-label PRs by branch prefix
`.github/workflows/label-pr.yml`:
```yaml
on:
  pull_request:
    types: [opened, reopened]
jobs:
  label:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/labeler@v4
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
```
`.github/labeler.yml`:
```yaml
"type:feat":
  - head-branch: ["^feat/.*"]
"type:fix":
  - head-branch: ["^fix/.*"]
"epic:design":
  - head-branch: ["^.*/design-.*"]
"epic:payments":
  - head-branch: ["^.*/pay-.*"]
```

### Auto-assign reviewer on PR open
```yaml
# .github/CODEOWNERS
* @dinesh
client/src/components/editor/* @dinesh
api/src/modules/payments/* @dinesh
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Linear issue not closing after merge | Check commit contains `Closes LIN-{id}` (not `Fixes`, though both work) |
| PR not appearing on Linear issue | Ensure branch was pushed after Linear GitHub App was installed |
| Labels not auto-applied | Check `.github/labeler.yml` is committed and Actions are enabled |
| Branch diverged from main | `git rebase main` before opening PR — Linear shows the PR as mergeable |

---

*See also: [GIT_STRATEGY.md](GIT_STRATEGY.md) · [AGILE_INDEX.md](AGILE_INDEX.md)*
