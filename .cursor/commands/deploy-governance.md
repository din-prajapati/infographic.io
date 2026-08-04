# Deploy governance — pick the right checklist

Umbrella command when the user is unsure which merge/release checklist to run.

## Steps

1. Read `.claude/skills/deploy-release-governance/SKILL.md`.
2. Ask or infer the situation:

   | User intent | Run command / protocol |
   |-------------|------------------------|
   | About to merge own PR | `solo-merge-checklist.md` |
   | Preview URL ready for review | `preview-verify-checklist.md` |
   | PR needs full team review sections | `pr-review-checklist.md` |
   | Code deployed, deciding user exposure | `release-checklist.md` |
   | Staged prod rollout | `canary-rollout-checklist.md` |
   | Schema / Prisma change | `migration-checklist.md` |

3. Run the matching protocol from the skill.
4. If multiple apply (e.g. migration + solo merge), run **Migration** first, then **Solo Merge**.

## Phase hint (solo → team)

- **Now (solo beta):** Solo Merge + Preview (when available) + Release for flags
- **With traction:** add PR Review split + Canary + strict Migration

Reference: `docs/DEPLOYMENT_STRATEGY.md`, EPIC-DEPLOY-01.
