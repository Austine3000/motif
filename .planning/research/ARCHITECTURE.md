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

---

# Icon Library Integration Architecture

**Domain:** Icon library selection and integration into the Motif design pipeline
**Researched:** 2026-03-04
**Overall Confidence:** HIGH

## Problem Statement

Motif's pipeline currently handles colors, typography, spacing, radii, shadows, and motion as first-class design system concerns. Icons are mentioned in multiple places (research workflow item #3 "Iconography -- outlined/filled/duotone", composer anti-slop check #8 "Am I using a generic icon set without checking the vertical?", system architect output "icon style recommendation") but have no formal infrastructure: no curated reference doc, no icon tokens, no delivery mechanism to the HTML output, and no reviewer lens for icon compliance. The composer agent is told to care about icon choice but given no tools to make an informed decision.

## Current State: Where Icons Already Appear

| File | How Icons Are Referenced | Gap |
|------|------------------------|-----|
| `workflows/research.md` | Visual language agent researches "Iconography -- outlined/filled/duotone, personality match" | Research happens but findings have no structured landing zone in the system |
| `workflows/generate-system.md` | DESIGN-SYSTEM.md output includes "icon style recommendation" | One-line recommendation, not actionable for the composer |
| `agents/motif-screen-composer.md` | Anti-slop #8: "Am I using a generic icon set without checking the vertical?" | Composer has no reference doc to check AGAINST |
| `agents/motif-design-reviewer.md` | Nielsen #2 "unfamiliar iconography", #6 "unlabeled icons" | Reviewer has no icon compliance spec to grade against |
| `references/verticals/*.md` | Icons referenced structurally (e.g., "MerchantIcon 40x40", "star icons", "heart icon", "bell icon") | Component specs name icons but never say which library or SVG to use |

**Summary:** The pipeline has icon-shaped holes at every stage but no icon-shaped infrastructure to fill them.

## Recommended Architecture

### Design Principle: Icons as a Curated Reference, Not a Token System

Icons differ from colors/typography/spacing in a critical way: they are not continuous values but discrete selections. You do not interpolate between two icons. You pick one. This means icons need a **reference catalog** (which icons exist and when to use each), not a **token scale** (graduated values on a spectrum).

The architecture adds three things:
1. **A curated icon reference doc** per vertical (what icons to use)
2. **Icon metadata in DESIGN-SYSTEM.md / COMPONENT-SPECS.md** (how icons integrate with components)
3. **A delivery mechanism** in the HTML output (how icons render)

### Architecture Diagram

```
USER                          PIPELINE STAGE               ICON TOUCHPOINT
──────────────────────────────────────────────────────────────────────────

/motif:init                   DESIGN-BRIEF.md              Captures icon style
                              (Inputs section)             preference if any
                                    │
                                    ▼
/motif:research               research/02-visual-          Researches iconography
                              language.md                  style per vertical
                                    │
                                    ▼
                              DESIGN-RESEARCH.md           LOCKS icon direction:
                              (synthesized)                library + style + sizing
                                    │
                                    ▼
/motif:system                 DESIGN-SYSTEM.md             Documents icon system:
                              (human-readable)             library, style, sizing,
                                    │                      CDN source
                                    │
                                    ├──► tokens.css        NEW: --icon-size-sm/md/lg,
                                    │                      --icon-stroke-width,
                                    │                      --icon-color-*
                                    │
                                    ├──► COMPONENT-SPECS   MODIFIED: icon= attribute
                                    │    .md               on components that use icons
                                    │
                                    └──► ICON-CATALOG.md   NEW: curated catalog of
                                         (per-project)     ~40-80 icons for this
                                                           project's vertical + screens
                                    │
                                    ▼
/motif:compose                Screen HTML/JSX              Renders icons using the
                              output                       chosen delivery mechanism
                                    │                      (inline SVG or CDN img)
                                    ▼
/motif:review                 Lens 3 expanded:             Checks: correct library,
                              Icon compliance              correct style, icon-only
                                                           buttons have aria-label
```

## New Files

### 1. `core/references/icon-libraries.md` (NEW -- ships with Motif)

**Purpose:** Curated reference of recommended icon libraries per vertical, with CDN URLs, usage patterns, and style guidance. This is the authoritative source the system architect consults when choosing an icon library.

**Location:** `.claude/get-motif/references/icon-libraries.md`

**Context budget:** ~2000 tokens

**Loaded by:** System architect agent (during `/motif:system`)

**Content structure:**

