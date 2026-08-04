# Deploy & Release Checklists

Canonical checklist templates for merge, preview, release, canary, and migration gates.
Used by the `deploy-release-governance` skill and `.cursor/commands/*-checklist.md` commands.

**Rule:** Merge approval ≠ release approval. Business users approve behavior on preview URLs and flag flips, not code diffs.

---

## PR Review Checklist (team / full gate)

```markdown
## PR Review Checklist

### 1. Scope
- [ ] The PR solves one clear story / problem
- [ ] The change is small enough to review safely
- [ ] Out-of-scope work is not mixed in

### 2. CI / Technical Gate
- [ ] Typecheck passes
- [ ] Unit tests pass
- [ ] Build passes
- [ ] Smoke boot passes
- [ ] Required E2E smoke tests pass
- [ ] No known failing required checks are being ignored

### 3. Runtime / Behavior
- [ ] The changed flow was verified in a running environment
- [ ] Error states were checked where relevant
- [ ] Empty/loading states were checked where relevant
- [ ] Logging/telemetry impact is understood for risky changes

### 4. Data / API / Infra Safety
- [ ] DB changes are documented
- [ ] Any schema change is backward-compatible for rollout
- [ ] Secrets are not hardcoded or exposed
- [ ] Env var changes are documented
- [ ] Third-party dependency or provider changes are documented

### 5. Release Safety
- [ ] Risk level is noted: low / medium / high
- [ ] Rollback path is clear
- [ ] If risky or unfinished, the change is behind a feature flag
- [ ] If no feature flag is used, the reason is stated

### 6. Reviewer Notes
- [ ] Screenshots / preview link / demo notes are attached where useful
- [ ] Testing notes explain what was actually verified
- [ ] Follow-up work is listed separately, not hidden in the PR
```

---

## Preview Verification Checklist

```markdown
## Preview Verification Checklist

### Basic Verification
- [ ] Preview URL opens successfully
- [ ] App boots without crash
- [ ] Health check / critical backend path is working
- [ ] Correct preview environment is being used (`APP_ENV=preview`)

### Feature Verification
- [ ] The intended user flow works end-to-end
- [ ] The UI matches expected behavior
- [ ] No obvious regressions were seen in nearby flows
- [ ] Validation, error, and edge states were checked where relevant

### Environment Safety
- [ ] Preview is using non-production secrets (Razorpay TEST, etc.)
- [ ] Preview is not writing to production data
- [ ] Any payment/auth/integration behavior is using test mode

### Reviewer Outcome
- [ ] Approved from behavior/UX perspective
- [ ] Blocked with reproducible notes
- [ ] Needs follow-up but safe to continue
```

---

## Solo Merge Checklist (solopreneur default)

```markdown
## Solo Merge Checklist

- [ ] CI is green (`npm run check`, `npm run test:unit`, build, smoke boot)
- [ ] I reviewed the diff end-to-end
- [ ] I verified the change in preview or an equivalent running environment
- [ ] I understand the rollback path (revert commit, disable flag, or redeploy prior tag)
- [ ] Any risky behavior is flagged or intentionally staged
- [ ] This is safe to merge to `main`
```

---

## Release Checklist

```markdown
## Release Checklist

### 1. Readiness
- [ ] The change is already merged and deployed
- [ ] The feature was verified in staging/preview
- [ ] Release notes or operator notes exist if needed

### 2. Safety Controls
- [ ] Feature flag exists if the change is risky
- [ ] Initial target audience is defined (internal / canary % / all users)
- [ ] Rollback action is known (disable flag, rollback deploy, or revert tag)
- [ ] Monitoring/alerts are available for this release (Sentry, health, key metrics)

### 3. Environment Check
- [ ] Correct environment variables are present
- [ ] No production-only secret mismatch is expected
- [ ] Any DB migration required for the release is complete

### 4. Approval
- [ ] Engineering approves release safety
- [ ] Product/business approves user exposure
- [ ] QA/design approves visible behavior when relevant

### 5. Go / No-Go
- [ ] Release to internal only
- [ ] Release to limited users / canary
- [ ] Release to 100%
- [ ] Hold release and investigate
```

---

## Canary Rollout Checklist

```markdown
## Canary Rollout Checklist

### Start
- [ ] Deployment artifact is the intended version
- [ ] Health thresholds are defined (error rate, latency, `/api/health`)
- [ ] Alert channel is active (Sentry / Railway / ops channel)

### Stage 1
- [ ] Roll out to small percentage (e.g. 1–5%)
- [ ] Error rate remains acceptable
- [ ] Latency remains acceptable
- [ ] Critical journeys still work (auth, generation, checkout if applicable)

### Stage 2
- [ ] Increase to next percentage only after healthy observation window
- [ ] No unacceptable support/customer issues appear
- [ ] No rollback trigger fired

### Full Release
- [ ] Roll out to 100% only after gates stay healthy
- [ ] Mark release complete
- [ ] Capture any follow-up issues separately

### Rollback
- [ ] If health degrades, stop rollout immediately
- [ ] Roll back to previous known-good version or disable the flag
- [ ] Record incident notes and root cause
```

---

## Migration Checklist

```markdown
## DB Migration Checklist

- [ ] This change needs a schema change
- [ ] Migration is versioned and committed (`prisma migrate`, not ad-hoc `db push` in prod)
- [ ] The change follows expand → backfill → contract where needed
- [ ] Old and new code can coexist during rollout
- [ ] Migration was tested on staging Neon branch or equivalent
- [ ] Rollback / restore plan is documented (Neon branch restore + revert)
- [ ] Production deploy order is clear: migrate first, then app starts
```

---

## InfographicAI smoke paths (preview / staging)

Use when filling in "critical journeys" on preview or release checklists:

| Area | Path | Expect |
|------|------|--------|
| Health | `GET /api/health` | `status: ok`, DB connected |
| Auth | Register / login / logout | Session persists |
| Editor | Open editor, save design | No crash, design persists |
| AI gen | Trigger generation (if in scope) | Progress + result or clear error |
| Templates | Browse templates, open one | Loads without 500 |
| Pricing | Pricing page loads | Correct plan display; TEST keys in non-prod |
| Checkout | Checkout flow (staging only) | Razorpay TEST mode only |

---

*Companion to `docs/DEPLOYMENT_STRATEGY.md` and EPIC-DEPLOY-01.*
