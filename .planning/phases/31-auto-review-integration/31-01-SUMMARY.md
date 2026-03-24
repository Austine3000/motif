---
phase: 31-auto-review-integration
plan: 01
subsystem: ui
tags: [motif, workflow, batch-compose, auto-review, design-review]

# Dependency graph
requires:
  - phase: 29-batch-orchestration
    provides: batch compose wave dispatch and batch-update-screens
  - phase: 30-progress-reporting
    provides: batch summary and BATCH-RESULT.md manifest
provides:
  - Steps 3b.8c (auto-review dispatch) and 3b.8d (review result collection) in compose-screen.md
  - Automatic reviewer Task() agent spawning after batch compose
  - Grep-based review result extraction (score + critical issues)
  - BATCH-RESULT.md updated with review results section
affects: [31-02-PLAN (review gate), compose-screen.md batch flow]

# Tech tracking
tech-stack:
  added: []
  patterns: [batch auto-review dispatch, Grep-based result extraction, orchestrator-owned review commits]

key-files:
  created: []
  modified:
    - .claude/get-motif/workflows/compose-screen.md

key-decisions:
  - "Reviewer agents use review.md Step 2 template verbatim with BATCH AUTO-REVIEW INSTRUCTIONS prepended"
  - "Review result extraction uses Grep (not full file reads) to avoid context bloat"
  - "Orchestrator owns all review file commits and state updates -- reviewer agents only write files"
  - "Review waves reuse the same CONCURRENCY variable as compose waves"

patterns-established:
  - "BATCH AUTO-REVIEW INSTRUCTIONS: prepend block that disables agent commits and state updates"
  - "Grep-based score extraction: parse Score line and Critical Issues section without reading full REVIEW.md"

# Metrics
duration: 2min
completed: 2026-03-24
---

# Phase 31 Plan 01: Auto-Review Integration Summary

**Auto-review dispatch and result collection steps added to batch compose workflow -- reviewer Task() agents spawn automatically for PASSED/WARNED screens using review.md template**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-24T09:59:27Z
- **Completed:** 2026-03-24T10:01:07Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Added Step 3b.8c (auto-review dispatch) that spawns reviewer Task() agents for all PASSED/WARNED screens after batch compose
- Added Step 3b.8d (review result collection) that extracts scores via Grep, commits review files, updates STATE.md, and appends review results to BATCH-RESULT.md
- Reviewer agents use the full review.md Step 2 template with BATCH AUTO-REVIEW INSTRUCTIONS prepended to disable individual commits and state modifications

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Steps 3b.8c and 3b.8d to compose-screen.md** - `22e2fbb` (feat)

## Files Created/Modified
- `.claude/get-motif/workflows/compose-screen.md` - Added Steps 3b.8c (auto-review dispatch) and 3b.8d (review result collection) between 3b.8b and 3b.9

## Decisions Made
- Reviewer agents use review.md Step 2 template verbatim (not reinvented) with BATCH AUTO-REVIEW INSTRUCTIONS prepended -- ensures consistency with standalone /motif:review
- Review result extraction uses Grep for score line and critical issues count -- avoids context bloat from reading full REVIEW.md files
- Orchestrator owns all git commits for review files and all STATE.md updates -- reviewer agents only write REVIEW.md to disk
- Review waves reuse the same CONCURRENCY variable as compose waves (per research recommendation)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Steps 3b.8c and 3b.8d are in place, ready for 31-02 to add Step 3b.8e (review gate) that uses REVIEW_ALL_PASSED to gate auto-run
- The step ordering is 3b.8b -> 3b.8c -> 3b.8d -> 3b.9, with 3b.8e to be inserted between 3b.8d and 3b.9 by plan 31-02

---
*Phase: 31-auto-review-integration*
*Completed: 2026-03-24*