```markdown
# Icon Library Reference

## Recommended Libraries

### Lucide (Default for most verticals)
- **Style:** Outlined, consistent 24x24 grid, 2px stroke
- **Icon count:** 1500+
- **CDN (individual):** https://unpkg.com/lucide-static@latest/icons/{name}.svg
- **CDN (sprite):** https://unpkg.com/lucide-static@latest/sprite.svg
- **CSS class (font):** icon-{kebab-case-name}
- **Sizing:** Designed at 24px, scales cleanly 16-48px
- **Best for:** SaaS, Fintech (professional, precise, minimal)
- **Personality range:** 1-6 on Motif personality axis
- **Anti-convergence note:** Lucide is the default in many AI-generated
  UIs. If differentiation seed personality >= 7, prefer Phosphor.

### Phosphor (For expressive/distinctive projects)
- **Style:** 6 weights (thin/light/regular/bold/fill/duotone)
- **Icon count:** 6000+ (across all weights)
- **CDN:** https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2/src/{weight}/style.css
- **Usage:** <i class="ph-{weight} ph-{name}"></i>
- **Sizing:** Inherits font-size from parent
- **Best for:** Health, E-commerce, projects with personality >= 6
- **Why:** Weight variants enable visual hierarchy within the icon
  system itself -- thin for decorative, bold for navigation, fill
  for active states

### Heroicons (For Tailwind-integrated projects)
- **Style:** Outlined (24px) + Solid (24px) + Mini (20px)
- **Icon count:** 450+
- **CDN:** https://unpkg.com/@heroicons/react@latest/...
- **Best for:** Projects already using Tailwind CSS
- **Limitation:** Smallest collection. No weight variants.

## Selection Algorithm

Based on DESIGN-BRIEF.md differentiation seed:

IF personality <= 5 AND vertical is SaaS or Fintech:
  → Lucide (precise, professional, extensive)
IF personality >= 6 OR vertical is Health or E-commerce:
  → Phosphor (expressive, weight hierarchy, distinctive)
IF project stack includes Tailwind AND icon needs are simple:
  → Heroicons (native integration, but limited)
IF user has locked an icon library in DESIGN-BRIEF.md:
  → Use that library (user choice overrides, like fonts)
```

**Rationale for Lucide as default:** Consistent stroke-based design, large collection, clean 24x24 grid, excellent SVG quality, CDN availability for standalone HTML, no build step required. Phosphor recommended when differentiation matters because its weight system (6 variants per icon) gives the design system more expressive range than Lucide's single outline style.

### 2. Project-level `ICON-CATALOG.md` (NEW -- generated per project)

**Purpose:** A curated subset of icons from the chosen library that this project actually uses. The composer reads this to know which icon name maps to which UI concept. Without this, the composer guesses icon names and often gets them wrong.

**Location:** `.planning/design/system/ICON-CATALOG.md`

**Context budget:** ~1000 tokens (kept lean -- it is a lookup table)

**Generated by:** System architect agent (during `/motif:system`)

**Loaded by:** Screen composer agent, Design reviewer agent

**Content structure:**

```markdown
# Icon Catalog — [Product Name]

**Library:** [Lucide | Phosphor | Heroicons]
**Style:** [outlined | bold | duotone | fill]
**CDN Base:** [URL]
**Default Size:** var(--icon-size-md) (24px)

## Delivery

### For HTML output (no framework)
[Inline SVG with stroke="currentColor" and class="icon icon-{name}"]

### For React/Vue output
[Import from @lucide/react or equivalent]

## Icon Map

### Navigation
| Concept | Icon Name | Usage |
|---------|-----------|-------|
| Home/Dashboard | house | Bottom tab, sidebar |
| Search | search | Top bar, command palette |
| Settings | settings | Sidebar, profile menu |
| Back | arrow-left | Screen header |
| Menu | menu | Mobile hamburger |
| Close | x | Modal, sheet, drawer |
| Notifications | bell | Top bar |

### Actions
| Concept | Icon Name | Usage |
|---------|-----------|-------|
| Add/Create | plus | FAB, inline action |
| Edit | pencil | Inline edit trigger |
| Delete | trash-2 | Destructive action |
| Share | share-2 | Content sharing |
| Download | download | Export, receipt |
| Filter | filter | List filtering |
| Sort | arrow-up-down | Column sorting |

### Status
| Concept | Icon Name | Usage |
|---------|-----------|-------|
| Success | check-circle | Confirmation, completed |
| Error | alert-circle | Failed, declined |
| Warning | alert-triangle | Pending, attention |
| Info | info | Informational |
| Loading | loader-2 | Async operations |

### [Vertical-Specific Section]
| Concept | Icon Name | Usage |
|---------|-----------|-------|
| [domain concept] | [icon name] | [where used] |

## Sizing Reference
| Token | Value | Usage |
|-------|-------|-------|
| --icon-size-sm | 16px | Inline with text, badges |
| --icon-size-md | 24px | Navigation, actions, default |
| --icon-size-lg | 32px | Feature icons, empty states |
| --icon-size-xl | 48px | Hero sections, onboarding |
```

