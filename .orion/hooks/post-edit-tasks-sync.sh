#!/usr/bin/env bash
# post-edit-tasks-sync.sh
# AI-SDLC hook — fires after editing any TASKS.md.
# Counts task checkboxes and updates PHASE_TRACKER.md (or just prints status).
#
# Event: PostToolUse on Edit/Write matching **/TASKS.md
# Exit code: ignored (PostToolUse hooks cannot block)

set -e

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"

# Get the file path from the hook context (Claude Code provides it via env var)
TASKS_FILE="${CLAUDE_TOOL_FILE_PATH:-}"

if [ -z "$TASKS_FILE" ] || [ ! -f "$TASKS_FILE" ]; then
  # Silent — nothing to do
  exit 0
fi

# Extract Story ID from the path (looks for US-{DOMAIN}-{NNN})
STORY_ID=$(echo "$TASKS_FILE" | grep -oE 'US-[A-Z]+-[0-9]+' | head -1)

if [ -z "$STORY_ID" ]; then
  exit 0
fi

# Count checkboxes
total=$(grep -cE '^- \[[ x]\]' "$TASKS_FILE" 2>/dev/null || echo 0)
done=$(grep -cE '^- \[x\]' "$TASKS_FILE" 2>/dev/null || echo 0)

# Print a concise status line
echo "[tasks-sync] $STORY_ID: $done/$total tasks checked" >&2

# If all tasks done, hint at next step
if [ "$total" -gt 0 ] && [ "$done" = "$total" ]; then
  echo "[tasks-sync] All tasks complete for $STORY_ID. Consider:" >&2
  echo "[tasks-sync]   /verification-gates  — confirm gates pass" >&2
  echo "[tasks-sync]   /agile-pr $STORY_ID  — open PR" >&2
fi

exit 0
