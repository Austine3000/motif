---
phase: 32-reliability-enhancements
plan: 02
subsystem: workflow
tags: [batch-compose, screen-ordering, cross-screen-consistency, wave-dispatch]

requires:
  - phase: 32-01
    provides: "Resume detection and stale file warnings in Step 1b"
  - phase: 29-02
    provides: "Wave-based batch orchestration in Step 3b"
provides:
  - "Smart screen ordering: foundational screens compose before feature screens"
  - "Foundation summary injection: feature wave agents receive layout/nav context"
affects: [compose-screen, batch-compose]

tech-stack:
  added: []
  patterns: [foundation-first-ordering, cross-screen-context-injection]

key-files:
  created: []
  modified:
    - .claude/get-motif/workflows/compose-screen.md

key-decisions:
  - "10 foundation patterns (7 substring + 3 exact) cover layout, nav, home, landing, shell, frame, header, footer, sidebar"
  - "Smart ordering is a no-op when all screens fit in one wave or no foundational screens detected"
  - "Foundation summary injection capped at 3 to prevent context bloat, prioritized layout > nav > others"

patterns-established:
  - "Foundation-first ordering: classify screens by name patterns, reorder only when multiple waves needed"
  - "Conditional context injection: append extra context to Task prompts based on wave position"

duration: 2min
completed: 2026-03-24
---

# Phase 32 Plan 02: Smart Screen Ordering Summary

**Foundation-first screen ordering with cross-screen summary injection for batch compose waves**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-24T10:35:03Z
- **Completed:** 2026-03-24T10:37:03Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Added pre-wave screen ordering that classifies screens as FOUNDATIONAL or FEATURE using 10 name patterns
- Foundational screens (layout, nav, home, landing, shell, frame, header, footer, sidebar) auto-compose in earlier waves
- Feature screen agents in wave 2+ receive up to 3 foundation SUMMARY.md paths for cross-screen consistency
- Ordering is a no-op when all screens fit in one wave or no foundational screens are detected

## Task Commits

Each task was committed atomically:

1. **Task 1: Add pre-wave smart screen ordering to Step 3b** - `99fdf24` (feat)
2. **Task 2: Add foundation summary injection to Step 3b.2** - `fb2eac3` (feat)

## Files Created/Modified
- `.claude/get-motif/workflows/compose-screen.md` - Added pre-wave ordering section and foundation summary injection in Step 3b/3b.2

## Decisions Made
- Used 10 name patterns (7 substring + 3 exact match) to classify foundational screens
- Smart ordering only activates when FOUNDATION_SCREENS is non-empty AND total screens exceed CONCURRENCY
- Capped foundation summary injection at 3 paths with layout > nav > others priority to prevent context bloat
- Foundation summary injection checks ALL_RESULTS for PASSED or WARNED status before including paths

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 32 complete: all reliability enhancements (resume detection, stale file warnings, smart ordering, foundation summary injection) are in place
- Batch compose workflow is ready for production use with improved cross-screen consistency

---
*Phase: 32-reliability-enhancements*
*Completed: 2026-03-24*
