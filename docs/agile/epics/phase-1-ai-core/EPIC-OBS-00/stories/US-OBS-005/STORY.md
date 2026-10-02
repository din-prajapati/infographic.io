# Story Card — US-OBS-005

> **Status:** 🟡 In Progress — code + docs done, blocked on T5 (operator: prove the email arrives, set Railway billing alerts)
> **Feature:** F-OBS-00-05 — External availability monitoring
> **Epic:** [EPIC-OBS-00](../../EPIC.md) · **Milestone:** M-OBS-01
> **Size:** S · **Estimate:** 1–2 h · **Created:** 2026-10-02
> **Closes:** BL-34 (P1)

---

## Story

*As the* operator of a live product
*I want* something outside Railway to notice when the site stops serving and tell me by email
*So that* an outage is measured in minutes, not the 15 days it took last time.

---

## Context

Production and staging served nothing from **2026-09-14 14:46:45 until 2026-09-29** — the Railway trial lapsed and
every environment in the workspace went with it. Nobody noticed. It was found only because a story happened to
need a deployed environment.

**Why the Sentry work in this epic does not cover this.** US-OBS-001…004 instrument a *running* application:
`logGen()` → TelemetryService → Sentry. Every one of them is code executing inside the container. When the
container does not exist, there is nothing to report the problem — the monitoring dies with the thing it monitors.
BL-34 therefore needs a check that runs **outside Railway entirely**, and that is the whole point of this story.

**A second reason it stayed invisible for 15 days:** the failure was account-level (billing), not a bad build.
No deploy failed, no error was thrown, no log line was written. Only an external observer could see it.

---

## Acceptance Criteria

- [ ] **AC1 [happy-path]:** A scheduled check runs **outside Railway** against both environments' `/api/v1/health`
      at least every 30 minutes, and keeps running when Railway is entirely down.
- [ ] **AC2 [correctness]:** The check asserts the **response body** contains `"status":"ok"` — not merely HTTP 200.
      *(The Express proxy answers `/` with 200 while NestJS is dead; a naive check passes a half-dead app. Observed
      live on 2026-10-01.)*
- [ ] **AC3 [no-false-alarms]:** Staging's scale-to-zero cold start does **not** raise an alert. The check retries
      with backoff for at least 60 s before declaring an environment down (BL-36: cold `/api/v1/health` 502s for
      ~17 s, once observed ~75 s).
- [ ] **AC4 [notification]:** A failure reaches Dinesh by **email** without any further configuration by him.
- [ ] **AC5 [error-path]:** The alert names *which* environment failed, the HTTP status or error, and the time —
      enough to act without opening a dashboard.
- [ ] **AC6 [documentation]:** The monitor's own failure modes are documented — in particular anything that can
      silently stop it (see Out of Scope / Risks), plus the manual Railway billing-alert steps that cannot be
      automated from the repo.

## Out of Scope
- Railway **billing-failure notifications** themselves — not configurable from the repo or the CLI (`railway --help`
  exposes no notification/billing command, verified 2026-10-02). Documented as a manual dashboard step under AC6.
- A third-party monitor (UptimeRobot / Better Stack) or a public status page — needs an account created by a human;
  revisit if the in-repo check proves insufficient.
- Latency SLOs, p95 dashboards, error-rate alerting — that is US-OBS-004 and the Sentry stories.
- Alerting on the `lead-engine-n8n-prod` project, also affected by the same lapse. Different repo.

## Primary files
- `.github/workflows/uptime.yml` (new)
- `docs/runbooks/UPTIME_MONITORING.md` (new)
- `docs/agile/BACKLOG.md` (BL-34 closeout)

## Test Cases
| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-OBS-005-01 | Manual | P0 | Given both environments healthy, when the check runs, then it passes and sends nothing | ✅ | **Pass 2026-10-02.** Production healthy on attempt 1 at t=2 s, exit 0. Staging see TC-03. |
| TC-OBS-005-02 | Manual | P0 | Given an environment returns a non-ok body, when the check runs, then it fails and an email arrives naming that environment | ⚠️ | **Failure detection pass 2026-10-02**, exit 1 after 7 attempts over 100 s, with environment / status / diagnosis / timestamp in the output. **The email half is unverified** — scheduled and dispatchable workflows only register from the default branch, so it cannot be exercised until this is merged. Deliberate failure run is T5, operator-run. |
| TC-OBS-005-03 | Manual | P0 | Given staging is asleep, when the check runs, then it waits out the cold start and passes (no false alarm) | ✅ | **Pass 2026-10-02 against a genuinely sleeping staging**, not a simulation: attempt 1 → `502 {"error":"Backend API unavailable"}`, attempt 2 at t=15 s → `200 {"status":"ok"}`, exit 0. The retries both tolerate and cause the warm-up. |
| TC-OBS-005-04 | Manual | P1 | Given the Express proxy is up but NestJS is down (200 on `/`, 502 on `/api/v1/*`), when the check runs, then it fails | ✅ | **Pass 2026-10-02, and it justified AC2 with evidence.** The SPA catch-all returns **HTTP 200 with HTML** for an unknown path — all 7 attempts saw `http=200`. A status-code-only check would have reported this healthy; only the `"status":"ok"` body assertion caught it. This is the half-dead-app case made concrete. |
| TC-OBS-005-05 | Manual | P1 | Given a total Railway outage (DNS/edge error, as in the real incident), when the check runs, then it fails rather than erroring ambiguously | ⚠️ | **Handled by construction, not reproduced.** `curl` failing to get any HTTP response yields `000`, which maps to an explicit diagnosis naming platform-down / account-suspension. Reproducing it would require taking Railway down or breaking DNS; not attempted. The `000` branch itself is untested code. |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

## Post-merge verification (2026-10-02)

Merged as `0792b82`. Confirmed the workflow is actually registered — a scheduled workflow GitHub does not recognise
is a silent no-op, which is the failure class this story exists to prevent:

- `gh workflow list` → **`Uptime  active  373033485`**
- Dispatched a normal (non-simulated) run on `main` → run `37000787811`, conclusion **success**
- Runner log: `attempt 1: http=200 body={"status":"ok",...,"commitSha":"0792b82"}` → `✅ staging healthy on attempt 1`
- Both matrix jobs passed, so TC-01 is now verified **in GitHub's runner**, not only locally

### Deliberate-failure rehearsal (2026-10-02)

Run **37014799995** (`workflow_dispatch`, `simulate_failure: true`) → **conclusion `failure`**, as intended:

- 7 attempts over ~100 s, every one `http=200` with an HTML body
- failed on the body assertion, not the status code — the point of AC2
- emitted `::error title=production is DOWN::…` plus the step-summary table

So detection and the GitHub-side failure signal are confirmed. **The email itself still needs
Dinesh's inbox confirmation** — nothing in the repo can verify delivery, and GitHub only sends it if
Settings → Notifications → Actions has email enabled.

**Finding from the rehearsal (fixed):** in simulate mode both matrix jobs probed *production's* host, so the
job labelled `staging` reported a production URL — misleading in exactly the moment someone is learning to read
the alert. Now each job simulates against its own `BASE_URL`.

**Still outstanding for AC4 / BL-34 closure:**
1. Confirm the failure email arrived (Dinesh's inbox).
2. Railway billing-failure notifications — dashboard only, see the runbook. This is the half that catches the
   next lapse *before* it becomes an outage.

## Definition of Done
- [ ] ACs ✅ · a deliberately failing run proves the email path (AC4 is worthless untested) · runbook written · BL-34 closed · PR merged
