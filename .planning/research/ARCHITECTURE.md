# Architecture Patterns

**Domain:** Motif Design Engineering System -- Global Install, Context-Resilient State, New Verticals
**Researched:** 2026-03-09

## Recommended Architecture

Three new capabilities integrate with the existing core/runtime architecture. The key constraint: Motif's value files (workflows, references, agents) are markdown consumed by an LLM, not code executed by a runtime. This means "global install" is about file placement and path resolution, not about running a global daemon.

### Current Architecture (Baseline)

```
[npm package]
    bin/install.js  -- copies files to project .claude/
    core/           -- runtime-agnostic .md files (workflows, references, verticals, templates)
    runtimes/       -- runtime-specific .md files (commands, agents, hooks)
    scripts/        -- .js utilities

[per-project install target]
    .claude/commands/motif/*.md    -- slash commands (from runtimes/claude-code/commands/)
    .claude/get-motif/             -- everything else (from core/ + runtimes/claude-code/)
    .claude/settings.json          -- hooks config
    CLAUDE.md                      -- sentinel-injected rules
    .motif-manifest.json           -- install tracking (version, file hashes)
    .planning/design/STATE.md      -- workflow state (phase, screens, decisions)
```

### Target Architecture (After This Milestone)

```
[npm global install: npm install -g motif-design]
    ~/.motif/                      -- NEW: global Motif home (package assets cached here)
    ~/.claude/commands/motif/*.md   -- NEW: global slash commands
    ~/.claude/settings.json        -- MODIFIED: global hooks pointing to global hook scripts

[per-project]
    .claude/settings.json          -- UNCHANGED: project hooks (override/supplement global)
    .motif-manifest.json           -- MODIFIED: tracks install mode (global vs local)
    .planning/design/STATE.md      -- MODIFIED: context-resilient format
    CLAUDE.md                      -- UNCHANGED: sentinel-injected rules

[core/ verticals directory]
    core/references/verticals/
        social.md                  -- NEW
        education.md               -- NEW
        marketplace.md             -- NEW
        devtools.md                -- NEW
```

## Component Boundaries

### New Components

| Component | Responsibility | Files | Communicates With |
|-----------|---------------|-------|-------------------|
| **Global Installer Mode** | Installs to `~/.claude/` and `~/.motif/` instead of per-project | `bin/install.js` (modified) | Manifest writer, hook injector, config injector |
| **Path Resolver** | Determines `{MOTIF_ROOT}` based on install mode (global vs local) | Inline in install.js `resolveMotifRoot()` | All workflows (via resolved .md content), all hooks |
| **Context-Resilient State Reader** | Recovers state from filesystem artifacts when STATE.md is missing/stale | New `core/references/state-recovery.md` + optional `scripts/state-recovery.js` | State machine, all workflow orchestrators |
| **4 New Verticals** | Domain intelligence for Social, Education, Marketplace, DevTools | `core/references/verticals/{name}.md` | Research workflow, system generator workflow |

### Modified Components

| Component | Current State | What Changes | Why |
|-----------|--------------|--------------|-----|
| **bin/install.js** | Per-project only, uses `process.cwd()` | Add `--global` flag, dual-mode copy logic, global path resolution | Enable `npm install -g motif-design && motif --global` |
| **Manifest (.motif-manifest.json)** | Per-project, tracks file hashes | Add `installMode: "global" \| "local"` field, global manifest at `~/.motif/manifest.json` | Track which install mode is active per project |
| **Hook references in settings.json** | `$CLAUDE_PROJECT_DIR/.claude/get-motif/hooks/` | Global mode: absolute paths to `~/.motif/hooks/` | Hooks must resolve regardless of install mode |
| **{MOTIF_ROOT} resolution** | Hardcoded to `.claude/get-motif` during install | Global: absolute path to `~/.motif`; Local: unchanged | Workflows must find references/verticals from correct location |
| **init.md vertical detection** | Lists social, education, marketplace in detection but no .md files exist for them; devtools not listed | Files now exist for all 8 verticals; devtools added to detection | Feature completeness |

