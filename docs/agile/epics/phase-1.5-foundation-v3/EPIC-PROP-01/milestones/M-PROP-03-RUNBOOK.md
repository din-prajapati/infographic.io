---
title: M-PROP-03 — Execution Runbook
type: runbook
domain: PROP
created: 2026-10-30
---

# M-PROP-03 — Execution Runbook

Copy-paste steps for each stage. An agent **interrupts only on a decision**, never on a mechanical blocker —
every known blocker carries its fix inline.

> **Milestone:** [M-PROP-03-template-contract](./M-PROP-03-template-contract.md)
> **Milestone branch:** `feat/prop/m-03-template-contract` · story PRs squash into it; it rebase-merges into `main`
> **Policy:** [ADR-004](../../../../decisions/ADR-004-multi-engine-agent-policy.md) — author ≠ reviewer, CI gates, scope check
> **Sister runbook:** [M-PROP-01-RUNBOOK](./M-PROP-01-RUNBOOK.md) — runs in parallel in its own orchestrator session

---

## 0 · Decisions settled before starting

| | Decision | Answer |
|---|---|---|
| D1 | US-PROP-005 and US-PROP-001 (M-PROP-01) both change `DesignsService.save()` and `create-design.dto.ts`; US-PROP-004 and US-PROP-007/003 share `listingBindings.ts`. Who resolves it? | **M-PROP-01 does.** This milestone branches from `main`, never from the M-PROP-01 branch, and merges to `main` first (wave day 3). M-PROP-01 then rebases once and keeps both sides (its D1). Do not wait for M-PROP-01 and do not pull its commits in here. |
| D2 | Where do `version` / `proven` live? | In `propertyData.canvasDesign` JSON. **No Prisma migration on this branch** — M-PROP-01 owns this wave's migrations. The `Template` Prisma model is not the gallery; don't touch it. |
| D3 | When does the seed `--refresh` run? | After the milestone merges: dev/staging first (shared DB, BL-37), then production. One operator command at a time, `--dry-run` first, then check the rows themselves rather than trusting the exit code. |

---

## 1 · Lanes

