#!/usr/bin/env bash
# pre-push-gate1.sh
# AI-SDLC hook — fires before `git push`.
# Runs Gate 1 commands from PROJECT_CONTEXT.yaml. Blocks push on failure.
#
# Event: PreToolUse on Bash matching "git push*"
# Exit code: 0 = allow push, non-zero = block

set -e

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
CONTEXT_FILE="$PROJECT_DIR/PROJECT_CONTEXT.yaml"

# If no PROJECT_CONTEXT.yaml, fall back to common conventions
if [ ! -f "$CONTEXT_FILE" ]; then
  echo "[pre-push-gate1] No PROJECT_CONTEXT.yaml — using fallback defaults" >&2
  GATE1_COMMANDS=("npm run check" "npm run test:unit")
else
  # Parse gates[id=1].commands from YAML (minimal parser — no yq dependency)
  # Looks for "id: 1" block and extracts "commands:" list lines starting with "      - "
  GATE1_COMMANDS=()
  in_gate1=0
  in_commands=0
  while IFS= read -r line; do
    if [[ "$line" =~ ^[[:space:]]+-[[:space:]]+id:[[:space:]]*1[[:space:]]*$ ]]; then
      in_gate1=1
      in_commands=0
      continue
    fi
    if [ "$in_gate1" = "1" ]; then
      if [[ "$line" =~ ^[[:space:]]+commands: ]]; then
        in_commands=1
        continue
      fi
      if [[ "$line" =~ ^[[:space:]]+-[[:space:]]+id: ]]; then
        in_gate1=0
        in_commands=0
        continue
      fi
      if [ "$in_commands" = "1" ]; then
        if [[ "$line" =~ ^[[:space:]]+-[[:space:]]+\"?([^\"]+)\"?[[:space:]]*$ ]]; then
          GATE1_COMMANDS+=("${BASH_REMATCH[1]}")
        elif [[ "$line" =~ ^[[:space:]]*[a-z_]+: ]]; then
          # next field — done with commands
          in_commands=0
          in_gate1=0
        fi
      fi
    fi
  done < "$CONTEXT_FILE"

  if [ ${#GATE1_COMMANDS[@]} -eq 0 ]; then
    echo "[pre-push-gate1] Could not parse Gate 1 commands — using fallback" >&2
    GATE1_COMMANDS=("npm run check" "npm run test:unit")
  fi
fi

echo "──────────────────────────────────────────────"
echo "  Gate 1 — pre-push check"
echo "──────────────────────────────────────────────"

failures=0
for cmd in "${GATE1_COMMANDS[@]}"; do
  echo ""
  echo "▶ Running: $cmd"
  if ! (cd "$PROJECT_DIR" && eval "$cmd"); then
    echo "❌ FAIL: $cmd"
    failures=$((failures + 1))
  else
    echo "✅ PASS: $cmd"
  fi
done

echo ""
echo "──────────────────────────────────────────────"
if [ "$failures" -gt 0 ]; then
  echo "🔴 Gate 1 FAILED ($failures command(s)). Push BLOCKED."
  echo "   Fix the failures, then retry the push."
  exit 1
fi
echo "🟢 Gate 1 PASSED. Push proceeding."
echo "──────────────────────────────────────────────"
exit 0
