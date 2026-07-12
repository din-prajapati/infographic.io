#!/usr/bin/env bash
# railway-env-sync.sh — Push a secrets/<env>.env master copy to Railway
#
# Usage:
#   bash scripts/railway-env-sync.sh <env-file> <railway-environment>
#
# Examples:
#   bash scripts/railway-env-sync.sh secrets/staging.env staging
#   bash scripts/railway-env-sync.sh secrets/production.env production
#
# Prerequisites:
#   - railway CLI installed: npm install -g @railway/cli
#   - Authenticated: railway login
#   - Linked to project: railway link  (run once from repo root)
#
# Safety:
#   - Reads the env file line by line; skips comments (#) and blank lines
#   - Does NOT echo values to stdout (protects secrets from shell history)
#   - Dry-run mode: set DRY_RUN=1 to print key names without setting values
#
# WARNING: This script calls `railway variables --set` which mutates the live
#          Railway environment. Double-check the <railway-environment> argument.

set -euo pipefail

ENV_FILE="${1:-}"
RAILWAY_ENV="${2:-}"
DRY_RUN="${DRY_RUN:-0}"

# --- Validation ---
if [[ -z "$ENV_FILE" || -z "$RAILWAY_ENV" ]]; then
  echo "Usage: bash scripts/railway-env-sync.sh <env-file> <railway-environment>" >&2
  echo "Example: bash scripts/railway-env-sync.sh secrets/staging.env staging" >&2
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: env file not found: $ENV_FILE" >&2
  exit 1
fi

if ! command -v railway &>/dev/null; then
  echo "Error: 'railway' CLI not found. Install with: npm install -g @railway/cli" >&2
  exit 1
fi

echo "Syncing $ENV_FILE → Railway environment: $RAILWAY_ENV"
if [[ "$DRY_RUN" == "1" ]]; then
  echo "(DRY RUN — no changes will be made)"
fi

count=0
skipped=0

while IFS= read -r line || [[ -n "$line" ]]; do
  # Skip comments and blank lines
  [[ "$line" =~ ^[[:space:]]*# ]] && { ((skipped++)); continue; }
  [[ -z "${line// }" ]] && continue

  # Expect KEY=VALUE format
  if [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
    key="${BASH_REMATCH[1]}"
    value="${BASH_REMATCH[2]}"

    if [[ "$DRY_RUN" == "1" ]]; then
      echo "  [dry-run] would set: $key"
    else
      railway variables --set "${key}=${value}" --environment "$RAILWAY_ENV" --silent 2>/dev/null \
        || railway variables --set "${key}=${value}" --environment "$RAILWAY_ENV"
    fi
    ((count++))
  else
    echo "  [warn] skipping malformed line: ${line:0:40}..." >&2
  fi
done < "$ENV_FILE"

echo ""
echo "Done. Variables processed: $count (comments/blanks skipped: $skipped)"
if [[ "$DRY_RUN" != "1" ]]; then
  echo "Redeploy the Railway service to pick up the new values:"
  echo "  railway redeploy --environment $RAILWAY_ENV"
fi
