#!/usr/bin/env bash
# run-engine.sh — run Codex or Gemini on one story or milestone, the ADR-004 way.
#
#   scripts/agents/run-engine.sh codex  implement US-PROP-006 --branch feat/prop/us-prop-006-client [--from <base-branch>]
#   scripts/agents/run-engine.sh codex  review    US-PROP-001 --branch <pr-branch> [--base <base-branch>]
#   scripts/agents/run-engine.sh gemini review    US-PROP-001 --branch <pr-branch> [--base <base-branch>]
#   scripts/agents/run-engine.sh codex  verify    M-PROP-01   --branch <milestone-branch> [--base main]
#   scripts/agents/run-engine.sh gemini verify    M-PROP-01   --branch <milestone-branch> [--base main]
#
# What it guarantees, whichever engine runs:
#   - The story card is the only handover: the prompt points at STORY.md + TASKS.md; nothing else is pasted.
#   - Secrets stay out: the engine runs with secret-looking env vars removed (Codex's shell also gets only
#     core vars), code changes happen in a fresh git worktree that has no .env files, and .geminiignore
#     keeps Gemini off .env*, secrets/ and the seed file.
#   - Short hand-back: the full transcript goes to .agent-logs/<run>/; only the engine's final message
#     (capped at 40 lines) is printed, so the orchestrator's context stays small.
#   - Reviews are read-only. Implementation never commits — the orchestrator reviews and commits.
#
# Env overrides: GEMINI_MODEL (default gemini-3-pro-preview), CODEX_MODEL (default: ~/.codex/config.toml),
#                WORKTREE_ROOT (default ../IE-wt).

set -euo pipefail

usage() { sed -n '2,9p' "$0" | sed 's/^# \{0,1\}//'; exit 2; }
[[ $# -ge 3 ]] || usage

ENGINE=$1 ROLE=$2 TARGET=$3; shift 3
BRANCH="" BASE="main" FROM=""
while [[ $# -gt 0 ]]; do
  case $1 in
    --branch) BRANCH=$2; shift 2 ;;
    --base)   BASE=$2;   shift 2 ;;
    --from)   FROM=$2;   shift 2 ;;
    *) usage ;;
  esac
done
[[ -n $BRANCH ]] || { echo "run-engine: --branch is required" >&2; exit 2; }

case "$ENGINE:$ROLE" in
  codex:implement|codex:review|codex:verify|gemini:review|gemini:verify) ;;
  *) echo "run-engine: unsupported '$ENGINE $ROLE'. Use: codex implement|review|verify, gemini review|verify." >&2; exit 2 ;;
esac

REPO=$(git rev-parse --show-toplevel)
cd "$REPO"
EPICS=docs/agile/epics
GEMINI_MODEL=${GEMINI_MODEL:-gemini-3-pro-preview}
WORKTREE_ROOT=${WORKTREE_ROOT:-$(dirname "$REPO")/IE-wt}

# ── Resolve the story cards ──────────────────────────────────────────────────
story_dir() { find "$EPICS" -path "*/stories/$1/STORY.md" -print -quit | xargs -r dirname; }

if [[ $TARGET == M-* ]]; then
  MILESTONE=$(find "$EPICS" -path "*/milestones/${TARGET}-*.md" ! -name "*RUNBOOK*" -print -quit)
  [[ -n $MILESTONE ]] || { echo "run-engine: no milestone file for $TARGET" >&2; exit 1; }
  mapfile -t IDS < <(grep -oE 'US-[A-Z]+-[0-9]+' "$MILESTONE" | sort -u)
else
  IDS=("$TARGET")
fi
CARDS=()
for id in "${IDS[@]}"; do
  d=$(story_dir "$id"); [[ -n $d ]] || { echo "run-engine: no STORY.md for $id" >&2; exit 1; }
  CARDS+=("$d/STORY.md" "$d/TASKS.md")
