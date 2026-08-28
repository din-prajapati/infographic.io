#!/usr/bin/env bash
# set-razorpay-plan-ids.sh — Push the 8 Razorpay Plan IDs to one Railway environment
#
# Usage:
#   bash scripts/set-razorpay-plan-ids.sh <plan-ids-file> <railway-environment>
#
# Examples:
#   DRY_RUN=1 bash scripts/set-razorpay-plan-ids.sh ~/secrets/infographicai/plan-ids.staging.env staging
#   bash scripts/set-razorpay-plan-ids.sh ~/secrets/infographicai/plan-ids.production.env production
#
# Why this exists alongside railway-env-sync.sh:
#   railway-env-sync.sh pushes a whole master env file. These 8 keys change on their
#   own schedule (every reprice creates new immutable Plan objects), and pushing a
#   whole file to change 8 lines risks republishing stale neighbours. This script
#   touches only RAZORPAY_PLAN_*, and refuses known-bad IDs before they land.
#
#   The master file (secrets/<env>.env) stays authoritative per
#   docs/setup/ENV_SINGLE_SOURCE_OF_TRUTH.md — update it with the same values so the
#   next full sync doesn't revert this. This script does not do that for you.
#
# IMPORTANT — plan IDs are PER-ENVIRONMENT (docs/setup/ENVIRONMENTS.md):
#   staging    must use TEST-mode Plan objects
#   production must use LIVE-mode Plan objects
#   These are different objects created under different dashboard modes. Do not
#   reuse one set for both.
#
# Prerequisites:
#   - railway CLI installed and authenticated (see railway-env-sync.sh)
#   - Amounts already verified: node scripts/verify-razorpay-plan-prices.mjs <file>
#
# Safety:
#   - Never echoes plan IDs' surrounding secrets; plan IDs themselves are not secret
#   - Refuses to run if any value is a known-abandoned (100x-price) Plan ID
#   - Refuses to run if fewer than all 8 keys are present
#   - DRY_RUN=1 prints what would be set, without calling Railway

set -euo pipefail

PLAN_FILE="${1:-}"
RAILWAY_ENV="${2:-}"
DRY_RUN="${DRY_RUN:-0}"

REQUIRED_KEYS=(
  RAZORPAY_PLAN_SOLO_MONTHLY
  RAZORPAY_PLAN_SOLO_ANNUAL
  RAZORPAY_PLAN_PRO_MONTHLY
  RAZORPAY_PLAN_PRO_ANNUAL
  RAZORPAY_PLAN_TEAM_MONTHLY
  RAZORPAY_PLAN_TEAM_ANNUAL
  RAZORPAY_PLAN_AGENCY_MONTHLY
  RAZORPAY_PLAN_AGENCY_ANNUAL
)

# Plans created at 100x the intended price on 2026-08-27. Razorpay Plans cannot be
# edited or deleted, so these 8 objects live in the dashboard forever under
# correct-looking names. This list is the guard that stops a copy-paste from the
# wrong dashboard row.
ABANDONED_IDS=(
  plan_TUmNQH4lRDgWOG # BG-SOLO-MONTHLY-2026-08
  plan_TUmOMrcSdP0lWI # BG-SOLO-ANNUAL-2026-08
  plan_TUmPHqng8bmvny # BG-PRO-MONTHLY-2026-08
  plan_TUmPi2nOAo6DfH # BG-PRO-ANNUAL-2026-08
  plan_TUmQF64vtupOBR # BG-TEAM-MONTHLY-2026-08
  plan_TUmQhWOOVtJfMa # BG-TEAM-ANNUAL-2026-08
  plan_TUmRGiU4hLVokq # BG-AGENCY-MONTHLY-2026-08
  plan_TUmRjGCF2e7nJl # BG-AGENCY-ANNUAL-2026-08
)

# --- Validation ---
if [[ -z "$PLAN_FILE" || -z "$RAILWAY_ENV" ]]; then
  echo "Usage: bash scripts/set-razorpay-plan-ids.sh <plan-ids-file> <railway-environment>" >&2
  exit 1
fi

