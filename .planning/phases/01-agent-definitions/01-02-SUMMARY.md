---
phase: 01-agent-definitions
plan: 02
subsystem: agents
tags: [claude-code-subagents, design-system, screen-composition, design-review, accessibility, nielsen-heuristics, wcag]

# Dependency graph
requires:
  - phase: 01-agent-definitions
    provides: "Research findings on Claude Code subagent format, model tiers, tool restrictions, context profiles"
provides:
  - "forge-screen-composer.md -- AGNT-03 screen composer agent definition"
  - "forge-design-reviewer.md -- AGNT-04 design reviewer agent definition"
affects: [01-agent-definitions, 03-templates, 07-battle-test]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "YAML frontmatter + markdown body agent definition format"
    - "Model tier comments (# Tier: HIGH) for abstract tier documentation"
    - "Inline context loading profiles (Always Load / Load If Exists / Never Load)"
    - "Anti-slop checklist pattern for domain-specific quality enforcement"
    - "4-lens scoring rubric for systematic design review"

key-files:
  created:
    - "runtimes/claude-code/agents/forge-screen-composer.md"
    - "runtimes/claude-code/agents/forge-design-reviewer.md"
  modified: []

key-decisions:
  - "Composer gets full tool set (including Edit) for token.css modifications; reviewer gets Edit disallowed to enforce separation of concerns"
  - "Both agents include good/bad code examples for behavioral calibration"
  - "Reviewer includes specific WCAG success criteria numbers (1.4.3, 2.4.7, 4.1.2, etc.) for precision"

patterns-established:
  - "Anti-slop checklist: before writing each component, run mental checks against common AI output failures"
  - "Issue format specification: Location + Problem + Impact + Exact fix (four-field requirement)"
  - "Lens-based scoring: independent scores per evaluation dimension with specific evidence"

# Metrics
duration: 5min
completed: 2026-03-01
---

# Phase 1 Plan 2: Screen Composer and Design Reviewer Agent Definitions Summary

**Opus-tier composer (creative/bold with token compliance) and reviewer (strict/critical with 4-lens scoring rubric) agent definitions with self-contained context profiles and role-specific quality checklists**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-01T13:23:54Z
- **Completed:** 2026-03-01T13:29:09Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Created forge-screen-composer.md with creative-but-disciplined personality, anti-slop checklist, self-review checklist, and good/bad token-compliant code examples
- Created forge-design-reviewer.md with strict/critical personality, 4-lens scoring rubric (Nielsen /30, WCAG /25, System Compliance /25, Vertical UX /20), and issue format requiring exact fixes
- Both agents have self-contained context loading profiles extracted from context-engine.md, eliminating need for runtime cross-referencing
- Clear separation of concerns: composer has Edit tool for code authoring; reviewer has Edit disallowed (diagnoses but never fixes)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create forge-screen-composer.md** - `03d9215` (feat)
2. **Task 2: Create forge-design-reviewer.md** - `094fe65` (feat)

## Files Created/Modified

- `runtimes/claude-code/agents/forge-screen-composer.md` -- Screen composition agent: creative personality, domain awareness, anti-slop checklist, self-review checklist, token-compliant code examples
- `runtimes/claude-code/agents/forge-design-reviewer.md` -- Design review agent: strict/critical personality, 4-lens scoring rubric, issue format specification, grep-based compliance verification

## Decisions Made

- Composer gets full tool set (Read, Write, Edit, Grep, Glob, Bash) because it may need to add missing tokens to tokens.css; reviewer gets Edit disallowed because its job is to diagnose and prescribe, not fix
- Both agents include brief examples (composer: good/bad token compliance; reviewer: critical/major issue format) to calibrate model behavior
- Reviewer includes specific WCAG success criteria numbers (1.4.3, 2.4.7, 4.1.2, 1.3.1, 2.1.1, 1.4.11) for precise auditing rather than vague accessibility guidance
- Vertical UX expertise section covers fintech, health, SaaS, and e-commerce patterns to support all planned verticals

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Two of five agent definitions complete (AGNT-03 and AGNT-04)
- Plan 03 (researcher, system architect, fix agent) will complete the remaining three definitions
- Both files follow the established skeleton pattern and can serve as templates for Plan 03

## Self-Check: PASSED

- FOUND: runtimes/claude-code/agents/forge-screen-composer.md
- FOUND: runtimes/claude-code/agents/forge-design-reviewer.md
- FOUND: .planning/phases/01-agent-definitions/01-02-SUMMARY.md
- FOUND: 03d9215 (Task 1 commit)
- FOUND: 094fe65 (Task 2 commit)

---
*Phase: 01-agent-definitions*
*Completed: 2026-03-01*