done

# ── Logs ────────────────────────────────────────────────────────────────────
RUN_ID="$(date +%Y%m%d-%H%M%S)-$ENGINE-$ROLE-$TARGET"
LOG="$REPO/.agent-logs/$RUN_ID"
mkdir -p "$LOG"

# ── Secret-free environment ─────────────────────────────────────────────────
UNSET=()
while IFS= read -r v; do UNSET+=(-u "$v"); done < <(
  env | cut -d= -f1 | grep -E -i '(DATABASE_URL|_KEY$|_KEYS$|SECRET|TOKEN|PASSWORD|PASSWD|^RAILWAY_|^NEON_|_DSN$|^PG)' || true)
run_clean() { env "${UNSET[@]}" "$@"; }

# ── Worktree (Codex only) ───────────────────────────────────────────────────
make_worktree() {
  local wt="$WORKTREE_ROOT/$ENGINE-$(echo "$TARGET" | tr '[:upper:]' '[:lower:]')-$ROLE"
  if [[ ! -d $wt ]]; then
    mkdir -p "$WORKTREE_ROOT"
    if [[ $ROLE == review ]]; then
      git worktree add -q --detach "$wt" "$BRANCH" >/dev/null
    elif git show-ref --verify --quiet "refs/heads/$BRANCH"; then
      git worktree add -q "$wt" "$BRANCH" >/dev/null
    else
      git worktree add -q -b "$BRANCH" "$wt" "${FROM:-$BASE}" >/dev/null
    fi
  fi
  # Worktrees share .git, not ignored files: link node_modules so the gates can run offline.
  for nm in node_modules api/node_modules; do
    if [[ -d $REPO/$nm && ! -e $wt/$nm ]]; then
      if [[ ${OSTYPE:-} == msys* || ${OSTYPE:-} == cygwin* ]]; then
        cmd //c mklink /J "$(cygpath -w "$wt/$nm")" "$(cygpath -w "$REPO/$nm")" >/dev/null
      else
        ln -s "$REPO/$nm" "$wt/$nm"
      fi
    fi
  done
  echo "$wt"
}

REPORT_SHAPE='WHEN DONE, your final message must be this shape and at most 10 lines:
  Files changed:   <list>
  ACs met:         <AC ids, each with the file:line that meets it>
  Gates:           <command> -> <real result with pass/fail counts>
  Deviations:      <anything different from TASKS.md, and why — or none>
  Questions:       <only decisions you could not make — or none>'

card_list() { printf '  %s\n' "${CARDS[@]}"; }

REVIEW_FOCUS='Check, in order: every AC is met (cite file:line); no code file outside the story file list changed
(edits under docs/, STORY.md, TASKS.md and tracker files are always allowed — do not flag them);
Out of Scope is respected; tests assert the ACs, not the implementation; security holds (auth at the boundary,
org scoping, no client-set ownership fields, no secrets in code or logs).'
VERIFY_FOCUS='Read the WHOLE milestone diff. Look for problems that only show across stories: two stories changing
the same function differently, a later story undoing an earlier one, a type or API contract changed in one place
but not its callers, a missing migration, and anything an AC requires that no story delivered.'
REVIEW_OUTPUT='OUTPUT, at most 25 lines:
  BLOCKING:       <file:line — problem — fix>
  NON-BLOCKING:   <file:line — problem — fix>
  MISSING TESTS:  <Given/When/Then — file it belongs in>
  VERDICT:        APPROVE / REQUEST CHANGES — one sentence'

# ── Roles ───────────────────────────────────────────────────────────────────
case "$ENGINE:$ROLE" in

codex:implement)
  WT=$(make_worktree)
  cat > "$LOG/prompt.md" <<EOF
Implement ${IDS[*]} in this repository (Buildographic; read CLAUDE.md / AGENTS.md for the stack).

READ FIRST, in this order:
$(card_list)

