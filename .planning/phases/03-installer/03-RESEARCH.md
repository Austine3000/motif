# Phase 3: Installer - Research

**Researched:** 2026-03-01
**Domain:** Node.js CLI installer for npm-distributed markdown design system (zero dependencies)
**Confidence:** HIGH

## Summary

Phase 3 builds `bin/install.js` -- the single JavaScript file that makes `npx motif@latest` work. This is a file-copying CLI tool with no npm dependencies, using only Node.js 22+ stdlib APIs. The installer detects which AI coding runtime the user has (v1.0: Claude Code only), copies `core/` content and `runtimes/claude-code/` adapter files into the user's project, injects a config snippet into CLAUDE.md with sentinel markers, resolves `{FORGE_ROOT}` path variables, writes a manifest for upgrade tracking, and runs post-install verification.

The installer is architecturally simple but has high surface area for subtle bugs: path resolution across OS, idempotent re-install behavior, backup-before-overwrite for user-modified files, sentinel-based config injection, and the `{FORGE_ROOT}` variable resolution that must produce zero unresolved references. The prior project research (PITFALLS.md, ARCHITECTURE.md) already documents these risks in depth. This phase research focuses on the practical implementation patterns, Node.js API specifics, and prescriptive code examples that the planner needs to create actionable tasks.

**Primary recommendation:** Build install.js as a synchronous pipeline of five stages -- detect, resolve, copy, inject, verify -- each as a pure function taking config and returning results. Use `util.parseArgs` for CLI flags, `fs.cpSync` with filter for recursive directory copy, `crypto.createHash('sha256')` for content hashing, `util.styleText` for colored terminal output. Total file should be 300-400 lines, no modules, no async.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `node:fs` | Node 22+ | `cpSync`, `readFileSync`, `writeFileSync`, `existsSync`, `mkdirSync`, `readdirSync`, `statSync`, `renameSync` | Zero-dependency file operations. `cpSync` with `{ recursive: true }` replaces `fs-extra` entirely. |
| `node:path` | Node 22+ | `join`, `resolve`, `relative`, `dirname`, `basename`, `sep` | Cross-platform path construction. NEVER concatenate paths with `/` strings. |
| `node:util` | Node 22+ | `parseArgs` for CLI flags, `styleText` for colored output | Built-in replacements for `commander`/`yargs` and `chalk`. `parseArgs` stable since v20.0.0, `styleText` stable since v22.13.0. |
| `node:crypto` | Node 22+ | `createHash('sha256')` for content hashing | Manifest-based upgrade tracking. Hash file contents to detect user modifications. |
| `node:process` | Node 22+ | `process.argv`, `process.cwd()`, `process.exit()`, `process.env.NO_COLOR` | CLI argument access, working directory, exit codes. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `node:os` | Node 22+ | `os.platform()`, `os.EOL` | Windows detection for path separator edge cases, line endings in generated files |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `util.parseArgs` | `commander` / `yargs` | External dep violates zero-dependency constraint. `parseArgs` handles the 4 flags needed. |
| `util.styleText` | `chalk` | External dep. `styleText` respects `NO_COLOR` natively. |
| `fs.cpSync` | `fs-extra` | External dep. `cpSync` with `recursive: true` and `filter` function covers all needs. |
| `crypto.createHash` | Manual checksum | Crypto module is built-in, battle-tested. No reason to hand-roll. |

**Installation:**
```bash
# No npm install needed -- zero dependencies. Node.js 22+ stdlib only.
```

## Architecture Patterns

### Recommended Project Structure

The installer is a single file (`bin/install.js`) with no module splitting. The entire install logic fits in 300-400 lines. Splitting into modules adds complexity without benefit for a zero-dependency CLI tool.

```
bin/
└── install.js            # Single file: shebang + detect + resolve + copy + inject + verify
```

### Installed File Layout (Claude Code)

After `npx motif@latest`, the user's project has:
```
project/
├── .claude/
│   ├── commands/motif/              # FROM runtimes/claude-code/commands/forge/
│   │   ├── init.md                  # (renamed from forge/ to motif/ by installer)
│   │   ├── research.md
│   │   ├── system.md
│   │   ├── compose.md
│   │   ├── review.md
│   │   ├── fix.md
│   │   ├── evolve.md
│   │   ├── quick.md
│   │   ├── help.md
│   │   └── progress.md
│   │
│   ├── get-motif/                   # FROM core/ + runtimes/claude-code/agents/
│   │   ├── references/
│   │   │   ├── state-machine.md
│   │   │   ├── context-engine.md
│   │   │   ├── design-inputs.md
│   │   │   ├── runtime-adapters.md
│   │   │   └── verticals/
│   │   │       └── fintech.md
│   │   ├── workflows/
│   │   │   ├── research.md          # {FORGE_ROOT} resolved to .claude/get-motif
│   │   │   ├── generate-system.md
│   │   │   ├── compose-screen.md
│   │   │   ├── review.md
│   │   │   ├── fix.md
│   │   │   ├── evolve.md
│   │   │   └── quick.md
│   │   ├── templates/
│   │   │   ├── STATE-TEMPLATE.md
│   │   │   ├── SUMMARY-TEMPLATE.md
│   │   │   ├── VERTICAL-TEMPLATE.md
│   │   │   └── token-showcase-template.html
│   │   └── agents/
│   │       ├── forge-researcher.md
│   │       ├── forge-system-architect.md
│   │       ├── forge-screen-composer.md
│   │       ├── forge-design-reviewer.md
│   │       └── forge-fix-agent.md
│   │
│   └── CLAUDE.md                    # Motif snippet injected between sentinel markers
│
└── .motif-manifest.json             # Install tracking at project root
```

