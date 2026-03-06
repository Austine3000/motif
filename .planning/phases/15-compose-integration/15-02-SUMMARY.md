---
phase: 15-compose-integration
plan: 02
subsystem: ui
tags: [compose, decomposition, brownfield, component-reuse, conventions, workflow]

# Dependency graph
requires:
  - phase: 13-scan-infrastructure
    provides: PROJECT-SCAN.md, CONVENTIONS.md scan artifacts
  - phase: 14-token-and-system-integration
    provides: COMPONENT-GAP.md gap analysis, brownfield system generator
provides:
  - Decomposed screen composition (one component per file)
  - Brownfield project-directory file placement
  - Existing component import/reuse from COMPONENT-GAP.md
  - Convention-aware code generation from CONVENTIONS.md
  - Updated screen summary format with Files Imported section
affects: [16-validation-and-hardening, compose workflow, motif-compose]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Existence-gated brownfield instructions (greenfield unchanged)"
    - "Import hierarchy enforcement (page -> sections -> primitives)"
    - "Component reuse via COMPONENT-GAP.md lookup before generation"

key-files:
  created: []
  modified:
    - core/workflows/compose-screen.md
    - .claude/get-motif/workflows/compose-screen.md

key-decisions:
  - "All decomposition and brownfield additions are existence-gated -- greenfield behavior has zero changes"
  - "Subagent loads full scan artifacts (within ~15K token budget) rather than pre-extracting a slim context"
  - "150-line per-component limit enforced via agent instructions, not tooling"

patterns-established:
  - "Decomposition: every screen outputs one file per component with strict import hierarchy"
  - "Brownfield placement: read CONVENTIONS.md + PROJECT-SCAN.md to place files in project directories"
  - "Reuse-first: check COMPONENT-GAP.md before generating any component"

# Metrics
duration: 2min
completed: 2026-03-06
---

# Phase 15 Plan 02: Compose Workflow Decomposition, Placement, and Reuse Summary

**Compose workflow upgraded with per-component file decomposition, brownfield project-directory placement via scan artifacts, and existing component import/reuse from COMPONENT-GAP.md**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-06T06:12:14Z
- **Completed:** 2026-03-06T06:14:35Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Compose workflow agent prompt now decomposes every screen into individual component files (no monolithic output)
- Brownfield projects get files written to actual project directories using CONVENTIONS.md and PROJECT-SCAN.md
- Existing project components are imported from COMPONENT-GAP.md instead of recreated
- Updated screen summary format tracks both files created and files imported
- All additions are existence-gated so greenfield behavior is completely unchanged

## Task Commits

Each task was committed atomically:

1. **Task 1: Add brownfield context assembly and decomposition agent instructions** - `443a228` (feat)
2. **Task 2: Sync live copy of compose-screen.md** - `b02f10b` (chore)

## Files Created/Modified
- `core/workflows/compose-screen.md` - Canonical compose workflow with decomposition rules (B2), component reuse (B3), brownfield context assembly, updated anti-slop checks, self-review items, and new summary format
- `.claude/get-motif/workflows/compose-screen.md` - Live copy synced to match canonical (byte-identical)

## Decisions Made
- All decomposition and brownfield additions are existence-gated -- greenfield projects experience zero behavioral change
- Subagent loads full scan artifacts rather than pre-extracted slim context (total addition ~1500 tokens, within budget)
- 150-line per-component limit enforced via agent instructions rather than tooling validation

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Compose workflow is fully upgraded with decomposition, placement, and reuse capabilities
- Phase 15 is complete (both plans executed)
- Ready for Phase 16 (Validation and Hardening) which will add verification and edge-case handling

## Self-Check: PASSED

All files exist. All commits verified.

---
*Phase: 15-compose-integration*
*Completed: 2026-03-06*
