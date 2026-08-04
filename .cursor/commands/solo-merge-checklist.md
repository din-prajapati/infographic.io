# Solo merge checklist (before merging to main)

Use when you are about to merge your own PR as a solopreneur, or when the user says "ready to merge".

## Steps

1. Read and follow `.claude/skills/deploy-release-governance/SKILL.md` — **Protocol: Solo Merge**.
2. Run Gate 1 (or full `verification-gates` if UI/backend changed):
   ```bash
   npm run check
   npm run test:unit
   ```
3. Present the **Solo Merge Checklist** from `.claude/skills/deploy-release-governance/CHECKLISTS.md`.
4. Mark each item ✅ / ⚠️ / ❌ with evidence.
5. Output verdict: **MERGE OK**, **MERGE BLOCKED**, or **MERGE WITH FLAG**.
6. If MERGE OK and user wants checklist in PR body, append to `PR_BODY.draft.md` under `## Verification`.

## Do not merge if

- CI is red or typecheck was skipped
- No runtime verification for a behavior change
- Risky change with no flag and no rollback plan
