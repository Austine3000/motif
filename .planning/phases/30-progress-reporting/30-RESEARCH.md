# Phase 30: Progress Reporting and Batch Manifest - Research

**Researched:** 2026-03-24
**Domain:** Batch progress reporting, per-screen timing, markdown manifest generation
**Confidence:** HIGH

## Summary

Phase 30 enhances the batch composition flow built in Phase 29 with three capabilities: per-screen timing (start/end timestamps and duration), a formatted batch summary table, and a persistent BATCH-RESULT.md manifest file. The existing compose-screen.md (Step 3b) already has basic wave-level reporting ("Starting wave N/M: screen names" at 3b.1, per-screen OK/FAILED at 3b.7, and a text-based batch summary at 3b.8). This phase upgrades each of those touchpoints with timing data and structured formatting, then adds a new substep to write BATCH-RESULT.md.

The key architectural insight is that ALL changes are confined to compose-screen.md's Step 3b -- no new scripts, no new files, no new CLI commands. The orchestrator already tracks per-screen results in ALL_RESULTS[]. This phase adds timestamp fields to that tracking, enhances the output formatting at 3b.7 and 3b.8, and adds a new Step 3b.8b to write the manifest file. The motif-state.js batch-update-screens command requires no changes.

**Primary recommendation:** Modify compose-screen.md Step 3b in three targeted ways: (1) add timing instrumentation around Task() dispatch and collection, (2) upgrade 3b.7 and 3b.8 output to use markdown table formatting with durations, (3) add Step 3b.8b to write BATCH-RESULT.md to `.planning/design/`.

## Standard Stack

### Core (All Existing -- No New Dependencies)

| Technology | Version | Purpose | Why Standard |
|------------|---------|---------|--------------|
| compose-screen.md | Current (Step 3b modified) | Batch orchestration with progress reporting | Single file owns all batch behavior |
| motif-state.js | Current (unchanged) | STATE.md atomic updates | Already handles batch-update-screens |
| Claude Code Task() | Current | Parallel subagent spawning | Timing measured around Task() boundaries |

### New Additions

None. This phase modifies existing workflow instructions only.

### Explicitly NOT Adding

| Technology | Why Not |
|------------|---------|
| Separate progress-reporter.js script | Orchestrator is a prompt-driven workflow, not a JS runtime. Timing and reporting happen in the orchestrator's natural language flow. A script would require piping data between the orchestrator and a Node process unnecessarily. |
| motif-state.js changes | batch-update-screens already works. Timing data belongs in BATCH-RESULT.md, not STATE.md (STATE.md is for durable workflow state, not ephemeral run metrics). |
| Console spinner/progress bar library | Not applicable -- output is via Claude's text responses, not a terminal UI. |

## Architecture Patterns

### Pattern 1: Timing Instrumentation via Orchestrator Variables

**What:** The orchestrator records timestamps before and after each Task() dispatch and calculates durations. Since compose-screen.md is a prompt (not code), timing is tracked as orchestrator-level variables using the system clock available via Bash date commands.

**When to use:** Around every Task() spawn in Step 3b.2 and collection in Step 3b.4.

**Implementation approach:**

Before spawning a wave's Task() agents, the orchestrator records a wave start time. After all agents complete (Step 3b.3), it records the wave end time. For per-screen timing, since all screens in a wave start simultaneously (parallel Task() dispatch), the start time is the wave start time. The end time for each screen is approximated as the wave end time (since the orchestrator cannot observe individual Task() completion times -- it receives all results at once when all agents in the wave finish).

However, a more precise approach: the subagent can record its own start/end timestamps inside its SUMMARY.md. The orchestrator already reads SUMMARY.md in Step 3b.4. Adding a `## Timing` section to the SUMMARY.md template gives exact per-screen durations.

**Recommended approach:** Hybrid. The orchestrator tracks wave-level timing (precise). Subagents optionally report their own duration in SUMMARY.md (more precise per-screen, but depends on subagent compliance). The orchestrator uses subagent-reported timing if available, falls back to wave timing.

### Pattern 2: Subagent Self-Timing

**What:** Add a `## Timing` section to the subagent SUMMARY.md template. The subagent records when it started reading context files and when it finished validation. This gives accurate per-screen duration.

**When to use:** Always in batch mode. The instruction is added to the BATCH MODE INSTRUCTIONS block in Step 3b.2.

**Template addition to SUMMARY.md:**
```markdown
## Timing
- Started: {ISO timestamp from first Bash call}
- Completed: {ISO timestamp from last Bash call}
```

