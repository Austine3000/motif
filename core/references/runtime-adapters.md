# Design Forge — Runtime Adapter Reference

Design Forge uses a core + adapters architecture. The core (references, workflows, templates, verticals) is shared across all runtimes. Each runtime gets a thin adapter layer that handles three things: file placement, subagent spawning, and config injection.

---

## What's Shared (core/)

These files are **identical** regardless of runtime:

| Directory | Contents | Why Shared |
|---|---|---|
| `core/references/` | State machine, context engine, design inputs, verticals | Pure design knowledge — no runtime dependencies |
| `core/workflows/` | Research, system, compose, review, fix, evolve, quick | Orchestration logic with runtime-agnostic spawn markers |
| `core/templates/` | Vertical template, STATE template, SUMMARY template, token showcase | Output formats — no runtime dependencies |
| `scripts/` | Contrast checker, token counter | Node.js utilities — runtime-independent |

## What's Runtime-Specific (runtimes/)

| Component | Claude Code | OpenCode | Gemini CLI | Cursor/Windsurf |
|---|---|---|---|---|
| **Commands** | `.claude/commands/forge/*.md` | `.opencode/commands/forge/*.md` | `.gemini/commands/forge/*.md` | N/A (no slash commands) |
| **Agent defs** | `.claude/agents/forge-*.md` | `.opencode/agents/forge-*.md` | `.gemini/agents/forge-*.md` | N/A |
| **Hooks** | `.claude/hooks/*.js` (PostToolUse) | Runtime-specific or skip | Runtime-specific or skip | N/A |
| **Config injection** | Append to `.claude/CLAUDE.md` | Append to `.opencode/AGENTS.md` | Append to `GEMINI.md` | Append to `.cursorrules` |
| **Subagent spawn** | `Task()` tool | `agent()` or equivalent | Runtime-specific | N/A (single context) |
| **Core files installed to** | `.claude/get-design-forge/` | `.opencode/get-design-forge/` | `.gemini/get-design-forge/` | `.design-forge/` |

---

## Subagent Spawning Abstraction

Workflows use a spawn marker pattern. The marker is runtime-agnostic — the command layer translates it for the specific runtime.

### In workflow files (core/workflows/):
```xml
<agent_spawn id="compose-{SCREEN_NAME}">
  **Task prompt:**
  [... agent instructions ...]
</agent_spawn>
```

### How each runtime interprets this:

**Claude Code:** The command files and agent definitions use `Task()` directly:
```
Spawn a subagent using Task() with the following prompt:
[agent instructions from workflow]
```

**OpenCode:** Uses OpenCode's agent spawning mechanism:
```
Spawn a subagent using agent() with type "general":
[agent instructions from workflow]
```

**Gemini CLI:** Uses Gemini's task delegation:
```
Delegate to a fresh context:
[agent instructions from workflow]
```

**Cursor/Windsurf:** No subagent support. The workflow runs in the main context:
```
Execute the following directly (no subagent — single context mode):
[agent instructions from workflow]
```
⚠️ This means Cursor/Windsurf will experience context degradation on large projects. The workflows still function but without fresh-context isolation.

---

## Installer Behavior Per Runtime

The installer (`bin/install.js`) detects or is told which runtime to target:

### Detection
```javascript
function detectRuntime() {
  if (fs.existsSync('.claude'))      return 'claude-code';
  if (fs.existsSync('.opencode'))    return 'opencode';
  if (fs.existsSync('.gemini'))      return 'gemini';
  if (fs.existsSync('.cursorrules')) return 'cursor';
  if (fs.existsSync('.windsurfrules')) return 'cursor'; // same adapter
  return null; // ask user
}
```

### Flags
```
npx design-forge@latest                    # Auto-detect
npx design-forge@latest --runtime claude-code
npx design-forge@latest --runtime opencode
npx design-forge@latest --runtime gemini
npx design-forge@latest --runtime cursor
```

### Install Mapping

**Claude Code (--runtime claude-code):**
```
core/references/     → .claude/get-design-forge/references/
core/workflows/      → .claude/get-design-forge/workflows/
core/templates/      → .claude/get-design-forge/templates/
scripts/             → .claude/get-design-forge/scripts/
runtimes/claude-code/commands/forge/ → .claude/commands/forge/
runtimes/claude-code/agents/         → .claude/get-design-forge/agents/
runtimes/claude-code/hooks/          → .claude/hooks/ (merge, don't overwrite)
runtimes/claude-code/CLAUDE-MD-SNIPPET.md → append to .claude/CLAUDE.md
```

**OpenCode (--runtime opencode):**
```
core/references/     → .opencode/get-design-forge/references/
core/workflows/      → .opencode/get-design-forge/workflows/
core/templates/      → .opencode/get-design-forge/templates/
scripts/             → .opencode/get-design-forge/scripts/
runtimes/opencode/commands/forge/ → .opencode/commands/forge/
runtimes/opencode/agents/         → .opencode/get-design-forge/agents/
runtimes/opencode/config-snippet.md → append to .opencode/AGENTS.md
```

**Gemini CLI (--runtime gemini):**
```
core/*               → .gemini/get-design-forge/
runtimes/gemini/commands/forge/ → .gemini/commands/forge/
runtimes/gemini/config-snippet.md → append to GEMINI.md
```

**Cursor/Windsurf (--runtime cursor):**
```
core/*               → .design-forge/
runtimes/cursor/rules-snippet.md → append to .cursorrules or .windsurfrules
```
Note: No commands, no agents, no hooks. The rules snippet contains condensed Design Forge instructions that work in single-context mode.

---

## Command Path References

The thin command files in each runtime need to point to the core workflows at the correct installed path. This is the ONE thing that differs in command files across runtimes:

**Claude Code:** `Load and follow the workflow at .claude/get-design-forge/workflows/research.md`
**OpenCode:** `Load and follow the workflow at .opencode/get-design-forge/workflows/research.md`
**Gemini:** `Load and follow the workflow at .gemini/get-design-forge/workflows/research.md`

The installer handles this by either:
1. Generating command files at install time with the correct path prefix, OR
2. Using a path variable in the command files that the runtime resolves

Option 1 is simpler and more reliable. The installer reads each command template, replaces the path prefix, and writes to the target.

---

## Priority: What to Build When

### v1.0 — Claude Code Only
Ship with full Claude Code support. The core/runtimes split is in the codebase but only `runtimes/claude-code/` is populated.

### v1.1 — OpenCode
Add `runtimes/opencode/` with adapted commands, agent definitions, and config snippet. Test agent spawning with OpenCode's mechanism.

### v1.2 — Cursor/Windsurf
Add `runtimes/cursor/` with condensed rules snippet. No subagents — test that workflows still produce quality in single-context mode.

### v1.3 — Gemini CLI
Add `runtimes/gemini/` when Gemini CLI stabilizes.

---

## Creating a New Runtime Adapter

To add support for a new runtime:

1. Create `runtimes/{runtime-name}/`
2. Copy command files from `runtimes/claude-code/commands/forge/` and update the workflow path prefix
3. Create agent definitions adapted to the runtime's agent format (or skip if no agent support)
4. Create a config snippet in the runtime's format
5. Create hooks in the runtime's format (or skip if no hook support)
6. Add the runtime to the installer's detection and mapping logic
7. Test the full workflow: init → research → system → compose → review
