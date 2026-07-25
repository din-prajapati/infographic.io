# PR Task List — US-LAUNCH-010

> **Story:** [STORY.md](./STORY.md)
> **Branch:** `feat/launch-us-launch-010-config-hardening`
> **PR:** #17
> **Linear:** LIN-XXX
> **Type:** feat
>
> **Depends on:** US-LAUNCH-009 merged (contract defines the required-var set).

---

## Three Pillars Pre-flight (check before starting AI session)

- [ ] **Brain** — STORY.md filled: ACs written, out-of-scope listed, AI Implementation Prompt ready
- [ ] **Muscle** — This TASKS.md has file list + ordered tasks + exact commands
- [ ] **Map** — [ARCHITECTURE.mmd](../../ARCHITECTURE.mmd) exists for this epic
- [ ] **Env** — [ENV.yaml](../../ENV.yaml) loaded; US-LAUNCH-009 `ENVIRONMENTS.md` read (required-var set)

---

## PR Scope Summary

**One-liner:** Add `APP_ENV`, Zod boot-time env validation, and a RazorPay test/live guard — additive, staging keeps booting.
```
feat(config): APP_ENV + boot-time env validation + RazorPay test/live guard — US-LAUNCH-010
```

---

## Task Breakdown

### T1 — `getAppEnv()` helper + inference
**File:** `api/src/config/app-env.ts` (new)
**AC(s) covered:** AC1
**Changes:**
- `type AppEnv = 'local'|'staging'|'production'`
- `getAppEnv()`: `APP_ENV` → else infer from `RAILWAY_ENVIRONMENT_NAME` → else `NODE_ENV` → default `local`
- Pure, no side effects (unit-testable)

**Commit:**
```bash
git add api/src/config/app-env.ts
git commit -m "feat(config): T1 add getAppEnv() helper with safe inference — US-LAUNCH-010"
```

---

### T2 — Zod validation schema + RazorPay guard
**File:** `api/src/config/env.validation.ts` (new)
**AC(s) covered:** AC2, AC3
**Changes:**
- Zod schema: required vars = `DATABASE_URL`, `JWT_SECRET`, `OPENAI_API_KEY`, `IDEOGRAM_API_KEY`,
  `GOOGLE_CLIENT_ID`/`SECRET`/`CALLBACK_URL` (confirmed present on both staging+production, 2026-07-25).
  Stripe/Sentry/`RAILWAY_*`/**entire RazorPay block**/`SESSION_SECRET` (omitted) `.optional()` — per
  `Pre-requisite-story.md` §5 P0.5 (Option A) and P1.
- `validate(config)`: `schema.parse` with aggregated errors + RazorPay prefix guard that fires **only
  when `RAZORPAY_KEY_ID` is present**, keyed on `getAppEnv()`
- Throw one readable Error listing every offending key

**Commit:**
```bash
git add api/src/config/env.validation.ts
git commit -m "feat(config): T2 Zod boot validation + RazorPay test/live guard — US-LAUNCH-010"
```

---

### T3 — Wire `validate` into ConfigModule
**File:** `api/src/app.module.ts`
**AC(s) covered:** AC2, AC3, AC4
**Changes:**
- Import `validate` and pass to `ConfigModule.forRoot({ ..., validate })`
- Do NOT change `envFilePath`/`ignoreEnvFile` logic

**Commit:**
```bash
git add api/src/app.module.ts
git commit -m "feat(config): T3 wire boot-time validation into ConfigModule — US-LAUNCH-010"
```

---

### T4 — Unit tests
**File:** `api/tests/config/env.validation.spec.ts` (new)
**AC(s) covered:** AC5
**Changes:**
- valid pass · missing-required throws (key named) · APP_ENV inference · guard rejects live-in-nonprod · guard rejects test-in-prod

**Commit:**
```bash
git add api/tests/config/env.validation.spec.ts
git commit -m "test(config): T4 env validation + guard unit tests — US-LAUNCH-010"
```

---

### T5 — Add `APP_ENV` to the contract
**File:** `.env.example`, `docs/setup/ENVIRONMENTS.md`
**AC(s) covered:** AC1
**Changes:**
- Add `APP_ENV=local` (per-env) with comment; add matrix row (local/staging/production)

**Commit:**
```bash
git add .env.example docs/setup/ENVIRONMENTS.md
git commit -m "docs(config): T5 add APP_ENV to env contract + matrix — US-LAUNCH-010"
```

---