### Pattern 1: Five-Stage Pipeline

**What:** The installer runs as a synchronous pipeline: Detect -> Resolve -> Copy -> Inject -> Verify. Each stage is a function that takes config and returns a result object.

**When to use:** Always -- this is the only pattern for install.js.

**Example:**
```javascript
#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { parseArgs } = require('node:util');
const { styleText } = require('node:util');
const { createHash } = require('node:crypto');

// Stage 1: Parse CLI flags
const flags = parseFlags();
// Stage 2: Detect runtime
const runtime = detectRuntime(flags);
// Stage 3: Resolve source->target mapping
const mapping = resolveMapping(runtime);
// Stage 4: Copy files (with backup if re-install)
const copyResult = copyFiles(mapping, flags);
// Stage 5: Inject config snippet into CLAUDE.md
const injectResult = injectConfig(runtime);
// Stage 6: Resolve {FORGE_ROOT} in installed files
const resolveResult = resolvePathVariables(runtime);
// Stage 7: Write manifest
writeManifest(runtime, mapping);
// Stage 8: Post-install verification
const verifyResult = verify(runtime);
// Stage 9: Print summary
printSummary(copyResult, injectResult, verifyResult);
```

### Pattern 2: Manifest-Based Upgrade Tracking

**What:** A `.motif-manifest.json` file at the project root records installed version, runtime, and SHA-256 content hashes of every installed file. On re-install, the installer compares current file hashes against the manifest to detect user modifications.

**When to use:** Every install writes the manifest. Every re-install reads the manifest first.

**Example:**
```javascript
// Manifest structure
{
  "version": "1.0.0",
  "runtime": "claude-code",
  "installedAt": "2026-03-01T14:30:00.000Z",
  "files": {
    ".claude/commands/motif/init.md": {
      "hash": "a1b2c3d4...",     // SHA-256 of file content at install time
      "source": "runtimes/claude-code/commands/forge/init.md"
    },
    ".claude/get-motif/workflows/research.md": {
      "hash": "e5f6g7h8...",
      "source": "core/workflows/research.md"
    }
    // ... all installed files
  }
}

// Hash computation
function hashFile(filePath) {
  const content = fs.readFileSync(filePath);
  return createHash('sha256').update(content).digest('hex');
}

// Upgrade logic
function shouldBackup(targetPath, manifest) {
  if (!fs.existsSync(targetPath)) return false;
  if (!manifest || !manifest.files[targetPath]) return false;  // New file

  const currentHash = hashFile(targetPath);
  const installedHash = manifest.files[targetPath].hash;

  // If current hash matches what we installed, user hasn't modified it -- safe to overwrite
  if (currentHash === installedHash) return false;

  // User modified this file -- back up before overwriting
  return true;
}
```

### Pattern 3: Sentinel-Based Config Injection

**What:** The Motif config snippet is injected into CLAUDE.md between `<!-- MOTIF-START -->` and `<!-- MOTIF-END -->` markers. On re-install, the content between markers is replaced. The rest of CLAUDE.md is preserved.

**When to use:** Always for config injection. Never append without markers.

**Example:**
```javascript
function injectConfig(runtime) {
  const configPath = path.join(process.cwd(), 'CLAUDE.md');
  const snippetPath = getSnippetPath(runtime);  // e.g., runtimes/claude-code/CLAUDE-MD-SNIPPET.md
  const snippet = fs.readFileSync(snippetPath, 'utf8');

  const START = '<!-- MOTIF-START -->';
  const END = '<!-- MOTIF-END -->';
  const block = `${START}\n${snippet}\n${END}`;

  if (fs.existsSync(configPath)) {
    let content = fs.readFileSync(configPath, 'utf8');

    if (content.includes(START) && content.includes(END)) {
      // Replace existing block
      const regex = new RegExp(
        `${escapeRegex(START)}[\\s\\S]*?${escapeRegex(END)}`,
        'g'
      );
      content = content.replace(regex, block);
      fs.writeFileSync(configPath, content, 'utf8');
      return { action: 'replaced' };
    } else {
      // Append with separator
      content += '\n\n' + block + '\n';
      fs.writeFileSync(configPath, content, 'utf8');
      return { action: 'appended' };
    }
  } else {
    // Create new file
    fs.writeFileSync(configPath, block + '\n', 'utf8');
    return { action: 'created' };
  }
}
```

