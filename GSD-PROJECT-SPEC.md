# Design Forge — GSD Project Specification

## What You're Building

Design Forge is an npm-installable design engineering system for AI coding assistants. It adds domain-intelligent design to frontend development by researching your product vertical's patterns, generating a design system (tokens, component specs), composing screens with fresh agent contexts, and reviewing everything against heuristics.

The core insight: AI tools produce generic "AI slop" UI because they lack domain context. A crypto app shouldn't look like a meditation app. Design Forge fixes this by researching what works in your vertical BEFORE generating any CSS.

**Distribution:** `npx design-forge@latest` auto-detects your runtime (Claude Code, OpenCode, Gemini CLI, Cursor/Windsurf) and installs accordingly.

**v1.0 ships with Claude Code support only.** The codebase is structured so adding other runtimes later is just adding a `runtimes/{name}/` directory — no refactoring needed.

**Audience:** Solo developers, founders, and indie hackers using AI coding tools who want their UI to look intentional.

---

## Project Architecture: Core + Adapters

Design Forge separates runtime-agnostic content from runtime-specific wiring:

```
design-forge/
├── core/                          # Shared across ALL runtimes (~90% of value)
│   ├── references/                # Design knowledge
│   │   ├── state-machine.md       # Phase transitions + gate checks
│   │   ├── context-engine.md      # Context profiles + budgets
│   │   ├── design-inputs.md       # Figma, brand colors, screenshots, differentiation
│   │   ├── runtime-adapters.md    # How each runtime maps to the core
│   │   └── verticals/             # Domain intelligence databases
│   │       ├── fintech.md         # ★ BUILT (v2 with concrete values)
│   │       ├── health.md          # ○ NOT BUILT
│   │       ├── saas.md            # ○ NOT BUILT
│   │       ├── ecommerce.md       # ○ NOT BUILT
│   │       └── ...
│   ├── workflows/                 # Orchestration logic (runtime-agnostic)
│   │   ├── research.md            # ★ BUILT — 4-agent parallel research
│   │   ├── generate-system.md     # ★ BUILT — Token decision algorithms
│   │   ├── compose-screen.md      # ★ BUILT — Fresh agent per screen
│   │   ├── review.md              # ★ BUILT — 4-lens evaluation
│   │   ├── fix.md                 # ★ BUILT — Review fix loop
│   │   ├── evolve.md              # ★ BUILT — System evolution
│   │   └── quick.md               # ★ BUILT — Quick mode
│   └── templates/                 # Output templates
│       ├── VERTICAL-TEMPLATE.md   # ★ BUILT
│       ├── STATE-TEMPLATE.md      # ○ NOT BUILT
│       ├── SUMMARY-TEMPLATE.md    # ○ NOT BUILT
│       └── token-showcase.html    # ○ NOT BUILT
│
├── runtimes/
│   ├── claude-code/               # v1.0 — FULL SUPPORT
│   │   ├── commands/forge/        # Slash commands (10 files) ★ BUILT
│   │   ├── agents/                # Agent definitions (5 files) ○ NOT BUILT
│   │   ├── hooks/                 # PostToolUse hooks (4 files) ○ NOT BUILT
│   │   └── CLAUDE-MD-SNIPPET.md   # Config injection ★ BUILT
│   │
│   ├── opencode/                  # v1.1 — FUTURE
│   │   └── README.md              # ★ Spec for what to build
│   │
│   ├── gemini/                    # v1.3 — FUTURE
│   │   └── README.md              # ★ Spec for what to build
│   │
│   └── cursor/                    # v1.2 — FUTURE
│       └── README.md              # ★ Spec for what to build
│
├── bin/
│   └── install.js                 # ○ NOT BUILT — Runtime-detecting installer
│
├── scripts/                       # ○ NOT BUILT — Utility scripts
│   ├── contrast-checker.js
│   └── token-counter.js
│
├── docs/
│   └── BUILD-SPEC.md              # ★ BUILT — Full 8-milestone roadmap
│
├── package.json                   # ○ NOT BUILT
├── README.md                      # ○ NOT BUILT
├── CHANGELOG.md                   # ○ NOT BUILT
└── LICENSE                        # ○ NOT BUILT
```

### Why This Structure Matters
- Adding OpenCode support = create `runtimes/opencode/commands/` + `runtimes/opencode/agents/` + `runtimes/opencode/config-snippet.md`. Zero changes to core.
- Adding Cursor support = create `runtimes/cursor/rules-snippet.md`. Zero changes to core.
- 90% of the codebase (all the design intelligence) is written once, works everywhere.

