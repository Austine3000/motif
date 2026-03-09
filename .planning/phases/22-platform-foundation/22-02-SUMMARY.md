---
phase: 22-platform-foundation
plan: 02
subsystem: tooling
tags: [token-transformer, css-to-typescript, react-native, design-tokens, codegen]

requires:
  - phase: 22-01
    provides: framework-registry.json with platform token format mappings, motif-state.js for platform resolution
provides:
  - Deterministic CSS-to-TypeScript token converter (token-transformer.js)
  - Pipeline integration in generate-system.md (Step 3b)
  - Web tokens.ts output for React/Next.js platforms
  - Native tokens.native.ts output with RN shadow decomposition for Expo
affects: [23-nextjs-scaffolding, 24-vite-static, 25-expo-react-native, 26-cross-platform]

tech-stack:
  added: [node:crypto for SHA-256 hashing]
  patterns: [deterministic codegen from CSS source of truth, prefix-based token categorization with collision handling]

key-files:
  created:
    - .claude/get-motif/scripts/token-transformer.js
  modified:
    - .claude/get-motif/workflows/generate-system.md

key-decisions:
  - "Colors category preserves text-/surface-/border- prefixes in keys (only color- stripped) to avoid semantic ambiguity"
  - "text-* disambiguation uses suffix pattern matching: size suffixes (xs/sm/base/lg/xl/2xl/3xl/4xl) = typography, all else = colors"
  - "Native shadow uses first shadow only (RN limitation), elevation estimated as ceil(blur/2) capped at 24"
  - "Unknown platform falls back to generating both web and native formats"

patterns-established:
  - "Token naming collision resolution: suffix-first pattern matching before prefix-based categorization"
  - "Non-blocking pipeline integration: transformer failure warns but does not block design system generation"

duration: 3min
completed: 2026-03-10
---

# Phase 22 Plan 02: Token Transformer Summary

**Deterministic CSS-to-TypeScript token converter with text-* naming collision handling and RN shadow decomposition**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-09T22:58:14Z
- **Completed:** 2026-03-09T23:02:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created 629-line zero-dependency token-transformer.js that deterministically converts tokens.css to platform-specific TypeScript
- Correctly resolves --text-* naming collision (text-primary = color, text-base = typography) using suffix pattern matching
- Converts CSS values to React Native equivalents: rem to dp (x16), px to numeric, shadows to shadowColor/shadowOffset/shadowOpacity/shadowRadius/elevation
- Integrated transformer into generate-system.md pipeline as non-blocking Step 3b

## Task Commits

Each task was committed atomically:

1. **Task 1: Create token-transformer.js** - `9e7b51e` (feat)
2. **Task 2: Integrate token transformer into generate-system.md pipeline** - `ae8e642` (feat)

## Files Created/Modified
- `.claude/get-motif/scripts/token-transformer.js` - Deterministic CSS-to-TypeScript token converter (parseTokensCSS, categorizeTokens, generateWebTS, generateNativeTS, parseShadowForNative)
- `.claude/get-motif/workflows/generate-system.md` - Added Step 3b (Platform Token Files), updated verification checklist and context budget guidance

## Decisions Made
- Colors category preserves text-/surface-/border- prefixes in keys to avoid semantic ambiguity between text-primary (color) and color-primary-500 (scale)
- Font family stripping for native: only the primary font name is kept (fallbacks removed, quotes stripped)
- Duration values (150ms, 0.4s) pass through as strings in native output since RN Animated handles its own timing
- Pipeline integration is non-blocking: if transformer fails, user gets manual fallback instructions

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed prefix stripping for colors category**
- **Found during:** Task 1 verification
- **Issue:** Original stripPrefix removed all prefixes (color-, surface-, border-, text-) from color tokens, causing text-primary to become just "primary" which was semantically ambiguous with color-primary-500 becoming "primary500"
- **Fix:** Changed colors prefix stripping to only remove "color-" prefix, preserving text-/surface-/border- as part of the key name (textPrimary, surfacePrimary, borderPrimary)
- **Files modified:** .claude/get-motif/scripts/token-transformer.js
- **Verification:** tokens.ts output shows textPrimary and primary500 as distinct, semantically clear keys
- **Committed in:** 9e7b51e (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Auto-fix necessary for semantic correctness of generated token keys. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Token transformer ready for all platforms: web-nextjs, web-vite, web-static (skip), mobile-expo
- Phase 23 (Next.js scaffolding) can use tokens.ts output directly
- Phase 25 (Expo/RN) can use tokens.native.ts with proper RN shadow objects
- Phase 26 (cross-platform consistency) can verify token parity across formats

---
*Phase: 22-platform-foundation*
*Completed: 2026-03-10*
