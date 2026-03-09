# Phase 19: Global CLI Core - Research

**Researched:** 2026-03-09
**Domain:** npm global CLI installation, dual-mode (global + npx) package distribution, subcommand routing
**Confidence:** HIGH

## Summary

Phase 19 transforms the existing `npx motif-design@latest` installer into a dual-mode CLI that also works as a globally installed command (`npm install -g motif-design`). The existing `bin/install.js` already handles the full installation pipeline (file copying, CLAUDE.md injection, hook setup, manifest writing, verification). The main work is: (1) refactoring install.js into a subcommand router that dispatches `motif init` to the existing install logic, (2) adding project root detection that walks up directories, (3) fixing the self-referencing dependency bug in package.json, and (4) ensuring both install paths resolve source files correctly.

The critical technical insight is that npm's `bin` field already supports both modes. When `npm install -g motif-design` runs, npm creates a symlink from the global bin directory to `bin/install.js`. When `npx motif-design@latest` runs, it downloads the package to a temp cache and executes the same `bin` entry. The key is that `__dirname` resolves to the **real** file location (not the symlink), so `path.dirname(__dirname)` will correctly find `core/`, `runtimes/`, and `scripts/` regardless of install mode. This means the existing file resolution logic in `resolveMapping()` will work without changes for global installs.

The self-referencing dependency bug (`"motif-design": "^0.1.0"` in the `dependencies` of `motif-design` itself) must be fixed as a prerequisite. This causes npm to attempt to install the package inside itself during `npm install -g`, which either fails or creates a confusing nested structure. Since the package has zero real dependencies (it uses only Node.js built-ins), the `dependencies` field should be removed entirely.

**Primary recommendation:** Refactor `bin/install.js` into a CLI router (`bin/cli.js`) with subcommand dispatch, move current install logic into `bin/commands/init.js`, add project root detection, fix the self-referencing dependency, and update package.json `bin` field.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| node:util (parseArgs) | Node 22+ | CLI argument parsing with subcommands | Zero dependencies, built into Node.js, already used in install.js |
| node:fs | Node 22+ | File system operations | Already used throughout |
| node:path | Node 22+ | Cross-platform path resolution | Already used throughout |
| node:crypto | Node 22+ | SHA-256 file hashing for manifest | Already used in install.js |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| node:util (styleText) | Node 22+ | Terminal coloring | Already used in install.js for output |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| node:util parseArgs | commander / yargs | External dependencies for a zero-dependency package; parseArgs is sufficient for the subcommand set (init, status, update, doctor, list) |
| Hand-rolled project root detection | find-up / pkg-dir | External dependency; project root detection is ~15 lines of code for this use case |

**Installation:**
```bash
# No new dependencies needed. This package remains zero-dependency.
```

## Architecture Patterns

### Recommended Project Structure
```
bin/
├── cli.js           # Entry point: shebang, subcommand router
├── commands/
│   └── init.js      # Current install.js logic extracted here
└── lib/
    └── find-root.js # Project root detection utility
```

### Pattern 1: Subcommand Router with parseArgs
**What:** A thin CLI entry point that parses the first positional argument as a subcommand and dispatches to the appropriate handler module.
**When to use:** When the CLI has multiple subcommands (init, status, update, doctor, list) and each is complex enough to warrant its own file.
**Example:**
```javascript
#!/usr/bin/env node
'use strict';

const { parseArgs } = require('node:util');

// Phase 19 subcommands (init only)
// Phase 20 will add: status, update, doctor, list
const commands = {
  init: () => require('./commands/init.js'),
};

const { positionals } = parseArgs({
  args: process.argv.slice(2),
  allowPositionals: true,
  strict: false, // Allow unknown options to pass through to subcommands
});

const subcommand = positionals[0];

if (!subcommand || subcommand === 'help' || process.argv.includes('--help') || process.argv.includes('-h')) {
  printHelp();
  process.exit(0);
}

if (!commands[subcommand]) {
  // Backward compatibility: no subcommand = legacy npx behavior = run init
  // This handles: npx motif-design@latest --runtime claude-code
  require('./commands/init.js').run(process.argv.slice(2));
} else {
  commands[subcommand]().run(process.argv.slice(3));
}
```