## Modified Files

### 1. `tokens.css` -- Add Icon Tokens

**What changes:** Add an `/* -- Icons -- */` section with sizing and style tokens.

**New tokens:**

```css
/* ── Icons ── */
/* Library: [name]. Style: [style]. See ICON-CATALOG.md for icon names. */
--icon-size-sm: 1rem;     /* 16px — inline with text, badges, chips */
--icon-size-md: 1.5rem;   /* 24px — navigation, buttons, default */
--icon-size-lg: 2rem;     /* 32px — feature icons, metric cards */
--icon-size-xl: 3rem;     /* 48px — hero, empty states, onboarding */
--icon-stroke-width: 2;   /* Default stroke width for outlined icons */
--icon-color-default: var(--text-primary);
--icon-color-muted: var(--text-secondary);
--icon-color-action: var(--color-primary-500);
```

**Context budget impact:** ~100 tokens added to tokens.css. Within the 3000-token budget.

**Why these tokens and not more:** Icons inherit color from `currentColor` in practice, so `--icon-color-*` tokens are for explicit overrides only. The sizing tokens formalize what is currently ad-hoc ("40x40", "32x32", "20x20" scattered across vertical docs). Stroke width is tokenized because it varies by library and style (Lucide = 2, Phosphor thin = 1, Phosphor bold = 2.5).

### 2. `COMPONENT-SPECS.md` -- Add Icon Attributes to Components

**What changes:** Components that use icons gain an `<icon>` element within their XML spec.

**Example (Button with icon):**

```xml
<component name="Button" category="action">
  <variants>
    <variant name="primary">
      <!-- existing styles unchanged -->
    </variant>
    <variant name="icon-only">
      padding: var(--space-3);
      min-width: 44px; min-height: 44px;
      display: flex; align-items: center; justify-content: center;
    </variant>
  </variants>
  <icon>
    size: var(--icon-size-md);
    stroke-width: var(--icon-stroke-width);
    color: currentColor;
    position: leading (before label) or trailing (after label) or solo (icon-only);
    gap-from-label: var(--space-2);
  </icon>
  <accessibility>
    IF icon-only: aria-label REQUIRED (describe the action, not the icon)
    IF icon + label: icon is aria-hidden="true" (label provides semantics)
  </accessibility>
</component>
```

**Components that need `<icon>` additions:**
- Button (icon-only variant, icon+label variant)
- Input (leading icon, trailing icon for visibility toggle / clear)
- Toast (status icon: check-circle, alert-circle, alert-triangle, info)
- Modal (close icon: x)
- Dropdown (chevron-down trigger, check for selected)
- Nav item (leading icon per nav entry)
- Badge (optional leading icon)

**Vertical-specific components:**
- TransactionRow: MerchantIcon (category-based, from ICON-CATALOG.md)
- MetricCard: metric-type icon
- CommandPalette: result-type icons
- ProductCard: wishlist heart icon, cart icon
- FilterBar: filter icon, sort icon, clear (x) icon

### 3. `DESIGN-SYSTEM.md` -- Expand Icon Section

**What changes:** The current "icon style recommendation" one-liner becomes a full section.

**New content in DESIGN-SYSTEM.md:**

```markdown
## Iconography

**Library:** [Lucide | Phosphor | Heroicons]
**Style:** [outlined | weight variant]
**Grid:** 24x24
**Stroke:** var(--icon-stroke-width) — [value]px

### Delivery
[How icons are included in output — inline SVG or CDN reference]

### Sizing Scale
| Size | Token | When |
|------|-------|------|
| 16px | --icon-size-sm | Inline with body text, chips, badges |
| 24px | --icon-size-md | Buttons, navigation, standard UI |
| 32px | --icon-size-lg | Feature cards, metric displays |
| 48px | --icon-size-xl | Empty states, onboarding, hero |

### Icon + Text Rules
- Icon precedes label in LTR (trailing for directional actions like "Next →")
- Gap between icon and label: var(--space-2)
- Icon color inherits from text via currentColor
- Icon-only buttons: minimum 44x44px touch target, aria-label required

### Style Rules
- [Outlined/Regular] for navigation and actions
- [Filled/Bold] for active/selected states (e.g., filled heart = wishlisted)
- NEVER mix outlined and filled icons in the same context unless
  indicating state change (unselected vs. selected)
```

