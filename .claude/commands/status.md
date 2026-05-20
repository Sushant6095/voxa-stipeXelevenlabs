---
description: Show current Voxa build status — phase, hour count, blockers, next action.
---

Read these files in order:
1. `CLAUDE.md` — refresh context
2. `docs/status.md` — phase tracker
3. `docs/bug-log.md` — open bugs

Output a concise status report:

```
═══════════════════════════════════════════
                VOXA STATUS
═══════════════════════════════════════════

⏱  Hour: X / 50  ([progress bar])
📍  Phase: N — [name] ([status])
🚦  Code freeze: hour 42 (T-Xh)

PHASES
──────
[✓] 1. Foundation
[✓] 2. Schema
[●] 3. Stripe ← currently here
[ ] 4. Telephony
[ ] 5. EL Agent
[ ] 6. n8n Workflows
[ ] 7. Dashboard
[ ] 8. Landing
[ ] 9. Polish
[ ] 10. Smoke + Video Prep

BLOCKERS
────────
(none)  OR  ⚠ Cal.com API key not set — Phase 6 W2 will fail

OPEN BUGS
─────────
🔴 P0: Stripe webhook 401 in production env
🟡 P1: Tamil language detection inconsistent
🟢 P2: Dashboard mobile view padding

NEXT ACTION
───────────
Run: /phase 3  (estimated 2.5h)
```

If no `docs/status.md` exists yet, prompt: "No status file. Run `/bootstrap` first."