### Pattern 2: Backward-Compatible npx Detection
**What:** Detect whether the CLI was invoked as `motif init` (global) or `npx motif-design@latest` (npx) and handle both gracefully. When invoked without a known subcommand, treat all arguments as init flags (backward compatibility).
**When to use:** Always -- this is how dual-mode works.
**Example:**
```javascript
// If the first positional is NOT a known subcommand, assume legacy npx mode
// npx motif-design@latest --force  =>  equivalent to  motif init --force
// motif init --force               =>  explicit subcommand mode
const isLegacyMode = !commands[positionals[0]];
if (isLegacyMode) {
  require('./commands/init.js').run(process.argv.slice(2));
}
```

### Pattern 3: Project Root Detection
**What:** Walk up from cwd to find the nearest directory containing `.git/` or `package.json`, which indicates a project root.
**When to use:** When running `motif init` from a subdirectory or when validating that the user is inside a project.
**Example:**
```javascript
function findProjectRoot(startDir) {
  let dir = startDir;
  const { root } = path.parse(dir);

  while (dir !== root) {
    if (fs.existsSync(path.join(dir, '.git')) || fs.existsSync(path.join(dir, 'package.json'))) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  return null; // Not inside a project
}
```

### Anti-Patterns to Avoid
- **Renaming the npm package bin entry:** The `bin.motif` field already maps to the right command name. Do NOT add a separate package for the global install.
- **Using process.cwd() as project root without validation:** Always walk up to find .git or package.json. The user might be in a subdirectory.
- **Breaking the existing npx install path:** Every change must preserve backward compatibility with `npx motif-design@latest [flags]`.
- **Adding dependencies to package.json:** This package is zero-dependency by design. Use only Node.js built-in modules.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Argument parsing | Custom string splitting | `node:util parseArgs` | Already used, handles edge cases (quoted strings, equals signs) |
| Terminal colors | ANSI escape sequences | `node:util styleText` | Already used, cross-platform |
| File hashing | Custom implementation | `node:crypto createHash` | Already used, SHA-256 |

**Key insight:** This project is intentionally zero-dependency. All tooling must come from Node.js built-ins. This is a feature, not a limitation -- it means the package installs instantly and has no supply chain risk.

## Common Pitfalls

### Pitfall 1: Self-Referencing Dependency Causes Global Install Failure
**What goes wrong:** The current package.json has `"dependencies": { "motif-design": "^0.1.0" }` -- the package depends on itself. When running `npm install -g motif-design`, npm tries to install `motif-design` inside `motif-design`'s `node_modules`, which either fails or creates a confusing nested structure.
**Why it happens:** This was likely a copy-paste error or placeholder from early development.
**How to avoid:** Remove the `dependencies` field entirely from package.json. This package uses only Node.js built-ins and has no real dependencies.
**Warning signs:** `npm install -g motif-design` hangs, produces warnings about circular dependencies, or creates a `node_modules` folder inside the global package.

### Pitfall 2: Breaking npx Backward Compatibility
**What goes wrong:** After adding subcommand routing, `npx motif-design@latest --force` stops working because the router expects a subcommand as the first positional.
**Why it happens:** Existing users run `npx motif-design@latest [flags]` without any subcommand. The new router must handle this case.
**How to avoid:** When no recognized subcommand is found, fall back to treating all arguments as init flags. This makes `npx motif-design@latest --force` equivalent to `motif init --force`.
**Warning signs:** Existing e2e tests in `test/e2e-installer.js` fail after refactoring.

### Pitfall 3: __dirname Resolution Differs Between npx and Global
**What goes wrong:** Assuming `__dirname` points to the same location in both modes.
**Why it happens:** In global mode, npm creates a symlink but Node.js resolves `__dirname` to the real path. In npx mode, the package lives in a temporary cache directory.
**How to avoid:** Always use `path.dirname(__dirname)` (or a computed package root) to find source files. Never hardcode paths. The existing `resolveMapping()` function already does this correctly with `const pkgDir = path.dirname(__dirname)`.
**Warning signs:** "Source not found" errors when copying files.

