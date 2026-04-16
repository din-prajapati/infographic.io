# Open a GitHub PR for a story (quick path)

> For **draft → review → approve → publish**, use the command **“Story PR: draft body → review → GitHub”** (`pr-story-draft-publish.md`) and rule `pr-workflow.mdc`.

## When to use this command

Use when the body is already finalized in **`PR_BODY.md`** (or you intentionally skip the `.draft.md` step) and you want a **single** `gh pr create` (see `STORY_PR_WORKFLOW.md` for `--draft` vs `--ready`).

## Steps

1. Branch naming: `docs/agile/GIT_STRATEGY.md`
2. `git push -u origin HEAD`
3. **Draft (recommended):**

   ```bash
   node scripts/pr-story.mjs init-draft US-DOMAIN-NNN
   # edit PR_BODY.draft.md if needed, then:
   node scripts/pr-story.mjs create US-DOMAIN-NNN --title "[US-DOMAIN-NNN] …" --draft
   ```

4. Or **one-shot** (legacy shortcut for US-DESIGN-002 only): `npm run pr:open:us-design-002`

## References

- `docs/agile/guides/STORY_PR_WORKFLOW.md`
- `node scripts/pr-story.mjs` (dynamic story id + `--draft` / `--ready`)
