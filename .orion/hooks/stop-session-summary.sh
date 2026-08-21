#!/usr/bin/env bash
# stop-session-summary.sh
# AI-SDLC hook — fires on the Stop event.
#
# Records a one-line marker of repo state, to a GITIGNORED log, and only when
# that state has actually changed since the previous turn.
#
# WHY THIS LOOKS DIFFERENT FROM A NAIVE "append a summary" HOOK:
# An earlier version of this hook appended four lines to docs/agile/TEAM_STATUS.md
# on every Stop. Stop fires once per assistant turn, NOT once per session, so a
# single working session produced dozens of near-identical entries — including
# "(no commits this session)" stubs carrying no information at all. Observed in
# production on a consumer project: 490 stub entries, ~1,992 of TEAM_STATUS.md's
# 2,499 lines — 80% of a file that is supposed to be the team's shared narrative —
# plus a permanently dirty working tree on a TRACKED doc, which blocked
# `git checkout` and caused rebase conflicts on real PRs more than once.
#
# Three changes fix it:
#   1. Write to .orion/state/ (gitignored by `orion init`'s appendGitignore()) —
#      not a tracked document
#   2. Deduplicate on branch + HEAD, so unchanged turns write nothing
#   3. Never record "no commits" — absence of change is not an event
#
# Note: the closure entries in TEAM_STATUS.md ("PR #N merged · closed: US-X")
# come from cascade-close-story.sh, NOT from here. Those are meaningful and are
# deliberately left where they are.
#
# Event: Stop
# Exit code: ignored

set -e

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
LOG_DIR="$PROJECT_DIR/.orion/state"
LOG_FILE="$LOG_DIR/session-log.md"
SIG_FILE="$LOG_DIR/.session-log-sig"
MAX_LINES=200

# Not a git repo — nothing to record.
git -C "$PROJECT_DIR" rev-parse --git-dir >/dev/null 2>&1 || exit 0

LAST_COMMIT=$(git -C "$PROJECT_DIR" log --oneline -n 1 2>/dev/null || echo "")

# No commits yet: there is no state worth a log line. The old hook wrote
# "(no commits this session)" here, which is the purest form of the noise.
[ -n "$LAST_COMMIT" ] || exit 0

BRANCH=$(git -C "$PROJECT_DIR" branch --show-current 2>/dev/null)
# `branch --show-current` exits 0 with EMPTY output on a detached HEAD (not a
# non-zero exit) -- `||` alone never catches that. Explicit empty check instead.
BRANCH="${BRANCH:-detached}"
SIG="$BRANCH|$LAST_COMMIT"

# Unchanged since the previous turn → stay silent. This is what collapses a
# session's worth of per-turn writes into one line per actual commit.
if [ -f "$SIG_FILE" ] && [ "$(cat "$SIG_FILE" 2>/dev/null)" = "$SIG" ]; then
  exit 0
fi

mkdir -p "$LOG_DIR"
printf '%s' "$SIG" > "$SIG_FILE"
printf '%s · `%s` · %s\n' "$(date '+%Y-%m-%d %H:%M')" "$BRANCH" "$LAST_COMMIT" >> "$LOG_FILE"

# Keep the log bounded so it cannot become the thing it replaced.
LINES=$(wc -l < "$LOG_FILE" 2>/dev/null || echo 0)
if [ "$LINES" -gt "$MAX_LINES" ]; then
  tail -n "$MAX_LINES" "$LOG_FILE" > "$LOG_FILE.tmp" 2>/dev/null && mv "$LOG_FILE.tmp" "$LOG_FILE"
fi

exit 0