**Context budget impact:** ~300 tokens added to DESIGN-SYSTEM.md. Within the 3000-token budget.

### 4. `workflows/generate-system.md` -- Add Icon System Generation

**What changes:** The system generator orchestrator adds ICON-CATALOG.md as a fourth required output and instructs the system architect agent to choose an icon library.

**Specific additions:**

In Step 1 (Read Context), add:
```
- `.claude/get-motif/references/icon-libraries.md`
```

In the agent spawn prompt, add a new output section:

```markdown
## Output 5: ICON-CATALOG.md (budget: ≤1000 tokens)

Based on the chosen vertical, differentiation seed, and screen list:

1. Select icon library using the algorithm in icon-libraries.md
2. Choose style (outlined, bold, fill, duotone) based on:
   - Personality 1-4: outlined/regular (precise, professional)
   - Personality 5-7: regular or bold (balanced)
   - Personality 8-10: bold or duotone (expressive)
3. Curate 40-80 icons organized by:
   - Navigation (home, search, settings, back, menu, close, notifications)
   - Actions (add, edit, delete, share, download, filter, sort)
   - Status (success, error, warning, info, loading)
   - Vertical-specific (domain concepts from vertical reference)
4. Document delivery mechanism:
   - For HTML output: inline SVG with class="icon icon-{name}"
   - For React: import { IconName } from 'lucide-react'
   - For Vue: <Icon name="icon-name" />

Save to `.planning/design/system/ICON-CATALOG.md`
```

In Step 3 (Collect & Validate), add:
```
- `.planning/design/system/ICON-CATALOG.md`
```

### 5. `workflows/compose-screen.md` -- Add ICON-CATALOG.md to Context

**What changes:** The composer's context profile gains ICON-CATALOG.md as a required file.

In Step 2 (Assemble Context Profile), under REQUIRED_FILES, add:
```
- .planning/design/system/ICON-CATALOG.md
```

In the agent spawn prompt, add to "Context Files -- Read These First":
```
5. `.planning/design/system/ICON-CATALOG.md` — icon names and delivery method. Use ONLY icons listed here.
```

In "Implementation Rules", add:
```
9. **Icon compliance:** Use ONLY icons from ICON-CATALOG.md. Use the specified
   delivery mechanism. Icon-only buttons MUST have aria-label. Icons with labels
   MUST have aria-hidden="true" on the icon element.
```

In "Anti-Slop Check", modify item 8:
```
8. **Am I using a random icon name?** STOP. Check ICON-CATALOG.md for the
   correct icon name. If the concept isn't cataloged, add it to ICON-CATALOG.md
   first and commit separately.
```

### 6. `workflows/review.md` -- Add Icon Compliance to Lens 3

**What changes:** Lens 3 (Design System Compliance) gains icon-specific grep checks.

Add to the agent spawn prompt under Lens 3:
```markdown
**Icon compliance checks:**
- `grep -n 'class="icon' {files}` — verify icon class names match ICON-CATALOG.md
- `grep -n 'aria-label' {files}` — verify all icon-only buttons have aria-labels
- `grep -n 'aria-hidden' {files}` — verify icons with text labels have aria-hidden
- Cross-reference every icon name used against ICON-CATALOG.md
- Verify icon sizing uses --icon-size-* tokens, not hardcoded values
```

### 7. `agents/motif-system-architect.md` -- Add Icon Expertise

**What changes:** The agent's domain expertise and context loading profile expand to include icon library selection.

Add to "Context Loading Profile > Load If Exists":
```
- `.claude/get-motif/references/icon-libraries.md` — icon library options and selection algorithm
```

Add to "Domain Expertise":
```markdown
### Iconography Systems
- **Library selection:** Choose based on vertical conventions, differentiation seed personality
  axis, and project stack. Lucide for precision, Phosphor for expression, Heroicons for
  Tailwind projects.
- **Style consistency:** Never mix outlined and filled icons in the same UI context unless
  indicating state change. Choose one primary weight and use it everywhere.
- **Icon-text pairing:** Icons accompany labels except in well-known universal actions
  (close, back, search). Icon-only buttons require aria-label.
- **Sizing system:** Four stops (16/24/32/48) mapped to semantic tokens. Icons align to the
  4px grid.
```

Add to "Output Format Expectations":
```
- **`ICON-CATALOG.md`** (max 1000 tokens) -- Curated icon catalog with library, style,
  delivery mechanism, and concept-to-name mapping organized by category
```