### Unchanged Components

| Component | Why Unchanged |
|-----------|--------------|
| **Core workflows** (research.md, generate-system.md, etc.) | Already use `{MOTIF_ROOT}` which gets resolved at install time |
| **Core references** (state-machine.md, context-engine.md, design-inputs.md) | Runtime-agnostic, no path dependencies |
| **Agent definitions** (motif-*.md) | Reference files via `{MOTIF_ROOT}`, resolved at install |
| **Scripts** (contrast-checker.js, token-counter.js, etc.) | Pure utilities, no path assumptions |
| **CLAUDE-MD-SNIPPET.md** | Rules are project-behavior, not install-location dependent |

## Data Flow

### Global Install Flow

```
npm install -g motif-design
    |
    v
User runs: motif --global (or motif in a dir without .claude/)
    |
    v
bin/install.js detects --global flag
    |
    +-- Copy core/ + runtimes/agents + runtimes/hooks + scripts  -->  ~/.motif/
    |       (resolve {MOTIF_ROOT} to absolute ~/.motif path)
    |
    +-- Copy commands/motif/*.md  -->  ~/.claude/commands/motif/
    |       (resolve {MOTIF_ROOT} to absolute ~/.motif path)
    |
    +-- Inject hooks into ~/.claude/settings.json
    |       (paths reference ~/.motif/hooks/ with absolute paths)
    |
    +-- Write ~/.motif/manifest.json (global manifest)
    |
    +-- Print: "Motif installed globally. Commands available in all projects."
```

### Per-Project Init with Global Install

```
User opens any project, types /motif:init
    |
    v
~/.claude/commands/motif/init.md is discovered by Claude Code
    (because ~/.claude/commands/ is global command scope)
    |
    v
init.md references {MOTIF_ROOT} (already resolved to absolute ~/.motif path)
    reads ~/.motif/references/verticals/{detected}.md
    |
    v
Creates per-project artifacts:
    .planning/design/PROJECT.md
    .planning/design/DESIGN-BRIEF.md
    .planning/design/STATE.md
    |
    v
Injects CLAUDE.md sentinel block into project CLAUDE.md
    (this still happens per-project -- design rules must be in project context)
    |
    v
Writes per-project .motif-manifest.json with installMode: "global"
```

### Context-Resilient State Recovery Flow

```
Any /motif:* command starts
    |
    v
Orchestrator reads STATE.md
    |
    +-- STATE.md exists and is valid? --> proceed normally
    |
    +-- STATE.md missing or corrupt?
            |
            v
        State Recovery Protocol:
            1. Check .planning/design/ directory exists
            2. Scan for artifacts to infer phase:
               - PROJECT.md exists?           -> at least INITIALIZED
               - DESIGN-RESEARCH.md exists?   -> at least RESEARCHED
               - system/tokens.css exists?    -> at least SYSTEM_GENERATED
               - screens/*.html exists?       -> at least COMPOSING
               - reviews/*-REVIEW.md exists?  -> at least REVIEWING
            3. Scan screens/ for status of each screen
            4. Rebuild STATE.md from inferred state
            5. Log recovery in Decisions Log
            6. Proceed with rebuilt state
```

## Patterns to Follow

### Pattern 1: Dual-Mode Path Resolution

**What:** The installer resolves `{MOTIF_ROOT}` to different paths based on install mode, but workflows never know the difference.

**When:** Always -- this is the core architectural pattern that makes global install work.

**Implementation in install.js:**

```javascript
function resolveMotifRoot(installMode) {
  if (installMode === 'global') {
    // Global: files live in ~/.motif/
    const home = require('node:os').homedir();
    return path.join(home, '.motif');
  }
  // Local: files live in project .claude/get-motif/
  return '.claude/get-motif';
}
```

**Why this works:** Workflows use `{MOTIF_ROOT}/references/verticals/{VERTICAL}.md`. The installer replaces `{MOTIF_ROOT}` at copy time. A globally-installed workflow.md will have `/Users/austin/.motif/references/verticals/fintech.md` baked in. A locally-installed one will have `.claude/get-motif/references/verticals/fintech.md`. The workflow logic is identical.