### Pattern 4: {FORGE_ROOT} Resolution at Install Time

**What:** The installer reads every `.md` file it copies, replaces `{FORGE_ROOT}` with the resolved runtime path (e.g., `.claude/get-motif`), and writes the resolved version to the target. This is required by INST-07/INST-08.

**When to use:** During the copy stage, for all `.md` files. Binary files and `.html` files are copied verbatim.

**Important context:** Only two workflow files currently use `{FORGE_ROOT}` -- `core/workflows/research.md` and `core/workflows/generate-system.md`. These contain `<path_resolution>` blocks documenting per-runtime resolution. After resolution, the `<path_resolution>` blocks can be kept (they become documentation) or stripped -- either way the actual `{FORGE_ROOT}` references in the instructions must be resolved.

**Example:**
```javascript
function copyWithResolution(srcPath, destPath, forgeRoot) {
  const ext = path.extname(srcPath).toLowerCase();

  if (ext === '.md') {
    let content = fs.readFileSync(srcPath, 'utf8');
    content = content.replaceAll('{FORGE_ROOT}', forgeRoot);
    fs.writeFileSync(destPath, content, 'utf8');
  } else {
    fs.copyFileSync(srcPath, destPath);
  }
}
```

**Resolution table (v1.0, Claude Code only):**

| Runtime | `{FORGE_ROOT}` resolves to |
|---------|---------------------------|
| `claude-code` | `.claude/get-motif` |
| `opencode` (future) | `.opencode/get-motif` |
| `gemini` (future) | `.gemini/get-motif` |
| `cursor` (future) | `.motif` |

### Pattern 5: Uninstall via Flag

**What:** `npx motif@latest --uninstall` reverses installation: removes all installed files tracked by the manifest, removes the CLAUDE.md snippet between sentinel markers, and deletes the manifest.

**When to use:** Only when `--uninstall` flag is present.

**Example:**
```javascript
function uninstall() {
  const manifestPath = path.join(process.cwd(), '.motif-manifest.json');
  if (!fs.existsSync(manifestPath)) {
    console.error(styleText('red', 'No Motif installation found (missing .motif-manifest.json)'));
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  // Remove installed files
  for (const filePath of Object.keys(manifest.files)) {
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }

  // Clean up empty directories
  cleanEmptyDirs(path.join(process.cwd(), '.claude', 'get-motif'));
  cleanEmptyDirs(path.join(process.cwd(), '.claude', 'commands', 'motif'));

  // Remove CLAUDE.md snippet
  removeConfigSnippet();

  // Remove manifest
  fs.unlinkSync(manifestPath);

  console.log(styleText('green', 'Motif uninstalled successfully.'));
}
```

### Anti-Patterns to Avoid

- **Template processing all files indiscriminately:** Only `.md` files need `{FORGE_ROOT}` resolution. Copy `.html`, `.js`, and other files verbatim. Do not run string replacement on binary or non-markdown files.

- **Using `fs.cpSync` for the entire copy operation:** While `fs.cpSync` is great for directories, the installer needs per-file control for (a) `{FORGE_ROOT}` resolution, (b) backup-before-overwrite, and (c) manifest hash recording. Walk the directory tree manually with `readdirSync` + `statSync` and copy files individually.

- **Putting runtime-specific logic in core files:** The installer must NOT modify files in `core/` within the npm package. It reads from `core/` and writes to the user's project.

- **Using `postinstall` npm script:** npm postinstall scripts do NOT run for `npx` invocations. The installer must be a `bin` entry point, not a lifecycle script.

- **Writing files outside `process.cwd()`:** All resolved paths must start with `process.cwd()`. Validate with `path.resolve()` and `startsWith()` check. This is a security requirement.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CLI argument parsing | Custom argv splitting | `util.parseArgs` | Handles `--flag=value`, `--flag value`, `-f`, boolean vs string types. Edge cases are numerous. |
| Terminal colors | ANSI escape sequences | `util.styleText` | Respects `NO_COLOR` env var automatically. Handles terminal capability detection. |
| Content hashing | Manual byte comparison | `crypto.createHash('sha256')` | Fast, correct, collision-resistant. One line of code. |
| Recursive directory walking | Custom recursion | `fs.readdirSync(dir, { recursive: true, withFileTypes: true })` | Node 18.17+ supports recursive option. Returns `Dirent` objects with `isFile()` / `isDirectory()`. |
| Path construction | String concatenation with `/` | `path.join()` / `path.resolve()` | Cross-platform. Handles Windows backslashes, double separators, trailing separators. |
| Recursive directory creation | Existence check loops | `fs.mkdirSync(dir, { recursive: true })` | No-op if directory exists. Creates intermediate directories. |

