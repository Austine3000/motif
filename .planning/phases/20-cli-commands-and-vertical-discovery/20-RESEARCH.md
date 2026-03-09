# Phase 20: CLI Commands and Vertical Discovery - Research

**Researched:** 2026-03-09
**Domain:** CLI subcommand implementation (status, update, doctor, list) for a zero-dependency Node.js package
**Confidence:** HIGH

## Summary

Phase 20 adds four subcommands to the CLI router established in Phase 19: `motif status`, `motif update`, `motif doctor`, and `motif list`. The architecture is already in place -- `bin/cli.js` has a COMMANDS registry that maps subcommand names to module paths under `bin/commands/`, and each command exports a `run(args)` function. The work is straightforward: implement four new modules following the established pattern.

The commands share common infrastructure: `findProjectRoot()` from `bin/lib/find-root.js`, the `.motif-manifest.json` manifest for version/file tracking, and `node:util styleText` for terminal output. Three commands (status, update, doctor) require a project context (manifest must exist). One command (list) is context-free and reads from the package source directory.

A critical discovery: Phase 18 created 4 new vertical files (social, education, marketplace, devtools) in the **installed project location** (`.claude/get-motif/references/verticals/`) but NOT in the **package source** (`core/references/verticals/`). The source only has the original 4 (ecommerce, fintech, health, saas). Similarly, the source `init.md` was not updated with the devtools vertical detection. The `motif list` command reads from the package source directory, so it will only show 4 verticals unless the source files are synced first. This sync is a prerequisite for Phase 20.

**Primary recommendation:** Create four command modules in `bin/commands/` following the init.js pattern (export `run(args)`, use `findProjectRoot`, read manifest), register them in `cli.js` COMMANDS map, and update the help text. Sync the 4 new vertical source files before implementing `motif list`.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| node:fs | Node 22+ | Read manifest, check file existence, hash files | Already used throughout |
| node:path | Node 22+ | Cross-platform path resolution | Already used throughout |
| node:util (parseArgs) | Node 22+ | Per-command flag parsing | Established in Phase 19 |
| node:util (styleText) | Node 22+ | Terminal coloring (bold, cyan, red, green, yellow) | Already used in cli.js and init.js |
| node:crypto (createHash) | Node 22+ | SHA-256 file hashing for integrity checks | Already used in init.js |
| node:https | Node 22+ | Fetch latest version from npm registry | Already used in check-version.js |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| bin/lib/find-root.js | local | Walk-up project root detection | Used by status, update, doctor (not list) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| node:https for registry check | npm CLI via child_process | External dependency on npm binary; https is lighter and already proven in check-version.js |
| Manual semver comparison | semver package | External dependency; the existing compareVersions() in check-version.js handles x.y.z comparison correctly for this use case |

**Installation:**
```bash
# No new dependencies. This package remains zero-dependency.
```

## Architecture Patterns

### Recommended Project Structure
```
bin/
├── cli.js              # Entry point: update COMMANDS map + help text
├── commands/
│   ├── init.js         # Existing (Phase 19)
│   ├── status.js       # NEW: version, phase, screen count
│   ├── update.js       # NEW: sync files from newer global package
│   ├── doctor.js       # NEW: diagnostic report
│   └── list.js         # NEW: available verticals
├── lib/
│   ├── find-root.js    # Existing (Phase 19)
│   └── manifest.js     # NEW: shared manifest reading + version utilities
└── install.js          # Backward-compat shim (Phase 19)
```

### Pattern 1: Command Module Convention
**What:** Each command exports `run(args)` and handles its own flag parsing. The router passes `process.argv.slice(3)` for known subcommands.
**When to use:** All four new commands follow this pattern.
**Example:**
```javascript
// Source: bin/commands/init.js (established pattern)
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { parseArgs, styleText } = require('node:util');
const { findProjectRoot } = require('../lib/find-root.js');

function run(args) {
  const { values } = parseArgs({
    args,
    options: {
      help: { type: 'boolean', short: 'h', default: false },
      // command-specific flags here
    },
    strict: true,
  });

  if (values.help) { printHelp(); process.exit(0); }

  const projectRoot = findProjectRoot(process.cwd());
  if (!projectRoot) {
    console.error(styleText('red', 'Not inside a project directory.'));
    process.exit(1);
  }
  // command logic...
}

module.exports = { run };
```

