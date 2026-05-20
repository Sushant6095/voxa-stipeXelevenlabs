# Voxa — Claude Code Bootstrap (UI-Heavy Edition)

> Ultimate Claude Code setup for shipping the **Voxa AI Receptionist** at the ElevenLabs × Stripe hackathon.
> 50-hour build budget. 10 phases. **9 subagents. 9 slash commands. 8 skills. 5 hooks.**
> God-level UI is non-negotiable. The dashboard's **React Flow live orchestration view** is the demo's centerpiece.

---

## What's in here

```
voxa-bootstrap/
├── CLAUDE.md                       ← project context (now with locked UI stack)
├── PROMPTS.md                      ← 10 phase prompts (Phases 1, 7, 8 are UI-heavy)
├── README.md                       ← this file
├── .gitignore
├── docs/  (6 files)
│   ├── status.md
│   ├── bug-log.md
│   ├── architecture.md
│   ├── demo-script.md
│   ├── ui-spec.md                  ← ★ NEW: screen-by-screen UI bible
│   └── runbook.md
└── .claude/
    ├── settings.json
    ├── agents/  (9 specialists)
    │   stripe-architect · voice-engineer · telephony-engineer ·
    │   workflow-architect · frontend-engineer · data-architect ·
    │   integration-tester · shipping-orchestrator ·
    │   ui-virtuoso                  ← ★ NEW: visual polish specialist
    ├── commands/  (9 slash commands)
    │   /bootstrap · /phase N · /parallel · /smoke · /ship ·
    │   /status · /unstuck · /demo · /component (★ NEW)
    ├── skills/  (8 deep skill files)
    │   stripe-metered-billing · elevenlabs-conv-ai ·
    │   twilio-elevenlabs · n8n-workflow-design ·
    │   nextjs-supabase-realtime ·
    │   21st-dev-components          ← ★ NEW: registry + install catalog
    │   react-flow-realtime          ← ★ NEW: live orchestration view
    │   motion-and-effects           ← ★ NEW: animation patterns
    └── hooks/  (5 automation scripts)
        session-start · pre-bash · code-freeze-check ·
        post-write · stop
```

---

## The UI bet

A polished mediocre product beats an ugly excellent one in 60-second video judging. Voxa's UI layer is built on:

| Library | Purpose | Coverage in bootstrap |
|---|---|---|
| **Magic UI** | Animated shadcn components — 20+ installed | `21st-dev-components` skill |
| **21st.dev** | Community shadcn registry | `21st-dev-components` skill |
| **React Flow** | Live orchestration view (centerpiece) | `react-flow-realtime` skill (full impl) |
| **Motion** (Framer) | Animations, transitions, layout shifts | `motion-and-effects` skill |
| **Tremor** | Dashboard KPI cards, sparklines | covered in `ui-spec.md` |
| **Wavesurfer.js** | Voice cloning waveform | covered in `ui-spec.md` |
| **Sonner / Vaul / cmdk** | Toasts, drawers, command palette | covered in `ui-spec.md` |

The **7 mandatory wow moments** (see `docs/ui-spec.md`):
1. Landing hero with `<AnimatedBeam />` showing call flow
2. Bento grid features section
3. Pricing with `<BorderBeam />` + parallax tilt
4. **React Flow live orchestration view** — calls flow through nodes in real-time
5. KPI cards with `<NumberTicker />` + Tremor sparklines
6. Voice cloning with wavesurfer waveform + pulsing record button
7. `<DotPattern />` backgrounds everywhere

---

## Quick start (the GSD path)

### 1. Drop this bootstrap into your repo

```bash
unzip voxa-bootstrap.zip
cd voxa-bootstrap
# In a fresh empty git repo where you'll build Voxa:
cp -r * .[!.]* path/to/your-new-repo/
cd path/to/your-new-repo
git init && git add . && git commit -m "Add Claude Code bootstrap"
```

### 2. Open Claude Code

```bash
claude
```

The **session-start hook** prints the hackathon context. If you don't see it, the hooks aren't running — check `.claude/settings.json` is at repo root.

### 3. Run /bootstrap

```
> /bootstrap
```

Verifies prereqs, checks accounts, scaffolds `.env.example`, initializes `docs/`.

### 4. Run the phases

```
> /phase 1     # Foundation + FULL UI STACK INSTALL (3h)
> /phase 2     # Schema (1.5h)
> /phase 3     # Stripe (2.5h)
> /phase 4     # Telephony — CRITICAL CHECKPOINT (3h)
> /phase 5     # EL Agent (3h)
> /phase 6     # n8n workflows (6h)
> /phase 7     # Dashboard + LIVE ORCHESTRATION ★ (7h, +2h vs old)
> /phase 8     # Landing + Onboarding ★ (5h, +2h vs old)
> /phase 9     # WhatsApp + polish (3h)
> /phase 10    # Smoke + video prep (4h)
```

Total coding: ~38 hours. Day 4 (8h) reserved for video + posting. 4h buffer.

### 5. Install components on demand

```
> /component magic animated-beam
> /component magic border-beam
> /component 21st mannupaaji/dock
> /component tremor
```

### 6. Activate code freeze after Phase 10

```bash
touch .claude/.code-freeze
```

Hooks now refuse new feature files. Bug fixes still work.

### 7. Day 4

```
> /demo prep
> /demo record
> /demo post
```

---

## Parallel execution (where it really matters)

Phases 7 and 8 are designed for parallel dispatch of `ui-virtuoso` + `frontend-engineer`:

