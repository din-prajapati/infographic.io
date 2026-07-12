# PR Task List — US-LAUNCH-009

> **Story:** [STORY.md](./STORY.md)
> **Branch:** `feat/launch-us-launch-009-env-secrets-convention`
> **PR:** #_____ (fill when opened)
> **Linear:** LIN-XXX
> **Type:** docs

---

## Three Pillars Pre-flight (check before starting AI session)

- [ ] **Brain** — STORY.md filled: ACs written, out-of-scope listed, AI Implementation Prompt ready
- [ ] **Muscle** — This TASKS.md has file list + ordered tasks + exact commands
- [ ] **Map** — [ARCHITECTURE.mmd](../../ARCHITECTURE.mmd) exists for this epic
- [ ] **Env** — [ENV.yaml](../../ENV.yaml) loaded (paths not guessed)

---

## PR Scope Summary

**One-liner:** Document the per-environment variable convention (matrix + rewritten `.env.example` + `secrets/` pattern) with zero code and zero staging changes.
```
docs(launch): env & secrets management convention — US-LAUNCH-009
```

---

## Task Breakdown

### T1 — Enumerate the authoritative variable set
**File:** _(analysis, no file)_
**AC(s) covered:** AC1, AC3
**Changes:**
- Run `grep -rhoE "process\.env\.[A-Z_0-9]+" api/src server client --include=*.ts --include=*.tsx | sort -u`
- Capture `VITE_*` read in `client/`
- This list drives the matrix and the `.env.example` audit.

---

### T2 — Write the environment matrix
**File:** `docs/setup/ENVIRONMENTS.md` (new)
**AC(s) covered:** AC1
**Changes:**
- Per-variable table: Variable · Local · Staging · Production · Per-env/Shared · Source · Notes (value **shapes** only)
- Encode the separation policy (Google per-env client, RazorPay test/live, webhook per endpoint, JWT/SESSION unique, AI keys own, Sentry env tag)

**Commit:**
```bash
git add docs/setup/ENVIRONMENTS.md
git commit -m "docs(launch): T2 add per-environment variable matrix — US-LAUNCH-009"
```

---

### T3 — Rewrite `.env.example` as the contract + prune dead vars
**File:** `.env.example`
**AC(s) covered:** AC2, AC3
**Changes:**
- Group by concern; every used var present with placeholder + `# per-env`/`# shared` tag
- Remove Paddle, PayPal, individual `PG*`; mark Stripe optional/disabled
- Verify pruned keys unused: `grep -rn "PADDLE_\|PAYPAL_\|PGHOST\|PGPORT\|PGUSER\|PGPASSWORD\|PGDATABASE" api/src server`

**Commit:**
```bash
git add .env.example
git commit -m "docs(launch): T3 rewrite .env.example contract + prune dead vars — US-LAUNCH-009"
```

---

### T4 — `secrets/` convention + gitignore (+ optional sync script)
**File:** `secrets/README.md` (new), `.gitignore`, `scripts/railway-env-sync.sh` (new, optional)
**AC(s) covered:** AC4
**Changes:**
- `.gitignore`: add `secrets/` and `secrets/*.env`
- `secrets/README.md`: master-copy pattern + cloud-synced-drive plaintext warning
- Optional: `scripts/railway-env-sync.sh` wrapping `railway variables --set … --environment <env>`

**Commit:**
```bash
git add secrets/README.md .gitignore scripts/railway-env-sync.sh
git commit -m "docs(launch): T4 secrets/ master-copy convention + gitignore — US-LAUNCH-009"
```

---

## File-to-Task Mapping

| File | Task(s) | AC(s) | Notes |
|------|---------|-------|-------|
| `docs/setup/ENVIRONMENTS.md` | T2 | AC1 | new |
| `.env.example` | T3 | AC2, AC3 | rewrite + prune |
| `secrets/README.md` | T4 | AC4 | new |
| `.gitignore` | T4 | AC4 | add `secrets/` |
| `scripts/railway-env-sync.sh` | T4 | AC4 | new, optional |

---

## Exact Test Commands

```bash
# 1. TypeScript check — must stay green (no code changed)
npm run check

# 2. AC5 proof — no code in the diff
git diff --name-only    # expect only docs/, .env.example, .gitignore, secrets/README.md (+ script)

# 3. AC3 proof — pruned keys unused
grep -rn "PADDLE_\|PAYPAL_\|PGHOST\|PGPORT\|PGUSER\|PGPASSWORD\|PGDATABASE" api/src server || echo "none referenced"

# 4. AC5 proof — staging untouched (capture before + after, diff must be empty)
railway variables --environment staging --kv | sort > /tmp/staging-before.txt
# …after PR…
railway variables --environment staging --kv | sort > /tmp/staging-after.txt
diff /tmp/staging-before.txt /tmp/staging-after.txt && echo "staging identical"
```

---

## Task Checklist

- [x] T1 — enumerate variable set
- [x] T2 — `docs/setup/ENVIRONMENTS.md`
- [x] T3 — `.env.example` rewrite + prune
- [x] T4 — `secrets/` convention + gitignore
- [x] `npm run check` passes ✅
- [x] `git diff --name-only` shows no `.ts`/`.tsx` ✅
- [ ] Staging variables identical before/after ✅ (manual verification — requires `railway` CLI)
- [ ] PR opened with story card as description ✅

---

## Test Is Truth

> Do not weaken any check to pass. This story ships no code; the "tests" are the AC5 diff proofs — they must genuinely show staging untouched and no code changed.

---

## Anti-Patterns to Avoid in This Story

- Do NOT edit any `.ts`/`.tsx` — `APP_ENV`, validation, and the key guard are US-LAUNCH-010.
- Do NOT run `railway variables --set …` or otherwise mutate staging.
- Do NOT paste any real secret value into `.env.example`, the matrix, or `secrets/`.
- Do NOT delete Stripe vars — they are optional/disabled, not dead.

---

## PR Open Command

```bash
gh pr create \
  --title "[US-LAUNCH-009] Environment & secrets management convention" \
  --label "epic:launch,type:docs,priority:P1" \
  --body "$(cat docs/agile/epics/phase-1-ai-core/EPIC-LAUNCH-01/stories/US-LAUNCH-009/STORY.md)"
```

---

*Tasks created: 2026-07-11*
