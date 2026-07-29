#!/usr/bin/env bash
# =============================================================================
# trace-css-cascade.sh — runtime-first-implementation skill
# =============================================================================
# Audits the CSS cascade to identify :root blocks and @import chains.
# Run this before editing ANY CSS token or variable file.
# Identifies which :root block wins in load order (last one overrides all).
#
# Usage:
#   bash skills/runtime-first-implementation/scripts/trace-css-cascade.sh
# =============================================================================

set -euo pipefail

echo ""
echo "============================================"
echo "  CSS CASCADE AUDIT"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================"

# ── 1. All :root blocks ───────────────────────────────────────────────────────
echo ""
echo "[1] All :root {} blocks in client/src"
echo "    (the LAST one in load order wins — earlier ones are overridden)"
echo "--------------------------------------------"
ROOT_RESULTS=$(grep -rn ":root" client/src --include="*.css" 2>/dev/null \
  | grep -v "node_modules" \
  | grep -v "//.*:root" \
  || true)

if [ -z "$ROOT_RESULTS" ]; then
  echo "  (none found)"
else
  echo "$ROOT_RESULTS"
  ROOT_COUNT=$(echo "$ROOT_RESULTS" | wc -l)
  echo ""
  if [ "$ROOT_COUNT" -gt 2 ]; then
    echo "  ⚠  WARNING: $ROOT_COUNT :root occurrences found."
    echo "     Multiple :root blocks create override risk."
    echo "     Verify the one YOU edit is not overridden by a later one."
  else
    echo "  ✓  $ROOT_COUNT :root occurrence(s) — low override risk."
  fi
fi

# ── 2. @import chains in index.css ───────────────────────────────────────────
echo ""
echo "[2] @import chains in client/src/index.css"
echo "    (files are loaded in @import order — later files can override earlier)"
echo "--------------------------------------------"
if [ -f "client/src/index.css" ]; then
  IMPORT_RESULTS=$(grep -n "@import" client/src/index.css || true)
  if [ -z "$IMPORT_RESULTS" ]; then
    echo "  (no @imports in index.css)"
  else
    echo "$IMPORT_RESULTS"
  fi
else
  echo "  ⚠  client/src/index.css not found — check Vite entry point"
fi

# ── 3. globals.css references ────────────────────────────────────────────────
echo ""
echo "[3] Files referencing globals.css"
echo "--------------------------------------------"
GLOBALS_RESULTS=$(grep -rn "globals" client/src \
  --include="*.css" --include="*.ts" --include="*.tsx" 2>/dev/null \
  | grep -v "node_modules" \
  || true)

if [ -z "$GLOBALS_RESULTS" ]; then
  echo "  ⚠  globals.css is NOT referenced anywhere — tokens will not load"
else
  echo "$GLOBALS_RESULTS"
fi

# ── 4. design-tokens.css references ──────────────────────────────────────────
echo ""
echo "[4] Files referencing design-tokens.css"
echo "--------------------------------------------"
TOKEN_RESULTS=$(grep -rn "design-tokens\|design_tokens" client/src \
  --include="*.css" --include="*.ts" --include="*.tsx" 2>/dev/null \
  | grep -v "node_modules" \
  || true)

if [ -z "$TOKEN_RESULTS" ]; then
  echo "  (design-tokens.css not imported — it is a reference file only)"
else
  echo "$TOKEN_RESULTS"
fi

# ── 5. Entry point CSS imports ───────────────────────────────────────────────
echo ""
echo "[5] CSS imports in Vite entry point (main.tsx / main.ts)"
echo "--------------------------------------------"
MAIN=$(find client/src -maxdepth 2 -name "main.tsx" -o -name "main.ts" 2>/dev/null | head -1)
if [ -n "$MAIN" ]; then
  echo "  Entry: $MAIN"
  MAIN_CSS=$(grep "import.*\.css" "$MAIN" || true)
  if [ -z "$MAIN_CSS" ]; then
    echo "  (no direct CSS imports in main — CSS likely imported in App.tsx)"
    APP=$(find client/src -maxdepth 2 -name "App.tsx" -o -name "App.ts" 2>/dev/null | head -1)
    if [ -n "$APP" ]; then
      echo "  Checking App.tsx: $APP"
      grep "import.*\.css" "$APP" || echo "  (no CSS imports in App.tsx either)"
    fi
  else
    echo "$MAIN_CSS"
  fi
else
  echo "  ⚠  main.tsx/ts not found in client/src"
fi

# ── 6. Summary ────────────────────────────────────────────────────────────────
echo ""
echo "============================================"
echo "  ACTION CHECKLIST"
echo "============================================"
echo ""
echo "  Before editing any CSS token file, confirm:"
echo "  [ ] Your target file appears in sections [2] or [3] above"
echo "  [ ] No later :root block (section [1]) overrides your tokens"
echo "  [ ] index.css does NOT have its own :root block with defaults"
echo "      (shadcn/Tailwind init may have injected one — check manually)"
echo ""
echo "  If your file is NOT in the import chain:"
echo "  → Add @import './your-file.css' to index.css FIRST"
echo "  → Then implement your token changes"
echo ""
