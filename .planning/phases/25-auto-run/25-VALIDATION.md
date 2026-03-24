---
phase: 25
slug: auto-run
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 25 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | custom Node fixture harness |
| **Config file** | none — Wave 0 task `25-W0-01` creates the harness and runtime fixtures |
| **Quick run command** | `node .claude/get-motif/scripts/phase25-auto-run-check.js quick` |
| **Full suite command** | `node .claude/get-motif/scripts/phase25-auto-run-check.js full` |
| **Estimated runtime** | ~25 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node .claude/get-motif/scripts/phase25-auto-run-check.js quick`
- **After every plan wave:** Run `node .claude/get-motif/scripts/phase25-auto-run-check.js full`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 25-01-01 | 01 | 1 | ARUN-01, ARUN-02, ARUN-04 | integration | `node .claude/get-motif/scripts/phase25-auto-run-check.js quick --target launcher-contract && node .claude/get-motif/scripts/runtime-launcher.js --help` | ❌ W0 | ⬜ pending |
| 25-01-02 | 01 | 1 | ARUN-01, ARUN-02 | integration | `node .claude/get-motif/scripts/phase25-auto-run-check.js quick --target compose-auto-run` | ❌ W0 | ⬜ pending |
| 25-02-01 | 02 | 2 | ARUN-03 | integration | `node .claude/get-motif/scripts/phase25-auto-run-check.js quick --target runtime-session && node .claude/get-motif/scripts/phase25-auto-run-check.js quick --target cleanup-signal` | ❌ W0 | ⬜ pending |
| 25-02-02 | 02 | 2 | ARUN-03, ARUN-04 | integration | `node .claude/get-motif/scripts/phase25-auto-run-check.js quick --target port-policy && node .claude/get-motif/scripts/phase25-auto-run-check.js quick --target reuse-restart && node .claude/get-motif/scripts/phase25-auto-run-check.js quick --target status-surface` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

**Planned owner:** `25-W0-01` in `25-01-PLAN.md`

- [ ] `.claude/get-motif/scripts/phase25-auto-run-check.js` — fixture runner for quick/full verification
- [ ] `.claude/get-motif/fixtures/phase25/logs/` — sample Next.js, Vite, unknown, and static-preview inputs for ready detection tests
- [ ] `.claude/get-motif/fixtures/phase25/stubs/` — lightweight dummy launcher/port-holder processes for background lifecycle tests
- [ ] dry-run assertions for native browser open commands on macOS, Linux, and Windows
- [ ] artifact assertions for session-file creation, stale-session cleanup, and explicit untracked-port protection
- [ ] status-surface assertions for active preview PID/URL display when a runtime session artifact exists

## Wave 0 Dependency Contract

- `25-W0-01` must complete before any implementation task in Plans `01` or `02`
- `25-01-01` and `25-01-02` depend on the Wave 0 harness and fixtures
- `25-02-01` and `25-02-02` depend on both Plan `25-01` and Wave 0 coverage being available

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Next.js auto-run returns control to the terminal, waits for readiness, then opens the browser once the real URL is available | ARUN-01, ARUN-02 | Needs real framework boot timing and prompt UX review | Compose a Next.js screen, accept auto-run, confirm the browser opens only after the terminal shows a ready message and Motif prints the tracked PID/session details. |
| Vite auto-run opens the actual printed Vite URL instead of a guessed default | ARUN-02 | Requires live framework output and URL capture validation | Compose a Vite screen, accept auto-run, and confirm the opened URL matches the Vite `Local:` output even if the port differs from the default. |
| Static preview opens the generated site without spawning a background daemon | ARUN-01, ARUN-04 | Needs runtime UX confirmation rather than fixture-only checks | Compose a `web-static` project and confirm Motif opens the scaffolded `index.html` directly while reporting a non-daemon preview state. |
| Interrupting or exiting a Motif-owned dev session leaves no orphaned listener on the claimed port | ARUN-03 | Process-tree cleanup is platform/runtime dependent | Start auto-run, send `SIGINT`, then verify the port is no longer held and the session artifact reports `stopped` or a clear cleanup result. |
| Windows opener/task cleanup behavior is safe and dependency-free | ARUN-03, ARUN-04 | Current repo state explicitly marks Windows compatibility as unverified | Run the launcher on Windows or CI-equivalent and confirm `cmd /c start` opener construction and cleanup fallback behavior are correct. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
