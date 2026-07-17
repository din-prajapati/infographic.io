# Pre-Requisites — US-LAUNCH-010 (Config Hardening)

> **Type:** Pre-implementation gate + remediation plan
> **Story:** [STORY.md](./STORY.md) — Config hardening (APP_ENV + Zod boot validation + RazorPay guard)
> **Status:** 🔲 Blocking — US-LAUNCH-010 must NOT be implemented until Section 5 is complete
> **Created:** 2026-07-13
> **Author:** Pre-flight breaking-change analysis (see Section 2 for method)

---

## 1. Why this document exists

US-LAUNCH-010 introduces **boot-time Zod validation** and a **RazorPay test/live guard**. Both are
*fail-closed* by design: on a missing/malformed required variable, or a key-mode mismatch, the NestJS
process **aborts before serving traffic**.

That is the intended behaviour in production — but implemented naively (per the story's AI prompt) it will
**brick the live staging deploy** the moment it merges to `main`. Staging is currently live and must keep
booting unchanged (STORY.md AC4).

This document enumerates:
- **Section 3** — every key in `.env` that breaks a naive implementation, and why.
- **Section 4** — every key that needs a **provider-side** (dashboard/DNS) change — not fixable in code.
- **Section 5** — the ordered remediation plan that must be green before `/implement-story` runs.

> **One-line takeaway:** the danger is not the validation itself — it is the gap between the *required-var
> set the schema declares* and the *actual var set staging has provisioned*. Close that gap first.

---

## 2. Evidence base (how these findings were derived)

| Source | What it tells us |
|---|---|
| `scripts/push-staging-vars.ps1` | **Authoritative list of what staging has provisioned** (21 keys). |
| `.env` (local) | The developer/local var set — includes 4 placeholder values and is missing the email keys. |
| `grep process.env.* api/src server` | The vars actually **read at runtime** and whether each has a code-level default. |
| `docs/setup/ENVIRONMENTS.md` + `.env.example` | The US-LAUNCH-009 contract (the story's declared "required-var set"). |
| `api/src/modules/email/email.service.ts` | EmailService is **graceful** — `RESEND_API_KEY`/`EMAIL_FROM` must be optional. |
| `api/src/modules/ai-generation/services/openai.service.ts:29` | `GEMINI_API_KEY` **warns + falls back** to GPT-4o — must be optional. |

**Staging's provisioned set** (from `push-staging-vars.ps1`): `DATABASE_URL`, `NODE_ENV=production`,
`JWT_SECRET`, `SESSION_SECRET`, `OPENAI_API_KEY`, `IDEOGRAM_API_KEY`, `RAZORPAY_KEY_ID` (`rzp_test_*`),
`RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `RAZORPAY_PLAN_SOLO_MONTHLY`, `RAZORPAY_PLAN_SOLO_ANNUAL`,
`RAZORPAY_PLAN_TEAM_MONTHLY`, `RAZORPAY_PLAN_TEAM_ANNUAL`, `VITE_RAZORPAY_KEY_ID` (`rzp_test_*`),
`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, `SENTRY_DSN`, `VITE_SENTRY_DSN`,
`VITE_STORAGE_PREFIX`, `STRIPE_ENABLED=false`.

**Not on staging** (therefore must be `.optional()` or the app must default them): `GEMINI_API_KEY`,
`RESEND_API_KEY`, `EMAIL_FROM`, `DEMO_MODE`, `BASE_URL`, `CLIENT_URL`, all BROKERAGE/API/legacy plan IDs,
all Stripe price/secret keys, `APP_ENV`.

---

## 3. Keys in `.env` that break a naive implementation

### 3.1 🔴 Placeholder values in live keys — break if the schema shape-validates
These look present (non-empty) but hold the literal placeholder `plan_...`. A `required` + shape/regex
check rejects them → **boot abort**.

| Key | Value in `.env` | Line | Remediation |
|---|---|---|---|
| `RAZORPAY_PLAN_BROKERAGE_MONTHLY` | `plan_...` | 78 | `.optional()`, no shape-check (or delete the line) |
| `RAZORPAY_PLAN_BROKERAGE_ANNUAL` | `plan_...` | 79 | `.optional()`, no shape-check |
| `RAZORPAY_PLAN_API_STARTER` | `plan_...` | 82 | `.optional()`, no shape-check |
| `RAZORPAY_PLAN_API_GROWTH` | `plan_...` | 83 | `.optional()`, no shape-check |

### 3.2 🔴 Absent keys — break if marked required
| Key | In `.env`? | Code behaviour | Remediation |
|---|---|---|---|
| `RESEND_API_KEY` | ❌ | EmailService dev-fallback, never throws (`email.service.ts:48`) | `.optional()`. Also **missing from US-LAUNCH-009 contract** — add row |
| `EMAIL_FROM` | ❌ | Defaults to `noreply@example.com` | `.optional()`. Add to contract |
| `DEMO_MODE` | ❌ | Read 4× with defaults | `.optional()` |

### 3.3 🟠 Present but contradicts contract / wrong shape
| Key | Issue | Remediation |
|---|---|---|
| `SESSION_SECRET` | Present (line 30) but **not read by any code**; *removed* from `.env.example` in US-LAUNCH-009. Requiring it contradicts the contract and breaks a dev using the new `.env.example`. | Omit from schema (do not require) |
| `GEMINI_API_KEY` | Present (line 53) with shape `AQ.Ab8…`; contract expects `AI…`. Not on staging. | `.optional()`, no prefix shape-check |

### 3.4 🔴 Showstopper — the guard trio (interaction, not a single key)
| Keys involved | Value | Risk |
|---|---|---|
| `NODE_ENV` | `production` on staging | Shared with prod — cannot distinguish envs |
| `RAZORPAY_KEY_ID` / `VITE_RAZORPAY_KEY_ID` | `rzp_test_*` | Correct for staging |
| `APP_ENV` / `RAILWAY_ENVIRONMENT_NAME` | unset / unverified | If `getAppEnv()` falls through to `NODE_ENV=production`, the guard demands `rzp_live_*` and **rejects staging's test keys → boot abort** |

**Root cause:** `getAppEnv()` inference (`APP_ENV → RAILWAY_ENVIRONMENT_NAME → NODE_ENV → 'local'`) resolves
to `production` on staging whenever `RAILWAY_ENVIRONMENT_NAME` is absent or not equal to `staging`.
`RAILWAY_ENVIRONMENT_NAME` is referenced **nowhere in the codebase today** — it is an unverified assumption.

> **Local dev is safe** on the guard: `getAppEnv()` → `local`, keys are `rzp_test_*`. ✅

---

## 4. Keys requiring provider-side configuration changes

Not fixable in code — require action in an external dashboard/DNS. Most are deferrable to US-LAUNCH-005
(revenue) or US-LAUNCH-002 (email); listed here so the schema marks them **optional** and they don't gate beta.

| Key | Provider | Action | For env / story |
|---|---|---|---|
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `VITE_RAZORPAY_KEY_ID` | RazorPay Dashboard | Activate **live mode**, generate `rzp_live_*` keys | Production — US-LAUNCH-005 (HUMAN) |
| `RAZORPAY_WEBHOOK_SECRET` | RazorPay → Webhooks | New webhook endpoint at prod domain; per-env secret | Production — US-LAUNCH-005 |
| `RAZORPAY_PLAN_BROKERAGE_MONTHLY` / `_ANNUAL` | RazorPay → Plans | Create plans (currently `plan_...`) **or** gate BROKERAGE behind "Contact us" (US-LAUNCH-007) | PT-06 deferred |
| `RAZORPAY_PLAN_API_STARTER` / `_API_GROWTH` | RazorPay → Plans | Create if API tiers launch; else keep optional | Deferred |
| `RESEND_API_KEY` | Resend Dashboard | Create API key | Staging + prod — US-LAUNCH-002/003 |
| `EMAIL_FROM` | Resend / DNS | Verify sending domain; set from-address | Staging + prod |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` | Google Cloud Console | Separate OAuth client per env; add exact redirect URI to Authorized Redirect URIs | Staging + prod |
| `GEMINI_API_KEY` | Google AI Studio | Provision a valid key if FREE/SOLO LLM must run (local shape `AQ.Ab8…` looks wrong); degrades gracefully otherwise | Optional |
| `DATABASE_URL` | Neon | Separate branch per env (staging branch → staging, main → prod) | Per-env |
| `APP_ENV` *(new)* | **Railway** (deploy target) | Set `APP_ENV=staging` and `APP_ENV=production` — removes the `getAppEnv()` guesswork (Section 3.4) | **Recommended before merge** |

> `RAILWAY_ENVIRONMENT_NAME` is auto-injected by Railway (nothing to *set*), but **verify** the staging
> environment is literally named `staging`, or the inference in 3.4 misfires.

---

## 5. Step-by-step remediation plan (prerequisite gate)

Complete **P0–P2** before running `/implement-story` on US-LAUNCH-010. P3–P4 are the implementation guardrails.

### P0 — Make the environment unambiguous *(Railway, human, ~10 min)*
1. [ ] Confirm the staging Railway environment name; verify `RAILWAY_ENVIRONMENT_NAME` resolves there.
2. [ ] **Set `APP_ENV=staging`** on Railway staging (overrides STORY.md's "purely additive" constraint — that
       constraint is exactly what makes the guard fragile). Record the deviation as a one-line ADR note.
3. [ ] Leave `APP_ENV` unset locally (infers `local`); plan to set `APP_ENV=production` at Phase 0 Task 3.

### P1 — Reconcile the contract with reality *(docs, ~15 min)*
4. [ ] Add `RESEND_API_KEY` + `EMAIL_FROM` rows to `docs/setup/ENVIRONMENTS.md` and `.env.example`
       (marked optional — EmailService is graceful). Closes the US-LAUNCH-002 contract gap.
5. [ ] Decide `SESSION_SECRET`: keep pruned from the contract → **do not** put it in the schema.

### P2 — Clean the placeholder values *(local `.env` hygiene, ~5 min)*
6. [ ] In `.env`, either comment out or leave-but-do-not-require the four `plan_...` placeholders
       (`RAZORPAY_PLAN_BROKERAGE_MONTHLY/_ANNUAL`, `RAZORPAY_PLAN_API_STARTER/_API_GROWTH`).
7. [ ] Confirm no provider work is needed for beta (BROKERAGE + API tiers are deferred).

### P3 — Implement with the safe required/optional split *(code — US-LAUNCH-010 T1–T5)*
8. [ ] **Required set = {read at boot} ∩ {provisioned on staging}:**
       `DATABASE_URL`, `JWT_SECRET`, `OPENAI_API_KEY`, `IDEOGRAM_API_KEY`, `RAZORPAY_KEY_ID`,
       `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `RAZORPAY_PLAN_SOLO_MONTHLY`,
       `RAZORPAY_PLAN_SOLO_ANNUAL`, `RAZORPAY_PLAN_TEAM_MONTHLY`, `RAZORPAY_PLAN_TEAM_ANNUAL`,
       `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`.
9. [ ] **Everything else `.optional()`:** `GEMINI_API_KEY`, `RESEND_API_KEY`, `EMAIL_FROM`, `SESSION_SECRET`
       (omit), `DEMO_MODE`, `BASE_URL`, `CLIENT_URL`, all BROKERAGE/API/legacy plan IDs, all Stripe keys,
       Sentry, all `RAILWAY_*`, all `VITE_*`.
10. [ ] **Do not shape/regex-check** plan IDs or `GEMINI_API_KEY` (placeholder/non-standard values exist).
11. [ ] **Harden the guard:** reject `rzp_live_*` only when `APP_ENV` is **explicitly** `production`; do not
        hard-require `rzp_live_*` on a merely *inferred* environment. This makes "live keys on staging"
        impossible without bricking staging on an inference miss.

### P4 — Verify before and after merge *(gates)*
12. [ ] `npm run check` + `npm run test:unit` green (incl. new `env.validation.spec.ts`).
13. [ ] `npm run smoke:boot` (Gate 4a) green locally — confirms real boot, not just `tsc`.
14. [ ] After merge: `railway logs` shows `Nest application successfully started`; `/api/health` = ok (AC4,
        TC-LAUNCH-010-05).

---

## 6. Sign-off checklist (Definition of Ready for US-LAUNCH-010)

- [ ] P0 complete — `APP_ENV=staging` set on Railway; staging env name verified
- [ ] P1 complete — contract reconciled (email keys added; `SESSION_SECRET` decision recorded)
- [ ] P2 complete — placeholder plan IDs will not trip validation
- [ ] Required/optional split (P3.8–P3.9) reviewed and signed off
- [ ] Guard-hardening approach (P3.11) agreed
- [ ] Rollback note: if staging fails to boot post-merge, revert the ConfigModule `validate` wiring
      commit (T3) — validation is the only fail-closed surface

> **Gate:** US-LAUNCH-010 stays `🔲 Not Started` until every box above is ticked. This document is the
> Definition of Ready.

---

*Created 2026-07-13 — pre-flight analysis for US-LAUNCH-010. See [STORY.md](./STORY.md) §AC4 and the
project rule "Test Is Truth": if staging would fail validation, fix the required/optional split — never
weaken the assertion.*
