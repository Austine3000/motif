# Project Research Summary

**Project:** Design Forge (rebranding to Motif)
**Domain:** npm-distributed CLI installer for an AI design engineering system
**Researched:** 2026-03-01
**Confidence:** HIGH

## Executive Summary

Design Forge (Motif) is a markdown-first design intelligence system distributed via npm that installs into AI coding assistant config directories. It is not a traditional Node.js application -- the JavaScript footprint is a thin installer (`bin/install.js`) and a handful of PostToolUse hook scripts. The core value (90%+) lives in markdown files: workflow orchestrations, domain-specific vertical intelligence databases, agent personality definitions, and design reference material. Experts build tools like this using the `npx` CLI pattern (proven by shadcn/ui, create-react-app), zero npm dependencies, Node.js 22+ stdlib APIs (`fs.cpSync`, `util.parseArgs`, `util.styleText`), and a core/adapter architecture that separates runtime-agnostic design intelligence from runtime-specific integration layers.

The recommended approach is to build in dependency order: first complete the missing agent definitions and templates (the content that makes workflows functional), then build the installer and distribution layer (the mechanism that delivers content to users), then expand vertical coverage and enforcement hooks (breadth and polish). The core design intelligence content and Claude Code command files are already built. The critical gap is the five agent definitions that subagent-spawned workflows depend on -- without these, no workflow step can execute beyond the main orchestrator context. The installer is the second priority because it is the delivery mechanism for everything else.

The primary risks are context budget exhaustion in the orchestrator (degrading quality on screen 4-5 of multi-screen projects), installer overwrites destroying user customizations on re-install, and unresolved `{FORGE_ROOT}` path variables causing silent failures where agents hallucinate instead of loading curated vertical intelligence. All three are preventable with disciplined implementation: agent definitions must encode explicit context-loading profiles, the installer must use manifest-based diffing with backup-before-overwrite, and post-install verification must confirm zero unresolved path variables.

## Key Findings

### Recommended Stack

Design Forge has a zero-dependency constraint. The Node.js 22+ standard library IS the stack. CommonJS module format, synchronous `fs` APIs for file copying, `util.parseArgs` for CLI flags, and `util.styleText` for terminal output. No build step, no transpilation, no test framework for v1. The package.json `bin` field maps the `design-forge` command to `bin/install.js`, and the `files` field whitelists only `bin/`, `core/`, `runtimes/`, and `scripts/`.

**Core technologies:**
- **Node.js >=22.0.0:** Runtime floor set by `util.styleText` stability (v22.13.0). All other APIs available since Node 18+.
- **CommonJS (`require`):** Default module format, no configuration needed, no `import.meta` workarounds. Each JS file is self-contained.
- **`fs.cpSync` (recursive):** Single-call recursive directory copy replacing `fs-extra`. Copies entire `core/` and `runtimes/` trees.
- **`util.parseArgs`:** Built-in CLI argument parser for `--runtime`, `--force`, `--dry-run`, `--help` flags. Replaces `commander`/`yargs`.
- **`util.styleText`:** Built-in ANSI color output respecting `NO_COLOR` env var. Replaces `chalk`.
- **Claude Code PostToolUse hooks:** JSON stdin, stdout response, matcher patterns for Write/Edit operations. Enforcement during composition.

### Expected Features

**Must have (table stakes):**
- One-command install via `npx design-forge@latest` with auto-runtime detection
- Working end-to-end workflow (init -> research -> system -> compose -> review -> fix)
- Design token output as CSS custom properties with reasoning comments
- Component specifications in XML format for AI agent consumption
- Idempotent operations (re-running any command does not corrupt state)
- package.json with correct `bin` field, LICENSE, README
- Atomic git commits per operation with `design(...)` prefix

**Should have (differentiators -- these ARE the product):**
- Vertical/domain intelligence databases (fintech built, health/SaaS/e-commerce planned)
- Differentiation seed system (personality, temperature, formality, density, era scales)
- Fresh 200K-token context per screen via subagent spawning (anti-degradation)
- 4-lens design review with domain-aware scoring (/100)
- PostToolUse enforcement hooks (token compliance, font check, a11y check, context monitor)
- Brand color lock-in with scale generation and contrast-safe surface adjustment
- Visual token showcase HTML (self-contained, the "wow moment")
- State machine with file-based persistence surviving `/clear` commands

**Defer (v2+):**
- Multi-runtime support (OpenCode v1.1, Cursor v1.2, Gemini v1.3)
- Tailwind token export
- Component library / pre-built UI components
- Runtime UI / visual editor
- Real-time collaboration
- W3C DTCG token format export
- Figma MCP integration

