# Pre-Requisites — US-LAUNCH-010 (Config Hardening)

> **Type:** Pre-implementation gate + remediation plan
> **Story:** [STORY.md](./STORY.md) — Config hardening (APP_ENV + Zod boot validation + RazorPay guard)
> **Status:** ✅ Resolved — Section 5 remediation complete; US-LAUNCH-010 implemented and closed 2026-07-25
> **Created:** 2026-07-13
> **Last re-audited:** 2026-07-25 — against **live Railway data**, not a snapshot (see Section 2)
> **Author:** Pre-flight breaking-change analysis (see Section 2 for method)

---

## 0. What changed since the original 2026-07-13 analysis (read this first)

The original version of this doc assumed `APP_ENV` was unset everywhere and that a `production`
Railway environment didn't exist yet. Neither is true anymore. A 2026-07-25 audit against the live
`railway variables` output for both environments found:

| Original assumption (2026-07-13) | Actual state (2026-07-25) |
|---|---|
| `APP_ENV` unset everywhere → guard falls through to `NODE_ENV=production` on staging → **boot abort** | `APP_ENV` is already **explicitly set** on both Railway environments (`staging`→`staging`, `production`→`production`). §3.4's original showstopper is **resolved**. P0 below is already done. |
| Production Railway environment "not yet created" | **Production exists, is deployed, and is live** at `https://app.buildographic.com` (service `infographic-production`, ● Online, deployed from `main`). |
| Staging has 21 provisioned keys | Staging (and production) now each carry **43** keys — see §2. |
| — (not analyzed) | **NEW showstopper:** production's entire RazorPay block (`RAZORPAY_KEY_ID/KEY_SECRET/WEBHOOK_SECRET`, `VITE_RAZORPAY_KEY_ID`, all 4 plan IDs) is **empty**. AC3 as literally written cannot pass against production's real current state. See §3.5. |
| — (not analyzed) | **NEW bug (unrelated to this story, found during the audit):** staging's `GOOGLE_CLIENT_ID`/`SECRET`/`CALLBACK_URL` point at the **Local** OAuth client, not the dedicated Staging client that already exists in Google Cloud Console. See §3.6. |
| — (not analyzed) | **NEW deploy-trigger fact:** per `.github/workflows/deploy.yml`, **staging auto-deploys on every push to `main`**; **production only deploys on a `v*` git tag push**. This changes the urgency/blast-radius model in §5. |

**Net effect:** the danger this story originally guarded against (bricking staging on merge) is gone.
A different, more serious danger has taken its place: naive implementation of AC3's required-set would
**crash-loop the live production site** (`railway.json` → `restartPolicyMaxRetries: 3`, then the service
sits down) the next time someone pushes a release tag — not staging.

---

## 1. Why this document exists

US-LAUNCH-010 introduces **boot-time Zod validation** and a **RazorPay test/live guard**. Both are
*fail-closed* by design: on a missing/malformed required variable, or a key-mode mismatch, the NestJS
process **aborts before serving traffic**.

That is the intended behaviour — but implemented naively it can brick a live deploy the moment its
required-set doesn't match what an environment actually has provisioned. As of 2026-07-25 that target
is **production**, not staging (see §0).

This document enumerates:
- **Section 3** — every key that breaks a naive implementation, and why.
- **Section 4** — every key that needs a **provider-side** (dashboard/DNS) change — not fixable in code.
- **Section 5** — the ordered remediation plan that must be green before `/implement-story` runs.

> **One-line takeaway:** the danger is not the validation itself — it is the gap between the *required-var
> set the schema declares* and the *actual var set each environment has provisioned*. Close that gap first,
> for **both** environments, using their current real values — not a stale snapshot.

---

## 2. Evidence base (how these findings were derived)

