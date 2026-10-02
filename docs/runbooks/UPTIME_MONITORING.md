# Runbook — Uptime alert fired (or should have)

> **Covers:** the `Uptime` GitHub Actions workflow (`.github/workflows/uptime.yml`), US-OBS-005, closing BL-34.
> **Created:** 2026-10-02.

---

## What this monitor is, in one line

Every 15 minutes GitHub asks both environments *"are you serving a healthy API?"* and fails loudly if not.

It runs **on GitHub, not on Railway**, because the outage it exists to catch was Railway itself: production and
staging served nothing from **2026-09-14 to 2026-09-29** after the trial lapsed, and nothing inside the system
could report it — no build failed, no exception was thrown, no log line was written. A monitor hosted by the thing
it monitors is not a monitor. Do not move this into the app, a Railway cron, or Sentry.

**It answers one question.** Latency, error rates, and cost belong to Sentry (US-OBS-004).

---

## You got an email saying an environment is down

The run summary already names the environment, the HTTP status, the attempt count and the time. Start there, then:

### 1. Rule out billing first

This is the single most likely cause and the cheapest to check, because it is what actually happened:

> Railway dashboard → account/workspace billing. A lapsed plan removes deployments from **every** project in the
> workspace simultaneously — last time that included `lead-engine-n8n-prod`. The tell is that *both* environments
> fail in the same run, and `railway up` answers *"Your trial has expired."*

If several projects are down at once, stop debugging the app. It is the account.

### 2. Read the status the alert reported

| Reported | Means | Next step |
|---|---|---|
| `000` | No HTTP response at all — DNS, TLS, or connection failure. What a total platform outage or account suspension looks like. | Billing (step 1), then Railway status page. |
| `404` | Railway serves this when **no deployment exists** for the domain. | Billing, or a deleted/failed deployment. `railway status`. |
| `502` / `503` / `504` | The edge answered; the app behind it did not. If `/` returns 200 while `/api/v1/*` fails, the Express proxy is alive and **NestJS is not**. | `railway logs` — look for the NestJS child crashing, or a `preDeploy` migration failure. |
| `200` but body lacked `"status":"ok"` | The app is answering while unhealthy — usually the database. Also what the SPA catch-all returns for an unknown path. | `/api/v1/health` reports `db`; check Neon for a suspended or deleted branch. |

### 3. If it was a failed deploy

A failed `preDeployCommand` **aborts the deploy and leaves the previous build serving**, so that alone should not
take the site down — see [MIGRATION_ROLLBACK.md](./MIGRATION_ROLLBACK.md). Confirm with
`curl -s <url>/api/v1/health` whether `commitSha` is the old build.

---

## False alarms: what should NOT page you

**Staging cold starts.** Staging runs with Railway scale-to-zero (`deploy.sleepApplication`). A cold
`/api/v1/health` returns 502 for ~15–20 s — once ~75 s — while Express is up and NestJS is still booting. The
check retries across ~100 s before failing, and those retries are also what *wake* staging. Verified 2026-10-02:
staging was genuinely asleep, failed attempt 1, and passed on attempt 2 at t=15 s.

If staging starts alerting regularly, raise the retry budget rather than muting the check — a muted monitor is
worse than none.

---

## The monitor's own failure modes — read this, it is the weak spot

A monitor that dies quietly recreates the exact problem BL-34 was about. Known ways this one can:

1. **GitHub disables scheduled workflows after ~60 days of repository inactivity.** This is the big one. No email
   is sent when it happens. A long break from the repo is also precisely when an unnoticed outage hurts most.
   Mitigation is awareness only; if this matters more later, a third-party monitor (UptimeRobot, Better Stack)
   does not have this failure mode and is the real fix.
2. **Scheduled runs only execute from the default branch.** Editing `uptime.yml` on a branch changes nothing until
   it is merged to `main`.
3. **Cron is not punctual.** GitHub may run a scheduled job 5–15 minutes late on shared runners, worse at peak.
   Worst-case detection is roughly the interval plus the drift. Fine for this purpose; do not treat the schedule
   as an SLA.
4. **It depends on your notification settings.** GitHub must be configured to email you on failed Actions runs, or
   the check fails silently into the web UI. See below.
5. **GitHub Actions outages.** Rare, and no check runs during one.

### Confirm the email path actually works

Worth doing once, properly — an untested alert path is an assumption, not a safety net:

1. GitHub → **Settings → Notifications → Actions** → ensure email is enabled (*"Only notify for failed workflows"*
   is the right setting).
2. Trigger a deliberate failure: **Actions → Uptime → Run workflow → `simulate_failure: true`**.
   It probes a URL that cannot return a healthy body, exhausts the retry budget (~100 s) and fails.
3. Confirm the email arrives, and that it tells you enough to act.

---

## Railway billing alerts — manual, cannot be automated from here

The Railway CLI exposes no notification or billing command (`railway --help`, verified 2026-10-02), so this half of
BL-34 is a dashboard task:

1. Railway → account/workspace → **Billing** — confirm a payment method is attached and current.
2. Enable **billing / payment-failure notifications** to an email address you actually read.
3. Railway → project → **Settings → Notifications** — enable deployment-failure notifications if offered.

This is the half that would have caught the real incident *before* it became an outage, rather than 15 minutes
after. The uptime check is the backstop, not the fix.

---

## Related

- [MIGRATION_ROLLBACK.md](./MIGRATION_ROLLBACK.md) — if the cause is a failed migration or deploy
- [US-OBS-005](../agile/epics/phase-1-ai-core/EPIC-OBS-00/stories/US-OBS-005/STORY.md) — ACs and test evidence
- BL-36 — staging scale-to-zero, the reason for the retry budget
- BL-34 — the original 15-day outage
