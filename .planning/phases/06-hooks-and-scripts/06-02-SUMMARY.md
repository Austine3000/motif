---
phase: 06-hooks-and-scripts
plan: 02
subsystem: hooks
tags: [statusline, wcag, contrast, tokens, node-scripts, ansi]

# Dependency graph
requires:
  - phase: 06-hooks-and-scripts
    provides: research on Claude Code hooks API, WCAG algorithms, token counting
provides:
  - Context monitor statusLine script (HOOK-04) displaying real-time context usage
  - WCAG 2.1 contrast ratio calculator (SCRP-01) for color pair validation
  - Approximate token counter (SCRP-02) for design file context budget estimation
affects: [06-03-hooks-and-scripts, 07-battle-test, installer]

# Tech tracking
tech-stack:
  added: []
  patterns: [statusLine stdin JSON parsing, WCAG 2.1 sRGB linearization with 0.04045 threshold, recursive directory walking with binary detection]

key-files:
  created:
    - runtimes/claude-code/hooks/motif-context-monitor.js
    - scripts/contrast-checker.js
    - scripts/token-counter.js
  modified: []

key-decisions:
  - "process.stdout.write() instead of console.log() for statusLine to avoid trailing newline"
  - "WCAG 2.1 threshold 0.04045 for sRGB linearization (not legacy 0.03928)"
  - "Binary file detection via null byte check in first 512 bytes"

patterns-established:
  - "StatusLine pattern: read JSON from stdin, parse context_window.used_percentage, output ANSI-colored text"
  - "CLI utility pattern: shebang + strict mode + arg parsing + usage message + exit codes"
  - "WCAG contrast calculation: parseHex -> linearize -> relativeLuminance -> contrastRatio"

# Metrics
duration: 2min
completed: 2026-03-02
---

# Phase 6 Plan 2: Context Monitor and Utility Scripts Summary

**StatusLine context monitor with ANSI color-coded thresholds, WCAG 2.1 contrast checker using 0.04045 linearization, and recursive token counter with binary detection**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-02T11:16:20Z
- **Completed:** 2026-03-02T11:18:18Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Context monitor statusLine script reads session JSON and displays color-coded context percentage (green <50%, yellow 50-89%, red 90%+) with threshold-specific warnings
- Contrast checker implements mathematically correct WCAG 2.1 contrast ratios -- black vs white returns exactly 21:1, reports pass/fail for all four WCAG levels (AA/AAA normal/large)
- Token counter walks directories recursively, skips binary files and .DS_Store, reports approximate token count using chars/4 heuristic with comma-formatted numbers

## Task Commits

Each task was committed atomically:

1. **Task 1: Create context-monitor statusLine script (HOOK-04)** - `3b67182` (feat)
2. **Task 2: Create contrast-checker and token-counter utility scripts (SCRP-01, SCRP-02)** - `b0b0d2f` (feat)

## Files Created/Modified
- `runtimes/claude-code/hooks/motif-context-monitor.js` - StatusLine script: reads session JSON, outputs ANSI-colored context percentage with threshold warnings
- `scripts/contrast-checker.js` - CLI tool: WCAG 2.1 contrast ratio calculator for hex color pairs with AA/AAA pass/fail reporting
- `scripts/token-counter.js` - CLI tool: recursive directory walker reporting approximate token count via chars/4 heuristic

## Decisions Made
- Used `process.stdout.write()` instead of `console.log()` in context monitor to avoid trailing newline that could affect status line display
- Used WCAG 2.1 threshold of 0.04045 for sRGB linearization (not the legacy 0.03928 from WCAG 2.0)
- Binary file detection checks for null bytes in first 512 bytes rather than relying on file extensions
- Context monitor uses optional chaining fallback pattern (`data.context_window && data.context_window.used_percentage || 0`) for maximum compatibility

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All three scripts ready for Plan 03 (installer integration with settings.json hook configuration)
- Context monitor can be tested end-to-end once settings.json statusLine configuration is in place
- Contrast checker and token counter are standalone CLI tools, usable immediately

## Self-Check: PASSED

All artifacts verified:
- 3 files exist on disk (motif-context-monitor.js, contrast-checker.js, token-counter.js)
- 2 task commits found (3b67182, b0b0d2f)
- Must-have patterns confirmed: context_window, 0.04045, walkDir
- Key links confirmed: used_percentage, linearize

---
*Phase: 06-hooks-and-scripts*
*Completed: 2026-03-02*
