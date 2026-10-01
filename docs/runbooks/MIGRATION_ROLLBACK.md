# Runbook — Failed migration / schema rollback

> **Use when:** a deploy fails in the migration step, or a migration applied but the release must be undone.
> **Owner:** whoever is deploying. **Created:** 2026-10-01 (US-DEPLOY-004 AC5).

---

## First: the migration step cannot take the site down

Migrations run as `deploy.preDeployCommand` in `railway.json`. Railway runs it **before** any new container
serves traffic, so:

- **preDeploy fails → the deploy aborts and the previous version keeps serving.** Nothing to roll back; the site
  is still up on the old build. You are debugging a deploy, not an outage.
- Confirm that is what happened before doing anything else:

```bash
curl -s https://app.buildographic.com/api/v1/health      # commitSha should still be the OLD one
railway logs --environment production                     # the preDeploy failure is at the tail
```

If `commitSha` is the old build and `status":"ok"`, **stop here** — fix forward, no restore needed.

---

## The one thing you must never do

```
prisma db push --accept-data-loss        ❌  NEVER against staging or production
```

It resolves the error by **silently dropping whatever doesn't match the schema** — columns, tables, and the rows in
them. There is no confirmation and no trail. It is the tempting unblock and it is how you lose customer data.
`npm run db:push:unsafe-local` exists for throwaway local DBs only; the name is the warning.

---

## Decision tree

```
preDeploy failed
├── Old build still serving?  ──YES──▶  Fix forward. §A
└── NO (or migration already applied and the release is bad)
    ├── Migration was additive only (expand step)?  ──YES──▶  Revert the code, leave the column. §B
    └── Migration was destructive (contract step: dropped/renamed/retyped)  ──▶  Restore the DB. §C
```

---

## §A — preDeploy failed, old build still serving (the common case)

1. Read the actual Prisma error at the tail of `railway logs`.
2. Match it:

| Error | Meaning | Fix |
|---|---|---|
| **P3005** `database schema is not empty` | The DB has tables but no `_prisma_migrations` — it was never baselined. | Baseline it once: `railway run --environment <env> -- npm run db:baseline`, then redeploy. |
| **P3009** `migrate found failed migration` | A previous migration is recorded as failed and blocks all others. | Resolve it deliberately: if its SQL did **not** apply, `prisma migrate resolve --rolled-back <name>`; if it **did** apply, `--applied <name>`. Check the DB before choosing. |
| **P3018** `migration failed to apply` | The SQL itself errored (constraint violation, type clash, existing object). | Fix the migration SQL, commit, redeploy. Do **not** hand-edit the DB to match. |
| `57P01 terminating connection due to administrator command` | Neon auto-paused/suspended mid-command. Not a migration fault. | Re-run the deploy. If it recurs, warm the branch first with any query. |

3. Push the fix to `main`. **Both environments rebuild on a push to `main`** — staging and production. Expect
   3–5 min; confirm the swap by watching `uptime` **drop** in `/api/v1/health`, not by assuming.

---

## §B — Migration applied, release is bad, migration was additive

An expand-step migration (new nullable/defaulted column, new table, new index) is **backward compatible by
construction** — the old build runs fine against it.

1. Revert the application code only: `git revert <sha>` → push to `main`.
2. **Leave the schema alone.** The extra column is inert; dropping it is a separate contract-step migration,
   deployed later, deliberately.
3. Verify the old build boots: `/api/v1/health` returns `ok` with the reverted `commitSha`.

This is the whole payoff of expand → backfill → contract: *most* rollbacks need no DB action at all.

---

## §C — Migration was destructive — restore the Neon branch

Only for a contract step that dropped, renamed, or retyped something, where the data is gone.

> **Which branch is which** — get this wrong and you restore the wrong environment:
> - production → Neon `ep-aged-king`
> - staging → Neon `ep-billowing-cell` — **this is also the local dev DB.** Restoring staging rolls back
>   developers' working data. Tell the team before you do it.

1. **Stop the bleeding.** In Railway, redeploy the last-known-good build so no new writes land on the broken
   schema. (Note: the old build may refuse to boot if the schema moved — that is BL-33's failure mode and the
   reason this runbook exists. If so, accept a brief outage rather than forcing the schema.)
2. **Capture evidence first** — once you restore, the broken state is gone and so is any post-migration write:
   ```bash
   railway logs --environment <env> > ~/incident-<date>.log
   ```
   Note the exact UTC timestamp of the migration from `_prisma_migrations.finished_at`.
3. **Restore the branch to a point in time just before the migration** using Neon's branch restore /
   point-in-time restore for that branch. Neon keeps a restore window (history retention) — if the migration is
   older than the retention window this path is closed, so check retention *before* relying on it.
4. **Reconcile the migration history.** After a restore, `_prisma_migrations` reflects the restored point, so the
   bad migration is no longer recorded. Confirm with:
   ```bash
   railway run --environment <env> -- npx prisma migrate status
   ```
   It should list the bad migration as not applied.
5. **Remove or fix the migration in git** before redeploying — otherwise the next deploy re-applies the exact
   migration you just restored away from.
6. **Account for writes lost in the restore window.** Anything written between the restore point and now is gone.
   Check `Payment`, `Subscription`, and `Invoice` against the provider (RazorPay dashboard) for records the DB no
   longer has — those are the rows that cost money to lose.

---

## Prevention checklist (run before merging any migration)

- [ ] Is it a pure **expand** step? If it drops/renames/retypes anything, split it.
- [ ] Does the **current** production build boot against the new schema? (It must — that's the rolling-deploy guarantee.)
- [ ] `npx prisma migrate status` clean on staging before promoting.
- [ ] For a table with real rows: no new `NOT NULL` without a default, no in-place type change.
- [ ] Neon restore window comfortably longer than the time you'd take to notice a problem.

---

## Related

- [DEPLOYMENT_STRATEGY.md §6 — Migrations](../DEPLOYMENT_STRATEGY.md) — the expand→backfill→contract rule
- [US-DEPLOY-004](../agile/epics/phase-1-ai-core/EPIC-DEPLOY-01/stories/US-DEPLOY-004/STORY.md) — why boot-time `db push` was removed
- BL-34 — alerting; a failed deploy that leaves the old build serving is **silent** until someone looks