### Pattern 2: Manifest Reading (shared utility)
**What:** Multiple commands need to read `.motif-manifest.json` and extract version, runtime, file list. Extract this into a shared utility to avoid duplication across status, update, and doctor.
**When to use:** Any command that needs the installed version or file list.
**Example:**
```javascript
// bin/lib/manifest.js
'use strict';
const fs = require('node:fs');
const path = require('node:path');

function readManifest(projectRoot) {
  const manifestPath = path.join(projectRoot, '.motif-manifest.json');
  if (!fs.existsSync(manifestPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch {
    return null;
  }
}

function getPackageVersion() {
  const pkgPath = path.resolve(__dirname, '..', '..', 'package.json');
  return JSON.parse(fs.readFileSync(pkgPath, 'utf8')).version;
}

module.exports = { readManifest, getPackageVersion };
```

### Pattern 3: Version Comparison (already exists)
**What:** The `compareVersions(a, b)` function in `scripts/check-version.js` splits on dots and compares numerically. This same logic is needed by `update` for downgrade protection.
**When to use:** update command for downgrade detection, status command for update-available check.
**Example:**
```javascript
// Already proven in scripts/check-version.js
function compareVersions(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) < (pb[i] || 0)) return -1;
    if ((pa[i] || 0) > (pb[i] || 0)) return 1;
  }
  return 0;
}
```

### Pattern 4: Vertical Discovery from Package Source
**What:** `motif list` reads vertical files from the package's `core/references/verticals/` directory (resolved via `__dirname`) and extracts the first heading and core design principle from each `.md` file.
**When to use:** Only for the list command. This does NOT require a project root.
**Example:**
```javascript
// Vertical discovery reads from package source, not project install
const pkgDir = path.resolve(__dirname, '..', '..');
const verticalsDir = path.join(pkgDir, 'core', 'references', 'verticals');
const files = fs.readdirSync(verticalsDir).filter(f => f.endsWith('.md'));

for (const file of files) {
  const name = path.basename(file, '.md');
  const content = fs.readFileSync(path.join(verticalsDir, file), 'utf8');
  // Extract first line after "# " as title
  const titleMatch = content.match(/^# (.+)$/m);
  // Extract core principle from "## Core Design Principle" section
  const principleMatch = content.match(/\*\*(.+?)\*\*/);
  // Display
}
```

### Pattern 5: State Reading for Status Command
**What:** The `motif status` command needs the current workflow phase and screen count. This data lives in `.planning/design/STATE.md` (YAML frontmatter). The existing `motif-state.js` script already parses this. Rather than importing that script (it's designed as a CLI tool), the status command can shell out to it or reimplement the minimal YAML frontmatter read.
**When to use:** status command only.
**Recommendation:** Shell out to `node <projectRoot>/.claude/get-motif/scripts/motif-state.js read` and parse the JSON output. This reuses existing tested code and avoids duplication. Falls back gracefully if the script or STATE.md doesn't exist (user hasn't started a design project yet).

### Anti-Patterns to Avoid
- **Importing motif-state.js directly:** It uses `process.env.CLAUDE_PROJECT_DIR` and has its own CLI entry point. Don't require() it -- shell out to it or extract the read logic.
- **Reading verticals from the installed project location:** `motif list` must work without a project context. Read from `core/references/verticals/` relative to the package, not from `.claude/get-motif/references/verticals/`.
- **Fetching npm registry in doctor:** Doctor checks local integrity only. Don't add network calls to diagnostic commands -- keep them fast and offline.
- **Duplicating hashFile across commands:** Extract to `bin/lib/manifest.js` or similar shared module.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Version comparison | Custom parser | Existing `compareVersions()` pattern from check-version.js | Already tested, handles edge cases |
| Terminal colors | ANSI escape sequences | `node:util styleText` | Already used throughout, cross-platform |
| File hashing | Custom algorithm | `node:crypto createHash('sha256')` | Already used in init.js manifest writing |
| State reading | Custom YAML parser | Shell out to `motif-state.js read` | Script already exists with 475 lines of parsing logic |
| Project root detection | Custom walk-up | `findProjectRoot()` from bin/lib/find-root.js | Already tested in Phase 19 |

**Key insight:** Most of the building blocks already exist in the codebase. The primary work is wiring them together into command modules and formatting output.

