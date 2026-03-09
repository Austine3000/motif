---
phase: 23-nextjs-scaffolding-and-web-composition
plan: 01
subsystem: ui
tags: [init, framework-recommendation, shadcn, nextjs, scaffolding]

# Dependency graph
requires:
  - phase: 22-platform-foundation
    provides: framework-registry.json with platform entries, token transformer
provides:
  - Framework recommendation logic in init.md (keyword-to-platform mapping)
  - shadcn postInstall config and scaffold sequence in framework-registry.json
affects: [23-02, 23-03, phase-24, phase-25]

# Tech tracking
tech-stack:
  added: [shadcn/ui]
  patterns: [keyword-based-framework-recommendation, scaffold-sequence-ordering]

key-files:
  created: []
  modified:
    - .claude/commands/motif/init.md
    - .claude/get-motif/references/framework-registry.json

key-decisions:
  - "Brownfield detection takes priority over keyword recommendation"
  - "web-nextjs is the default recommendation for ambiguous project descriptions"
  - "Scaffold sequence: create-next-app -> shadcn init -> shadcn add -> Motif globals.css (shadcn overwrites globals.css so Motif writes last)"

patterns-established:
  - "Framework recommendation: keyword matching on Round 1 answer with accept/override UX"
  - "scaffoldSequence field documents correct tool execution order"

# Metrics
duration: 1min
completed: 2026-03-10
---

# Phase 23 Plan 01: Framework Recommendation and shadcn Registry Summary

**Keyword-based framework recommendation in init.md with shadcn/ui postInstall and scaffold sequence in framework-registry.json**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-09T23:39:13Z
- **Completed:** 2026-03-09T23:40:34Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Framework recommendation logic maps project description keywords to platform suggestions (dashboard->nextjs, landing->static, SPA->vite, mobile->expo)
- Recommendation presented before Round 4 platform question with accept/override flow
- framework-registry.json web-nextjs entry now includes shadcn postInstall, core component list, and documented scaffold sequence

## Task Commits

Each task was committed atomically:

1. **Task 1: Add framework recommendation logic to init.md** - `6292223` (feat)
2. **Task 2: Update framework-registry.json with shadcn postInstall** - `2474918` (feat)

## Files Created/Modified
- `.claude/commands/motif/init.md` - Added Framework Recommendation section with keyword-to-platform mapping and Round 4 post-platform scaffolding note
- `.claude/get-motif/references/framework-registry.json` - Added shadcn postInstall, shadcn config block, and scaffoldSequence to web-nextjs entry

## Decisions Made
- Brownfield detection takes priority over keyword recommendation (already-detected platform skips recommendation)
- web-nextjs as default for ambiguous descriptions (most versatile)
- Scaffold sequence matters: create-next-app first, then shadcn init, then Motif globals.css last (shadcn init overwrites globals.css)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Init.md ready to recommend frameworks during user interviews
- framework-registry.json ready for downstream scaffolding workflow (Plan 02/03)
- shadcn core components list available for scaffold automation

---
*Phase: 23-nextjs-scaffolding-and-web-composition*
*Completed: 2026-03-10*
