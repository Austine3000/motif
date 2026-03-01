---
phase: 01-agent-definitions
plan: 03
subsystem: agents
tags: [claude-code, subagent, fix-agent, design-system, code-editing, sonnet]

# Dependency graph
requires:
  - phase: none
    provides: "Standalone agent definition -- uses context-engine.md and fix.md as read-only inputs"
provides:
  - "Fix Agent definition (AGNT-05) at runtimes/claude-code/agents/forge-fix-agent.md"
  - "Scope-limited mechanical fixer personality with review-driven execution"
  - "Context loading profile for fix agent (REVIEW.md as primary input)"
affects: [02-templates, 03-installer, 07-validation, fix-workflow]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "YAML frontmatter + markdown body agent definition format"
    - "Inline context loading profiles (always_load/never_load)"
    - "Model tier abstraction via aliases with tier comments"
    - "Positive/negative behavioral instruction pattern"

key-files:
  created:
    - "runtimes/claude-code/agents/forge-fix-agent.md"
  modified: []

key-decisions:
  - "Used model: sonnet (medium tier) per user locked decision, despite research suggesting haiku could suffice"
  - "No Load If Exists section -- fix agent has a minimal, focused context profile"
  - "Full tool set (Read, Write, Edit, Grep, Glob, Bash) -- needs Edit for precise code modifications"

patterns-established:
  - "Scope restriction sections as role-specific agent content"
  - "Fix priority order (critical > major > minor) as structured execution guidance"
  - "Self-review checklist reuse from composer workflow"

# Metrics
duration: 2min
completed: 2026-03-01
---

# Phase 01 Plan 03: Fix Agent Definition Summary

**Scope-limited fix agent (AGNT-05) with mechanical compliance personality, sonnet model tier, and review-driven execution using REVIEW.md as primary input**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-01T13:23:58Z
- **Completed:** 2026-03-01T13:25:52Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Created forge-fix-agent.md with the most constrained personality in the Design Forge pipeline
- Mechanical compliance personality: follows review instructions exactly, never freelances or restyles
- Context profile correctly loads REVIEW.md as primary input with tokens.css and COMPONENT-SPECS.md
- Fix priority order (critical > major > minor) and scope restrictions as role-specific sections
- Quality checklist including grep-based hardcoded value detection

## Task Commits

Each task was committed atomically:

1. **Task 1: Create forge-fix-agent.md agent definition** - `7311461` (feat)

## Files Created/Modified
- `runtimes/claude-code/agents/forge-fix-agent.md` - Fix Agent definition with YAML frontmatter (name, description, model: sonnet, full tool set) and markdown body (personality, context profile, domain expertise, fix priority order, scope restrictions, output format, quality checklist, examples)

## Decisions Made
- **Model: sonnet over haiku** -- Research recommended haiku (fast tier) since fix agent follows prescriptive instructions. However, user's locked decision states "researcher and fixer get mid-tier." Used sonnet per user decision. The model field is trivially changeable if Phase 7 testing shows haiku produces equivalent results.
- **No Load If Exists section** -- The fix agent's context-engine.md profile has no load_if_exists entries, only always_load and never_load. This reflects the fix agent's focused scope: it only needs the review, tokens, component specs, and source code.
- **Full tool set including Edit** -- The fix agent needs Edit (not just Write) for precise line-level modifications to existing source code. This distinguishes it from the reviewer (which only reads and writes reports) and the researcher (which only writes new files).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 3 plans in Phase 01 can now execute (01-01 researcher/system-architect, 01-02 composer/reviewer, 01-03 fix agent)
- Agent definitions are ready for Phase 02 (templates) which defines the output formats these agents produce
- Phase 03 (installer) will copy agent files from runtimes/claude-code/agents/ to .claude/agents/
- Phase 07 (validation) will test whether the fix agent's sonnet model can be downgraded to haiku

## Self-Check: PASSED

- [x] runtimes/claude-code/agents/forge-fix-agent.md -- FOUND
- [x] Commit 7311461 -- FOUND
- [x] .planning/phases/01-agent-definitions/01-03-SUMMARY.md -- FOUND

---
*Phase: 01-agent-definitions*
*Completed: 2026-03-01*