## Common Pitfalls

### Pitfall 1: Missing Vertical Source Files
**What goes wrong:** `motif list` shows only 4 verticals instead of 8 because the new verticals (social, education, marketplace, devtools) only exist in the installed project copy, not in `core/references/verticals/`.
**Why it happens:** Phase 18 created the new vertical files in the project's `.claude/get-motif/references/verticals/` directory but did not copy them back to the package source `core/references/verticals/`.
**How to avoid:** Before implementing `motif list`, sync the 4 new vertical files from the installed location to the package source. Also update the source `init.md` with the devtools vertical detection.
**Warning signs:** `ls core/references/verticals/` shows only 4 files. `motif list` output only shows ecommerce, fintech, health, saas.

### Pitfall 2: Update Command Overwrites User-Modified Files
**What goes wrong:** `motif update` blindly copies new files over user-modified ones, losing customizations.
**Why it happens:** Not checking file hashes against the manifest before overwriting.
**How to avoid:** Reuse the same `shouldBackup()` logic from init.js. Compare current file hash to manifest hash. If they differ, the user has modified the file -- back it up before overwriting. This pattern already works in init.js.
**Warning signs:** User customizations to hooks or agents are lost after running `motif update`.

### Pitfall 3: Downgrade Protection Logic Inverted
**What goes wrong:** `motif update` allows downgrading (newer project files overwritten by older global package) or blocks all updates.
**Why it happens:** Version comparison logic reversed, or comparing wrong versions (e.g., comparing file hashes instead of package versions).
**How to avoid:** Compare `manifest.version` (installed version) with `package.json` version (global package version). If installed > global, refuse with message suggesting `npm install -g motif-design@latest`. Allow `--force` to bypass.
**Warning signs:** Running `motif update` after manually editing manifest version causes unexpected behavior.

### Pitfall 4: Doctor Reports False Positives for Optional Files
**What goes wrong:** Doctor reports "missing file" for files that legitimately don't exist (e.g., `.planning/design/STATE.md` when no design project has started, or `.motif-backup/` which only exists after re-installs).
**Why it happens:** Checking for files that are project-state-dependent rather than installation-dependent.
**How to avoid:** Doctor should only check files listed in `.motif-manifest.json` (these are installation files), CLAUDE.md sentinel markers, and settings.json hook configuration. Do NOT check for workflow state files.
**Warning signs:** Running `motif doctor` on a fresh install reports errors.

### Pitfall 5: Status Command Fails Without Design State
**What goes wrong:** `motif status` crashes when `.planning/design/STATE.md` doesn't exist (user hasn't run `/motif:init` yet).
**Why it happens:** Assuming the design workflow has been started.
**How to avoid:** Make state reading optional. Show "No active design project" for phase/screen fields. Always show version and installation info regardless of design state.
**Warning signs:** Running `motif status` immediately after `motif init` (the CLI init, not the workflow init) crashes.

### Pitfall 6: pkgDir Resolution Wrong for Nested Command Modules
**What goes wrong:** `path.resolve(__dirname, '..', '..')` resolves incorrectly because the file is at a different depth than expected.
**Why it happens:** Phase 19 already hit this bug -- init.js is at `bin/commands/init.js` so pkgDir needs two levels up from `__dirname`, not one.
**How to avoid:** All new commands in `bin/commands/` use the same pattern: `path.resolve(__dirname, '..', '..')` to reach the package root. This was already validated in Phase 19.
**Warning signs:** "Cannot find module" or "ENOENT" errors when reading package.json or vertical files.

## Code Examples

Verified patterns from the existing codebase:

### Status Command Core Logic
```javascript
// Combines manifest reading, state reading, and version checking
const manifest = readManifest(projectRoot);
if (!manifest) {
  console.error(styleText('red', 'No Motif installation found.'));
  console.error('Run "motif init" to install Motif into this project.');
  process.exit(1);
}

// Version info (always available from manifest)
console.log(styleText('bold', 'Motif Status'));
console.log(`  Version:   ${manifest.version}`);
console.log(`  Runtime:   ${manifest.runtime}`);
console.log(`  Installed: ${manifest.installedAt}`);

// Design state (optional -- may not exist)
// Shell out to motif-state.js for state reading
const stateScript = path.join(projectRoot, '.claude', 'get-motif', 'scripts', 'motif-state.js');
if (fs.existsSync(stateScript)) {
  try {
    const output = execSync(`node "${stateScript}" read`, { encoding: 'utf8', timeout: 5000 });
    const state = JSON.parse(output.trim());
    if (!state.error) {
      console.log(`  Phase:     ${state.phase || 'unknown'}`);
      console.log(`  Screens:   ${state.screens_composed || 0}/${state.screen_count || 0} composed`);
    } else {
      console.log(`  Phase:     No active design project`);
      console.log(`  Screens:   --`);
    }
  } catch {
    console.log(`  Phase:     No active design project`);
    console.log(`  Screens:   --`);
  }
}
```

