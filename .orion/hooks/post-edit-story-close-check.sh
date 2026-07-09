#!/usr/bin/env bash
# post-edit-story-close-check.sh
# AI-SDLC hook — fires after editing any STORY.md.
# If STORY.md status flipped to ✅ Done, suggests running /close-story.
#
# Event: PostToolUse on Edit/Write matching **/STORY.md
# Exit code: ignored

set -e

FILE_PATH="${CLAUDE_TOOL_FILE_PATH:-}"

if [ -z "$FILE_PATH" ] || [ ! -f "$FILE_PATH" ]; then
  exit 0
fi

# Check if status line shows ✅ Done
if grep -qE '^\> \*\*Status:\*\* ✅ Done' "$FILE_PATH" || grep -qE '^\> \*\*Status:\*\*.*✅' "$FILE_PATH"; then
  # Extract story ID from path
  STORY_ID=$(echo "$FILE_PATH" | grep -oE 'US-[A-Z]+-[0-9]+' | head -1)

  if [ -n "$STORY_ID" ]; then
    cat >&2 <<EOF

✅ STORY MARKED DONE: $STORY_ID

To cascade status updates to parent milestone, epic, and trackers, run:

  /close-story $STORY_ID <PR-number>

This will:
  - Verify Definition of Done
  - Update parent MILESTONE.md
  - Update parent EPIC.md (and mark complete if all stories done)
  - Update PHASE_TRACKER.md and AGILE_INDEX.md

EOF
  fi
fi

exit 0