**Key insight:** Every file operation in Node.js has a built-in solution. The entire installer uses zero external packages because Node.js 22+ stdlib is complete for this use case.

## Common Pitfalls

### Pitfall 1: Double-Append on Re-Install

**What goes wrong:** Running `npx motif@latest` twice appends the config snippet to CLAUDE.md twice, creating duplicate rules. The AI agent sees contradictory or repeated instructions.

**Why it happens:** The installer checks if CLAUDE.md exists but not whether the snippet is already present.

**How to avoid:** Use sentinel markers (`<!-- MOTIF-START -->` / `<!-- MOTIF-END -->`). Check for markers before appending. Replace between markers on re-install.

**Warning signs:** CLAUDE.md grows with each install. Users report duplicate "Motif Rules" sections.

### Pitfall 2: Overwriting User-Modified Files

**What goes wrong:** User customizes an agent definition or workflow for their project. Re-install overwrites their changes silently.

**Why it happens:** The installer does a blind copy without checking if the target has been modified since the last install.

**How to avoid:** Manifest-based content-hash diffing. Compare current file hash against the hash recorded at install time. If they differ, the user modified the file -- back up to `.motif-backup/` before overwriting.

**Warning signs:** Users lose customizations. Repeated complaints about "the installer broke my settings."

### Pitfall 3: Unresolved {FORGE_ROOT} in Installed Files

**What goes wrong:** The AI agent reads a workflow file containing `{FORGE_ROOT}/verticals/fintech.md`. It tries to read a file at that literal path, fails, and halluccinates design decisions instead of using the curated vertical intelligence.

**Why it happens:** The installer copies files without resolving the path variable.

**How to avoid:** The installer must replace ALL occurrences of `{FORGE_ROOT}` in `.md` files with the resolved path (e.g., `.claude/get-motif`). Post-install verification must grep all installed `.md` files for `{FORGE_ROOT}` and fail if any are found.

**Warning signs:** Agent output is generic despite having a vertical reference file available. Agent references "fintech vertical" but with generic content.

### Pitfall 4: Path Traversal Outside Project Root

**What goes wrong:** A bug in path resolution causes the installer to write files to `~/.claude/` (global config) instead of `./.claude/` (project-local), or worse, to arbitrary filesystem locations.

**Why it happens:** Using string concatenation instead of `path.join()`, or not validating that resolved paths are children of `process.cwd()`.

**How to avoid:** All target paths must be constructed with `path.resolve(process.cwd(), ...)` and validated: `resolvedPath.startsWith(process.cwd() + path.sep)`.

**Warning signs:** Files appear in unexpected locations. Installation affects other projects.

### Pitfall 5: Existing .claude/ Directory Conflicts

**What goes wrong:** The user already has `.claude/commands/` with custom commands, or `.claude/CLAUDE.md` with project-specific rules. The installer creates `.claude/commands/motif/` (fine -- namespaced) but might clobber CLAUDE.md.

**Why it happens:** Assuming `.claude/` is empty or Motif-owned.

**How to avoid:** Command files go in `.claude/commands/motif/` (namespaced, no conflict). Core files go in `.claude/get-motif/` (namespaced, no conflict). CLAUDE.md uses sentinel markers (merge, no conflict). Never delete or overwrite the entire `.claude/` directory.

**Warning signs:** User's existing slash commands disappear. Custom CLAUDE.md rules lost.

### Pitfall 6: Silent Failure with Exit Code 0

**What goes wrong:** The installer fails to copy some files (permissions, disk space, etc.) but exits with code 0. The user thinks installation succeeded. They run `/motif:init` and get cryptic "file not found" errors.

**Why it happens:** No error handling on individual file operations. Using try/catch that swallows errors.

**How to avoid:** Wrap each file operation individually. Count successes and failures. Print a clear summary. Exit with code 1 if ANY file operation failed. The post-install verification stage catches problems the copy stage missed.

**Warning signs:** Partial installations. Users report "some commands work but not others."

## Code Examples

Verified patterns from official Node.js documentation and project specifications.

### CLI Flag Parsing

```javascript
// Source: Node.js util.parseArgs docs (https://nodejs.org/api/util.html)
const { parseArgs } = require('node:util');

function parseFlags() {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      runtime: { type: 'string', short: 'r' },
      force: { type: 'boolean', short: 'f', default: false },
      'dry-run': { type: 'boolean', default: false },
      uninstall: { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
    strict: true,
  });
  return values;
}
```

### Runtime Detection

