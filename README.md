# Motif

> Domain-intelligent design system for AI coding assistants

AI coding tools produce generic, domain-inappropriate UI -- a fintech dashboard that looks like a meditation app, a health portal with e-commerce patterns. Motif fixes this by injecting domain intelligence from vertical databases (fintech, health, SaaS, e-commerce) and composing each screen with a fresh agent context window, so screen 10 is as sharp as screen 1.

## Quick Start

```bash
npx motif@latest
```

This auto-detects your AI runtime (Claude Code for v1), installs design intelligence into your project, and sets up slash commands. Start designing with `/motif:init`.

## Commands

### Core Workflow (run in order)

| Command | What it does |
|---------|-------------|
| `/motif:init` | Interview, vertical detection, design brief |
| `/motif:research` | 4-agent parallel research, locked design decisions |
| `/motif:system` | Generate tokens + component specs + visual showcase |
| `/motif:compose [screen]` | Build screen with fresh agent context |
| `/motif:review [screen\|all]` | 4-lens heuristic evaluation, scored /100 |
| `/motif:fix [screen]` | Fix review findings systematically |

### Iteration

| Command | What it does |
|---------|-------------|
| `/motif:evolve` | Update design system based on learnings |
| `/motif:quick [desc]` | Ad-hoc task with design system consistency |

### Navigation

| Command | What it does |
|---------|-------------|
| `/motif:progress` | Current status + next steps |
| `/motif:help` | Command reference |

## How It Works

Three things make Motif different from generic UI generation:

**Domain intelligence.** Vertical databases contain domain-specific color palettes, typography scales, component patterns, layout conventions, and anti-patterns. When you tell Motif you are building a fintech app, every design decision draws from established fintech patterns -- not random defaults.

**Fresh context per screen.** Each screen is composed by a fresh subagent with a full 200K token context window loaded with your design system, research decisions, and domain knowledge. There is no context degradation over time. The tenth screen gets the same quality as the first.

**Design system enforcement.** Hooks run during composition to catch hardcoded color values, banned fonts, spacing violations, and accessibility issues before they ship. The design system is not advisory -- it is enforced.

## Architecture

```
User runs /motif:compose login
         |
         v
  Runtime Adapter (Claude Code)
  thin command file -> loads core workflow
         |
         v
  Core Workflow (compose-screen.md)
  orchestrator reads design system, spawns fresh subagent
         |
         v
  Fresh Subagent (200K context)
  loads tokens.css + COMPONENT-SPECS.md + vertical DB
  builds screen -> commits atomically
```

Motif uses a **core + adapters** architecture:

- **Core** (`core/`) -- shared workflows, references, templates, vertical databases. Runtime-agnostic.
- **Runtimes** (`runtimes/`) -- thin adapters per AI tool. v1 ships Claude Code; others follow with zero core changes.

Installed file layout (Claude Code):

```
.claude/commands/motif/     Slash commands (/motif:init, etc.)
.claude/get-motif/          Core: workflows, references, templates, agents
.planning/design/           Generated design artifacts (tokens, specs, screens)
```

## Requirements

- Node.js >= 22.0.0
- Claude Code (v1.0 -- more runtimes coming)

## License

[MIT](LICENSE)