**Important caveat:** For global install, the resolved path MUST be an absolute path (e.g., `/Users/austin/.motif`), not a relative one. The current `resolveContent()` function in install.js already does a simple `replaceAll` -- no changes to the replacement mechanism are needed, only the value being substituted.

### Pattern 2: Filesystem-as-State for Recovery

**What:** Instead of adding a complex state persistence layer, infer state from the filesystem artifacts that already exist.

**When:** STATE.md is missing, corrupt, or stale (e.g., after a `/clear` that lost context).

**Why:** The state machine already defines which artifacts each phase creates. The mapping is deterministic and one-directional -- you can always determine "at least phase X" from artifact presence.

```
Artifact Presence -> Minimum Phase:
  .planning/design/PROJECT.md             -> INITIALIZED
  .planning/design/DESIGN-RESEARCH.md     -> RESEARCHED
  .planning/design/system/tokens.css      -> SYSTEM_GENERATED
  .planning/design/screens/*.html         -> COMPOSING
  .planning/design/reviews/*-REVIEW.md    -> REVIEWING
```

**Implementation approach:** Add a "State Recovery" section to the state-machine.md reference (or create a new `core/references/state-recovery.md`). Each workflow's gate check gets an additional fallback: "If STATE.md is missing, run recovery before gating." An optional `scripts/state-recovery.js` helper can do the filesystem scanning programmatically.

### Pattern 3: Global Hooks with Absolute Paths

**What:** Hooks installed globally in `~/.claude/settings.json` use absolute paths to hook scripts in `~/.motif/hooks/`, while the hook scripts themselves use `$CLAUDE_PROJECT_DIR` (or `process.cwd()`) to find per-project design artifacts.

**When:** Global install mode.

**Current pattern (local):**
```json
{
  "command": "node \"$CLAUDE_PROJECT_DIR\"/.claude/get-motif/hooks/motif-token-check.js"
}
```

**Global pattern:**
```json
{
  "command": "node \"$HOME/.motif/hooks/motif-token-check.js\""
}
```

**Why:** `$CLAUDE_PROJECT_DIR` is confirmed available in hook commands per official Claude Code docs. The hook script itself needs to be at a known absolute path (global) rather than relative to the project. The existing hook implementations already use `process.cwd()` to locate `.planning/design/system/tokens.css` for validation, so they work correctly from a global location without modification.

**Verified behavior (HIGH confidence, from official docs):**
- `~/.claude/settings.json` hooks apply to ALL projects
- `.claude/settings.json` hooks apply to current project only
- Array settings (like PostToolUse hooks) MERGE across scopes (concatenated and deduplicated)
- `$CLAUDE_PROJECT_DIR` is available in hook command strings

### Pattern 4: Vertical Files as Pure Data

**What:** New verticals (social, education, marketplace, devtools) are pure .md data files following the exact same template as existing verticals. No code changes needed.

**When:** Adding any new vertical.

**Why:** The vertical loading mechanism is already generic:
- init.md detects vertical name from user description
- Workflows check `{MOTIF_ROOT}/references/verticals/{VERTICAL}.md`
- If file exists, it is loaded into agent context
- If file does not exist, research agent generates domain knowledge from scratch

Adding a vertical is strictly: create the .md file following VERTICAL-TEMPLATE.md. No installer changes, no workflow changes, no command changes. The init.md already lists social, education, marketplace in its detection heuristics. Only "devtools" needs to be added to the detection list.

### Pattern 5: CLAUDE.md Injection Remains Per-Project

**What:** Even with global install, the CLAUDE.md sentinel block must be injected per-project, not globally.

**When:** Every project that uses Motif, regardless of install mode.

**Why:** Design rules reference `.planning/design/` paths which are project-relative. They define commit prefixes and workflow rules specific to the active design project. Claude Code loads CLAUDE.md hierarchically -- project rules are authoritative for project behavior.

