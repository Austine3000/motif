# Roadmap: Motif

## Overview

Motif is an npm-installable design engineering system for AI coding assistants. The build follows a strict dependency order: first create the agent definitions and templates that make workflows functional, then build the installer that delivers them, rebrand from "Design Forge" to "Motif" before adding new content, expand domain coverage with verticals and enforcement hooks, validate everything end-to-end on real projects, and finally automate publishing. Eight phases take the project from "designed but inert" to "published and battle-tested."

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Agent Definitions** - Create the 5 subagent personality definitions that make workflows executable
- [x] **Phase 2: Templates** - Build the 3 core output templates that formalize agent outputs
- [x] **Phase 3: Installer** - Build the runtime-detecting installer that delivers Motif to user projects
- [x] **Phase 4: Rebrand and Distribution** - Rename everything from "Design Forge" to "Motif" and prepare npm package identity
- [ ] **Phase 5: Verticals** - Add health, SaaS, and e-commerce domain intelligence databases
- [ ] **Phase 6: Hooks and Scripts** - Build PostToolUse enforcement hooks and utility scripts
- [ ] **Phase 7: Validation** - End-to-end testing on controlled and real projects
- [ ] **Phase 8: CI and Publish** - Automate npm publishing via GitHub Actions

## Phase Details

### Phase 1: Agent Definitions
**Goal**: Workflows become executable -- every subagent spawn has a defined personality, context profile, model selection, and tool restrictions
**Depends on**: Nothing (first phase; existing core references and workflows are read-only inputs)
**Requirements**: AGNT-01, AGNT-02, AGNT-03, AGNT-04, AGNT-05
**Success Criteria** (what must be TRUE):
  1. Each of the 5 agent definitions (researcher, system-architect, screen-composer, design-reviewer, fix-agent) exists as a markdown file in `runtimes/claude-code/agents/`
  2. Each agent definition specifies which files to load and which to never load (explicit context-loading profile per context-engine.md)
  3. Each agent definition specifies model selection, tool restrictions, and output format expectations
  4. A workflow orchestrator can read an agent definition and know exactly what to pass to Task() -- no ambiguity about context, model, or tools
**Plans:** 3 plans

Plans:
- [x] 01-01-PLAN.md — Researcher + System Architect agent definitions (AGNT-01, AGNT-02)
- [x] 01-02-PLAN.md — Screen Composer + Design Reviewer agent definitions (AGNT-03, AGNT-04)
- [x] 01-03-PLAN.md — Fix Agent definition (AGNT-05)

### Phase 2: Templates
**Goal**: Agent outputs have standardized formats -- state tracking, screen summaries, and token visualization all follow defined structures
**Depends on**: Phase 1 (templates formalize the output formats that agents produce; agent definitions reference these templates)
**Requirements**: TMPL-01, TMPL-02, TMPL-03
**Success Criteria** (what must be TRUE):
  1. STATE-TEMPLATE.md matches the state machine format defined in `core/references/state-machine.md` and can be used by any workflow to initialize design state
  2. SUMMARY-TEMPLATE.md matches the format defined in `core/workflows/compose-screen.md` and provides the structure for screen composition summaries
  3. Token showcase HTML is a self-contained page (no external dependencies) that visually displays all design tokens -- colors, typography, spacing -- and can be opened in any browser
**Plans:** 2 plans

Plans:
- [x] 02-01-PLAN.md — STATE-TEMPLATE.md + SUMMARY-TEMPLATE.md (TMPL-01, TMPL-02)
- [x] 02-02-PLAN.md — Token showcase HTML template (TMPL-03)

### Phase 3: Installer
**Goal**: Users can install Motif with a single `npx` command and have a fully functional design system in their project
**Depends on**: Phase 1, Phase 2 (installer copies agents and templates; they must exist before the installer can deliver them)
**Requirements**: INST-01, INST-02, INST-03, INST-04, INST-05, INST-06, INST-07, INST-08
**Success Criteria** (what must be TRUE):
  1. Running `npx motif@latest` in a project with Claude Code detects the runtime automatically and completes installation without errors
  2. After install, `core/` content exists at `.claude/get-motif/` and commands exist at `.claude/commands/motif/` with correct directory structure
  3. CLAUDE.md contains the Motif config snippet between `<!-- MOTIF-START -->` and `<!-- MOTIF-END -->` sentinel markers, preserving any existing CLAUDE.md content
  4. Re-installing on an existing installation backs up modified files and updates cleanly via manifest-based content-hash diffing
  5. Post-install verification confirms zero unresolved `{FORGE_ROOT}` path variables in any installed file
**Plans:** 3 plans

Plans:
- [x] 03-01-PLAN.md — package.json + bin/install.js fresh-install pipeline (INST-01, INST-02, INST-03, INST-06 partial, INST-07, INST-08)
- [x] 03-02-PLAN.md — Manifest-based upgrade tracking, backup, and uninstall (INST-04, INST-05, INST-06 complete)
- [x] 03-03-PLAN.md — End-to-end lifecycle verification (all INST requirements)

