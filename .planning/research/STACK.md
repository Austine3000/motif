# Technology Stack: Batch Multi-Screen Composition

**Project:** Motif v1.5 -- Batch Compose
**Researched:** 2026-03-24
**Overall Confidence:** HIGH

## Scope

This document covers stack additions/changes for batch multi-screen composition:
1. **Parallel orchestration** -- spawning multiple Task() composer subagents from a single command
2. **Progress tracking** -- reporting screen-by-screen status back to the user during batch runs
3. **Auto-review after batch** -- triggering review pipeline after all screens complete
4. **Concurrency management** -- handling rate limits and partial failures gracefully

**Critical constraint:** Motif remains zero npm dependencies. All orchestration uses Node.js built-ins and Claude Code's Task() primitive. No p-limit, no p-queue, no external libraries.

Existing validated stack is NOT re-researched: Node.js >=22, CSS custom properties, Claude Code slash commands/hooks, Task() subagent spawning (single-screen), motif-state.js, compose-validator.js, runtime-session.js, auto-run-session-store.js.

---

## 1. Parallel Task() Orchestration

### Approach: Multiple Task() Calls in a Single Orchestrator Message

**What exists today:** The `/motif:compose` workflow (compose-screen.md) spawns ONE Task() per invocation. It already documents a "Parallel Composition" section (lines 429-436) that acknowledges multiple Task() calls are possible but defaults to sequential.

**What changes:** The batch workflow issues multiple Task() calls in a single orchestrator response. Claude Code supports up to 10 concurrent tool calls per message. Each Task() gets its own fresh context window -- this is the existing Motif architecture, just multiplied.

**Why Task() and NOT Agent Teams:** Agent Teams coordinate across separate sessions with inter-agent communication. Motif screen composers are deliberately isolated -- screen 3 must not be influenced by screen 2's implementation. Task() with fresh context per screen preserves the quality isolation that is Motif's core value proposition.

**Why NOT sequential looping:** Each screen composition takes 2-5 minutes. A 6-screen project would take 12-30 minutes sequentially. Parallel cuts this to ~5 minutes wall-clock time.

### Concurrency Limits

| Constraint | Value | Source | Confidence |
|-----------|-------|--------|------------|
| Max concurrent Task() calls per message | 10 | Claude Code docs + community testing | HIGH |
| Practical safe limit for Opus subagents | 3-5 | Rate limit reports (concurrent request caps) | MEDIUM |
| Context overhead per Task() spawn | ~20K tokens | Claude Code docs | HIGH |

**Recommendation:** Default concurrency of 3, configurable up to 5. Going beyond 5 parallel Opus subagents risks rate limiting. The orchestrator should batch screens into waves of 3-5 if total screens exceed the concurrency limit.

### Batching Strategy

```
Screens: [login, dashboard, settings, profile, transactions, analytics]
Wave 1 (parallel): [login, dashboard, settings]        -- 3 Task() calls
Wave 2 (parallel): [profile, transactions, analytics]   -- 3 Task() calls
```

Between waves: orchestrator collects results, updates STATE.md, reports progress, then issues next wave.

**Why NOT all-at-once:** Rate limiting kills reliability. A failed wave due to rate limits wastes all work in that wave. Smaller waves mean partial progress is preserved.

### Technology: Pure Promise.allSettled Semantics (Conceptual)

The orchestrator does not write JavaScript code to manage parallelism -- it issues multiple Task() tool calls in a single response and Claude Code handles the parallel execution. However, the conceptual model is `Promise.allSettled`: all tasks run to completion regardless of individual failures, and the orchestrator processes each result (fulfilled or rejected) independently.

**Why allSettled not all:** One screen failing (e.g., token budget exceeded, validation failure) must NOT abort the entire batch. The orchestrator reports per-screen success/failure.

---

## 2. Progress Tracking

### Approach: STATE.md Updates Between Waves + Summary File Polling

**What exists today:** `motif-state.js` supports `update` commands for phase, screens_composed, last_command, last_outcome, updated. STATE.md has a Screens table with per-screen status (planned/composed/reviewed/fixed).

**What changes:**

1. **Batch state fields in STATE.md frontmatter:**
   - `batch_id`: ISO timestamp identifier for the current batch run
   - `batch_total`: total screens in batch
   - `batch_completed`: screens finished so far
   - `batch_failed`: screens that failed

2. **Per-screen status updates:** After each wave completes, the orchestrator reads each screen's SUMMARY.md (or detects absence = failure) and updates STATE.md screen status.

3. **User-facing progress:** Between waves, the orchestrator prints:
   ```
   Batch progress: 3/6 screens composed (0 failed)
   Wave 1 complete: login (OK), dashboard (OK), settings (OK)
   Starting wave 2: profile, transactions, analytics...
   ```