The subagent can get timestamps via `date -u +%Y-%m-%dT%H:%M:%SZ` in Bash.

**Why this works:** The subagent already writes SUMMARY.md (Step E). Adding two lines is trivial. The orchestrator already reads SUMMARY.md in Step 3b.4. No new files or scripts needed.

### Pattern 3: BATCH-RESULT.md as Orchestrator-Written Manifest

**What:** After all waves complete (after Step 3b.8), the orchestrator writes a BATCH-RESULT.md file to `.planning/design/` containing per-screen results with timestamps.

**When to use:** Every batch composition run.

**Why the orchestrator writes it (not a script):** The orchestrator already has all the data in ALL_RESULTS[]. Writing a markdown file from the orchestrator prompt is simpler than serializing data to JSON, passing it to a Node script, and having the script generate markdown.

**File format:**
```markdown
# Batch Composition Result

**Date:** 2026-03-24T14:30:00Z
**Screens:** 5 total | 4 succeeded | 1 failed
**Duration:** 3m 42s
**Concurrency:** 3

## Results

| Screen | Status | Duration | Wave | Commit |
|--------|--------|----------|------|--------|
| login | OK | 1m 12s | 1/2 | a1b2c3d |
| dashboard | OK | 1m 45s | 1/2 | d4e5f6g |
| settings | FAILED | 0m 58s | 1/2 | -- |
| profile | OK | 1m 22s | 2/2 | h7i8j9k |
| transactions | OK | 1m 15s | 2/2 | l0m1n2o |

## Failed Screens

### settings
- **Reason:** Validation failure -- import cycle detected
- **Files on disk:** .planning/design/screens/settings/
- **Retry:** `/motif:compose settings`

## Wave Log

### Wave 1/2 (login, dashboard, settings)
- Started: 14:26:18Z
- Completed: 14:28:03Z
- Duration: 1m 45s

### Wave 2/2 (profile, transactions)
- Started: 14:28:05Z
- Completed: 14:29:27Z
- Duration: 1m 22s
```

### Anti-Patterns to Avoid

- **Storing timing in STATE.md:** STATE.md is for durable workflow state (phase, screen statuses). Timing data is per-run ephemeral data. Mixing them bloats STATE.md and creates confusion about what's persistent vs transient.
- **Creating a new CLI command for manifest writing:** The orchestrator can write files directly via its allowed tools. Adding a script command for what is essentially "write this markdown string to a file" adds unnecessary indirection.
- **Per-screen real-time output during Task() execution:** Task() agents run in parallel. The orchestrator cannot emit output while waiting for agents to complete. Real-time per-screen output is only possible at wave boundaries (when results are collected). Do not promise "live streaming" -- promise "output as each wave completes."

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Timestamp formatting | Custom date arithmetic | `date -u +%Y-%m-%dT%H:%M:%SZ` in Bash | Standard ISO 8601, no parsing needed |
| Duration calculation | Manual subtraction | Bash `$(( end - start ))` with epoch seconds from `date +%s` | Simple, reliable |
| Markdown table generation | Template engine | Orchestrator string concatenation in prompt | Tables are trivial markdown, no library needed |
| File writing | New script command | Orchestrator's existing Write/Bash tools | compose-screen.md already has Bash(git add:*) permissions |

## Common Pitfalls

### Pitfall 1: Overwriting BATCH-RESULT.md from Previous Runs

**What goes wrong:** User runs batch compose twice. Second run overwrites the first BATCH-RESULT.md, losing history.
**Why it happens:** Single fixed filename.
**How to avoid:** Always overwrite. BATCH-RESULT.md is a "latest run" manifest, not a history log. If the user wants history, git history preserves it (the file is committed). Document this explicitly: "BATCH-RESULT.md reflects the most recent batch run. Previous runs are preserved in git history."
**Warning signs:** User complains about lost batch results after running compose twice.

### Pitfall 2: Duration Accuracy with Parallel Agents

