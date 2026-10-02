# TASKS — US-OBS-005: External availability monitoring

> **Story:** [STORY.md](./STORY.md) · **Branch:** `feat/obs/us-obs-005-uptime-monitor`
> **Opened:** 2026-10-02 · **Scope-locked.** Closes **BL-34 (P1)**.

---

## Four-Pillars Pre-flight

| Pillar | Status |
|---|---|
| **Brain** | Detect "the product is serving nothing" from outside Railway, and email Dinesh. Deliberately narrow: this is an availability tripwire, not observability. Sentry (US-OBS-001…004) covers errors *inside* a running app and structurally cannot cover this. |
| **Muscle** | GitHub Actions `schedule` cron. It runs on GitHub's infrastructure, so it survives a total Railway or Neon failure — the property that matters. GitHub emails the repo owner on a failed scheduled run. |
| **Map** | `.github/workflows/uptime.yml`, `docs/runbooks/UPTIME_MONITORING.md`, `docs/agile/BACKLOG.md`. |
| **Env** | ✅ Repo is **public** (`gh repo view` → `visibility=PUBLIC`), so Actions minutes are free and unlimited — a 15-minute cadence costs nothing. On a private repo this would consume ~1460 of 2000 free minutes/month and the cadence would have to drop to hourly. ⚠️ Requires Dinesh's GitHub notification settings to email on Actions failures (T5, his to confirm). |

---

## Why GitHub Actions and not a third-party monitor

| Option | Verdict |
|---|---|
| **GitHub Actions cron** | Chosen. No new account, version-controlled with the code, free on a public repo, independent of Railway. Weaker on cadence precision and has one silent-death mode (see Risks). |
| UptimeRobot / Better Stack free tier | Genuinely better at this job — 1-minute checks, status page, SMS. Needs a human to create an account, so it cannot be done from here. Out of Scope; revisit if the Actions check proves unreliable. |
| Railway's own alerts | Cannot help. The 2026-09-14 failure *was* Railway, account-level. A monitor inside the failing system is not a monitor. |
| Sentry (already in this epic) | Reports errors from running code. Reports nothing when there is no running code. |

---

## Tasks

| # | Task | AC | Est | Status |
|---|---|:--:|:--:|:--:|
| T1 | `uptime.yml`: scheduled check of both envs, body assertion, cold-start retries | AC1, AC2, AC3 | 40 m | ✅ Done |
| T2 | Failure output names env + status + time; `workflow_dispatch` switch to rehearse a failure | AC5 | 20 m | ✅ Done |
| T3 | Runbook: what the alert means, how to triage, and the monitor's own failure modes | AC6 | 30 m | ✅ Done |
| T4 | Verify green path against both live envs, incl. staging asleep | TC-01, TC-03 | 15 m | ✅ Done — TC-01/03/04 pass locally |
| T5 | **OPERATOR:** prove the email actually arrives; confirm GitHub Actions email notifications are on; set Railway billing alerts in the dashboard | AC4, TC-02 | 10 m | ⏸ Blocked — needs merge first (dispatch only registers from default branch) |
| T6 | Close BL-34, closeout, PR | DoD | 20 m | 🟡 PR open; BL-34 closes after T5 |

---

## Risks

| Risk | Mitigation |
|---|---|
| **GitHub disables scheduled workflows after 60 days of repo inactivity** — the monitor dies silently, which is the exact failure class BL-34 is about | Documented prominently in the runbook as the monitor's own blind spot. This repo is committed to most days, so the trigger is unlikely but not impossible (a long break is precisely when an unnoticed outage hurts most). No in-repo fix; a third-party monitor is the real answer if this matters more later. |
| Cron delay on shared runners (can be 5–15 min late, worse at peak) | Irrelevant at this problem's scale — the incident being solved lasted 15 days. Stated in the runbook so nobody reads the schedule as a guarantee. |
| Staging's scale-to-zero cold start raises false alarms, the monitor gets ignored, and a real outage is missed | AC3: retry with backoff past ~95 s before failing. The retry loop also *warms* staging, since the first request is what wakes it. |
| A check that only asserts HTTP 200 passes a half-dead app | AC2: assert `"status":"ok"` in the body. Observed 2026-10-01 — the Express proxy serves `/` with 200 while NestJS is down and `/api/v1/*` returns 502. |
| Alert fatigue if this later grows into generic monitoring | Kept to one question — "is it serving?" Latency/error-rate belongs to US-OBS-004. |

---

## Decisions taken in session

1. **Assert the body, not the status code.** Directly from the 2026-10-01 finding that `/` returns 200 while the API
   is down. A status-code-only check would have called today's cold staging healthy.
2. **Check both environments, fail them independently** (`fail-fast: false`), so staging noise can never mask a
   production alert.
3. **Billing alerts stay manual.** `railway --help` exposes no notification or billing command (verified
   2026-10-02), so it is a documented dashboard step, not automation. Honest beats clever here: the billing lapse
   was the actual root cause of BL-34, and the repo cannot watch it.
4. **15-minute cadence**, not 30. Free on a public repo, and tightens worst-case detection to ~15 min + cron drift.
