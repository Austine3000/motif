---
phase: 09-foundation
plan: 01
subsystem: icon-library-reference
tags: [icons, design-tokens, selection-algorithm, CDN, icon-libraries]
provides:
  - "Curated icon library catalog with CDN URLs, usage syntax, weights, and licenses for Phosphor, Lucide, Material Symbols, and Tabler"
  - "Domain affinity matrix mapping each vertical to primary and secondary icon libraries"
  - "Deterministic selection algorithm: vertical + personality seed -> library + weight"
  - "Icon size tokens (--icon-sm through --icon-2xl) in the token generation pipeline"
  - "Icon name convention table with 15 verified UI concepts across all 4 libraries"
affects: [10-vocabularies, 11-pipeline, 12-enforcement]
tech-stack:
  added: []
  patterns: [deterministic-lookup-table, domain-affinity-matrix, 8px-multiple-icon-scale]
key-files:
  created:
    - core/references/icon-libraries.md
  modified:
    - core/workflows/generate-system.md
key-decisions:
  - "Fixed icon size scale (16/20/24/32/40px) -- not project-adjustable, consistent with spacing/typography invariants"
  - "rem units for icon tokens -- matches existing --space-* and --text-* convention"
  - "Token naming --icon-{scale} not --icon-size-{scale} -- follows --text-sm, --space-4, --radius-md pattern"
  - "Icon weight is part of algorithm output, not composer-decided -- ensures cross-screen consistency"
  - "No 36px token -- Health LogEntry 36x36 is a container dimension, icon inside is --icon-lg (24px)"
  - "currentColor inheritance for icon color -- no --icon-color-* tokens needed"
duration: 4min
completed: 2026-03-04
---

# Phase 9 Plan 1: Icon Library Foundation Summary

**Curated icon library reference with deterministic selection algorithm and 8px-multiple icon size tokens for the design system pipeline**

## Performance
- **Duration:** ~4 min
- **Tasks:** 2/2 completed
- **Files modified:** 2

## Accomplishments
- Created `core/references/icon-libraries.md` as the single source of truth for all icon library metadata, domain affinity mappings, and the selection algorithm
- Added Icon Library Decision Algorithm section to `core/workflows/generate-system.md` parallel to existing Color/Typography/Spacing algorithms
- Added 5 icon size tokens (`--icon-sm` through `--icon-2xl`) to the token template in `generate-system.md`
- Documented all 4 curated libraries with pinned CDN versions, usage syntax, weight variants, and licenses
- Created domain affinity matrix mapping each vertical (fintech, health, SaaS, e-commerce) to primary and secondary libraries
- Wrote deterministic selection algorithm with explicit boundary values (personality >= 7 for bold, >= 8 for library switch, etc.)
- Included icon name convention table with 15 common UI concepts verified across all 4 libraries

## Task Commits
1. **Task 1: Create icon-libraries.md reference document** - `37dd147`
2. **Task 2: Add icon tokens and algorithm to generate-system.md** - `7fde0bc`

## Files Created/Modified
- `core/references/icon-libraries.md` -- New file: curated library catalog, domain affinity matrix, selection algorithm, icon color rules, icon name conventions, CDN reference snippets
- `core/workflows/generate-system.md` -- Modified: Icon Library Decision Algorithm section (after Shadow, before Token File Format) and 5 icon size tokens in :root block (after z-index, before vertical-specific)

## Decisions & Deviations

### Key Decisions
- **Fixed scale, not adjustable:** Icon size scale (16/20/24/32/40px) is a system invariant like spacing base unit (4px). Making it per-project-adjustable would break component specs that reference specific size tokens.
- **rem units:** Consistent with existing `--space-*` and `--text-*` tokens. Icons scale with user font-size preference.
- **No 36px token:** Health LogEntry `[CategoryIcon 36x36]` is a container dimension (36px includes padding), not icon size. Icon inside is `--icon-lg` (24px).
- **Weight in algorithm output:** Weight is a system-level decision applied consistently, not left to composer discretion per screen.
- **currentColor for icon color:** No dedicated icon color tokens. Icons inherit `color` from parent via CSS `currentColor`.
- **Material Symbols version-pinning exception:** Google Fonts CDN is evergreen; documented as the ONE exception to version-pinning rule.

### Deviations
None -- plan executed exactly as written.

## Next Phase Readiness
- Phase 10 (Vertical Vocabularies) can read `icon-libraries.md` for library metadata and the icon name convention table pattern to create per-vertical icon vocabularies
- Phase 11 (Pipeline Integration) can read the Icon Library Decision Algorithm in `generate-system.md` and the icon size tokens in the Token File Format
- Phase 12 (Enforcement) can reference `icon-libraries.md` for valid library names and the selection algorithm for validation rules

## Self-Check: PASSED

- [x] core/references/icon-libraries.md -- EXISTS
- [x] core/workflows/generate-system.md -- EXISTS
- [x] .planning/phases/09-foundation/09-01-SUMMARY.md -- EXISTS
- [x] Commit 37dd147 -- FOUND
- [x] Commit 7fde0bc -- FOUND
