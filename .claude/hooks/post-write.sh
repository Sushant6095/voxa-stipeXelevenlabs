#!/usr/bin/env bash
# Runs after Write/Edit. Auto-formats supported files. Non-fatal on errors.

set +e

INPUT=$(cat)
PATH_WRITTEN=$(echo "$INPUT" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('tool_input',{}).get('file_path',''))" 2>/dev/null || echo "")

[ -z "$PATH_WRITTEN" ] && exit 0
[ ! -f "$PATH_WRITTEN" ] && exit 0

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$REPO_ROOT" || exit 0

case "$PATH_WRITTEN" in
  *.ts|*.tsx|*.js|*.jsx|*.json|*.md)
    if [ -f "node_modules/.bin/prettier" ]; then
      ./node_modules/.bin/prettier --write "$PATH_WRITTEN" > /dev/null 2>&1 || true
    fi
    ;;
  *.sql)
    # No standard formatter; skip
    ;;
esac

# Type-check just-edited TS files — fast feedback
if echo "$PATH_WRITTEN" | grep -qE '\.(ts|tsx)$' && [ -f "tsconfig.json" ]; then
  ERRORS=$(./node_modules/.bin/tsc --noEmit --pretty false 2>&1 | grep -c "error TS" || true)
  if [ "$ERRORS" -gt 0 ] 2>/dev/null; then
    echo "⚠️  TypeScript errors after edit ($ERRORS). Run: pnpm tsc --noEmit" >&2
  fi
fi

exit 0
