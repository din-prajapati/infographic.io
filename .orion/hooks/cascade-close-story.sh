#!/usr/bin/env bash
# cascade-close-story.sh
# Pure-shell equivalent of /close-story for one or more story IDs.
# Called by the GitHub Action close-story-on-merge.yml and usable manually.
#
# Inputs (env):
#   IDS="US-AUTH-031 US-AUTH-032"  — explicit story IDs (story-branch merges)
#   MERGE_BRANCH="feat/auth-m-auth-04-google-oauth"  — merging branch (from GitHub Actions)
#   PR_NUM=42
#
# Milestone-aware: if MERGE_BRANCH matches the milestone-branch pattern
# (feat/{domain}-m-{domain}-{nn}-{slug}) and IDS is empty, the script discovers
# all story IDs under the matching milestone folder automatically.
#
# Effect: flips STORY/TASKS to ✅, updates MILESTONE/EPIC/PHASE_TRACKER/AGILE_INDEX
# tallies, appends to TEAM_STATUS.md session-log.
# ZERO LLM cost — sed/grep/awk only.

set -e

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
IDS="${IDS:-${1:-}}"
PR_NUM="${PR_NUM:-${2:-?}}"
MERGE_BRANCH="${MERGE_BRANCH:-}"
TODAY=$(date '+%Y-%m-%d')

EPICS_DIR="$PROJECT_DIR/docs/agile/epics"

# ─── Milestone-branch detection ──────────────────────────────────────────────
# Branch format: feat/{domain}-m-{domain}-{nn}-{slug}
# Milestone folder name: M-{DOMAIN}-{NN}-{slug}  (uppercase)
if [ -z "$IDS" ] && [ -n "$MERGE_BRANCH" ]; then
  # Extract the milestone-id portion from the branch name.
  # Pattern: last path component after the first slash, matches m-{domain}-{nn}...
  BRANCH_LEAF="${MERGE_BRANCH##*/}"   # strip "feat/" prefix if present
  # Detect milestone branch: leaf starts with {domain}-m- or contains -m-{domain}-
  MS_PART=$(echo "$BRANCH_LEAF" | grep -oE '[a-z]+-m-[a-z]+-[0-9]+-[a-z0-9-]+' | head -1)
  if [ -n "$MS_PART" ]; then
    # Convert to milestone folder name: auth-m-auth-04-google-oauth → M-AUTH-04-google-oauth
    # Only the domain segment is uppercased; the slug stays lowercase.
    _RAW=$(echo "$MS_PART" | sed -E 's/^[a-z]+-m-([a-z]+)-([0-9]+)-(.+)$/\1|\2|\3/')
    _DOM=$(echo "$_RAW" | cut -d'|' -f1 | tr '[:lower:]' '[:upper:]')
    _NN=$(echo  "$_RAW" | cut -d'|' -f2)
    _SLG=$(echo "$_RAW" | cut -d'|' -f3)
    MS_UPPER="M-${_DOM}-${_NN}-${_SLG}"
    unset _RAW _DOM _NN _SLG
    echo "→ Milestone branch detected: $MERGE_BRANCH (milestone: $MS_UPPER)" >&2

    # Find the milestone folder; story folders are direct children of milestones/{MS_UPPER}/
    MS_DIR=$(find "$EPICS_DIR" -maxdepth 5 -type d -name "$MS_UPPER" 2>/dev/null | head -1)
    if [ -n "$MS_DIR" ]; then
      IDS=$(find "$MS_DIR" -maxdepth 3 -type d | grep -oE 'US-[A-Z]+-[0-9]+' | sort -u | tr '\n' ' ')
      IDS="${IDS%% }"  # trim trailing space
      echo "→ Auto-discovered story IDs from milestone: $IDS" >&2
    else
      echo "⚠ Milestone folder $MS_UPPER not found under $EPICS_DIR — skipping" >&2
      exit 0
    fi
  fi
fi

[ -z "$IDS" ] && { echo "usage: IDS='US-XXX-NNN ...' PR_NUM=N $0" >&2
                   echo "       or set MERGE_BRANCH to a milestone branch to auto-discover IDs" >&2
                   exit 1; }

[ -d "$EPICS_DIR" ] || { echo "no docs/agile/epics — skipping" >&2; exit 0; }

for ID in $IDS; do
  STORY_FILE=$(find "$EPICS_DIR" -type f -name STORY.md -path "*/$ID/*" | head -1)
  if [ -z "$STORY_FILE" ]; then
    echo "⚠ $ID: STORY.md not found, skipping" >&2
    continue
  fi
  STORY_DIR=$(dirname "$STORY_FILE")
  TASKS_FILE="$STORY_DIR/TASKS.md"

  # Flip STORY.md status + closed date + PR number (only on lines starting with "> **")
  sed -i.bak -E \
    -e 's|^(\> \*\*Status:\*\*).*$|\1 ✅ Done|' \
    -e "s|^(\> \*\*Closed:\*\*).*$|\1 $TODAY|" \
    -e "s|^(\> \*\*PR:\*\*).*$|\1 #$PR_NUM|" \
    "$STORY_FILE"
  rm -f "${STORY_FILE}.bak"

  # Flip TASKS.md PR field if present
  if [ -f "$TASKS_FILE" ]; then
    sed -i.bak -E -e "s|^(\> \*\*PR:\*\*).*$|\1 #$PR_NUM|" "$TASKS_FILE"
    rm -f "${TASKS_FILE}.bak"
  fi

  # Mark the story row ✅ in any parent tracker that references it.
  # Look for table rows containing the ID; replace 🔲 or 🟡 with ✅ on the same row.
  PARENT_EPIC=$(echo "$STORY_DIR" | sed -E 's|.*/epics/[^/]+/([^/]+).*|\1|')
  for TRACKER in \
      "$EPICS_DIR/$PARENT_EPIC/EPIC.md" \
      "$PROJECT_DIR/docs/agile/PHASE_TRACKER.md" \
      "$PROJECT_DIR/docs/agile/AGILE_INDEX.md" \
      "$PROJECT_DIR/docs/agile/TEAM_STATUS.md"; do
    [ -f "$TRACKER" ] || continue
    awk -v id="$ID" '
      BEGIN { changed=0 }
      {
        if (index($0, id) > 0) {
          n=gsub(/🔲|🟡/, "✅", $0); if (n>0) changed=1
        }
        print
      }
      END { if (changed) print "" > "/dev/stderr" }
    ' "$TRACKER" > "${TRACKER}.tmp" && mv "${TRACKER}.tmp" "$TRACKER"
  done

  # Also touch MILESTONE.md if it sits beside the story folder
  for MS in $(find "$EPICS_DIR/$PARENT_EPIC" -maxdepth 3 -name MILESTONE.md 2>/dev/null); do
    awk -v id="$ID" '{ if (index($0, id) > 0) gsub(/🔲|🟡/, "✅"); print }' \
      "$MS" > "${MS}.tmp" && mv "${MS}.tmp" "$MS"
  done

  echo "✓ $ID closed → PR #$PR_NUM on $TODAY"
done

# Append session-log entry to TEAM_STATUS.md
STATUS_FILE="$PROJECT_DIR/docs/agile/TEAM_STATUS.md"
if [ -f "$STATUS_FILE" ]; then
  {
    echo ""
    echo "<!-- ai-sdlc:session-log -->"
    echo "**$TODAY $(date '+%H:%M')** · PR #$PR_NUM merged · closed: $IDS"
  } >> "$STATUS_FILE"
fi

exit 0