- **ui-virtuoso**: builds visuals — hero, KPI cards, React Flow nodes, empty states, animations
- **frontend-engineer**: wires data — Supabase queries, server actions, form handlers, realtime subscriptions

When `/phase 7` runs, the shipping-orchestrator dispatches both in parallel. The UI work and data work converge at integration. ~40% faster than serial.

---

## Why the UI focus

Read the hackathon scoring: judges grade a 60-second video. They will spend ~10 seconds on the dashboard, ~5 seconds on the landing hero, and ~3 seconds on the onboarding flow. If those 18 seconds look like Vercel, you place. If they look like default shadcn, you don't.

The React Flow live orchestration view alone is differentiation — no other Voxa-like submission will visualize their orchestration in real-time, and it's the single most filmable moment of the dashboard.

---

## Customizing for your own project

To reuse this bootstrap for a different hackathon:

1. **Rewrite `CLAUDE.md`** — project name, feature list, schedule
2. **Rewrite `PROMPTS.md`** — your 10 phases
3. **Keep the UI stack and `ui-spec.md`** — the patterns generalize. Just swap the wow moments and screens.
4. **Keep the agents/skills/commands structure** — universal patterns

---

## License

MIT — fork, adapt, ship.


---

## Quick start (the GSD path)

### 1. Drop this bootstrap into your repo

```bash
# In a fresh empty git repo where you'll build Voxa:
cp -r path/to/voxa-bootstrap/* path/to/voxa-bootstrap/.claude path/to/your-repo/
cd path/to/your-repo
git add . && git commit -m "Add Claude Code bootstrap"
```

### 2. Open Claude Code

```bash
claude
```

You should see the **session-start banner** print the hackathon context. If you don't, the hooks aren't running — check `.claude/settings.json` is in the repo root.

### 3. Run the bootstrap command

```
> /bootstrap
```

This will:
- Verify Node 22, pnpm, git, gh, stripe CLI are installed
- Check that you have accounts at every required service
- Scaffold a `.env.example` with every variable grouped and commented
- Initialize `docs/status.md`, `docs/bug-log.md`, etc.
- Report what's missing before you can run Phase 1

### 4. Run the phases

```
> /phase 1     # Foundation (2-3h)
> /phase 2     # Schema (1.5h)
> /phase 3     # Stripe (2.5h)
> /phase 4     # Telephony — CRITICAL CHECKPOINT (3h)
> /phase 5     # ElevenLabs agent (3h)
> /phase 6     # n8n workflows (6h) ← biggest phase
> /phase 7     # Dashboard (5h)
> /phase 8     # Landing + onboarding (3h)
> /phase 9     # WhatsApp + polish (3h)
> /phase 10    # Smoke + video prep (4h)
```

After Phase 10 completes, **activate code freeze** by running:
```bash
touch .claude/.code-freeze
```

This blocks new feature files via the `code-freeze-check.sh` hook.

### 5. Day 4 (Thursday) — video + posting

```
> /demo prep      # Pre-flight checklist
> /demo record    # Shot list reminder
> /demo post      # Platform-specific copy for X / LinkedIn / IG / TikTok
```

---

## Parallel execution

This bootstrap is designed for **parallel subagent dispatch**. Examples:

```
> /parallel "Build the /pricing page" "Set up Stripe meter and 6 prices" "Generate Supabase types"
```

The shipping-orchestrator analyzes dependencies and dispatches `frontend-engineer` + `stripe-architect` + `data-architect` in parallel. Watch them work simultaneously in the Claude Code Tasks pane.

The parallelization matrix lives in `.claude/agents/shipping-orchestrator.md`. Phases marked **parallel-safe** can fan out; others stay serial.

---

## Customizing for your own project

To reuse this bootstrap for a different hackathon:

1. **Rewrite `CLAUDE.md`** — change the project name, locked feature list, stack, schedule.
2. **Rewrite `PROMPTS.md`** — adjust the 10 phases to your build.
3. **Keep the agents/skills/commands structure** — the patterns generalize. Replace `voice-engineer` with whatever specialist your project needs.
4. **Keep the hooks** — `session-start.sh`, `pre-bash.sh`, `code-freeze-check.sh`, `post-write.sh`, `stop.sh` are all hackathon-general.

---

## Why this works

**CLAUDE.md** anchors every session in the same context. No drift, no re-explaining.

**Agents** are specialists with embedded expertise. The voice-engineer knows the EL `ulaw_8000` gotcha; the stripe-architect knows the Meter Events value-must-be-string gotcha. You don't have to remember.

**Commands** are reusable workflows. `/phase 6` always means "build all 5 n8n workflows with the parallelization matrix applied." No prompt re-engineering.

**Skills** are deep-dives Claude Code pulls in when relevant. The `nextjs-supabase-realtime` skill has the exact `createClient()` + `clerkMiddleware()` pattern memorized.

**Hooks** keep you honest. The code-freeze hook refuses new features after hour 42. The pre-bash hook stops `rm -rf` accidents. The session-start hook reminds you of the deadline.

This is the difference between "use Claude Code" and "use Claude Code as a force multiplier."

---

## Inspired by

The "superpower GSD" pattern from prolific Claude Code users: explicit subagents with narrow specializations, slash commands that orchestrate them, skills that encode hard-won gotchas, hooks that enforce process. None of this is magic — it's just discipline encoded in plain markdown.

---

## License

MIT — fork, adapt, ship.