### Technology: motif-state.js Extensions

Add new update commands to the existing motif-state.js script:

| Command | Purpose |
|---------|---------|
| `update batch_id <value>` | Set batch identifier |
| `update batch_total <N>` | Set total screen count |
| `update batch_completed <N>` | Increment completed count |
| `update batch_failed <N>` | Increment failed count |

**No new scripts needed.** The existing motif-state.js pattern (read frontmatter, update key, write back) handles this cleanly.

### Result Collection

After each wave, the orchestrator reads ONLY the SUMMARY.md files (existing pattern from compose-screen.md Step 4). It does NOT read Task() output -- this is the existing Motif anti-pattern documented in CLAUDE.md: "NEVER use TaskOutput to read full subagent output."

Detection logic:
- `.planning/design/screens/{SCREEN_NAME}-SUMMARY.md` exists + recent git commit = success
- SUMMARY.md missing or no commit = failure
- SUMMARY.md exists with `Validation: FAILED` = validation failure (files on disk, not committed)

---

## 3. Auto-Review After Batch

### Approach: Trigger Existing /motif:review Pipeline

**What exists today:** `/motif:review all` spawns a reviewer agent per screen with status `composed`. The review workflow already supports multi-screen review.

**What changes:** After all batch waves complete, the orchestrator asks the user:
```
All screens composed (5/6 succeeded, 1 failed).
Run /motif:review all to review composed screens? (yes/no)
```

If yes, the orchestrator triggers `/motif:review all` or spawns reviewer Task() agents in parallel (same wave-based pattern as compose).

**Why NOT auto-trigger without asking:** Review is expensive (each reviewer is an Opus-class agent). The user should opt in, especially after a batch that may have consumed significant rate limit budget.

### Parallel Review (Optional Enhancement)

The same wave-based parallel pattern applies to review:
- Spawn 3 reviewer Task() agents per wave
- Collect review reports between waves
- Update STATE.md screen statuses to `reviewed`

This is a natural extension, not a separate technology decision.

---

## 4. Failure Handling and Recovery

### Approach: Per-Screen Isolation with Batch-Level Reporting

| Failure Mode | Handling | Recovery |
|-------------|----------|----------|
| Single screen Task() fails | Mark as `failed` in STATE.md, continue batch | User can re-run `/motif:compose {screen_name}` |
| Rate limit hit mid-wave | Remaining screens in wave may fail | Orchestrator reports which screens need retry |
| All screens in wave fail | Report wave failure, offer retry or abort | User chooses: retry wave, skip to next, abort |
| compose-validator.js rejects | Screen files on disk but uncommitted | SUMMARY.md records failure; user inspects |

**No new error handling infrastructure needed.** The existing compose-validator.js exit codes and SUMMARY.md validation section handle per-screen failures. The batch layer just aggregates.

---

## 5. Batch Workflow File

### Approach: New Workflow File, Reuses Existing Composer Agent

| File | Type | Purpose |
|------|------|---------|
| `.claude/get-motif/workflows/batch-compose.md` | NEW | Batch orchestration workflow |
| `.claude/get-motif/workflows/compose-screen.md` | UNCHANGED | Existing single-screen workflow (reused by batch) |
| `.claude/get-motif/agents/motif-screen-composer.md` | UNCHANGED | Existing composer agent (spawned by batch) |
| `.claude/get-motif/scripts/motif-state.js` | MODIFIED | Add batch state fields |

**Why a separate workflow, not modifying compose-screen.md:** The single-screen compose is a proven, validated workflow. Batch compose wraps it -- it assembles context once, determines screen order, and spawns the same composer agents. The single-screen path must remain available for users who want one screen at a time.

### Workflow Structure

```
/motif:batch-compose [screen1 screen2 ...] or [all]
  |
  +-- Step 1: Load state, validate prerequisites (same gates as compose-screen.md)
  +-- Step 2: Determine screen list (from args or STATE.md planned screens)
  +-- Step 3: Assemble shared context profile (read once, pass paths to all agents)
  +-- Step 4: Calculate waves (ceil(screens / concurrency))
  +-- Step 5: For each wave:
  |     +-- Spawn N Task() composer agents in parallel
  |     +-- Collect results (read SUMMARY.md files)
  |     +-- Update STATE.md batch progress
  |     +-- Report wave results to user
  +-- Step 6: Final batch report
  +-- Step 7: Offer auto-review
  +-- Step 8: Update STATE.md final state
```

---

## 6. Configuration

### Approach: STATE.md Frontmatter (No New Config Files)

Batch settings live in STATE.md frontmatter, consistent with all other Motif configuration:

```yaml
batch_concurrency: 3        # Max parallel Task() agents per wave (default: 3, max: 5)
batch_auto_review: false     # Auto-trigger review after batch (default: false, ask user)
```