```javascript
// Source: core/references/runtime-adapters.md (project spec)
function detectRuntime(flags) {
  if (flags.runtime) {
    const valid = ['claude-code'];  // v1.0: only Claude Code
    if (!valid.includes(flags.runtime)) {
      console.error(styleText('red', `Unknown runtime: ${flags.runtime}`));
      console.error(`Supported runtimes: ${valid.join(', ')}`);
      process.exit(1);
    }
    return flags.runtime;
  }

  // Auto-detection order from runtime-adapters.md
  const cwd = process.cwd();
  if (fs.existsSync(path.join(cwd, '.claude'))) return 'claude-code';
  // Future: if (fs.existsSync(path.join(cwd, '.opencode'))) return 'opencode';
  // Future: if (fs.existsSync(path.join(cwd, '.gemini'))) return 'gemini';
  // Future: if (fs.existsSync(path.join(cwd, '.cursorrules'))) return 'cursor';

  console.error(styleText('red', 'Could not detect AI runtime.'));
  console.error('No .claude/ directory found. Create it or specify --runtime claude-code');
  process.exit(1);
}
```

### Source-to-Target Mapping

```javascript
// Source: core/references/runtime-adapters.md install mapping
function resolveMapping(runtime) {
  const pkgDir = path.dirname(__dirname);  // npm package root (parent of bin/)
  const cwd = process.cwd();

  if (runtime === 'claude-code') {
    return {
      forgeRoot: '.claude/get-motif',
      copies: [
        // Core content -> get-motif/
        { src: path.join(pkgDir, 'core', 'references'), dest: path.join(cwd, '.claude', 'get-motif', 'references') },
        { src: path.join(pkgDir, 'core', 'workflows'),  dest: path.join(cwd, '.claude', 'get-motif', 'workflows') },
        { src: path.join(pkgDir, 'core', 'templates'),   dest: path.join(cwd, '.claude', 'get-motif', 'templates') },
        // Runtime agents -> get-motif/agents/
        { src: path.join(pkgDir, 'runtimes', 'claude-code', 'agents'), dest: path.join(cwd, '.claude', 'get-motif', 'agents') },
        // Runtime commands -> commands/motif/
        { src: path.join(pkgDir, 'runtimes', 'claude-code', 'commands', 'forge'), dest: path.join(cwd, '.claude', 'commands', 'motif') },
        // Scripts -> get-motif/scripts/
        { src: path.join(pkgDir, 'scripts'), dest: path.join(cwd, '.claude', 'get-motif', 'scripts') },
      ],
      snippet: path.join(pkgDir, 'runtimes', 'claude-code', 'CLAUDE-MD-SNIPPET.md'),
      configTarget: path.join(cwd, 'CLAUDE.md'),
    };
  }
  // Future runtimes would have their own mapping objects
}
```

### File Walking and Copying with Resolution

```javascript
// Source: Node.js fs docs (https://nodejs.org/api/fs.html)
function walkAndCopy(srcDir, destDir, forgeRoot, manifest, existingManifest, flags) {
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  fs.mkdirSync(destDir, { recursive: true });

  const results = { copied: 0, skipped: 0, backedUp: 0 };

  for (const entry of entries) {
    // Skip .DS_Store and other junk files
    if (entry.name === '.DS_Store' || entry.name.startsWith('.')) continue;

    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      const subResult = walkAndCopy(srcPath, destPath, forgeRoot, manifest, existingManifest, flags);
      results.copied += subResult.copied;
      results.skipped += subResult.skipped;
      results.backedUp += subResult.backedUp;
      continue;
    }

    // Validate target path is within project root
    const resolved = path.resolve(destPath);
    if (!resolved.startsWith(process.cwd() + path.sep) && resolved !== process.cwd()) {
      console.error(styleText('red', `Path traversal detected: ${resolved}`));
      process.exit(1);
    }

    // Backup check for re-install
    const relPath = path.relative(process.cwd(), destPath);
    if (shouldBackup(destPath, existingManifest)) {
      const backupDir = path.join(process.cwd(), '.motif-backup');
      fs.mkdirSync(backupDir, { recursive: true });
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      fs.copyFileSync(destPath, path.join(backupDir, `${entry.name}.${timestamp}`));
      results.backedUp++;
    }

    if (flags['dry-run']) {
      console.log(`  Would copy: ${relPath}`);
      results.skipped++;
      continue;
    }

    // Copy with {FORGE_ROOT} resolution for .md files
    copyWithResolution(srcPath, destPath, forgeRoot);

    // Record in manifest
    manifest.files[relPath] = {
      hash: hashFile(destPath),
      source: path.relative(path.dirname(__dirname), srcPath),
    };
    results.copied++;
  }

  return results;
}
```

### Post-Install Verification

