#!/usr/bin/env bash
# Runs before any Bash tool call. Reads JSON from stdin.
# Blocks dangerous patterns. Logs all commands for audit.

set -e

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('tool_input',{}).get('command',''))" 2>/dev/null || echo "")

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
AUDIT_LOG="$REPO_ROOT/.claude/.bash-audit.log"

# Log every command
echo "[$(date -u +%FT%TZ)] $COMMAND" >> "$AUDIT_LOG"

# Block dangerous patterns
if echo "$COMMAND" | grep -qE '(rm -rf /|rm -rf ~|rm -rf \*|:(){:|:&};:|> /dev/sda|mkfs\.)'; then
  echo '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"Refusing to run a clearly destructive command."}}'
  exit 0
fi

# Block reading .env files via cat/less/more/head/tail
if echo "$COMMAND" | grep -qE '\b(cat|less|more|head|tail|bat)\b.*\.env(\.local|\.production)?$'; then
  echo '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"Do not print .env files to the chat — secrets stay local. Use specific env access patterns instead."}}'
  exit 0
fi

# Warn on long-running interactive commands
if echo "$COMMAND" | grep -qE '\b(npm run dev|pnpm dev|next dev|n8n start|supabase start)\b' && ! echo "$COMMAND" | grep -q '&'; then
  echo '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"ask","permissionDecisionReason":"This looks like a long-running dev server. Run it in a separate terminal or background it explicitly."}}'
  exit 0
fi

# Default: allow
exit 0
