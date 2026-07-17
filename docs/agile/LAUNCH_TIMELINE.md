# Launch Timeline — InfographicAI

> **Created:** 2026-07-13 · **Owner:** Dinesh
> **Purpose:** One consolidated view of the path from *today* → **marketable public beta** → **revenue on**, with what blocks what.
> **Companion to:** [ROADMAP.md](ROADMAP.md) · [PHASE_TRACKER.md](PHASE_TRACKER.md) · [TEAM_STATUS.md](TEAM_STATUS.md) · [../testing/PHASE_0_HUMAN_QA_CHECKLIST.md](../testing/PHASE_0_HUMAN_QA_CHECKLIST.md)

---

## TL;DR

- **Marketable beta: 1–2 days of actual work** — the only true blocker is a ~2-hour "buy a domain + deploy to production" on Day 1.
- **Full Cursor-style deployment maturity: ~2 weeks**, running **in parallel** — it never blocks the beta.
- **Revenue on: ~3–4 weeks**, gated by the real-photo pipeline (EPIC-AI-06), **not** by any infrastructure work.

```
Day 1–2      ████ Beta live + marketable          ← domain + Task 3 + beta mode
Week 1–2     ░░░░░░░░ EPIC-DEPLOY-01 (velocity)    ← parallel, non-blocking
Week 2–4     ░░░░░░░░ EPIC-AI-06 (real photos)     ← the revenue prerequisite
Week 3–4     ░░░░ M-LAUNCH-02 prep                 ← parallel to AI-06
~Week 4      ● Revenue ON (flip BETA_MODE=false)   ← gated by AI-06 + M-LAUNCH-02
```

---

## 1. Critical path to a marketable beta

| When | Work | Effort | What it unblocks |
|------|------|--------|------------------|
| **Day 1** | Buy domain (~$12/yr) → CNAME to Railway → verify in Resend (SPF/DKIM) | ~1 hr + DNS propagation | Real transactional email + clean URL + one-time prod config |
| **Day 1** | **Phase 0 Task 3** — production go-live, **beta-scoped (no live payments)** | ~1 hr | **BETA IS LIVE** |
| **Day 1–2** | [US-LAUNCH-004](epics/phase-1-ai-core/EPIC-LAUNCH-01/stories/US-LAUNCH-004/STORY.md) — beta mode (hide test checkout + AI-content disclaimer) | ~0.5 day | Clean marketing surface (no confusing test-checkout) |
| **Day 1–2** | [US-LAUNCH-003](epics/phase-1-ai-core/EPIC-LAUNCH-01/stories/US-LAUNCH-003/STORY.md) — deploy `PasswordResetToken` table + live TC-05 verify | already coded; ~1 hr | Password recovery works for real users |

**→ Marketing can start end of Day 1** (Google sign-in path) or **Day 2** (polished — beta mode + working email).

### Task 3, beta-scoped (what you actually do)
Since checkout is off for the free beta, **skip all RazorPay-live steps** (checklist Group 4, P-18/P-19):

1. **3.0** — Pick production URL. With a domain: Option B (`app.yourdomain.com`). Without: Option A (`*.up.railway.app`).
2. **3A** — Neon **production** branch → direct connection string (`?sslmode=require`).
3. **3B** — Railway **production** env (mark **Protected**); set vars Groups 1/2/3/5/6 + `APP_ENV=production`. **Skip Group 4 (live payments).**
4. **3C** — `git tag v1.0.0` → `git push origin v1.0.0` → Railway deploys prod from the tag.
5. **3D** — Smoke: `/api/health` ok → register → generate 1 image. **Skip P-18/P-19 (live card).**
6. **3E** — Sentry: throw a test error → confirm it lands.
7. **3F** — Google OAuth **prod client** + redirect URI = `<PROD_URL>/api/v1/auth/google/callback`.

---

## 2. The domain + email decision (the one real catch)

> ✅ **DECIDED 2026-07-17 — domain purchased: `buildographic.com`.**
> - **`app.buildographic.com`** → login-protected app (CNAME → Railway production; Task 3.0 = Option B)
> - **`buildographic.com`** (apex) → public marketing/landing page — ⚠️ *new scope, no story yet*
> - Resend sending domain: verify `buildographic.com` (SPF/DKIM) → real password-reset email unblocked
> - Google OAuth prod redirect URI: `https://app.buildographic.com/api/v1/auth/google/callback`
> Remaining from the Day-1 row below: DNS records + Resend verification (the *buy* step is done).

Transactional email (password reset) is the only user-facing feature that **needs a domain**:

- **Resend free tier** (~3,000 emails/mo, 100/day — confirm at resend.com/pricing) is plenty for beta.
- **But** without a verified sending domain, Resend only sends from `onboarding@resend.dev` **to your own account email** — it will **not** deliver to real beta users.
- `EmailService` is graceful (logs to console, never crashes) — so no domain = password reset silently doesn't reach users.

