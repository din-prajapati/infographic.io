# PR Task List — US-LAUNCH-010

> **Story:** [STORY.md](./STORY.md)
> **Branch:** `feat/launch-us-launch-010-config-hardening`
> **PR:** #_____ (fill when opened)
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
- Zod schema: required vars from US-LAUNCH-009 contract; Stripe/Sentry/`RAILWAY_*` `.optional()`
- `validate(config)`: `schema.parse` with aggregated errors + RazorPay prefix guard keyed on `getAppEnv()`
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

## File-to-Task Mapping

| File | Task(s) | AC(s) | Notes |
|------|---------|-------|-------|
| `api/src/config/app-env.ts` | T1 | AC1 | new |
| `api/src/config/env.validation.ts` | T2 | AC2, AC3 | new |
| `api/src/app.module.ts` | T3 | AC2–AC4 | wire `validate` |
| `api/tests/config/env.validation.spec.ts` | T4 | AC5 | new |
| `.env.example`, `docs/setup/ENVIRONMENTS.md` | T5 | AC1 | add APP_ENV |

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

- [ ] T1 — `getAppEnv()` helper
- [ ] T2 — Zod schema + guard
- [ ] T3 — wire into ConfigModule
- [ ] T4 — unit tests
- [ ] T5 — `APP_ENV` in contract
- [ ] `npm run check` passes ✅
- [ ] `npm run test:unit` passes ✅
- [ ] Staging deploy boots clean, no staging var change (AC4) ✅
- [ ] PR opened with story card as description ✅

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
