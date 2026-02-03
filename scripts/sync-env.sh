#!/bin/bash

ENV_FILE=".env"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: .env file not found in project root"
  echo "Create one from .env.example: cp .env.example .env"
  exit 1
fi

echo "=== .env Single Source of Truth Setup ==="
echo ""
echo "Your .env file contains the following variables that need to be set in Replit Secrets:"
echo ""

while IFS= read -r line || [ -n "$line" ]; do
  [[ -z "$line" || "$line" =~ ^# ]] && continue
  
  key="${line%%=*}"
  value="${line#*=}"
  
  if [[ -n "$key" && ! "$key" =~ ^[[:space:]]*$ ]]; then
    if [[ "$value" =~ ^(sk-|rzp_|whsec_|price_|plan_) || "$key" =~ (SECRET|KEY|PASSWORD|TOKEN) ]]; then
      echo "  [SECRET] $key = ***hidden***"
    else
      echo "  [ENV]    $key = $value"
    fi
  fi
done < "$ENV_FILE"

echo ""
echo "=== Instructions ==="
echo ""
echo "For Replit:"
echo "  1. Go to the 'Secrets' tab (lock icon in left sidebar)"
echo "  2. Add each SECRET variable listed above"
echo "  3. ENV variables can be set in replit.nix or .replit [env] section"
echo ""
echo "For Cursor/Other AI IDEs:"
echo "  1. Keep your .env file in the project root (already gitignored)"
echo "  2. The IDE will read from .env automatically"
echo ""
echo "=== Quick Export Commands ==="
echo ""
echo "To temporarily export all vars to current shell:"
echo "  export \$(grep -v '^#' .env | xargs)"
echo ""
