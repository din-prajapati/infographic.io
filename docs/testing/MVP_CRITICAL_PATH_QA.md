# PRD — MVP Critical-Path Manual QA & Google OAuth

| Field | Value |
|--------|--------|
| **Document type** | Product Requirements Document (QA + auth scope) |
| **Product** | InfographicAI (unified editor + subscriptions) |
| **Version** | 1.0 |
| **Last updated** | April 10, 2026 |
| **Status** | Active — payment MVP checklist **Pass**; this PRD covers **remaining** launch QA and OAuth enablement |

---

## 1. Purpose

This PRD defines two MVP-adjacent workstreams that are **not** covered by [PAYMENT_TEST_CHECKLIST.md](./PAYMENT_TEST_CHECKLIST.md):

1. **Google OAuth** — already **implemented in code**; requires configuration, redirect alignment, and verification.
2. **Critical-path manual QA** — [1_WEEK_LAUNCH_PLAN.md](./implementation/1_WEEK_LAUNCH_PLAN.md) **Task 2.1** flows that are **outside** payment/subscription evidence.

**Related trackers:** [MVP_LAUNCH_TRACKER.md](./MVP_LAUNCH_TRACKER.md) (T0.7 / 0.10), [1_WEEK_LAUNCH_TRACKER.md](./implementation/1_WEEK_LAUNCH_TRACKER.md).

---

## 2. Background

### 2.1 What is already signed off

- **Razorpay MVP:** SOLO/TEAM × monthly/annual, webhooks, verify, plan change, failure path, automation — [PAYMENT_TEST_CHECKLIST.md](./PAYMENT_TEST_CHECKLIST.md) (**2026-04-10**).
- **Sign-in for payment QA:** Existing test users and sessions; **not** a formal sign-off of full **new-user registration** or **first infographic** journey.

### 2.2 Why this PRD exists

- Launch plan **Task 2.1** bundles **product** critical paths (generation, editor, org limits, cross-browser) that the payment checklist **does not** claim.
- **Google OAuth** is a distinct auth surface (env + Google Cloud + callback UX) and is **not** listed in [ISSUES_REPORT.md](./ISSUES_REPORT.md).

---

## 3. Google OAuth

### 3.1 Current implementation (as-built)

| Layer | Location / behavior |
|--------|---------------------|
| Strategy | `api/src/modules/auth/strategies/google.strategy.ts` — `passport-google-oauth20`, scopes `email`, `profile` |
| Routes | `GET /api/v1/auth/google`, `GET /api/v1/auth/google/callback`, `POST /api/v1/auth/google/exchange` |
| Service | `AuthService.googleLogin()` — link by `googleId` or email, create org for new users, one-time code → JWT |
| Client | `AuthPage.tsx` — **Continue with Google** → `/api/v1/auth/google`; `AuthCallbackPage.tsx` — `/auth/callback?code=…` |
| Schema | User: `googleId`, `avatarUrl`, `provider` (see Prisma) |
| Env (template) | [`.env.example`](../.env.example): `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` |

### 3.2 Requirements (configuration & operations)