### T6 — Report boot-abort to Sentry (added 2026-07-25, post-implementation review)
**File:** `api/src/main.ts`
**AC(s) covered:** none directly (observability hardening of AC2/AC3's failure path — a boot-abort
that only reaches `console.error` is invisible unless someone is watching deploy logs at that exact
moment; this makes it a Sentry alert instead)
**Changes:**
- `bootstrap().catch()` now calls `Sentry.captureException(error)` then `await Sentry.flush(2000)`
  before `process.exit(1)` — the flush wait is required because event delivery is async and the
  process would otherwise die before the event reaches Sentry.
- Sentry stays `enabled: NODE_ENV === 'production'` (`instrument.ts`, unchanged) — fires on
  staging/production only, never spams local dev.
- Verified live: re-ran the T4 failure smoke tests (missing `JWT_SECRET`, RazorPay mode mismatch)
  directly via `npx tsx src/main.ts` — both still abort cleanly with exit code 1, ~2–4s slower
  (the flush wait), confirmed non-hanging across 3 repeated runs.

**Commit:**
```bash
git add api/src/main.ts
git commit -m "feat(observability): T6 report boot-time env validation failures to Sentry — US-LAUNCH-010"
```

---

### T7 — Remove hardcoded JWT_SECRET fallback in the Express spawn layer (added 2026-07-25, security finding during T4 verification)
**File:** `server/index.ts`
**AC(s) covered:** none directly (closes a gap that undermined AC2's real-world guarantee, and an
independent security issue — see below)
**Changes:**
- `JWT_SECRET: process.env.JWT_SECRET || 'infographic-jwt-secret'` → `JWT_SECRET: process.env.JWT_SECRET`
  (line 78). The literal `'infographic-jwt-secret'` was a hardcoded, publicly-committed fallback
  secret — violates this repo's own Security Rule ("secrets only in `.env*`, never hardcoded"). If
  `JWT_SECRET` were ever accidentally unset on Railway, the app would previously have silently signed
  and verified every user's JWT with a secret visible in source control (account-takeover risk),
  **instead of** failing closed via `env.validation.ts` as this story intends. Not a live risk today —
  `JWT_SECRET` is confirmed present on both staging and production (`Pre-requisite-story.md` §2) — but
  a dormant landmine, now removed.
- `DEMO_MODE`'s fallback (`|| 'false'`) was deliberately left alone — a safe non-secret default, not
  the same class of issue.
**Verified live** (see below — this required a different technique than T2/T4's direct-`validate()`
tests, since `server/index.ts:16-31` separately backfills any *falsy* `process.env` key from the local
root `.env` file before the fix's spawn call even runs — a shell-level override alone is silently
overwritten by that loader; the local `.env` file itself had to be temporarily and surgically edited to
prove it):
- **Before this fix:** boot via `npm run dev` with `JWT_SECRET` genuinely absent from `.env` → succeeded
  silently (masked).
