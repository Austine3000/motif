---
phase: 29-core-batch-orchestration
plan: 02
subsystem: tooling
tags: [motif-compose, batch, wave-dispatch, parallel-task, deferred-commit, failure-isolation]

requires:
  - phase: 29-01
    provides: batch-update-screens command in motif-state.js for atomic multi-screen STATE.md updates
provides:
  - Batch multi-screen composition orchestration in compose-screen.md
  - Wave-based parallel Task() dispatch with configurable concurrency
  - Orchestrator-owned sequential commits (deferred commit strategy)
  - Failure isolation via SUMMARY.md detection (PASSED/WARNED/FAILED/CRASHED)
  - --all flag for composing all planned/failed screens
  - --concurrency N flag for tuning parallelism
affects: [30-auto-review, 31-auto-run-post-batch, compose-screen workflow, motif-screen-composer agents]

tech-stack:
  added: []
  patterns: [wave-based parallel dispatch, orchestrator-owned deferred commits, batch-mode prompt injection, summary-based failure detection]

key-files:
  created: []
  modified:
    - .claude/get-motif/workflows/compose-screen.md

key-decisions:
  - "Batch mode instructions prepended to existing agent_spawn template rather than creating separate batch agent -- keeps single-screen path byte-for-byte identical"
  - "tokens.css write prohibition enforced via prompt addendum rule 2 -- subagents note missing tokens in SUMMARY.md instead"
  - "Auto-run offered once after full batch, not per-screen -- avoids N preview prompts"

patterns-established:
  - "Batch prompt injection: prepend BATCH MODE INSTRUCTIONS block to Task() prompt for batch-specific behavior overrides"
  - "Wave dispatch pattern: group screens into chunks of CONCURRENCY, spawn all in one message, collect results via SUMMARY.md"
  - "Deferred commit strategy: subagents leave files staged, orchestrator commits sequentially to avoid git index.lock"
  - "Summary-based failure detection: PASSED/WARNED -> commit, FAILED -> skip, CRASHED (no summary) -> skip"

duration: 2min
completed: 2026-03-24
---

# Phase 29 Plan 02: Batch Orchestration in compose-screen.md Summary

**Wave-based batch composition with argument parsing (--all, multiple names, --concurrency N), parallel Task() dispatch, orchestrator-owned sequential commits, and failure isolation via SUMMARY.md detection**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-24T09:11:05Z
- **Completed:** 2026-03-24T09:13:54Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Extended compose-screen.md Step 1 with four-case argument parsing: no args, single screen, multiple names, --all flag
- Added Step 1b for batch validation with fuzzy screen name matching and wave calculation
- Added Step 3b with full wave dispatch loop: spawn parallel Task() agents, collect results, commit successes sequentially, update STATE.md atomically, report results
- BATCH MODE INSTRUCTIONS block prepended to Task() prompts enforces no-commit, no-tokens.css, explicit file listing
- Marked Steps 4-6 and Final Step as single-screen only to prevent double-execution in batch mode
- Replaced old "Parallel Composition" section with "Multi-Screen Composition" reference pointing to batch mode

## Task Commits

Each task was committed atomically:

1. **Task 1: Add batch argument parsing and screen validation to Step 1** - `6569e4a` (feat)
2. **Task 2: Add batch wave dispatch, deferred commits, and failure isolation** - `1369514` (feat)

## Files Created/Modified
- `.claude/get-motif/workflows/compose-screen.md` - Extended with batch argument parsing (Step 1 Cases A-D), batch validation (Step 1b), wave dispatch loop (Step 3b with substeps 3b.1-3b.10), single-screen-only annotations on Steps 4-6 and Final Step

## Decisions Made
- Batch mode instructions prepended to existing agent_spawn template rather than creating a separate batch agent -- this keeps single-screen compose byte-for-byte identical in behavior
- tokens.css write prohibition enforced via prompt addendum (rule 2) -- subagents note missing tokens in SUMMARY.md under "## Missing Tokens" instead of modifying shared files
- Auto-run offered once after the full batch (Step 3b.9), not per-screen, to avoid N preview prompts
- --all collects both `planned` and `failed` screens per research recommendation, enabling retry without manual listing

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- compose-screen.md now handles both single-screen and batch-mode composition end-to-end
- batch-update-screens command (from Plan 01) is wired into Step 3b.6 for atomic state updates
- Phase 30 (auto-review after batch) can hook into Step 3b.10's next-step guidance
- Phase 31 (auto-run post-batch) can extend Step 3b.9's auto-run offer
- Blocker noted in STATE.md (tokens.css write prohibition) is now addressed via batch prompt rule 2

---
*Phase: 29-core-batch-orchestration*
*Completed: 2026-03-24*
