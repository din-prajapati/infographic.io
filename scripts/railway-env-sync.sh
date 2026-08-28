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

# All --set flags are collected here and applied in ONE railway invocation.
#
# Railway triggers a redeploy on every variable mutation, so setting variables one
# at a time queues one stacked deployment PER VARIABLE — a 50-line env file would
# start 50 concurrent deployments of the same service. Observed 2026-08-27 when a
# sibling script set 8 variables in a loop and produced 8 deployments.
set_args=()

while IFS= read -r line || [[ -n "$line" ]]; do
  # Skip comments and blank lines
  [[ "$line" =~ ^[[:space:]]*# ]] && { skipped=$((skipped + 1)); continue; }
  [[ -z "${line// }" ]] && continue

  # Expect KEY=VALUE format
  if [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
    key="${BASH_REMATCH[1]}"
    value="${BASH_REMATCH[2]}"

    set_args+=(--set "${key}=${value}")
    if [[ "$DRY_RUN" == "1" ]]; then
      echo "  [dry-run] would set: $key"
    else
      echo "  queued: $key"
    fi
    # NOTE: count=$((count+1)), never ((count++)). Under `set -e`, ((count++))
    # returns the pre-increment value as its exit status, so the very first
    # increment (0) is a "failure" and aborts the script after one variable.
    count=$((count + 1))
  else
    echo "  [warn] skipping malformed line: ${line:0:40}..." >&2
  fi
done < "$ENV_FILE"

if ((count == 0)); then
  echo "" >&2
  echo "No valid KEY=VALUE lines found in $ENV_FILE — nothing to sync." >&2
  exit 1
fi

if [[ "$DRY_RUN" != "1" ]]; then
  echo ""
  echo "  Applying all $count variables in a single call (one deployment)..."
  railway variables "${set_args[@]}" --environment "$RAILWAY_ENV" ${RAILWAY_SERVICE:+--service "$RAILWAY_SERVICE"}
fi

echo ""
echo "Done. Variables processed: $count (comments/blanks skipped: $skipped)"
if [[ "$DRY_RUN" != "1" ]]; then
  echo ""
  echo "Railway redeploys automatically on a variable change — no manual redeploy needed."
  echo '(`railway redeploy` will in fact fail while that automatic deploy is in flight.)'
  echo ""
  echo "Confirm it landed — do not skip (ENV_SINGLE_SOURCE_OF_TRUTH.md step 4):"
  echo "  railway variables --environment $RAILWAY_ENV --kv | grep <A_KEY_YOU_CHANGED>"
  echo "  railway deployment list --environment $RAILWAY_ENV"
fi
