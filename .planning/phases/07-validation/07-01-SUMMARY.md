---
phase: 07-validation
plan: 01
subsystem: testing
tags: [node, validation, tokens, css, hsl, wcag, differentiation]

# Dependency graph
requires:
  - phase: 03-installer
    provides: assert/console test harness pattern (e2e-installer.js)
  - phase: 05-verticals
    provides: vertical definitions with distinct color/font/radius specifications
  - phase: 06-hooks-and-scripts
    provides: token compliance hooks (contrast-checker, token-counter)
provides:
  - validate-workflow.js -- post-execution artifact completeness checker
  - validate-tokens.js -- token quality and brand color preservation checker
  - validate-diff.js -- differentiation comparison tool for two tokens.css files
affects: [07-02, 07-03, 07-UAT]

# Tech tracking
tech-stack:
  added: []
  patterns: [self-contained validation scripts, hex-to-HSL conversion, hue-wraparound comparison]

key-files:
  created:
    - test/validation/validate-workflow.js
    - test/validation/validate-tokens.js
    - test/validation/validate-diff.js

key-decisions:
  - "Scripts are fully self-contained (hexToHsl duplicated in validate-tokens.js and validate-diff.js) per zero-dependency project policy"
  - "Distinctness requires hue >= 30 degrees AND different display fonts; radius and surface are bonus checks"
  - "LOCKED font override respected -- banned font check skips lines with LOCKED comment"

patterns-established:
  - "Validation script pattern: CLI arg parsing, usage on no-args, assert/console output, exit 0/1"
  - "Token extraction via regex: --token-name:\\s*([^;]+); pattern for CSS custom properties"
  - "Hue wraparound: min(|diff|, 360-|diff|) for accurate circular comparison"

# Metrics
duration: 3min
completed: 2026-03-02
---

# Phase 07 Plan 01: Validation Scripts Summary

**Three Node.js validation scripts for automated post-workflow verification: artifact completeness, token quality with brand color preservation, and differentiation comparison via HSL hue analysis**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-02T12:38:05Z
- **Completed:** 2026-03-02T12:41:20Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- validate-workflow.js checks all expected Motif workflow artifacts by phase (init, research, system, compose, review) with optional screen list
- validate-tokens.js validates token quality (banned fonts, required tokens, WCAG annotations, structure) and optionally verifies brand color preservation with exact hex match
- validate-diff.js compares two tokens.css files for visual distinctness using HSL hue difference (>= 30 degrees), font family comparison, and bonus radius/surface checks

## Task Commits

Each task was committed atomically:

1. **Task 1: Create validate-workflow.js** - `a28f677` (feat)
2. **Task 2: Create validate-tokens.js** - `d0aedde` (feat)
3. **Task 3: Create validate-diff.js** - `9637eb3` (feat)

## Files Created/Modified
- `test/validation/validate-workflow.js` - Post-execution artifact completeness checker (243 lines)
- `test/validation/validate-tokens.js` - Token quality and brand color preservation checker (293 lines)
- `test/validation/validate-diff.js` - Differentiation comparison tool for two tokens.css files (309 lines)

## Decisions Made
- Scripts are fully self-contained (hexToHsl duplicated across validate-tokens.js and validate-diff.js) per the project zero-dependency policy rather than sharing via a common module
- Distinctness threshold set at hue >= 30 degrees AND different display font families (per 07-RESEARCH.md); radius and surface are bonus informational checks
- LOCKED font override respected in banned font check -- lines with LOCKED comment are skipped, matching the existing composer constraint system
- Token structure validation requires at least 20 custom properties and all four categories (color, font, spacing, radius)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All three validation scripts are ready for Plans 02 and 03 to use as post-execution verification
- validate-workflow.js will be invoked after controlled test and CryptoPay battle test workflow runs
- validate-tokens.js will verify token quality on generated tokens.css files
- validate-diff.js will compare tokens.css files from different workflow runs for differentiation testing

## Self-Check: PASSED

All files verified on disk:
- test/validation/validate-workflow.js
- test/validation/validate-tokens.js
- test/validation/validate-diff.js

All commits verified in git log:
- a28f677 (Task 1)
- d0aedde (Task 2)
- 9637eb3 (Task 3)

---
*Phase: 07-validation*
*Completed: 2026-03-02*
