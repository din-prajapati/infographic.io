# secrets/ — Master-Copy Convention

> This directory holds **local plaintext master copies** of environment secrets.
> It is gitignored. **No file in this directory is ever committed.**

---

## WARNING — Cloud-synced drive

This repository lives inside a cloud-synced path:

```
.../DCloud/GITDrive/.../InfographicEditor-Unified/
```

**Do NOT store plaintext secret files here if that path is synced to any cloud service (Google Drive, OneDrive, Dropbox, iCloud, etc.).**

If your repo root is cloud-synced, keep your `secrets/<env>.env` master copies **outside** the synced tree — for example:

```
~/secrets/infographicai/local.env
~/secrets/infographicai/staging.env
~/secrets/infographicai/production.env
```

Then symlink or copy into this directory only on machines you fully control and trust.

---

## Pattern

Each environment has one master `.env` file:

```
secrets/
  local.env        # Local development secrets
  staging.env      # Railway staging secrets
  production.env   # Railway production secrets (handle with extra care)
  README.md        # This file — committed
```

The `*.env` files are **gitignored** via `.gitignore`:

```
secrets/
secrets/*.env
```

---

## File Format

Each `secrets/<env>.env` is a copy of `.env.example` with real values filled in for that environment. Do not deviate from the key names — they are the canonical contract (`docs/setup/ENVIRONMENTS.md`).

Example `secrets/local.env` structure (never paste real values here):

```bash
# --- Core ---
NODE_ENV=development
PORT=5000
API_PORT=3001
BASE_URL=http://localhost:5000
CLIENT_URL=http://localhost:5173

# --- Database ---
DATABASE_URL=postgresql://<user>:<pass>@<host>/neondb?sslmode=require

# --- Auth ---
JWT_SECRET=<your-unique-32-byte-secret>

# ... all other vars per .env.example ...
```

---

## Deploying to Railway

Use `scripts/railway-env-sync.sh` (in the repo root's `scripts/` directory) to push a `secrets/<env>.env` file to Railway without manually entering each variable:

```bash
# Push local secrets to Railway staging environment
bash scripts/railway-env-sync.sh secrets/staging.env staging

# Push to production
bash scripts/railway-env-sync.sh secrets/production.env production
```

The script reads the file line-by-line and calls `railway variables --set KEY=VALUE --environment <env>` for each non-comment, non-empty line.

**Prerequisites:** `railway` CLI installed and authenticated (`railway login`).

---

## Rotation

When you rotate a secret:

1. Update the value in your master copy (`secrets/<env>.env`).
2. Re-run the sync script for that environment.
3. Redeploy the Railway service so it picks up the new value.
4. Revoke the old secret at the provider (RazorPay / Google Console / Sentry etc.).

---

## Access Control

- `secrets/production.env` — solo operator only. Never share over Slack/email/Discord.
- Treat `secrets/staging.env` with the same care as production (staging uses live-adjacent keys for some services).
- If a secret is ever committed accidentally: rotate it immediately, then remove it from git history with `git filter-repo`.

---

*Convention established: 2026-07-12 — US-LAUNCH-009*
