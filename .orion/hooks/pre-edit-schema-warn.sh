#!/usr/bin/env bash
# pre-edit-schema-warn.sh
# AI-SDLC hook — fires before editing schema files (prisma, SQL).
# Warns about migration plan requirements. Does NOT block.
#
# Event: PreToolUse on Edit/Write matching schema files
# Exit code: 0 = allow (always — this is just a reminder)

set -e

FILE_PATH="${CLAUDE_TOOL_FILE_PATH:-}"

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

cat >&2 <<EOF

⚠️  SCHEMA CHANGE WARNING

You are about to edit: $FILE_PATH

Before proceeding, confirm:
  □ This change is referenced by a story (US-{DOMAIN}-{NNN})?
  □ Migration plan exists (additive vs destructive)?
  □ Backup or rollback strategy in place (for production)?
  □ If destructive: documented in story Out-of-Scope? (consider a separate migration story)

Common pitfalls:
  - Renaming a column without a deprecation step
  - Dropping a NOT NULL constraint without backfilling
  - Adding NOT NULL without a default for existing rows
  - Changing enum values without migrating data

Proceeding with edit. Run schema migration AFTER edit and BEFORE deploy.

EOF

exit 0
