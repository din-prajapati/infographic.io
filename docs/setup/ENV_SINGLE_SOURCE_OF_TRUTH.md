# Environment & Secrets Management — Single Source of Truth

> **Supersedes** the earlier Replit-era version of this doc. The project moved off Replit to
> Railway + Neon; this rewrite (2026-07-25) reflects that and captures the process fix behind a
> real incident: a manual Railway-dashboard edit to staging's Google OAuth vars appeared to succeed
> but silently didn't deploy — caught only by a later `railway variables` audit, not by any process.

---

## The core problem this solves

Right now, for a 3-environment project (local / staging / production), a value like `GOOGLE_CLIENT_ID`
can live in up to 4 places: `.env.example` (template), local `.env`, Railway's staging dashboard, Railway's
production dashboard. When someone hand-edits one of those directly, there is:
- no diff (you can't see what changed vs. what it was)
- no confirmation the edit actually saved (this bit us — an edit looked complete, staging kept serving
  stale values, three separate `railway variables` pulls confirmed it)
- no single place to answer "what does staging actually have right now" without opening a dashboard

**The fix is not more files or a new paid tool — it's making exactly one of those places authoritative
per environment, and never hand-editing Railway's dashboard again.**

---

## The model: one master file per environment, one script to publish it

This pattern already exists in this repo (built in US-LAUNCH-009) — it just isn't being used day-to-day.
From today, use it every time:

```
.env.example              committed — the CONTRACT. Every key the app reads, with placeholder values.
                           (docs/setup/ENVIRONMENTS.md is the human-readable version of this contract.)

secrets/local.env          gitignored — YOUR local master copy. `cp .env.example secrets/local.env`, fill in real values.
secrets/staging.env        gitignored — the staging master copy.
secrets/production.env     gitignored — the production master copy. Handle with extra care.

.env                       gitignored — copy/symlink of secrets/local.env; what `npm run dev` actually reads.
```

> ⚠️ If your repo root is cloud-synced (this one is — `.../GITDrive/...`), keep the real
> `secrets/*.env` files **outside** the synced tree (e.g. `~/secrets/infographicai/`) per
> `secrets/README.md`, and symlink or copy them in only on machines you trust.

**To change anything on Railway, the only supported path is:**

```bash
# 1. Edit the master file (never the Railway dashboard directly)
#    e.g. secrets/staging.env — update GOOGLE_CLIENT_ID etc.

# 2. Push it
bash scripts/railway-env-sync.sh secrets/staging.env staging

# 3. Railway redeploys AUTOMATICALLY on a variable change — usually nothing to do here.
#    `railway redeploy` will in fact fail while that automatic deploy is still in flight
#    ("The latest deployment ... cannot be redeployed"). Confirm it settled instead:
railway deployment list --environment staging

# 4. Verify what actually landed — don't trust the dashboard, pull it back
railway variables --service Buildographic --environment staging --kv | grep GOOGLE
```

Step 4 is not optional. It's the step that was skipped today and is exactly what caught the
still-stale values after the first "I updated it" — a 10-second habit that eliminates the entire
class of "did that actually save" uncertainty.

> ⚠️ **One `railway variables --set` call per variable = one deployment per variable.**
> Railway triggers a redeploy on every variable mutation. `railway-env-sync.sh` sets variables in a
> loop, one per line, so syncing a whole master file queues **as many stacked deployments as there
> are variables**. Observed 2026-08-27: 8 plan-ID sets produced 8 concurrent deployments of the
> staging service.
>
> The CLI accepts repeated `--set` flags, so all of them can go in a single invocation and produce a
> single deployment:
>
> ```bash
> railway variables --set "A=1" --set "B=2" --set "C=3" --environment staging
> ```
>
> Both `scripts/set-razorpay-plan-ids.sh` and `scripts/railway-env-sync.sh` were fixed to batch this
> way on 2026-08-27.

> ⚠️ **`railway-env-sync.sh` was also silently broken until 2026-08-27**, in a way that matters for
> reading this doc's history: it used `((count++))` to tally variables, and under `set -e` that
> construct returns the *pre-increment* value as its exit status — so the very first increment (0)
> read as a failure and aborted the script. **It set exactly one variable, then exited 1.**
>
> This is worth knowing because this doc calls the script "the only supported path" for changing
> Railway variables. That path did not work end-to-end for a multi-variable file. If you ever ran it
> and concluded the sync had happened, only the first variable in the file actually landed — worth a
> `railway variables --kv` audit against your master files before trusting any past sync.

**Why this collapses the "3 different files" overwhelm:** you don't manage 3 environments by hand —
you manage 1 template (`.env.example`) and edit each environment's *one* master file only when a value
actually needs to change, then let the script do the mechanical part. The Railway dashboard becomes
read-only in practice (only used for step 4's verification), never a place you type into.

---

## The safety net: boot-time validation (US-LAUNCH-010)

Even with the process above, someone will eventually hand-edit the dashboard again, or a sync will be
run against the wrong environment. That's what `api/src/config/env.validation.ts` (US-LAUNCH-010) is
for: if a required value is missing or a RazorPay key is the wrong mode for its environment, the app
**refuses to boot** and says exactly which key is wrong — instead of the misconfiguration sitting there
silently until a user hits the broken feature. Process (this doc) prevents the mistake; validation
(US-LAUNCH-010) catches it if process is skipped. Keep both.

---

## Checklist: adding a brand-new secret/variable

1. Add it to `.env.example` with a placeholder value and a one-line comment (the contract).
2. Add its row to `docs/setup/ENVIRONMENTS.md`'s variable matrix (shape per environment, per-env/shared, source).
3. Add it to your local `secrets/local.env` (or `.env` directly) and to `secrets/staging.env` /
   `secrets/production.env` if those master files exist on your machine.
4. Push via `railway-env-sync.sh` to each Railway environment that needs it.
5. `railway variables --environment <env> --kv | grep <KEY>` to confirm it actually landed.
6. If the app should refuse to boot without it, add it to the required set in `env.validation.ts`
   (US-LAUNCH-010) — only if it's present with a real value on **every** environment that will boot
   with it required (check current values first, not assumptions — see
   `stories/US-LAUNCH-010/Pre-requisite-story.md` §2 for how to pull live values safely).

---

## If this ever needs to scale beyond one operator

The file+script pattern above costs nothing beyond what's already running and is enough for a solo/small
team. If the team grows and manual `secrets/*.env` files become their own source of drift, the natural
next step (not needed now) is a dedicated secrets sync tool with a generous free tier for small projects —
e.g. Doppler or Infisical, both of which sync directly to Railway and show a live diff between
environments (which would have caught today's mismatch instantly, before any redeploy). Evaluate only
if the file-based process above starts breaking down in practice — don't add tooling ahead of the pain
it solves.

---

## Reference

- [`secrets/README.md`](../../secrets/README.md) — the master-copy convention in detail
- [`scripts/railway-env-sync.sh`](../../scripts/railway-env-sync.sh) — the publish script
- [`ENVIRONMENTS.md`](./ENVIRONMENTS.md) — the full per-variable matrix (the human-readable contract)
- [`US-LAUNCH-010/Pre-requisite-story.md`](../../agile/epics/phase-1-ai-core/EPIC-LAUNCH-01/stories/US-LAUNCH-010/Pre-requisite-story.md) — how to safely audit live Railway values without exposing secrets in logs/chat
