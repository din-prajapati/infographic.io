---
name: ship-it
version: 1.0.0
description: >
  Stage 7 of the AI-SDLC pipeline. Invoke devops-agent to deploy a merged PR to
  the target environment, run smoke checks, and report status. Handles env var
  validation and rollback decisions.
triggers:
  - "ship"
  - "ship it"
  - "deploy"
  - "deploy to staging"
  - "deploy to production"
  - "release"
domains:
  - all
agents:
  - devops-agent
---

# Skill: ship-it

## Purpose

Take a merged PR (or a clean main branch) and deploy it to the target environment with full pre/post checks.

## Input

Required:
- **Target environment:** `staging | production | preview` (default `staging`)

Optional:
- **Commit SHA:** specific commit to deploy (default `HEAD` of main)
- **Skip smoke:** `false` by default (you almost never want to skip)

## Protocol

### Step 1 — Pre-flight Verification

```
[ ] On main branch (or specified branch)
[ ] Working tree clean
[ ] Last commit is the intended deploy target
[ ] Gate 1 passes on main
[ ] PROJECT_CONTEXT.yaml.stack.deploy is set
```

If any unchecked, STOP.

### Step 2 — Invoke devops-agent

```
devops-agent: deploy to {target}

Pre-deploy checks:
  - Run all gates from PROJECT_CONTEXT.yaml.gates
  - Cross-reference env vars: .env.example vs deploy target
  - Verify schema migrations safe

Deploy:
  - Use {stack.deploy} target's deploy command
  - Capture output to deploy.log

Post-deploy smoke:
  - Health check
  - Critical user flow check
  - Latency check
  - Error rate (Sentry/monitoring) baseline vs current

Decision:
  - Healthy → record version + notify
  - Degraded → wait 5 min, recheck
  - Failed → rollback NOW
```

### Step 3 — Display Status

```
🚀 Deploy to {target}

Pre-deploy:
  ✅ Gates passed
  ✅ Env vars in sync
  ✅ Schema migrations safe

Deploy: {success | failed}
  Build time:  {N}s
  Deploy time: {N}s
  URL: {deploy-url}
  Commit: {SHA-short} "{commit message}"

Smoke checks:
  ✅ Health: 200 OK ({latency}ms)
  ✅ Auth flow: 200 OK
  ✅ Critical endpoint: 200 OK
  {if monitoring set:}
  📊 Sentry: {error count last 5 min} (baseline: {N})

Verdict: 🟢 Healthy | 🟡 Degraded | 🔴 Failed
```

### Step 4 — Update Trackers

If deploy succeeded:
- Update `TEAM_STATUS.md` with: "Deployed {SHA} to {target} on {timestamp}"
- If this is a milestone or epic completion, flag it

If deploy failed and rollback executed:
- Create entry in `TEAM_STATUS.md` with incident details
- Flag stories that should be reverted in their STORY.md

### Step 5 — Print Next Steps

```
{If Healthy:}
  ✅ Deploy complete and verified healthy.
  
  Monitor for next 30 min at: {monitoring-url}
  
  Next:
    /close-story US-{ID} #{PR}  — if not already closed
    
{If Rolled Back:}
  🔴 Rolled back to {previous-SHA}.
  
  Incident note created in TEAM_STATUS.md.
  
  Next:
    - Investigate failure cause
    - Create fix story
    - Re-deploy only after fix verified
```

## Production Discipline

Read these rules before any production deploy:

1. **Never deploy Friday afternoon** unless rolling back a worse issue.
2. **Never deploy on top of a hot incident** — stabilize first.
3. **Never skip smoke checks** even if "it built fine."
4. **Never deploy with uncommitted local changes.**
5. **Always have a rollback command ready** before pressing deploy.
6. **Always announce the deploy** to the team (Slack/Discord/etc).

## Edge Cases

| Situation | Rule |
|-----------|------|
| Deploy target unreachable | Retry once. If still down, escalate to human. |
| Schema migration fails mid-deploy | STOP. Do not roll forward. Manual recovery. |
| Health check fails immediately | Rollback within 60 seconds. |
| Health check fails after 5 min | Wait 2 more min, recheck. If still failing, rollback. |
| Two deploys racing (CI + manual) | Cancel one. Single source of truth. |

---

*Skill version: 1.0.0 | Created: 2026-05-18*