| Option | Email to real users? | Cost | Verdict |
|--------|---------------------|------|---------|
| **Buy a cheap domain now** | ✅ verified in Resend + clean URL | ~$12/yr | **Recommended** — solves email + URL + future RazorPay-live credibility in one move; avoids double prod-config (checklist P-00) |
| **Railway URL + Resend, no domain** | ❌ only to yourself | $0 | OK **only** if beta is Google-sign-in-first (Google users never need password reset) |
| **Railway URL, email console-fallback** | ❌ nothing delivered | $0 | Explicitly no password recovery |

**Recommendation:** buy the $12 domain on Day 1. Smallest possible spend; flips three things green at once (email, marketing URL, one-time prod config) and prevents rework when revenue turns on later.

---

## 3. Already done (no time cost)

- Phase 0 **Task 1** (local QA) ✅ signed off 2026-06-20 · **Task 2** (staging) ✅ signed off 2026-07-11
- [US-LAUNCH-001](epics/phase-1-ai-core/EPIC-LAUNCH-01/stories/US-LAUNCH-001/STORY.md) legal pages · [US-LAUNCH-002](epics/phase-1-ai-core/EPIC-LAUNCH-01/stories/US-LAUNCH-002/STORY.md) EmailService · [US-LAUNCH-003](epics/phase-1-ai-core/EPIC-LAUNCH-01/stories/US-LAUNCH-003/STORY.md) password reset · [US-LAUNCH-009](epics/phase-1-ai-core/EPIC-LAUNCH-01/stories/US-LAUNCH-009/STORY.md) env contract — all **implemented on `main`**
- The product itself (generation, canvas editor, payments plumbing, auth) — technically finished

---

## 4. Parallel & post-beta tracks (non-blocking)

| Track | Work | Effort | Timing / gate |
|-------|------|--------|---------------|
| [US-LAUNCH-010](epics/phase-1-ai-core/EPIC-LAUNCH-01/stories/US-LAUNCH-010/STORY.md) | Config hardening (`APP_ENV` + Zod boot validation + RazorPay guard) — **after its [prereq gate](epics/phase-1-ai-core/EPIC-LAUNCH-01/stories/US-LAUNCH-010/Pre-requisite-story.md)** (set `APP_ENV=staging` first) | ~0.5 day + gate | Week 1, when convenient |
| [EPIC-DEPLOY-01](epics/phase-1-ai-core/EPIC-DEPLOY-01/EPIC.md) | Velocity foundation: CI gate → flags → preview envs → migrations → progressive delivery | **~4.5 focused days** | **~1.5–2 calendar weeks**, alongside beta + marketing |
| [EPIC-AI-06](epics/phase-1-ai-core/EPIC-AI-06/EPIC.md) | Hybrid real-photo pipeline — **the chargeability gate** (replaces synthetic photos/headshots) | ~30h (~1 wk) | Before revenue |
| M-LAUNCH-02 | Revenue-on: RazorPay live activation, receipt email, BROKERAGE gate, metering guard | ~20h + ops | Prep parallel to AI-06; **flip gated by AI-06** |

### EPIC-DEPLOY-01 internal order (recommended)
`US-DEPLOY-001` CI gate (0.5d) → `US-DEPLOY-003` flags (0.5d) → `US-DEPLOY-002` preview envs (1.5d) → `US-DEPLOY-004` migrations (1d, *after* real data) → `US-DEPLOY-005` progressive delivery (1d).

---

## 5. Revenue-on gate

Charging is deliberately deferred until synthetic property photos/headshots are replaced — hence the two-milestone split (beta live first, revenue second).

**Revenue turns on (`BETA_MODE=false`) only when ALL of:**
- [ ] EPIC-AI-06 shipped (real-photo pipeline — no more synthetic imagery on paid output)
- [ ] M-LAUNCH-02 stories closed (live RazorPay, receipts, metering, BROKERAGE gate)
- [ ] One real ₹ transaction completed end-to-end on live RazorPay and refunded
- [ ] Domain live (RazorPay live activation + email DKIM reputation both need it)

**Estimated: ~3–4 weeks from today**, paced by EPIC-AI-06, not by infrastructure.

---

## 6. Key principle

> **Nothing on the deployment-velocity track (EPIC-DEPLOY-01) or the revenue track (M-LAUNCH-02 / EPIC-AI-06) holds up the beta.**
> The only true blocker to marketing is the ~2-hour domain-plus-deploy on Day 1. Everything else is parallel — the product can be in front of potential customers while the platform matures underneath it.

---

## Risks / watch-items

- **US-LAUNCH-004 (beta mode) not built yet** — until it ships, "Upgrade" buttons lead to a *test-mode* RazorPay checkout. Not a safety risk (test keys can't charge), but confusing for marketing traffic. Ship it before driving volume, or lead with Google sign-in.
- **US-LAUNCH-010 must not be merged naively** — its boot validation can brick live staging; follow its [prereq gate](epics/phase-1-ai-core/EPIC-LAUNCH-01/stories/US-LAUNCH-010/Pre-requisite-story.md) first.
- **`db:deploy` still uses `prisma db push`** — fine for beta, but switch to `migrate deploy` (US-DEPLOY-004) before the DB accumulates real data you can't afford to lose.

---

*Timeline created: 2026-07-13. Update when Task 3 signs off or estimates shift.*