These two files are the whole contract.
- Touch only the files in TASKS.md "File → Task Map" (or STORY.md "Primary files touched" / \`owns:\`).
  CI fails the PR on any other file. If you need another file, stop and say so under Questions.
- Out of Scope in STORY.md is law. Do not fix anything else, even nearby.
- Tests already written for this story are the standard. Do not weaken, skip or delete a test to make it pass.
- Do not read or create .env files; there are none in this worktree and you do not need them.
- Do not commit, push or open a PR. Leave the changes in the working tree.
- Tick each finished task in TASKS.md and add a dated entry to STORY.md "Implementation Update (log)".

GATES — run them and quote the real output; never claim a pass you did not see:
  npm run check
  npm run test:unit

$REPORT_SHAPE
EOF
  run_clean codex exec -C "$WT" -s workspace-write \
    -c shell_environment_policy.inherit=core ${CODEX_MODEL:+-m "$CODEX_MODEL"} \
    --json -o "$LOG/final.md" - < "$LOG/prompt.md" > "$LOG/events.jsonl" 2> "$LOG/stderr.log" || true
  echo "worktree: $WT"
  ;;

codex:review|codex:verify)
  # Not `codex exec review`: its --base cannot be combined with custom instructions (codex-cli 0.164).
  WT=$(make_worktree)
  BASE_SHA=$(git rev-parse "$BASE")
  if [[ $ROLE == verify ]]; then FOCUS="$VERIFY_FOCUS"; else FOCUS="$REVIEW_FOCUS"; fi
  cat > "$LOG/prompt.md" <<EOF
You are an independent reviewer. You did not write this code. Make no edits and propose no refactors.
The changes under review are \`git diff $BASE_SHA...HEAD\` in this repository. Review only those.
The standard is the story contract — read it first:
$(card_list)

$FOCUS

$REVIEW_OUTPUT
EOF
  run_clean codex exec -C "$WT" -s read-only \
    -c shell_environment_policy.inherit=core -c model_reasoning_effort=high ${CODEX_MODEL:+-m "$CODEX_MODEL"} \
    --json -o "$LOG/final.md" - < "$LOG/prompt.md" > "$LOG/events.jsonl" 2> "$LOG/stderr.log" || true
  git worktree remove --force "$WT" >/dev/null 2>&1 || true
  ;;

gemini:review|gemini:verify)
  # The payload goes on stdin: a milestone diff exceeds the Windows argument limit (M-EDIT-04 runbook).
  {
    for c in "${CARDS[@]}"; do echo "=== $c ==="; cat "$c"; done
    echo "=== DIFF $BASE...$BRANCH ==="
    git diff "$BASE...$BRANCH" -- . ':(exclude)docs' ':(exclude)*.lock' ':(exclude)package-lock.json'
  } > "$LOG/payload.txt"

  if [[ $ROLE == verify ]]; then FOCUS="$VERIFY_FOCUS"; else FOCUS="$REVIEW_FOCUS"; fi
  INSTR="You are an independent verifier. You did not write this code. Make no edits and propose no refactors.
The story cards above the diff are the only standard. $FOCUS
$REVIEW_OUTPUT"
  printf '%s\n' "$INSTR" > "$LOG/prompt.md"
  run_clean gemini -m "$GEMINI_MODEL" --approval-mode plan -o text -p "$INSTR" \
    < "$LOG/payload.txt" > "$LOG/final.md" 2> "$LOG/stderr.log" || true
  ;;
esac

# ── Hand-back ───────────────────────────────────────────────────────────────
echo "run: $RUN_ID  (full log: .agent-logs/$RUN_ID/)"
if [[ -s $LOG/final.md ]]; then
  head -n 40 "$LOG/final.md"
else
  echo "run-engine: no final message — see $LOG/stderr.log"; tail -n 5 "$LOG/stderr.log" 2>/dev/null; exit 1
fi