```javascript
// Source: REQUIREMENTS INST-07 (zero unresolved {FORGE_ROOT})
function verify(runtime) {
  const cwd = process.cwd();
  const errors = [];

  // 1. Check all expected directories exist
  const expectedDirs = [
    path.join(cwd, '.claude', 'get-motif', 'references'),
    path.join(cwd, '.claude', 'get-motif', 'workflows'),
    path.join(cwd, '.claude', 'get-motif', 'templates'),
    path.join(cwd, '.claude', 'get-motif', 'agents'),
    path.join(cwd, '.claude', 'commands', 'motif'),
  ];

  for (const dir of expectedDirs) {
    if (!fs.existsSync(dir)) {
      errors.push(`Missing directory: ${path.relative(cwd, dir)}`);
    }
  }

  // 2. Check for unresolved {FORGE_ROOT} in all installed .md files
  const motifDir = path.join(cwd, '.claude', 'get-motif');
  const cmdDir = path.join(cwd, '.claude', 'commands', 'motif');

  for (const dir of [motifDir, cmdDir]) {
    if (!fs.existsSync(dir)) continue;
    const files = walkFiles(dir);
    for (const file of files) {
      if (path.extname(file) !== '.md') continue;
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('{FORGE_ROOT}')) {
        errors.push(`Unresolved {FORGE_ROOT} in: ${path.relative(cwd, file)}`);
      }
    }
  }

  // 3. Check CLAUDE.md has sentinel markers
  const claudeMd = path.join(cwd, 'CLAUDE.md');
  if (fs.existsSync(claudeMd)) {
    const content = fs.readFileSync(claudeMd, 'utf8');
    if (!content.includes('<!-- MOTIF-START -->') || !content.includes('<!-- MOTIF-END -->')) {
      errors.push('CLAUDE.md missing Motif sentinel markers');
    }
  } else {
    errors.push('CLAUDE.md not found after installation');
  }

  // 4. Check manifest was written
  if (!fs.existsSync(path.join(cwd, '.motif-manifest.json'))) {
    errors.push('Manifest file not written');
  }

  return errors;
}
```

### Colored Terminal Output

```javascript
// Source: Node.js util.styleText docs (https://nodejs.org/api/util.html)
const { styleText } = require('node:util');

function printSummary(copyResult, injectResult, verifyErrors) {
  console.log('');
  console.log(styleText('bold', 'Motif Installation Summary'));
  console.log('─'.repeat(40));
  console.log(`  Files copied:    ${copyResult.copied}`);
  console.log(`  Files backed up: ${copyResult.backedUp}`);
  console.log(`  Config:          ${injectResult.action}`);

  if (verifyErrors.length === 0) {
    console.log('');
    console.log(styleText('green', 'Installation verified successfully.'));
    console.log('');
    console.log('Get started:');
    console.log(`  ${styleText('cyan', '/motif:init')}    Initialize a design project`);
    console.log(`  ${styleText('cyan', '/motif:help')}    See all commands`);
  } else {
    console.log('');
    console.log(styleText('red', `Verification failed (${verifyErrors.length} errors):`));
    for (const err of verifyErrors) {
      console.log(styleText('red', `  - ${err}`));
    }
    process.exit(1);
  }
}
```

## {FORGE_ROOT} Resolution Strategy -- Critical Design Decision

**Tension:** The ARCHITECTURE.md research (written earlier in the project) documents "Anti-Pattern 2: Template Processing During Install" and argues that `{FORGE_ROOT}` should NOT be resolved at install time. Instead, workflow files contain `<path_resolution>` blocks that tell the AI how to resolve the variable at read-time. However, the REQUIREMENTS (INST-07, INST-08) explicitly mandate resolution at install time and verification of zero unresolved variables.

**Resolution:** The REQUIREMENTS take precedence over the architecture research guidance. The requirements define what the product must do; the architecture research documents patterns and tradeoffs. The requirements were written with full knowledge of the architecture and chose the simpler, more reliable path: resolve at install time.

**Why install-time resolution is better for this product:**
1. The AI agent reading workflow files has zero ambiguity -- paths are concrete.
2. No risk of the AI misinterpreting `<path_resolution>` blocks or ignoring them.
3. Post-install verification is simple: grep for `{FORGE_ROOT}` and fail if found.
4. Installed files are self-contained -- no dependency on the AI understanding a custom resolution protocol.

**What the installer does:**
- Read each `.md` file from `core/` and `runtimes/`.
- Replace ALL occurrences of `{FORGE_ROOT}` with the resolved path (e.g., `.claude/get-motif`).
- Also replace hardcoded old paths like `.claude/get-design-forge` with `.claude/get-motif` (for rebrand compatibility).
- Write the resolved content to the target location.
- Non-`.md` files (`.html`, `.js`) are copied verbatim.