**Why NOT a separate config file:** Motif's architecture is markdown-first. STATE.md already holds all runtime configuration (platform, phase, screens). Adding batch config here keeps the single-source-of-truth pattern.

**Why NOT environment variables:** Motif is a design tool, not a server. Configuration should be visible in the project files, not hidden in shell state.

---

## Recommended Stack (Summary)

### Core (No Changes)

| Technology | Version | Purpose | Status |
|------------|---------|---------|--------|
| Node.js | >=22 | Runtime | Existing |
| Claude Code Task() | Current | Subagent spawning | Existing |
| motif-state.js | Current | State management | Existing (extended) |
| compose-validator.js | Current | Per-screen validation | Existing (unchanged) |

### New Additions

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Claude Code multiple Task() calls | Current | Parallel composition | Native capability, no library needed. Up to 10 concurrent calls per message, recommend 3-5 for reliability. |
| STATE.md batch fields | N/A | Progress tracking | Extends existing state pattern. No new files, no new scripts, just new frontmatter keys. |
| batch-compose.md workflow | N/A | Batch orchestration | Wraps existing compose-screen.md. Single-screen path preserved. |

### Explicitly NOT Adding

| Technology | Why Not |
|------------|---------|
| p-limit / p-queue | Zero-dependency constraint. Task() concurrency is managed by Claude Code runtime, not by Motif JavaScript. |
| Worker threads (node:worker_threads) | Composition happens in Task() subagents, not in Node.js processes. Worker threads solve the wrong problem. |
| WebSocket / SSE progress streaming | Motif runs inside Claude Code CLI, not a browser. Progress is reported as plain text between waves. |
| Redis / SQLite for batch state | Massive overkill. STATE.md frontmatter + SUMMARY.md files provide all needed state. |
| New npm dependencies of any kind | Violates core constraint. Everything needed is built into Node.js 22 and Claude Code. |
| Agent Teams | Designed for inter-agent communication. Motif composers are deliberately isolated. Wrong abstraction. |
| Separate batch-state.js script | motif-state.js already handles arbitrary frontmatter key updates. Extend, don't multiply. |

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Parallelism | Multiple Task() in single message | Sequential Task() loop | 5-6x slower for typical projects |
| Parallelism | Wave-based batching (3 per wave) | All-at-once (up to 10) | Rate limit risk too high with Opus agents |
| State | STATE.md frontmatter extensions | Separate batch-state.json | Breaks markdown-first architecture |
| Progress | Text output between waves | Real-time streaming | Claude Code CLI has no streaming progress API |
| Workflow | New batch-compose.md workflow | Modify compose-screen.md | Existing single-screen path must not break |
| Review | Opt-in after batch | Auto-trigger always | Expensive; user should control rate limit spend |
| Concurrency config | STATE.md frontmatter | CLI flag | Flags don't persist across /clear; frontmatter does |

---

## Integration Points

### With Existing Compose Pipeline

The batch workflow reuses the ENTIRE existing compose pipeline:
- Same gate checks (tokens.css, COMPONENT-SPECS.md exist)
- Same context profile assembly (Step 2 of compose-screen.md)
- Same platform overlay resolution
- Same scaffold detection
- Same composer agent (motif-screen-composer.md)
- Same compose-validator.js
- Same SUMMARY.md output format
- Same git commit pattern per screen

The ONLY new code is the orchestration layer: wave calculation, parallel Task() spawning, result collection, and batch-level state updates.

### With Auto-Run

After batch compose, the auto-run offer (Step 4b of compose-screen.md) triggers once, not per-screen. The runtime-launcher.js already handles the full project.

### With Review Pipeline

`/motif:review all` already handles multiple screens. The batch workflow just offers to trigger it automatically.

---

## Sources

- [Claude Code Subagents Documentation](https://code.claude.com/docs/en/sub-agents) -- official docs on Task() parallelism, subagent configuration, and concurrency (HIGH confidence)
- [Claude Code Sub-Agents: Parallel vs Sequential Patterns](https://claudefa.st/blog/guide/agents/sub-agent-best-practices) -- community-tested concurrency limits, rate limit observations (MEDIUM confidence)
- [Promise.allSettled() - MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled) -- conceptual model for failure-tolerant parallel execution (HIGH confidence)
- [Claude Code Rate Limits Explained](https://www.clawport.dev/blog/claude-code-rate-limits-explained) -- concurrent request cap behavior with multiple agents (MEDIUM confidence)
- [Run Concurrent Tasks With a Limit Using Pure JavaScript](https://maximorlov.com/parallel-tasks-with-pure-javascript/) -- concurrency limiting without dependencies (HIGH confidence, pattern reference only)
- Existing Motif codebase: compose-screen.md, motif-state.js, compose-validator.js, runtime-session.js (HIGH confidence, primary source)
