# Deploy Runbook — Neon (DB) + Railway (App)

> Architecture decision: **Neon** hosts Postgres (for native DB branching per environment); **Railway** hosts the app only. See `docs/DEPLOYMENT_STRATEGY.md` §6.

Repo is already deploy-ready: `railway.json`, `.nvmrc` (Node 22), `db:deploy` script, `tsx`/`cross-env` in runtime deps, and the cross-platform `reusePort` listen fix in `server/index.ts`.

---

## A. Neon — create the database + branches

1. Create a Neon project (region close to your Railway region, e.g. AWS `us-west-2`).
2. Branches → you'll use one branch per environment:
   - `production` (the default `main` branch is fine)
   - `staging` (create a branch off production)
   - preview branches are created per-PR later (optional, via CI)
3. For each branch, copy its **Direct connection** string (host **without** `-pooler`), SSL required. It looks like:
   ```
   postgresql://neondb_owner:PASSWORD@ep-xxxx.us-west-2.aws.neon.tech/neondb?sslmode=require
   ```
   This is the value you'll set as `DATABASE_URL` for the matching Railway environment.

> Why direct (non-pooled)? The app is a single long-running container, not serverless. A direct connection is simplest and avoids PgBouncer prepared-statement caveats. (Only switch to the pooled host + `&pgbouncer=true` if you later hit connection limits.)

---

## B. Railway — host the app (no Railway Postgres)

```powershell
railway login
railway init                 # name it e.g. "infographic-editor"
```
Do **not** run `railway add --database postgres` — the DB is on Neon.

### First deploy (creates the web service)
```powershell
railway up --detach
```
The container may crash-loop until variables are set (next step) — expected.

### Set variables (production environment)
```powershell
$jwt  = [Convert]::ToBase64String((1..32 | % {Get-Random -Max 256}))
$sess = [Convert]::ToBase64String((1..32 | % {Get-Random -Max 256}))

railway variables `
  --set "DATABASE_URL=postgresql://neondb_owner:PASSWORD@ep-xxxx.us-west-2.aws.neon.tech/neondb?sslmode=require" `
  --set "NODE_ENV=production" `
  --set "JWT_SECRET=$jwt" `
  --set "SESSION_SECRET=$sess" `
  --set "OPENAI_API_KEY=sk-...your key..." `
  --set "IDEOGRAM_API_KEY=...your key..."
```
Paste the **Neon production branch** direct URL into `DATABASE_URL`. Do **not** set `PORT` (Railway injects it).

### Redeploy + public URL
```powershell
railway up --detach
railway domain
railway logs        # expect: prisma db push → "serving on port" → "Nest application successfully started"
railway open
```

---

## C. Staging environment (Neon `staging` branch)

```powershell
railway environment new staging          # or use the dashboard
railway environment staging
railway variables `
  --set "DATABASE_URL=<NEON staging-branch direct URL>" `
  --set "NODE_ENV=production" `
  --set "JWT_SECRET=<unique>" `
  --set "SESSION_SECRET=<unique>" `
  --set "OPENAI_API_KEY=<key>" `
  --set "IDEOGRAM_API_KEY=<key>"
railway up --detach
```
Use **Razorpay TEST** keys + test plan IDs here (see `.env.development.example`); LIVE keys only in production.

---

## D. PR / preview environments (optional, with Neon branching)

Enable Railway PR environments. The app spins up per PR; give each its own data by creating a **Neon branch per PR** and injecting its URL:

- Neon CLI: `neonctl branches create --name pr-<number>` → returns a connection string.
- In CI (GitHub Actions on `pull_request`): create the branch, then
  `railway variables --set "DATABASE_URL=<pr branch url>"` for that PR environment.
- On PR close: `neonctl branches delete pr-<number>` to clean up.

This is what gives you **isolated, prod-shaped data per PR** — the main reason we chose Neon over Railway Postgres.

---

## E. Verify the product (US-DESIGN-003 path)

1. Open the Railway URL → register a new account at `/auth` (fresh branch has no users; `templates.service` auto-seeds templates on first boot).
2. Open a template into the editor → open the AI chat.
3. Generate with an address + price prompt, e.g. `Modern home at 123 Main St, Austin TX priced at $500,000`.
4. With `IDEOGRAM_API_KEY` set, this exercises the real AC3 flow (result card + image + usage counter).

---

## Mapping to repo config
- **Build** (`railway.json`): `npm run prisma:generate && npm run build`.
- **Start** (`railway.json`): `npm run db:deploy && npm start` → `prisma db push` against the Neon branch, then Express on `$PORT` spawns NestJS on `:3001`.
- **Healthcheck**: `/` (app-up, DB-independent) with restart-on-failure.
- **DB URL resolution**: `DATABASE_URL` wins; if only `PG*` are set, `ensureDatabaseUrlFromPgEnv()` builds the URL with `?sslmode=require` (`api/src/common/ensure-database-url.ts`).

---

*Created: 2026-06-03 · Companion to `docs/DEPLOYMENT_STRATEGY.md`.*