**What goes wrong:** Orchestrator reports wall-clock duration for a wave, but user expects per-screen CPU time.
**Why it happens:** All screens in a wave start simultaneously. The wave duration is the duration of the slowest screen.
**How to avoid:** Use subagent self-timing for per-screen duration. Wave duration is wall-clock (max of per-screen durations). Total batch duration is sum of wave wall-clock durations. Label clearly: "Duration" for per-screen, "Wall time" for wave/total.
**Warning signs:** Per-screen durations that all equal the wave duration (means subagent timing wasn't captured and orchestrator fell back to wave timing).

### Pitfall 3: BATCH-RESULT.md Not Committed

**What goes wrong:** User runs `/clear`, starts new session, but BATCH-RESULT.md isn't in git history.
**Why it happens:** The file is written after commits (Step 3b.8b runs after 3b.5 which commits screens). If the orchestrator doesn't commit BATCH-RESULT.md separately, it exists only on disk.
**How to avoid:** Add a dedicated commit for BATCH-RESULT.md after writing it: `git add .planning/design/BATCH-RESULT.md && git commit -m "design(compose): batch result manifest"`. This is a separate commit from the per-screen commits.
**Warning signs:** BATCH-RESULT.md on disk but not in git log.

### Pitfall 4: Missing Timing from Crashed Agents

**What goes wrong:** A CRASHED screen (subagent produced no SUMMARY.md) has no timing data.
**Why it happens:** No SUMMARY.md means no `## Timing` section to read.
**How to avoid:** For CRASHED screens, use wave start time as start and wave end time as end. Mark duration as "N/A (crashed)" in the results table. The wave-level timing is always available from the orchestrator.

### Pitfall 5: Bash Tool Permissions

**What goes wrong:** compose-screen.md's `allowed-tools` doesn't include general Bash, only `Bash(git add:*)`, `Bash(git commit:*)`, `Bash(git status)`.
**Why it happens:** Restrictive tool allowlist designed for the original single-screen flow.
**How to avoid:** The orchestrator needs `Bash(date:*)` for timestamps and `Write` for BATCH-RESULT.md. Check that the allowed-tools header covers these. If `Write` is not listed, use `Bash` with a heredoc to write the file. Alternatively, the `date` calls can be done inside a `git commit` preparation context or the timestamps can be embedded directly by the LLM (which knows the current time from its context).

**Resolution:** The orchestrator (Claude) inherently knows the current date/time and can emit ISO timestamps without calling `date`. No Bash tool change needed for timestamps. For file writing, the orchestrator can use the Write tool (which is a core tool, not gated by the workflow's allowed-tools header -- the header constrains the *subagent*, not the orchestrator itself).

## Code Examples

### Existing Step 3b.7 (Current -- to be enhanced)
```markdown
### 3b.7: Report wave results

"Wave {wave_index + 1} complete: login (OK), dashboard (OK), settings (FAILED - {reason})"
```

### Enhanced Step 3b.7 (With Timing)
```markdown
### 3b.7: Report wave results

Print per-screen results with duration:

"Wave {wave_index + 1}/{WAVE_COUNT} complete ({wave_duration}):
  - login: OK (1m 12s)
  - dashboard: OK (1m 45s)
  - settings: FAILED - validation failure (0m 58s)"

Duration source: read `## Timing` section from each screen's SUMMARY.md. If SUMMARY.md missing (CRASHED), use wave duration with "(crashed)" label.
```

### Existing Step 3b.8 (Current -- to be enhanced)
```markdown
### 3b.8: Batch summary

Batch complete: {TOTAL_SUCCEEDED}/{SCREEN_LIST.length} screens composed

- login: OK (committed)
- dashboard: OK (committed)
- settings: FAILED (validation failure)
```

### Enhanced Step 3b.8 (Formatted Table with Timing)
```markdown
### 3b.8: Batch summary

Print a formatted summary table:

"Batch complete: {TOTAL_SUCCEEDED}/{SCREEN_LIST.length} screens | {total_duration}

| Screen | Status | Duration | Wave |
|--------|--------|----------|------|
| login | OK | 1m 12s | 1/2 |
| dashboard | OK | 1m 45s | 1/2 |
| settings | FAILED | 0m 58s | 1/2 |
| profile | OK | 1m 22s | 2/2 |

Failed: settings (validation failure -- import cycle detected)
Retry: /motif:compose settings"
```

### New Step 3b.8b (BATCH-RESULT.md)
```markdown
### 3b.8b: Write batch manifest

Write `.planning/design/BATCH-RESULT.md` with the complete batch result data (see Architecture Pattern 3 for format).

Then commit:
```bash
git add .planning/design/BATCH-RESULT.md
git commit -m "design(compose): batch result manifest"
```

This file persists across `/clear` and new sessions.
```

### SUMMARY.md Timing Section (Added to BATCH MODE INSTRUCTIONS)
```markdown
6. Record timing in SUMMARY.md. Add a `## Timing` section:
   ```
   ## Timing
   - Started: {run `date -u +%Y-%m-%dT%H:%M:%SZ` at the start of your work}
   - Completed: {run `date -u +%Y-%m-%dT%H:%M:%SZ` after validation}
   ```
   This lets the orchestrator calculate per-screen duration accurately.
```

## Scope of Changes

### Files Modified

| File | What Changes | Scope |
|------|-------------|-------|
| `.claude/get-motif/workflows/compose-screen.md` | Steps 3b.1, 3b.2, 3b.4, 3b.7, 3b.8 enhanced; new Step 3b.8b added | ~50 lines of prompt changes |

### Files Created at Runtime

| File | Created By | When |
|------|-----------|------|
| `.planning/design/BATCH-RESULT.md` | Orchestrator (compose-screen.md Step 3b.8b) | After every batch composition run |

### Files NOT Changed

| File | Why |
|------|-----|
| `motif-state.js` | No new commands needed. Timing goes in BATCH-RESULT.md, not STATE.md |
| `compose-validator.js` | Validation logic unchanged |
| `motif-screen-composer.md` (subagent prompt inside compose-screen.md) | Only the BATCH MODE INSTRUCTIONS block gets a timing line added |
| `core/workflows/compose-screen.md` | This is the npm package version; changes go to `.claude/get-motif/workflows/compose-screen.md` |

## State of the Art

| Old Approach (Phase 29) | New Approach (Phase 30) | Impact |
|------------------------|------------------------|--------|
| "Starting wave N/M: names" | "Starting wave N/M: names" (unchanged) | -- |
| No per-screen timing | Subagent self-times in SUMMARY.md `## Timing` | Accurate per-screen duration |
| Text list: "login: OK (committed)" | Markdown table with duration and wave columns | Scannable, structured output |
| No persistent manifest | BATCH-RESULT.md committed to git | Cross-session reference |
| Duration unknown | Total, per-wave, per-screen durations calculated | Performance visibility |

## Open Questions

1. **Should BATCH-RESULT.md include git commit hashes?**
   - What we know: The orchestrator commits each screen sequentially in Step 3b.5. It could capture the commit hash with `git rev-parse --short HEAD` after each commit.
   - What's unclear: Whether commit hashes add actionable value for the user vs. adding complexity.
   - Recommendation: Include them. Low cost (one Bash call per commit), high value for debugging ("which commit is the dashboard screen?"). Add a `Commit` column to the results table.

2. **Should single-screen compose also write BATCH-RESULT.md?**
   - What we know: PROG-03 says "after every batch." Single-screen is not a batch.
   - What's unclear: Whether users would benefit from a single-screen result file too.
   - Recommendation: No. Single-screen compose already reports inline. BATCH-RESULT.md is specifically for multi-screen runs where the volume of output makes a persistent summary valuable.

3. **Can Bash(date:*) be called from the orchestrator?**
   - What we know: The orchestrator's allowed-tools are `Read, Grep, Glob, Bash(git add:*), Bash(git commit:*), Bash(git status), Task`. Bash(date:*) is not explicitly listed.
   - What's unclear: Whether the allowed-tools are enforced strictly or are advisory.
   - Recommendation: Avoid relying on `Bash(date:*)`. Instead, have the orchestrator use its built-in awareness of the current time (Claude knows the time from its system prompt). For subagent timing, the subagent CAN call `date` because it has broader Bash access inside Task(). For wave-level timing, the orchestrator can simply note "wave started" and "wave ended" using its internal clock awareness without Bash calls.

## Sources

### Primary (HIGH confidence)
- `.claude/get-motif/workflows/compose-screen.md` -- full current workflow (656 lines), Steps 3b.1-3b.10 analyzed
- `.claude/get-motif/scripts/motif-state.js` -- full current script (553 lines), batch-update-screens command verified
- `.planning/phases/29-core-batch-orchestration/29-VERIFICATION.md` -- Phase 29 verification confirms all batch infrastructure is in place

### Secondary (MEDIUM confidence)
- `.planning/phases/29-core-batch-orchestration/29-RESEARCH.md` -- Phase 29 research documents architectural decisions (deferred commits, single entry point, wave dispatch)

## Metadata

**Confidence breakdown:**
- Scope of changes: HIGH -- compose-screen.md is fully analyzed, changes are well-bounded
- Architecture: HIGH -- extending existing patterns, no new architectural decisions needed
- Pitfalls: HIGH -- identified from direct code analysis (allowed-tools, file overwriting, crash handling)

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (stable -- changes are to prompt workflows, not fast-moving libraries)
