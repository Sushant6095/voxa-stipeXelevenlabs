---
description: Run a specific phase from PROMPTS.md. Usage: /phase 1, /phase 2, etc.
---

You are running phase $ARGUMENTS of the Voxa hackathon build.

1. Read CLAUDE.md to refresh context.
2. Read `PROMPTS.md` and locate "Phase $ARGUMENTS".
3. Read `docs/status.md` to check current state — is this phase blocked? Is the previous phase complete?
4. If the previous phase is not marked complete, ask the user whether to proceed anyway or finish the prior phase first.
5. Use the shipping-orchestrator agent's logic for parallel dispatch (see `.claude/agents/shipping-orchestrator.md` for the parallelization matrix).
6. Execute the phase per PROMPTS.md.
7. After completion:
   - Run the relevant smoke check for this phase
   - Update `docs/status.md` (mark this phase complete, increment hour count, update current phase)
   - Output a one-paragraph summary of what shipped + what's next

If the phase fails partway through, do not auto-revert. Stop, document the failure in `docs/bug-log.md`, and report to the user with options.

If $ARGUMENTS is empty or not a number 1-10, output the phase list and ask which phase to run.
