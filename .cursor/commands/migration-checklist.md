# DB migration checklist

Use when a PR changes `api/prisma/schema.prisma`, `db:deploy`, or Railway start command migration order.

## Steps

1. Read `.claude/skills/deploy-release-governance/SKILL.md` — **Protocol: Migration**.
2. Present the **Migration Checklist** from `CHECKLISTS.md`.
3. Check whether change follows **expand → backfill → contract** if old+new code must coexist.
4. Verify staging test plan (Neon staging branch + `migrate deploy` when US-DEPLOY-004 is live).
5. Document rollback: Neon branch restore + revert deploy / flag off.
6. Output verdict: **MIGRATION OK**, **MIGRATION BLOCKED**, or **STAGING ONLY** (do not prod until fixed).

## Current repo note

Until US-DEPLOY-004 ships, prod may still use `prisma db push`. Flag this in the checklist if prod has real customer data.
