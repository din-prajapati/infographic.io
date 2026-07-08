#!/usr/bin/env bash
# compact-session-log.sh
# Aggregates the last 7 days of <!-- ai-sdlc:session-log --> entries in
# TEAM_STATUS.md into a single weekly digest archived under
# docs/agile/history/YYYY-WW.md, then prunes them from TEAM_STATUS.md.
#
# ZERO LLM cost — counts/lists via shell. Run weekly (manual or cron).
#
# Usage:
#   bash .claude/hooks/compact-session-log.sh           # archive entries older than 7 days
#   bash .claude/hooks/compact-session-log.sh --all     # archive everything
#   bash .claude/hooks/compact-session-log.sh --dry-run # show what would happen

set -e

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
STATUS_FILE="$PROJECT_DIR/docs/agile/TEAM_STATUS.md"
HISTORY_DIR="$PROJECT_DIR/docs/agile/history"

[ -f "$STATUS_FILE" ] || { echo "no TEAM_STATUS.md — nothing to compact" >&2; exit 0; }
mkdir -p "$HISTORY_DIR"

MODE="weekly"
case "${1:-}" in
  --all)     MODE="all" ;;
  --dry-run) MODE="dry" ;;
esac

# Cutoff: today minus 7 days (BSD/GNU compatible)
if date -d "7 days ago" '+%Y-%m-%d' >/dev/null 2>&1; then
  CUTOFF=$(date -d "7 days ago" '+%Y-%m-%d')        # GNU
else
  CUTOFF=$(date -v-7d '+%Y-%m-%d')                  # BSD
fi
[ "$MODE" = "all" ] && CUTOFF="9999-12-31"

# Year-week tag for the archive filename
if date '+%G-W%V' >/dev/null 2>&1; then
  WEEK_TAG=$(date '+%G-W%V')
else
  WEEK_TAG=$(date '+%Y-W%U')
fi
ARCHIVE_FILE="$HISTORY_DIR/${WEEK_TAG}.md"

# Extract sessions: each entry is exactly 2 consecutive lines:
#   <!-- ai-sdlc:session-log -->
#   **YYYY-MM-DD HH:MM** ...
# Pair them and split by cutoff date.
TMP_KEEP=$(mktemp)
TMP_ARCHIVE=$(mktemp)
trap "rm -f $TMP_KEEP $TMP_ARCHIVE" EXIT

awk -v cutoff="$CUTOFF" -v keep="$TMP_KEEP" -v archive="$TMP_ARCHIVE" '
  BEGIN { hold = "" }
  /<!-- ai-sdlc:session-log -->/ {
    if (hold != "") print hold >> keep
    hold = $0
    getline next_line
    hold = hold "\n" next_line
    # Extract date from line like "**2026-05-20 14:30** ..."
    if (match(next_line, /\*\*([0-9]{4}-[0-9]{2}-[0-9]{2})/, m)) {
      if (m[1] < cutoff) { print hold >> archive; hold = "" }
    }
    next
  }
  {
    if (hold != "") { print hold >> keep; hold = "" }
    print >> keep
  }
  END { if (hold != "") print hold >> keep }
' "$STATUS_FILE"

if [ ! -s "$TMP_ARCHIVE" ]; then
  echo "Nothing to archive (cutoff: $CUTOFF)" >&2
  exit 0
fi

# Build digest counts
COMMIT_COUNT=$(grep -cE 'commit:' "$TMP_ARCHIVE" 2>/dev/null || echo 0)
BRANCH_COUNT=$(grep -oE 'branch: `[^`]+`' "$TMP_ARCHIVE" 2>/dev/null | sort -u | wc -l | tr -d ' ')
STORY_IDS=$(grep -oE 'US-[A-Z]+-[0-9]+' "$TMP_ARCHIVE" 2>/dev/null | sort -u | tr '\n' ' ')
PR_NUMS=$(grep -oE 'PR #[0-9]+' "$TMP_ARCHIVE" 2>/dev/null | sort -u | tr '\n' ' ')
SESSION_COUNT=$(grep -c '<!-- ai-sdlc:session-log -->' "$TMP_ARCHIVE" || echo 0)

if [ "$MODE" = "dry" ]; then
  echo "── dry run ──"
  echo "Would archive: $SESSION_COUNT sessions older than $CUTOFF"
  echo "  → $ARCHIVE_FILE"
  echo "Stats: $COMMIT_COUNT commits · $BRANCH_COUNT branches · stories: $STORY_IDS · PRs: $PR_NUMS"
  exit 0
fi

# Write digest archive
{
  echo "# Session History — Week $WEEK_TAG"
  echo ""
  echo "> Aggregated by compact-session-log.sh — no LLM, pure shell counts."
  echo ""
  echo "## Summary"
  echo ""
  echo "- Sessions: **$SESSION_COUNT**"
  echo "- Commits referenced: **$COMMIT_COUNT**"
  echo "- Branches touched: **$BRANCH_COUNT**"
  echo "- Stories: ${STORY_IDS:-none}"
  echo "- PRs: ${PR_NUMS:-none}"
  echo ""
  echo "## Raw Entries"
  echo ""
  cat "$TMP_ARCHIVE"
} > "$ARCHIVE_FILE"

# Replace TEAM_STATUS.md with the kept portion
cp "$TMP_KEEP" "$STATUS_FILE"

echo "✓ Archived $SESSION_COUNT sessions → $ARCHIVE_FILE"
echo "  TEAM_STATUS.md trimmed."
exit 0
