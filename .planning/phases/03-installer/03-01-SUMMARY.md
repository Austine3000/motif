---
phase: 03-installer
plan: 01
subsystem: cli
tags: [node, cli, installer, npm, npx, zero-dependencies]

# Dependency graph
requires:
  - phase: 01-agent-definitions
    provides: Agent .md files copied by installer to .claude/get-motif/agents/
  - phase: 02-templates
    provides: Template files copied by installer to .claude/get-motif/templates/
provides:
  - package.json for npm distribution with bin entry
  - bin/install.js complete fresh-install pipeline (detect, resolve, copy, inject, verify)
  - Manifest-based install tracking (.motif-manifest.json)
  - {FORGE_ROOT} and .claude/get-design-forge path resolution at install time
  - Sentinel-based CLAUDE.md config injection
affects: [03-02-upgrade, 03-03-uninstall, 04-rebrand, 10-battle-test]

# Tech tracking
tech-stack:
  added: []
  patterns: [synchronous-pipeline, sentinel-injection, manifest-tracking, path-traversal-guard, zero-dependency-cli]

key-files:
  created:
    - package.json
    - bin/install.js
  modified: []

key-decisions:
  - "Resolve {FORGE_ROOT} at install time (not runtime) for zero-ambiguity agent reads"
  - "Also resolve .claude/get-design-forge to .claude/get-motif during copy for rebrand compatibility"
  - "Uninstall stub returns exit 1 -- deferred to Plan 02"
  - "Scripts/ directory copied even if empty -- graceful skip via existsSync check"

patterns-established:
  - "Pipeline pattern: parseFlags -> detectRuntime -> resolveMapping -> copyFiles -> injectConfig -> writeManifest -> verify -> printSummary"
  - "Sentinel injection: <!-- MOTIF-START --> / <!-- MOTIF-END --> markers for idempotent config injection"
  - "Content resolution: resolveContent() handles both {FORGE_ROOT} variable and hardcoded old path references"
  - "Path traversal guard: all target paths validated with path.resolve() + startsWith(cwd + sep)"

# Metrics
duration: 3min
completed: 2026-03-01
---

# Phase 3 Plan 1: Fresh Install Pipeline Summary

**npx-compatible installer with 9-stage sync pipeline: CLI parsing, runtime detection, source mapping, recursive file copy with {FORGE_ROOT} resolution, sentinel-based CLAUDE.md injection, SHA-256 manifest, and post-install verification**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-01T21:05:40Z
- **Completed:** 2026-03-01T21:09:23Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created package.json for npm distribution with correct bin, files, engines fields and zero dependencies
- Built bin/install.js as a single-file 430-line synchronous pipeline using only Node.js 22+ stdlib
- All 31 files (references, workflows, templates, agents, commands) copy correctly to target paths
- {FORGE_ROOT} and .claude/get-design-forge path references fully resolved in all .md files
- CLAUDE.md config injection handles create, append, and replace cases with sentinel markers
- Post-install verification catches unresolved paths, missing directories, and missing sentinels
- --dry-run, --force, --runtime, --help, --uninstall flags all functional

## Task Commits

Each task was committed atomically:

1. **Task 1: Create package.json for npm distribution** - `1077a18` (feat)
2. **Task 2: Build bin/install.js -- complete fresh-install pipeline** - `74b122a` (feat)

## Files Created/Modified
- `package.json` - npm package configuration: name "motif", bin entry, files whitelist, engines >=22.0.0, zero dependencies
- `bin/install.js` - Complete fresh-install pipeline: 9 stages, 430 lines, zero npm dependencies, Node.js 22+ stdlib only

## Decisions Made
- Resolve {FORGE_ROOT} at install time rather than at agent read-time, matching requirements and eliminating ambiguity for AI agents reading installed files
- Apply .claude/get-design-forge -> .claude/get-motif resolution alongside {FORGE_ROOT} for rebrand compatibility (Phase 4 handles full text rebrand)
- Uninstall prints stub message and exits 1 -- full implementation deferred to Plan 02
- Gracefully skip missing source directories (scripts/, hooks/) with fs.existsSync check rather than erroring

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- package.json and bin/install.js ready for upgrade logic (Plan 02) and uninstall (Plan 02)
- Manifest structure established for upgrade diffing
- Sentinel markers in place for config re-injection
- Path resolution pattern established for any new .md files added in future phases

## Self-Check: PASSED

- FOUND: package.json
- FOUND: bin/install.js
- FOUND: 03-01-SUMMARY.md
- FOUND: commit 1077a18
- FOUND: commit 74b122a

---
*Phase: 03-installer*
*Completed: 2026-03-01*
