---
phase: 23-nextjs-scaffolding-and-web-composition
plan: 02
subsystem: ui
tags: [tailwind-v4, shadcn, css-custom-properties, design-tokens, globals-css]

# Dependency graph
requires:
  - phase: 22-platform-foundation
    provides: "token-transformer.js with parseTokensCSS and categorizeTokens exports"
provides:
  - "tailwind-config-generator.js: deterministic tokens.css to globals.css converter"
  - "Three-layer token bridge: Motif tokens, shadcn semantic mapping, Tailwind @theme"
  - "Pipeline integration via Step 3c in generate-system.md"
affects: [23-nextjs-scaffolding-and-web-composition, motif-compose, motif-system]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Three-layer CSS token bridge (Motif -> shadcn -> Tailwind @theme)", "Namespace collision avoidance via --color- prefix remapping"]

key-files:
  created: [".claude/get-motif/scripts/tailwind-config-generator.js"]
  modified: [".claude/get-motif/workflows/generate-system.md"]

key-decisions:
  - "color-* tokens map directly in @theme (no double prefix); surface-/text-/border- tokens remap to --color-* namespace"
  - "Font family tokens excluded from :root Layer 1 (next/font runtime injection); included in @theme as var references"
  - "Require of token-transformer.js deferred after --help check to avoid module-level arg parsing conflict"

patterns-established:
  - "Tailwind v4 @theme inline pattern for custom design token registration"
  - "Non-blocking script integration: exit code 1 warns but does not block pipeline"

# Metrics
duration: 3min
completed: 2026-03-10
---

# Phase 23 Plan 02: Tailwind Config Generator Summary

**Deterministic tokens.css to three-layer globals.css converter bridging Motif tokens, shadcn semantics, and Tailwind v4 @theme inline declarations**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-09T23:39:25Z
- **Completed:** 2026-03-09T23:42:59Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created tailwind-config-generator.js (410 lines) that deterministically converts any Motif tokens.css into a Tailwind v4 + shadcn-compatible globals.css
- Correctly handles Tailwind v4 namespace collisions: text-primary (color) maps to --color-text-primary, text-xs (size) stays out of @theme
- Integrated into generate-system.md pipeline as Step 3c, conditional on web-nextjs or web-vite platform

## Task Commits

Each task was committed atomically:

1. **Task 1: Create tailwind-config-generator.js** - `4a8fc97` (feat)
2. **Task 2: Integrate into generate-system.md pipeline** - `a6131fb` (feat)

## Files Created/Modified
- `.claude/get-motif/scripts/tailwind-config-generator.js` - Deterministic tokens.css to globals.css converter with three layers
- `.claude/get-motif/workflows/generate-system.md` - Added Step 3c for Tailwind token bridge generation

## Decisions Made
- color-* tokens use direct mapping in @theme (already in Tailwind color namespace); surface-/text-/border- tokens get --color- prefix to avoid collisions
- Font family tokens excluded from :root (next/font provides at runtime) but included in @theme as var references for utility class support
- Deferred require of token-transformer.js after --help check to avoid its module-level arg parsing intercepting CLI flags

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed double-prefix on color-* tokens in @theme Layer 3**
- **Found during:** Task 1 (verification step)
- **Issue:** color-primary-50 was being output as --color-color-primary-50 instead of --color-primary-50
- **Fix:** Changed color-* token mapping to use `--${name}` instead of `--color-${name}` since name already includes the color- prefix
- **Files modified:** .claude/get-motif/scripts/tailwind-config-generator.js
- **Verification:** Re-ran generator, confirmed correct --color-primary-50 output
- **Committed in:** 4a8fc97 (Task 1 commit)

**2. [Rule 3 - Blocking] Fixed module-level arg parsing conflict with token-transformer.js**
- **Found during:** Task 1 (verification step)
- **Issue:** token-transformer.js checks --help at module scope, intercepting our --help flag when required
- **Fix:** Moved --help check before the require statement; deferred import after CLI arg handling
- **Files modified:** .claude/get-motif/scripts/tailwind-config-generator.js
- **Verification:** --help now shows tailwind-config-generator help, not token-transformer help
- **Committed in:** 4a8fc97 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking)
**Impact on plan:** Both fixes essential for correct operation. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviations above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- globals.css generation ready for use in Next.js scaffolding (Plan 03)
- Pipeline integration complete: running /motif:system on web-nextjs or web-vite projects will auto-generate globals.css
- Token bridge provides shadcn compatibility layer needed for component composition

---
*Phase: 23-nextjs-scaffolding-and-web-composition*
*Completed: 2026-03-10*