### Architecture Approach

The architecture follows a core/adapter separation pattern. All design intelligence, workflow orchestration, and templates live in `core/` (runtime-agnostic, shared). Each AI coding runtime gets a thin adapter in `runtimes/{name}/` containing only commands (4-7 line routing files pointing to core workflows), agent personality definitions, hooks (JS), and a config snippet. The installer detects the runtime, resolves source-to-target path mappings, copies files, injects a config snippet into CLAUDE.md, writes a manifest for upgrade tracking, and runs post-install verification.

**Major components:**
1. **bin/install.js** -- Entry point. Detects runtime, orchestrates copy/inject/verify pipeline. ~200-300 lines, zero dependencies.
2. **core/** -- Design intelligence, workflows, templates, vertical databases. 90% of product value. Pure markdown, read by AI agents at runtime.
3. **runtimes/claude-code/** -- Thin adapter: 10 commands (routing files), 5 agent definitions, 4 hooks (JS), 1 config snippet. Translation layer for Claude Code-specific spawning and enforcement.
4. **scripts/** -- Standalone utilities (contrast checker, token counter). Invoked by agents during workflows.
5. **.design-forge-manifest.json** -- Install tracking for idempotent upgrades. Records version, runtime, file hashes.

### Critical Pitfalls

1. **Installer overwrites user files without backup** -- Use sentinel markers (`<!-- DESIGN-FORGE-START/END -->`) for config injection idempotency. Use manifest-based content-hash diffing on upgrade to detect and back up user-modified files before overwriting. This is a data-loss prevention mechanism, not polish.

2. **Context budget exhaustion in orchestrator** -- Agent definitions must encode explicit context-loading profiles (which files to read, which to NEVER read). Orchestrator reads only SUMMARY.md from subagents (max 500 tokens). Include context check after each subagent cycle. This is the #1 quality failure mode for multi-screen projects.

3. **`{FORGE_ROOT}` path variables left unresolved** -- Do not ship `{FORGE_ROOT}` in installed files. Resolve all paths at install time. Run post-install verification that greps for unresolved variables. Unresolved paths cause silent failures where agents hallucinate instead of loading curated intelligence.

4. **Subagent spawning burns token budget rapidly** -- 4 parallel research agents consume 80-120K tokens in one command. Document costs per command. Default to sequential execution. Consider `model: haiku` for research agents. Commit partial results before failure to enable partial retry.

5. **Core/runtime boundary violation** -- Design intelligence leaks into runtime files, causing inferior output for future runtimes. Enforce bright-line rule: if it contains "color," "font," "spacing," or "vertical," it belongs in `core/`. Runtime files should never exceed 50 lines.

## Implications for Roadmap

Based on research, the build order follows clear dependency layers identified in the architecture research. Six phases are suggested.

### Phase 1: Agent Definitions and Templates

**Rationale:** Agents are the critical gap between "designed" and "functional." Every workflow step spawns subagents. Without agent definitions, workflows are inert. Templates formalize output formats that agents produce. These are Layer 1+2 in the architecture dependency graph.
**Delivers:** 5 Claude Code agent personality definitions (researcher, system-architect, screen-composer, design-reviewer, fix-agent), 3 core templates (STATE-TEMPLATE.md, SUMMARY-TEMPLATE.md, token-showcase.html template).
**Addresses features:** Working end-to-end workflow (table stakes), fresh context per screen (differentiator), 4-lens design review (differentiator).
**Avoids pitfalls:** Context budget exhaustion (agents encode explicit context profiles), core/runtime boundary violation (agent definitions placed correctly in runtimes/).

### Phase 2: Installer and Distribution

**Rationale:** The installer is the delivery mechanism for all content. Without it, users cannot install. Requires Layer 0 (core content, done) and Layer 1 (agents, Phase 1) to exist as content to copy. Building the installer before the content it delivers is wasteful.
**Delivers:** `bin/install.js` (detector, resolver, copier, injector, verifier pipeline), `package.json`, `.design-forge-manifest.json` support, `--uninstall` flag, `--dry-run` and `--force` flags.
**Uses stack:** `fs.cpSync`, `util.parseArgs`, `util.styleText`, `path.join/resolve`, synchronous fs APIs.
**Implements architecture:** Manifest-based install tracking (Pattern 4), content-hash diffing for safe upgrades (Pattern 5), sentinel-marker config injection.
**Avoids pitfalls:** Installer overwrites (backup + sentinel markers), `{FORGE_ROOT}` resolution (post-install grep verification), silent failures (exit code 1 on any failure with specific error messages), npm package ships wrong files (`files` whitelist + `npm pack --dry-run` verification).

### Phase 3: Rebrand, README, and Publish Preparation

**Rationale:** The product needs a clean identity before any public exposure. "Design Forge" references must become "Motif" across all files. README is the npm storefront -- without it, adoption is near-zero. LICENSE is legally required for enterprise adoption. This is the "make it shippable" phase.
**Delivers:** Full rebrand (package name, commands `/forge:*` to `/motif:*`, install directories, all references), README.md with pitch/install/usage/architecture, LICENSE (MIT), package.json final configuration.
**Addresses features:** README with clear pitch (table stakes), MIT License (table stakes), package.json with correct bin field (table stakes).

### Phase 4: Vertical Expansion and Hooks

**Rationale:** One vertical (fintech) proves the concept. Three more (health, SaaS, e-commerce) prove generalizability -- "any vertical" is the marketing pitch. Hooks enforce design system compliance during composition (preventive, not corrective). Neither blocks the core workflow but both significantly improve quality and breadth. Can be built in parallel.
**Delivers:** 3 additional vertical databases (health, SaaS, e-commerce), 4 PostToolUse hooks (token-check, font-check, a11y-check, context-monitor), 2 utility scripts (contrast-checker, token-counter).
**Addresses features:** Vertical intelligence databases (primary differentiator), PostToolUse enforcement (differentiator), WCAG contrast checking.
**Avoids pitfalls:** Vertical template drift (diff new verticals against fintech.md structure), hooks performance degradation (narrow matchers, file extension filtering, async execution for slow checks), hooks progressive duplication bug (documented Claude Code issue).

### Phase 5: End-to-End Validation

**Rationale:** All prior phases build individual pieces. This phase proves they work together. Run the full workflow on a real project (CryptoPay fintech). Measure actual token consumption. Verify differentiation seed produces distinct outputs. Confirm brand color lock-in works. Check that screen quality does not degrade across 5+ screens. This is where integration bugs surface.
**Delivers:** Battle-tested product, documented token costs per command, verified multi-screen quality consistency, confidence that the product works before public release.
**Addresses features:** Working end-to-end workflow (table stakes validation), differentiation seed (differentiator validation), brand color lock-in (differentiator validation).
**Avoids pitfalls:** Context budget exhaustion (measure real context usage), subagent token costs (measure real costs, document in help), all integration gotchas (test installer on fresh project, re-install, existing config).

### Phase 6: CI/CD and npm Publishing

**Rationale:** Only publish once the product is validated end-to-end. Publishing prematurely burns trust. GitHub Actions for automated npm publishing, version tagging, and CHANGELOG generation.
**Delivers:** Automated publish pipeline, version management, CHANGELOG.md, npm registry presence.

### Phase Ordering Rationale

- **Phase 1 before Phase 2:** The installer copies content. The content (agents, templates) must exist before the installer can copy it. Building the installer first would require placeholder files.
- **Phase 2 before Phase 3:** The README documents the install command and usage. The installer must work before documenting it. The rebrand touches file paths that the installer references.
- **Phase 3 before Phase 4:** The rebrand must happen before adding new content (verticals, hooks) to avoid doing the rebrand work twice across more files.
- **Phase 4 parallel tracks:** Verticals and hooks are independent. Verticals depend only on the VERTICAL-TEMPLATE.md format (already defined). Hooks depend only on the tokens.css format (defined by Phase 1 agent output). Both can be built in parallel.
- **Phase 5 after Phase 4:** End-to-end validation needs the full product. Testing with only fintech misses vertical expansion issues.
- **Phase 6 after Phase 5:** Never publish an unvalidated product.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1 (Agents):** Agent definitions require careful context profile design. The Claude Code subagent API (Task() parameters, tool restrictions, model selection) needs hands-on testing. The context-engine.md spec is thorough but untested.
- **Phase 2 (Installer):** The manifest-based upgrade system and settings.json hook merging need careful implementation research. Claude Code settings.json caching behavior (changes require session restart) affects installation UX.
- **Phase 4 (Hooks):** The PostToolUse hook progressive duplication bug (Issue #3523) needs workaround research. Async hook execution patterns need investigation for performance-sensitive checks.

Phases with standard patterns (skip deep research):
- **Phase 3 (Rebrand/README/License):** Straightforward find-and-replace plus documentation writing. Well-documented npm publishing patterns.
- **Phase 5 (E2E Validation):** Testing, not building. The research question is "does it work?" not "how to build it?"
- **Phase 6 (CI/CD):** Standard GitHub Actions npm publish workflow. Well-documented, many reference implementations.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Zero-dependency Node.js stdlib approach is well-documented. All APIs verified against official Node.js docs. Version compatibility table is precise. |
| Features | MEDIUM-HIGH | Table stakes and differentiators well-identified through competitor analysis (v0, shadcn, Figma MCP, Emergent). Feature dependencies mapped. MVP definition is clear. Slight uncertainty on whether differentiation seed will produce meaningfully distinct outputs in practice. |
| Architecture | HIGH | Core/adapter separation is a proven plugin pattern. Build order dependencies are concrete. Install flow, runtime data flow, and upgrade flow are fully specified. The existing codebase validates the architectural approach. |
| Pitfalls | HIGH | Pitfalls verified against Claude Code official docs, real GitHub issues (hook duplication #3523, settings cache #22679, npm path issues), and project-internal specs. Recovery strategies documented. |

**Overall confidence:** HIGH

### Gaps to Address

- **Agent definitions are unvalidated:** The context-engine.md spec defines context profiles, but no agent has been built using them. The first agent definition will test whether the profiles are practical. Plan to iterate on context-engine.md based on Phase 1 findings.
- **Differentiation seed effectiveness is theoretical:** The color decision algorithm with seed-adjusted hue ranges is fully designed but never tested with real AI agent output. Phase 5 validation must specifically test: do two different seeds for the same vertical produce visually distinct results?
- **Windows compatibility is untested:** All development is on macOS. The installer uses `path.join()` (correct), but Windows-specific issues (backslash paths, shebang handling via npm cmd shimmer, `/tmp` execute permissions for npx) need testing before v1.0 release.
- **Token cost per command is unknown:** The 80-120K estimate for `/forge:research` is based on community observations, not measurement. Phase 5 must measure actual costs and validate against user plan limits.
- **Hook duplication bug workaround is unclear:** Claude Code Issue #3523 documents progressive hook duplication during sessions. No official fix documented. Phase 4 needs to investigate whether narrower matchers, hook deduplication in the script itself, or session restart guidance is the best mitigation.
- **Rebrand scope is uncertain:** The spec references both "Design Forge" and "Motif" as the product name. The full scope of the rebrand (file paths, directory names, command prefixes, documentation references) needs an audit before Phase 3 planning.

## Sources

### Primary (HIGH confidence)
- [Node.js fs documentation](https://nodejs.org/api/fs.html) -- `fs.cpSync`, `fs.mkdirSync`, all Stability 2 (Stable)
- [Node.js util documentation](https://nodejs.org/api/util.html) -- `util.parseArgs` (stable v20.0.0), `util.styleText` (stable v22.13.0)
- [Node.js release schedule](https://nodejs.org/en/about/previous-releases) -- Node 22 LTS maintenance until Apr 2027
- [Claude Code Hooks Documentation](https://code.claude.com/docs/en/hooks-guide) -- PostToolUse format, matchers, stdin JSON schema
- [Claude Code Subagents Documentation](https://code.claude.com/docs/en/sub-agents) -- Task() spawning, fresh context, model selection
- [npm package.json docs](https://docs.npmjs.com/cli/v7/configuring-npm/package-json/) -- `bin`, `files`, `engines` fields
- Project spec (`GSD-PROJECT-SPEC.md`) and existing codebase -- architecture, constraints, built vs not-built inventory

### Secondary (MEDIUM confidence)
- [shadcn/ui CLI Documentation](https://ui.shadcn.com/docs/cli) -- Install pattern reference (npx init, --yes flag)
- [W3C DTCG Design Tokens Spec](https://www.designtokens.org/) -- First stable version October 2025
- [Figma MCP Server Blog](https://www.figma.com/blog/design-systems-ai-mcp/) -- Future integration point
- [Claude Code Hook Duplication Bug (Issue #3523)](https://github.com/anthropics/claude-code/issues/3523) -- Progressive duplication during sessions
- [Claude Code Settings Cache (Issue #22679)](https://github.com/anthropics/claude-code/issues/22679) -- Changes require session restart
- [npm CLI path issues on Windows](https://github.com/npm/cli/issues/13789) -- Path separator problems
- [Context engineering for coding agents (Martin Fowler)](https://martinfowler.com/articles/exploring-gen-ai/context-engineering-coding-agents.html) -- Context curation patterns

### Tertiary (LOW confidence)
- [Claude Code token cost observations (DEV Community)](https://dev.to/onlineeric/claude-code-sub-agents-burn-out-your-tokens-4cd8) -- Real-world consumption data, single source
- [Plugin Architecture in Node.js](https://medium.com/@Modexa/plugin-architecture-in-node-js-without-regrets-e02ba78660c7) -- Plugin pattern reference, single source

---
*Research completed: 2026-03-01*
*Ready for roadmap: yes*
