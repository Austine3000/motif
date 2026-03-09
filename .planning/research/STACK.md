# Technology Stack

**Project:** Motif v1.3 -- Global Install, Context Resilience, New Verticals
**Researched:** 2026-03-09
**Overall Confidence:** HIGH

## Scope

This document covers stack additions/changes for three new capabilities:
1. **Global CLI install** (`npm install -g motif-design`)
2. **Context-resilient state machine** (state persists across `/clear` and compaction)
3. **4 new verticals** (Social, Education, Marketplace, DevTools)

Existing stack is validated and not re-researched: pure Node.js, zero npm dependencies, Claude Code slash commands and hooks, CSS custom properties, CDN icons.

---

## 1. Global CLI Install

### Current State

The `bin` field in package.json maps `"motif"` to `bin/install.js`. Currently designed for `npx motif-design@latest` (per-project install only). The installer copies files into `$CWD/.claude/` and writes hooks to `$CWD/.claude/settings.json`.

### What Changes for `npm install -g`

| Aspect | Current (npx) | Needed (global) | Why |
|--------|---------------|-----------------|-----|
| **bin entry** | `"motif": "bin/install.js"` | Keep as-is | npm symlinks `bin/install.js` to `{prefix}/bin/motif` automatically on `npm install -g`. No change needed. |
| **Package resolution** | `path.dirname(__dirname)` resolves to npm cache | Same expression resolves to global `node_modules/motif-design/` | `__dirname` always points to the script's actual location, whether cached by npx or installed globally. |
| **Invocation** | `npx motif-design@latest` | `motif` (after global install) or still `npx motif-design@latest` | Both work. The `bin` field handles this. |
| **CWD requirement** | Must be in project root | Must be in project root | No change. User runs `motif` from their project directory. The installer copies into `$CWD/.claude/`. |

**Confidence: HIGH** -- verified against [npm package.json docs](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/) and current `bin/install.js` code.

### Recommendation: Minimal Changes Only

The existing `bin/install.js` already works for global install. When npm installs globally, it symlinks `{prefix}/bin/motif` to the installed `bin/install.js`. The script uses `path.dirname(__dirname)` to find its own package root for source files, and `process.cwd()` for the target project. Both resolve correctly whether invoked via npx or global install.

**What to add:**

| Change | Rationale | Effort |
|--------|-----------|--------|
| `--version` flag in `parseArgs` options | Users of globally installed CLIs expect `motif --version` | Trivial -- read `package.json` version |
| Update help text | Show `motif` as invocation option alongside `npx motif-design@latest` | Trivial |
| Remove self-referencing dependency | `package.json` lists `"motif-design": "^0.1.0"` in `dependencies` -- this is a bug that pulls in an old version of itself | Bug fix |
| Add `"preferGlobal": false` note in README | Guide users to prefer `npx` for one-off, `npm install -g` for frequent use | Docs only |

**What NOT to add:**

| Avoid | Why |
|-------|-----|
| Separate CLI framework (commander, yargs) | `node:util.parseArgs` is sufficient. Zero-dependency constraint. |
| Global config directory (`~/.motif/`) | State is per-project. Global config adds complexity with zero benefit. |
| `postinstall` scripts | The bin entry handles everything. No setup needed after `npm install -g`. |
| Auto-update mechanism | `npm update -g motif-design` covers this. No need to build our own. |

---

## 2. Context-Resilient State Machine

### The Problem

When a user runs `/clear` or context auto-compacts, the orchestrator loses its in-context knowledge of: current phase, which screens are composed, what to do next. Currently Motif relies on STATE.md (in `.planning/design/`) plus CLAUDE.md rules. But after `/clear`, the orchestrator starts fresh and must re-discover project state -- there is no automatic, guaranteed state recovery injection.

### Available Hook Mechanisms (Verified)

