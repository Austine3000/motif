---
phase: 16-validation-and-hardening
plan: 02
subsystem: tooling
tags: [validation, compose-pipeline, staleness-check, rollback, workflow]

# Dependency graph
requires:
  - phase: 16-validation-and-hardening
    provides: compose-validator.js script for post-decomposition validation (16-01)
  - phase: 15-compose-integration
    provides: compose-screen.md with decomposition rules and brownfield support
provides:
  - Compose workflow with validate-then-commit-or-rollback pattern in Step F
  - Stale scan artifact warning in Step 2b
  - Validation status reporting in screen SUMMARY.md
affects: [compose-screen.md subagent behavior, screen composition output]

# Tech tracking
tech-stack:
  added: []
  patterns: [stage-validate-commit-or-rollback in subagent, orchestrator-level staleness gating]

key-files:
  created: []
  modified: [core/workflows/compose-screen.md, .claude/get-motif/workflows/compose-screen.md]

key-decisions:
  - "No new decisions -- plan executed exactly as specified"

patterns-established:
  - "Validate-then-commit: subagent stages files, runs validator, commits on pass/warn, rolls back staging on fail"
  - "Staleness check: orchestrator warns when PROJECT-SCAN.md date is not today before spawning composer"
  - "Validation section in screen SUMMARY.md reports import cycles, naming conflicts, and prop warnings"

# Metrics
duration: 1min
completed: 2026-03-06
---

# Phase 16 Plan 02: Compose Workflow Validation Gate Summary

**Wired compose-validator.js into compose-screen.md with stage-validate-commit-or-rollback pattern, stale scan warning, and validation status in screen summaries**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-06T07:44:22Z
- **Completed:** 2026-03-06T07:45:36Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Added Step 2b scan freshness check that warns when PROJECT-SCAN.md scan date is not today and offers rescan option
- Replaced Step F (simple commit) with validate-then-commit-or-rollback pattern that stages files, runs compose-validator.js, and commits only on pass/warn
- Added Validation section to Step E summary template reporting import cycles, naming conflicts, and prop warnings
- Added self-review checklist item ensuring files are staged but not committed until validation passes
- Synced live copy (.claude/get-motif/workflows/) to be byte-identical with canonical (core/workflows/)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add staleness check and validation gate to compose workflow** - `06d3271` (feat)
2. **Task 2: Sync live copy of compose-screen.md** - `af85652` (chore)

## Files Created/Modified
- `core/workflows/compose-screen.md` - Canonical compose workflow with validation gate, staleness check, and updated summary template
- `.claude/get-motif/workflows/compose-screen.md` - Live copy, byte-identical to canonical

## Decisions Made
None - followed plan as specified.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Compose pipeline now validates every screen composition before committing
- Stale scan data triggers user warning before composition begins
- Validation failures roll back staging without deleting files for inspection
- Phase 16 (Validation and Hardening) is complete -- all plans executed

## Self-Check: PASSED

- [x] core/workflows/compose-screen.md exists
- [x] .claude/get-motif/workflows/compose-screen.md exists
- [x] 16-02-SUMMARY.md exists
- [x] Commit 06d3271 found (Task 1)
- [x] Commit af85652 found (Task 2)
- [x] Files are byte-identical (diff confirmed)

---
*Phase: 16-validation-and-hardening*
*Completed: 2026-03-06*
