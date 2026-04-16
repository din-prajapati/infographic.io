#!/usr/bin/env bash
# Rewrite commit messages on a linear branch range without filter-branch
# (avoids Windows + git update-index --refresh false dirty state).
# Usage: bash scripts/rewrite-commit-messages-strip-cursor.sh <upstream> <branch>
# Example: bash scripts/rewrite-commit-messages-strip-cursor.sh main feat/design-us-design-002-editor-tokens

set -euo pipefail

UPSTREAM="${1:?upstream e.g. main}"
BRANCH="${2:?branch to rewrite}"

strip_msg() {
  sed -e '/^Made-with: Cursor$/d' \
      -e '/^Co-authored-by: Cursor/d' \
      -e '/^Co-Authored-By: Cursor/d'
}

export_ident_from_commit() {
  local c="$1"
  export GIT_AUTHOR_NAME="$(git log -1 --format=%an "$c")"
  export GIT_AUTHOR_EMAIL="$(git log -1 --format=%ae "$c")"
  export GIT_AUTHOR_DATE="$(git log -1 --format=%aI "$c")"
  export GIT_COMMITTER_NAME="$(git log -1 --format=%cn "$c")"
  export GIT_COMMITTER_EMAIL="$(git log -1 --format=%ce "$c")"
  export GIT_COMMITTER_DATE="$(git log -1 --format=%cI "$c")"
}

base=$(git merge-base "$UPSTREAM" "$BRANCH")
declare -A MAP
MAP["$base"]="$base"

while IFS= read -r old; do
  export_ident_from_commit "$old"
  parents=$(git log -1 --format=%P "$old")
  tree=$(git rev-parse "$old^{tree}")
  msg=$(git log -1 --format=%B "$old" | strip_msg)

  read -r -a ps <<<"$parents"
  if [[ ${#ps[@]} -eq 0 ]]; then
    echo "error: commit $old has no parents" >&2
    exit 1
  elif [[ ${#ps[@]} -eq 1 ]]; then
    np="${MAP[${ps[0]}]:-${ps[0]}}"
    new=$(printf '%s\n' "$msg" | git commit-tree "$tree" -p "$np")
  else
    np0="${MAP[${ps[0]}]:-${ps[0]}}"
    np1="${MAP[${ps[1]}]:-${ps[1]}}"
    new=$(printf '%s\n' "$msg" | git commit-tree "$tree" -p "$np0" -p "$np1")
    if [[ ${#ps[@]} -gt 2 ]]; then
      echo "error: commit $old has more than 2 parents; extend this script" >&2
      exit 1
    fi
  fi
  MAP["$old"]="$new"
done < <(git rev-list --reverse "${base}..${BRANCH}")

old_tip=$(git rev-parse "$BRANCH")
new_tip="${MAP[$old_tip]}"
if [[ -z "$new_tip" ]]; then
  echo "error: could not map branch tip" >&2
  exit 1
fi

git update-ref "refs/heads/$BRANCH" "$new_tip" "$old_tip"
echo "Updated refs/heads/$BRANCH: $old_tip -> $new_tip"
