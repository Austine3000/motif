---
phase: 04-rebrand-and-distribution
plan: 04
subsystem: branding
tags: [rebrand, motif, grep-sweep, e2e-tests, gap-closure]

# Dependency graph
requires:
  - phase: 04-rebrand-and-distribution (04-01)
    provides: "Initial source rebrand of 33 shipped files from Design Forge to Motif"
  - phase: 04-rebrand-and-distribution (04-03)
    provides: "UAT identifying 4 files with surviving forge references"
provides:
  - "Zero old-brand references across all shipped files (core/, runtimes/, bin/)"
  - "E2e test suite with correct motif-researcher.md assertion and MOTIF_ROOT variables"
  - "Updated BUILD-SPEC.md with Motif branding and accurate status markers"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Gap closure plan pattern: UAT failure drives targeted fix plan"

key-files:
  created: []
  modified:
    - core/references/runtime-adapters.md
    - core/workflows/generate-system.md
    - docs/BUILD-SPEC.md
    - test/e2e-installer.js

key-decisions:
  - "Updated BUILD-SPEC.md status markers for agents (BUILT) and distribution files (BUILT) based on disk verification"
  - "Simplified e2e test snippet resolution to only use {MOTIF_ROOT} replacement (matching current installer behavior)"

patterns-established:
  - "Gap closure: UAT failures produce targeted plans that fix only the identified gaps"

# Metrics
duration: 2min
completed: 2026-03-02
---

# Phase 4 Plan 04: Gap Closure Summary

**Closed UAT gap: eliminated last 4 stale forge references (2 shipped, 2 non-shipped) and fixed broken e2e test assertion for motif-researcher.md**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-02T09:18:42Z
- **Completed:** 2026-03-02T09:21:35Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Zero forge/Design Forge/FORGE_ROOT references now remain in shipped directories (core/, runtimes/, bin/)
- E2e test suite passes 7/7 with correct motif-branded assertions
- docs/BUILD-SPEC.md fully rebranded to Motif with accurate status markers for agents and distribution files
- Installer dry-run confirmed no regressions from edits

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix stale forge references in shipped files** - `0ed8337` (fix)
2. **Task 2: Fix stale forge references in non-shipped files** - `8107b5d` (fix)

## Files Created/Modified
- `core/references/runtime-adapters.md` - Agent defs row: forge-*.md -> motif-*.md in adapter table
- `core/workflows/generate-system.md` - CSS comment template: DESIGN FORGE -> MOTIF
- `docs/BUILD-SPEC.md` - Full Motif rebrand (14+ references), updated status markers for built agents and distribution files
- `test/e2e-installer.js` - Fixed forge-researcher.md -> motif-researcher.md assertion, renamed FORGE_ROOT variables to MOTIF_ROOT, simplified snippet resolution

## Decisions Made
- Updated BUILD-SPEC.md status markers from "NOT BUILT" to "BUILT" for agents and distribution files (verified on disk)
- Simplified e2e test snippet resolution: removed `.replaceAll('.claude/get-design-forge', ...)` since the snippet no longer contains that path; kept only `{MOTIF_ROOT}` replacement to match actual installer behavior

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Updated BUILD-SPEC.md status markers for built files**
- **Found during:** Task 2 (BUILD-SPEC.md rebrand)
- **Issue:** Plan mentioned updating status markers "if you can confirm the file exists on disk" -- agents are confirmed built, distribution files are confirmed built
- **Fix:** Updated 5 agent entries from "NOT BUILT" to "BUILT", 4 distribution entries from "NOT BUILT" to "BUILT"
- **Files modified:** docs/BUILD-SPEC.md
- **Verification:** `ls` confirmed all files exist on disk
- **Committed in:** 8107b5d (Task 2 commit)

**2. [Rule 1 - Bug] Fixed stale snippet resolution in e2e test**
- **Found during:** Task 2 (e2e-installer.js fixes)
- **Issue:** Test's `.replaceAll('{FORGE_ROOT}', ...)` was a dead no-op since snippet uses neither FORGE_ROOT nor MOTIF_ROOT; the `.replaceAll('.claude/get-design-forge', ...)` was also a no-op since that path was already removed from snippet
- **Fix:** Updated to `.replaceAll('{MOTIF_ROOT}', ...)` (matches installer behavior) and removed the dead `.replaceAll('.claude/get-design-forge', ...)` call
- **Files modified:** test/e2e-installer.js
- **Verification:** E2e test suite passes 7/7
- **Committed in:** 8107b5d (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 missing critical, 1 bug)
**Impact on plan:** Both auto-fixes improve accuracy. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 4 gap closure complete: all UAT gaps resolved
- All shipped files verified zero forge references
- E2e test suite passes 7/7
- Ready to proceed to Phase 5 (Verticals)

---
## Self-Check: PASSED

All 4 modified files verified on disk. Both task commits (0ed8337, 8107b5d) confirmed in git log.

---
*Phase: 04-rebrand-and-distribution*
*Completed: 2026-03-02*
