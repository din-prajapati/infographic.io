#!/usr/bin/env bash
# session-start-recall.sh
# AI-SDLC hook — fires when a Claude Code session starts.
# Prints a token-cheap recall digest: in-repo memory, last session, current
# branch state, active stories, latest ADR, latest session log.
# ZERO LLM cost — pure shell aggregation.
#
# Event: SessionStart
# Exit code: ignored (output is injected as session context)

set -e

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
STATUS_FILE="$PROJECT_DIR/docs/agile/TEAM_STATUS.md"
DECISIONS_DIR="$PROJECT_DIR/docs/agile/decisions"
EPICS_DIR="$PROJECT_DIR/docs/agile/epics"
MEMORY_INDEX="$PROJECT_DIR/docs/agile/memory/MEMORY.md"
SESSIONS_DIR="$PROJECT_DIR/docs/agile/sessions"

# Silently bail if not an AI-SDLC project
[ -d "$PROJECT_DIR/docs/agile" ] || exit 0

echo "─── ORION recall ───"

# In-repo memory index (replaces global ~/.claude/.../memory/ for this project)
if [ -f "$MEMORY_INDEX" ]; then
  echo ""
  echo "memory (docs/agile/memory/MEMORY.md):"
  # Print only the bullet lines so context stays cheap
  grep -E '^- \[' "$MEMORY_INDEX" 2>/dev/null | sed 's/^/  /'
  echo ""
fi

# Git state (one line)
if git -C "$PROJECT_DIR" rev-parse >/dev/null 2>&1; then
  BRANCH=$(git -C "$PROJECT_DIR" branch --show-current 2>/dev/null)
  DIRTY=$(git -C "$PROJECT_DIR" status --porcelain 2>/dev/null | wc -l | tr -d ' ')
  LAST=$(git -C "$PROJECT_DIR" log -1 --format='%h %s (%cr)' 2>/dev/null || echo "")
  echo "branch: $BRANCH  ·  dirty: $DIRTY file(s)  ·  last: $LAST"
fi

# Last session-log entry (one line)
if [ -f "$STATUS_FILE" ]; then
  LAST_SESSION=$(grep -B0 -A1 '<!-- ai-sdlc:session-log -->' "$STATUS_FILE" 2>/dev/null | tail -2 | head -1)
  [ -n "$LAST_SESSION" ] && echo "last session: ${LAST_SESSION#**}"
fi

# Tomorrow's plan block, if present (compact)
if [ -f "$STATUS_FILE" ] && grep -q '<!-- ai-sdlc:tomorrow -->' "$STATUS_FILE" 2>/dev/null; then
  echo ""
  echo "planned for today:"
  awk '/<!-- ai-sdlc:tomorrow -->/{f=1;next} /<!-- ai-sdlc:/{f=0} f' "$STATUS_FILE" | head -8
fi

# In-progress stories (count + IDs)
if [ -d "$EPICS_DIR" ]; then
  IN_PROGRESS=$(grep -rlE '^\> \*\*Status:\*\*.*(🟡|In Progress)' "$EPICS_DIR" --include='STORY.md' 2>/dev/null | \
    xargs -I{} dirname {} 2>/dev/null | xargs -I{} basename {} 2>/dev/null | sort -u | tr '\n' ' ')
  [ -n "$IN_PROGRESS" ] && echo "in-progress: $IN_PROGRESS"
fi

# Latest ADR (one line)
if [ -d "$DECISIONS_DIR" ]; then
  LATEST_ADR=$(ls -1 "$DECISIONS_DIR" 2>/dev/null | grep -E '^ADR-[0-9]+' | sort | tail -1)
  [ -n "$LATEST_ADR" ] && echo "latest decision: $LATEST_ADR"
fi

# Latest session log (file name only — open it for full narrative)
if [ -d "$SESSIONS_DIR" ]; then
  LATEST_SESSION_FILE=$(ls -1 "$SESSIONS_DIR" 2>/dev/null | grep -E '^S[0-9]+' | sort | tail -1)
  [ -n "$LATEST_SESSION_FILE" ] && echo "latest session log: docs/agile/sessions/$LATEST_SESSION_FILE"
fi

echo "─── run /standup for full state ───"
exit 0
