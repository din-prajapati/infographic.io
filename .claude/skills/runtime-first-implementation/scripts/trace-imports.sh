#!/usr/bin/env bash
# =============================================================================
# trace-imports.sh — runtime-first-implementation skill
# =============================================================================
# Finds all source files that import a given file or module name.
# Run this BEFORE implementing any spec change that touches a shared file.
#
# Usage:
#   bash skills/runtime-first-implementation/scripts/trace-imports.sh <target>
#
# Examples:
#   bash skills/runtime-first-implementation/scripts/trace-imports.sh globals.css
#   bash skills/runtime-first-implementation/scripts/trace-imports.sh index.css
#   bash skills/runtime-first-implementation/scripts/trace-imports.sh PaymentsService
#   bash skills/runtime-first-implementation/scripts/trace-imports.sh design-tokens
# =============================================================================

set -euo pipefail

TARGET="${1:?Usage: trace-imports.sh <filename-or-module-name>}"
BASENAME=$(basename "$TARGET" | sed 's/\.[^.]*$//')

echo ""
echo "============================================"
echo "  IMPORT TRACE: $TARGET"
echo "  Basename matched: $BASENAME"
echo "============================================"

# ── TypeScript / TSX imports ──────────────────────────────────────────────────
echo ""
echo "[1] TypeScript / TSX — from '...${BASENAME}...'"
echo "--------------------------------------------"
TS_RESULTS=$(grep -rn \
  --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
  "from ['\"].*${BASENAME}" \
  client/src api/src server/ 2>/dev/null \
  | grep -v "node_modules" \
  | grep -v "\.d\.ts:" \
  || true)

if [ -z "$TS_RESULTS" ]; then
  echo "  (none found)"
else
  echo "$TS_RESULTS"
fi

# ── CSS @imports ──────────────────────────────────────────────────────────────
echo ""
echo "[2] CSS — @import '...${BASENAME}...'"
echo "--------------------------------------------"
CSS_RESULTS=$(grep -rn \
  --include="*.css" \
  "@import.*${BASENAME}" \
  client/src 2>/dev/null \
  | grep -v "node_modules" \
  || true)

if [ -z "$CSS_RESULTS" ]; then
  echo "  (none found)"
else
  echo "$CSS_RESULTS"
fi

# ── HTML / index references ───────────────────────────────────────────────────
echo ""
echo "[3] HTML — script/link referencing '${BASENAME}'"
echo "--------------------------------------------"
HTML_RESULTS=$(grep -rn \
  --include="*.html" \
  "${BASENAME}" \
  . 2>/dev/null \
  | grep -v "node_modules" \
  || true)

if [ -z "$HTML_RESULTS" ]; then
  echo "  (none found)"
else
  echo "$HTML_RESULTS"
fi

# ── NestJS module imports ─────────────────────────────────────────────────────
echo ""
echo "[4] NestJS — imports: [...${BASENAME}...]"
echo "--------------------------------------------"
NEST_RESULTS=$(grep -rn \
  --include="*.module.ts" \
  "${BASENAME}" \
  api/src 2>/dev/null \
  | grep -v "node_modules" \
  || true)

if [ -z "$NEST_RESULTS" ]; then
  echo "  (none found)"
else
  echo "$NEST_RESULTS"
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "============================================"
echo "  INTERPRETATION"
echo "============================================"

TOTAL=0
[ -n "$TS_RESULTS" ] && TOTAL=$((TOTAL + $(echo "$TS_RESULTS" | wc -l)))
[ -n "$CSS_RESULTS" ] && TOTAL=$((TOTAL + $(echo "$CSS_RESULTS" | wc -l)))

if [ "$TOTAL" -eq 0 ]; then
  echo ""
  echo "  ⚠  WARNING: '$TARGET' is NOT imported by anything."
  echo "     Editing this file will have NO EFFECT on the runtime."
  echo "     Fix: add an import in index.css / main.tsx / AppModule before implementing."
else
  echo ""
  echo "  ✓  '$TARGET' is imported in $TOTAL location(s)."
  echo "     Check if any later file overrides its :root block or provider."
  echo "     Run trace-css-cascade.sh for CSS override analysis."
fi
echo ""