**Implementation:** The first `/motif:init` in a new project detects that CLAUDE.md lacks the sentinel block and injects it. Alternatively, a lightweight `motif setup` command can be run per-project to inject CLAUDE.md + write per-project manifest without copying all files.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Symlink-Based Global Install

**What:** Symlinking `~/.motif/` or `~/.claude/get-motif/` to the npm global package directory.

**Why bad:** npm global packages can be updated/removed at any time. A symlink would break when the user runs `npm update -g`. The installed .md files need `{MOTIF_ROOT}` resolved at install time, which symlinks cannot do (the source files contain unresolved `{MOTIF_ROOT}` placeholders). Symlinks into node_modules are also fragile across Node.js version managers (nvm, fnm).

**Instead:** Copy files to `~/.motif/` at install time (same as local install copies to `.claude/get-motif/`). The manifest tracks hashes for upgrade detection.

### Anti-Pattern 2: Merging Global and Project State

**What:** Having a global STATE.md or sharing state across projects.

**Why bad:** State is inherently per-project (which screens are composed, which phase the design is in). Global state would create conflicts when switching between projects.

**Instead:** STATE.md stays per-project in `.planning/design/STATE.md`. The manifest at project root tracks install mode. Global install only affects WHERE Motif's tool files live, not WHERE project design artifacts live.

### Anti-Pattern 3: Runtime Detection for Global Install

**What:** Auto-detecting runtime during `npm install -g` postinstall.

**Why bad:** `npm install -g` runs in a package directory context, not a project context. There is no `.claude/` directory to detect. Auto-detection during global install is meaningless.

**Instead:** For global install, require explicit `--runtime claude-code` flag OR default to claude-code (the only supported runtime). Runtime detection only makes sense for per-project `npx motif-design@latest` where a project context exists.

### Anti-Pattern 4: Rebuilding STATE.md on Every Command

**What:** Always running state recovery instead of just reading STATE.md.

**Why bad:** Filesystem scanning is slower than reading a single file. Recovery should only trigger when STATE.md is missing or corrupt, not as the default path.

**Instead:** Try to read STATE.md first. If it fails (missing/corrupt), THEN run recovery. Log recovery in the Decisions Log so the user knows it happened.

### Anti-Pattern 5: Using npm postinstall for Global Setup

**What:** Running the file copy/hook injection automatically during `npm install -g motif-design` via a postinstall script.

**Why bad:** npm postinstall scripts run with restricted permissions in some environments. They cannot reliably write to `~/.claude/` (which may not exist yet). They also run silently, giving the user no feedback about what was installed or where.

**Instead:** The user explicitly runs `motif --global` after `npm install -g motif-design`. The `bin` entry in package.json makes `motif` available as a command. This gives the user control and visibility.

## Critical Integration Points

### 1. {MOTIF_ROOT} Resolution (Global vs Local)

**Current:** `resolveContent()` in install.js replaces `{MOTIF_ROOT}` with `'.claude/get-motif'` for all .md files. The variable is named `{MOTIF_ROOT}` in the codebase (note: GSD-PROJECT-SPEC.md references `{FORGE_ROOT}` but the actual code uses `{MOTIF_ROOT}`).

**Change:** For global mode, replace with absolute path: `path.join(os.homedir(), '.motif')`.

**Files affected:** Every .md file in core/workflows/ that contains `{MOTIF_ROOT}` (currently research.md, scan.md, generate-system.md -- 11 occurrences across these files).

**Risk:** LOW -- the replacement is already centralized in the `resolveContent()` function. Adding a conditional for the resolved value is trivial. The replacement mechanism itself does not change.

### 2. Command Discovery (Global)

**Current:** Commands installed to `.claude/commands/motif/*.md` per-project.

**Change:** For global mode, install to `~/.claude/commands/motif/*.md`.

**Claude Code behavior (verified, HIGH confidence):**
- `~/.claude/commands/` (or `~/.claude/skills/`) = personal scope, available in ALL projects
- `.claude/commands/` = project scope, available in current project only
- Both scopes are discovered automatically at startup
- When skills share the same name across levels, project-scope takes precedence

