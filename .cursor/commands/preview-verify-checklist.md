# Preview verification checklist

Use when a PR has a preview URL, or the user wants behavior/UX approval before merge.

## Steps

1. Read `.claude/skills/deploy-release-governance/SKILL.md` — **Protocol: Preview Verification**.
2. Ask for or locate the preview URL (PR comment, Railway PR env, or staging if post-merge).
3. Present the **Preview Verification Checklist** from `CHECKLISTS.md`.
4. Include relevant rows from the **InfographicAI smoke paths** table for the changed area.
5. Mark each item ✅ / ⚠️ / ❌ with what was actually tested.
6. Output verdict: **PREVIEW APPROVED**, **PREVIEW BLOCKED**, or **PREVIEW DEFERRED**.

## Reviewer roles (solo vs team)

- **Solo:** you complete all sections (engineering + QA + design).
- **Team:** QA/design complete Feature + Reviewer Outcome; engineering completes Basic + Environment Safety.

## If no preview URL yet

State that US-DEPLOY-002 is not implemented. Offer alternatives:
- local `npm run dev` with documented steps
- merge to staging first (higher risk — note in verdict)