### Update Command Version Guard
```javascript
// Source: pattern from check-version.js
const installedVersion = manifest.version;
const packageVersion = getPackageVersion();

const cmp = compareVersions(installedVersion, packageVersion);

if (cmp === 0) {
  console.log(styleText('green', `Already up to date (v${installedVersion}).`));
  process.exit(0);
}

if (cmp > 0 && !flags.force) {
  // Installed is NEWER than global package
  console.error(styleText('yellow', `Warning: Installed version (${installedVersion}) is newer than global package (${packageVersion}).`));
  console.error('This would downgrade your installation. Use --force to proceed.');
  process.exit(1);
}

// Proceed with update: re-run install logic
console.log(styleText('cyan', `Updating Motif: ${installedVersion} -> ${packageVersion}`));
```

### Doctor Check Categories
```javascript
// Three check categories matching success criteria:
// 1. File integrity -- all manifest files present
// 2. Hook configuration -- CLAUDE.md entries correct
// 3. Version consistency -- global vs project

const checks = { passed: 0, warned: 0, failed: 0, results: [] };

// Category 1: File integrity
for (const [relPath, entry] of Object.entries(manifest.files)) {
  const fullPath = path.join(projectRoot, relPath);
  if (!fs.existsSync(fullPath)) {
    checks.failed++;
    checks.results.push({ status: 'FAIL', category: 'files', message: `Missing: ${relPath}` });
  } else {
    const currentHash = hashFile(fullPath);
    if (currentHash !== entry.hash) {
      checks.warned++;
      checks.results.push({ status: 'WARN', category: 'files', message: `Modified: ${relPath}` });
    } else {
      checks.passed++;
    }
  }
}

// Category 2: Hook configuration
// Check CLAUDE.md has MOTIF-START/MOTIF-END sentinels
// Check .claude/settings.json has PostToolUse hooks + statusLine

// Category 3: Version consistency
// Compare manifest.version with global package version
```