**Risk:** LOW -- Claude Code natively supports global commands. No special wiring needed.

**Conflict consideration:** If a user has BOTH global and local Motif commands (e.g., they ran `npx motif-design@latest` in one project AND `motif --global`), project-scope commands override global ones. This is desirable -- it allows per-project command customization or version pinning.

### 3. Hook Installation (Global)

**Current:** Hooks injected into `.claude/settings.json` per-project with `$CLAUDE_PROJECT_DIR`-relative paths to hook scripts.

**Change:** For global mode, inject into `~/.claude/settings.json` with absolute paths to `~/.motif/hooks/*.js`.

**Claude Code behavior (verified, HIGH confidence):**
- Array settings like `hooks.PostToolUse` MERGE across scopes (concatenated and deduplicated)
- This means global hooks and project hooks will BOTH fire if both exist

**Risk:** MEDIUM -- if user has both global and local hooks, they merge and could fire twice (once from global, once from local). Mitigation: the installer must detect if Motif hooks already exist in project `.claude/settings.json` and skip local hook injection when global mode is active. The existing `injectHookSettings()` already uses deduplication logic (filters by `matcher === 'Write|Edit'` and `command.includes('motif')`).

### 4. CLAUDE.md Injection (Always Per-Project)

**Current:** Sentinel block injected into project `CLAUDE.md` or `.claude/CLAUDE.md`.

**Change:** NONE for the injection mechanism. But in global mode, the injection must happen at a different point -- not during `motif --global` (which has no project context), but during the first `/motif:init` in a project.

**Implementation:** The init command checks for the sentinel block in CLAUDE.md. If missing, it injects it. This is already the behavior described in init.md: "The installer handles CLAUDE.md injection automatically via sentinel markers during `npx motif-design@latest`. If CLAUDE.md is missing Motif rules, re-run the installer." For global mode, init takes on this responsibility.

**Risk:** LOW -- the sentinel injection/replacement logic already exists and is idempotent.

### 5. StatusLine Hook (Global)

**Current:** `statusLine` in `.claude/settings.json` points to context monitor script.

**Change:** For global mode, `statusLine` in `~/.claude/settings.json` with absolute path.

**Risk:** LOW -- but `statusLine` is a SINGLE value (not an array), so a global statusLine will be overridden by any project-level statusLine. This is acceptable -- if a project defines its own statusLine, Motif's should yield gracefully.

### 6. State Recovery and STATE.md (Per-Project)

**Current:** Workflows read `.planning/design/STATE.md` and trust its contents. If STATE.md is missing, commands fail at their gate check.

**Change:** Add recovery fallback. If STATE.md is missing or unparseable:
1. Scan `.planning/design/` for artifacts
2. Reconstruct minimum phase from artifact presence
3. Write recovered STATE.md
4. Continue with recovered state

**Risk:** MEDIUM -- the recovery logic must be specified clearly in a reference .md file so LLM-based workflows can follow it. The biggest risk is incorrect phase inference (e.g., a partially-failed compose left HTML files but the screen is incomplete). Mitigation: always infer the MINIMUM phase (conservative) and let the user advance manually if needed.

### 7. Vertical File Addition (Core)

**Current:** 4 verticals exist (fintech, health, saas, ecommerce). init.md detects 8 vertical categories by keyword but only 4 have corresponding .md files.

**Change:** Add 4 new .md files to `core/references/verticals/`. Add "devtools" to the keyword detection list in init.md (social, education, marketplace are already listed).

**Risk:** VERY LOW -- pure additive. The vertical loading is dynamic (`{MOTIF_ROOT}/references/verticals/{VERTICAL}.md`). If the file exists, it is loaded; if not, the system works without it. No existing code hardcodes vertical filenames.

## Build Order (Dependency-Aware)

Based on dependency analysis, the recommended build order:

### Phase 1: New Verticals (zero dependencies, highest parallelism)