| Mechanism | How It Works | Status | Confidence |
|-----------|-------------|--------|------------|
| **SessionStart hook (matcher: "compact")** | Fires after compaction, stdout should be injected into context | **BUG**: stdout is silently dropped. Issue [#15174](https://github.com/anthropics/claude-code/issues/15174), closed as duplicate of [#13650](https://github.com/anthropics/claude-code/issues/13650). | LOW -- broken as of March 2026 |
| **SessionStart hook (matcher: "clear")** | Fires after `/clear`, stdout injected into context | Same underlying bug suspected | LOW -- likely broken |
| **SessionStart hook (matcher: "startup")** | Fires on fresh session start | Works reliably | HIGH |
| **CLAUDE.md rules** | Always loaded after compaction and `/clear` | Works reliably -- CLAUDE.md is always re-read | HIGH |
| **PreCompact hook** | Fires before compaction, can save state | Works but cannot inject into post-compact context | MEDIUM |
| **statusLine hook** | Always visible in the status bar | Works reliably for persistent display | HIGH |

### Recommended Approach: CLAUDE.md Directive + STATE.md + Enhanced statusLine

**Confidence: HIGH** -- uses only verified-working mechanisms.

Do NOT rely on SessionStart compact/clear hooks for state injection. They have a known, unresolved bug where stdout is silently dropped.

#### Layer 1: CLAUDE.md Recovery Directive

The CLAUDE-MD-SNIPPET.md already gets re-loaded after `/clear` and compaction. Add a mandatory recovery rule:

```markdown
## Recovery Protocol
After ANY session start, `/clear`, or compaction:
1. Read `.planning/design/STATE.md` FIRST before doing anything
2. STATE.md is the source of truth for phase, screens, and decisions
3. Never ask the user what to do -- STATE.md tells you
```

This costs zero new infrastructure. CLAUDE.md is always re-loaded by Claude Code. The instruction tells the model to self-recover by reading the file that already exists.

**Confidence: HIGH** -- CLAUDE.md re-loading after compaction/clear is documented behavior in [Claude Code settings docs](https://code.claude.com/docs/en/settings).

#### Layer 2: STATE.md as Durable State File

STATE.md already tracks phase, vertical, stack, screens table, decisions log, and context budget. No format changes needed. The key change: ensure STATE.md is ALWAYS the first file read after any context recovery, not just "available if asked."

#### Layer 3: Enhanced statusLine

The existing `motif-context-monitor.js` shows context percentage. Enhance it to also parse STATE.md and display current phase:

```
Motif: COMPOSING | 3/5 screens | context: 42%
```

**Implementation:** The statusLine script reads `.planning/design/STATE.md`, extracts the phase line via regex, counts screens in the table. Pure Node.js, zero dependencies -- fits the existing pattern exactly.

**Confidence: HIGH** -- statusLine hooks work reliably per [official docs](https://code.claude.com/docs/en/hooks).

### What NOT to Build for Context Resilience

| Anti-Pattern | Why Avoid |
|-------------|-----------|
| **Global state directory (`~/.motif/`)** | State is per-project. Global state creates cross-project contamination risk. `.planning/design/STATE.md` already works. |
| **`.motif-manifest.json` as state store** | The manifest tracks *installed files* (hashes, versions). Overloading it with workflow state conflates installation tracking with workflow tracking. Keep them separate. |
| **SessionStart compact hook for injection** | Broken. stdout silently dropped. Bug [#15174](https://github.com/anthropics/claude-code/issues/15174) is closed but not fixed. |
| **SQLite or JSON database** | Markdown is readable by both humans and LLMs. STATE.md is already the correct format. Adding a database violates the zero-dep, markdown-first architecture. |
| **Checkpoint/restore system with PreCompact** | Overly complex. CLAUDE.md re-read + STATE.md file read achieves the same result with zero new infrastructure. |
| **Custom env var injection via CLAUDE_ENV_FILE** | Environment variables are not the right mechanism for structured project state. STATE.md is richer and more readable. |

---

## 3. Hook Installation Strategy (Global Install Context)

### Current Hook Installation

Hooks are written to `$CWD/.claude/settings.json` (project-level). Hook commands reference scripts via `$CLAUDE_PROJECT_DIR`:

```json
{
  "type": "command",
  "command": "node \"$CLAUDE_PROJECT_DIR\"/.claude/get-motif/hooks/motif-token-check.js"
}
```

### Global vs Project Settings for Hooks

| Location | Scope | Recommendation |
|----------|-------|----------------|
| `~/.claude/settings.json` | All projects globally | **NOT recommended** for Motif hooks. Hooks should only fire in Motif-enabled projects. Running token-check on non-Motif projects would cause errors (missing `.claude/get-motif/` directory). |
| `.claude/settings.json` | Single project | **KEEP using this.** Hooks are installed per-project by the installer. |
| `.claude/settings.local.json` | Single project (gitignored) | Not appropriate -- Motif hooks should be team-shared. |

**Confidence: HIGH** -- verified against [Claude Code settings docs](https://code.claude.com/docs/en/settings). Settings merge across scopes (arrays concatenate), so project hooks and global user hooks coexist without conflict.

**Decision: Keep project-level hook installation.** Even with global CLI install, `motif` still runs per-project and installs hooks into `$CWD/.claude/settings.json`. Global install only changes how the user invokes the installer (`motif` instead of `npx motif-design@latest`), not where hooks live.

### Environment Variables Available in Hooks (Verified)

| Variable | Description | Available In | Confidence |
|----------|-------------|--------------|------------|
| `$CLAUDE_PROJECT_DIR` | Absolute path to project root | All hook types | HIGH -- [official docs](https://code.claude.com/docs/en/hooks) |
| `$CLAUDE_ENV_FILE` | File path for persisting env vars | SessionStart hooks only | HIGH -- official docs |
| `$CLAUDE_CODE_REMOTE` | `"true"` in remote web environments | All hooks | HIGH -- official docs |
| `$CLAUDE_PLUGIN_ROOT` | Plugin root directory | Plugin hooks only | HIGH -- official docs |

The current hook commands using `"$CLAUDE_PROJECT_DIR"` are correct and work identically whether Motif was installed via npx or global install.

---

## 4. New Verticals (Social, Education, Marketplace, DevTools)

### No Stack Changes Needed

New verticals are pure Markdown files following the existing template (`core/templates/VERTICAL-TEMPLATE.md`). They follow the exact structure of `core/references/verticals/fintech.md`:

- Navigation patterns (mobile, desktop, vertical-specific rules)
- Color system (3 palettes with 10-shade scales, light/dark mode values)
- Typography system (3 font pairings with Google Fonts CDN links)
- Component XML specs (vertical-specific components)
- Anti-patterns (what NOT to do in this vertical)
- Accessibility requirements

**Confidence: HIGH** -- the vertical template and existing 4 verticals (fintech, health, SaaS, e-commerce) are validated and stable.

### Integration Points

| Aspect | How It Works | Changes Needed |
|--------|-------------|----------------|
| File creation | Create `.md` file in `core/references/verticals/` | 4 new files |
| Vertical detection | `/motif:init` asks user, maps name to file path | Update init command to list new options |
| Installer | Copies entire `core/references/verticals/` directory | No change -- new files automatically included |
| Context loading | Workflows load `verticals/{vertical}.md` by name | No change -- path pattern already dynamic |

---

## Recommended Stack (Complete Summary)

### Zero New Dependencies -- Constraint Maintained

| Technology | Version | Purpose | Change Status |
|------------|---------|---------|---------------|
| Node.js | >=22.0.0 | Installer, hooks, scripts | No change |
| `node:fs` | built-in | File operations | No change |
| `node:path` | built-in | Path resolution | No change |
| `node:util` (parseArgs, styleText) | built-in | CLI flags, colored output | Add `--version` flag |
| `node:crypto` (createHash) | built-in | File hashing for manifest | No change |

### Files to Modify

| File | Change | Purpose |
|------|--------|---------|
| `bin/install.js` | Add `--version` flag, update help text to show `motif` invocation | Global install UX |
| `package.json` | Remove self-referencing `"motif-design": "^0.1.0"` dependency | Bug fix for clean global install |
| `runtimes/claude-code/CLAUDE-MD-SNIPPET.md` | Add Recovery Protocol section | Context resilience after `/clear` and compaction |
| `runtimes/claude-code/hooks/motif-context-monitor.js` | Parse STATE.md and display phase + screen count in statusLine | Context resilience -- always-visible state |
| `runtimes/claude-code/commands/motif/init.md` | Add Social, Education, Marketplace, DevTools to vertical selection list | New verticals |

### Files to Create

| File | Purpose | Template |
|------|---------|----------|
| `core/references/verticals/social.md` | Social vertical design intelligence | Follow `fintech.md` structure |
| `core/references/verticals/education.md` | Education vertical design intelligence | Follow `fintech.md` structure |
| `core/references/verticals/marketplace.md` | Marketplace vertical design intelligence | Follow `fintech.md` structure |
| `core/references/verticals/devtools.md` | DevTools vertical design intelligence | Follow `fintech.md` structure |

### The Self-Referencing Dependency Bug

The current `package.json` contains:
```json
"dependencies": {
  "motif-design": "^0.1.0"
}
```

This is a bug. The package lists itself as its own dependency at an old version. This causes `npm install -g motif-design` to pull in a stale copy alongside the current one, wasting space and potentially causing confusion. The `dependencies` field should be empty (or the entire key removed) to maintain the zero-dependency guarantee.

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| State recovery | CLAUDE.md directive + STATE.md read | SessionStart compact hook stdout injection | Hook stdout injection is buggy ([#15174](https://github.com/anthropics/claude-code/issues/15174), [#13650](https://github.com/anthropics/claude-code/issues/13650)). Not fixed as of March 2026. |
| State location | Per-project `.planning/design/STATE.md` | Global `~/.motif/state/{project-hash}.json` | Per-project state is simpler, no cross-project contamination, no path-hashing logic needed. |
| CLI framework | `node:util.parseArgs` (built-in) | commander, yargs, meow | Zero-dependency constraint. parseArgs handles `--version`, `--help`, `--force`, `--dry-run`, `--runtime`, `--uninstall` -- all current and planned flags. |
| Hook scope | Project `.claude/settings.json` | Global `~/.claude/settings.json` | Hooks should only fire in Motif-enabled projects. Global hooks would error on non-Motif projects. |
| Global config | None (not needed) | `~/.motif/config.json` for preferences | No global preferences exist. Everything is per-project. Adding global config is premature abstraction. |
| Context recovery display | Enhanced statusLine showing phase | Separate notification hook | statusLine is always visible. Notification hooks are interruptive and don't persist on screen. |

---

## Sources

- [npm package.json `bin` field](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/) -- HIGH confidence
- [npm install documentation](https://docs.npmjs.com/cli/v11/commands/npm-install/) -- HIGH confidence
- [Claude Code Settings documentation](https://code.claude.com/docs/en/settings) -- HIGH confidence
- [Claude Code Hooks reference](https://code.claude.com/docs/en/hooks) -- HIGH confidence
- [Claude Code Hooks guide (re-inject context after compaction)](https://code.claude.com/docs/en/hooks-guide) -- HIGH confidence
- [SessionStart compact hook bug #15174](https://github.com/anthropics/claude-code/issues/15174) -- HIGH confidence (verified closed as duplicate, not fixed)
- [SessionStart stdout dropped bug #13650](https://github.com/anthropics/claude-code/issues/13650) -- MEDIUM confidence (referenced but not directly inspected)
- Existing Motif codebase: `bin/install.js`, `motif-context-monitor.js`, `package.json`, `.motif-manifest.json` -- reviewed 2026-03-09

---
*Stack research for: Global CLI install, context resilience, new verticals*
*Researched: 2026-03-09*
