---
title: EPIC-PROP-01 wave 1 — handoff for Lane A (M-PROP-01) and Lane C (M-PROP-03)
type: session
domain: PROP
created: 2026-10-30
---

# EPIC-PROP-01 wave 1 — handoff (end of wave day 1)

Start a new session by reading, in order: this note → the two runbooks → the day-2 story cards.

- Runbook A: [M-PROP-01-RUNBOOK](../epics/phase-1.5-foundation-v3/EPIC-PROP-01/milestones/M-PROP-01-RUNBOOK.md)
- Runbook C: [M-PROP-03-RUNBOOK](../epics/phase-1.5-foundation-v3/EPIC-PROP-01/milestones/M-PROP-03-RUNBOOK.md)
- Policy: [ADR-004](../decisions/ADR-004-multi-engine-agent-policy.md) — author ≠ reviewer, CI Gate 1 + scope check

## 1 · Where things stand

| Lane | Milestone branch | Tip | Done | Next |
|---|---|---|---|---|
| A | `feat/prop/m-01-property-record` | `8d41493` | US-PROP-001 (#88) | **US-PROP-002** (day 2) → 006 ∥ 007 (day 3) → D1 rebase → 003 (day 4) |
| C | `feat/prop/m-03-template-contract` | `39b4cf0` | US-PROP-004 (#87) | **US-PROP-005** (day 2) → milestone verify + PR to `main` (day 3) |

Both milestone branches are pushed. `main` @ `4334eab` is untouched by the wave (milestones merge to `main` at the end).

**Shared dev/staging DB (BL-37) state:** migration `20261030104842_add_property_model` applied; `Property` table empty;
191 designs, 0 with `propertyId`. Every test row created on 2026-10-30 was deleted.

## 2 · Day 2 — what to run

### Lane A · US-PROP-002 — structured price (M) · branch `feat/prop/us-prop-002-structured-price`

- Author **code-agent on Opus** (second migration). Reviewer **Codex**. No `/security-review` required.
- Fork from `feat/prop/m-01-property-record` (it already contains 001's schema and DTOs).
- **Migration:** `npx prisma migrate dev --name prop_price_fields --schema=api/prisma/schema.prisma` — additive nullable
  columns only. It applies to the shared dev/staging DB. **Stop** if Prisma reports drift or offers a reset.
- 14 files in the TASKS.md file map (`shared/locale.ts`, schema, Property DTOs, `usePropertyStore.ts`,
  `generate-from-chat.dto.ts`, `generations.service.ts`, `infographic-prompt.builder.ts`, `client/src/lib/api.ts`,
  `RightSidebar.tsx`, `AIChatBox.tsx`, three specs).
- **Follow the 001 DTO pattern:** `create-property.dto.ts` now uses `@ValidateIf((_, v) => v !== undefined)`, not
  `@IsOptional()`, so an explicit `null` is a 400. New Property fields must do the same.

### Lane C · US-PROP-005 — template version + proven flag (S) · branch `feat/prop/us-prop-005-template-version`

- Author **code-agent on Sonnet**. Reviewer **Codex**. **`/security-review` required (AC4: `proven` never settable
  from a request body).**
- Fork from `feat/prop/m-03-template-contract` (contains 004's seed bindings in `premium-templates.data.ts`).
- **No Prisma migration** (D2): `version` / `proven` / `sourceTemplate*` live in `propertyData.canvasDesign` JSON.
- 5 files: `premium-templates.data.ts`, `seed-premium-templates.ts`, `designs.service.ts`, `create-design.dto.ts`,
  `api/tests/canvas/template-version-proven.spec.ts`.
- This branch does **not** contain US-PROP-001's `propertyId` changes to `designs.service.ts` / `create-design.dto.ts`.
  That is intended (D1): M-PROP-01 rebases after M-PROP-03 lands and keeps both sides.
- Seed `--refresh` runs only **after** the milestone merges (runbook C §5, D3) — not during the story.

### Per-story loop (both lanes, from the runbooks §3)

```text
qa-agent (Sonnet) → test cases in STORY.md
unit-test-agent (Sonnet) → failing tests, only in listed test files
author (code-agent in a worktree) → ≤10-line report
orchestrator → npm run check + npm run test:unit (record exit codes), one commit per task:
               {type}(prop): T{n} {summary} — {US-ID}   (no AI attribution trailers)
gh pr create --base <milestone branch>  → CI: Gate 1 + scope check
scripts/agents/run-engine.sh codex review <US-ID> --branch <story branch> --base <milestone branch>
fix BLOCKING → re-review → squash-merge into the milestone branch
```

## 3 · Lessons from day 1 — read before starting

1. **Codex can't run tests.** Its read-only sandbox fails with EPERM, so it asks for evidence. Record
   `npm run check` / `npm run test:unit` **exit codes** (not just summaries) in STORY.md before requesting review.
2. **Codex blocks on missing manual evidence.** Run the story's manual/HTTP test cases before the review, not after.
   Day 1 took three review rounds on US-PROP-001 for this reason.
3. **Fresh worktrees have a stale Prisma client.** Run `npx prisma generate --schema=api/prisma/schema.prisma` before
   Gate 1, or `npm run check` fails on missing enums (`PlanTier`, `SubscriptionStatus`). The client under `api/node_modules`
   can also be stale; for DB scripts use a worktree where it was regenerated.
4. **Worktrees have no `.env`.** Copy it from the main checkout (`cp ../../../.env .env`, gitignored) before `npm run dev`.
5. **Backend has no watch.** Restart `npm run dev` after any `api/` edit. On Windows, stop it by killing the
   PIDs listening on 5000/3001 (`netstat -ano` → `taskkill //PID <pid> //T //F`). One dev server at a time.
6. **Node segfault (exit 139) on `npm run dev` happened once** — a plain retry worked.
7. **Git Bash mangles non-ASCII in `curl -d`** (₹ → `?`). Send JSON bodies from a file (`--data-binary @body.json`)
   or from a Node script. JSONB also reorders object keys — compare JSON key-order-insensitively.
8. **Manual tests against the shared DB:** register throwaway `@example.test` accounts, and put the cleanup in the
   **same** Node script (`try/finally`) as the checks. Two separate cleanup steps lost their state file on day 1.
   Abort cleanup if a test org has any other member.
9. **`prisma migrate deploy` against the shared DB is blocked** by the permission classifier. Use read-only
   `prisma migrate status`; repeat-deploy checks belong to the production deploy (see BL-50).
10. **Reading the live canvas store in Chrome:** `const m = await import('/src/hooks/useCanvasStore.ts');
    m.useCanvasStore.getState().elements` — Vite serves the same module instance the app uses.

## 4 · Decisions taken on day 1

| | Decision | Where recorded |
|---|---|---|
| TC-PROP-001-25 | Caller with no organization (a removed team member) → **403** on every Properties endpoint, never the `user.id` fallback (it can't satisfy the FK) | US-PROP-001 STORY.md; `callerOrganizationId()` in `properties.controller.ts` |
| TC-PROP-001-21 | Repeat-deploy + data-hash check **deferred to the M-PROP-01 production deploy** | **BL-50** (P1, deploy gate) and runbook A §5 |
| BL-51 | Removed team members get a 500 when saving a design (same FK fallback) | BACKLOG.md, P2, not scheduled |
| US-PROP-004 author | Written by a Claude agent instead of Codex, so **Codex** reviewed it | US-PROP-004 STORY.md |

## 5 · Housekeeping still open

- **PR #85** (this branch: both runbooks, BL-50, BL-51, this note) — docs only; merge so a session on `main` can see them.
- `docs/edit/harden-us-edit-024` (M-EDIT-09 story split) has no PR.
- **US-OBS-005** has been 🟡 since 2026-10-02 with its code merged (PR #57) — close it or note why it's open.
- Story statuses on `main` still read 🔲 for 001/004 — expected; closeout runs by hand at milestone merge (BL-48).
- Agent worktrees `.claude/worktrees/agent-a90488a633d8dee10` (001) and `agent-a3901f23aac026035` (004) are fully merged
  and can be removed (`git worktree remove`, after unlocking).

## 6 · Paste-ready opener for the next session

```text
Resume EPIC-PROP-01 wave day 2. Read docs/agile/sessions/2026-10-30_prop-wave1-handoff.md, then
M-PROP-01-RUNBOOK.md and M-PROP-03-RUNBOOK.md. Run Lane A (US-PROP-002, Opus author) and Lane C
(US-PROP-005, Sonnet author) in parallel per the runbooks §3, Codex reviews both. Stop only on the
runbooks' "Stop and ask" list.
```