| Wave day | Lane C | Worktree |
|:-:|---|---|
| 1 | US-PROP-004 | `../IE-wt/codex-us-prop-004-implement` (made by `run-engine.sh`; the main checkout is Lane A's) |
| 2 | US-PROP-005 | `../IE-wt/m-03` (code-agent works in its own worktree off it) |
| 3 | milestone verify + PR → `main` | `../IE-wt/m-03` |

US-PROP-004 and US-PROP-005 share only `api/scripts/data/premium-templates.data.ts`, so they run one after the other:
004 merges into the milestone branch, then 005 starts from it.

## 2 · Engine plan

| Story | Size | Tests (Sonnet) | Author | Reviewer (≠ author) | `/security-review`? |
|---|:-:|---|---|---|:-:|
| US-PROP-004 | M | qa-agent → unit-test-agent | Codex (`run-engine.sh codex implement`) | Claude reviewer-agent · Opus | — |
| US-PROP-005 | S | qa-agent → unit-test-agent | code-agent · Sonnet | Codex | ✅ AC4 |

Rule: Opus authors anything touching auth, org scoping, payments or migrations. This milestone touches none of them,
so authors rotate between Codex and Sonnet. Every story with a `[security]` AC also gets `/security-review`.

---

## 3 · Per-story steps (repeat for each story, in lane order)

Create the milestone branch once, on wave day 1 (in a worktree, so Lane A keeps the main checkout):

```bash
git fetch origin && git worktree add -b feat/prop/m-03-template-contract ../IE-wt/m-03 origin/main
git -C ../IE-wt/m-03 push -u origin HEAD
```

Then for each story:

```text
1. qa-agent (Sonnet)          — Given/When/Then cases into STORY.md "Test Cases"; nothing else.
2. unit-test-agent (Sonnet)   — failing tests from the ACs, only in the test files TASKS.md lists.
3. Author                     — Codex:   scripts/agents/run-engine.sh codex implement US-PROP-004 \
                                           --branch feat/prop/us-prop-004-binding-types --from feat/prop/m-03-template-contract
                                Claude:  "Run code-agent on Sonnet for US-PROP-005 in a worktree"
4. Orchestrator               — read the ≤10-line report; run the gates yourself; commit per task:
                                {type}(prop): T{n} {summary} — {US-ID}
5. /agile-pr                  — PR into feat/prop/m-03-template-contract. CI runs Gate 1 + the scope check.
6. Reviewer (≠ author)        — Claude: "Run reviewer-agent on Opus for PR #{n}"
                                Codex:  scripts/agents/run-engine.sh codex review US-PROP-005 \
                                          --branch feat/prop/us-prop-005-template-version --base feat/prop/m-03-template-contract
7. Fix BLOCKING findings → back to 3. Approve → squash-merge into the milestone branch.
```

**Prompt rules every author gets** (Claude code-agent and `run-engine.sh` both carry them):

- READ FIRST: the story's STORY.md, then TASKS.md. They are the whole contract.
- Touch only the listed files. Need another? Stop and ask — do not add it.
- Out of Scope is law. Tests are the standard; never weaken or skip one.
- Gates before "done": `npm run check` and `npm run test:unit` — quote real output.
- Final report ≤10 lines: Files changed · ACs met (file:line) · Gates · Deviations · Questions.

**Context you do not need to rediscover** (line numbers checked on `main` @ `4334eab`):

- **US-PROP-004**
  - In `canvasState.ts`: `captureCanvasData` `:40`, `restoreCanvasData` `:188`. `restoreCanvasData` is where `migrateElementBinding` runs.
  - In `listingBindings.ts`: `BoundField` `:29`, `FIELD_TO_SLOTS` `:43`. `SLOT_TO_FIELD` is derived from it at `:65`; don't keep a second map on the client.
  - `premium-templates.data.ts` has about 68 `slot` lines. The new API spec computes its counts and never hard-codes them.
  - `api/tests/canvas/template-one-fact-per-element.spec.ts` must stay green.
  - Only add new exports to `listingBindings.ts`. US-PROP-007/003 edit existing functions there, and M-PROP-01 resolves the overlap (D1).
- **US-PROP-005**
  - `save()` is at `designs.service.ts:11` and the update path reads `existingCanvasDesign` at `:34`.
  - `visibility` is carried forward at `:48`. That is the exact pattern AC6 asks for with `version`, `proven` and `sourceTemplate*`.
  - `findAdminCuratedTemplates()` is at `:145`.
  - The `--refresh` behaviour is documented in `seed-premium-templates.ts` around `:86`.

**Self-service — fix these, do not ask:**

| Blocker | Fix |
|---|---|
| Worktree has no `node_modules` | `run-engine.sh` links it; for a Claude worktree run `npm install` |
| US-PROP-005 forked before US-PROP-004 merged | `git rebase feat/prop/m-03-template-contract` |
| A line number above has drifted | locate by symbol, proceed, note it under Deviations |
| `BoundField` import creates a cycle (`canvasTypes` ↔ `listingBindings`) | move the type into `canvasTypes.ts` and re-export it (AC1 allows this) |
| Staging asleep before Gate 2 (BL-36) | `curl -s https://infographic-production-staging.up.railway.app/api/health` until 200; ping every 30 s |

**Stop and ask — only these:**

- `migrateElementBinding` would have to change `content`, `slot` or `slotFormat` on any saved design to pass a test.
- AC6 can't be met without a Prisma migration.
- Any change outside the story's file list.

---

## 4 · Before the milestone PR

```bash
# Whole-milestone cross-story check by an engine that wrote none of it
scripts/agents/run-engine.sh codex verify M-PROP-03 --branch feat/prop/m-03-template-contract --base main
# (Gemini when it is available: same command with `gemini`)
```

Look hardest at three things:

- A design saved before this milestone reopens with the same text (004 AC2).
- `proven` can't be set from any request body (005 AC4).
- A `PUT` keeps the provenance fields (005 AC6).

Fix BLOCKING findings, then: `gh pr create --base main --title "[M-PROP-03] Template contract"`.
Tell the M-PROP-01 session it has landed — that session rebases next (its D1).

## 5 · Human approval → merge → Gate 2

- Product owner reviews the milestone PR and says "merge". A merge to `main` is a production deploy — check
  `railway variables --environment production --kv` against `env.validation.ts` first.
- Rebase-merge. Then the seed (D3), one command at a time:
  1. `npx tsx api/scripts/seed-premium-templates.ts --refresh --dry-run` — read the "version N → N+1" lines.
  2. `npx tsx api/scripts/seed-premium-templates.ts --refresh` — then `GET /api/v1/canvas-templates?visibility=admin_curated`
     on staging shows `proven: true` and a numeric `version` on every item (TC-PROP-005-01).
  3. Production: the same two steps through `railway run --environment production`, then the same check.
- Wake staging, then e2e-test-agent (Sonnet) runs Gate 2, one run at a time.
- Close-out by hand (BL-48): STORY → MILESTONE → EPIC → PHASE_TRACKER → AGILE_INDEX → TEAM_STATUS.
- Session note in `docs/agile/sessions/`.

---

*Runbook created: 2026-10-30*
