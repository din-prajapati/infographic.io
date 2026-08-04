---
name: deploy-release-governance
version: 1.0.0
description: >
  Run merge, preview, release, canary, and migration checklists for safe fast
  shipping. Separates PR merge approval from release approval via preview URLs
  and feature flags. Use when opening a PR, before merge, verifying preview,
  releasing to production, canary rollout, or schema migration.
triggers:
  - "merge checklist"
  - "solo merge"
  - "preview verify"
  - "preview checklist"
  - "release checklist"
  - "canary rollout"
  - "migration checklist"
  - "deploy governance"
  - "approve release"
  - "ready to merge"
  - "ready to release"
domains:
  - all
  - agile
---

# Skill: deploy-release-governance

## Purpose

Guide merge and release decisions using checklists that scale from **solopreneur** to **team**.
Merge = code is safe to land on `main`. Release = users are allowed to see the behavior.

**Canonical templates:** [CHECKLISTS.md](CHECKLISTS.md)

**Related skills:** `verification-gates` (Gate 1 before merge), `agile-pr` (PR creation)

**Strategy context:** `docs/DEPLOYMENT_STRATEGY.md`, EPIC-DEPLOY-01 (`US-DEPLOY-001`–`005`)

---

## Which checklist to run

| Situation | Checklist | Who approves |
|-----------|-----------|--------------|
| Before merging your own PR (solo) | Solo Merge | You (engineering + QA + product) |
| PR open, preview URL posted | Preview Verification | You now; QA/design later |
| Full PR review (team mode) | PR Review | Engineering + optional QA/design |
| Turning feature on for users | Release | Product/business (+ engineering for safety) |
| Production staged rollout | Canary Rollout | Platform/ops (+ product for go/no-go) |
| Schema change in PR | Migration | Engineering (+ ops for prod timing) |

---

## Phase awareness (solo → team)

| Phase | Focus | Default checklists |
|-------|-------|-------------------|
| **1 — Solo foundation** | Hard CI gate | Solo Merge + verification-gates Gate 1 |
| **2 — Preview** | Live URL per PR | + Preview Verification |
| **3 — Flags** | Deploy ≠ release | + Release (flag flip) |
| **4 — Team** | Split approvals | PR Review + Preview + Release roles |
| **5 — Canary** | Progressive prod | + Canary Rollout |
| **6 — Migrations** | `migrate deploy` | + Migration on every schema PR |

Do not block beta launch on phases 2–6. See EPIC-DEPLOY-01.

---

## Protocol: Solo Merge (default)

### Step 1 — Run automated gate

```bash
npm run check
npm run test:unit
npm run build
npm run smoke:boot   # when available (US-DEPLOY-001)
```

Or invoke `verification-gates` skill for full gate tiering.

**If any required step fails → STOP. Do not merge.**

### Step 2 — Present Solo Merge Checklist

Copy the **Solo Merge Checklist** from [CHECKLISTS.md](CHECKLISTS.md) into the response.

For each item, mark:
- ✅ done (with one-line evidence)
- ⚠️ skipped (with explicit reason — never silent skip)
- ❌ blocked (do not merge)

### Step 3 — Verdict

Output exactly one:

- **MERGE OK** — all required items green
- **MERGE BLOCKED** — list blockers and fixes
- **MERGE WITH FLAG** — merge allowed but release requires flag stay off until Release checklist passes

---

## Protocol: Preview Verification

### Step 1 — Confirm preview exists

- PR should have a preview URL comment (US-DEPLOY-002 when implemented)
- Until then: staging after merge, or local `npm run dev` with documented evidence

### Step 2 — Present Preview Verification Checklist

Include InfographicAI smoke paths table from CHECKLISTS.md for the changed area.

### Step 3 — Verdict

- **PREVIEW APPROVED** — safe to merge from behavior perspective
- **PREVIEW BLOCKED** — reproducible steps + expected vs actual
- **PREVIEW DEFERRED** — merge allowed only if low risk and flag-off plan exists

---

## Protocol: Release (post-merge)

Use when code is on staging/production but **users should not see it yet**, or when increasing exposure.

### Step 1 — Confirm deploy state

- Staging: auto on merge to `main`
- Production: tag `v*` or promote (Railway)

### Step 2 — Present Release Checklist

### Step 3 — Go / No-Go

Record the chosen path: internal only | canary % | 100% | hold.

If using flags (`US-DEPLOY-003`): document env var name and target environment before flip.

---

## Protocol: Canary Rollout

Use only when US-DEPLOY-005 is implemented and production has meaningful traffic.

Present Canary Rollout Checklist. Require explicit thresholds before starting.

On breach: stop promotion → rollback or disable flag → incident note.

---

## Protocol: Migration

Run when PR touches `api/prisma/schema.prisma` or `db:deploy`.

Present Migration Checklist. **Block prod release** if expand/contract not satisfied.

Until US-DEPLOY-004: `db push` is acceptable for fresh/low-data envs only; document risk for prod.

---

## Output format

Always structure agent responses as:

```markdown
## Checklist: [name]
[checklist with ✅/⚠️/❌ per item]

## Evidence
- [commands run, URLs tested, flags checked]

## Verdict
[MERGE OK | MERGE BLOCKED | PREVIEW APPROVED | RELEASE GO | HOLD | etc.]

## Next action
[one concrete step]
```

---

## Inject into PR body

When user asks to add checklist to PR, append the relevant section from CHECKLISTS.md to `PR_BODY.draft.md` under `## Verification`.

For story PRs, prefer `agile-pr` skill for full PR workflow; this skill supplies the governance sections.
