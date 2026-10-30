---
title: M-PROP-01 — Execution Runbook
type: runbook
domain: PROP
created: 2026-10-30
---

# M-PROP-01 — Execution Runbook

Copy-paste steps for each stage. An agent **interrupts only on a decision**, never on a mechanical blocker —
every known blocker carries its fix inline.

> **Milestone:** [M-PROP-01-property-record](./M-PROP-01-property-record.md)
> **Milestone branch:** `feat/prop/m-01-property-record` · story PRs squash into it; it rebase-merges into `main`
> **Policy:** [ADR-004](../../../../decisions/ADR-004-multi-engine-agent-policy.md) — author ≠ reviewer, CI gates, scope check
> **Sister runbook:** [M-PROP-03-RUNBOOK](./M-PROP-03-RUNBOOK.md) — runs in parallel in its own orchestrator session

---

## Wave status

| Day | Story | State |
|:-:|---|---|
| 1 | US-PROP-001 | ✅ squash-merged into the milestone branch — [#88](https://github.com/din-prajapati/infographic.io/pull/88) (`8d41493`), 2026-10-30. TC-PROP-001-21 deferred → BL-50 (§5) |
| 2 | US-PROP-002 | 🔲 next |
| 3 | US-PROP-006 ∥ US-PROP-007 | 🔲 |
| 3→4 | D1 rebase onto `main` | 🔲 waits for M-PROP-03 |
| 4 | US-PROP-003 | 🔲 |

Handoff and day-1 lessons: [2026-10-30_prop-wave1-handoff](../../../../sessions/2026-10-30_prop-wave1-handoff.md).

---

## 0 · Decisions settled before starting

| | Decision | Answer |
|---|---|---|
| D1 | M-PROP-03 shares files with this milestone (`designs.service.ts` and `create-design.dto.ts` with US-PROP-005; `listingBindings.ts` with US-PROP-004). Who resolves the conflict? | **This milestone.** M-PROP-03 lands on `main` first (wave day 3). Rebase this milestone branch onto `main` once, **after US-PROP-006 and US-PROP-007 are squashed in and before US-PROP-003 starts**. In `save()` keep both: US-PROP-001's `propertyId` org guard and US-PROP-005's carry-forward of `version`/`proven`/`sourceTemplate*`. |
| D2 | Two migrations hit a database that is also staging's (BL-37). | Generate each with `prisma migrate dev` only, in order (001 → 002). Both are additive (new table, nullable columns), so staging's current `main` build keeps working. **Never edit an applied migration and never run `prisma migrate reset`** — reset drops the shared dev/staging data. A review that changes the schema gets a new follow-up migration. |
| D3 | Can US-PROP-006 and US-PROP-007 run at the same time? | **Yes.** Their file lists don't overlap (checked 2026-10-30). Each gets its own story branch and worktree off the milestone branch. |
| D4 | US-EDIT-024 (M-EDIT-09) also changes `EditorLayout.tsx`. | US-PROP-006 goes first. M-EDIT-09 rebases onto `main` after this milestone merges; nothing to do here except merge on time. |

---

## 1 · Lanes

Stories that share a file never run at the same time. Order inside a lane is the merge order.

| Wave day | Lane A — backend | Lane B — client | Worktree |
|:-:|---|---|---|
| 1 | US-PROP-001 | — | main checkout |
| 2 | US-PROP-002 | — | main checkout |
| 3 | — | US-PROP-006 ∥ US-PROP-007 | `../IE-wt/codex-us-prop-006-implement` (made by `run-engine.sh`) · code-agent's own worktree for 007 |
| 3→4 | **D1 rebase onto `main`** (after M-PROP-03 merges) | | main checkout |
| 4 | — | US-PROP-003 | main checkout |
| 5 | milestone verify + PR | | main checkout |

Shared files inside the milestone, and why the order is what it is:

| File | Stories (in merge order) |
|---|---|
| `api/prisma/schema.prisma` + migrations | 001 → 002 |
| `api/src/modules/properties/dto/*.dto.ts` | 001 (creates) → 002 |
| `client/src/hooks/usePropertyStore.ts` | 002 → 006 → 003 |
| `client/src/lib/api.ts` | 002 → 006 → 003 |
| `client/src/lib/listingBindings.ts` | 007 → 003 (and US-PROP-004 via D1) |
| `client/src/components/editor/PropertyDetailsForm.tsx` | 007 → 003 |

## 2 · Engine plan

| Story | Size | Tests (Sonnet) | Author | Reviewer (≠ author) | `/security-review`? |
|---|:-:|---|---|---|:-:|
| US-PROP-001 | M | qa-agent → unit-test-agent | code-agent · **Opus** (migration + org scoping) | Codex | ✅ AC5, AC6 |
| US-PROP-002 | M | qa-agent → unit-test-agent | code-agent · **Opus** (migration) | Codex | — |
| US-PROP-006 | M | qa-agent → unit-test-agent | Codex (`run-engine.sh codex implement`) | Claude reviewer-agent · Opus | ✅ AC10 |
| US-PROP-007 | M | qa-agent → unit-test-agent | code-agent · Sonnet | Codex | — |
| US-PROP-003 | M | qa-agent → unit-test-agent | code-agent · Sonnet | Codex | ✅ AC7 |

Rule: Opus authors anything touching auth, org scoping, payments or migrations. Every story with a `[security]`
AC also gets `/security-review`.

---

## 3 · Per-story steps (repeat for each story, in lane order)

Create the milestone branch once, on wave day 1:

```bash
git switch main && git pull && git switch -c feat/prop/m-01-property-record && git push -u origin HEAD
```

Then for each story:

```text
1. qa-agent (Sonnet)          — Given/When/Then cases into STORY.md "Test Cases"; nothing else.
2. unit-test-agent (Sonnet)   — failing tests from the ACs, only in the test files TASKS.md lists.
3. Author                     — Claude:  "Run code-agent on {Opus|Sonnet} for {US-ID} in a worktree"
                                Codex:   scripts/agents/run-engine.sh codex implement US-PROP-006 \
                                           --branch feat/prop/us-prop-006-client --from feat/prop/m-01-property-record
4. Orchestrator               — read the ≤10-line report; run the gates yourself; commit per task:
                                {type}(prop): T{n} {summary} — {US-ID}
5. /agile-pr                  — PR into feat/prop/m-01-property-record. CI runs Gate 1 + the scope check.
6. Reviewer (≠ author)        — Claude: "Run reviewer-agent on Opus for PR #{n}"
                                Codex:  scripts/agents/run-engine.sh codex review {US-ID} \
                                          --branch feat/prop/{us-id}-{slug} --base feat/prop/m-01-property-record
7. Fix BLOCKING findings → back to 3. Approve → squash-merge into the milestone branch.
```

Story branch names: `feat/prop/us-prop-001-backend`, `feat/prop/us-prop-002-structured-price`,
`feat/prop/us-prop-006-client`, `feat/prop/us-prop-007-intent-editor`, `feat/prop/us-prop-003-autofill`.
The US-ID in the branch name is what the scope check reads.

**Prompt rules every author gets** (Claude code-agent and `run-engine.sh` both carry them):

- READ FIRST: the story's STORY.md, then TASKS.md. They are the whole contract.
- Touch only the listed files. Need another? Stop and ask — do not add it.
- Out of Scope is law. Tests are the standard; never weaken or skip one.
- Gates before "done": `npm run check` and `npm run test:unit` — quote real output.
- Final report ≤10 lines: Files changed · ACs met (file:line) · Gates · Deviations · Questions.

**Context you do not need to rediscover** (line numbers checked on `main` @ `4334eab`):

- **US-PROP-001**
  - `DesignsService.save(userId, organizationId, dto, designId?)` is at `designs.service.ts:11`.
  - The update path reads `existingCanvasDesign` at `:34`. `visibility` is carried forward at `:48` — copy that pattern for `propertyId`.
  - `forbidNonWhitelisted: true` is at `api/src/main.ts:89`. It is why AC4 gets its 400 for free.
  - The last migration is `20261019103437_payment_refund_fields`. The stray `manual_add_payment_models.sql` beside it is not a migration — leave it.
- **US-PROP-002**
  - `generations.service.ts:150` sets `listingType: extractedData.listingType || 'for_sale'`. That is the line `transaction` overrides.
  - The senders' `currencyToken` lines are `RightSidebar.tsx:542` and `AIChatBox.tsx:803`.
  - In the prompt builder: `buildImagePrompt` `:167`, `buildPrintedListing` `:216`, `REPAIR_LOCATORS` `:233`.
  - In `shared/locale.ts`: `extractCurrencyToken` `:100`, `formatPriceForLocale` `:218`.
- **US-PROP-006**
  - `EditorLayout.tsx:78` is `loadDesignById` and `:86` is `restoreCanvasData(design.canvasData)`. That is the only design-open path that fetches a Property.
  - `:97` (starter template) and `:120` (template) also call `restoreCanvasData` and must **not** fetch a Property.
  - `restoreCanvasData` is at `canvasState.ts:188`.
- **US-PROP-007 / US-PROP-003** — in `listingBindings.ts`: `BoundField` `:29`, `FIELD_TO_SLOTS` `:43`, `hydrateStoresFromCanvas` `:209`, `applySavedListing` `:279`.
- **US-PROP-003** — `ExtractionsController` lives in `api/src/modules/infographics/controllers/extractions.controller.ts` and has no `assertCanGenerate` today (AC9: keep it that way).

**Self-service — fix these, do not ask:**

| Blocker | Fix |
|---|---|
| Worktree has no `node_modules` | `run-engine.sh` links it; for a Claude worktree run `npm install` |
| Prisma client is stale after a schema change | `npm run prisma:generate` |
| Lane forked before an earlier story merged | `git rebase feat/prop/m-01-property-record` |
| A line number above has drifted | locate by symbol, proceed, note it under Deviations |
| `prisma migrate dev` warns of drift on the shared DB | **stop** — see "Stop and ask" |
| Staging asleep before Gate 2 (BL-36) | `curl -s https://infographic-production-staging.up.railway.app/api/health` until 200; ping every 30 s |

**Stop and ask — only these:**

- `prisma migrate dev` reports drift or offers to reset the database. Never accept a reset — the DB is staging's (BL-37).
- A review finding would change a migration that has already been applied.
- Any change outside the story's file list.

---

## 4 · Before the milestone PR

```bash
# Whole-milestone cross-story check by an engine that wrote none of it
scripts/agents/run-engine.sh codex verify M-PROP-01 --branch feat/prop/m-01-property-record --base main
# (Gemini when it is available: same command with `gemini`)
```

Look hardest at: org scoping across all five stories (no `organizationId` from a body, no unscoped `findUnique`);
the 006 design-switch race (AC11); one Undo for an intent change (007 AC1) and for Apply (003 AC4).

Fix BLOCKING findings, then: `gh pr create --base main --title "[M-PROP-01] Property record and structured listing"`.

## 5 · Human approval → merge → Gate 2

- Product owner reviews the milestone PR and says "merge". A merge to `main` is a production deploy — check
  `railway variables --environment production --kv` against `env.validation.ts` first.
- **Before merging — BL-50 (deferred US-PROP-001 AC1/AC8 check):** on production record `SELECT count(*), md5(string_agg("propertyData"::text, '' ORDER BY id)) FROM "Infographic"`. Repeat it after the deploy: count and hash must match, `propertyId IS NOT NULL` = 0, and `prisma migrate status` must say *up to date*. Record in TC-PROP-001-21.
- Both migrations run on production through the Railway `preDeployCommand` (`migrate deploy`). Verify afterwards at the
  data layer: `Property` table present, `Infographic.propertyId` all null, design count unchanged (US-PROP-001 AC8).
- Rebase-merge. Wake staging, then e2e-test-agent (Sonnet) runs Gate 2, one run at a time.
- Close-out by hand (BL-48): STORY → MILESTONE → EPIC → PHASE_TRACKER → AGILE_INDEX → TEAM_STATUS.
- Session note in `docs/agile/sessions/`; tell the M-EDIT-09 session that `EditorLayout.tsx` has moved (D4).

---

*Runbook created: 2026-10-30*
