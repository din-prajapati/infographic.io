#!/usr/bin/env bash
# =============================================================================
# pre-commit-gate.sh — verification-gates skill — Gate 1
# =============================================================================
# Runs TypeScript check and unit tests before any commit.
# Exit code 0 = all gates pass (safe to commit).
# Exit code 1 = one or more gates failed (do NOT commit).
#
# Usage:
#   bash skills/verification-gates/scripts/pre-commit-gate.sh
#
# Add to git pre-commit hook (optional):
#   echo "bash skills/verification-gates/scripts/pre-commit-gate.sh" >> .git/hooks/pre-commit
#   chmod +x .git/hooks/pre-commit
# =============================================================================

set -euo pipefail

# ── State tracking ────────────────────────────────────────────────────────────
PASS=0
FAIL=0
declare -a ERRORS=()
declare -a PASSED=()
START_TIME=$(date +%s)

# ── Helpers ───────────────────────────────────────────────────────────────────
print_header() {
  echo ""
  echo "╔══════════════════════════════════════════╗"
  echo "║   VERIFICATION GATE 1 — Pre-commit       ║"
  echo "║   $(date '+%Y-%m-%d %H:%M:%S')              ║"
  echo "╚══════════════════════════════════════════╝"
}

run_gate() {
  local label="$1"
  local cmd="$2"
  echo ""
  echo "┌─ $label"
  echo "│  $ $cmd"
  echo "│"
  if eval "$cmd" 2>&1 | sed 's/^/│  /'; then
    echo "│"
    echo "└─ ✓ PASS"
    PASS=$((PASS + 1))
    PASSED+=("$label")
    return 0
  else
    echo "│"
    echo "└─ ✗ FAIL"
    FAIL=$((FAIL + 1))
    ERRORS+=("$label")
    return 1
  fi
}

print_summary() {
  local END_TIME=$(date +%s)
  local ELAPSED=$((END_TIME - START_TIME))
  echo ""
  echo "╔══════════════════════════════════════════╗"
  echo "║   GATE 1 RESULTS                         ║"
  printf  "║   %-42s ║\n" "Passed: $PASS  |  Failed: $FAIL  |  Time: ${ELAPSED}s"
  echo "╚══════════════════════════════════════════╝"

  if [ "${#PASSED[@]}" -gt 0 ]; then
    echo ""
    for p in "${PASSED[@]}"; do
      echo "  ✓ $p"
    done
  fi

  if [ $FAIL -gt 0 ]; then
    echo ""
    for e in "${ERRORS[@]}"; do
      echo "  ✗ $e"
    done
    echo ""
    echo "  ╔══════════════════════════════════════════╗"
    echo "  ║  GATE 1 FAILED — DO NOT COMMIT           ║"
    echo "  ║  Fix all errors above, then re-run.      ║"
    echo "  ╚══════════════════════════════════════════╝"
    echo ""
    exit 1
  else
    echo ""
    echo "  ╔══════════════════════════════════════════╗"
    echo "  ║  GATE 1 PASSED — safe to commit          ║"
    echo "  ║  Run Gate 2 (visual) if you changed UI.  ║"
    echo "  ║  Run Gate 3 (E2E) if you changed CSS.    ║"
    echo "  ╚══════════════════════════════════════════╝"
    echo ""
    exit 0
  fi
}

# ── Gates ─────────────────────────────────────────────────────────────────────
print_header

run_gate "TypeScript — npm run check" "npm run check" || true
run_gate "Unit Tests — npm run test:unit" "npm run test:unit" || true

print_summary