| Source | What it tells us |
|---|---|
| `railway variables --service infographic-production --environment staging --kv` | **Authoritative, live** list of what staging has provisioned today (43 keys). |
| `railway variables --service infographic-production --environment production --kv` | **Authoritative, live** list of what production has provisioned today (43 keys, same names as staging, different values). |
| `railway environment list` / `railway status --json` | Confirms both environments exist; production is `● Online` at `https://app.buildographic.com`, deployed from `main`, `RUNNING`. |
| `.github/workflows/deploy.yml` (header comment) | Staging auto-deploys on every push to `main`. Production only deploys on a `v*` tag push. |
| `railway.json` | `restartPolicyType: ON_FAILURE`, `restartPolicyMaxRetries: 3`, `healthcheckPath: "/"` — a boot-validation abort on production crash-loops 3× then the service goes down. |
| Google Cloud Console → Google Auth Platform → Clients (user-provided screenshot, cross-checked against `.env` and Railway vars) | Three OAuth clients already exist: `buildographic — Local`, `buildographic - Staging`, `buildographic - Production`, all in project `Infographic-real-esate-AI`. Production is wired correctly; staging is not (see §3.6). |
| `.env` (local) | The developer/local var set — includes 4 placeholder values. |
| `grep process.env.* api/src server` | The vars actually **read at runtime** and whether each has a code-level default. |
| `docs/setup/ENVIRONMENTS.md` + `.env.example` | The US-LAUNCH-009 contract (the story's declared "required-var set"). |
| `api/src/modules/email/email.service.ts` | EmailService is **graceful** — `RESEND_API_KEY`/`EMAIL_FROM` must be optional. |
| `api/src/modules/ai-generation/services/openai.service.ts:29` | `GEMINI_API_KEY` **warns + falls back** to GPT-4o — must be optional. |

**Both staging and production now provision the same 43 variable *names*** (values differ per-env, as
intended):
`API_PORT`, `APP_ENV`, `BASE_URL`, `CLIENT_URL`, `DATABASE_URL`, `EMAIL_FROM`, `GEMINI_API_KEY`,
`GOOGLE_CALLBACK_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `IDEOGRAM_API_KEY`, `JWT_SECRET`,
`NODE_ENV`, `OPENAI_API_KEY`, `PORT`, `RAILWAY_ENVIRONMENT`, `RAILWAY_ENVIRONMENT_ID`,
`RAILWAY_ENVIRONMENT_NAME`, `RAILWAY_PRIVATE_DOMAIN`, `RAILWAY_PROJECT_ID`, `RAILWAY_PROJECT_NAME`,
`RAILWAY_PUBLIC_DOMAIN`, `RAILWAY_SERVICE_ID`, `RAILWAY_SERVICE_INFOGRAPHIC_PRODUCTION_URL`,
`RAILWAY_SERVICE_NAME`, `RAILWAY_STATIC_URL`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`,
`RAZORPAY_PLAN_SOLO_ANNUAL`, `RAZORPAY_PLAN_SOLO_MONTHLY`, `RAZORPAY_PLAN_TEAM_ANNUAL`,
`RAZORPAY_PLAN_TEAM_MONTHLY`, `RAZORPAY_WEBHOOK_SECRET`, `RESEND_API_KEY`, `SENTRY_AUTH_TOKEN`,
`SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SESSION_SECRET`, `STRIPE_ENABLED`, `VITE_APP_ENV`,
`VITE_RAZORPAY_KEY_ID`, `VITE_SENTRY_DSN`, `VITE_STORAGE_PREFIX`.

**Value differences that matter** (name present on both, value differs):

| Variable | Staging | Production |
|---|---|---|
| `APP_ENV` / `RAILWAY_ENVIRONMENT_NAME` | `staging` | `production` |
| `RAZORPAY_KEY_ID`, `VITE_RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, all 4 plan IDs | set, `rzp_test_*` (correct) | **empty** — live mode never activated |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | **Local client's credentials** (wrong — see §3.6) | Production client's credentials ✅ |
| `GOOGLE_CALLBACK_URL` | raw Railway domain (`…-staging.up.railway.app/…`) | `https://app.buildographic.com/api/v1/auth/google/callback` ✅ — matches Google Console registration |

**Present as a *name* in `.env.example`/`ENVIRONMENTS.md` but NOT set as a key on Railway at all**
(neither environment): `DEMO_MODE`, `GOOGLE_API_KEY`, `VITE_API_BASE`, `VITE_API_URL`, `VITE_APP_BUILD`,
`VITE_E2E_GENERATION_POLL_ONLY`, `BETA_MODE`, `VITE_BETA_MODE` (added to `.env.example` by the in-flight
US-LAUNCH-004 work, not yet pushed to Railway), all `STRIPE_*` besides `STRIPE_ENABLED`, all
BROKERAGE/API-tier plan IDs, `RAZORPAY_PLAN_SOLO`/`_TEAM`/`_BROKERAGE` legacy fallback IDs,
`RAZORPAY_SUBSCRIPTION_START_BUFFER_SECONDS`, all Paddle/PayPal dead-letter keys. **None of these can be
marked required** — they're absent, not just empty, on both real environments.

---

## 3. Keys that break a naive implementation

### 3.1 🔴 Placeholder values in live keys — break if the schema shape-validates
These look present (non-empty) in **local `.env`** but hold the literal placeholder `plan_...`. A
`required` + shape/regex check rejects them → **boot abort locally**.

| Key | Value in `.env` | Line | Remediation |
|---|---|---|---|
| `RAZORPAY_PLAN_BROKERAGE_MONTHLY` | `plan_...` | 78 | `.optional()`, no shape-check (or delete the line) |
| `RAZORPAY_PLAN_BROKERAGE_ANNUAL` | `plan_...` | 79 | `.optional()`, no shape-check |
| `RAZORPAY_PLAN_API_STARTER` | `plan_...` | 82 | `.optional()`, no shape-check |
| `RAZORPAY_PLAN_API_GROWTH` | `plan_...` | 83 | `.optional()`, no shape-check |

### 3.2 🔴 Absent keys — break if marked required
| Key | Provisioned anywhere? | Code behaviour | Remediation |
|---|---|---|---|
| `RESEND_API_KEY` | ✅ now set on both Railway envs (was ❌ local-only gap on 07-13) | EmailService dev-fallback, never throws (`email.service.ts:48`) | `.optional()` still — presence isn't universal (local `.env` still lacks it) |
| `EMAIL_FROM` | ✅ now set on both Railway envs | Defaults to `noreply@example.com` | `.optional()` still, for the same reason |
| `DEMO_MODE` | ❌ absent everywhere (local + both Railway envs) | Read 4× with defaults | `.optional()` |

### 3.3 🟠 Present but contradicts contract / wrong shape
| Key | Issue | Remediation |
|---|---|---|
| `SESSION_SECRET` | Present in local `.env` **and on both Railway environments**, but **not read by any code**; *removed* from `.env.example` in US-LAUNCH-009. Requiring it contradicts the contract. | Omit from schema (do not require) |
| `GEMINI_API_KEY` | Present locally with shape `AQ.Ab8…`; contract expects `AI…`. Present on both Railway environments too (value not verified for shape). | `.optional()`, no prefix shape-check |

### 3.4 ✅ RESOLVED (was the 2026-07-13 showstopper) — the staging guard-trio
| Keys involved | Original 07-13 concern | 2026-07-25 status |
|---|---|---|
| `NODE_ENV` | `production` on staging, shared with prod | Still true — `NODE_ENV` alone still can't distinguish envs. |
| `RAZORPAY_KEY_ID` / `VITE_RAZORPAY_KEY_ID` (staging) | `rzp_test_*` | Still `rzp_test_*`, still correct. |
| `APP_ENV` / `RAILWAY_ENVIRONMENT_NAME` | assumed unset / unverified | **Verified live: both are explicitly set** (`APP_ENV=staging`, `RAILWAY_ENVIRONMENT_NAME=staging`). `getAppEnv()` will read `APP_ENV` directly and never reach the `NODE_ENV` fallback. |

**This risk no longer applies.** Staging will pass the RazorPay guard cleanly under `getAppEnv()`'s
first branch (explicit `APP_ENV`), regardless of `NODE_ENV`. Keep the hardening in P3 (§5) anyway as
defense-in-depth for any future environment that doesn't get `APP_ENV` set before its first boot.

### 3.5 🔴 NEW showstopper (found 2026-07-25) — production's RazorPay block is empty
Production is **live** at `https://app.buildographic.com` (verified via `railway status`, service
`● Online`, `RUNNING`). Its RazorPay-related variables are **all empty**:

| Key | Production value |
|---|---|
| `RAZORPAY_KEY_ID` | *(empty)* |
| `RAZORPAY_KEY_SECRET` | *(empty)* |
| `RAZORPAY_WEBHOOK_SECRET` | *(empty)* |
| `VITE_RAZORPAY_KEY_ID` | *(empty)* |
| `RAZORPAY_PLAN_SOLO_MONTHLY` / `_ANNUAL` | *(empty)* |
| `RAZORPAY_PLAN_TEAM_MONTHLY` / `_ANNUAL` | *(empty)* |

**AC3, as literally written, cannot pass against production's real current state** — "empty" satisfies
neither the `rzp_test_*` nor `rzp_live_*` branch, and if these keys are also in the *required* set (per
the story's AI Implementation Prompt), a missing-required-var error fires first. Either way: **the next
deploy to production under a naive implementation aborts boot.**

Because production only redeploys on a `v*` tag push (not on every merge — see §2), this doesn't fire
the moment the story merges to `main`. It fires the next time someone tags a release. That is still a
real, live outage risk and must be resolved before implementation — see P0.5 in §5.

### 3.6 ✅ RESOLVED 2026-07-25 — related bug found during this audit (not a boot-validation issue)
Staging's `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`/`GOOGLE_CALLBACK_URL` are wired to the **`buildographic — Local`**
OAuth client (same credentials as local dev), with `GOOGLE_CALLBACK_URL` pointing at the raw Railway
domain — not the dedicated `buildographic - Staging` client that already exists in Google Cloud Console.
A Zod shape-check will **not** catch this (any well-formed client ID passes). This is a pre-existing
functional bug (Google login on staging may only work if the Local client happens to also have the
Railway staging callback URL registered as an extra redirect URI) — unrelated to US-LAUNCH-010's
validation logic, but worth fixing or explicitly ticketing alongside it. See P1.5 in §5.

---

## 4. Keys requiring provider-side configuration changes

| Key | Provider | Action | Status as of 2026-07-25 |
|---|---|---|---|
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `VITE_RAZORPAY_KEY_ID` | RazorPay Dashboard | Activate **live mode**, generate `rzp_live_*` keys | ⏳ Still pending — production confirmed empty (§3.5). Production — US-LAUNCH-005 (HUMAN) |
| `RAZORPAY_WEBHOOK_SECRET` | RazorPay → Webhooks | New webhook endpoint at prod domain; per-env secret | ⏳ Still pending |
| `RAZORPAY_PLAN_BROKERAGE_MONTHLY` / `_ANNUAL` | RazorPay → Plans | Create plans **or** gate BROKERAGE behind "Contact us" (US-LAUNCH-007) | ⏳ PT-06 deferred |
| `RAZORPAY_PLAN_API_STARTER` / `_API_GROWTH` | RazorPay → Plans | Create if API tiers launch; else keep optional | ⏳ Deferred |
| `RESEND_API_KEY` | Resend Dashboard | Create API key | ✅ Done — present on both Railway environments |
| `EMAIL_FROM` | Resend / DNS | Verify sending domain; set from-address | ✅ Done — present on both Railway environments; `buildographic.com` DNS/SPF/DKIM records live via `infra/cloudflare/dns.tf` |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` | Google Cloud Console | Separate OAuth client per env; exact redirect URI per client | ✅ Done — client swap + redirect URI correction both complete (2026-07-25, §3.6/P1.5). Redirect URI fix is user-confirmed, not machine-verified (no Console API/CLI in this session) |
| `GEMINI_API_KEY` | Google AI Studio | Provision a valid key if FREE/SOLO LLM must run | Present on both envs; shape not re-verified this pass. Degrades gracefully either way |
| `DATABASE_URL` | Neon | Separate branch per env | ✅ Done — present, distinct per env |
| `APP_ENV` | Railway (deploy target) | Set `APP_ENV=staging` and `APP_ENV=production` | ✅ **Done on both environments** — confirmed live 2026-07-25 |

---

## 5. Step-by-step remediation plan (prerequisite gate)

Complete **P0–P2** before running `/implement-story` on US-LAUNCH-010. P3–P4 are the implementation
guardrails. P5 is a process change, not a code change.

### P0 — Make the environment unambiguous *(Railway, human)* — ✅ ALREADY DONE
1. [x] Confirm the staging Railway environment name; verify `RAILWAY_ENVIRONMENT_NAME` resolves there.
       — Confirmed live: `staging` → `staging`, `production` → `production`.
2. [x] **`APP_ENV` is set** on both Railway staging and production. No further action.
3. [x] Local `.env` leaves `APP_ENV` unset (infers `local`) — unchanged, still correct.

### P0.5 — Decide the production RazorPay treatment *(product/eng decision, ~15 min)* — ✅ DECIDED 2026-07-25
4. [x] **Option A chosen.** RazorPay block is `.optional()` in the Zod schema; the guard fires only when
       `RAZORPAY_KEY_ID` is present, and only then checks mode (`rzp_test_*` non-prod / `rzp_live_*` prod).
       Absent ⇒ boot proceeds, no behavior change from today. Automatically starts enforcing mode-
       correctness the moment real keys are added later (US-LAUNCH-005).
5. [x] **AC3 amended in STORY.md** (and AC2's optional-var list updated to mention RazorPay explicitly).
       A new test case, TC-LAUNCH-010-07, was added to `STORY.md` covering "absent RazorPay key ⇒ boot
       proceeds" against production's real current state.

### P1 — Reconcile the contract with reality *(docs, ~10 min)* — ✅ COMPLETE 2026-07-25
6. [x] `RESEND_API_KEY` + `EMAIL_FROM` — already present in `docs/setup/ENVIRONMENTS.md`/`.env.example`
       and on both Railway environments. No further action.
7. [x] **Decided: `SESSION_SECRET` stays out of the schema, not required, not optional-with-shape-check —
       simply omitted.** It's present as a stale value in local `.env` and on both Railway environments,
       but is read by **no code** in `api/src` or `server` (confirmed by `ENVIRONMENTS.md`'s "Removed /
       Pruned Variables" table — removed from the `.env.example` contract in US-LAUNCH-009). Requiring or
       shape-checking a dead variable would be validating something the app never uses.

### P1.5 — Staging Google OAuth client mismatch *(Google Cloud Console + Railway)* — ✅ FIXED 2026-07-25
8. [x] Staging's `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` on Railway swapped to the `buildographic -
       Staging` client's credentials — confirmed live via `railway variables` (`…-9mpt…` prefix, matches
       the Staging client).
9. [x] Redirect URI corrected: `https://infographic-production-staging.up.railway.app/api/v1/auth/google/callback`
       added to the Staging client's Authorized Redirect URIs in Google Cloud Console, replacing the stale
       `infographic-editor-staging...` entry that no longer matched Railway's actual domain.
       **User-confirmed, not independently machine-verified** — unlike the Railway-side checks in this
       doc (pulled live via `railway variables`), Google Console has no CLI/API check available in this
       session. If a second independent check is ever wanted, it would need browser automation against
       the console directly.

### P2 — Clean the placeholder values *(local `.env` hygiene)* — ✅ DONE 2026-07-25
9. [x] The four `plan_...` placeholders (`RAZORPAY_PLAN_BROKERAGE_MONTHLY/_ANNUAL`,
       `RAZORPAY_PLAN_API_STARTER/_API_GROWTH`) are commented out in local `.env` (lines 78/79/82/83),
       each with a one-line note on why (BROKERAGE = PT-06 deferred, API tier = deferred backlog).
10. [x] Confirmed — BROKERAGE + API tiers are deferred (PT-06, API backlog); no provider work needed for beta.

### P3 — Implement with the safe required/optional split *(code — US-LAUNCH-010 T1–T5)*
11. [ ] **Required set = {read at boot} ∩ {provisioned with a real value on BOTH staging AND production
        today}:** `DATABASE_URL`, `JWT_SECRET`, `OPENAI_API_KEY`, `IDEOGRAM_API_KEY`, `GOOGLE_CLIENT_ID`,
        `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`. *(RazorPay intentionally excluded — see P0.5.)*
12. [ ] **Everything else `.optional()`:** the full RazorPay block (P0.5 Option A — decided),
        `GEMINI_API_KEY`, `RESEND_API_KEY`, `EMAIL_FROM`, `SESSION_SECRET` (omit), `DEMO_MODE`,
        `BASE_URL`, `CLIENT_URL`, `BETA_MODE`, `VITE_BETA_MODE`, all BROKERAGE/API/legacy plan IDs, all
        Stripe keys, Sentry vars, all `RAILWAY_*`, all remaining `VITE_*`.
13. [ ] **Do not shape/regex-check** plan IDs or `GEMINI_API_KEY` (placeholder/non-standard values exist).
14. [ ] **Harden the guard:** reject `rzp_live_*` only when `APP_ENV` is **explicitly** `production`; do
        not hard-require `rzp_live_*` on a merely *inferred* environment. Lower-stakes now that `APP_ENV`
        is explicit everywhere (§3.4), but still correct defensive coding for any future preview/PR
        environment that boots before `APP_ENV` is set.

### P4 — Verify before and after merge *(gates)*
15. [ ] `npm run check` + `npm run test:unit` green (incl. new `env.validation.spec.ts`).
16. [ ] `npm run smoke:boot` (Gate 4a) green locally — confirms real boot, not just `tsc`.
17. [ ] **Smoke-verify against both real var shapes**, not just local `.env`: run the validator locally
        once against a copy of staging's current 43-key set, once against a copy of production's current
        43-key set (with P0.5's RazorPay decision applied). Both must boot clean.
18. [ ] After merge to `main`: staging auto-deploys — `railway logs` shows `Nest application successfully
        started`; `/api/health` = ok (AC4, TC-LAUNCH-010-05).

### P5 — Release-tag deploy awareness *(process, not code)* — ✅ REMINDER ADDED 2026-07-25
19. [x] Production only deploys on a `v*` tag push (§2), so merging this story does **not** immediately
        touch production. Before the **next** release tag is pushed after this story merges, re-run
        `railway variables --environment production --kv` and confirm the required-set (P3.11) still
        matches — env vars may have changed since this audit. The reminder now lives in
        `.github/workflows/deploy.yml`'s header comment, next to the tag-trigger config itself — the
        most discoverable place, since anyone about to cut a tag is already looking at that file's
        trigger logic.
20. [ ] If a tagged release does crash-loop production despite the above: the fastest mitigation is a
        **Railway rollback to the last known-good deployment** (dashboard/CLI), not a git revert —
        Railway retains deployment history and this is materially faster than revert → retag → rebuild.

---

## 6. Sign-off checklist (Definition of Ready for US-LAUNCH-010)

- [x] P0 complete — `APP_ENV` confirmed live on both Railway environments (2026-07-25)
- [x] P0.5 complete — RazorPay decision: **Option A**. `STORY.md` AC2/AC3 amended, TC-LAUNCH-010-07 added
- [x] P1 complete — email keys reconciled; `SESSION_SECRET` decision made (omit from schema entirely)
- [x] P1.5 complete — staging Google OAuth client swap + redirect URI correction both done 2026-07-25 (redirect URI is user-confirmed, not independently machine-verified)
- [x] P2 complete — placeholder plan IDs commented out in local `.env`, will not trip validation
- [x] Required/optional split (P3.11–P3.12) reviewed and signed off, built from **current** Railway data
- [ ] Guard-hardening approach (P3.14) agreed — still a code-time task, not yet implemented
- [ ] P4 smoke-verification run against both environments' real var shapes (not just local `.env`) — requires the code to exist first
- [x] P5 acknowledged — pre-tag var-check reminder added to `.github/workflows/deploy.yml`'s header comment
- [ ] Rollback note: if staging fails to boot post-merge, revert the ConfigModule `validate` wiring
      commit (T3); if a tagged production deploy fails, roll back via Railway deployment history first

> **Gate:** US-LAUNCH-010 stays `🔲 Not Started` until every box above is ticked. This document is the
> Definition of Ready.

---

*Created 2026-07-13 — pre-flight analysis for US-LAUNCH-010. Re-audited 2026-07-25 against live Railway
data (both environments), `.github/workflows/deploy.yml`, `railway.json`, and Google Cloud Console —
see Section 0 for the delta. See [STORY.md](./STORY.md) §AC3–AC4 and the project rule "Test Is Truth":
if an environment would fail validation, fix the required/optional split — never weaken the assertion.*