**Current `{FORGE_ROOT}` usage (verified by grep):**
- `core/workflows/research.md` -- 4 occurrences (path_resolution block + 2 path references)
- `core/workflows/generate-system.md` -- 4 occurrences (path_resolution block + 2 path references)
- No other core files use `{FORGE_ROOT}`.
- No runtime files use `{FORGE_ROOT}` (they use hardcoded `.claude/get-design-forge` paths).

**Additional path references to resolve (from current codebase):**
- Runtime command files reference `.claude/get-design-forge/workflows/...` -- must become `.claude/get-motif/workflows/...`
- Runtime agent files reference `.claude/get-design-forge/verticals/...` -- must become `.claude/get-motif/verticals/...`
- The init command references `.claude/get-design-forge/references/design-inputs.md` -- must resolve
- Core reference files (`context-engine.md`, `runtime-adapters.md`) reference `.claude/get-design-forge` -- must resolve

**Note on rebrand scope:** Phase 4 handles the full "Design Forge" -> "Motif" rebrand. For Phase 3, the installer should resolve paths using the POST-rebrand naming (`.claude/get-motif`, `commands/motif/`) since Phase 4 precedes user-facing release. However, the SOURCE files being copied still use the old names. The installer must handle this name mapping during copy.

## Rebrand Mapping in the Installer

The installer must handle the fact that source files use "Design Forge" / "forge" naming but the installed files must use "Motif" / "motif" naming. This is a Phase 3 concern because the install targets use the new names.

| Source Path | Installed Path | Change |
|-------------|---------------|--------|
| `runtimes/claude-code/commands/forge/` | `.claude/commands/motif/` | Directory name: `forge` -> `motif` |
| `core/` (with `{FORGE_ROOT}` references) | `.claude/get-motif/` | `{FORGE_ROOT}` -> `.claude/get-motif` |
| `runtimes/claude-code/agents/` (with `.claude/get-design-forge` references) | `.claude/get-motif/agents/` | Path refs: `get-design-forge` -> `get-motif` |
| `runtimes/claude-code/CLAUDE-MD-SNIPPET.md` | CLAUDE.md (injected) | Content may need path updates |

**Important: The installer does NOT rename files (e.g., `forge-researcher.md` stays `forge-researcher.md` inside the `agents/` directory). Only directory paths and path references within file contents change. The Phase 4 rebrand will handle renaming files and updating all "Design Forge" text references.**

**Recommendation for Phase 3:** Implement path resolution as a replacer function that runs on `.md` file contents during copy:
```javascript
function resolveContent(content, forgeRoot) {
  return content
    .replaceAll('{FORGE_ROOT}', forgeRoot)
    .replaceAll('.claude/get-design-forge', forgeRoot);
}
```

This keeps it simple for Phase 3 while Phase 4 handles the comprehensive rebrand.

## package.json Configuration

The installer requires a `package.json` for npm distribution. This is technically Phase 4 (DIST-01), but Phase 3 needs a working `package.json` for local testing with `npx`.

```json
{
  "name": "motif",
  "version": "0.1.0",
  "description": "Domain-intelligent design system for AI coding assistants",
  "bin": {
    "motif": "bin/install.js"
  },
  "files": [
    "bin/",
    "core/",
    "runtimes/",
    "scripts/"
  ],
  "engines": {
    "node": ">=22.0.0"
  },
  "license": "MIT",
  "keywords": ["design-system", "ai", "cli", "design-tokens"]
}
```

**Critical fields:**
- `bin.motif` maps `npx motif@latest` to `bin/install.js`
- `files` whitelists ONLY the directories that should ship in the npm package. Excludes `.planning/`, `docs/`, `.git/`, `.DS_Store`, `firebase-debug.log`
- `engines` enforces Node.js 22+ (required for `util.styleText` stability)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `commander` / `yargs` for CLI flags | `util.parseArgs` (built-in) | Node 18.3.0 (stable v20.0.0) | Zero dependencies for simple CLI tools |
| `chalk` for terminal colors | `util.styleText` (built-in) | Node 20.10.0 (stable v22.13.0) | Respects NO_COLOR natively, zero dependencies |
| `fs-extra.copySync` | `fs.cpSync` (built-in) | Node 16.7.0 (stable v22+) | Recursive copy with filter function, zero dependencies |
| Custom recursive directory walk | `fs.readdirSync(dir, { recursive: true })` | Node 18.17.0 | Flat list of all files recursively, built-in |
| Manual `.npmignore` | `package.json "files"` whitelist | Long-standing best practice | Explicit inclusion is safer than exclusion |

**Deprecated/outdated:**
- `postinstall` scripts for `npx` tools: They do not execute for `npx` invocations. Use `bin` entry point.
- `fs-extra`: No longer needed for file operations on Node 22+. Every operation has a built-in equivalent.
- Manual shebang handling: npm handles the `#!/usr/bin/env node` shebang and creates `.cmd` shims on Windows automatically.

## Open Questions

