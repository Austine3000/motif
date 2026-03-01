# Stack Research

**Domain:** npm-distributed CLI installer for AI design engineering tools
**Researched:** 2026-03-01
**Confidence:** HIGH

## Design Principle: Zero Dependencies, Node.js Stdlib Only

Design Forge is NOT a traditional Node.js application. It is a markdown-first design intelligence system with a thin Node.js installer layer. The JavaScript portions are:

1. **`bin/install.js`** -- runtime-detecting installer that copies files into AI coding assistant config directories
2. **`runtimes/claude-code/hooks/*.js`** -- Claude Code PostToolUse hooks (lint-style checks)
3. **`scripts/*.js`** -- standalone utilities (contrast checker, token counter)

Every JS file must use zero npm dependencies. Node.js 22+ stdlib provides everything needed.

---

## Recommended Stack

### Core Runtime

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Node.js | >=22.0.0 | Runtime for installer, hooks, scripts | LTS (Active until Oct 2025, Maintenance until Apr 2027). Node 22 is the stable floor where `fs.cpSync`, `fs.globSync`, `util.parseArgs`, `util.styleText`, and `import.meta.dirname` are all available and stable. Node 24 (LTS Oct 2025) is also supported but 22 is the safe minimum. |

**Confidence:** HIGH -- Verified via official Node.js release schedule and API docs.

### Module System

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| CommonJS (`require`) | N/A | Module format for all JS files | Zero-dep CLI installers should use CommonJS. No build step, no transpilation, maximum compatibility. Users running `npx` may be on older npm versions. The `"type"` field defaults to `"commonjs"` when omitted. ESM adds complexity (import.meta workarounds, .mjs extensions) with no benefit for a file-copying installer. |

**Confidence:** HIGH -- CommonJS is the default for Node.js packages and requires no configuration. The project has no modules to import/export between files; each JS file is self-contained.

### Package Configuration

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `package.json` `bin` field | npm >=7 | Maps `design-forge` command to `bin/install.js` | Standard npm pattern. When user runs `npx design-forge@latest`, npm downloads the package and executes the file specified in `bin`. Single entry: `"bin": { "design-forge": "bin/install.js" }` |
| `package.json` `files` field | npm >=7 | Whitelist published files | Use `"files": ["bin/", "core/", "runtimes/", "scripts/"]` to explicitly include only what's needed. This is safer than `.npmignore` -- whitelist beats blacklist. Keeps package lean (no docs, no .planning, no .git). |
| `package.json` `engines` field | npm >=7 | Enforce Node.js >=22 | `"engines": { "node": ">=22.0.0" }` prevents confusing errors from missing APIs on older Node versions. |

**Confidence:** HIGH -- Verified via npm official documentation.

---

## Node.js Stdlib APIs (The "Stack")

Since this project has zero dependencies, the Node.js standard library IS the stack. Every API listed below is **Stability 2 (Stable)** in Node.js 22+.

### File System -- `node:fs`

| API | Purpose | Why This API | Confidence |
|-----|---------|--------------|------------|
| `fs.cpSync(src, dest, { recursive: true })` | Copy entire `core/` and `runtimes/` directories to target | Built-in recursive directory copy. Added v16.7.0, stable. Replaces need for `fs-extra` or manual recursive walk. Single call copies an entire directory tree. | HIGH |
| `fs.mkdirSync(path, { recursive: true })` | Create target directories (`.claude/`, `.claude/commands/forge/`, etc.) | `recursive: true` creates parent directories, like `mkdir -p`. No error if exists. | HIGH |
| `fs.existsSync(path)` | Runtime detection (check for `.claude/`, `.opencode/`, etc.) | Synchronous check for directory existence. Used in `detectRuntime()` to find which AI coding assistant is present. | HIGH |
| `fs.readFileSync(path, 'utf8')` | Read config files for injection (CLAUDE.md, settings.json) | Read existing config before appending Design Forge snippet. | HIGH |
| `fs.writeFileSync(path, data)` | Write modified config files | Write back config with appended snippet. | HIGH |
| `fs.appendFileSync(path, data)` | Append config snippet to CLAUDE.md | Simpler than read+concat+write when appending to existing config. | HIGH |
| `fs.readdirSync(path, { recursive: true })` | List files for verification after install | Verify all expected files were copied. `recursive` option available since Node 18.17. | HIGH |
| `fs.statSync(path)` | Check file types, sizes for verification | Post-install verification that copied files are non-empty. | HIGH |
| `fs.copyFileSync(src, dest)` | Copy individual files (hooks, config snippets) | For single-file copies where `cpSync` is overkill. | HIGH |
| `fs.renameSync(oldPath, newPath)` | Backup existing files before overwrite | Rename existing CLAUDE.md to CLAUDE.md.bak before injection. | HIGH |

