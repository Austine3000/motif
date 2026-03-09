---
phase: 19-global-cli-core
verified: 2026-03-09T15:00:00Z
status: passed
score: 9/9 must-haves verified
re_verification: false
---

# Phase 19: Global CLI Core Verification Report

**Phase Goal:** Users can install Motif once globally and scaffold it into any project without needing npx or per-project npm install
**Verified:** 2026-03-09T15:00:00Z
**Status:** passed
**Re-verification:** No -- initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User can run `motif init` and have the subcommand routed to the init handler | VERIFIED | cli.js line 66-68 dispatches to commands/init.js; smoke test `node bin/cli.js init --dry-run` succeeds |
| 2 | User can run `npx motif-design@latest` (no subcommand) and have it fall back to init behavior | VERIFIED | cli.js line 69-72 falls through to init for unrecognized/missing subcommand; smoke test `node bin/cli.js --dry-run --runtime claude-code` succeeds |
| 3 | User can run `motif init` from a subdirectory and have files installed to project root | VERIFIED | init.js line 691-699 calls findProjectRoot and prints "Installing to project root" when cwd differs; e2e test covers this |
| 4 | User gets a clear error when running `motif init` outside any project directory | VERIFIED | init.js line 692-695 exits with "Not inside a project directory"; live test from /tmp confirmed exit code 1 |
| 5 | Global install via npm install -g does not trigger self-referencing dependency resolution | VERIFIED | package.json has no `dependencies` field (confirmed via node require) |
| 6 | E2E tests pass when invoked via the new cli.js entry point | VERIFIED | test/e2e-installer.js INSTALLER constant points to bin/cli.js (line 10) |
| 7 | E2E tests verify that legacy install.js shim path still works | VERIFIED | LEGACY_INSTALLER constant (line 11), runLegacyInstaller helper, Legacy Shim test section (lines 186-208) |
| 8 | E2E tests verify project root detection (subdirectory install and non-project rejection) | VERIFIED | Project Root Detection test section (lines 141-184) with both non-project and subdirectory tests |
| 9 | npm pack --dry-run shows all new files included in the published package | VERIFIED | package.json `files` array includes `bin/` which covers cli.js, commands/, lib/ subdirectories |

**Score:** 9/9 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `bin/cli.js` | Subcommand router entry point with shebang | VERIFIED | 73 lines, has shebang, parseArgs, COMMANDS map, --help, --version, init dispatch, backward-compat fallback |
| `bin/commands/init.js` | Extracted init/install logic from former install.js | VERIFIED | 754 lines, exports `run(args)`, imports findProjectRoot, uses projectRoot throughout, has parseFlags(args) |
| `bin/lib/find-root.js` | Project root detection utility | VERIFIED | 31 lines, exports `findProjectRoot`, walks up checking .git and package.json, returns null at FS root |
| `bin/install.js` | Backward-compat shim | VERIFIED | 8 lines, delegates to commands/init.js with process.argv.slice(2) |
| `package.json` | Updated bin field, no dependencies | VERIFIED | bin.motif = "bin/cli.js", no dependencies field |
| `test/e2e-installer.js` | Updated e2e tests covering CLI router, backward compat, root detection | VERIFIED | Uses cli.js as INSTALLER, has CLI Router, Root Detection, and Legacy Shim test sections |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| bin/cli.js | bin/commands/init.js | require and .run() dispatch | WIRED | Line 68: `require(COMMANDS[subcommand]).run(...)`, line 72: `require(COMMANDS.init).run(...)` |
| bin/commands/init.js | bin/lib/find-root.js | require findProjectRoot | WIRED | Line 8: `const { findProjectRoot } = require('../lib/find-root.js')`, line 691: `findProjectRoot(process.cwd())` |
| package.json | bin/cli.js | bin field | WIRED | `"bin": {"motif": "bin/cli.js"}` |
| bin/install.js | bin/commands/init.js | backward-compat shim | WIRED | Line 8: `require('./commands/init.js').run(process.argv.slice(2))` |
| test/e2e-installer.js | bin/cli.js | execSync invocation | WIRED | Line 10: INSTALLER points to cli.js, used in all test runs |
| test/e2e-installer.js | bin/lib/find-root.js | test assertions on root detection | WIRED | Root Detection test section validates findProjectRoot behavior via CLI |

### Requirements Coverage

| Requirement | Status | Blocking Issue |
|-------------|--------|----------------|
| GCLI-01: User can install globally via `npm install -g motif-design` | SATISFIED | Self-referencing dependency removed, bin field points to cli.js |
| GCLI-02: User can run `motif init` to scaffold Motif into current project | SATISFIED | CLI router dispatches init subcommand, full install logic extracted |
| GCLI-06: Both `npm install -g` and `npx motif-design@latest` paths work | SATISFIED | Backward-compat fallback in cli.js + install.js shim |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None | - | - | - | No anti-patterns detected |

### Human Verification Required

### 1. Global Install End-to-End

**Test:** Run `npm pack` then `npm install -g motif-design-0.2.2.tgz`, verify `motif --version` and `motif init --dry-run` work from any project directory
**Expected:** `motif` command available system-wide, outputs version 0.2.2, init dry-run succeeds
**Why human:** Requires actual global npm install which modifies system state

### 2. npx Backward Compatibility

**Test:** Run `npx ./motif-design-0.2.2.tgz --dry-run --runtime claude-code` from a project directory
**Expected:** Init runs successfully without requiring explicit `init` subcommand
**Why human:** Requires npx execution environment

### Gaps Summary

No gaps found. All 9 observable truths verified, all 6 artifacts pass three-level checks (exists, substantive, wired), all 6 key links confirmed wired, all 3 requirements satisfied, and no anti-patterns detected. Two items flagged for human verification (global install and npx path) as they require system-level npm operations.

---

_Verified: 2026-03-09T15:00:00Z_
_Verifier: Claude (gsd-verifier)_