### List Command Vertical Output
```javascript
// Read from package source, not project install
const pkgDir = path.resolve(__dirname, '..', '..');
const verticalsDir = path.join(pkgDir, 'core', 'references', 'verticals');

if (!fs.existsSync(verticalsDir)) {
  console.error(styleText('red', 'Verticals directory not found.'));
  process.exit(1);
}

const files = fs.readdirSync(verticalsDir)
  .filter(f => f.endsWith('.md'))
  .sort();

console.log(styleText('bold', 'Available Verticals'));
console.log('');

for (const file of files) {
  const name = path.basename(file, '.md');
  const content = fs.readFileSync(path.join(verticalsDir, file), 'utf8');
  // Extract core principle (text between first ** ** pair)
  const principleMatch = content.match(/\*\*(.+?)\*\*/);
  const principle = principleMatch ? principleMatch[1] : 'No description';
  console.log(`  ${styleText('cyan', name.padEnd(14))} ${principle}`);
}

console.log('');
console.log(`${files.length} verticals available. Use /motif:init to start a project.`);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single `init` subcommand | Full subcommand suite (init, status, update, doctor, list) | Phase 20 | Complete CLI experience |
| check-version.js as standalone script | Version checking integrated into status + update commands | Phase 20 | Users get version info from `motif status` instead of running a separate script |
| No installation diagnostics | `motif doctor` validates file integrity, hooks, version | Phase 20 | Users can self-diagnose installation issues |
| Vertical discovery via init workflow conversation | `motif list` shows all verticals pre-init | Phase 20 | Users know options before starting |

**Deprecated/outdated after Phase 20:**
- `scripts/check-version.js` as standalone tool: Functionality absorbed into `motif status` and `motif update`. Script can remain for backward compatibility but is no longer the primary path.

## Critical Prerequisite: Sync New Verticals to Package Source

Before implementing `motif list`, the following files must be copied from the installed project location to the package source:

| Source (project install) | Destination (package source) |
|---|---|
| `.claude/get-motif/references/verticals/social.md` | `core/references/verticals/social.md` |
| `.claude/get-motif/references/verticals/education.md` | `core/references/verticals/education.md` |
| `.claude/get-motif/references/verticals/marketplace.md` | `core/references/verticals/marketplace.md` |
| `.claude/get-motif/references/verticals/devtools.md` | `core/references/verticals/devtools.md` |

Additionally, the source `runtimes/claude-code/commands/motif/init.md` should be updated to match the installed copy (add devtools vertical, update saas and ecommerce descriptions).

This sync is **blocking** for the `motif list` command to show all 8 verticals.

## Open Questions

1. **Should `motif update` reuse init.js logic or have its own copy logic?**
   - What we know: init.js already has `walkAndCopy`, `shouldBackup`, `writeManifest`, `injectConfig`, and `injectHookSettings`. Update does the same thing but with version guards.
   - What's unclear: Whether to call `init.run()` internally or extract shared copy logic into a library.
   - Recommendation: Extract the core copy/backup/manifest logic into a shared module (e.g., `bin/lib/installer.js`) that both init and update use. This avoids duplication while keeping the version guard logic in update.js. However, if extraction is too invasive, update can simply call `require('./init.js').run(['--force'])` after version checks -- the init command already handles re-installs with manifest comparison.

2. **Should `motif doctor` check hook script executability?**
   - What we know: Doctor checks file existence and hash integrity. It could also check that hook scripts are valid JavaScript (syntax check) or that they have correct permissions.
   - What's unclear: Whether this level of checking adds value.
   - Recommendation: Start with existence + hash checks only. Add syntax checking in a future iteration if users report issues.

3. **Where does the "media" vertical stand?**
   - What we know: The source `init.md` lists "media" as a vertical (streaming, news, podcasts, publishing). Phase 18 added devtools but not media. The installed init.md has both media and devtools (9 entries). But only 8 vertical .md files exist.
   - What's unclear: Whether "media" should have its own `.md` file or if it's intentionally covered by other verticals.
   - Recommendation: This is outside Phase 20 scope. `motif list` should list whatever `.md` files exist in the verticals directory. If there are 8 files, it shows 8. The discrepancy between init.md's vertical list and the available files is a separate issue.

## Sources

### Primary (HIGH confidence)
- Existing codebase: `bin/cli.js` -- CLI router with COMMANDS registry, help text, version handling (74 lines)
- Existing codebase: `bin/commands/init.js` -- Complete install logic with backup, manifest, verify (755 lines)
- Existing codebase: `bin/lib/find-root.js` -- Project root detection utility (31 lines)
- Existing codebase: `scripts/check-version.js` -- Version checking with npm registry fetch (91 lines)
- Existing codebase: `scripts/motif-state.js` -- State reading/writing with YAML frontmatter parsing (475 lines)
- Existing codebase: `.motif-manifest.json` -- Manifest structure with version, runtime, files hash map
- Existing codebase: `.claude/settings.json` -- Hook configuration structure (PostToolUse, SessionStart, statusLine)
- Existing codebase: `core/references/verticals/` -- Vertical files with consistent structure (title, core principle, sections)
- Phase 19 summaries: 19-01-SUMMARY.md, 19-02-SUMMARY.md -- Architecture decisions and patterns established

### Secondary (MEDIUM confidence)
- Phase 18 verification: Confirmed 8 verticals exist in installed location, 4 new ones not synced to source
- init.md vertical detection list: 8 entries (fintech, health, saas, ecommerce, social, education, media, marketplace) in source; 9 entries (adds devtools) in installed copy

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - zero-dependency, all Node.js built-ins already in use
- Architecture: HIGH - COMMANDS map pattern established, each command is isolated module
- Command logic: HIGH - all building blocks exist (manifest reading, version comparison, file hashing, state reading)
- Pitfalls: HIGH - identified from code review of existing patterns and Phase 18/19 summaries
- Vertical sync prerequisite: HIGH - confirmed by `ls` that source has 4, installed has 8

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (stable domain -- the codebase patterns are established and unlikely to change)
