# Story Card — US-DEPLOY-006

> **Status:** 🔲 Not Started
> **Feature:** F-DEPLOY-06 — Approval Governance (Solo → Team)
> **Epic:** [EPIC-DEPLOY-01](../../EPIC.md) · **Milestone:** [M-DEPLOY-01](../../milestones/M-DEPLOY-01-velocity-foundation.md)
> **Size:** S · **Estimate:** 0.5 day · **Created:** 2026-07-28
> **Depends on:** [US-DEPLOY-001](../US-DEPLOY-001/STORY.md) (hard CI gate), [US-DEPLOY-002](../US-DEPLOY-002/STORY.md) (preview URL), [US-DEPLOY-003](../US-DEPLOY-003/STORY.md) (flags) — this story's checklists reference all three.
> **Non-blocking to beta launch.**

---

## Story

*As the* sole operator today (and a founder who will eventually hire)
*I want* the three approval surfaces — PR merge, preview verification, release decision — documented, named, and
partially enforced (branch protection)
*So that* the checklists I use alone now are exactly the ones QA/Design and Product will step into later, with zero
rework when the team grows.

---

## Context

Nothing today names *who* approves *what*. US-DEPLOY-001/002/003 each build a mechanism (hard CI, preview URL, flag
helper) but none of them define the **process** around it — there's no PR-template checklist forcing "did I check
the preview," no branch-protection rule making the CI gate actually mandatory (vs. advisory), and no runbook for
"preview/staging/production just failed, now what." This story is pure governance + config — no new application
code.

**The model (always true, solo or team):**

| Approval surface | Question it answers | Who (solo today) | Who (team later) |
|---|---|---|---|
| Automated gate | Is the code correct? | You (enforced by CI) | Engineering (enforced by CI) |
| Preview verification | Does it behave correctly? | You, via preview URL | QA / Design |
| Release control | Are users allowed to see it? | You, via flag flip | Product / Business |

Business/release approval should never require reading code — it's a preview link + a flag toggle, by design (this
is what US-DEPLOY-002 + US-DEPLOY-003 already deliver; this story is the paperwork + guardrails around them).

---

## Acceptance Criteria

- [ ] **AC1:** `docs/DEPLOYMENT_STRATEGY.md` gets a new section documenting the three-surface approval model above (table + one paragraph), explicitly stating today = one person holds all three roles.
- [ ] **AC2:** GitHub branch protection on `main` requires the CI status check (from US-DEPLOY-001) to pass before merge is *allowed* by GitHub itself — not just a norm you follow by hand.
- [ ] **AC3:** `.github/pull_request_template.md` gains a **Merge checklist** block: CI green ✅ · smoke boot passed ✅ · DB migration approach noted (if schema touched) ✅ · flag plan noted (if risky/new behavior) ✅.
- [ ] **AC4:** A **Definition of Merge** ("green CI + smoke boot + required notes in the PR description") and a separate **Definition of Release** ("a flag is flipped for the intended audience") are both stated explicitly in `DEPLOYMENT_STRATEGY.md` — named and distinguished, since merge ≠ release is the whole point of US-DEPLOY-003.
- [ ] **AC5:** A short runbook exists (new `docs/agile/RUNBOOK.md` or a `DEPLOYMENT_STRATEGY.md` section) covering: preview fails → what to check; staging fails → what to check; production fails → who/what rolls it back (links to US-DEPLOY-005's rollback once that lands).
- [ ] **AC6:** A "Preview verified" checklist (core flows work / no obvious regression / `/api/health` ok / new UI looks correct) is documented as a required PR-template item — usable solo today, ready to become a second reviewer's job later.

## Out of Scope

- Actually hiring or assigning a second human to any role — this story only makes the surfaces *ready* for that.
- A formal RBAC/permissions system in GitHub beyond standard branch protection.
- Enforcing AC6 as a literal required GitHub check (a human checkbox is enough at solo scale) — automate only once a second reviewer exists.

## Primary files

- `docs/DEPLOYMENT_STRATEGY.md` (new section(s))
- `.github/pull_request_template.md`
- GitHub repo settings → branch protection rules (`main`)
- `docs/agile/RUNBOOK.md` (new, or folded into `DEPLOYMENT_STRATEGY.md`)

## Test Cases

| TC | Scenario | Expect |
|----|----------|--------|
| TC-01 | Open a PR with a failing CI check | GitHub blocks merge (branch protection), not just a red X you could ignore |
| TC-02 | Open a PR with a schema change and no migration note | Merge checklist item unchecked — manual self-block until noted |
| TC-03 (Manual) | Simulate a staging failure | Runbook gives a clear next action without re-deriving it from scratch |

## Definition of Done

- [ ] ACs ✅ · branch protection verified active on `main` · PR template updated · runbook exists · docs updated · PR merged
