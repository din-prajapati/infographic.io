#!/usr/bin/env bash
# Remove trailing "Made-with: Cursor" line from HEAD only (real git from Git Bash).
set -euo pipefail
cd "$(dirname "$0")/.."
tree=$(git rev-parse 'HEAD^{tree}')
parent=$(git rev-parse 'HEAD^')
export GIT_AUTHOR_NAME="$(git log -1 --format=%an HEAD)"
export GIT_AUTHOR_EMAIL="$(git log -1 --format=%ae HEAD)"
export GIT_AUTHOR_DATE="$(git log -1 --format=%aI HEAD)"
export GIT_COMMITTER_NAME="$(git log -1 --format=%cn HEAD)"
export GIT_COMMITTER_EMAIL="$(git log -1 --format=%ce HEAD)"
export GIT_COMMITTER_DATE="$(git log -1 --format=%cI HEAD)"
old=$(git rev-parse HEAD)
msg=$(git log -1 --format=%B HEAD | sed '/^Made-with: Cursor$/d')
new=$(printf '%s\n' "$msg" | git commit-tree "$tree" -p "$parent")
branch=$(git rev-parse --abbrev-ref HEAD)
git update-ref "refs/heads/$branch" "$new" "$old"
echo "Rewrote HEAD $old -> $new"