**Source:** [Node.js fs documentation](https://nodejs.org/api/fs.html) -- All APIs listed are Stability 2 (Stable).

### Path Resolution -- `node:path`

| API | Purpose | Why This API | Confidence |
|-----|---------|--------------|------------|
| `path.join(...segments)` | Build file paths cross-platform | Handles `/` vs `\` automatically. Never concatenate paths with string templates. | HIGH |
| `path.resolve(...segments)` | Get absolute path from relative | Resolves `./core/` relative to package root into absolute path. | HIGH |
| `path.dirname(filePath)` | Get parent directory | Navigate from `bin/install.js` to package root. | HIGH |
| `path.basename(filePath)` | Extract filename from path | Useful for logging which file is being copied. | HIGH |
| `path.relative(from, to)` | Create relative paths for display | Show user-friendly relative paths in install output. | HIGH |

**Source:** [Node.js path documentation](https://nodejs.org/api/path.html) -- Stable since Node.js inception.

### CLI Argument Parsing -- `node:util`

| API | Purpose | Why This API | Confidence |
|-----|---------|--------------|------------|
| `util.parseArgs(config)` | Parse `--runtime`, `--force`, `--dry-run` flags | Built-in argument parser. Added v18.3, stable since v20.0. Supports `boolean` and `string` types, short flags (`-r`), strict mode, and defaults. Eliminates need for `commander`, `yargs`, or `minimist`. | HIGH |

**Usage for Design Forge:**
```javascript
const { parseArgs } = require('node:util');

const { values } = parseArgs({
  options: {
    runtime: { type: 'string', short: 'r' },
    force: { type: 'boolean', short: 'f', default: false },
    'dry-run': { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false },
    verbose: { type: 'boolean', short: 'v', default: false },
  },
  strict: true,
});
```

**Source:** [Node.js util.parseArgs documentation](https://nodejs.org/api/util.html) -- Stable since v20.0.0.

### Terminal Output -- `node:util`

| API | Purpose | Why This API | Confidence |
|-----|---------|--------------|------------|
| `util.styleText(format, text)` | Colored terminal output during install | Built-in ANSI color support. Added v20.12.0, stable since v22.13.0. Replaces `chalk` for basic colors. Respects `NO_COLOR` and `FORCE_COLOR` environment variables automatically. | HIGH |

**Usage for Design Forge:**
```javascript
const { styleText } = require('node:util');

console.log(styleText('green', 'Design Forge installed successfully'));
console.log(styleText('yellow', 'Warning: existing CLAUDE.md backed up'));
console.log(styleText('red', 'Error: could not detect runtime'));
console.log(styleText(['bold', 'cyan'], 'Design Forge v1.0.0'));
```

**Source:** [Node.js migration guide: Chalk to styleText](https://nodejs.org/en/blog/migrations/chalk-to-styletext) -- Stable since v22.13.0.

### Process Information -- `node:process`

| API | Purpose | Why This API | Confidence |
|-----|---------|--------------|------------|
| `process.cwd()` | Get user's project directory (install target) | Where the user ran `npx design-forge@latest`. This is the project root. | HIGH |
| `process.argv` | Raw argument access (fallback) | Backup if `parseArgs` needs debugging. `process.argv[2]` is the first user arg. | HIGH |
| `process.exit(code)` | Exit with status code | `exit(0)` on success, `exit(1)` on failure. Important for CI/CD pipelines. | HIGH |
| `process.env` | Environment variable access | Check `NO_COLOR`, `CI`, `TERM` for output formatting decisions. | HIGH |

### Child Process -- `node:child_process`

| API | Purpose | Why This API | Confidence |
|-----|---------|--------------|------------|
| `child_process.execSync(cmd)` | Run post-install verification commands | Could verify git status, check Claude Code is installed, etc. Use sparingly. | MEDIUM |

**Note:** The installer primarily copies files and modifies config. Child process usage should be minimal -- prefer direct `fs` operations over shelling out.

---

## Package.json Specification

```json
{
  "name": "design-forge",
  "version": "1.0.0",
  "description": "Design engineering system for AI coding assistants",
  "bin": {
    "design-forge": "bin/install.js"
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
  "keywords": [
    "design-system",
    "ai",
    "claude-code",
    "design-tokens",
    "cli"
  ],
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/sailslab/design-forge"
  }
}
```

**Key decisions:**
- No `"type": "module"` -- defaults to CommonJS. Simpler, no import.meta workarounds.
- No `"scripts"` section needed -- this is not a project with build/test scripts for npm to run.
- No `"dependencies"` or `"devDependencies"` -- zero deps is a hard constraint.
- No `"main"` or `"exports"` -- this package is not imported by other code, only executed via `bin`.
- `"files"` whitelist is critical -- prevents publishing `.planning/`, `docs/`, `GSD-PROJECT-SPEC.md`, etc.

---

## bin/install.js Shebang

```javascript
#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { parseArgs } = require('node:util');
const { styleText } = require('node:util');

// ... installer logic
```

**Why `#!/usr/bin/env node`:** Portable shebang that finds `node` via PATH. Direct paths like `#!/usr/bin/node` fail on systems where Node is installed elsewhere (nvm, fnm, Homebrew).

**Why `'use strict'`:** Catches common bugs (undeclared variables, silent failures). Zero cost, real benefit.

**Why `require('node:fs')` not `require('fs')`:** The `node:` protocol prefix is the modern standard (since Node 16). It explicitly signals "this is a Node.js built-in, not an npm package named `fs`." Prevents potential name collisions and makes imports self-documenting.

---

## Claude Code Hooks Format

Hooks are configured in `.claude/settings.json` (project-level, committable) or `.claude/settings.local.json` (local, gitignored).

### PostToolUse Hook Structure

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/get-design-forge/hooks/forge-token-check.js"
          }
        ]
      }
    ]
  }
}
```

### Hook Input (stdin JSON)

```json
{
  "session_id": "...",
  "tool_name": "Write",
  "tool_input": {
    "file_path": "/path/to/file.css",
    "content": "..."
  },
  "tool_output": "..."
}
```

### Hook Script Pattern

```javascript
#!/usr/bin/env node
'use strict';

