---
description: Dispatch multiple subagents in parallel for independent work. Usage: /parallel "task1" "task2" "task3"
---

You are dispatching parallel subagents.

1. Parse $ARGUMENTS into separate tasks (one per quoted string, or one per line if newlines).
2. For each task, identify the most-suited subagent from .claude/agents/.
3. Use the Task tool to dispatch them in PARALLEL (single message, multiple tool calls).
4. Wait for all to complete.
5. Synthesize results into one consolidated report.

Available subagents:
- stripe-architect — Stripe Meter, Products, Prices, Checkout, webhooks
- voice-engineer — ElevenLabs agents, prompts, tools, voice cloning
- telephony-engineer — Twilio numbers, WhatsApp, ElevenLabs phone import
- workflow-architect — n8n workflows (W1-W5)
- frontend-engineer — Next.js App Router, shadcn, Supabase realtime
- data-architect — Supabase schema, RLS, migrations, types
- integration-tester — end-to-end verification
- shipping-orchestrator — meta-coordinator (don't dispatch this in parallel; it dispatches others)

Rules:
- Don't run more than 4 subagents in parallel — context overhead degrades quality.
- Don't dispatch dependent tasks in parallel. Check the parallelization matrix in shipping-orchestrator.md.
- If tasks have implicit dependencies, sequence them and tell the user.

Example invocation:
```
/parallel "Build the /pricing page" "Set up Stripe meter and 6 prices" "Generate Supabase types from current schema"
```

This should dispatch: frontend-engineer + stripe-architect + data-architect in parallel.
