---
phase: 19-global-cli-core
plan: 01
subsystem: cli
tags: [node-cli, subcommand-router, project-root-detection, backward-compat]

requires:
  - phase: none
    provides: standalone refactor of existing bin/install.js
provides:
  - Subcommand-routed CLI entry point (bin/cli.js)
  - Extracted init command (bin/commands/init.js)
  - Project root detection utility (bin/lib/find-root.js)
  - Self-referencing dependency bug fix in package.json
affects: [20-global-cli-commands, npm-publish, e2e-tests]

tech-stack:
  added: [node:util parseArgs with allowPositionals]
  patterns: [subcommand routing via commands map, project root walk-up detection, backward-compat shim]

key-files:
  created:
    - bin/cli.js
    - bin/commands/init.js
    - bin/lib/find-root.js
  modified:
    - package.json
    - bin/install.js

key-decisions:
  - "Backward-compat shim in bin/install.js delegates to commands/init.js for seamless transition"
  - "Unrecognized subcommands fall through to init for npx motif-design@latest backward compatibility"
  - "findProjectRoot checks .git (file or directory) and package.json as root indicators"

patterns-established:
  - "Subcommand dispatch: commands map in cli.js, each command exports run(args)"
  - "Project root detection before any file operations"
  - "pkgDir via path.resolve(__dirname, '..', '..') for nested command modules"

duration: 4min
completed: 2026-03-09
---

# Phase 19 Plan 01: CLI Router and Init Extraction Summary

**Subcommand-routed CLI entry point with project root detection, replacing single-file installer**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-09T14:25:57Z
- **Completed:** 2026-03-09T14:30:19Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Refactored monolithic bin/install.js into subcommand-routed CLI architecture
- Fixed self-referencing dependency bug (motif-design depending on itself) that broke npm install -g
- Added project root detection so motif init works from subdirectories
- Preserved full backward compatibility with npx motif-design@latest usage

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix package.json and create CLI router** - `ae3866c` (feat)
2. **Task 2: Extract init command and add project root detection** - `91504a8` (feat)

## Files Created/Modified
- `bin/cli.js` - Subcommand router entry point with --help, --version, and init dispatch
- `bin/commands/init.js` - Extracted install logic with project root detection and args parameter
- `bin/lib/find-root.js` - Walk-up utility finding .git or package.json as root indicators
- `bin/install.js` - Reduced to 5-line backward-compat shim
- `package.json` - Removed self-referencing dependency, updated bin to cli.js

## Decisions Made
- Backward-compat shim kept in bin/install.js so e2e tests and external references still work
- Unrecognized first positional args fall through to init (preserves `npx motif-design@latest --force`)
- findProjectRoot checks both .git directory and .git file (for git worktrees)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed trailing comma in package.json after dependency removal**
- **Found during:** Task 1
- **Issue:** Removing the dependencies field left a trailing comma after keywords array, making package.json invalid JSON
- **Fix:** Removed the trailing comma
- **Files modified:** package.json
- **Verification:** Node.js successfully parses package.json
- **Committed in:** ae3866c (Task 1 commit)

**2. [Rule 1 - Bug] Fixed pkgDir path calculation for nested command module**
- **Found during:** Task 2
- **Issue:** Used `path.dirname(path.dirname(__filename))` which resolved to `bin/` instead of project root since init.js is now at `bin/commands/init.js`
- **Fix:** Changed to `path.resolve(__dirname, '..', '..')` to correctly navigate from bin/commands/ to project root
- **Files modified:** bin/commands/init.js (4 occurrences)
- **Verification:** `node bin/cli.js init --dry-run --runtime claude-code` reads package.json correctly
- **Committed in:** 91504a8 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both auto-fixes necessary for correctness. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- CLI router ready for Phase 20 to add status, update, doctor, list subcommands
- Commands map in cli.js designed for easy extension
- bin/commands/ directory established as the command module location

---
*Phase: 19-global-cli-core*
*Completed: 2026-03-09*