### Pitfall 4: Project Root Detection Too Aggressive or Too Lenient
**What goes wrong:** Walking up too far (reaching `/` and using it as project root) or not walking up at all (requiring user to be in exact project root).
**Why it happens:** Different directory structures -- monorepos with nested .git, projects without package.json, etc.
**How to avoid:** Stop at filesystem root. Require BOTH markers (.git OR package.json). Refuse to install with clear error if no project root found.
**Warning signs:** Motif files installed in wrong directory, or unclear error messages.

### Pitfall 5: package.json `files` Field Omits New Directories
**What goes wrong:** After restructuring bin/ to have bin/commands/ and bin/lib/, the `files` field in package.json still only lists `"bin/"`, which should capture subdirectories. But if the entry point path changes, the `bin` field must be updated too.
**Why it happens:** The `files` field controls what gets published to npm. The `bin` field controls what gets symlinked.
**How to avoid:** After restructuring, verify both fields. Run `npm pack --dry-run` to confirm all files are included.
**Warning signs:** `npm install -g` works locally via `npm link` but fails from the registry because files are missing from the published package.

### Pitfall 6: Windows Path Separators in Hook Commands
**What goes wrong:** Hook commands use `$CLAUDE_PROJECT_DIR` with forward slashes, which may not resolve on Windows.
**Why it happens:** The hooks in settings.json use Unix-style paths: `node "$CLAUDE_PROJECT_DIR"/.claude/get-motif/hooks/motif-token-check.js`
**How to avoid:** This is noted as a known concern (Windows hook compatibility unverified). For Phase 19, document this as a known limitation. Claude Code on Windows support status should be checked before investing in Windows path fixes.
**Warning signs:** Hooks fail silently on Windows.

## Code Examples

Verified patterns from the existing codebase:

