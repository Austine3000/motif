---
phase: 31-auto-review-integration
plan: 02
subsystem: ui
tags: [motif, workflow, batch-compose, auto-review, review-gate, auto-run]

# Dependency graph
requires:
  - phase: 31-auto-review-integration
    plan: 01
    provides: Steps 3b.8c (auto-review dispatch) and 3b.8d (review result collection) with REVIEW_ALL_PASSED variable
provides:
  - Step 3b.8e (review gate) in compose-screen.md gating auto-run on review pass or user override
  - Review-aware Step 3b.10 next-step guidance (no longer suggests manual /motif:review)
  - Updated Step 3b.9 noting review gate prerequisite
affects: [compose-screen.md batch flow, auto-run gating]

# Tech tracking
tech-stack:
  added: []
  patterns: [review gate with override path, review-aware next-step guidance]

key-files:
  created: []
  modified:
    - .claude/get-motif/workflows/compose-screen.md

key-decisions:
  - "Review gate offers override -- user can proceed to auto-run even after review failure"
  - "Decline path skips auto-run entirely and goes to review-aware next-step guidance"
  - "Step 3b.10 no longer suggests /motif:review all since auto-review already happened"

patterns-established:
  - "REVIEW_ALL_PASSED flow: set in 3b.8d, consumed in 3b.8e (gate) and 3b.10 (guidance)"
  - "Override pattern: failed gate prints issues, offers yes/no override, routes accordingly"

# Metrics
duration: 1min
completed: 2026-03-24
---

# Phase 31 Plan 02: Review Gate and Review-Aware Guidance Summary

**Review gate (3b.8e) added to batch compose flow -- auto-run blocked on failed review with override path, next-step guidance reflects review status**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-24T10:04:05Z
- **Completed:** 2026-03-24T10:05:21Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Added Step 3b.8e (review gate) that blocks auto-run when review fails, with pass/fail/override logic
- Updated Step 3b.9 to note it is only reached after review gate passes or user overrides
- Replaced Step 3b.10 with review-aware next-step guidance that reflects review status and no longer redundantly suggests `/motif:review all`

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Step 3b.8e and update Steps 3b.9 and 3b.10** - `934292f` (feat)

## Files Created/Modified
- `.claude/get-motif/workflows/compose-screen.md` - Added Step 3b.8e (review gate), updated 3b.9 (review gate prerequisite note), replaced 3b.10 (review-aware next-step guidance)

## Decisions Made
- Review gate offers override -- user can choose to launch preview even after review failure (flexibility over strict blocking)
- Decline path skips auto-run and goes directly to 3b.10 with review-aware guidance suggesting `/motif:fix`
- Step 3b.10 no longer suggests `/motif:review all` since auto-review already happened in 3b.8c/3b.8d

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- The complete batch flow is now: compose -> summary -> manifest -> auto-review -> review collection -> review gate -> auto-run (if passed/overridden) -> next steps
- Phase 31 (auto-review integration) is complete -- all review gating and awareness is in place
- Ready for Phase 32 or milestone validation

---
*Phase: 31-auto-review-integration*
*Completed: 2026-03-24*