Add to "Quality Checklist":
```
- [ ] Icon library chosen with justification (personality seed + vertical alignment)
- [ ] ICON-CATALOG.md contains all icons referenced in COMPONENT-SPECS.md
- [ ] Delivery mechanism documented for the project's stack
- [ ] Icon sizing tokens added to tokens.css
```

### 8. `agents/motif-screen-composer.md` -- Add Icon Context Profile

**What changes:** Add ICON-CATALOG.md to always-load and add icon-specific expertise.

Add to "Context Loading Profile > Always Load":
```
- `.planning/design/system/ICON-CATALOG.md` — icon names, library, delivery mechanism
```

Add to "Anti-Slop Checklist" (expand item 8):
```
8. **Am I guessing an icon name?** STOP. Open ICON-CATALOG.md. Find the concept. Use the
   exact name listed. If the concept is not cataloged, add it to ICON-CATALOG.md first.
9. **Does my icon-only button have aria-label?** REQUIRED. The label describes the action
   ("Close dialog"), not the icon ("X mark").
10. **Am I hardcoding icon size?** STOP. Use var(--icon-size-sm/md/lg/xl).
```

Add to "Self-Review Checklist":
```
- [ ] All icon names match ICON-CATALOG.md entries
- [ ] Icon-only interactive elements have aria-label
- [ ] Icons paired with text labels have aria-hidden="true"
- [ ] Icon sizes use --icon-size-* tokens
```

### 9. `agents/motif-design-reviewer.md` -- Add Icon Lens

**What changes:** Add ICON-CATALOG.md to always-load. Expand Lens 3 scoring.

Add to "Context Loading Profile > Always Load":
```
- `.planning/design/system/ICON-CATALOG.md` — for verifying icon name compliance
```

Expand Lens 3 scoring (adjust point allocation within existing /25):
```
- Zero hardcoded colors -- /5
- Zero hardcoded fonts -- /4
- Zero hardcoded radii/shadows/spacing -- /4
- Component specs compliance -- /4
- Token usage patterns -- /3
- Icon compliance (correct names, delivery, sizing, aria) -- /5
```

### 10. `references/verticals/*.md` -- Add Icon Recommendations Per Vertical

**What changes:** Each vertical reference gains an `## Iconography` section recommending icon style and listing domain-specific icon needs.

**Example addition to `fintech.md`:**

```markdown
## Iconography

### Recommended Style
Outlined/regular weight -- precision and clarity over personality.
Stroke-based icons match the data-precise fintech aesthetic.

### Vertical-Specific Icons Needed
| Concept | Suggested Icon | Notes |
|---------|---------------|-------|
| Send money | send | Primary action |
| Receive | download | Paired with send |
| Transaction | arrow-right-left | Activity/history |
| Wallet | wallet | Account type |
| Card | credit-card | Payment method |
| Bank | landmark | Linked bank |
| QR Code | qr-code | Scan to pay |
| Security/Lock | shield-check | Trust signal |
| Biometric | fingerprint | Auth method |
| Exchange rate | refresh-cw | Currency conversion |
| Chart/Analytics | trending-up | Portfolio performance |
| Receipt | receipt | Transaction confirmation |

### Icon Anti-Patterns
- Decorative/playful icon styles (undermines trust with money)
- Colored/multi-tone icons in data-dense contexts (visual noise)
- Inconsistent stroke weights across the same screen
- Using filled icons by default (outlined reads cleaner at small sizes in data UIs)
```

### 11. `agents/motif-researcher.md` -- Structured Iconography Output

**What changes:** The visual language research agent's iconography investigation gets more structure.

Modify the research prompt's item 3 from:
```
3. Iconography — outlined/filled/duotone, personality match
```
to:
```
3. Iconography:
   - Dominant icon style in top products (outlined/filled/duotone/mixed)
   - Common icon library used (if identifiable)
   - Icon sizing conventions (what sizes at what UI positions)
   - Icon + text vs icon-only patterns (when do products use each)
   - Domain-specific icons unique to this vertical
```

### 12. `context-engine.md` -- Add ICON-CATALOG.md to Context Profiles

**What changes:** ICON-CATALOG.md added to composer and reviewer profiles.

