---
phase: 27-nextjs-scaffold-execution
plan: 01
subsystem: scaffold
tags: [nextjs, create-next-app, shadcn, tailwind, scaffold, materialization]

# Dependency graph
requires:
  - phase: 24-vite-static-and-brownfield
    provides: scaffold-project.js generic runner and materialization pattern
  - phase: 23
    provides: framework-registry.json web-nextjs entry, composer-nextjs.md overlay
provides:
  - web-nextjs materialization contract in framework-registry.json
  - scaffold detection via .motif-scaffolded marker
  - Next.js verification checklist in generate-system.md
  - Scaffold detection step (2d) in compose-screen.md
affects: [28-auto-run-cleanup-and-validation, compose-screen, generate-system]

# Tech tracking
tech-stack:
  added: []
  patterns: [registry-driven scaffold materialization for Next.js App Router]

key-files:
  modified:
    - .claude/get-motif/references/framework-registry.json
    - .claude/get-motif/workflows/generate-system.md
    - .claude/get-motif/workflows/compose-screen.md

key-decisions:
  - "Next.js materialization owns src/app/globals.css and src/theme/tokens.ts as design artifact destinations"
  - ".motif-scaffolded marker file enables compose-screen to detect real scaffold output"
  - "Starter page.tsx uses Tailwind utilities matching composer-nextjs overlay conventions"

patterns-established:
  - "Scaffold detection: all platforms write .motif-scaffolded marker for downstream detection"
  - "Materialization contract: ownedFiles + designArtifacts + templates pattern applies to all platforms"

# Metrics
duration: 5min
completed: 2026-03-24
---

# Phase 27 Plan 01: Next.js Scaffold Execution Summary

**Registry-driven Next.js materialization contract with create-next-app, shadcn, and Tailwind token bridge wiring into compose and auto-run flow**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-24T07:28:42Z
- **Completed:** 2026-03-24T07:33:49Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Added complete materialization contract for web-nextjs in framework-registry.json (ownedFiles, designArtifacts, templates, runtimeDestinations)
- Wired generate-system.md to verify Next.js scaffold outputs (package.json, src/app/, shadcn components, globals.css, tokens.ts, .motif-scaffolded)
- Added scaffold detection step to compose-screen.md so composition consumes real scaffold output instead of stubs

## Task Commits

Each task was committed atomically:

1. **Task 1: Register a Next.js scaffold runner for create-next-app** - `5660ec7` (feat)
2. **Task 2: Wire the runnable Next.js project into the composition and auto-run flow** - `c87f198` (feat)

## Files Created/Modified
- `.claude/get-motif/references/framework-registry.json` - Added materialization block, runtimeDestinations, ownedFiles, designArtifacts, and starter templates for web-nextjs
- `.claude/get-motif/workflows/generate-system.md` - Added web-nextjs verification checklist in Step 3d
- `.claude/get-motif/workflows/compose-screen.md` - Added Step 2d scaffold detection with .motif-scaffolded marker check

## Decisions Made
- Next.js globals.css destination is `src/app/globals.css` (matches create-next-app default location, overwritten with Motif token bridge)
- Next.js tokens.ts destination is `src/theme/tokens.ts` (consistent with web-vite pattern)
- Starter page.tsx uses Tailwind utility classes (not inline CSS vars) matching composer-nextjs overlay conventions
- .motif-scaffolded marker provides a simple detection mechanism for downstream workflows

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- The init -> scaffold -> compose -> auto-run integration path is now executable for Next.js
- SCAF-02 gap is closed: registry declares executable scaffold command and materialization contract
- Ready for Phase 28 auto-run cleanup and validation

## Self-Check: PASSED

All files and commits verified:
- framework-registry.json: FOUND
- generate-system.md: FOUND
- compose-screen.md: FOUND
- 27-01-SUMMARY.md: FOUND
- commit 5660ec7: FOUND
- commit c87f198: FOUND

---
*Phase: 27-nextjs-scaffold-execution*
*Completed: 2026-03-24*
