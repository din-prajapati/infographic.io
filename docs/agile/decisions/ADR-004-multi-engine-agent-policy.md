---
title: "ADR-004: Multi-engine agent policy — Claude, Codex and Gemini share the work under one set of guardrails"
type: decision
tags: [orion, adr, agents, codex, gemini, ci, security]
updated: 2026-10-30
---

# ADR-004: Multi-engine agent policy

> **Status:** ✅ Accepted
> **Date:** 2026-10-30
> **Deciders:** Dinesh (product owner)
> **Scope:** how stories are implemented, tested and reviewed from Phase 1.5 on. Repo-local only — no ORION framework
> changes; reconcile with ORION's own pipeline (`harden`, `implement-story`, `review-pr`, `orion fleet`) when that work lands.

## Context

One orchestrating Claude session ran every step of every story, so its context filled up and every review was a model
reviewing its own family's work. A cross-model check had already proved its worth: Gemini's read-only verification
of M-EDIT-04 found problems the implementer missed, and an Opus review of PR #83 found six blockers in cards a
Sonnet story-writer had produced. Codex (`codex-cli`) and Gemini (`gemini-cli`, signed in with Google) are installed.
The product owner accepted OpenAI's and Google's data terms for this codebase on 2026-10-30. Anthropic already
receives this code through Claude Code; this adds two more processors.

## Decision

### 1. State lives on disk, not in any engine's context
- STORY.md + TASKS.md are the only handover. Every engine reads them and writes back three things: ticked tasks,
  a dated Implementation Update entry, and its code changes. Nothing is handed over by chat.
- The orchestrator keeps pointers only (story ID, branch, PR, verdict) and re-reads files when it needs them.
- Every agent's final report is at most ~10 lines (reviews ≤25). Full transcripts go to `.agent-logs/` (gitignored).
- One orchestrator session per milestone; it ends with a session note in `docs/agile/sessions/`.

### 2. Who does what

| Job | Engine |
|---|---|
| Orchestration, card hardening, scope decisions | Claude Opus |
| Test cases (qa-agent), unit tests written first (unit-test-agent) | Claude Sonnet |
| Implementing well-specified stories | Claude Sonnet or Codex, rotated by lane |
| Implementing code that touches auth, org scoping, payments or migrations | **Claude Opus only** |
| Second-opinion PR review | **The engine that did not write the code** |
| Whole-milestone read-only verification before the milestone PR | Gemini (Pro model, pinned) |
| Close-out tracker edits | By hand or a small model |

### 3. Guardrails that hold whatever the engine
1. **Author ≠ reviewer.** Codex-written code is reviewed by Claude Opus; Claude-written code by Codex or Gemini.
2. **Deterministic gates decide.** `.github/workflows/pr-checks.yml` runs Gate 1 in full (`npm run check` +
   `npm run test:unit`) on every PR. Gate 2 (Playwright) runs on staging after merge. Test Is Truth for every engine.
3. **Tests come first, from a different agent.** unit-test-agent writes them from the ACs before code-agent starts.
4. **The file list is enforced by CI, not by prompts.** `scripts/check-task-scope.mjs` fails a PR that changes
   files not listed by its stories (STORY.md `owns:`, the TASKS.md file section, or STORY.md "Primary files
   touched"; `docs/`, STORY.md and TASKS.md are always allowed; schema → its migrations, package.json → its lock
   file, and `__tests__/` beside a listed file come along). **Escape hatch:** the `scope-override` label, with the
   reason in the PR body.
5. **Security stories get a second check.** Any story with a `[security]` AC also gets `/security-review` (Claude Opus).
6. **No secrets reach external engines.** `scripts/agents/run-engine.sh` strips secret-looking env vars, gives
   Codex's shell core vars only, runs code changes in a fresh worktree (which has no `.env*` or `secrets/`), and
   `.geminiignore` keeps Gemini off `.env*`, `secrets/` and `api/prisma/seed.ts`.
   *Known gap:* Codex has no ignore file, so a tracked file such as `seed.ts` (QA seed password only) is readable
   in its worktree. Accepted; real secrets are never tracked.
7. **A human approves every milestone PR into `main`** (a merge to `main` is a production deploy).

### 4. How to run the external engines

```bash
scripts/agents/run-engine.sh codex  implement US-XXX-NNN --branch <story-branch> --from <milestone-branch>
scripts/agents/run-engine.sh codex  review    US-XXX-NNN --branch <pr-branch>    --base <milestone-branch>
scripts/agents/run-engine.sh gemini review    US-XXX-NNN --branch <pr-branch>    --base <milestone-branch>
scripts/agents/run-engine.sh gemini verify    M-XXX-NN   --branch <milestone-branch> --base main
```

Claude agents run from the orchestrator session by name, with the model chosen per run (e.g. code-agent on Opus).
Each milestone gets a runbook from [`docs/agile/runbooks/MILESTONE-RUNBOOK-TEMPLATE.md`](../runbooks/MILESTONE-RUNBOOK-TEMPLATE.md).

## Consequences

- **Good:** context per engine stays small; every PR faces the same deterministic gates; cross-model review on
  every story; out-of-scope edits are caught mechanically. Back-testing the scope check on `main` flagged five
  past commits (M-EDIT-04, M-EDIT-05) that changed files their cards did not list.
- **Cost:** about 2–4 extra CI minutes per PR; a card's file list must be accurate before implementation starts.
- **To reconcile with ORION later:** `run-engine.sh` overlaps `orion fleet`; per-run model choice overlaps agent
  frontmatter; qa-agent test cases overlap ORION `harden`. Compare when the ORION repo work completes.

## Alternatives considered

- **Claude only, one session per milestone.** Simpler, but every review is same-family and context still fills.
- **`orion fleet` now.** Deferred: ORION passes no `--model` yet and its milestone skills are not installed in this
  repo; the product owner asked to keep ORION changes out of this repo for now.