```xml
<!-- In composer profile -->
<context_profile name="composer">
  <always_load>
    .planning/design/PROJECT.md
    .planning/design/system/tokens.css
    .planning/design/system/COMPONENT-SPECS.md
    .planning/design/system/ICON-CATALOG.md    <!-- NEW -->
  </always_load>
  ...
</context_profile>

<!-- In reviewer profile -->
<context_profile name="reviewer">
  <always_load>
    .planning/design/system/tokens.css
    .planning/design/system/COMPONENT-SPECS.md
    .planning/design/DESIGN-RESEARCH.md
    .planning/design/system/ICON-CATALOG.md    <!-- NEW -->
    The actual source code of the screen being reviewed
  </always_load>
  ...
</context_profile>

<!-- In system-generator profile -->
<context_profile name="system-generator">
  <always_load>
    .planning/design/PROJECT.md
    .planning/design/DESIGN-BRIEF.md
    .planning/design/DESIGN-RESEARCH.md
  </always_load>
  <load_if_exists>
    .planning/design/research/02-visual-language.md
    .planning/design/research/03-accessibility.md
    .claude/get-motif/references/verticals/{vertical}.md
    .claude/get-motif/references/icon-libraries.md    <!-- NEW -->
  </load_if_exists>
  ...
</context_profile>
```

**Context budget update** (add to context budget table in context-engine.md):
```
| ICON-CATALOG.md | 1,000 | Curated icon lookup table |
```

## Data Flow: Icon Selection to Output

### Complete Pipeline Trace

```
Stage 1: /motif:init
├── User answers "Do you have icon preferences?" (if added to init interview)
├── DESIGN-BRIEF.md stores: icon library preference (if any) under Brand Constraints
└── No icon infrastructure exists yet

Stage 2: /motif:research
├── Visual language agent investigates iconography in vertical
├── Writes to: research/02-visual-language.md (iconography section)
├── Research orchestrator synthesizes into DESIGN-RESEARCH.md
└── DESIGN-RESEARCH.md LOCKS: "Icon direction: [library], [style] -- because [reason]"

Stage 3: /motif:system
├── System architect reads:
│   ├── DESIGN-RESEARCH.md (locked icon direction)
│   ├── icon-libraries.md (library reference with CDN URLs)
│   └── verticals/{vertical}.md (domain-specific icon needs)
├── Applies selection algorithm:
│   ├── Check if user locked an icon library in DESIGN-BRIEF.md → use it
│   ├── Else: personality seed + vertical → Lucide or Phosphor
│   └── Document reasoning in DESIGN-SYSTEM.md
├── Generates:
│   ├── tokens.css += icon sizing/stroke tokens
│   ├── COMPONENT-SPECS.md += <icon> elements on components
│   ├── DESIGN-SYSTEM.md += Iconography section
│   └── ICON-CATALOG.md (NEW file: curated icon map)
└── token-showcase.html += icon preview section (optional enhancement)

Stage 4: /motif:compose
├── Composer reads ICON-CATALOG.md (always-load)
├── For each component that needs an icon:
│   ├── Look up concept in ICON-CATALOG.md
│   ├── Use exact icon name from the catalog
│   └── Render using documented delivery mechanism
├── Delivery (for standalone HTML / no-framework output):
│   ├── Inline SVG: paste the SVG markup directly
│   │   <svg class="icon" width="24" height="24" ...>
│   │     <path d="..." />
│   │   </svg>
│   └── CDN img: <img src="https://unpkg.com/lucide-static@latest/icons/{name}.svg"
│                      class="icon" alt="" width="24" height="24" />
├── Delivery (for React output):
│   └── import { Home, Search, ... } from 'lucide-react'
├── Icon-only buttons: add aria-label
└── Icons with labels: add aria-hidden="true" to icon

Stage 5: /motif:review
├── Reviewer reads ICON-CATALOG.md (always-load)
├── Lens 3 icon checks:
│   ├── Grep for icon names → cross-reference against catalog
│   ├── Grep for aria-label on icon-only buttons
│   ├── Grep for aria-hidden on labeled icon buttons
│   ├── Grep for hardcoded icon sizes (should use tokens)
│   └── Check: no uncataloged icons used
└── Score icon compliance within Lens 3 (/5 of /25)

Stage 6: /motif:fix
├── Fix agent addresses icon-related review findings
├── Common fixes:
│   ├── Replace wrong icon name with catalog name
│   ├── Add missing aria-label to icon-only button
│   ├── Replace hardcoded icon size with --icon-size-* token
│   └── Add aria-hidden to decorative icons
└── No new domain knowledge needed -- follows review prescriptions

Stage 7: /motif:evolve
├── User can request: "Add more icons to the catalog"
├── Evolve agent reads ICON-CATALOG.md + adds new entries
└── Documents change in EVOLUTION-LOG.md
```

### Fresh-Context Isolation: How Icon Data Flows Without Breaking It