**Build:**
- `core/references/verticals/social.md`
- `core/references/verticals/education.md`
- `core/references/verticals/marketplace.md`
- `core/references/verticals/devtools.md`
- Update init.md detection list to include "devtools" keyword mapping

**Rationale:** These are pure data files with no dependencies on other new work. They can be built in parallel by separate agents. Each follows the exact template in `core/templates/VERTICAL-TEMPLATE.md` and the established pattern of existing verticals (fintech.md at ~296 lines, saas.md at ~296 lines). No installer, workflow, or state machine changes needed.

### Phase 2: State Recovery Protocol (no dependency on global install)

**Build:**
- Create `core/references/state-recovery.md` defining the recovery algorithm
- Create `scripts/state-recovery.js` (optional helper for artifact scanning)
- Modify state-machine.md to add recovery fallback instructions
- Update workflow gate check instructions to try recovery before failing

**Rationale:** State recovery is independent of the install mode (global vs local). It operates on `.planning/design/` artifacts which are always per-project. Should be built before global install because global install testing will exercise state recovery (different install mode = more edge cases where STATE.md might be stale).

### Phase 3: Global Install (depends on Phase 2 concepts being stable)

**Build:**
- Modify `bin/install.js` to support `--global` flag
- Add global path resolution logic (`resolveMotifRoot()`)
- Add global file copy targets (`~/.motif/`, `~/.claude/commands/motif/`)
- Add global hook injection (`~/.claude/settings.json`)
- Add global manifest tracking (`~/.motif/manifest.json`)
- Add per-project manifest with `installMode: "global"` during init
- Add `--global` to uninstall flow (clean `~/.motif/`, `~/.claude/commands/motif/`, `~/.claude/settings.json` hooks)
- Update help text

**Rationale:** Global install is the most complex change. It touches the installer, manifest, and hook injection. It should come after verticals (so all 8 verticals are available for testing) and after state recovery (so recovery is available when testing global install edge cases).

## Scalability Considerations

| Concern | Current (4 verticals) | At 8 verticals | At 20+ verticals |
|---------|----------------------|-----------------|-------------------|
| Install size | ~40 files, ~200KB | ~44 files, ~250KB | ~56 files, ~400KB |
| Command count | 12 slash commands | 12 (unchanged) | 12 (unchanged) |
| Vertical loading | Single file read per command | Same (only detected vertical loaded) | Same (still O(1)) |
| State file size | ~500 tokens | Same | Same |
| Global install footprint | N/A | ~250KB in ~/.motif/ | ~400KB in ~/.motif/ |

Verticals scale linearly in install size with zero runtime cost (only the detected vertical is ever loaded). At 20+ verticals, consider a `verticals/index.json` mapping vertical names to filenames, but this is unnecessary at 8.

## Sources

- [Claude Code Settings Reference](https://code.claude.com/docs/en/settings) -- Settings scopes (user/project/local/managed), hook configuration, array merging behavior (HIGH confidence)
- [Claude Code Skills / Slash Commands](https://code.claude.com/docs/en/slash-commands) -- `~/.claude/commands/` and `~/.claude/skills/` as global scope, discovery at startup, precedence rules (enterprise > personal > project), `$CLAUDE_SKILL_DIR` variable (HIGH confidence)
- [Claude Code Hooks Reference](https://code.claude.com/docs/en/hooks) -- Hook locations at all scopes, `$CLAUDE_PROJECT_DIR` availability in hook commands, matcher patterns, JSON stdin/stdout protocol (HIGH confidence)
- Existing codebase analysis: `bin/install.js` (install logic, `resolveContent()`, `{MOTIF_ROOT}` replacement), `core/references/state-machine.md` (phase definitions, gate checks), `core/references/context-engine.md` (context profiles), `.claude/settings.json` (hook format), `.motif-manifest.json` (manifest structure) (HIGH confidence)
- [npm install -g behavior](https://docs.npmjs.com/cli/v10/commands/npm-install) -- Global package installation, bin linking (MEDIUM confidence, standard npm behavior)
