---
phase: 16-validation-and-hardening
plan: 01
subsystem: tooling
tags: [validation, import-cycles, dfs, git-status, compose-pipeline]

# Dependency graph
requires:
  - phase: 13-scan-infrastructure
    provides: PROJECT-SCAN.md format and Props Summary table used for prop validation
  - phase: 14-token-and-system-integration
    provides: COMPONENT-GAP.md format used for existing component detection
provides:
  - compose-validator.js script for post-decomposition validation
  - Import cycle detection via DFS graph traversal
  - Naming conflict detection via git status parsing
  - Missing prop warnings via PROJECT-SCAN.md parsing
affects: [16-02 compose workflow integration, compose-screen.md]

# Tech tracking
tech-stack:
  added: []
  patterns: [DFS cycle detection on import graph, git status porcelain parsing, JSON stdout output for script-to-agent communication]

key-files:
  created: [scripts/compose-validator.js]
  modified: []

key-decisions:
  - "Used git status --porcelain for naming conflict detection rather than filesystem checks (files already written by validation time)"
  - "Import cycle detection only tracks inter-generated-file imports, excluding external packages and existing project files"
  - "Missing prop check is regex-based and best-effort, consistent with project-scanner.js approach"

patterns-established:
  - "Validator script JSON output: { status, screen, errors, warnings } with exit code 0/1"
  - "Brownfield checks gated behind artifact existence (PROJECT-SCAN.md, COMPONENT-GAP.md)"

# Metrics
duration: 2min
completed: 2026-03-06
---

# Phase 16 Plan 01: Compose Validator Summary

**Zero-dependency Node.js validator script with DFS import cycle detection, git-based naming conflict checks, and regex prop validation for compose pipeline**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-06T07:41:10Z
- **Completed:** 2026-03-06T07:42:42Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Built compose-validator.js with three validation checks (import cycles, naming conflicts, missing props)
- Import cycle detection uses standard DFS with visited/recursion-stack on an adjacency list of inter-file imports
- Naming conflict detection uses git status --porcelain to detect overwrites of existing project files
- Missing prop detection parses PROJECT-SCAN.md Props Summary and COMPONENT-GAP.md existing components
- Greenfield mode gracefully skips brownfield-only checks when scan artifacts are absent

## Task Commits

Each task was committed atomically:

1. **Task 1: Create compose-validator.js with import cycle detection** - `ad55c01` (feat)

## Files Created/Modified
- `scripts/compose-validator.js` - Post-decomposition validation script with cycle, conflict, and prop checks

## Decisions Made
- Used `git status --porcelain` for naming conflict detection -- since files are already written by validation time, checking `M` (modified) vs `A`/`??` (new) distinguishes overwrites from fresh files
- Only inter-generated-file imports are tracked for cycle detection -- external packages (react, next, etc.) and existing project files are excluded to avoid false positives
- Missing prop check is regex-based best-effort, consistent with project-scanner.js approach -- not AST-based

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- compose-validator.js is ready for integration into compose-screen.md (Plan 16-02)
- Script accepts --screen and --files args matching the compose subagent's file tracking
- JSON output format ready for agent parsing in validate-then-commit-or-rollback pattern

---
*Phase: 16-validation-and-hardening*
*Completed: 2026-03-06*
