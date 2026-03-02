---
phase: 06-hooks-and-scripts
plan: 03
subsystem: installer
tags: [settings-json, PostToolUse, statusLine, hook-registration, claude-code-config]

# Dependency graph
requires:
  - phase: 06-hooks-and-scripts
    provides: "Hook scripts (01) and context monitor (02) to register in settings.json"
  - phase: 03-installer
    provides: "bin/install.js with copy mapping and config injection patterns"
provides:
  - "Installer hooks copy mapping -- runtimes/claude-code/hooks/ -> .claude/get-motif/hooks/"
  - "settings.json injection -- PostToolUse hooks + statusLine configuration"
  - "settings.json cleanup -- uninstall removes Motif entries preserving non-Motif settings"
affects: [07-battle-test, installer]

# Tech tracking
tech-stack:
  added: []
  patterns: [JSON merge with idempotent dedup, settings.json PostToolUse/statusLine schema, empty-object cleanup on uninstall]

key-files:
  created: []
  modified:
    - bin/install.js

key-decisions:
  - "injectHookSettings placed after injectConfig in main flow to ensure .claude/ directory exists"
  - "removeHookSettings placed before removeConfigSnippet in uninstall to clean settings before directory removal"
  - "Empty settings.json deleted on uninstall rather than leaving an empty object"

patterns-established:
  - "settings.json merge pattern: load existing -> filter Motif entries -> add fresh -> write"
  - "Motif entry identification: matcher === 'Write|Edit' && hooks containing 'motif' in command"
  - "Uninstall cleanup chain: files -> dirs -> settings.json -> CLAUDE.md -> manifest -> backup"

# Metrics
duration: 2min
completed: 2026-03-02
---

# Phase 6 Plan 03: Installer Hooks Integration Summary

**Installer updated with hooks copy mapping, settings.json PostToolUse/statusLine injection, idempotent re-install dedup, and clean uninstall preserving non-Motif settings**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-02T11:23:07Z
- **Completed:** 2026-03-02T11:25:33Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Hooks directory added to installer copy mapping -- runtimes/claude-code/hooks/ copies to .claude/get-motif/hooks/ during installation
- settings.json created/merged with PostToolUse configuration (3 compliance hooks on Write|Edit matcher) and statusLine (context monitor)
- Re-install is idempotent: removes existing Motif PostToolUse group before adding fresh entries, preventing duplicates
- Uninstall removes Motif entries from settings.json while preserving non-Motif settings; deletes file entirely if only Motif entries existed
- Verification step confirms settings.json contains expected PostToolUse hooks and statusLine after install

## Task Commits

Each task was committed atomically:

1. **Task 1: Add hooks copy mapping to installer** - `998b2aa` (feat)
2. **Task 2: Add settings.json injection and cleanup to installer** - `d421a60` (feat)

## Files Created/Modified
- `bin/install.js` - Updated with hooks copy mapping in resolveMapping(), injectHookSettings() for PostToolUse/statusLine configuration, removeHookSettings() for clean uninstall, and settings.json verification in verify()

## Decisions Made
- `injectHookSettings()` is called after `injectConfig()` in the main flow, ensuring the .claude/ directory already exists from file copy operations
- `removeHookSettings()` is called before `removeConfigSnippet()` in uninstall, so settings.json cleanup happens before empty directory removal
- When settings.json becomes empty after removing Motif entries, the file is deleted rather than leaving an empty `{}` object

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All Phase 6 plans complete: compliance hooks (01), utility scripts (02), and installer integration (03)
- After `npx motif@latest`, hooks are both on disk AND registered in settings.json -- Claude Code will execute them on Write/Edit events
- Context monitor statusLine is registered and will display context usage in real-time
- Ready for Phase 7 battle testing with full hook enforcement active

## Self-Check: PASSED

All artifacts verified:
- bin/install.js exists on disk with hooks integration
- Task 1 commit 998b2aa found in git history
- Task 2 commit d421a60 found in git history
- Must-have patterns confirmed: hooks.*dest mapping, PostToolUse, injectHookSettings, removeHookSettings, settings.json

---
*Phase: 06-hooks-and-scripts*
*Completed: 2026-03-02*
