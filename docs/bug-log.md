# Voxa Bug Log

> Triage by severity: P0 = blocks demo video, P1 = visible but not blocking, P2 = polish.
> Format: `- [ ] [P0|P1|P2] [phase] short description (file:line if known)`

## Open

(none)

## Closed

(none)

---

## Severity guide

- **P0** — Blocks the demo video. Must fix before submission. Examples: phone calls don't connect, Stripe meter event fails, dashboard 500s on load.
- **P1** — Visible to a careful viewer but doesn't block. Examples: occasional language detection misfire, dashboard pagination off by one.
- **P2** — Polish. Fix if time permits. Examples: button alignment, console warnings.

Post-freeze, only P0 bugs justify code changes. P1/P2 can wait for v2.