| ID | Requirement | Owner |
|----|-------------|--------|
| **GO-01** | Create **OAuth 2.0 Client ID (Web application)** in Google Cloud Console; enable any APIs Console mandates for OAuth sign-in. | Ops / Dev |
| **GO-02** | **Authorized redirect URI** must match the API callback **exactly** (e.g. `https://<app>/api/v1/auth/google/callback`, dev: `http://localhost:5000/api/v1/auth/google/callback` if that is the origin hitting the API). | Ops / Dev |
| **GO-03** | Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_CALLBACK_URL` in deployment secrets (Railway / GitHub / local `.env`) — no placeholders in environments where Google login is offered. | Ops / Dev |
| **GO-04** | After OAuth, browser redirect to **frontend** must land on the correct **client origin** (align `AuthController` redirect with production/staging `CLIENT_URL` or equivalent; avoid hard-coded Replit-only assumptions for self-hosted). | Dev |
| **GO-05** | Document **account linking**: same email as existing password user should behave per product decision (current code links Google to existing user by email — verify UX and edge cases). | PM / QA |

### 3.3 Acceptance criteria (Google OAuth)

- [ ] **New user:** Continue with Google → Google consent → return to app → authenticated → default landing (e.g. templates) without manual token paste.
- [ ] **Returning Google user:** Second login succeeds; session stable across refresh (per existing JWT/localStorage behavior).
- [ ] **Existing email + password user:** Linking or blocking behavior matches **GO-05**; no duplicate orgs unless intended.
- [ ] **Misconfiguration:** With invalid/missing client id, user sees a clear failure (Google error or app error), not a silent hang.
- [ ] **Security:** OAuth one-time `code` exchange is short-lived; no long-lived secrets in client bundle.

### 3.4 Out of scope (this PRD)

- Additional providers (Apple, Microsoft).
- Enterprise SSO (SAML).
- Changes to core JWT design — unless **GO-04** requires a small env-driven redirect fix.

---

## 4. Critical-path manual QA (Task 2.1 — non-payment)

**Source:** [1_WEEK_LAUNCH_PLAN.md](./implementation/1_WEEK_LAUNCH_PLAN.md) **Task 2.1: Critical Path Testing**.  
**Rationale:** Payment checklist does **not** sign off these product flows.

### 4.1 Flow 1 — Registration + first generation

| Field | Content |
|--------|---------|
| **Why open** | End-to-end **new** user registration (not assumed by payment TCs), then **first** infographic: generation form, AI model selection, progress (**WebSocket** or equivalent), completion, **gallery** visibility, image URL valid, **FREE tier usage** (e.g. **1/3**). |
| **Prerequisites** | Clean or disposable email; AI keys configured; app + API running. |
| **Acceptance** | User + org created; first generation completes; usage increments; no critical console errors. |

### 4.2 Flow 2 — After payment (usage on paid tier)

| Field | Content |
|--------|---------|
| **Why open** | [PAYMENT_TEST_CHECKLIST.md](./PAYMENT_TEST_CHECKLIST.md) covers **checkout/subscription**; it does **not** sign off **post-pay generation volume** or **usage meter** (e.g. generate multiple infographics on **SOLO** and confirm counter **6/50** or equivalent UI/API). |
| **Prerequisites** | Active **SOLO** (or TEAM) subscription from test mode. |
| **Acceptance** | Multiple generations succeed; usage/limit UI or API matches plan; no false hard blocks. |

### 4.3 Flow 3 — Canvas editor

| Field | Content |
|--------|---------|
| **Why open** | **`/editor`**: add/edit **text, shape, image**; **save**; **`/my-designs`** open design; **PNG export** quality (no chrome in export). |
| **Prerequisites** | Logged-in user; at least one saved design path. |
| **Acceptance** | Round-trip save/load; export downloads and looks correct at a smoke level. |

### 4.4 Flow 4 — AI Chat → template → editor

| Field | Content |
|--------|---------|
| **Why open** | **AI Chat**: category chip → prompt/generate → **Use This Design** (or equivalent) → **editor** loads expected canvas. |
| **Prerequisites** | AI chat available; templates/generation path stable. |
| **Acceptance** | Template lands in editor; elements editable; no blocking layout bugs (see historical **ET/AC** issues in [ISSUES_REPORT.md](./ISSUES_REPORT.md) if regressions). |

### 4.5 Flow 5 — User limits (organization)

| Field | Content |
|--------|---------|
| **Why open** | **TEAM:** add **5** users OK; **6th** **blocked** with clear message (**Account → Organization**). **BROKERAGE** “unlimited” remains **[PT-06](./ISSUES_REPORT.md)** — not in payment checklist. |
| **Prerequisites** | TEAM org; enough test accounts or invite path; BROKERAGE only when plan IDs exist. |
| **Acceptance** | Cap enforced; UX clear; BROKERAGE deferred until **PT-06** resolved. |

### 4.6 Flow 6 — Cross-browser

| Field | Content |
|--------|---------|
| **Why open** | Payment QA was likely **one** browser; Task 2.1 calls out **Chrome, Firefox, Safari** (or agreed subset) and **no critical console errors** / responsive smoke. |
| **Prerequisites** | Same build deployed or local; test accounts. |
| **Acceptance** | Agreed minimum browsers pass smoke on **Flows 1–4** (or documented exceptions). |

---

## 5. Prioritization (suggested)

| Priority | Item | Notes |
|----------|------|--------|
| P0 | **GO-01–GO-04** | Required if “Sign in with Google” is launch-visible. |
| P0 | **Flow 1** | Core “value” path for new users. |
| P1 | **Flow 3**, **Flow 4** | Editor + AI are core product. |
| P1 | **Flow 2** | Validates paid tier value. |
| P2 | **Flow 5** | TEAM customers; BROKERAGE blocked on **PT-06**. |
| P2 | **Flow 6** | Schedule after primary browser green. |

---

## 6. Success metrics

| Metric | Target |
|--------|--------|
| Google OAuth | 100% of **§3.3** acceptance rows checked in staging (or prod test app). |
| Critical path | Task 2.1 flows **1–6** recorded **Pass / Fail / Blocked** with date in [1_WEEK_LAUNCH_PLAN.md](./implementation/1_WEEK_LAUNCH_PLAN.md) or [1_WEEK_LAUNCH_TRACKER.md](./implementation/1_WEEK_LAUNCH_TRACKER.md). |
| Launch readiness | [MVP_LAUNCH_TRACKER.md](./MVP_LAUNCH_TRACKER.md) **T0.7** / **0.10** can move to **Done** when scope above is agreed complete. |

---

## 7. References

| Document | Use |
|----------|-----|
| [PAYMENT_TEST_CHECKLIST.md](./PAYMENT_TEST_CHECKLIST.md) | Payment evidence (out of scope for this PRD’s product flows) |
| [ISSUES_REPORT.md](./ISSUES_REPORT.md) | **PT-06**, historical **ET/AC** |
| [implementation/1_WEEK_LAUNCH_PLAN.md](./implementation/1_WEEK_LAUNCH_PLAN.md) | Task 2.1 detail |
| [MVP_LAUNCH_TRACKER.md](./MVP_LAUNCH_TRACKER.md) | Phase 0 remaining human tasks |
| [replit.md](../replit.md) | Google OAuth implementation notes |

---

*End of PRD*