### Phase 4: Rebrand and Distribution
**Goal**: The product ships under the "Motif" identity with all packaging required for npm distribution
**Depends on**: Phase 3 (installer must work before documenting it; rebrand touches paths the installer references)
**Requirements**: BRND-01, DIST-01, DIST-02, DIST-03
**Success Criteria** (what must be TRUE):
  1. Zero references to "Design Forge", "design-forge", "forge", or `/forge:` remain in any shipped file -- all replaced with "Motif", "motif", or `/motif:` equivalents
  2. `package.json` has name "motif", correct bin field pointing to `bin/install.js`, files whitelist (`bin/`, `core/`, `runtimes/`, `scripts/`), and engines `>=22.0.0`
  3. MIT LICENSE file exists at project root
  4. README.md contains pitch, one-command install instructions, command reference for all 10 slash commands, architecture overview, and how-it-works section
**Plans:** 4 plans

Plans:
- [x] 04-01-PLAN.md — Complete rebrand of source files, directories, installer, and CLAUDE.md (BRND-01)
- [x] 04-02-PLAN.md — MIT LICENSE and comprehensive README.md (DIST-02, DIST-03)
- [x] 04-03-PLAN.md — End-to-end verification of all Phase 4 requirements (BRND-01, DIST-01, DIST-02, DIST-03)
- [x] 04-04-PLAN.md — UAT gap closure: fix stale forge references in runtime-adapters.md, generate-system.md, BUILD-SPEC.md, e2e-installer.js

### Phase 5: Verticals
**Goal**: Motif proves domain generalizability -- three new verticals demonstrate that the system produces domain-intelligent designs beyond fintech
**Depends on**: Phase 4 (rebrand must happen before adding new content to avoid renaming new files later)
**Requirements**: VERT-01, VERT-02, VERT-03
**Success Criteria** (what must be TRUE):
  1. Health vertical exists at `core/references/verticals/health.md` and follows the exact structure of `fintech.md` (same sections, same depth of domain intelligence)
  2. SaaS vertical exists at `core/references/verticals/saas.md` and follows the exact structure of `fintech.md`
  3. E-commerce vertical exists at `core/references/verticals/ecommerce.md` and follows the exact structure of `fintech.md`
  4. Each vertical contains domain-specific patterns, color palettes, typography guidance, component patterns, and anti-patterns that would produce visibly different designs from fintech
**Plans**: TBD

Plans:
- [ ] 05-01: TBD
- [ ] 05-02: TBD

### Phase 6: Hooks and Scripts
**Goal**: Design system compliance is enforced automatically during composition, and utility scripts support agent workflows
**Depends on**: Phase 4 (hooks reference Motif paths and token formats; rebrand must be complete)
**Requirements**: HOOK-01, HOOK-02, HOOK-03, HOOK-04, SCRP-01, SCRP-02
**Success Criteria** (what must be TRUE):
  1. Token-check hook flags hardcoded CSS color/spacing/font-size values in .css/.tsx/.jsx/.vue/.html files written by Claude Code, suggesting token alternatives
  2. Font-check hook flags banned fonts (system defaults, generic sans-serif) unless the user has explicitly locked them as brand fonts
  3. A11y-check hook flags accessibility violations: div+onClick without role/tabindex, img without alt, input without label
  4. Context-monitor hook displays current context usage percentage in the status line and warns when context exceeds 50%
  5. Contrast checker script calculates WCAG contrast ratios for any two colors using pure Node.js (no dependencies)
**Plans**: TBD

Plans:
- [ ] 06-01: TBD
- [ ] 06-02: TBD

### Phase 7: Validation
**Goal**: The complete Motif system works end-to-end on real projects, proving that domain intelligence, fresh context, differentiation, and brand color preservation all function as designed
**Depends on**: Phase 5, Phase 6 (full product must exist -- all verticals, all hooks -- before comprehensive validation)
**Requirements**: VALD-01, VALD-02, VALD-03, VALD-04, VALD-05
**Success Criteria** (what must be TRUE):
  1. Full workflow (init, research, system, compose, review, fix) completes without errors on a controlled test project
  2. Full workflow completes on CryptoPay (real fintech project) producing usable design artifacts
  3. Running the same vertical with two different differentiation seeds produces visibly distinct color palettes, typography choices, and component styling
  4. User-specified brand colors appear in generated tokens without being overridden or replaced by the system's palette generation
  5. Screen quality (token compliance, design coherence) remains consistent across 5+ screens composed in sequence, demonstrating fresh context isolation
**Plans**: TBD

Plans:
- [ ] 07-01: TBD
- [ ] 07-02: TBD
- [ ] 07-03: TBD

### Phase 8: CI and Publish
**Goal**: Motif is published to npm and future releases are automated
**Depends on**: Phase 7 (never publish an unvalidated product)
**Requirements**: DIST-04
**Success Criteria** (what must be TRUE):
  1. GitHub Actions workflow triggers on git tag creation and publishes the package to npm automatically
  2. `npx motif@latest` installs the published package from npm and completes the installation flow successfully
**Plans**: TBD

Plans:
- [ ] 08-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 --> 2 --> 3 --> 4 --> 5 --> 6 --> 7 --> 8
Note: Phases 5 and 6 can execute in parallel (independent content).

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Agent Definitions | 3/3 | ✓ Complete | 2026-03-01 |
| 2. Templates | 2/2 | ✓ Complete | 2026-03-01 |
| 3. Installer | 3/3 | ✓ Complete | 2026-03-02 |
| 4. Rebrand and Distribution | 4/4 | ✓ Complete | 2026-03-02 |
| 5. Verticals | 0/TBD | Not started | - |
| 6. Hooks and Scripts | 0/TBD | Not started | - |
| 7. Validation | 0/TBD | Not started | - |
| 8. CI and Publish | 0/TBD | Not started | - |
