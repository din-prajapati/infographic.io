#!/usr/bin/env bash
# =============================================================================
# find-hardcoded-colors.sh — enumerate-and-confirm-scope skill
# =============================================================================
# Finds all hardcoded color values in source files that should be replaced
# with semantic design tokens. Use this before any token migration story
# (US-DESIGN-007, US-DESIGN-008, US-DESIGN-009, US-DESIGN-010, US-DESIGN-011).
#
# Usage:
#   bash skills/enumerate-and-confirm-scope/scripts/find-hardcoded-colors.sh [path]
#
# Examples:
#   bash skills/enumerate-and-confirm-scope/scripts/find-hardcoded-colors.sh
#   bash skills/enumerate-and-confirm-scope/scripts/find-hardcoded-colors.sh client/src/pages
#   bash skills/enumerate-and-confirm-scope/scripts/find-hardcoded-colors.sh client/src/components/editor
# =============================================================================

set -euo pipefail

SEARCH_PATH="${1:-client/src}"

echo ""
echo "============================================"
echo "  HARDCODED COLOR AUDIT"
echo "  Path: $SEARCH_PATH"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================"

TOTAL=0

# ── 1. Hex color codes ────────────────────────────────────────────────────────
echo ""
echo "[1] Hex color codes  (#RGB or #RRGGBB)"
echo "    Replace with: hsl(var(--primary)), var(--glass-tint), etc."
echo "--------------------------------------------"
HEX=$(grep -rn \
  --include="*.tsx" --include="*.ts" --include="*.css" \
  -E '#[0-9A-Fa-f]{3,6}\b' \
  "$SEARCH_PATH" 2>/dev/null \
  | grep -v "node_modules" \
  | grep -v "^\s*//" \
  | grep -v "//.*#[0-9A-Fa-f]" \
  | grep -v "\.d\.ts:" \
  || true)

if [ -z "$HEX" ]; then echo "  (none found)"; else
  echo "$HEX"
  COUNT=$(echo "$HEX" | wc -l)
  TOTAL=$((TOTAL + COUNT))
  echo "  → $COUNT match(es)"
fi

# ── 2. Inline rgba() / rgb() ─────────────────────────────────────────────────
echo ""
echo "[2] Inline rgba() / rgb() values"
echo "    Replace with: var(--glass-tint), hsl(var(--primary) / 0.3), etc."
echo "--------------------------------------------"
RGBA=$(grep -rn \
  --include="*.tsx" --include="*.ts" --include="*.css" \
  -E 'rgba?\s*\([0-9, .%]+\)' \
  "$SEARCH_PATH" 2>/dev/null \
  | grep -v "node_modules" \
  | grep -v "var(--" \
  | grep -v "//.*rgba\?" \
  | grep -v "\.d\.ts:" \
  || true)

if [ -z "$RGBA" ]; then echo "  (none found)"; else
  echo "$RGBA"
  COUNT=$(echo "$RGBA" | wc -l)
  TOTAL=$((TOTAL + COUNT))
  echo "  → $COUNT match(es)"
fi

# ── 3. Tailwind hardcoded palette classes ─────────────────────────────────────
echo ""
echo "[3] Tailwind hardcoded palette classes (teal, violet, purple, gray)"
echo "    Replace with: bg-primary, text-muted-foreground, border-border, etc."
echo "--------------------------------------------"
TW=$(grep -rn \
  --include="*.tsx" --include="*.ts" \
  -E 'bg-(teal|violet|purple|gray|slate|zinc|neutral|stone|red|orange|yellow|green|cyan|sky|indigo|blue|pink|rose)-[0-9]+|text-(teal|violet|purple|gray|slate|zinc|neutral|stone)-[0-9]+|border-(teal|violet|purple|gray|slate)-[0-9]+' \
  "$SEARCH_PATH" 2>/dev/null \
  | grep -v "node_modules" \
  | grep -v "//.*bg-" \
  | grep -v "\.d\.ts:" \
  || true)

if [ -z "$TW" ]; then echo "  (none found)"; else
  echo "$TW"
  COUNT=$(echo "$TW" | wc -l)
  TOTAL=$((TOTAL + COUNT))
  echo "  → $COUNT match(es)"
fi

# ── 4. Inline style color properties ─────────────────────────────────────────
echo ""
echo "[4] Inline style={{ color/backgroundColor/borderColor }}"
echo "    Replace with: className using semantic tokens where possible"
echo "--------------------------------------------"
STYLE=$(grep -rn \
  --include="*.tsx" --include="*.ts" \
  -E 'style=\{.*?(color|backgroundColor|borderColor|fill|stroke).*?\}' \
  "$SEARCH_PATH" 2>/dev/null \
  | grep -v "node_modules" \
  | grep -v "var(--" \
  | grep -v "//.*style=" \
  | grep -v "\.d\.ts:" \
  || true)

if [ -z "$STYLE" ]; then echo "  (none found)"; else
  echo "$STYLE"
  COUNT=$(echo "$STYLE" | wc -l)
  TOTAL=$((TOTAL + COUNT))
  echo "  → $COUNT match(es)"
fi

# ── 5. boxShadow with hardcoded colors ───────────────────────────────────────
echo ""
echo "[5] boxShadow / box-shadow with hardcoded color values"
echo "    Replace with: var(--glass-shadow), shadow-* Tailwind utilities"
echo "--------------------------------------------"
SHADOW=$(grep -rn \
  --include="*.tsx" --include="*.ts" --include="*.css" \
  -E 'boxShadow.*rgba?\(|box-shadow.*rgba?\(' \
  "$SEARCH_PATH" 2>/dev/null \
  | grep -v "node_modules" \
  | grep -v "var(--" \
  | grep -v "\.d\.ts:" \
  || true)

if [ -z "$SHADOW" ]; then echo "  (none found)"; else
  echo "$SHADOW"
  COUNT=$(echo "$SHADOW" | wc -l)
  TOTAL=$((TOTAL + COUNT))
  echo "  → $COUNT match(es)"
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "============================================"
echo "  TOTAL HARDCODED COLOR INSTANCES: $TOTAL"
echo "============================================"
echo ""
echo "  Semantic token reference:"
echo "  --primary              → blue  hsl(207 90% 49%)"
echo "  --secondary            → amber hsl(38 93% 66%)"
echo "  --background           → warm cream / warm dark"
echo "  --muted-foreground     → subdued text"
echo "  --border               → dividers, input borders"
echo "  --glass-tint           → rgba(12,160,235,...)"
echo "  --glass-shadow         → elevation shadows"
echo ""
echo "  NEXT STEP (enumerate-and-confirm-scope skill):"
echo "  Classify each instance: Fix | Skip | Review"
echo "  Present to user before implementing."
echo ""
