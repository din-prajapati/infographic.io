#!/usr/bin/env bash
# =============================================================================
# find-pattern.sh — enumerate-and-confirm-scope skill
# =============================================================================
# Finds all instances of a pattern across source files with file:line output,
# grouped by file, with a total count. Use this to enumerate scope before
# implementing any broad instruction.
#
# Usage:
#   bash skills/enumerate-and-confirm-scope/scripts/find-pattern.sh \
#     <pattern> [file-glob] [search-path]
#
# Examples:
#   bash skills/enumerate-and-confirm-scope/scripts/find-pattern.sh "hover:" "*.tsx" "client/src"
#   bash skills/enumerate-and-confirm-scope/scripts/find-pattern.sh "bg-teal" "*.tsx" "client/src"
#   bash skills/enumerate-and-confirm-scope/scripts/find-pattern.sh "@Get\|@Post" "*.ts" "api/src"
#   bash skills/enumerate-and-confirm-scope/scripts/find-pattern.sh "NumberStepper" "*.tsx" "client/src"
# =============================================================================

set -euo pipefail

PATTERN="${1:?Usage: find-pattern.sh <pattern> [glob] [path]}"
GLOB="${2:-*.tsx}"
SEARCH_PATH="${3:-client/src}"

echo ""
echo "============================================"
echo "  PATTERN SEARCH"
echo "  Pattern : $PATTERN"
echo "  Files   : $GLOB"
echo "  In      : $SEARCH_PATH"
echo "============================================"

# ── Raw matches ───────────────────────────────────────────────────────────────
RESULTS=$(grep -rn "$PATTERN" "$SEARCH_PATH" \
  --include="$GLOB" 2>/dev/null \
  | grep -v "node_modules" \
  | grep -v "\.d\.ts:" \
  || true)

if [ -z "$RESULTS" ]; then
  echo ""
  echo "  (no matches found)"
  echo ""
  exit 0
fi

# ── Matches by file ───────────────────────────────────────────────────────────
echo ""
echo "--- Matches ---"
echo "$RESULTS"

# ── File summary ──────────────────────────────────────────────────────────────
echo ""
echo "--- Files affected ---"
FILES=$(echo "$RESULTS" | cut -d: -f1 | sort -u)
FILE_COUNT=$(echo "$FILES" | wc -l)
echo "$FILES"

# ── Counts ────────────────────────────────────────────────────────────────────
MATCH_COUNT=$(echo "$RESULTS" | wc -l)

echo ""
echo "============================================"
echo "  SUMMARY"
echo "  Total matches : $MATCH_COUNT"
echo "  Files affected: $FILE_COUNT"
echo "============================================"
echo ""
echo "  NEXT STEP (enumerate-and-confirm-scope skill):"
echo "  Classify each match as: Fix | Skip | Review"
echo "  Present the table to the user and get confirmation"
echo "  before implementing any changes."
echo ""
