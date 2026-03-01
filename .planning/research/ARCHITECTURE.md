# Architecture Research

**Domain:** npm-distributed AI design engineering tool with plugin/adapter architecture
**Researched:** 2026-03-01
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         NPM Package (design-forge)                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐                                                   │
│  │  bin/         │  Entry: install.js                                │
│  │  install.js   │  npx design-forge@latest                         │
│  └──────┬───────┘                                                   │
│         │                                                           │
│         ▼                                                           │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────────┐    │
│  │  Detector    │──▶│  Resolver    │──▶│  Copier              │    │
│  │              │   │              │   │                      │    │
│  │  Which AI    │   │  Map source  │   │  Copy files to       │    │
│  │  runtime?    │   │  → target    │   │  project directory   │    │
│  └──────────────┘   └──────────────┘   └──────────┬───────────┘    │
│                                                    │                │
│  ┌──────────────┐   ┌──────────────┐              │                │
│  │  Injector    │◀──│  Verifier    │◀─────────────┘                │
│  │              │   │              │                                │
│  │  Append to   │   │  Post-install│                                │
│  │  config file │   │  health check│                                │
│  └──────────────┘   └──────────────┘                                │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                     Source Content (shipped in npm package)          │
├──────────────────────────┬──────────────────────────────────────────┤
│                          │                                          │
│  ┌─────────────────┐    │    ┌──────────────────────────────────┐  │
│  │  core/           │    │    │  runtimes/                       │  │
│  │                  │    │    │                                  │  │
│  │  references/     │    │    │  claude-code/                    │  │
│  │  workflows/      │    │    │    commands/forge/*.md            │  │
│  │  templates/      │    │    │    agents/*.md                    │  │
│  │  (90% of value)  │    │    │    hooks/*.js                     │  │
│  │                  │    │    │    CLAUDE-MD-SNIPPET.md            │  │
│  │  Runtime-agnostic│    │    │                                  │  │
│  │  Shared by ALL   │    │    │  opencode/ (future)              │  │
│  └─────────────────┘    │    │  cursor/ (future)                │  │
│                          │    │  gemini/ (future)                │  │
│                          │    │                                  │  │
│                          │    │  Runtime-specific                │  │
│                          │    │  Thin adapters (10%)             │  │
│                          │    └──────────────────────────────────┘  │
│                          │                                          │
├──────────────────────────┴──────────────────────────────────────────┤
│  scripts/                                                           │
│    contrast-checker.js, token-counter.js (standalone utilities)     │
└─────────────────────────────────────────────────────────────────────┘
```

After installation, in the user's project:

```
project/
├── .claude/                              (created/augmented by installer)
│   ├── commands/forge/                   ◀── FROM runtimes/claude-code/commands/
│   │   ├── init.md                           Thin routing files
│   │   ├── research.md                       Each points to a workflow
│   │   ├── system.md
│   │   ├── compose.md
│   │   ├── review.md
│   │   ├── fix.md
│   │   ├── evolve.md
│   │   ├── quick.md
│   │   ├── help.md
│   │   └── progress.md
│   │
│   ├── get-design-forge/                 ◀── FROM core/ + runtime agents/hooks
│   │   ├── references/
│   │   │   ├── state-machine.md              Gate checks, phase transitions
│   │   │   ├── context-engine.md             Context budgets, profiles
│   │   │   ├── design-inputs.md              Input type handling
│   │   │   └── verticals/                    Domain intelligence
│   │   │       ├── fintech.md
│   │   │       ├── health.md
│   │   │       └── ...
│   │   ├── workflows/                        Orchestration logic
│   │   │   ├── research.md                   4-agent parallel research
│   │   │   ├── generate-system.md            Token decisions
│   │   │   ├── compose-screen.md             Fresh agent per screen
│   │   │   ├── review.md                     4-lens evaluation
│   │   │   ├── fix.md                        Review fix loop
│   │   │   ├── evolve.md                     System evolution
│   │   │   └── quick.md                      Ad-hoc mode
│   │   ├── templates/                        Output format templates
│   │   ├── agents/                           Agent personality definitions
│   │   ├── hooks/                            PostToolUse enforcement
│   │   └── scripts/                          Standalone utilities
│   │
│   └── CLAUDE.md                         ◀── Design Forge snippet APPENDED
│
├── .planning/design/                     (created at runtime by workflows)
│   ├── PROJECT.md                            Product context
│   ├── DESIGN-BRIEF.md                       Aesthetic direction
│   ├── STATE.md                              Phase tracking
│   ├── DESIGN-RESEARCH.md                    Synthesized research
│   ├── research/                             Raw research outputs
│   ├── system/
│   │   ├── tokens.css                        Design tokens
│   │   ├── DESIGN-SYSTEM.md                  System documentation
│   │   ├── COMPONENT-SPECS.md                Component XML specs
│   │   └── token-showcase.html               Visual token display
│   ├── screens/                              Per-screen outputs
│   └── reviews/                              Per-screen reviews
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **bin/install.js** | Entry point. Detects runtime, orchestrates install, reports results. | Single Node.js file, no dependencies. ~200-300 lines. |
| **Detector** | Identifies which AI coding runtime is present in the project. | Check for `.claude/`, `.opencode/`, `.gemini/`, `.cursorrules`, `.windsurfrules` directories/files. Accept `--runtime` flag override. |
| **Resolver** | Maps source paths in the npm package to destination paths in the user's project. | Runtime-specific mapping table. Each runtime has its own prefix and target structure. |
| **Copier** | Recursively copies core/ and runtime-specific files to resolved destinations. | `fs.cpSync` with recursive option. Handles directory creation, file overwrite with backup. |
| **Injector** | Appends config snippet to the runtime's config file (CLAUDE.md, .cursorrules, etc.). | Read target config, check if snippet already present (idempotent), append if missing. |
| **Verifier** | Post-install health check confirming all expected files exist in the right locations. | Walk expected file list, report pass/fail per file, print summary. |
| **core/** | All runtime-agnostic content: design intelligence, workflow orchestration, templates. | Markdown files. No executable code. Read by AI agents at runtime. |
| **runtimes/{name}/** | Thin adapter layer per runtime: commands, agent definitions, hooks, config snippets. | Mostly markdown (commands, agents, config). Hooks are JS. Commands are 4-7 line routing files that point to core workflows. |
| **scripts/** | Standalone Node.js utilities (contrast checker, token counter). | Pure Node.js, no dependencies. Used by agents during workflows. |

## Recommended Project Structure

```
design-forge/
├── bin/
│   └── install.js              # CLI entry point (npx design-forge@latest)
├── core/
│   ├── references/             # Design knowledge (state machine, context engine, verticals)
│   │   ├── state-machine.md
│   │   ├── context-engine.md
│   │   ├── design-inputs.md
│   │   ├── runtime-adapters.md
│   │   └── verticals/
│   │       ├── fintech.md
│   │       ├── health.md
│   │       ├── saas.md
│   │       └── ecommerce.md
│   ├── workflows/              # Orchestration logic (runtime-agnostic)
│   │   ├── research.md
│   │   ├── generate-system.md
│   │   ├── compose-screen.md
│   │   ├── review.md
│   │   ├── fix.md
│   │   ├── evolve.md
│   │   └── quick.md
│   └── templates/              # Output format templates
│       ├── STATE-TEMPLATE.md
│       ├── SUMMARY-TEMPLATE.md
│       ├── VERTICAL-TEMPLATE.md
│       └── token-showcase.html
├── runtimes/
│   ├── claude-code/            # v1.0 target
│   │   ├── commands/forge/     # 10 thin routing files
│   │   ├── agents/             # 5 agent personality definitions
│   │   ├── hooks/              # 4 PostToolUse enforcement hooks
│   │   └── CLAUDE-MD-SNIPPET.md
│   ├── opencode/               # v1.1 target
│   ├── cursor/                 # v1.2 target
│   └── gemini/                 # v1.3 target
├── scripts/
│   ├── contrast-checker.js
│   └── token-counter.js
├── package.json
├── README.md
├── LICENSE
└── CHANGELOG.md
```

### Structure Rationale

- **bin/:** Single entry point. The `bin` field in package.json points here. This is the only executable code that runs during `npx`. Everything else is content that gets copied.
- **core/:** The heart of Design Forge. 90% of the value. Completely runtime-agnostic. If you deleted every runtime adapter, core/ would still be a valid design engineering knowledge base.
- **runtimes/:** One subdirectory per supported AI coding runtime. Each contains only the thin translation layer: how this runtime triggers workflows, spawns agents, and enforces rules. Adding a runtime never touches core/.
- **scripts/:** Standalone utilities that agents invoke during workflows. Not part of the installer pipeline -- they get copied into the installed location alongside core content.

## Architectural Patterns

### Pattern 1: Core/Adapter Separation (Primary Architecture)

**What:** All design intelligence, workflow logic, and templates live in `core/` (shared). Each AI coding runtime gets a thin adapter in `runtimes/{name}/` that translates runtime-specific concerns (commands, agent spawning, hooks, config format).

**When to use:** Always. This is the foundational pattern. Every file must belong to exactly one of these categories.

**Trade-offs:**
- Pro: Adding a new runtime is O(adapter), not O(system). Claude Code support cost ~30 files; OpenCode will cost ~15 files with zero core changes.
- Pro: Bug fixes in design logic (core/) automatically improve all runtimes.
- Con: Workflows use `{FORGE_ROOT}` path variable that must resolve differently per runtime. The installer handles this, but it adds a layer of indirection.
- Con: The "thin command" pattern means debugging requires tracing: command -> workflow -> agent definition. Three files, not one.

**Decision boundary (where does code go):**
```
Does it mention Task(), agent(), .claude, .opencode, .cursorrules,
or any runtime-specific spawning/config mechanism?
  YES → runtimes/{name}/
  NO  → core/
```

**Example -- thin command (4 lines):**
```markdown
---
description: Research domain-specific design patterns for your product vertical
---
Load and follow the workflow at `.claude/get-design-forge/workflows/research.md`
```

**Example -- shared workflow (200+ lines):**
```markdown
# /forge:research -- Research Orchestrator

<gate_check>
Read `.planning/design/STATE.md`.
If Phase is not `INITIALIZED`, stop.
</gate_check>

## Step 3: Spawn Research Agents (PARALLEL)
<agent_spawn id="vertical-patterns">
  [agent instructions -- runtime-agnostic]
</agent_spawn>
```

### Pattern 2: Orchestrator/Agent Separation (Runtime Pattern)

**What:** Workflows run in the "orchestrator" context (the user's main AI session). Heavy work happens in spawned subagents with fresh 200K-token context windows. The orchestrator stays below 30% context usage by passing file paths, never file contents.

**When to use:** Every workflow that produces artifacts (research, compose, review, fix). Only `/forge:init` runs in the main context because it requires user interaction.

**Trade-offs:**
- Pro: Quality doesn't degrade on screen 5 of a 10-screen project. Each screen gets a fresh context.
- Pro: Parallel execution possible (4 research agents spawn simultaneously).
- Con: Runtimes without subagent support (Cursor/Windsurf) lose this benefit and experience context degradation.
- Con: Subagent spawning syntax differs per runtime, which is why agent definitions live in `runtimes/`.

**Information contract between orchestrator and agent:**
```
Orchestrator → Agent:  file PATHS to read, task description, output location, commit message
Agent → Orchestrator:  SUMMARY.md (compressed result), git commit
```

The orchestrator NEVER reads full agent output. It reads only the SUMMARY.md the agent creates. This prevents context accumulation.

### Pattern 3: State Machine for Workflow Gating

**What:** A STATE.md file tracks the current phase (UNINITIALIZED -> INITIALIZED -> RESEARCHED -> SYSTEM_GENERATED -> COMPOSING -> REVIEWING -> ITERATING). Every command checks STATE.md before executing and updates it after completing.

**When to use:** Every command entry point. Gate checks are the first thing each workflow does.

**Trade-offs:**
- Pro: Prevents nonsensical operations (can't compose without a design system, can't review without composed screens).
- Pro: STATE.md survives `/clear` commands, so users never lose progress.
- Pro: Enables the orchestrator to determine "what's next" automatically.
- Con: STATE.md is another file to keep in sync. But at ~500 tokens it's cheap to read.

### Pattern 4: Manifest-Based Install Tracking

**What:** The installer writes a `.design-forge-manifest.json` to the project root after successful installation. This manifest records the installed version, runtime, timestamp, and file list. On reinstall/upgrade, the installer reads the manifest to determine what to back up, replace, or skip.

**When to use:** Every install and upgrade operation.

**Trade-offs:**
- Pro: Makes upgrades idempotent. Running `npx design-forge@latest` twice produces the same result.
- Pro: Enables selective upgrade (only replace files that changed between versions).
- Pro: Provides an uninstall path (read manifest, delete listed files).
- Con: One more file in the project root. Mitigated by making it a dotfile.

**Example manifest:**
```json
{
  "version": "1.0.0",
  "runtime": "claude-code",
  "installedAt": "2026-03-01T12:00:00Z",
  "files": {
    ".claude/commands/forge/init.md": { "hash": "a1b2c3", "source": "runtimes/claude-code/commands/forge/init.md" },
    ".claude/get-design-forge/references/state-machine.md": { "hash": "d4e5f6", "source": "core/references/state-machine.md" },
    "...": "..."
  },
  "configInjections": [
    { "target": ".claude/CLAUDE.md", "marker": "# Design Forge Rules" }
  ]
}
```

### Pattern 5: Content-Hash Diffing for Safe Upgrades

**What:** On upgrade, the installer computes content hashes for currently-installed files and compares against both the manifest (what was originally installed) and the new package version. Three cases:

1. **File unchanged since install** (current hash matches manifest hash): Safe to overwrite with new version.
2. **File modified by user** (current hash differs from manifest hash): Back up to `.design-forge-backup/`, then overwrite. Warn the user.
3. **File doesn't exist in manifest** (new file in newer version): Copy without backup.

**When to use:** Upgrade operations. First install skips diffing entirely.

**Trade-offs:**
- Pro: Never silently destroys user modifications.
- Pro: Users can customize agent definitions or workflow tweaks without fear of losing them on upgrade.
- Con: Adds complexity to the installer. But the alternative (blindly overwriting) is worse.

## Data Flow

### Install Flow

```
npx design-forge@latest [--runtime claude-code]
    │
    ▼
bin/install.js
    │
    ├── 1. Parse args (--runtime flag, --force, --dry-run)
    │
    ├── 2. Detect runtime
    │   ├── Check --runtime flag first
    │   ├── Check fs: .claude/ → claude-code
    │   ├── Check fs: .opencode/ → opencode
    │   ├── Check fs: .gemini/ → gemini
    │   ├── Check fs: .cursorrules → cursor
    │   └── No match → prompt user or fail with helpful message
    │
    ├── 3. Check for existing manifest (.design-forge-manifest.json)
    │   ├── No manifest → fresh install
    │   └── Manifest exists → upgrade flow (diff + backup)
    │
    ├── 4. Resolve paths
    │   ├── core/references/ → {runtime_config_dir}/get-design-forge/references/
    │   ├── core/workflows/ → {runtime_config_dir}/get-design-forge/workflows/
    │   ├── core/templates/ → {runtime_config_dir}/get-design-forge/templates/
    │   ├── scripts/ → {runtime_config_dir}/get-design-forge/scripts/
    │   ├── runtimes/{runtime}/commands/ → {runtime_config_dir}/commands/forge/
    │   ├── runtimes/{runtime}/agents/ → {runtime_config_dir}/get-design-forge/agents/
    │   └── runtimes/{runtime}/hooks/ → {runtime_config_dir}/hooks/ (merge)
    │
    ├── 5. Copy files (fs.cpSync recursive + individual copies)
    │
    ├── 6. Inject config snippet
    │   ├── Read target config file
    │   ├── Check for existing "Design Forge" marker (idempotent)
    │   └── Append snippet if not present
    │
    ├── 7. Write manifest
    │
    └── 8. Verify + report
        ├── Walk expected files, confirm existence
        └── Print summary: N files installed, runtime detected, next steps
```

### Runtime Data Flow (User Using Design Forge)

```
User types: /forge:compose dashboard
    │
    ▼
.claude/commands/forge/compose.md                    THIN COMMAND
    │  "Load .claude/get-design-forge/workflows/compose-screen.md"
    ▼
.claude/get-design-forge/workflows/compose-screen.md  SHARED WORKFLOW
    │
    ├── Gate check: read STATE.md, verify phase
    ├── Determine screen name
    ├── Assemble context PATHS (not contents)
    │
    ▼
Task() spawn → fresh 200K context                    SUBAGENT
    │
    ├── Agent reads its personality from agents/forge-screen-composer.md
    ├── Agent reads PROJECT.md, tokens.css, COMPONENT-SPECS.md
    ├── Agent reads DESIGN-RESEARCH.md
    ├── Agent builds the screen
    ├── Agent creates SUMMARY.md
    └── Agent commits: design(compose): implement dashboard
    │
    ▼
Orchestrator reads SUMMARY.md only                   BACK TO THIN
    │
    ├── Updates STATE.md (phase, screen status)
    └── Suggests next command
```

### Upgrade Flow

```
npx design-forge@latest                              USER RUNS UPGRADE
    │
    ▼
bin/install.js
    │
    ├── Read .design-forge-manifest.json              CHECK EXISTING
    │   version: "1.0.0" → upgrading to "1.1.0"
    │
    ├── For each file in manifest:                    DIFF EACH FILE
    │   ├── Compute current hash
    │   ├── Compare to manifest hash
    │   │   ├── Match → safe to overwrite
    │   │   └── Mismatch → user modified, backup first
    │   └── Copy new version
    │
    ├── For new files not in old manifest:            ADD NEW FILES
    │   └── Copy directly
    │
    ├── Update manifest with new version + hashes     UPDATE MANIFEST
    │
    └── Report: "Upgraded 1.0.0 → 1.1.0. 3 files backed up to .design-forge-backup/"
```

### Key Data Flows

1. **Install-time path resolution:** The npm package contains source files with `{FORGE_ROOT}` references in workflows. The installer does NOT rewrite these. Instead, workflows include a `<path_resolution>` block that documents per-runtime resolution. The command layer (which IS runtime-specific) ensures the correct path context. This means core files are copied verbatim -- no template processing during install.

2. **Context budgets flow downward:** The context-engine.md defines token budgets per file type. Workflows enforce these budgets when assembling subagent prompts. The orchestrator passes paths but the subagent decides what to read. Context never flows upward beyond SUMMARY.md.

3. **State flows through STATE.md:** Every command reads STATE.md at entry (gate check) and writes STATE.md at exit (phase transition). STATE.md is the single source of truth for "where are we in the design process." It survives `/clear` commands because it lives on disk.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 1-4 runtimes (current plan) | Single installer with runtime-specific mapping tables. Each runtime is a subdirectory. Simple switch/case or object lookup. |
| 5-10 runtimes | Consider extracting runtime adapters into a registry pattern where each runtime self-describes its capabilities (has subagents: yes/no, has hooks: yes/no, config file: path). The installer reads the registry instead of hardcoding mappings. |
| 10+ verticals | Verticals are already self-contained markdown files. No scaling concern for the architecture, only for package size. Consider lazy-loading: ship popular verticals (fintech, saas, ecommerce) and download others on first use via `npx design-forge add-vertical health`. |
| Community verticals | Extend the vertical template to include a `source` field. The installer or a subcommand fetches verticals from a registry (GitHub repo, npm package, or URL). |

### Scaling Priorities

1. **First bottleneck: npm package size.** Each vertical is ~200 lines of markdown (~5KB). 20 verticals = ~100KB. Not a problem. But 50+ verticals with associated test fixtures could push the package to multi-MB territory. Solution: ship core verticals, lazy-fetch the rest.

2. **Second bottleneck: runtime adapter duplication.** As runtime count grows, the mapping tables in install.js and the command files start to feel duplicative. Solution: extract a runtime descriptor format so each `runtimes/{name}/` directory contains a `runtime.json` that declares its paths, capabilities, and install mapping. The installer becomes generic.

## Anti-Patterns

### Anti-Pattern 1: Putting Runtime Logic in Core

**What people do:** Add Claude-Code-specific Task() syntax directly in `core/workflows/compose-screen.md`.
**Why it's wrong:** Breaks the core/adapter contract. When adding OpenCode support, you'd need to fork the workflow or add conditionals, creating a maintenance nightmare.
**Do this instead:** Workflows use runtime-agnostic `<agent_spawn>` markers. The command layer (in runtimes/) translates these to runtime-specific syntax. The init command (which runs in main context) is the one exception -- it uses runtime-specific spawning directly because it's already in runtimes/.

### Anti-Pattern 2: Template Processing During Install

**What people do:** Run the installer as a template engine that rewrites `{FORGE_ROOT}` in every file before copying.
**Why it's wrong:** Creates a maintenance burden (every file needs template processing), makes it impossible to diff installed files against source, and adds failure modes.
**Do this instead:** Workflows include a `<path_resolution>` block that maps the variable per runtime. The thin command files (which ARE runtime-specific) provide the correct path prefix. Core files are copied byte-for-byte.

### Anti-Pattern 3: Reading Agent Output in Orchestrator

**What people do:** Use TaskOutput or equivalent to read the full output of a spawned agent back into the orchestrator context.
**Why it's wrong:** Defeats the purpose of fresh-context agents. The orchestrator's context grows linearly with each spawned agent, eventually degrading quality.
**Do this instead:** Agents write a SUMMARY.md (max 500 tokens) to a known path. The orchestrator reads only that summary. Full output stays in the agent's committed files.

### Anti-Pattern 4: Blind Overwrite on Upgrade

**What people do:** `npx design-forge@latest` deletes the entire get-design-forge directory and replaces it with the new version.
**Why it's wrong:** Destroys user customizations to agent definitions, workflow tweaks, or added verticals.
**Do this instead:** Use manifest-based diffing. Compare content hashes to detect user modifications. Back up modified files before overwriting. Report what changed.

### Anti-Pattern 5: Hooks That Modify the Runtime Config Directory

**What people do:** Hooks in `.claude/hooks/` that write to `.claude/get-design-forge/`.
**Why it's wrong:** Hooks run on every file write. If a hook modifies Design Forge's own files, it can trigger infinite loops or corrupt the installation.
**Do this instead:** Hooks should ONLY read from get-design-forge/ (for reference data like tokens.css). They should NEVER write to it. Hook output goes to stderr or the AI's response, not to the filesystem.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| npm registry | Package distribution via `npx design-forge@latest` | Standard npm bin pattern. No postinstall -- runs as an explicit CLI command. |
| AI coding runtimes (Claude Code, OpenCode, Gemini CLI, Cursor) | File-based integration. No API calls. | Design Forge installs markdown files that the runtime reads. Zero runtime dependencies on Design Forge code. |
| Git | Subagents commit with `design(...)` prefix | Requires git to be initialized in the project. Installer should verify. |
| Node.js fs module | `fs.cpSync`, `fs.readFileSync`, `fs.writeFileSync`, `fs.existsSync` | All synchronous. No async needed for installer operations. Zero external dependencies. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| bin/install.js <-> core/ | Installer reads core/ as opaque content to copy. Never parses or transforms markdown. | One-directional: installer reads source, writes to target. |
| bin/install.js <-> runtimes/ | Installer reads runtime directory structure to determine what to copy where. | Runtime detection drives which runtimes/ subdirectory is used. |
| commands/ <-> workflows/ | Commands contain a single instruction: "Load and follow workflow at [path]". | The command IS the routing layer. It translates a slash-command invocation into a workflow file read. |
| workflows/ <-> agents/ | Workflows define the task prompt inline (what to do). Agent files define personality (how to do it). | The thin command or orchestrator assembles both into a Task() call. |
| workflows/ <-> references/ | Workflows reference `{FORGE_ROOT}/verticals/{VERTICAL}.md` and other reference files by path. | Workflows never inline reference content. They pass paths to agents. |
| workflows/ <-> STATE.md | Every workflow reads STATE.md (gate check) and writes STATE.md (phase transition). | STATE.md is the inter-workflow communication channel. |
| agents/ <-> .planning/design/ | Agents read from and write to .planning/design/ during execution. | This is the runtime output directory. Never part of the Design Forge installation itself. |
| hooks/ <-> .planning/design/system/ | Hooks read tokens.css and COMPONENT-SPECS.md to validate code being written. | Read-only access to design system files. Never write to them. |

## Build Order Dependencies

The architecture has clear dependency layers that inform what must be built first:

```
Layer 0: core/ content                      [DONE - already built]
    │  references/, workflows/, templates/
    │  No dependencies. Pure content.
    │
Layer 1: Runtime adapter content            [PARTIALLY DONE]
    │  runtimes/claude-code/commands/       [DONE]
    │  runtimes/claude-code/agents/         [NOT BUILT - needs core/references/context-engine.md]
    │  runtimes/claude-code/hooks/          [NOT BUILT - needs tokens.css format knowledge]
    │  runtimes/claude-code/CLAUDE-MD-SNIPPET.md [DONE]
    │
    │  Dependencies: Requires Layer 0 to define contracts
    │  (what context profiles exist, what STATE.md format is, etc.)
    │
Layer 2: Templates                          [PARTIALLY DONE]
    │  core/templates/STATE-TEMPLATE.md     [NOT BUILT - needs state-machine.md format]
    │  core/templates/SUMMARY-TEMPLATE.md   [NOT BUILT - needs compose-screen.md format]
    │  core/templates/token-showcase.html   [NOT BUILT - needs tokens.css format]
    │
    │  Dependencies: Requires Layer 0 for format definitions
    │
Layer 3: Installer                          [NOT BUILT]
    │  bin/install.js                       [NOT BUILT]
    │  package.json                         [NOT BUILT]
    │
    │  Dependencies: Requires Layer 0 + Layer 1 to exist as content to copy.
    │  Requires runtime-adapters.md for mapping definitions.
    │
Layer 4: Distribution + Polish             [NOT BUILT]
    │  README.md, LICENSE, CHANGELOG.md
    │  scripts/contrast-checker.js
    │  scripts/token-counter.js
    │
    │  Dependencies: Requires Layer 3 for install instructions in README.
    │
Layer 5: Additional verticals              [NOT BUILT]
    │  health.md, saas.md, ecommerce.md
    │
    │  Dependencies: Only requires VERTICAL-TEMPLATE.md format [DONE].
    │  Can be built in parallel with Layers 1-4.
    │
Layer 6: Additional runtimes               [FUTURE]
    runtimes/opencode/, cursor/, gemini/
    Dependencies: Requires Layer 3 installer to support multiple runtimes.
```

**Recommended build sequence:**

1. **Agents + Templates (Layer 1 + 2):** Complete the runtime adapter content. Agents are needed for workflows to actually function. Templates provide the output format. This is the "make it work" step.

2. **Installer + Package (Layer 3):** Build install.js once there is content to install. This unlocks `npx` distribution.

3. **Verticals (Layer 5, parallel):** Can be built alongside Layer 3. Each vertical is independent. Start with health and saas to prove the template works beyond fintech.

4. **Hooks + Scripts (Layer 4):** Polish layer. Hooks enforce design system compliance automatically. Scripts provide utility functions. Not needed for core workflow.

5. **End-to-end validation:** Run the full workflow on a real project. This is where integration bugs surface.

## Sources

- [Node.js CLI Apps Best Practices](https://github.com/lirantal/nodejs-cli-apps-best-practices) - Community-maintained best practices for Node.js CLI tools (HIGH confidence)
- [Node.js fs.cpSync documentation](https://nodejs.org/api/fs.html) - Official Node.js filesystem API for recursive directory copying (HIGH confidence)
- [npm bin executable docs](https://docs.npmjs.com/cli/v7/configuring-npm/folders/) - How npm resolves bin entries for package executables (HIGH confidence)
- [Husky init pattern](https://typicode.github.io/husky/get-started.html) - Reference implementation for npx-driven file installation into project directories (MEDIUM confidence)
- [claude-code-templates](https://github.com/davila7/claude-code-templates) - Existing npm tool that installs Claude Code configurations, agents, and commands into .claude/ directory (MEDIUM confidence)
- [Plugin Architecture in Node.js](https://medium.com/@Modexa/plugin-architecture-in-node-js-without-regrets-e02ba78660c7) - Plugin system patterns for Node.js applications (LOW confidence - single source)
- [npm issue #11260](https://github.com/npm/npm/issues/11260) - Discussion of challenges copying files from packages to project directories via postinstall (MEDIUM confidence)
- Project spec (`GSD-PROJECT-SPEC.md`) and existing codebase analysis (HIGH confidence)
- `core/references/runtime-adapters.md` - Existing architecture documentation within the project (HIGH confidence)
- `core/references/context-engine.md` - Context management strategy documentation (HIGH confidence)

---
*Architecture research for: npm-distributed AI design engineering tool*
*Researched: 2026-03-01*
