#!/usr/bin/env bash
# Runs before Write/Edit. If code freeze is active, blocks new feature files
# (allows edits to existing files for bug fixes).

set -e

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
FREEZE_FILE="$REPO_ROOT/.claude/.code-freeze"

# No freeze → allow everything
if [ ! -f "$FREEZE_FILE" ]; then
  exit 0
fi

INPUT=$(cat)
TOOL=$(echo "$INPUT" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('tool_name',''))" 2>/dev/null || echo "")
PATH_TO_WRITE=$(echo "$INPUT" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('tool_input',{}).get('file_path',''))" 2>/dev/null || echo "")

# Only enforce for Write (creating new files). Edit on existing files is bug-fix territory.
if [ "$TOOL" = "Write" ] && [ -n "$PATH_TO_WRITE" ] && [ ! -f "$PATH_TO_WRITE" ]; then
  # Exceptions: docs, README, demo assets, video scripts
  if echo "$PATH_TO_WRITE" | grep -qE '(README|docs/|\.md$|demo|video|posts/|\.gitignore)'; then
    exit 0
  fi
  
  cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "ask",
    "permissionDecisionReason": "CODE FREEZE is active. Creating a new file ($PATH_TO_WRITE) looks like a new feature. If this is a critical bug fix or doc/video asset, confirm to proceed."
  }
}
EOF
  exit 0
fi

exit 0