---

## What Already Exists

### DONE — Core Design Documents (don't rebuild, USE as specs)

| File | Path | Lines | What It Is |
|---|---|---|---|
| State Machine | `core/references/state-machine.md` | 124 | Phase transitions, gate checks (XML format), STATE.md format |
| Context Engine | `core/references/context-engine.md` | 190 | Context loading profiles per agent type, token budgets, anti-patterns |
| Design Inputs | `core/references/design-inputs.md` | 421 | Figma, brand colors, screenshots, differentiation seed system |
| Runtime Adapters | `core/references/runtime-adapters.md` | 130 | How each runtime maps to the core, installer behavior, path resolution |
| Fintech Vertical | `core/references/verticals/fintech.md` | 226 | Complete design intelligence — palettes, font pairings, component XML specs |
| Vertical Template | `core/templates/VERTICAL-TEMPLATE.md` | 144 | Standard format for contributing new verticals |
| Build Spec | `docs/BUILD-SPEC.md` | 516 | Full 8-milestone roadmap |

### DONE — Workflows (runtime-agnostic orchestration)

| File | Path | Lines | What It Does |
|---|---|---|---|
| Research | `core/workflows/research.md` | 204 | 4-agent parallel research with `<agent_spawn>` markers |
| System Generator | `core/workflows/generate-system.md` | 327 | Color/type/spacing decision algorithms, handles brand constraints |
| Screen Composer | `core/workflows/compose-screen.md` | 163 | Fresh agent per screen, anti-slop checklist |
| Review | `core/workflows/review.md` | 126 | 4-lens evaluation scored /100 |
| Fix | `core/workflows/fix.md` | 64 | Systematic review fix loop |
| Evolve | `core/workflows/evolve.md` | 64 | Design system evolution |
| Quick | `core/workflows/quick.md` | 23 | Ad-hoc with system consistency |

**Note:** Workflows use `{FORGE_ROOT}` as a path variable for vertical references. This resolves per runtime (`.claude/get-design-forge` for Claude Code, `.opencode/get-design-forge` for OpenCode, etc.). The installer handles resolution.

### DONE — Claude Code Commands (thin routing files)

| File | Path | Lines |
|---|---|---|
| Init | `runtimes/claude-code/commands/forge/init.md` | 231 |
| Help | `runtimes/claude-code/commands/forge/help.md` | 29 |
| Progress | `runtimes/claude-code/commands/forge/progress.md` | 11 |
| Research | `runtimes/claude-code/commands/forge/research.md` | 4 |
| System | `runtimes/claude-code/commands/forge/system.md` | 4 |
| Compose | `runtimes/claude-code/commands/forge/compose.md` | 7 |
| Review | `runtimes/claude-code/commands/forge/review.md` | 7 |
| Fix | `runtimes/claude-code/commands/forge/fix.md` | 7 |
| Evolve | `runtimes/claude-code/commands/forge/evolve.md` | 6 |
| Quick | `runtimes/claude-code/commands/forge/quick.md` | 7 |

### DONE — Other Claude Code Files

| File | Path | What It Is |
|---|---|---|
| Config Snippet | `runtimes/claude-code/CLAUDE-MD-SNIPPET.md` | Rules appended to project CLAUDE.md |

---

## NOT BUILT — What GSD Needs to Create

### P0 — Required for working v1.0

| File | Target Path | Description |
|---|---|---|
| **package.json** | `package.json` | npm package. `name: "design-forge"`, `bin: { "design-forge": "bin/install.js" }`. No dependencies. |
| **LICENSE** | `LICENSE` | MIT |

### P1 — Required for useful v1.0

