---
phase: 03-installer
plan: 02
subsystem: cli
tags: [node, cli, installer, upgrade, backup, uninstall, manifest, sha256]

# Dependency graph
requires:
  - phase: 03-installer
    plan: 01
    provides: bin/install.js fresh-install pipeline with manifest writing, hashFile(), walkAndCopy(), resolveContent()
provides:
  - Manifest-based upgrade tracking with SHA-256 hash diffing (shouldBackup)
  - Automatic backup of user-modified files to .motif-backup/ on re-install
  - Complete --uninstall functionality removing all installed files, sentinel block, manifest, and backups
  - --force flag to skip backup checks and overwrite unconditionally
affects: [03-03-verification, 04-rebrand, 10-battle-test]

# Tech tracking
tech-stack:
  added: []
  patterns: [manifest-hash-diffing, backup-before-overwrite, sentinel-stripping, bottom-up-directory-cleanup]

key-files:
  created: []
  modified:
    - bin/install.js

key-decisions:
  - "shouldBackup returns true (back up) when no manifest exists -- conservative safety for unknown state"
  - "shouldBackup returns true when file not in manifest -- unknown origin means back up"
  - "CLAUDE.md excluded from manifest file deletion during uninstall -- handled exclusively by sentinel stripping to preserve user content"
  - "Backup filenames use ISO timestamp with colons and dots replaced by dashes for filesystem safety"

patterns-established:
  - "Backup pattern: shouldBackup() checks existingManifest hash vs current file hash, backs up only user-modified files"
  - "Uninstall pattern: manifest iteration -> file removal -> cleanEmptyDirs (bottom-up) -> sentinel stripping -> manifest+backup cleanup"
  - "CLAUDE.md protection: never delete CLAUDE.md via manifest; always use sentinel block stripping to preserve non-Motif content"

# Metrics
duration: 4min
completed: 2026-03-01
---

# Phase 3 Plan 2: Upgrade Tracking and Uninstall Summary

**Manifest-based SHA-256 hash diffing for selective backup on re-install, and complete --uninstall that removes all installed files while preserving user content in CLAUDE.md**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-01T21:12:31Z
- **Completed:** 2026-03-01T21:16:46Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- shouldBackup() compares current file hash against manifest entry to detect user modifications -- unmodified files overwrite cleanly, modified files get backed up to .motif-backup/ with timestamped filenames
- --force flag bypasses all backup logic for unconditional overwrite
- Complete uninstall() removes all manifest-tracked files, cleans empty directories bottom-up, strips CLAUDE.md sentinel block (preserving user content), and deletes manifest + backup directory
- --dry-run works with both install (shows "Would back up") and --uninstall (lists files that would be removed)
- Repeated --uninstall on clean system correctly prints error and exits 1

## Task Commits

Each task was committed atomically:

1. **Task 1: Add manifest-based upgrade tracking and backup logic** - `2660756` (feat)
2. **Task 2: Implement --uninstall flag functionality** - `2429aea` (feat)

## Files Created/Modified
- `bin/install.js` - Added shouldBackup(), cleanEmptyDirs(), removeConfigSnippet(), uninstall() functions; integrated backup logic into walkAndCopy(); added existing manifest loading in main flow (+185 lines)

## Decisions Made
- shouldBackup() returns true (back up) when no manifest exists or file is missing from manifest -- conservative safety for unknown state, prevents silent data loss
- CLAUDE.md is excluded from manifest-based file deletion during uninstall -- handled exclusively via sentinel block stripping so user content outside the markers is always preserved
- Backup filenames use ISO timestamp with colons and dots replaced by dashes for cross-platform filesystem safety

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed CLAUDE.md deletion during uninstall destroying user content**
- **Found during:** Task 2 (uninstall verification)
- **Issue:** CLAUDE.md was listed in the manifest files and got deleted by the file removal loop before the sentinel stripping step could preserve non-Motif content
- **Fix:** Added claudeMdPaths check to skip CLAUDE.md and .claude/CLAUDE.md during manifest file iteration; sentinel stripping in removeConfigSnippet() handles CLAUDE.md cleanup exclusively, deleting the file only if it becomes empty after block removal
- **Files modified:** bin/install.js
- **Verification:** Install with pre-existing user CLAUDE.md content, uninstall, confirm user content preserved
- **Committed in:** 2429aea (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Essential fix for correctness -- without it, uninstall would destroy user content in CLAUDE.md. No scope creep.

## Issues Encountered

None beyond the auto-fixed deviation.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- bin/install.js now has complete lifecycle support: install, upgrade (with selective backup), and uninstall
- Ready for Plan 03 (verification/testing) if applicable
- Ready for Phase 4 rebrand (text references still use "Design Forge" / "forge" -- Phase 4 handles full rename)
- All five success criteria verified: hash comparison, backup on modify, skip backup on unmodified, --force bypass, --uninstall cleanup

## Self-Check: PASSED

- FOUND: bin/install.js
- FOUND: 03-02-SUMMARY.md
- FOUND: commit 2660756
- FOUND: commit 2429aea

---
*Phase: 03-installer*
*Completed: 2026-03-01*
