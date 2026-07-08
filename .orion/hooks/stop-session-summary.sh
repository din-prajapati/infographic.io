#!/usr/bin/env bash
# stop-session-summary.sh
# AI-SDLC hook — fires when Claude ends its turn (Stop event).
# Appends a 3-line summary of the session to TEAM_STATUS.md.
#
# Event: Stop
# Exit code: ignored

set -e

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
STATUS_FILE="$PROJECT_DIR/docs/agile/TEAM_STATUS.md"

# If TEAM_STATUS.md doesn't exist, do nothing silently
if [ ! -f "$STATUS_FILE" ]; then
  exit 0
fi

# Get the last commit (if any in the last hour) — best-effort
LAST_COMMIT=""
if git -C "$PROJECT_DIR" rev-parse >/dev/null 2>&1; then
  LAST_COMMIT=$(git -C "$PROJECT_DIR" log --since="1 hour ago" --oneline -n 1 2>/dev/null || echo "")
fi

# Get the current branch
BRANCH=$(git -C "$PROJECT_DIR" branch --show-current 2>/dev/null || echo "unknown")

# Get the timestamp
TIMESTAMP=$(date '+%Y-%m-%d %H:%M')

# Append the entry (under a "Session Log" section if it exists, else at the end)
cat >> "$STATUS_FILE" <<EOF

<!-- ai-sdlc:session-log -->
**$TIMESTAMP** · branch: \`$BRANCH\`
  - Last commit: ${LAST_COMMIT:-"(no commits this session)"}
EOF

# Silent success
exit 0
