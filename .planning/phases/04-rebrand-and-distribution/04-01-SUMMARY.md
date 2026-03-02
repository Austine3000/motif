---
phase: 04-rebrand-and-distribution
plan: 01
subsystem: branding
tags: [rebrand, motif, git-mv, sed, installer, cli]

# Dependency graph
requires:
  - phase: 03-installer
    provides: "Working installer with forge-branded paths and variables"
provides:
  - "Fully Motif-branded source tree (zero forge references in core/, runtimes/, bin/)"
  - "Renamed commands/motif/ directory and motif-*.md agent files"
  - "Installer using motifRoot variable, {MOTIF_ROOT} template, commands/motif source path"
  - "CLAUDE.md sentinel block with /motif: commands"
affects: [04-02-distribution-artifacts, 04-03-final-verification]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Most-specific-first replacement ordering to prevent partial matches"
    - "git mv for renames to preserve history"

key-files:
  created: []
  modified:
    - "runtimes/claude-code/commands/motif/ (renamed from commands/forge/)"
    - "runtimes/claude-code/agents/motif-*.md (5 agent files renamed)"
    - "core/references/*.md (4 files)"
    - "core/workflows/*.md (7 files)"
    - "core/templates/STATE-TEMPLATE.md"
    - "runtimes/claude-code/CLAUDE-MD-SNIPPET.md"
    - "runtimes/opencode/README.md"
    - "runtimes/gemini/README.md"
    - "runtimes/cursor/README.md"
    - "bin/install.js"
    - "CLAUDE.md"

key-decisions:
  - "Applied replacement map in most-specific-first order to prevent partial match corruption"
  - "Removed .claude/get-design-forge fallback line from resolveContent() -- no longer needed after source files use {MOTIF_ROOT}"

patterns-established:
  - "Brand-safe naming: all product references use 'Motif'/'motif' consistently"

# Metrics
duration: 3min
completed: 2026-03-02
---

# Phase 4 Plan 1: Source Rebrand Summary

**Complete forge-to-motif rebrand across 33 source files: directory/file renames via git mv, content replacement map across core/runtimes, installer variable update, and CLAUDE.md sentinel block refresh**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-02T08:19:42Z
- **Completed:** 2026-03-02T08:23:32Z
- **Tasks:** 2
- **Files modified:** 33

## Accomplishments
- Renamed commands/forge/ directory to commands/motif/ and all 5 forge-*.md agent files to motif-*.md, preserving git history via git mv
- Applied 18-rule replacement map to 31 source files across core/, runtimes/ -- zero old-brand references remain
- Updated installer (bin/install.js): renamed forgeRoot to motifRoot, updated source path to commands/motif, replaced {FORGE_ROOT} with {MOTIF_ROOT}, removed obsolete .claude/get-design-forge fallback
- Refreshed CLAUDE.md sentinel block with Motif Rules heading and /motif: command references

## Task Commits

Each task was committed atomically:

1. **Task 1: Rename directories/files and apply replacement map** - `70ecffc` (feat)
2. **Task 2: Update installer and CLAUDE.md** - `1e136a0` (feat)

## Files Created/Modified
- `runtimes/claude-code/commands/motif/` - Renamed from commands/forge/ (10 command .md files)
- `runtimes/claude-code/agents/motif-*.md` - 5 renamed agent files (researcher, system-architect, screen-composer, design-reviewer, fix-agent)
- `core/references/*.md` - 4 reference docs (runtime-adapters, design-inputs, state-machine, context-engine)
- `core/workflows/*.md` - 7 workflow docs (research, generate-system, compose-screen, review, fix, evolve, quick)
- `core/templates/STATE-TEMPLATE.md` - State template with Motif State heading
- `runtimes/claude-code/CLAUDE-MD-SNIPPET.md` - Motif Rules snippet
- `runtimes/{opencode,gemini,cursor}/README.md` - Runtime placeholder READMEs
- `bin/install.js` - Installer with motifRoot, {MOTIF_ROOT}, commands/motif
- `CLAUDE.md` - Sentinel block with /motif: commands

## Decisions Made
- Applied replacement map in most-specific-first order (e.g., "Design Forge State" before "Design Forge") to prevent partial match corruption during sed processing
- Removed the `.replaceAll('.claude/get-design-forge', forgeRoot)` fallback line from resolveContent() since all source files now use {MOTIF_ROOT} after rebrand -- the fallback is no longer needed

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Source tree is fully Motif-branded, ready for distribution artifacts (README.md, LICENSE, package.json) in Plan 02
- Installer dry-run verified: shows correct motif paths and completes without errors
- All grep sweeps return zero old-brand references across core/, runtimes/, bin/

## Self-Check: PASSED

All files verified present. Both commit hashes confirmed in git log. Old forge directory and agent files confirmed absent. SUMMARY claims match disk state.

---
*Phase: 04-rebrand-and-distribution*
*Completed: 2026-03-02*
