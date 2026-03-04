# Motif

## What This Is

Motif is an npm-installable design engineering system for AI coding assistants. It researches your product vertical's design patterns, generates a domain-intelligent design system (tokens, component specs, icon catalog), composes screens with fresh agent contexts, and reviews everything against heuristics and accessibility standards. It ships as `npx motif-design@latest`, auto-detects your AI runtime, and installs accordingly. v1.0-v1.1 targets Claude Code; other runtimes (OpenCode, Cursor, Gemini CLI) follow via the core/runtime adapter architecture.

**Audience:** Solo developers, founders, and indie hackers using AI coding tools who want their UI to look intentional — not like generic AI slop.

## Core Value

Domain-intelligent design delivered through fresh context — a fintech app must look like fintech, not meditation, and screen 5 must be as good as screen 1. Without domain intelligence it's just another UI generator; without fresh context per screen, quality degrades. Both are non-negotiable.

## Current State

**Shipped:** v1.1 (2026-03-04)
**Published:** motif-design@0.1.0 on npm

Two milestones delivered:
- **v1.0 Core Design System** — Full pipeline (research → system → compose → review → fix), 4 verticals, installer, hooks, CI/CD, npm publishing
- **v1.1 Icon Library Integration** — 4 curated icon libraries, per-vertical vocabularies, ICON-CATALOG.md generation, composer anti-slop enforcement, reviewer icon checks, aria-check icon detection

**Stats:** 12 phases, 32 plans executed across 2 milestones

## Requirements

### Validated

- ✓ 5 Claude Code agent definitions — v1.0
- ✓ 3 core templates — v1.0
- ✓ Runtime-detecting installer with manifest-based upgrades — v1.0
- ✓ npm package (motif-design) with MIT LICENSE and README — v1.0
- ✓ Full rebrand from "Design Forge" to "Motif" — v1.0
- ✓ 4 verticals (fintech, health, SaaS, e-commerce) — v1.0
- ✓ 4 compliance hooks + 2 utility scripts — v1.0
- ✓ GitHub Actions CI for automated npm publish — v1.0
- ✓ E2e validation + CryptoPay battle test — v1.0
- ✓ Differentiation seed + brand color flow-through — v1.0
- ✓ Curated icon library reference (4 libraries) — v1.1
- ✓ Deterministic icon selection algorithm — v1.1
- ✓ Icon size tokens (8px-multiple scale) — v1.1
- ✓ Per-vertical icon vocabularies (22-23 validated icons each) — v1.1
- ✓ ICON-CATALOG.md generation in design system pipeline — v1.1
- ✓ Composer icon anti-slop enforcement — v1.1
- ✓ Reviewer icon catalog compliance + vertical appropriateness checks — v1.1
- ✓ aria-check hook icon element detection — v1.1

### Active

(None — next milestone not yet defined)

### Out of Scope

- OpenCode/Cursor/Gemini CLI runtime support — v1.2+, same core/runtime arch
- Tailwind token export — future command, CSS custom properties only
- Additional verticals (Social, Education, Marketplace, DevTools) — v2
- Advanced icon features (dark mode weight, duotone colors, variable fonts, icon search) — v1.2+
- CHANGELOG.md — defer to post-v1 release cycle
- Custom icon creation/generation — use established libraries only
- Icon font bundling — CDN-first, user handles build integration

## Context

**Architecture:** Core (shared, runtime-agnostic) + Runtimes (thin adapters). Workflows use `{FORGE_ROOT}` path variable — resolves per runtime.

**Architecture flow:** User command → runtime command (thin) → core workflow (orchestrator) → Task() subagent with fresh 200K context → reads tokens/specs/research/icon-catalog → creates output → commits atomically.

**Installed file layout (Claude Code):**
- `.claude/commands/motif/` — slash commands
- `.claude/get-motif/` — core references, workflows, templates, agents, hooks, scripts
- `.planning/design/` — generated design artifacts

**Codebase:** ~10K LOC across 54 files modified in v1.1, pure Node.js installer, markdown-first design intelligence.

## Constraints

- **No dependencies**: Pure Node.js for installer, hooks, scripts. Zero npm dependencies.
- **Markdown-first**: All design intelligence, commands, workflows, agents are .md files.
- **Framework-agnostic tokens**: CSS custom properties only. No Tailwind, no CSS-in-JS.
- **Context discipline**: Follow context-engine.md strictly. Orchestrators pass paths, not contents.
- **Git atomic commits**: Every agent commits with `design(...)` prefix.
- **Coexist with GSD**: Uses `.planning/design/`, never touches `.planning/phases/`.
- **Core/runtime separation**: Never put runtime-specific logic in `core/`. Never put shared design knowledge in `runtimes/`.
- **CDN version pinning**: Icon library CDN URLs must be version-pinned, never `@latest`.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Rebrand to "Motif" | Better name — evokes design patterns, visual motifs, intentionality | ✓ Good |
| Full rebrand scope | Package, commands, install dirs, all references. Clean break. | ✓ Good |
| Hooks required before battle test | Without enforcement, agents hardcode values defeating the purpose | ✓ Good |
| All 3 additional verticals in v1 | "Any vertical" is the pitch — one vertical doesn't prove generalizability | ✓ Good |
| CI/publish automation | GitHub Actions on tag/release for npm publishing | ✓ Good |
| Battle test = test project + real project | Controlled test catches setup issues, real project catches workflow issues | ✓ Good |
| v1 Claude Code only | Focus. Other runtimes are just adding a directory later. | ✓ Good |
| 4 curated icon libraries | Phosphor, Lucide, Material Symbols, Tabler — covers all verticals | ✓ Good |
| Deterministic icon selection | vertical + personality → library + weight, no agent guesswork | ✓ Good |
| ICON-CATALOG.md required | Mandatory for composition, not optional — prevents hallucination | ✓ Good |
| CSS class + CDN delivery | Inline SVG is anti-pattern for agents; CDN is zero-config | ✓ Good |
| Icon size as system invariant | Fixed 8px-multiple scale, not project-adjustable | ✓ Good |

---
*Last updated: 2026-03-04 after v1.1 milestone completion*