| File | Target Path | Description |
|---|---|---|
| **Agent: Researcher** | `runtimes/claude-code/agents/forge-researcher.md` | Personality + skill definition for research subagents. Reference `core/references/context-engine.md` for its context profile. |
| **Agent: System Architect** | `runtimes/claude-code/agents/forge-system-architect.md` | Agent for design system generation. |
| **Agent: Screen Composer** | `runtimes/claude-code/agents/forge-screen-composer.md` | Agent for screen composition. Must enforce token compliance. |
| **Agent: Design Reviewer** | `runtimes/claude-code/agents/forge-design-reviewer.md` | Agent for 4-lens design review. Must grep for violations. |
| **Agent: Fix Agent** | `runtimes/claude-code/agents/forge-fix-agent.md` | Agent for systematically fixing review findings. |
| **State Template** | `core/templates/STATE-TEMPLATE.md` | Initial STATE.md content. Format defined in `core/references/state-machine.md`. |
| **Summary Template** | `core/templates/SUMMARY-TEMPLATE.md` | Screen summary format. Structure defined in `core/workflows/compose-screen.md`. |
| **Token Showcase** | `core/templates/token-showcase.html` | Standalone HTML that displays all tokens visually. Self-contained, imports tokens.css + Google Fonts. |
| **Installer** | `bin/install.js` | Build from scratch. Runtime-detecting (`--runtime` flag or auto-detect). For v1.0 only Claude Code mapping needs to work. See `core/references/runtime-adapters.md` for install mapping per runtime. Must: detect runtime, copy core/ to `{runtime-config-dir}/get-design-forge/`, copy runtime commands to `{runtime-config-dir}/commands/forge/`, inject config snippet, backup before overwrite, verify post-install. |
| **Health Vertical** | `core/references/verticals/health.md` | Follow `core/references/verticals/fintech.md` structure exactly + `core/templates/VERTICAL-TEMPLATE.md` format. |
| **SaaS Vertical** | `core/references/verticals/saas.md` | Same format as fintech. |
| **E-commerce Vertical** | `core/references/verticals/ecommerce.md` | Same format as fintech. |
| **README** | `README.md` | Project README with: pitch, install command, command reference, architecture diagram, how it works, contributing. |

### P2 — Polish and expansion

| File | Target Path | Description |
|---|---|---|
| **Hook: Token Check** | `runtimes/claude-code/hooks/forge-token-check.js` | PostToolUse hook: flag hardcoded CSS values in .css/.tsx/.jsx/.vue/.html files. |
| **Hook: Font Check** | `runtimes/claude-code/hooks/forge-font-check.js` | PostToolUse hook: flag banned fonts (Inter, Roboto, etc — unless user-locked). |
| **Hook: A11y Check** | `runtimes/claude-code/hooks/forge-aria-check.js` | PostToolUse hook: flag div+onClick, img without alt, inputs without labels. |
| **Hook: Context Monitor** | `runtimes/claude-code/hooks/forge-context-monitor.js` | Statusline hook: display context %, warn at 50%. |
| **Contrast Checker** | `scripts/contrast-checker.js` | WCAG contrast ratio calculator. Node.js, no deps. |
| **Token Counter** | `scripts/token-counter.js` | Counts approximate tokens in .planning/design/ files. |
| **Social Vertical** | `core/references/verticals/social.md` | Same format as fintech. |
| **Education Vertical** | `core/references/verticals/education.md` | Same format as fintech. |
| **Marketplace Vertical** | `core/references/verticals/marketplace.md` | Same format as fintech. |
| **DevTools Vertical** | `core/references/verticals/devtools.md` | Same format as fintech. |
| **CHANGELOG** | `CHANGELOG.md` | Release tracking. |

---

## Technical Stack

- **Runtime:** Node.js (installer, hooks, scripts only)
- **Distribution:** npm
- **Core:** Markdown (references, workflows, templates, agents, commands)
- **Templates:** HTML (token showcase), Markdown (state, summary)
- **Hooks:** JavaScript (Claude Code hook format — runtime-specific)
- **Scripts:** JavaScript (Node.js, no dependencies)

No framework. No build step. No dependencies. Markdown files + JS utilities + an installer.

---

## Architecture Flow

```
User: /forge:compose dashboard
  │
  ▼
runtimes/claude-code/commands/forge/compose.md (thin, runtime-specific)
  → "Load core/workflows/compose-screen.md"
  │
  ▼
core/workflows/compose-screen.md (orchestrator, runtime-agnostic)
  1. Gate check: reads STATE.md
  2. Reads context-engine.md for file list
  3. Resolves {FORGE_ROOT} to .claude/get-design-forge
  │
  ▼
Task() subagent (runtime-specific spawning, fresh 200K context)
  Uses: runtimes/claude-code/agents/forge-screen-composer.md (personality)
  Reads: tokens.css, COMPONENT-SPECS.md, DESIGN-RESEARCH.md
  Creates: screen files + SUMMARY.md
  Commits: design(compose): implement dashboard
  │
  ▼
Orchestrator reads SUMMARY.md → updates STATE.md → suggests next command
```

**Key:** Commands are runtime-specific (thin). Workflows are shared (heavy). Agents are runtime-specific (spawn mechanism differs). References/templates are shared.

---

## File Organization When Installed (Claude Code)

