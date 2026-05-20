#!/usr/bin/env bash
# Runs when the assistant finishes a turn.
# Reminds about the hour count and code freeze.

set -e

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
STATUS_FILE="$REPO_ROOT/docs/status.md"
FREEZE_FILE="$REPO_ROOT/.claude/.code-freeze"

# Only nag once per N turns; track via a counter file
COUNTER_FILE="$REPO_ROOT/.claude/.turn-counter"
COUNT=$(cat "$COUNTER_FILE" 2>/dev/null || echo "0")
COUNT=$((COUNT + 1))
echo "$COUNT" > "$COUNTER_FILE"

# Every 5 turns, remind of status
if [ $((COUNT % 5)) -eq 0 ] && [ -f "$STATUS_FILE" ]; then
  CURRENT_PHASE=$(grep -m1 "Current phase:" "$STATUS_FILE" 2>/dev/null | cut -d: -f2- | tr -d ' ' || echo "?")
  echo "📊 5-turn reminder: still on $CURRENT_PHASE. Run /status for the full picture." >&2
fi

# Thursday after 12:00 IST nag: shoot the video
DOW=$(date +%u)
HOUR=$(date +%H)
if [ "$DOW" = "4" ] && [ "$HOUR" -ge "12" ] && [ ! -f "$REPO_ROOT/docs/.video-shot" ]; then
  echo "🎬 It's Thursday afternoon. Have you shot the video yet? Run /demo prep." >&2
fi

exit 0