- **After this fix:** same scenario → `[EnvValidation] ERROR Environment validation failed — boot
  aborted: JWT_SECRET: Required`, process exit code 1, confirmed across 3 consecutive auto-restart
  cycles (Express's own restart-on-failure loop). `.env` was restored immediately after, confirmed via
  a clean subsequent boot showing `✅ Environment validated`.
- That `server/index.ts:16-31` loader itself is **not** a security issue — it only pulls from the
  operator's own real, gitignored local secrets file, and production has no `.env` file in its deployed
  container (never committed, Railway injects real env vars directly) — so this loader is inert there.
  It only complicates *local* testing methodology, which is why the verification above required editing
  `.env` directly rather than a shell override.

**Commit:**
```bash
git add server/index.ts
git commit -m "fix(security): T7 remove hardcoded JWT_SECRET fallback in Express spawn — US-LAUNCH-010"
```

---

## File-to-Task Mapping

| File | Task(s) | AC(s) | Notes |
|------|---------|-------|-------|
| `api/src/config/app-env.ts` | T1 | AC1 | new |
| `api/src/config/env.validation.ts` | T2 | AC2, AC3 | new; also logs a success line (keys checked + resolved `APP_ENV`) via NestJS `Logger` |
| `api/src/app.module.ts` | T3 | AC2–AC4 | wire `validate` |
| `api/tests/config/env.validation.spec.ts` | T4 | AC5 | new, 17 tests |
| `.env.example`, `docs/setup/ENVIRONMENTS.md` | T5 | AC1 | add APP_ENV |
| `api/src/main.ts` | T6 | — | boot-abort → Sentry, added post-implementation |
| `server/index.ts` | T7 | — | removed hardcoded JWT_SECRET fallback, security finding |

---

## Exact Test Commands

```bash
# 1. TypeScript check
npm run check

# 2. Unit tests (all)
npm run test:unit

# 3. This story's tests
cd api && npx vitest run tests/config/env.validation.spec.ts --reporter=verbose

# 4. Local boot sanity (staging-shaped env: no APP_ENV, rzp_test_* ⇒ must start clean)
npm run dev   # confirm no validation abort; app serves on :5000

# 5. AC4 on staging — after merge, watch the auto-deploy
railway logs   # expect: Nest application successfully started
# then: GET /api/health → {"status":"ok","db":"connected"}
```

---

## Task Checklist

- [x] T1 — `getAppEnv()` helper
- [x] T2 — Zod schema + guard (+ success/failure Logger messages)
- [x] T3 — wire into ConfigModule
- [x] T4 — unit tests (17, all passing)
- [x] T5 — `APP_ENV` in contract
- [x] T6 — boot-abort → Sentry (added post-implementation)
- [x] `npm run check` passes ✅ (2 pre-existing unrelated errors in main.ts, not from this story — see note below)
- [x] `npm run test:unit` passes ✅ (105/105, no regressions)
- [x] Real-data smoke test — `validate()` run against live `railway variables` output for both staging and production (2026-07-25); both boot clean
- [x] Real local boot — full 3-server stack started clean via `npm run dev`
- [x] Failure-path smoke test — both `JWT_SECRET` missing and RazorPay mode-mismatch confirmed to abort with exit code 1 and the correct named error, run directly via `npx tsx src/main.ts`
- [x] T7 — hardcoded `JWT_SECRET` fallback removed from `server/index.ts`; re-verified the missing-var abort now fires through the **real** `npm run dev` entrypoint (previously masked — see T7 above for the full before/after)
- [x] **Gate 4a/4b (`npm run smoke:boot`)** — ✅ `BOOT OK — API answered on :3999 (HTTP 200) in 3s`. Run in a fresh, isolated `git worktree` branched from `origin/main` (see below) — first attempt without a local `.env` correctly showed all 6 required keys as missing and hung past the script's 90s timeout without ever printing a `BOOT FAILED` line; re-run with a real `.env` present resolved cleanly in 3s, confirming the timeout was a worktree-setup gap (no `.env` yet), not a code defect. The all-vars-absent edge case isn't representative of Railway (which always injects some vars) and was already independently confirmed correct via a direct `npx tsx src/main.ts` run (exits code 1, all 6 keys named, ~1s).
- [x] Staging deploy boots clean, no staging var change (AC4) ✅ — verified 2026-07-25 post-merge, see `TC-LAUNCH-010-05` in `STORY.md`
- [x] PR opened with story card as description ✅ — PR #17, squash-merged

> **Pre-existing, unrelated `tsc` errors:** `main.ts` has 2 duplicate-`@nestjs/common`-type errors
> from a root-vs-`api/node_modules` version mismatch, present before this story and unrelated to it —
> `deploy.yml` already runs `tsc --noEmit` with `continue-on-error: true` for exactly this reason.

---

## Test Is Truth

> Do not weaken the schema or guard to make a test pass. If staging would fail validation, that is a real finding — fix the schema's required/optional split so it matches staging's actual (valid) var set, do not delete the assertion.

---

## Anti-Patterns to Avoid in This Story

- Do NOT make `APP_ENV` a **required** var — staging doesn't have it yet; it must be inferred so staging keeps booting.
- Do NOT require any variable staging doesn't already have (would crash the live staging deploy on merge).
- Do NOT run `railway variables --set …` or change any staging value.
- Do NOT migrate `process.env.*` call sites to `ConfigService` — out of scope.
- Do NOT couple the guard to `NODE_ENV` (staging and prod share it) — key it on `getAppEnv()`.

---

## PR Open Command

```bash
gh pr create \
  --title "[US-LAUNCH-010] Config hardening — APP_ENV + boot validation + RazorPay guard" \
  --label "epic:launch,type:feat,priority:P1" \
  --body "$(cat docs/agile/epics/phase-1-ai-core/EPIC-LAUNCH-01/stories/US-LAUNCH-010/STORY.md)"
```

---

*Tasks created: 2026-07-11*
