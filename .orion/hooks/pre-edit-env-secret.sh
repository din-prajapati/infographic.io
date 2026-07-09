#!/usr/bin/env bash
# pre-edit-env-secret.sh
# AI-SDLC hook — fires before editing .env files.
# Blocks edits that look like real secrets being committed to a tracked .env file.
#
# Event: PreToolUse on Edit/Write matching **/.env*
# Exit code: 0 = allow, non-zero = block

set -e

FILE_PATH="${CLAUDE_TOOL_FILE_PATH:-}"

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Allow .env.example always — that's the documented schema
if [[ "$FILE_PATH" == *.env.example ]] || [[ "$FILE_PATH" == *.env.sample ]]; then
  exit 0
fi

# Allow .env.test (typically gitignored, used for test runs)
if [[ "$FILE_PATH" == *.env.test ]]; then
  exit 0
fi

# Check if file is gitignored — if so, allow (it's a local dev file)
if git -C "$(dirname "$FILE_PATH")" check-ignore "$FILE_PATH" >/dev/null 2>&1; then
  exit 0
fi

# File is .env, .env.local, .env.production, etc. — likely tracked or about to be
cat >&2 <<EOF

🔴 SECRET FILE EDIT BLOCKED

Path: $FILE_PATH

This looks like a non-template env file that may contain real secrets.

If you need to:
  • Document a new env var → edit .env.example instead
  • Configure a real secret for local dev → confirm $FILE_PATH is gitignored
  • Configure a real secret for production → use the deploy target's secret manager (Railway/Vercel/etc), NOT a tracked file

If $FILE_PATH IS gitignored and this is intentional, override by editing
outside Claude or temporarily disable this hook in .claude/settings.json.

EOF

exit 1
