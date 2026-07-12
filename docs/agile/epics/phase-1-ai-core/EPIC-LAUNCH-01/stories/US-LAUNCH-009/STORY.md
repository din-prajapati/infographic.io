# Story Card — US-LAUNCH-009

> **Status:** 🟡 Implemented — merged to `main` (ec166fb, 2026-07-12); ACs met, Gate 1 green. Awaiting M-LAUNCH-01 close (blocked by Phase 0 Task 3 deploy).
> **Feature:** F-LAUNCH-06 — Environment & Secrets Management
> **Epic:** [EPIC-LAUNCH-01](../../EPIC.md)
> **Milestone:** [M-LAUNCH-01-public-beta](../../milestones/M-LAUNCH-01-public-beta.md)
> **Linear:** LIN-XXX
> **Created:** 2026-07-11 | **Closed:** —

---

## Story

*As a* solo operator/developer preparing InfographicAI for production go-live
*I want* a single documented convention for what every environment variable is, which environment owns which value, and where each value lives (local `.env` vs Railway staging vs Railway production)
*So that* I can populate the production store correctly the first time, never leak a secret across environments, and never again ship a placeholder/wrong value the way F2-02 (webhook URL) and the placeholder webhook secret slipped through in Phase 0 QA.

---

## Acceptance Criteria

- [x] **AC1 [happy-path]:** A new committed doc `docs/setup/ENVIRONMENTS.md` contains a per-variable matrix. Every variable the app reads (the `process.env.*` set — currently ~40 keys) appears as a row with columns: **Variable · Local · Staging · Production · Per-env or Shared · Source (where the value comes from) · Notes**. Each of Local/Staging/Production cells states the value *shape* (never a real secret) — e.g. `rzp_test_*`, `rzp_live_*`, `http://localhost:5000/...`, "unique random 32-byte", "same as staging", or "—" (not used).
- [x] **AC2 [happy-path]:** `.env.example` is rewritten as the canonical committed contract: grouped by concern (Core/DB · Auth · Google OAuth · AI keys · Payments/RazorPay · Payments/Stripe · Observability · Frontend `VITE_*`), every currently-used variable present with a placeholder value and a one-line comment, and each variable tagged in-comment as `# per-env` or `# shared`. No real secret values appear.
- [x] **AC3 [happy-path]:** Dead/unused variables are pruned from `.env.example` (and documented as removed in `ENVIRONMENTS.md`): the Paddle keys, PayPal keys, and the individual `PG*` connection parts (`PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE` — superseded by `DATABASE_URL`) are removed. Stripe vars are retained but clearly marked "optional, disabled by default (`STRIPE_ENABLED=false`)". A grep confirms none of the pruned keys are still read in `api/src` or `server` (if any still are, they are listed in Out-of-Scope follow-up, not silently left).
- [x] **AC4 [happy-path]:** A gitignored `secrets/` directory convention is documented and enforced: `.gitignore` ignores `secrets/` (and `*.env` inside it), a committed `secrets/README.md` explains the `secrets/<env>.env` master-copy pattern, and the doc explicitly warns not to store plaintext secret files inside the cloud-synced repo path (`…/DCloud/GITDrive/…`). No real secret file is committed.
- [x] **AC5 [edge-case]:** **Staging is not disturbed.** This story changes only committed docs/templates and `.gitignore` — it makes **zero** changes to Railway staging variables and **zero** changes to any code that reads config. Verified by: `git diff --name-only` touches only `.env.example`, `docs/**`, `secrets/README.md`, `.gitignore` (+ optional sync script); and `railway variables --environment staging` before/after is identical.

---

## Out of Scope

- **All code changes** — introducing `APP_ENV`, boot-time validation, and the test-vs-live key guard are **US-LAUNCH-010** (depends on this story). This story touches no `.ts`.
- Actually creating the Railway `production` environment or populating live values — that is Task 3 of the Phase 0 deploy checklist (human/dashboard).
- Adopting an external secrets manager (Doppler/Infisical) — post-launch decision, explicitly deferred.
- Rotating any existing secret — this documents the convention, it does not re-issue keys.
- Refactoring `process.env.*` reads to `ConfigService` — separate refactor, not required for the convention.

