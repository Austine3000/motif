---
phase: 06-hooks-and-scripts
plan: 01
subsystem: hooks
tags: [claude-code-hooks, PostToolUse, css-linting, a11y, font-check, token-enforcement]

# Dependency graph
requires:
  - phase: 04-rebrand-and-distribution
    provides: "Motif file structure in runtimes/claude-code/"
provides:
  - "motif-token-check.js -- PostToolUse hook flagging hardcoded CSS values"
  - "motif-font-check.js -- PostToolUse hook flagging banned fonts"
  - "motif-aria-check.js -- PostToolUse hook flagging accessibility violations"
affects: [06-02 (installer hooks integration), 06-03 (context monitor), 07-battle-test]

# Tech tracking
tech-stack:
  added: []
  patterns: ["PostToolUse stdin JSON -> violation check -> stdout decision JSON", "Write vs Edit content extraction pattern", "Comment stripping for false-positive prevention"]

key-files:
  created:
    - runtimes/claude-code/hooks/motif-token-check.js
    - runtimes/claude-code/hooks/motif-font-check.js
    - runtimes/claude-code/hooks/motif-aria-check.js
  modified: []

key-decisions:
  - "box-shadow check uses line-level skip function instead of regex negative lookahead to avoid backtracking false positives"
  - "Font-check also matches JSX fontFamily property syntax (camelCase) since tsx/jsx are target extensions"
  - "border-radius skip uses parsed numeric comparison rather than string matching to avoid 10px/20px false passes"

patterns-established:
  - "PostToolUse hook pattern: stdin JSON -> extension filter -> content extraction (Write vs Edit) -> regex checks -> decision JSON or silent exit"
  - "Comment stripping: single-line (//, *), block (/* */), and HTML (<!-- -->) comments replaced with empty lines to preserve line numbers"
  - "User-locked font detection: read tokens.css --font-display/--font-body values at runtime, skip those fonts in banned list"

# Metrics
duration: 4min
completed: 2026-03-02
---

# Phase 6 Plan 01: Compliance Hooks Summary

**Three PostToolUse hooks (token-check, font-check, a11y-check) enforcing Motif design system rules via stdin JSON inspection and stdout decision feedback**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-02T11:16:12Z
- **Completed:** 2026-03-02T11:20:26Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Token-check hook flags hardcoded colors (hex/rgb/hsl), spacing, font-size, border-radius, and box-shadow with line-specific violation messages and token suggestions
- Font-check hook flags 11 banned fonts (Inter, Roboto, Open Sans, Arial, Helvetica, system-ui, etc.) with runtime tokens.css user-lock detection
- A11y-check hook flags three WCAG violation types: div+onClick without role/tabIndex, img without alt, input without label association
- All three hooks handle both Write and Edit tool events, filter by file extension, and exit silently for clean content

## Task Commits

Each task was committed atomically:

1. **Task 1: Create token-check and font-check hooks** - `ef3c885` (feat)
2. **Task 2: Create a11y-check hook** - `e1e74ca` (feat)

## Files Created/Modified
- `runtimes/claude-code/hooks/motif-token-check.js` - PostToolUse hook flagging hardcoded CSS color, spacing, font-size, border-radius, and box-shadow values
- `runtimes/claude-code/hooks/motif-font-check.js` - PostToolUse hook flagging banned fonts with tokens.css user-lock exception
- `runtimes/claude-code/hooks/motif-aria-check.js` - PostToolUse hook flagging div+onClick a11y, img alt, and input label violations

## Decisions Made

1. **box-shadow regex approach**: Used a `\S` match pattern with a line-level skip function instead of a negative lookahead (`(?!var\(|none)`) because regex backtracking caused false positives when the value was preceded by whitespace (e.g., `box-shadow: none` would match after backtracking `\s*` to zero characters).

2. **JSX fontFamily support**: Added `fontFamily` (camelCase) matching alongside `font-family` (CSS kebab-case) in font-check since tsx/jsx are target file extensions and inline styles use camelCase property names.

3. **border-radius numeric parsing**: Used parsed integer comparison (`parseInt`) rather than string matching (`match.includes('0px')`) to correctly distinguish `0px` (allowed reset) from `10px`, `20px`, etc.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed box-shadow none/var() false positive**
- **Found during:** Task 1 (token-check hook)
- **Issue:** Negative lookahead regex `(?!var\(|none)` produced false matches for `box-shadow: none` due to greedy `\s*` backtracking
- **Fix:** Changed to `\S` match pattern with a skip function that parses the actual shadow value
- **Files modified:** runtimes/claude-code/hooks/motif-token-check.js
- **Verification:** `box-shadow: none` and `box-shadow: var(--shadow-md)` both pass silently; hardcoded shadows are flagged
- **Committed in:** ef3c885

**2. [Rule 2 - Missing Critical] Added JSX fontFamily detection**
- **Found during:** Task 1 (font-check hook)
- **Issue:** Font-check only matched CSS `font-family:` syntax but tsx/jsx files use `fontFamily:` for inline styles
- **Fix:** Extended regex to `(?:font-family|fontFamily)\s*:\s*`
- **Files modified:** runtimes/claude-code/hooks/motif-font-check.js
- **Verification:** `fontFamily: "Helvetica"` in .tsx files correctly flags the banned font
- **Committed in:** ef3c885

**3. [Rule 1 - Bug] Fixed border-radius 0px false pass for 10px/20px**
- **Found during:** Task 1 (token-check hook)
- **Issue:** String-based `match.includes('0px')` would incorrectly skip `10px`, `20px`, etc.
- **Fix:** Used `parseInt` on captured numeric group for exact value comparison
- **Files modified:** runtimes/claude-code/hooks/motif-token-check.js
- **Verification:** `border-radius: 0px` passes; `border-radius: 10px` correctly flags
- **Committed in:** ef3c885

---

**Total deviations:** 3 auto-fixed (2 bug fixes, 1 missing critical)
**Impact on plan:** All fixes necessary for correctness. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Three compliance hooks ready for installer integration (Plan 02)
- Hook scripts are standalone Node.js files with zero dependencies
- Settings.json configuration pattern documented in 06-RESEARCH.md for Plan 02 to implement

## Self-Check: PASSED

All files verified on disk, all commits found in git history, all must_haves content patterns confirmed.

---
*Phase: 06-hooks-and-scripts*
*Completed: 2026-03-02*