// Read JSON from stdin
let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { input += chunk; });
process.stdin.on('end', () => {
  const data = JSON.parse(input);
  const filePath = data.tool_input?.file_path || '';

  // Only check CSS/JSX/TSX files
  if (!/\.(css|jsx|tsx|vue|html)$/.test(filePath)) {
    process.exit(0); // No action
  }

  // Check for violations...
  const content = data.tool_input?.content || '';
  // ... analysis logic ...

  // Output user-facing message if violations found
  if (violations.length > 0) {
    const output = {
      hookSpecificOutput: {
        hookEventName: "PostToolUse",
        message: `Design Forge: ${violations.length} token violation(s) found`
      }
    };
    process.stdout.write(JSON.stringify(output));
  }

  process.exit(0);
});
```

**Source:** [Claude Code Hooks Reference](https://code.claude.com/docs/en/hooks) -- Official documentation, verified 2026-03-01.

**Confidence:** HIGH -- Verified against official Claude Code hooks documentation.

---

## Alternatives Considered

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| CommonJS (`require`) | ESM (`import`) | ESM requires `"type": "module"` in package.json, needs `import.meta.dirname` workaround for `__dirname`, adds `.mjs` extension complexity. For a synchronous file-copying installer, CommonJS is simpler and equally performant. |
| `util.parseArgs` | `commander` / `yargs` / `minimist` | External dependencies. The project constraint is zero deps. `util.parseArgs` covers all needs: `--runtime <name>`, `--force`, `--dry-run`, `--help`. |
| `util.styleText` | `chalk` / `picocolors` / Raw ANSI codes | Chalk is a dependency. Raw ANSI codes don't respect `NO_COLOR`. `util.styleText` is built-in, respects env vars, and provides enough colors for installer output. |
| `fs.cpSync` | `fs-extra` / manual recursive copy | `fs-extra` is a dependency. Manual recursive copy is 30+ lines of code. `fs.cpSync` does it in one call. |
| `fs.appendFileSync` | Read + concat + write | For config injection (appending to CLAUDE.md), `appendFileSync` is one line vs three. Only use read+write when you need to modify existing content (not just append). |
| Synchronous `fs` APIs | Async `fs.promises` | The installer runs once, sequentially, and exits. Async adds complexity (async/await, error handling) with no performance benefit. Synchronous code is simpler to reason about for a linear installer script. |
| No test framework | Jest / Vitest / node:test | For v1.0, manual testing of `npx design-forge@latest` in a fresh project is sufficient. Adding a test framework for a file-copying installer is over-engineering. Consider `node:test` for v2.0 if the installer grows complex. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `npm postinstall` scripts | Security concern -- pnpm disables by default since 2025. Users increasingly run `--ignore-scripts`. Design Forge installs via explicit `npx` invocation, not as a dependency. | Explicit `bin` execution via `npx design-forge@latest` |
| `chalk` | Adds a dependency. Project constraint is zero deps. | `util.styleText` (built-in since Node 22) |
| `commander` / `yargs` | Adds a dependency. Overkill for 3-4 flags. | `util.parseArgs` (built-in since Node 18.3) |
| `fs-extra` | Adds a dependency. `fs.cpSync` provides recursive copy natively. | `node:fs` built-in APIs |
| `glob` (npm package) | Adds a dependency. `fs.readdirSync({ recursive: true })` or `fs.globSync` available in Node 22. | `node:fs` built-in APIs |
| `inquirer` / `prompts` | Adds a dependency. Interactive prompts are unnecessary -- use `--runtime` flag or auto-detect. | `util.parseArgs` for flags, `fs.existsSync` for detection |
| `ora` / `cli-spinners` | Adds a dependency. The install takes <1 second. Spinners are for long operations. | Simple `console.log` with `util.styleText` |
| `dotenv` | Adds a dependency. No environment variables needed beyond what Node provides. | `process.env` |
| `jest` / `vitest` (v1.0) | Over-engineering for a file-copying installer. Manual `npx` testing is sufficient. | Manual testing in fresh project directories |
| ESM (`import`) | Adds complexity with no benefit for this use case. Requires config changes, `import.meta` workarounds, and `.mjs` extensions. | CommonJS (`require`) |
| TypeScript | Adds a build step, which violates "no build step" constraint. All JS files are simple enough to not benefit from type checking. | Plain JavaScript with JSDoc comments if needed |

---

## Stack Patterns by Variant

**If adding Node.js 24 features in the future:**
- Node 24 entered LTS October 2025, with support until April 2028
- Can bump `engines.node` to `>=24.0.0` when Node 22 reaches end-of-life (April 2027)
- Node 24 adds: native `require(esm)` support, enhanced permission model
- No urgency to bump -- Node 22 has everything Design Forge needs

**If the project later needs a build step (it should not):**
- Only consider if TypeScript becomes necessary for complex hook logic
- Use `tsc` directly (no bundler), output to `dist/`
- But seriously, don't add a build step. The simplicity is a feature.

**If hooks need async operations:**
- Claude Code hooks support async execution naturally (they read stdin and write stdout)
- The hook script already handles async I/O via the `process.stdin` event pattern
- No need for `async/await` in the entry point -- event-driven pattern handles it

---

## Version Compatibility

| API | Minimum Node.js | LTS That Includes It | Notes |
|-----|-----------------|---------------------|-------|
| `fs.cpSync` | 16.7.0 | Node 18+ | Stable since introduction |
| `fs.readdirSync({ recursive })` | 18.17.0 | Node 18+ | Recursive option added later |
| `util.parseArgs` | 18.3.0 | Node 18+ | Stable since v20.0.0 |
| `util.styleText` | 20.12.0 | Node 22+ | Stable since v22.13.0 |
| `fs.globSync` | 22.0.0 | Node 22+ | Available but not critical for this project |
| `import.meta.dirname` | 20.11.0 | Node 22+ | Only relevant if using ESM (we are not) |

**The bottleneck is `util.styleText`** -- it requires Node 22+ for stable usage. This sets our `engines.node` floor at `>=22.0.0`. All other APIs are available in earlier versions.

**Fallback strategy:** If Node 22 is too aggressive a minimum, replace `util.styleText` with raw ANSI codes and drop to `>=18.18.0`. But Node 22 is the current LTS (until April 2027), so `>=22.0.0` is reasonable.

---

## WCAG Contrast Checker (scripts/contrast-checker.js)

The contrast checker utility uses pure math -- no dependencies needed.

**Algorithm (WCAG 2.1):**
1. Convert hex color to RGB
2. Convert sRGB to linear RGB: `v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ^ 2.4`
3. Calculate relative luminance: `L = 0.2126 * R + 0.7152 * G + 0.0722 * B`
4. Contrast ratio: `(L1 + 0.05) / (L2 + 0.05)` where L1 is lighter

**WCAG thresholds:** AA normal text: 4.5:1, AA large text: 3:1, AAA normal text: 7:1

**Confidence:** HIGH -- WCAG 2.1 specification is well-documented and the algorithm is pure math.

---

## Token Counter (scripts/token-counter.js)

Approximate token counting for `.planning/design/` markdown files.

**Approach:** Character-based estimation (no tiktoken dependency needed).
- Rough heuristic: 1 token per 4 characters (English text average)
- More accurate: split on whitespace + punctuation boundaries, count segments
- Good enough for "you have ~X tokens of context loaded" display

**Why not tiktoken:** tiktoken is a dependency with native bindings. The token counter is advisory, not precise. A +/-10% estimate is sufficient for context budget warnings.

**Confidence:** MEDIUM -- The 4-chars-per-token heuristic is well-established but imprecise. Sufficient for advisory purposes.

---

## Sources

- [Node.js fs documentation](https://nodejs.org/api/fs.html) -- `fs.cpSync`, `fs.mkdirSync`, all Stability 2 (Stable). Verified 2026-03-01.
- [Node.js util documentation](https://nodejs.org/api/util.html) -- `util.parseArgs` (stable v20.0.0), `util.styleText` (stable v22.13.0). Verified 2026-03-01.
- [Node.js release schedule](https://nodejs.org/en/about/previous-releases) -- Node 22 LTS (Active to Oct 2025, Maintenance to Apr 2027), Node 24 LTS (Active Oct 2025, EOL Apr 2028). Verified 2026-03-01.
- [npm package.json docs](https://docs.npmjs.com/cli/v7/configuring-npm/package-json/) -- `bin`, `files`, `engines` fields.
- [Node.js Chalk to styleText migration](https://nodejs.org/en/blog/migrations/chalk-to-styletext) -- Official migration guide confirming `util.styleText` as Chalk replacement.
- [Claude Code Hooks Reference](https://code.claude.com/docs/en/hooks) -- PostToolUse hook format, matcher patterns, stdin JSON schema. Verified 2026-03-01.
- [Node.js CLI best practices](https://github.com/lirantal/nodejs-cli-apps-best-practices) -- Community best practices for CLI apps.
- [Node.js in 2026: Native-First Revolution](https://www.bolderapps.com/blog-posts/node-js-in-2026-the-native-first-revolution-and-the-end-of-dependency-hell) -- Industry trend toward zero-dependency Node.js.
- [WCAG 2.1 Contrast Algorithm](https://dev.to/alvaromontoro/building-your-own-color-contrast-checker-4j7o) -- Pure JS implementation reference.

---
*Stack research for: npm-distributed CLI installer for AI design engineering tools*
*Researched: 2026-03-01*
