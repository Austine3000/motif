---
status: complete
phase: 03-installer
source: [03-01-SUMMARY.md, 03-02-SUMMARY.md, 03-03-SUMMARY.md]
started: 2026-03-02T07:00:00Z
updated: 2026-03-02T07:45:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Fresh Install in Clean Project
expected: Running installer in a clean project with `.claude/` creates all target directories (get-motif/references, workflows, templates, agents, commands/motif), CLAUDE.md with config, manifest file, and prints a success summary
result: pass

### 2. Path Resolution in Installed Files
expected: All installed .md files under `.claude/get-motif/` and `.claude/commands/motif/` contain zero occurrences of `{FORGE_ROOT}` or `.claude/get-design-forge` -- all resolved to `.claude/get-motif`
result: issue
reported: "There are still references of get-design-forge across the app, but not for .claude but for opencode and gemini. Then for cursor we have .design-forge. In the help.md they still call forge instead of motif. The files and names should be consistent with the app name."
severity: major

### 3. CLAUDE.md Sentinel Markers
expected: CLAUDE.md contains `<!-- MOTIF-START -->` and `<!-- MOTIF-END -->` markers with the Motif config snippet between them. Re-running installer replaces content between markers (idempotent). Pre-existing CLAUDE.md content outside markers is preserved.
result: pass

### 4. --help and --dry-run Flags
expected: `--help` prints usage showing all 5 flags (--runtime, --force, --dry-run, --uninstall, --help). `--dry-run` prints "Would copy:" messages listing all files without actually creating any files or directories.
result: pass

### 5. Re-install Backs Up Modified Files
expected: After modifying an installed file and re-running the installer, the modified file is backed up to `.motif-backup/` with a timestamped filename, and the installed version is overwritten with the fresh copy. Unmodified files are overwritten without backup.
result: pass

### 6. --force Skips Backup
expected: Running installer with `--force` on an existing installation overwrites all files without creating any backups, even for user-modified files.
result: pass

### 7. Uninstall Removes Everything
expected: `--uninstall` removes all installed files under `.claude/get-motif/` and `.claude/commands/motif/`, strips the sentinel block from CLAUDE.md (preserving other content), deletes `.motif-manifest.json` and `.motif-backup/`, but preserves the `.claude/` directory itself.
result: pass

### 8. Uninstall on Clean System
expected: Running `--uninstall` when no `.motif-manifest.json` exists prints an error message about no installation found and exits with code 1.
result: pass

## Summary

total: 8
passed: 7
issues: 1
pending: 0
skipped: 0

## Gaps

- truth: "All installed .md files contain zero occurrences of old branding (get-design-forge, .design-forge, /forge:) -- all consistent with Motif naming"
  status: failed
  reason: "User reported: There are still references of get-design-forge for opencode/gemini runtimes, .design-forge for cursor, and /forge: commands in help.md and design-inputs.md. Files and names should be consistent with app name."
  severity: major
  test: 2
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""