```
project/
├── .claude/
│   ├── commands/forge/              # From runtimes/claude-code/commands/
│   │   ├── init.md
│   │   ├── research.md ... etc
│   │
│   ├── get-design-forge/            # From core/ + runtimes/claude-code/agents/
│   │   ├── references/
│   │   │   ├── state-machine.md
│   │   │   ├── context-engine.md
│   │   │   ├── design-inputs.md
│   │   │   └── verticals/*.md
│   │   ├── workflows/*.md
│   │   ├── templates/*.md + *.html
│   │   ├── agents/*.md
│   │   ├── hooks/*.js
│   │   └── scripts/*.js
│   │
│   └── CLAUDE.md                    # Design Forge rules appended
│
├── .planning/design/                # Generated during workflow (same for all runtimes)
```

---

## What Success Looks Like

1. `npx design-forge@latest` detects Claude Code and installs cleanly
2. `npx design-forge@latest --runtime claude-code` works explicitly
3. Full workflow: init → research → system → compose → review → fix
4. Two fintech projects produce visibly different designs (differentiation seed works)
5. Brand colors flow through without being overridden
6. Fresh context per screen — quality doesn't degrade on screen 5
7. Adding OpenCode support later = create `runtimes/opencode/` files only, zero core changes

---

## Constraints & Preferences

- **No external dependencies.** Pure Node.js for installer/hooks/scripts.
- **Markdown-first.** All design intelligence, commands, workflows, agents are .md files.
- **Framework-agnostic tokens.** CSS custom properties. Tailwind export is a separate future command.
- **Context discipline.** Follow context-engine.md strictly. Orchestrators pass paths, not contents.
- **Git atomic commits.** Every agent commits with `design(...)` prefix.
- **Coexist with GSD.** Uses `.planning/design/`, never touches `.planning/phases/`.
- **Core/runtime separation.** NEVER put runtime-specific logic in core/ files. NEVER put shared design knowledge in runtimes/ files.

---

## Phase Suggestions for GSD

### Phase 1: Agents + Templates (make it functional)
- 5 Claude Code agent definitions in `runtimes/claude-code/agents/`
- 3 templates in `core/templates/` (STATE, SUMMARY, token-showcase.html)
- Verify agents are wired into existing workflows

### Phase 2: Installer + Distribution (make it installable)
- `bin/install.js` with runtime detection + Claude Code mapping
- `package.json`
- `README.md`
- `LICENSE`
- Test: `npx design-forge@latest` in a fresh project

### Phase 3: Vertical Expansion (make it smart)
- `core/references/verticals/health.md` (follow fintech.md exactly)
- `core/references/verticals/saas.md`
- `core/references/verticals/ecommerce.md`

### Phase 4: Hooks + Scripts (make it enforced)
- 4 hooks in `runtimes/claude-code/hooks/`
- 2 scripts in `scripts/`
- `CHANGELOG.md`

### Phase 5: End-to-End Test (make it proven)
- Run full workflow on CryptoPay (fintech vertical)
- Fix broken orchestration
- Verify differentiation produces distinct outputs
- Verify fresh context works correctly

---

## Key Reference Files for GSD Executors

| Building This | Read This First |
|---|---|
| Any agent file | `core/references/context-engine.md` (context profiles per agent type) |
| Any vertical file | `core/references/verticals/fintech.md` (model) + `core/templates/VERTICAL-TEMPLATE.md` (format) |
| The installer | `core/references/runtime-adapters.md` (install mapping per runtime) + `runtimes/claude-code/CLAUDE-MD-SNIPPET.md` (injection content) |
| Any hook | Claude Code hooks docs (web search for current format) |
| Token showcase | `core/workflows/generate-system.md` (defines what showcase displays) |
| STATE template | `core/references/state-machine.md` (defines STATE.md format) |
| SUMMARY template | `core/workflows/compose-screen.md` (defines summary content) |

---

## What NOT to Change

These files are **design-complete**. GSD executors should NOT modify them (unless a bug is found during Phase 5 testing):

**Core references:**
- `core/references/state-machine.md`
- `core/references/context-engine.md`
- `core/references/design-inputs.md`
- `core/references/runtime-adapters.md`
- `core/references/verticals/fintech.md`
- `core/templates/VERTICAL-TEMPLATE.md`

**Core workflows:**
- `core/workflows/research.md`
- `core/workflows/generate-system.md`
- `core/workflows/compose-screen.md`
- `core/workflows/review.md`
- `core/workflows/fix.md`
- `core/workflows/evolve.md`
- `core/workflows/quick.md`

**Claude Code runtime (built files):**
- `runtimes/claude-code/commands/forge/*.md` (all 10)
- `runtimes/claude-code/CLAUDE-MD-SNIPPET.md`
