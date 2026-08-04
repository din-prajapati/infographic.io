# PR review checklist (team / full gate)

Use when preparing a PR for reviewers, or when acting as engineering reviewer on someone else's PR.

## Steps

1. Read `.claude/skills/deploy-release-governance/SKILL.md`.
2. Present the full **PR Review Checklist** from `CHECKLISTS.md` (all six sections).
3. Cross-check with `verification-gates` for domain-appropriate gates (visual, E2E, API smoke).
4. Mark each item ✅ / ⚠️ / ❌ with evidence.
5. Suggest which additional reviewers are needed:
   - QA — behavior change
   - Design — UI/UX change
   - Product — customer-visible release decision (separate from merge)
6. Optionally append completed checklist to `PR_BODY.draft.md` under `## Verification`.

## Approval split

| Decision | Typical approver |
|----------|------------------|
| Merge to `main` | Engineering (+ QA/design if material UI/behavior change) |
| Release to users | Product/business via flag or rollout |
