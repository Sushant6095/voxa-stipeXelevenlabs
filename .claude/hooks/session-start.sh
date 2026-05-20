#!/usr/bin/env bash
# Runs at the start of every Claude Code session.
# Prints the current status so the assistant immediately knows where we are.

set -e

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
STATUS_FILE="$REPO_ROOT/docs/status.md"
BUG_LOG="$REPO_ROOT/docs/bug-log.md"
FREEZE_FILE="$REPO_ROOT/.claude/.code-freeze"

echo "═══════════════════════════════════════════════════"
echo "                  VOXA SESSION"
echo "═══════════════════════════════════════════════════"
echo "Project: Voxa — AI Receptionist for Indian SMBs"
echo "Hackathon: ElevenLabs x Stripe — deadline Thu 21 May 17:00 UTC"
echo ""

if [ -f "$FREEZE_FILE" ]; then
  echo "⚠️  CODE FREEZE IS ACTIVE"
  echo "   No new features. Bug fixes + video + posting only."
  echo ""
fi

if [ -f "$STATUS_FILE" ]; then
  echo "── docs/status.md ──"
  head -20 "$STATUS_FILE"
  echo ""
fi

if [ -f "$BUG_LOG" ] && [ -s "$BUG_LOG" ]; then
  OPEN_BUGS=$(grep -c "^- \[ \]" "$BUG_LOG" 2>/dev/null || echo "0")
  if [ "$OPEN_BUGS" -gt 0 ]; then
    echo "🐛 Open bugs: $OPEN_BUGS"
    grep "^- \[ \]" "$BUG_LOG" | head -3
    echo ""
  fi
fi

# Reminders
HOUR_OF_DAY=$(date +%H)
DAY_OF_WEEK=$(date +%u)

# Thursday (day 4) — code freeze day
if [ "$DAY_OF_WEEK" = "4" ]; then
  echo "📅 Today is Thursday. Hackathon deadline is 17:00 UTC."
  echo "   If you haven't shot the video yet, prioritize that over code."
fi

echo "Available slash commands:"
echo "  /bootstrap  /phase N  /parallel  /smoke  /ship  /status  /unstuck  /demo"
echo ""

exit 0