1. **Command namespace: `/forge:*` vs `/motif:*` at install time**
   - What we know: Source files use `/forge:*` command names. Requirements say install to `.claude/commands/motif/`. Claude Code derives slash-command names from the directory path, so `.claude/commands/motif/init.md` becomes `/motif:init`.
   - What's unclear: The content inside command files (descriptions, help text) still references "forge" and "Design Forge." Should the installer resolve these text references too, or leave that for Phase 4 rebrand?
   - Recommendation: The installer should resolve PATH references (`.claude/get-design-forge` -> `.claude/get-motif`) but NOT rename product text ("Design Forge" -> "Motif"). Path resolution is functional (broken paths break the product). Text rebrand is cosmetic (wrong name does not break functionality). Phase 4 handles the full text rebrand.

2. **CLAUDE.md location: project root vs `.claude/CLAUDE.md`**
   - What we know: The init command references both locations. Claude Code reads CLAUDE.md from the project root OR from `.claude/CLAUDE.md`.
   - What's unclear: Which location should the installer target? Should it detect which one exists?
   - Recommendation: Target project root `CLAUDE.md` first. If it does not exist but `.claude/CLAUDE.md` does, use that. If neither exists, create at project root. This matches Claude Code's documented behavior of checking both locations.

3. **Scripts directory -- does it exist yet?**
   - What we know: The `scripts/` directory is listed in the source mapping and in `package.json` files whitelist. REQUIREMENTS for scripts are in Phase 6 (SCRP-01, SCRP-02).
   - What's unclear: The `scripts/` directory currently contains no files. The installer mapping copies `scripts/` to `.claude/get-motif/scripts/`.
   - Recommendation: If `scripts/` is empty at Phase 3 time, skip the copy. The installer should gracefully handle missing source directories: `if (fs.existsSync(srcDir))` before attempting to copy.

4. **Hooks directory -- not yet built**
   - What we know: `runtime-adapters.md` maps `runtimes/claude-code/hooks/` to `.claude/hooks/` (merge, don't overwrite). Hooks are Phase 6 (HOOK-01 through HOOK-04).
   - What's unclear: How to handle the hooks directory mapping when no hooks exist yet.
   - Recommendation: Same as scripts -- skip if source directory is empty or missing. The installer should be idempotent and handle partial content gracefully.

## Sources

### Primary (HIGH confidence)
- [Node.js fs documentation](https://nodejs.org/api/fs.html) -- `cpSync`, `readdirSync` with `{ recursive: true }`, `mkdirSync`, all Stability 2 (Stable)
- [Node.js util documentation](https://nodejs.org/api/util.html) -- `parseArgs` (stable v20.0.0), `styleText` (stable v22.13.0)
- [Node.js crypto documentation](https://nodejs.org/api/crypto.html) -- `createHash('sha256')` for content hashing
- Project spec (`GSD-PROJECT-SPEC.md`) -- architecture, constraints, install mapping
- Project architecture research (`.planning/research/ARCHITECTURE.md`) -- install flow, manifest pattern, anti-patterns
- Project pitfalls research (`.planning/research/PITFALLS.md`) -- installer-specific pitfalls with prevention strategies
- Project requirements (`.planning/REQUIREMENTS.md`) -- INST-01 through INST-08 specifications
- Runtime adapters reference (`core/references/runtime-adapters.md`) -- detection logic, install mapping per runtime
- CLAUDE-MD-SNIPPET (`runtimes/claude-code/CLAUDE-MD-SNIPPET.md`) -- config injection content

### Secondary (MEDIUM confidence)
- [npm package.json docs](https://docs.npmjs.com/cli/v6/configuring-npm/package-json/) -- `bin`, `files`, `engines` fields
- [npm Blog: Building a simple command line tool](https://blog.npmjs.org/post/118810260230/building-a-simple-command-line-tool-with-npm) -- shebang and bin field setup
- [shadcn/ui CLI](https://ui.shadcn.com/docs/cli) -- Comparable install pattern: npx init, file copying, config injection
- [Node.js chalk to styleText migration guide](https://nodejs.org/en/blog/migrations/chalk-to-styleText) -- Official migration reference

### Tertiary (LOW confidence)
- None -- all findings verified with primary or secondary sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all Node.js stdlib APIs verified against official docs, zero external deps
- Architecture: HIGH -- installer pattern well-specified in project research and runtime-adapters.md
- Pitfalls: HIGH -- documented in project pitfalls research with concrete prevention strategies and cross-verified against project requirements
- {FORGE_ROOT} resolution: HIGH -- grep confirms exact usage locations, requirements are explicit
- Rebrand mapping: MEDIUM -- Phase 4 dependency creates uncertainty about exact scope of text replacement in Phase 3

**Research date:** 2026-03-01
**Valid until:** 2026-04-01 (stable domain -- Node.js stdlib APIs do not change frequently)
