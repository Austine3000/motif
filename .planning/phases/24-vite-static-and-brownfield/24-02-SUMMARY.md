---
phase: 24-vite-static-and-brownfield
plan: 02
subsystem: infra
tags: [motif, brownfield, scanner, web-static, vite, expo]
requires:
  - phase: 24-vite-static-and-brownfield-01
    provides: scaffold runner and platform registry contracts used by brownfield/static extensions
provides:
  - adoption-safe scanner framework detection with explicit brownfield action signals
  - init workflow rules for auto-adopt, ambiguity confirmation, and scaffold skipping
  - static starter templates and web-static compose destination mapping to runtime files
affects: [motif-init, motif-scan, motif-compose, scaffold-project, web-static]
tech-stack:
  added: [none]
  patterns:
    - explicit adoption signal model in PROJECT-SCAN output
    - web-static composition targets runtime site files instead of planning-only artifacts
key-files:
  created:
    - .planning/phases/24-vite-static-and-brownfield/24-02-SUMMARY.md
    - .claude/get-motif/references/starters/static/index.html
    - .claude/get-motif/references/starters/static/about.html
    - .claude/get-motif/references/starters/static/css/styles.css
    - .claude/get-motif/references/starters/static/js/main.js
  modified:
    - .claude/get-motif/scripts/project-scanner.js
    - .claude/commands/motif/init.md
    - .claude/get-motif/workflows/compose-screen.md
    - .claude/get-motif/references/framework-registry.json
key-decisions:
  - "Treat generic or conflicting React signatures as confirmation-required instead of auto-adopt."
  - "Expose scanner adoption intent directly in PROJECT-SCAN.md so init can consume one explicit decision surface."
  - "Route web-static composition to root HTML + shared css/js files while preserving non-static fallback behavior."
patterns-established:
  - "Brownfield adoption safety: only clear Next/Vite/Expo signatures are auto-adopted."
  - "Static runtime-first composition: index.html + slugged pages + css/styles.css + js/main.js."
requirements-completed: [SCAF-05, SCAF-06, COMP-04]
duration: 7min
completed: 2026-03-11
---

# Phase 24 Plan 02: Brownfield Detection and Static Runtime Paths Summary

**Brownfield detection now auto-adopts only clear Next/Vite/Expo projects while static web scaffolding and composition write into real openable site files.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-11T22:09:02Z
- **Completed:** 2026-03-11T22:15:21Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments
- Hardened scanner framework classification to distinguish supported platforms from ambiguous React and unknown projects.
- Updated init brownfield flow to adopt clear platforms, require confirmation for ambiguity/conflicts, and preserve scaffold skipping rules for adopted projects.
- Added static starter templates and updated compose rules so `web-static` writes to `index.html`, slugged pages, `css/styles.css`, and `js/main.js`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix scanner framework detection and return brownfield confidence instead of over-classifying React** - `f699413` (fix)
2. **Task 2: Update init brownfield adoption flow to adopt clear platforms, confirm ambiguity, and skip scaffolding when appropriate** - `5077d47` (feat)
3. **Task 3: Materialize the static starter and route web-static composition into real site files** - `77ee01f` (feat)

**Plan metadata:** recorded in final docs completion commit

## Files Created/Modified
- `.claude/get-motif/scripts/project-scanner.js` - Added explicit Next/Vite/Expo signatures, ambiguous React classification, and adoption signal output.
- `.claude/commands/motif/init.md` - Replaced brownfield gate/decision flow with scanner-signal-driven adopt/confirm/greenfield logic.
- `.claude/get-motif/workflows/compose-screen.md` - Added explicit static compose destination rules for runtime site files.
- `.claude/get-motif/references/framework-registry.json` - Wired `web-static` scaffold materialization to starter templates and token runtime destination.
- `.claude/get-motif/references/starters/static/index.html` - Home page starter linked to shared CSS and JS.
- `.claude/get-motif/references/starters/static/about.html` - Second page starter for multi-page shape.
- `.claude/get-motif/references/starters/static/css/styles.css` - Shared static site styling foundation.
- `.claude/get-motif/references/starters/static/js/main.js` - Progressive enhancement script for nav active state and footer year.

## Decisions Made
- Scanner output now includes a dedicated `Brownfield Adoption Signal` section to reduce downstream guesswork in init.
- Conflicting framework signatures are treated as ambiguous, forcing explicit confirmation instead of implicit platform selection.
- `web-static` composition now updates the scaffolded runtime files directly while keeping legacy non-static/no-overlay fallback unchanged.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Wired static starter templates into scaffold contract**
- **Found during:** Task 3 (Materialize static starter and compose destination)
- **Issue:** Creating starter files alone would not materialize them in scaffold output without registry wiring.
- **Fix:** Added `web-static.materialization.templateDir`, `about.html` generation, and `tokens.runtimeDestinations.tokensCss` in framework registry.
- **Files modified:** `.claude/get-motif/references/framework-registry.json`
- **Verification:** `node .claude/get-motif/scripts/phase24-fixture-check.js quick --target static-scaffold`
- **Committed in:** `77ee01f` (part of Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Deviation was required to make starter templates materialize in scaffolded output; no scope creep beyond plan intent.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 24 is now complete from the plan perspective, including non-Next brownfield safety and static runtime composition path.
- Remaining risk is runtime validation depth for all brownfield edge-case repos; fixture checks pass for the planned signatures.

## Self-Check: PASSED
- Verified summary and key implementation files exist on disk.
- Verified task commit hashes `f699413`, `5077d47`, and `77ee01f` exist in git history.

---
*Phase: 24-vite-static-and-brownfield*
*Completed: 2026-03-11*