The critical constraint is that each subagent gets a fresh context window and reads files by path. Icon integration preserves this:

1. **The orchestrator never reads ICON-CATALOG.md.** It passes the path.
2. **Each composer subagent reads ICON-CATALOG.md fresh.** At ~1000 tokens, it fits easily in the ~15,000-token context budget.
3. **Icon names are strings, not binary data.** No special handling needed for file reading.
4. **The catalog is self-contained.** It includes the library name, CDN URL, and delivery mechanism -- the composer does not need to read icon-libraries.md (that reference doc is for the system architect only).

### Core/Runtime Separation: How Icons Stay Runtime-Agnostic

Icon infrastructure splits cleanly:

| Layer | File | Content |
|-------|------|---------|
| **Core** (runtime-agnostic) | `core/references/icon-libraries.md` | Library catalog, selection algorithm, CDN URLs |
| **Core** | `core/references/verticals/*.md` | Vertical icon recommendations |
| **Per-project** (generated) | `.planning/design/system/ICON-CATALOG.md` | Project-specific curated icon map |
| **Per-project** (generated) | `.planning/design/system/tokens.css` | Icon sizing/stroke tokens |
| **Per-project** (generated) | `.planning/design/system/COMPONENT-SPECS.md` | Component-level icon specs |

No runtime-specific files need modification. The Claude Code commands, OpenCode adapters, and Cursor rules do not need to know about icons -- they dispatch to workflows, and the workflows handle icon context.

## Delivery Mechanism: How Icons Render in Output

### For HTML output (token-showcase.html, standalone screens)

**Recommended: Inline SVG with currentColor**

```html
<!-- Icon with label -->
<button class="btn btn-primary">
  <svg class="icon" width="24" height="24" viewBox="0 0 24 24"
       fill="none" stroke="currentColor" stroke-width="2"
       stroke-linecap="round" stroke-linejoin="round"
       aria-hidden="true">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
  <span>Send Money</span>
</button>

<!-- Icon-only button -->
<button class="btn btn-icon" aria-label="Close dialog">
  <svg class="icon" width="24" height="24" viewBox="0 0 24 24"
       fill="none" stroke="currentColor" stroke-width="2"
       stroke-linecap="round" stroke-linejoin="round">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
</button>
```

**Why inline SVG over CDN img tags:**
- `currentColor` inheritance means icons automatically match text color (tokens work)
- No external HTTP requests (self-contained, like the rest of Motif HTML output)
- Stroke-width can be controlled by CSS (tokenizable)
- No CORS issues, no CDN dependency
- Consistent with the existing token-showcase-template.html approach (zero JS, self-contained)

**Why NOT icon fonts:**
- Icon fonts are deprecated in favor of SVG across the industry
- They do not support multi-color or stroke-width variation
- Screen readers sometimes read them as characters
- File size overhead (load ALL icons, not just the ones used)

### For React/Vue output

```jsx
// React with Lucide
import { Send, X } from 'lucide-react'

<Button>
  <Send size={24} aria-hidden="true" />
  <span>Send Money</span>
</Button>

<Button variant="icon-only" aria-label="Close dialog">
  <X size={24} />
</Button>
```

The composer agent determines which mechanism to use based on the stack from PROJECT.md / STATE.md.

## Icon CSS Integration with tokens.css

```css
/* Icon base styles — add to token-showcase-template.html or screen styles */
.icon {
  width: var(--icon-size-md);
  height: var(--icon-size-md);
  stroke: currentColor;
  fill: none;
  stroke-width: var(--icon-stroke-width);
  stroke-linecap: round;
  stroke-linejoin: round;
  flex-shrink: 0;
}

.icon-sm { width: var(--icon-size-sm); height: var(--icon-size-sm); }
.icon-lg { width: var(--icon-size-lg); height: var(--icon-size-lg); }
.icon-xl { width: var(--icon-size-xl); height: var(--icon-size-xl); }
```

These utility classes can be documented in ICON-CATALOG.md's delivery section or added to the token-showcase-template.html.

## Build Order and Dependencies

The implementation must respect dependency ordering:

