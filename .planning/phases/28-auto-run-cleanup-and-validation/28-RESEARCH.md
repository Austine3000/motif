# Research Notes

- `v1.4-MILESTONE-AUDIT.md` calls out that `ARUN-03` has manual verification left for SIGINT/port cleanup and Windows opener behavior; the integration gap for auto-run cleanup is blocking the Next.js flow as well.
- The current `runtime-launcher.js` tracks sessions but does not persist them or terminate PIDs automatically, so restart attempts can leave orphaned dev servers.
- The audit expects Nyquist harnesses to cover Windows, macOS, and Linux openers, so a cross-platform cleanup check should simulate all three without requiring GUI automation.

# Considerations

- Where should the session store live? Placing it near `.planning/STATE.md` keeps it under git control, but the launcher runs outside `.planning`. Decide whether it belongs inside `.planning` or in `.claude/get-motif/fixtures/`.
- Should cleanup handlers send graceful `SIGTERM` before `SIGKILL`, and how long should they wait before escalation?
