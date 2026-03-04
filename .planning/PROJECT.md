# Motif

## What This Is

Motif is an npm-installable design engineering system for AI coding assistants. It researches your product vertical's design patterns, generates a domain-intelligent design system (tokens, component specs), composes screens with fresh agent contexts, and reviews everything against heuristics. It ships as `npx motif@latest`, auto-detects your AI runtime, and installs accordingly. v1.0 targets Claude Code; other runtimes (OpenCode, Cursor, Gemini CLI) follow via the core/runtime adapter architecture.

**Audience:** Solo developers, founders, and indie hackers using AI coding tools who want their UI to look intentional — not like generic AI slop.

## Core Value

Domain-intelligent design delivered through fresh context — a fintech app must look like fintech, not meditation, and screen 5 must be as good as screen 1. Without domain intelligence it's just another UI generator; without fresh context per screen, quality degrades. Both are non-negotiable.

## Current Milestone: v1.1 Icon Library Integration

**Goal:** Integrate established icon libraries into Motif's design system pipeline so composed screens use real, domain-appropriate icons instead of placeholders.

**Target features:**
- Curated icon library reference (3-5 vetted libraries with domain affinity mapping)
- System architect agent selects best-fit icon library during design system generation
- Icon size tokens (`--icon-size-*`) added to tokens.css
- CDN reference in token showcase for icon previews
- Component specs reference actual icon names from selected library
- Composed screens use concrete icon names from the selected library

## Requirements

### Validated

- ✓ Full rebrand from "Design Forge" to "Motif" — v1.0
- ✓ 5 Claude Code agent definitions — v1.0
- ✓ 3 core templates — v1.0
- ✓ Runtime-detecting installer — v1.0
- ✓ npm package (motif-design) — v1.0
- ✓ MIT LICENSE — v1.0
- ✓ 4 verticals (fintech, health, SaaS, e-commerce) — v1.0
- ✓ 4 Claude Code hooks — v1.0
- ✓ 2 utility scripts — v1.0
- ✓ README — v1.0
- ✓ GitHub Actions CI — v1.0
- ✓ E2e validation + battle test — v1.0
- ✓ Differentiation seed + brand color flow-through — v1.0

### Active

- [ ] Curated icon library reference doc (3-5 vetted libraries)
- [ ] System architect selects icon library during design system generation
- [ ] Icon size tokens in tokens.css
- [ ] CDN reference in token showcase for selected icon library
- [ ] Component specs use actual icon names from selected library
- [ ] Composed screens render concrete icon names from selected library

### Out of Scope

- OpenCode runtime support — v1.1 focused on icons; runtime expansion is v1.2+
- Cursor/Windsurf runtime support — v1.2+, same arch
- Gemini CLI runtime support — v1.3+, same arch
- Tailwind token export — future command, CSS custom properties only
- Social/Education/Marketplace/DevTools verticals — v2 expansion
- CHANGELOG.md — defer to post-v1 release cycle
- Custom icon creation/generation — use established libraries only
- Icon font bundling — CDN-first, user handles build integration

## Context

**What already exists (~90% of the design intelligence):**
- 7 core reference docs (state machine, context engine, design inputs, runtime adapters, fintech vertical, vertical template, build spec)
- 7 core workflows (research, generate-system, compose-screen, review, fix, evolve, quick)
- 10 Claude Code slash commands (thin routing files)
- Claude Code config snippet (CLAUDE-MD-SNIPPET.md)

**Architecture:** Core (shared, runtime-agnostic) + Runtimes (thin adapters). Workflows use `{FORGE_ROOT}` path variable — resolves per runtime. Adding a new runtime = create `runtimes/{name}/` directory, zero core changes.

**Architecture flow:** User command → runtime command (thin) → core workflow (orchestrator) → Task() subagent with fresh 200K context → reads tokens/specs/research → creates output → commits atomically.

**Installed file layout (Claude Code):**
- `.claude/commands/motif/` — slash commands
- `.claude/get-motif/` — core references, workflows, templates, agents, hooks, scripts
- `.planning/design/` — generated design artifacts (coexists with GSD's `.planning/phases/`)

**Key reference files for building:**
- Agents → read `core/references/context-engine.md` for context profiles
- Verticals → read `core/references/verticals/fintech.md` (model) + `core/templates/VERTICAL-TEMPLATE.md` (format)
- Installer → read `core/references/runtime-adapters.md` + `runtimes/claude-code/CLAUDE-MD-SNIPPET.md`
- Hooks → web search Claude Code hooks format
- Token showcase → read `core/workflows/generate-system.md`
- STATE template → read `core/references/state-machine.md`
- SUMMARY template → read `core/workflows/compose-screen.md`

**Do NOT modify existing files** (design-complete unless bugs found during testing):
- All `core/references/*.md`, `core/workflows/*.md`, `core/templates/VERTICAL-TEMPLATE.md`
- All `runtimes/claude-code/commands/forge/*.md`, `runtimes/claude-code/CLAUDE-MD-SNIPPET.md`

**Note:** Existing command files are under `commands/forge/`. The rebrand to Motif means these become `commands/motif/` in the installed location. The rename applies to new files and the installer's copy mapping.

## Constraints

- **No dependencies**: Pure Node.js for installer, hooks, scripts. Zero npm dependencies.
- **Markdown-first**: All design intelligence, commands, workflows, agents are .md files.
- **Framework-agnostic tokens**: CSS custom properties only. No Tailwind, no CSS-in-JS.
- **Context discipline**: Follow context-engine.md strictly. Orchestrators pass paths, not contents.
- **Git atomic commits**: Every agent commits with `design(...)` prefix.
- **Coexist with GSD**: Uses `.planning/design/`, never touches `.planning/phases/`.
- **Core/runtime separation**: Never put runtime-specific logic in `core/`. Never put shared design knowledge in `runtimes/`.
- **v1.0 Claude Code only**: Codebase structured for multi-runtime, but only Claude Code adapter ships in v1.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Rebrand to "Motif" | Better name — evokes design patterns, visual motifs, intentionality | — Pending |
| Full rebrand scope | Package, commands, install dirs, all references. Clean break. | — Pending |
| Hooks required before battle test | Without enforcement, agents hardcode values defeating the purpose | — Pending |
| All 3 additional verticals in v1 | "Any vertical" is the pitch — one vertical doesn't prove generalizability | — Pending |
| CI/publish automation | GitHub Actions on tag/release for npm publishing | — Pending |
| Battle test = test project + real project | Controlled test catches setup issues, real project catches workflow issues | — Pending |
| v1 Claude Code only | Focus. Other runtimes are just adding a directory later. | — Pending |

---
*Last updated: 2026-03-04 after milestone v1.1 initialization*
