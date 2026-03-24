# Motif

> Domain-intelligent design system for AI coding assistants

AI coding tools produce generic, domain-inappropriate UI -- a fintech dashboard that looks like a meditation app, a health portal with e-commerce patterns. Motif fixes this by injecting domain intelligence from vertical databases (fintech, health, SaaS, e-commerce, social, education, marketplace, devtools) and composing each screen with a fresh agent context window, so screen 10 is as sharp as screen 1.

## Quick Start

```bash
npx motif-design@latest
```

This auto-detects your AI runtime (Claude Code for v1), installs design intelligence into your project, and sets up slash commands. Then run `/motif:init` to start designing.

## Commands

### Core Workflow (run in order)

| Command | What it does |
|---------|-------------|
| `/motif:init` | Interview, vertical detection, design brief, framework scaffolding |
| `/motif:research` | 4-agent parallel research, locked design decisions |
| `/motif:system` | Generate tokens + component specs + icon catalog + visual showcase |
| `/motif:compose [screen]` | Build screen with fresh agent context |
| `/motif:compose [s1] [s2] [s3]` | Batch compose multiple screens in parallel waves |
| `/motif:compose --all` | Compose all pending screens (resumes after `/clear`) |
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

Five things make Motif different from generic UI generation:

**Domain intelligence.** 8 vertical databases contain domain-specific color palettes, typography scales, component patterns, layout conventions, and anti-patterns. When you tell Motif you are building a fintech app, every design decision draws from established fintech patterns -- not random defaults.

**Fresh context per screen.** Each screen is composed by a fresh subagent with a full 200K token context window loaded with your design system, research decisions, and domain knowledge. There is no context degradation over time. The tenth screen gets the same quality as the first.

**Batch composition.** Compose multiple screens in parallel with wave-based dispatch. Foundational screens (layout, navigation) are automatically ordered first so feature screens can reference their established patterns. If interrupted, `/motif:compose --all` resumes from where it left off -- already-composed screens are skipped.

**Icon library integration.** The system architect selects icons from curated libraries (Phosphor, Lucide, Material Symbols, Tabler) based on your domain vertical, generates an `ICON-CATALOG.md` with CDN links and usage syntax, and the composer consumes it -- so every screen uses real, consistent icons instead of placeholder text or hallucinated class names.

**Design system enforcement.** Hooks and validators run during composition to catch hardcoded color values, banned fonts, spacing violations, import cycles, naming conflicts, and accessibility issues before they ship. Automatic design review runs after batch composition, and auto-run is gated on review pass.

## Architecture

```
User runs /motif:compose login dashboard settings
         |
         v
  Runtime Adapter (Claude Code)
  thin command file -> loads core workflow
         |
         v
  Core Workflow (compose-screen.md)
  orchestrator classifies screens, builds wave plan
         |
         v
  Wave 1: Foundational screens (layout, nav)
  Wave 2: Feature screens (with foundation summaries)
         |  (parallel within each wave, sequential across waves)
         v
  Fresh Subagent per screen (200K context)
  loads tokens.css + COMPONENT-SPECS.md + ICON-CATALOG.md + vertical DB
  builds screen -> validates -> orchestrator commits atomically
         |
         v
  Auto-review across all screens -> gated auto-run
```

Motif uses a **core + adapters** architecture:

- **Core** (`core/`) -- shared workflows, references, templates, vertical databases. Runtime-agnostic.
- **Runtimes** (`runtimes/`) -- thin adapters per AI tool. v1 ships Claude Code; others follow with zero core changes.
- **Scripts** (`scripts/`) -- validation and analysis tools (compose-validator, token-extractor, gap-analyzer, contrast-checker).

Installed file layout (Claude Code):

```
.claude/commands/motif/     Slash commands (/motif:init, etc.)
.claude/get-motif/          Core: workflows, references, templates, agents
.planning/design/           Generated design artifacts (tokens, specs, screens)
```

## Verticals

Motif ships with domain intelligence for 8 verticals:

| Vertical | File |
|----------|------|
| Fintech | `core/references/verticals/fintech.md` |
| Health | `core/references/verticals/health.md` |
| SaaS | `core/references/verticals/saas.md` |
| E-commerce | `core/references/verticals/ecommerce.md` |
| Social | `core/references/verticals/social.md` |
| Education | `core/references/verticals/education.md` |
| Marketplace | `core/references/verticals/marketplace.md` |
| DevTools | `core/references/verticals/devtools.md` |

Each vertical contains color palettes, typography guidance, component patterns, layout conventions, icon recommendations, and anti-patterns specific to that domain. New verticals can be added using `core/templates/VERTICAL-TEMPLATE.md`.

## Platforms

Motif auto-detects your project framework and adapts composition output:

| Platform | Scaffolding | Output |
|----------|-------------|--------|
| Next.js | `create-next-app` with App Router | JSX + Tailwind + shadcn/ui |
| Vite/React | `create-vite` React template | JSX + CSS modules |
| Expo/React Native | `create-expo-app` | React Native Views + StyleSheet |
| Static HTML | Minimal structure | HTML + CSS custom properties |
| Brownfield | Auto-detected from package.json | Adapts to existing framework |

## Requirements

- Node.js >= 22.0.0
- Claude Code (v1.0 -- more runtimes coming)

## Contributing

Contributions are welcome. Here's how to get started.

### Setup

```bash
git clone https://github.com/Austine3000/motif.git
cd motif
npm install
```

### Project Structure

```
bin/              Installer (npx entry point)
core/             Runtime-agnostic workflows, references, templates, verticals
runtimes/         Runtime-specific adapters (claude-code for v1)
scripts/          Validation and analysis tools
test/             E2E and validation tests
```

### Running Tests

```bash
# Run the full validation suite against a test project
bash test/validation/run-all-validations.sh --controlled /path/to/test-project

# Run the compose validator on a screen
node scripts/compose-validator.js --screen login --files src/login.html
```

### Adding a Vertical

1. Copy `core/templates/VERTICAL-TEMPLATE.md` to `core/references/verticals/<name>.md`
2. Fill in domain-specific palettes, typography, component patterns, and anti-patterns
3. Add the vertical to the installer's detection logic in `bin/install.js`

### Adding a Runtime Adapter

1. Create a new directory under `runtimes/<runtime-name>/`
2. Implement thin command files that load core workflows
3. Document the adapter in `core/references/runtime-adapters.md`

### Commit Convention

This project uses scoped prefixes:

```
feat(scope):     New feature
fix(scope):      Bug fix
docs(scope):     Documentation
chore(scope):    Maintenance
design(scope):   Design system work (init, research, system, compose, review, fix, evolve, quick)
```

### Pull Requests

1. Fork the repo and create a branch from `main`
2. Make your changes with clear, atomic commits
3. Ensure validation passes on any modified workflows or templates
4. Open a PR with a summary of what changed and why

## License

[MIT](LICENSE)
