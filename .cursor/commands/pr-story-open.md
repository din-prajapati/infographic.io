# Open a GitHub PR for the current story

Use this when the implementation branch is ready and tests have been run.

## Steps

1. Confirm branch name matches [GIT_STRATEGY.md](docs/agile/GIT_STRATEGY.md) (e.g. `feat/design-us-design-002-editor-tokens`).

2. From repo root:

   ```bash
   npm run check
   npm run test:unit
   ```

3. Review scope:

   ```bash
   git fetch origin main
   git diff origin/main --name-only
   ```

4. Push branch:

   ```bash
   git push -u origin HEAD
   ```

5. Open PR with **US-DESIGN-002** body file (edit title if needed):

   ```bash
   npm run pr:open:us-design-002
   ```

   Or manually:

   ```bash
   gh pr create --base main --title "[US-DESIGN-002] Editor + AI chat design tokens & dark-mode polish" --body-file docs/agile/epics/EPIC-DESIGN-01/stories/US-DESIGN-002/PR_BODY.md
   ```

6. Paste the PR URL into `STORY.md` → **PR:** `#___` after merge, per [HOW_TO_USE.md](docs/agile/HOW_TO_USE.md) §7.

## References

- [STORY_PR_WORKFLOW.md](docs/agile/guides/STORY_PR_WORKFLOW.md)
- [PR_BODY.md](docs/agile/epics/EPIC-DESIGN-01/stories/US-DESIGN-002/PR_BODY.md) for this story
