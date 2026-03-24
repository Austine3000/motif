# Motif

## What This Is

Motif is an npm-installable design engineering system for AI coding assistants. It researches your product vertical's design patterns, generates a domain-intelligent design system (tokens, component specs, icon catalog), composes screens with fresh agent contexts, and reviews everything against heuristics and accessibility standards. It ships as `npx motif-design@latest`, auto-detects your AI runtime, and installs accordingly. v1.0-v1.1 targets Claude Code; other runtimes (OpenCode, Cursor, Gemini CLI) follow via the core/runtime adapter architecture.

**Audience:** Solo developers, founders, and indie hackers using AI coding tools who want their UI to look intentional — not like generic AI slop.

## Core Value

Domain-intelligent design delivered through fresh context — a fintech app must look like fintech, not meditation, and screen 5 must be as good as screen 1. Without domain intelligence it's just another UI generator; without fresh context per screen, quality degrades. Both are non-negotiable.

## Current State

**Shipped:** v1.4 (2026-03-24)
**Published:** motif-design@0.2.3 on npm

Five milestones delivered:
- **v1.0 Core Design System** — Full pipeline (research → system → compose → review → fix), 4 verticals, installer, hooks, CI/CD, npm publishing
- **v1.1 Icon Library Integration** — 4 curated icon libraries, per-vertical vocabularies, ICON-CATALOG.md generation, composer anti-slop enforcement, reviewer icon checks, aria-check icon detection
- **v1.2 Brownfield Intelligence** — Project scanning, token extraction, brownfield compose/review integration
- **v1.3 Global Reach** — Context resilience (SessionStart hooks, 3-layer defense), 4 new verticals (8 total), global CLI (init/status/update/doctor/list), package source sync
- **v1.4 Cross-Platform App Builder** — Smart framework scaffolding (Next.js, Vite, Expo, static HTML), platform-aware composition, cross-platform token bridge, auto-run with PID cleanup

**Stats:** 28 phases, 58 plans executed across 5 milestones

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
- ✓ Brownfield project scanning and token extraction — v1.2
- ✓ Brownfield compose/review integration — v1.2
- ✓ Context resilience (SessionStart hooks, 3-layer defense, state recovery) — v1.3
- ✓ 8 verticals (fintech, health, SaaS, e-commerce, social, education, marketplace, devtools) — v1.3
- ✓ Global CLI (motif init/status/update/doctor/list) — v1.3
- ✓ Package source sync with E2E verification — v1.3
- ✓ Smart framework scaffolding (Next.js, Vite/React, Expo, static HTML) — v1.4
- ✓ Platform-aware composition (JSX, React Native Views/StyleSheet) — v1.4
- ✓ Cross-platform token bridge (CSS vars, TypeScript, React Native StyleSheet) — v1.4
- ✓ Auto-run with PID tracking and cleanup — v1.4

### Active

**Current Milestone: v1.5 Batch Compose**

**Goal:** Compose multiple screens in a single command with parallel execution and automatic review — eliminating the tedium of running `/motif:compose` once per screen.

**Target features:**
- Batch compose by name: `/motif:compose login dashboard settings` composes listed screens in parallel
- Batch compose all pending: `/motif:compose --all` composes every screen defined in STATE.md that hasn't been composed yet
- Progress tracking as screens complete (wave-style reporting)
- Automatic `/motif:review` across all composed screens after the batch finishes

### Out of Scope

- OpenCode/Cursor/Gemini CLI runtime support — v1.5+, same core/runtime arch
- Desktop apps (Electron/Tauri) — v1.5+
- Tailwind token export — future, CSS custom properties primary
- Advanced icon features (dark mode weight, duotone colors, variable fonts, icon search) — future
- CHANGELOG.md — defer to post-v1 release cycle
- Custom icon creation/generation — use established libraries only
- Backend/API scaffolding — Motif is frontend/UI only
- State management setup (Redux, Zustand, etc.) — user choice, not Motif's domain

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
- **Platform-adaptive tokens**: CSS custom properties for web, StyleSheet constants for React Native. Same design values, platform-native delivery.
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

| v1.4 cross-platform scope | Web (Next.js, Vite/React, static HTML) + Mobile (React Native/Expo). Desktop deferred. | ✓ Good |
| v1.5 batch compose scope | Parallel multi-screen composition + auto-review. No architecture changes to per-screen agents. | — Pending |

---
*Last updated: 2026-03-24 after v1.5 milestone start*
