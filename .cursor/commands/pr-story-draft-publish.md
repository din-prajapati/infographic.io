# Story PR: draft body → review → GitHub (draft or ready)

Use this flow when the user gives a **story id** (e.g. `US-DESIGN-003`) and optional **PR body** (markdown paste, file path, or “generate from STORY.md”).

## Phase 1 — Local draft (always first)

1. Resolve the story directory:

   ```bash
   node scripts/pr-story.mjs resolve US-DOMAIN-NNN
   ```

2. Produce **`PR_BODY.draft.md`** in that folder:
   - If the user **pasted body**: write it to `…/stories/US-…/PR_BODY.draft.md`.
   - If they gave a **file path**: `node scripts/pr-story.mjs save-draft US-DOMAIN-NNN path/to.md`
   - If they asked to **seed from existing** `PR_BODY.md`: `node scripts/pr-story.mjs init-draft US-DOMAIN-NNN`

3. Propose a **title**: `[US-DOMAIN-NNN] …` (match `STORY.md` intent).

4. **Stop** and ask the user to review `PR_BODY.draft.md`. Say clearly:
   - To open a **GitHub Draft PR** (recommended): reply e.g. **“approve draft PR”** after pushing.
   - To publish **ready for review** without draft: reply **“approve ready PR”** (only if they want reviewers notified immediately).
   - To only polish locally: they edit `PR_BODY.draft.md` and say **approve** again.

Do **not** run `gh pr create` without `--draft` unless the user explicitly asked for a **ready** PR.

## Phase 2 — GitHub (after explicit approval)

Pre-checks:

```bash
git push -u origin HEAD
npm run check
npm run test:unit
```

### A) User approved **draft PR** on GitHub

```bash
node scripts/pr-story.mjs create US-DOMAIN-NNN --title "[US-DOMAIN-NNN] Your title here" --draft
```

Then share the PR URL. Remind: **`gh pr ready <N>`** when they want “Ready for review”.

### B) User approved **ready for review** (no draft)

```bash
node scripts/pr-story.mjs create US-DOMAIN-NNN --title "[US-DOMAIN-NNN] Your title here" --ready
```

### C) PR already exists as draft → mark ready

```bash
node scripts/pr-story.mjs promote <PR_NUMBER>
```

## After PR exists

- Copy final body to `PR_BODY.md` if you only used `.draft.md` and want the repo canonical file updated.
- Record PR number in `STORY.md` / trackers per `docs/agile/HOW_TO_USE.md` §7 (after merge as appropriate).

## References

- Rule: `.cursor/rules/pr-workflow.mdc`
- Guide: `docs/agile/guides/STORY_PR_WORKFLOW.md`
- `npm run pr:story -- resolve US-DESIGN-002` (same as `node scripts/pr-story.mjs …`)