### Current Argument Parsing (install.js lines 11-23)
```javascript
// Source: bin/install.js
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

### Current Source Resolution (install.js lines 72-94)
```javascript
// Source: bin/install.js
// This pattern already works for both npx and global install
function resolveMapping(runtime) {
  const pkgDir = path.dirname(__dirname);  // Works because __dirname resolves to real path
  const cwd = process.cwd();
  // ... builds copy mappings from pkgDir to cwd
}
```

### Project Root Detection (new code)
```javascript
// Source: new utility for Phase 19
function findProjectRoot(startDir) {
  let dir = path.resolve(startDir);
  const { root } = path.parse(dir);

  while (dir !== root) {
    // .git can be a file (git worktrees/submodules) or directory
    if (fs.existsSync(path.join(dir, '.git')) || fs.existsSync(path.join(dir, 'package.json'))) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  return null;
}

// Usage in init command:
const projectRoot = findProjectRoot(process.cwd());
if (!projectRoot) {
  console.error(styleText('red', 'Not inside a project directory.'));
  console.error('Run this command from a directory that contains .git/ or package.json');
  process.exit(1);
}
// Use projectRoot instead of process.cwd() for all file operations
```

### Subcommand-Aware parseArgs
```javascript
// Source: Node.js docs pattern for parseArgs with subcommands
const { parseArgs } = require('node:util');

// First pass: extract subcommand
const { positionals } = parseArgs({
  args: process.argv.slice(2),
  allowPositionals: true,
  strict: false,
});

const subcommand = positionals[0];

// Second pass: parse flags for the specific subcommand
// Each command module handles its own flag parsing from the remaining args
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `npx motif-design@latest` only | Dual: `npm i -g motif-design` + `npx` | Phase 19 | Users can install once, use everywhere |
| `process.cwd()` as install target | `findProjectRoot(cwd)` walk-up | Phase 19 | Works from subdirectories |
| Single entry point (install.js) | Subcommand router (cli.js -> commands/) | Phase 19 | Extensible for Phase 20 commands |
| Self-referencing dependency | Zero dependencies | Phase 19 | Global install works correctly |

**Deprecated/outdated:**
- `bin/install.js` as direct entry point: Will be replaced by `bin/cli.js` (or renamed and refactored in place)
- `"dependencies": { "motif-design": "^0.1.0" }`: Must be removed

## Open Questions

1. **Should cli.js replace install.js or wrap it?**
   - What we know: The `bin` field currently points to `bin/install.js`. Changing it to `bin/cli.js` is cleaner but means updating the package.json `bin` field.
   - What's unclear: Whether to keep install.js as a backward-compat shim or do a clean break.
   - Recommendation: Clean break. Rename/restructure to `bin/cli.js` as the entry point. The `bin` field in package.json controls what name gets exposed; the filename is an implementation detail. Since `"motif": "bin/cli.js"` produces the same `motif` command, there is no user-facing change.

2. **How deep should project root detection go?**
   - What we know: Success criteria says "walks up to find .git/ or package.json". Monorepos may have multiple package.json files at different levels.
   - What's unclear: Should it find the nearest package.json (could be a sub-package) or the .git root (always the repo root)?
   - Recommendation: Find the nearest directory with .git OR package.json, preferring .git when both exist at different levels. This matches user intuition -- they think of "project" as the git repo.

3. **Should `motif init` change cwd to the project root?**
   - What we know: Currently install.js uses `process.cwd()` as the install target. With root detection, the install target could be the detected root, not cwd.
   - What's unclear: If the user is in `src/components/`, should Motif be installed relative to the git root?
   - Recommendation: Yes, always install relative to the detected project root. Print a message: "Installing to project root: /path/to/project" so the user knows.

4. **Windows compatibility status?**
   - What we know: The blockers section mentions "Windows hook compatibility unverified for global install paths ($HOME, $CLAUDE_PROJECT_DIR)". Claude Code's Windows support status is unclear.
   - What's unclear: Whether Claude Code even runs on Windows currently.
   - Recommendation: Do not invest in Windows-specific fixes for Phase 19. Document as known limitation. The core Node.js file operations (fs, path) are already cross-platform.

5. **Version bump strategy?**
   - What we know: Current version is 0.2.2. This is a significant feature addition.
   - What's unclear: Whether to bump to 0.3.0 (minor) or keep incrementing patch.
   - Recommendation: Bump to 0.3.0 since this adds a new capability (global install). This is decided outside Phase 19 scope but worth noting.

## Sources

### Primary (HIGH confidence)
- Existing codebase: `bin/install.js` (746 lines) -- full installer logic, argument parsing, file copying, verification
- Existing codebase: `package.json` -- confirmed self-referencing dependency bug, bin field structure
- Existing codebase: `test/e2e-installer.js` -- test patterns for installer verification
- Existing codebase: `scripts/check-version.js` -- version checking pattern
- [npm package.json docs](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/) -- bin field behavior for global installs
- [Node.js parseArgs documentation](https://nodejs.org/api/util.html) -- parseArgs with allowPositionals for subcommands

### Secondary (MEDIUM confidence)
- [2ality: parseArgs with subcommands](https://2ality.com/2022/08/node-util-parseargs.html) -- pattern for subcommand routing with parseArgs
- [2ality: Installing Node.js bin scripts](https://2ality.com/2022/08/installing-nodejs-bin-scripts.html) -- global vs local bin behavior
- [npm blog: Adding subcommands](https://blog.npmjs.org/post/119317128765/adding-subcommands-to-your-command-line-tool.html) -- subcommand patterns

### Tertiary (LOW confidence)
- Windows global install paths -- based on WebSearch, not verified against Claude Code's actual Windows support

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - zero-dependency package using only Node.js built-ins, all already in use
- Architecture: HIGH - refactoring existing working code into subcommand structure is well-understood
- Pitfalls: HIGH - self-referencing bug confirmed by reading package.json, backward compat risk is well-understood
- Project root detection: MEDIUM - simple algorithm but edge cases in monorepos need testing

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (stable domain -- npm packaging and Node.js built-ins change slowly)