---

## Engineering / PR

- **Branch:** `feat/launch-us-launch-009-env-secrets-convention`
- **PR:** #_____ (fill when opened)
- **Primary files touched:**
  - `docs/setup/ENVIRONMENTS.md` (new — the matrix)
  - `.env.example` (rewrite as contract)
  - `secrets/README.md` (new — master-copy convention)
  - `.gitignore` (ignore `secrets/`)
  - `scripts/railway-env-sync.sh` (new, optional — CLI push helper) `(TBC)`

---

## AI Implementation Prompt

> Copy this block into Claude Code to implement the story.

```
Context: InfographicAI SaaS — NestJS API (3001) + React (5000 via Express proxy). See CLAUDE.md.
Config is read as raw process.env.* (no ConfigService, no validation). Three environments:
local (.env file), staging (Railway staging vars), production (Railway production vars, not yet created).
Staging is LIVE and must not be disturbed.

Story: US-LAUNCH-009 — Environment & Secrets Management convention (DOCS/CONFIG ONLY, no code).

Do this:
1. Enumerate every env var the app reads:
   grep -rhoE "process\.env\.[A-Z_0-9]+" api/src server client --include=*.ts --include=*.tsx | sort -u
   plus VITE_* read in client. That is the authoritative variable set.
2. Write docs/setup/ENVIRONMENTS.md — a per-variable matrix (Variable · Local · Staging · Production ·
   Per-env/Shared · Source · Notes). Value SHAPES only, never real secrets. Reflect the separation policy:
   Google OAuth = separate client per env; RazorPay = rzp_test_* (local+staging) vs rzp_live_* (prod);
   webhook secret = one per endpoint; JWT/SESSION = unique per env; AI keys = own per env ideally;
   Sentry = one project + environment tag.
3. Rewrite .env.example as the committed contract: grouped, every used var, placeholder values,
   per-var "# per-env"/"# shared" tag. Prune Paddle, PayPal, PG* (individual parts). Keep Stripe marked
   optional/disabled.
4. Add secrets/ convention: .gitignore ignores secrets/, add secrets/README.md explaining secrets/<env>.env
   master copies + the cloud-synced-drive plaintext warning. Optionally add scripts/railway-env-sync.sh.

Rules:
- Touch ONLY: .env.example, docs/**, secrets/README.md, .gitignore, scripts/railway-env-sync.sh
- Do NOT touch any .ts / .tsx. Do NOT run any `railway variables --set`. Do NOT change staging.
- No real secret values anywhere.
- When done: list files changed, ACs checked, and paste `git diff --name-only` to prove AC5.
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-LAUNCH-009-01 | Manual | P0 | Given the code's `process.env.*` set, When comparing to `.env.example`, Then every used var is present and every `.env.example` var is used (no orphans except intentionally-optional Stripe). | 🔲 | |
| TC-LAUNCH-009-02 | Manual | P0 | Given AC5, When running `git diff --name-only`, Then only docs/`.env.example`/`.gitignore`/`secrets/README.md`(/sync script) appear — no `.ts`/`.tsx`. | 🔲 | |
| TC-LAUNCH-009-03 | Manual | P0 | Given staging is live, When `railway variables --environment staging` is captured before and after the PR, Then the two lists are identical. | 🔲 | |
| TC-LAUNCH-009-04 | Manual | P1 | Given the pruned keys (Paddle/PayPal/PG*), When grepping `api/src` + `server`, Then none are still read (or any remaining are listed as follow-up). | 🔲 | |
| TC-LAUNCH-009-05 | Manual | P1 | Given `ENVIRONMENTS.md`, When a reader looks up `RAZORPAY_KEY_ID`, Then the matrix clearly states `rzp_test_*` for local+staging and `rzp_live_*` for production. | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [ ] All ACs checked ✅
- [ ] All test cases run and recorded
- [ ] `npm run check` passes (no code changed → still green)
- [ ] No `.ts`/`.tsx` in the diff (AC5)
- [ ] Staging variables identical before/after (AC5)
- [ ] PR merged (PR #{number})
- [ ] [TASKS.md](./TASKS.md) task list fully checked

---

*Story created: 2026-07-11*
