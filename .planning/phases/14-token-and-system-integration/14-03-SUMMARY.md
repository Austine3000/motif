---
phase: 14-token-and-system-integration
plan: 03
subsystem: infra
tags: [brownfield, token-strategy, gap-analysis, system-generator, workflow-integration]

# Dependency graph
requires:
  - phase: 14-token-and-system-integration
    plan: 01
    provides: token-extractor.js producing TOKEN-INVENTORY.md
  - phase: 14-token-and-system-integration
    plan: 02
    provides: gap-analyzer.js producing COMPONENT-GAP.md
provides:
  - "generate-system.md brownfield steps (token strategy decision + gap analysis invocation)"
  - "motif-system-architect.md brownfield mode (adopt/merge/fresh strategies + component gap handling)"
  - "context-engine.md updated system-generator profile with brownfield artifacts"
  - "state-machine.md updated phase definitions and context budgets for brownfield"
affects: [15-compose-integration, 16-validation-and-hardening]

# Tech tracking
tech-stack:
  added: []
  patterns: [existence-gated-workflow-steps, conditional-context-passing, strategy-directive-pattern]

key-files:
  created: []
  modified:
    - core/workflows/generate-system.md
    - .claude/get-motif/agents/motif-system-architect.md
    - .claude/get-motif/references/context-engine.md
    - .claude/get-motif/references/state-machine.md

key-decisions:
  - "Token strategy presented as 3-option choice (adopt/merge/fresh) with merge as default"
  - "All brownfield additions existence-gated -- greenfield path has zero behavioral change"
  - "Existing components get reference-only specs to reduce COMPONENT-SPECS.md size"

patterns-established:
  - "Strategy directive pattern: orchestrator presents choice, stores result, passes to subagent"
  - "Conditional context passing: agent spawn includes brownfield files only when they exist"
  - "Graduated spec generation: full specs for missing, reference specs for existing components"

# Metrics
duration: 2min
completed: 2026-03-05
---

# Phase 14 Plan 03: System Generator Brownfield Integration Summary

**Token strategy decision (adopt/merge/fresh) and component-gap-aware spec generation wired into generate-system.md workflow and system architect agent**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-05T20:24:25Z
- **Completed:** 2026-03-05T20:26:57Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Added Step 1b (token strategy decision) and Step 1c (gap analysis invocation) to generate-system.md with full existence guards
- Added Brownfield Mode section to system architect agent covering all 3 strategies with anti-patterns
- Updated context-engine.md and state-machine.md to recognize brownfield artifacts in context loading and budgets
- All changes are purely additive -- greenfield workflow executes identically to before

## Task Commits

Each task was committed atomically:

1. **Task 1: Add brownfield steps to generate-system.md** - `d334bb0` (feat)
2. **Task 2: Add brownfield mode to system architect agent and update context references** - `03b53f9` (feat)

## Files Created/Modified
- `core/workflows/generate-system.md` - Added Step 1b (token strategy), Step 1c (gap analysis), conditional context in Step 2, budget tracking in Step 4
- `.claude/get-motif/agents/motif-system-architect.md` - Added Brownfield Mode section (adopt/merge/fresh), updated Load If Exists and Quality Checklist
- `.claude/get-motif/references/context-engine.md` - Added TOKEN-INVENTORY.md, COMPONENT-GAP.md, PROJECT-SCAN.md, CONVENTIONS.md to system-generator load_if_exists; added context budget entries
- `.claude/get-motif/references/state-machine.md` - Updated SYSTEM_GENERATED artifacts, /motif:system gate note, context budget table

## Decisions Made
- Token strategy presented as a 3-option choice with merge as default -- matches research recommendation from 14-RESEARCH.md
- All brownfield additions gated behind file existence checks -- ensures zero impact on greenfield projects
- Existing components get reference-only specs (~50 tokens each) to keep COMPONENT-SPECS.md within budget for brownfield projects with many existing components

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 14 complete: token extraction (14-01), gap analysis (14-02), and system generator integration (14-03) all wired together
- Ready for Phase 15 (Compose Integration) to wire brownfield artifacts into the composer workflow
- All brownfield artifacts flow: scan -> extract tokens -> analyze gaps -> strategy choice -> system generation

## Self-Check: PASSED

- core/workflows/generate-system.md: FOUND
- .claude/get-motif/agents/motif-system-architect.md: FOUND
- .claude/get-motif/references/context-engine.md: FOUND
- .claude/get-motif/references/state-machine.md: FOUND
- Commit d334bb0: FOUND
- Commit 03b53f9: FOUND

---
*Phase: 14-token-and-system-integration*
*Completed: 2026-03-05*
