---
title: M-{DOMAIN}-{NN} — Execution Runbook
type: runbook
domain: {DOMAIN}
created: {YYYY-MM-DD}
---

<!--
  Template for a milestone runbook (ADR-004). Copy beside the milestone file as
  milestones/M-{DOMAIN}-{NN}-RUNBOOK.md and fill every {placeholder}. Delete this comment.
  Model it on the real one: docs/agile/epics/phase-1-ai-core/EPIC-EDIT-03/milestones/M-EDIT-04-RUNBOOK.md
  Precondition: every story card is hardened and its file list (owns: / File → Task Map) is accurate —
  CI's scope check enforces that list, so a wrong list blocks the PR.
-->

# M-{DOMAIN}-{NN} — Execution Runbook

Copy-paste steps for each stage. An agent **interrupts only on a decision**, never on a mechanical blocker —
every known blocker carries its fix inline.

> **Milestone:** [M-{DOMAIN}-{NN}-{slug}](./M-{DOMAIN}-{NN}-{slug}.md)
> **Milestone branch:** `feat/{domain}/m-{nn}-{slug}` · story PRs squash into it; it rebase-merges into `main`
> **Policy:** [ADR-004](../../../../decisions/ADR-004-multi-engine-agent-policy.md) — author ≠ reviewer, CI gates, scope check

---

## 0 · Decisions settled before starting

| | Decision | Answer |
|---|---|---|
| D1 | {question an implementer would otherwise stop on} | {answer + one-line why} |

---

## 1 · Lanes

Stories that share a file never run at the same time. Order inside a lane is the merge order.

| Lane | Stories (in order) | Shared files with other lanes | Worktree |
|---|---|---|---|
| A | {US-ID} → {US-ID} | {none / file — wait for lane X} | main checkout |
| B | {US-ID} | {…} | `../IE-wt/{lane}` |

## 2 · Engine plan

| Story | Size | Tests (Sonnet) | Author | Reviewer (≠ author) | `/security-review`? |
|---|:-:|---|---|---|:-:|
| {US-ID} | M | qa-agent → unit-test-agent | code-agent · **Opus** (security/migration) | Codex | ✅ |
| {US-ID} | M | qa-agent → unit-test-agent | Codex (`run-engine.sh codex implement`) | Claude reviewer-agent · Opus | — |
| {US-ID} | S | qa-agent → unit-test-agent | code-agent · Sonnet | Codex | — |

Rule: Opus authors anything touching auth, org scoping, payments or migrations. Every story with a `[security]`
AC also gets `/security-review`.

---

## 3 · Per-story steps (repeat for each story, in lane order)

```text
1. qa-agent (Sonnet)          — Given/When/Then cases into STORY.md "Test Cases"; nothing else.
2. unit-test-agent (Sonnet)   — failing tests from the ACs, only in the files TASKS.md lists for tests.
3. Author                     — Claude:  "Run code-agent on {Opus|Sonnet} for {US-ID} in a worktree"
                                Codex:   scripts/agents/run-engine.sh codex implement {US-ID} \
                                           --branch feat/{domain}/{us-id}-{slug} --from feat/{domain}/m-{nn}-{slug}
4. Orchestrator               — read the ≤10-line report; run the gates yourself; commit per task:
                                {type}({scope}): T{n} {summary} — {US-ID}
5. /agile-pr                  — PR into the milestone branch. CI runs Gate 1 + the scope check.
6. Reviewer (≠ author)        — Claude: "Run reviewer-agent on Opus for PR #{n}"
                                Codex:  scripts/agents/run-engine.sh codex review {US-ID} \
                                          --branch feat/{domain}/{us-id}-{slug} --base feat/{domain}/m-{nn}-{slug}
7. Fix BLOCKING findings → back to 3. Approve → squash-merge into the milestone branch.
```

**Prompt rules every author gets** (Claude code-agent and `run-engine.sh` both carry them):

- READ FIRST: the story's STORY.md, then TASKS.md. They are the whole contract.
- Touch only the listed files. Need another? Stop and ask — do not add it.
- Out of Scope is law. Tests are the standard; never weaken or skip one.
- Gates before "done": `npm run check` and `npm run test:unit` — quote real output.
- Final report ≤10 lines: Files changed · ACs met (file:line) · Gates · Deviations · Questions.

**Context you do not need to rediscover** (fill per story — this is what saves the most time):

- {US-ID}: {fact the implementer would otherwise grep for, with file:line}

**Self-service — fix these, do not ask:**

| Blocker | Fix |
|---|---|
| Worktree has no `node_modules` | `run-engine.sh` links it; for a Claude worktree run `npm install` |
| Lane forked before an earlier story merged | `git rebase feat/{domain}/m-{nn}-{slug}` |
| A line number in TASKS.md has drifted | locate by symbol, proceed, note it under Deviations |
| Staging asleep before Gate 2 (BL-36) | `curl -s https://{staging-host}/api/health` until 200; ping every 30 s |

**Stop and ask — only these:**

- {the decision that would change behaviour for saved user data}
- Any change outside the story's file list.

---

## 4 · Before the milestone PR

```bash
# Whole-milestone cross-story check by an engine that wrote none of it
scripts/agents/run-engine.sh codex verify M-{DOMAIN}-{NN} --branch feat/{domain}/m-{nn}-{slug} --base main
# (Gemini when it is available: same command with `gemini`)
```

Fix BLOCKING findings, then: `gh pr create --base main --title "[M-{DOMAIN}-{NN}] {title}"`.

## 5 · Human approval → merge → Gate 2

- Product owner reviews the milestone PR and says "merge". A merge to `main` is a production deploy — check
  `railway variables --environment production --kv` against `env.validation.ts` first.
- Rebase-merge. Wake staging, then e2e-test-agent (Sonnet) runs Gate 2, one run at a time.
- Close-out by hand (BL-48): STORY → MILESTONE → EPIC → PHASE_TRACKER → AGILE_INDEX → TEAM_STATUS.
- Session note in `docs/agile/sessions/`; the next milestone starts in a fresh orchestrator session.

---

*Runbook created: {YYYY-MM-DD}*