if [[ ! -f "$PLAN_FILE" ]]; then
  echo "Error: plan IDs file not found: $PLAN_FILE" >&2
  exit 1
fi

if [[ "$RAILWAY_ENV" != "staging" && "$RAILWAY_ENV" != "production" ]]; then
  echo "Error: environment must be 'staging' or 'production' (got '$RAILWAY_ENV')" >&2
  exit 1
fi

if ! command -v railway &>/dev/null; then
  echo "Error: 'railway' CLI not found. Install with: npm install -g @railway/cli" >&2
  exit 1
fi

# --- Read the file into an associative array ---
declare -A PLAN_IDS
while IFS= read -r line || [[ -n "$line" ]]; do
  [[ "$line" =~ ^[[:space:]]*# ]] && continue
  [[ -z "${line// }" ]] && continue
  if [[ "$line" =~ ^(RAZORPAY_PLAN_[A-Z_]+)=(.*)$ ]]; then
    PLAN_IDS["${BASH_REMATCH[1]}"]="${BASH_REMATCH[2]}"
  fi
done < "$PLAN_FILE"

# --- Guard: all 8 present, well-formed, and not abandoned ---
errors=0
for key in "${REQUIRED_KEYS[@]}"; do
  value="${PLAN_IDS[$key]:-}"

  if [[ -z "$value" || "$value" == plan_...* ]]; then
    echo "  MISSING  $key" >&2
    errors=$((errors + 1))
    continue
  fi

  if [[ ! "$value" =~ ^plan_[A-Za-z0-9]+$ ]]; then
    echo "  MALFORMED  $key=$value  (expected plan_...)" >&2
    errors=$((errors + 1))
    continue
  fi

  for bad in "${ABANDONED_IDS[@]}"; do
    if [[ "$value" == "$bad" ]]; then
      echo "  ABANDONED  $key=$value" >&2
      echo "             That Plan was created at 100x its intended price and can never be used." >&2
      echo "             Use the recreated Plan object's ID instead." >&2
      errors=$((errors + 1))
    fi
  done
done

if ((errors > 0)); then
  echo "" >&2
  echo "Refusing to push: $errors problem(s) found in $PLAN_FILE" >&2
  exit 1
fi

# --- Push ---
echo "Setting 8 Razorpay Plan IDs → Railway environment: $RAILWAY_ENV"
if [[ "$DRY_RUN" == "1" ]]; then
  echo "(DRY RUN — no changes will be made)"
fi
echo ""

# Build ONE command with all 8 --set flags.
#
# This must be a single invocation: Railway triggers a redeploy on every variable
# mutation, so eight separate `railway variables --set` calls queue eight stacked
# deployments of the same service. Learned the hard way on 2026-08-27.
set_args=()
for key in "${REQUIRED_KEYS[@]}"; do
  value="${PLAN_IDS[$key]}"
  set_args+=(--set "${key}=${value}")
  if [[ "$DRY_RUN" == "1" ]]; then
    echo "  [dry-run] would set: $key=$value"
  else
    echo "  queued: $key=$value"
  fi
done

if [[ "$DRY_RUN" != "1" ]]; then
  echo ""
  echo "  Applying all 8 in a single call (one deployment)..."
  railway variables "${set_args[@]}" --environment "$RAILWAY_ENV" ${RAILWAY_SERVICE:+--service "$RAILWAY_SERVICE"}
fi

echo ""
if [[ "$DRY_RUN" == "1" ]]; then
  exit 0
fi

echo "Railway redeploys automatically on a variable change — no manual redeploy needed."
echo ""
echo "Next — do not skip (ENV_SINGLE_SOURCE_OF_TRUTH.md step 4):"
echo "  1. Mirror these 8 values into secrets/${RAILWAY_ENV}.env so the next full sync agrees"
echo "  2. railway variables --environment $RAILWAY_ENV --kv | grep RAZORPAY_PLAN_"
echo "  3. node scripts/verify-razorpay-plan-prices.mjs <the same plan-ids file>"
echo "  4. railway deployment list --environment $RAILWAY_ENV   # confirm it settled"