```
Phase 1: Foundation (no dependencies)
├── Create core/references/icon-libraries.md
├── Add ## Iconography section to each verticals/*.md
└── These are reference docs -- nothing reads them yet

Phase 2: Pipeline Integration (depends on Phase 1)
├── Modify workflows/generate-system.md (reads icon-libraries.md)
├── Modify agents/motif-system-architect.md (uses icon-libraries.md)
├── Modify workflows/research.md (structured iconography output)
├── Modify agents/motif-researcher.md (structured iconography)
└── These changes mean /motif:system will now produce ICON-CATALOG.md

Phase 3: Consumer Integration (depends on Phase 2)
├── Modify workflows/compose-screen.md (reads ICON-CATALOG.md)
├── Modify agents/motif-screen-composer.md (icon anti-slop, checklist)
├── Modify workflows/review.md (icon compliance checks)
├── Modify agents/motif-design-reviewer.md (icon scoring)
├── Modify context-engine.md (add ICON-CATALOG.md to profiles)
└── These changes mean compose/review will enforce icon compliance

Phase 4: Polish (depends on Phase 3)
├── Update token-showcase-template.html (icon preview section)
├── Update agents/motif-fix-agent.md (icon fix patterns)
├── Test end-to-end: init → research → system → compose → review
└── Verify: composer uses catalog, reviewer catches violations
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Shipping All Icon SVGs as a Bundled File
**What:** Including a complete icon sprite (1500+ icons) in the project.
**Why bad:** Motif output is self-contained HTML. A full sprite file adds 200KB+ for icons the project will never use.
**Instead:** The ICON-CATALOG.md curates a subset. The composer inlines only the SVGs it uses.

### Anti-Pattern 2: Making the Composer Choose Icons on the Fly
**What:** No catalog -- the composer picks icon names from memory.
**Why bad:** LLMs hallucinate icon names. "lucide:money-send" does not exist. Without a catalog, every compose pass risks broken icon references.
**Instead:** ICON-CATALOG.md is the lookup table. Composer checks it, not its training data.

### Anti-Pattern 3: Putting Icon Names in tokens.css
**What:** `--icon-home: "house"; --icon-send: "send";` as CSS custom properties.
**Why bad:** CSS custom properties are for values, not identifiers. A separate ICON-CATALOG.md is the right abstraction for a name-to-concept mapping.
**Instead:** tokens.css holds icon sizing/color tokens. ICON-CATALOG.md holds name mappings.

### Anti-Pattern 4: Different Icon Libraries Per Screen
**What:** Dashboard uses Lucide, settings uses Phosphor, checkout uses Heroicons.
**Why bad:** Visual inconsistency. Users perceive the UI as stitched-together, not designed.
**Instead:** One library per project, chosen during /motif:system, enforced by the reviewer.

### Anti-Pattern 5: Skipping Icon Research
**What:** System architect picks Lucide by default without checking the vertical or differentiation seed.
**Why bad:** Same convergence problem Motif solves for colors and fonts. Every AI-generated UI uses Lucide outlined icons -- differentiation requires intentional choice.
**Instead:** The selection algorithm in icon-libraries.md forces the architect to evaluate personality seed and vertical before defaulting.

## Scalability Considerations

| Concern | At v1 (current) | At v2 (future) | At v3 (scale) |
|---------|------------------|-----------------|----------------|
| Icon count | ~50 per project | ~100 per project | Custom icon creation |
| Libraries supported | 3 (Lucide, Phosphor, Heroicons) | 5+ (add Tabler, Iconoir) | User-provided SVG sets |
| Delivery | Inline SVG | Framework components | Design token integration |
| Dark mode | currentColor (automatic) | Explicit dark mode icon variants | Theme-aware icon system |
| Custom icons | Not supported | "Add to ICON-CATALOG.md" | Full custom icon pipeline |

## Sources

- [Lucide Static Documentation](https://lucide.dev/guide/packages/lucide-static) -- CDN usage, sprite, individual SVG files (HIGH confidence)
- [Phosphor Icons](https://phosphoricons.com/) -- 6-weight system, CDN delivery via jsdelivr (HIGH confidence)
- [Heroicons by Tailwind](https://heroicons.com/) -- Tailwind-native icon set (HIGH confidence)
- [A Complete Guide to Iconography - Design Systems](https://www.designsystems.com/iconography-guide/) -- naming, organization, style consistency best practices (MEDIUM confidence)
- [SVG Sprites vs Icon Fonts - CSS-Tricks](https://css-tricks.com/svg-sprites-use-better-icon-fonts/) -- technical comparison of delivery mechanisms (HIGH confidence)
- [Iconography in Design Systems - Smashing Magazine](https://www.smashingmagazine.com/2024/04/iconography-design-systems-troubleshooting-maintenance/) -- maintenance and troubleshooting patterns (MEDIUM confidence)
- [Lucide Icons CDN Usage Guide](https://kristianfreeman.com/how-to-use-lucide-icons-via-a-cdn) -- practical CDN integration patterns (MEDIUM confidence)
