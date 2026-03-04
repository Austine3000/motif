# Roadmap: Motif

## Milestones

- v1.0 Core Design System - Phases 1-8 (shipped 2026-03-04)
- v1.1 Icon Library Integration - Phases 9-12 (in progress)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

<details>
<summary>v1.0 Core Design System (Phases 1-8) - SHIPPED 2026-03-04</summary>

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
- [x] 01-01-PLAN.md -- Researcher + System Architect agent definitions (AGNT-01, AGNT-02)
- [x] 01-02-PLAN.md -- Screen Composer + Design Reviewer agent definitions (AGNT-03, AGNT-04)
- [x] 01-03-PLAN.md -- Fix Agent definition (AGNT-05)

### Phase 2: Templates
**Goal**: Agent outputs have standardized formats -- state tracking, screen summaries, and token visualization all follow defined structures
**Depends on**: Phase 1
**Requirements**: TMPL-01, TMPL-02, TMPL-03
**Success Criteria** (what must be TRUE):
  1. STATE-TEMPLATE.md matches the state machine format defined in `core/references/state-machine.md`
  2. SUMMARY-TEMPLATE.md matches the format defined in `core/workflows/compose-screen.md`
  3. Token showcase HTML is a self-contained page that visually displays all design tokens
**Plans:** 2 plans

Plans:
- [x] 02-01-PLAN.md -- STATE-TEMPLATE.md + SUMMARY-TEMPLATE.md (TMPL-01, TMPL-02)
- [x] 02-02-PLAN.md -- Token showcase HTML template (TMPL-03)

### Phase 3: Installer
**Goal**: Users can install Motif with a single `npx` command and have a fully functional design system in their project
**Depends on**: Phase 1, Phase 2
**Requirements**: INST-01, INST-02, INST-03, INST-04, INST-05, INST-06, INST-07, INST-08
**Success Criteria** (what must be TRUE):
  1. Running `npx motif@latest` detects the runtime and completes installation
  2. After install, core content exists at `.claude/get-motif/` and commands at `.claude/commands/motif/`
  3. CLAUDE.md contains the Motif config snippet between sentinel markers
  4. Re-installing backs up modified files and updates via manifest-based diffing
  5. Post-install verification confirms zero unresolved `{FORGE_ROOT}` path variables
**Plans:** 3 plans

Plans:
- [x] 03-01-PLAN.md -- package.json + bin/install.js fresh-install pipeline
- [x] 03-02-PLAN.md -- Manifest-based upgrade tracking, backup, and uninstall
- [x] 03-03-PLAN.md -- End-to-end lifecycle verification

### Phase 4: Rebrand and Distribution
**Goal**: The product ships under the "Motif" identity with all packaging for npm distribution
**Depends on**: Phase 3
**Requirements**: BRND-01, DIST-01, DIST-02, DIST-03
**Success Criteria** (what must be TRUE):
  1. Zero references to "Design Forge" or "forge" remain in shipped files
  2. package.json has correct identity and configuration
  3. MIT LICENSE file exists
  4. README.md contains pitch, install instructions, command reference, architecture overview
**Plans:** 4 plans

Plans:
- [x] 04-01-PLAN.md -- Complete rebrand (BRND-01)
- [x] 04-02-PLAN.md -- MIT LICENSE and README.md (DIST-02, DIST-03)
- [x] 04-03-PLAN.md -- End-to-end verification
- [x] 04-04-PLAN.md -- UAT gap closure

### Phase 5: Verticals
**Goal**: Three new verticals demonstrate domain generalizability beyond fintech
**Depends on**: Phase 4
**Requirements**: VERT-01, VERT-02, VERT-03
**Success Criteria** (what must be TRUE):
  1. Health, SaaS, and e-commerce verticals exist following fintech.md structure exactly
  2. Each contains domain-specific patterns that produce visibly different designs
**Plans:** 3 plans

Plans:
- [x] 05-01-PLAN.md -- Health vertical (VERT-01)
- [x] 05-02-PLAN.md -- SaaS vertical (VERT-02)
- [x] 05-03-PLAN.md -- E-commerce vertical (VERT-03)

### Phase 6: Hooks and Scripts
**Goal**: Design system compliance is enforced automatically during composition
**Depends on**: Phase 4
**Requirements**: HOOK-01, HOOK-02, HOOK-03, HOOK-04, SCRP-01, SCRP-02
**Success Criteria** (what must be TRUE):
  1. Token-check, font-check, a11y-check hooks flag violations in authored files
  2. Context-monitor displays usage percentage and warns at 50%
  3. Contrast checker and token counter scripts work with pure Node.js
**Plans:** 3 plans

Plans:
- [x] 06-01-PLAN.md -- PostToolUse compliance hooks (HOOK-01, HOOK-02, HOOK-03)
- [x] 06-02-PLAN.md -- Context monitor and utility scripts (HOOK-04, SCRP-01, SCRP-02)
- [x] 06-03-PLAN.md -- Installer integration for hooks

### Phase 7: Validation
**Goal**: Complete Motif system works end-to-end on real projects
**Depends on**: Phase 5, Phase 6
**Requirements**: VALD-01, VALD-02, VALD-03, VALD-04, VALD-05
**Success Criteria** (what must be TRUE):
  1. Full workflow completes on controlled test project and CryptoPay
  2. Differentiation seeds produce visibly distinct designs
  3. Brand colors preserved without override
  4. Screen quality consistent across 5+ screens
**Plans:** 3 plans

Plans:
- [x] 07-01-PLAN.md -- Validation scripts (tooling)
- [x] 07-02-PLAN.md -- Controlled test project validation (VALD-01)
- [x] 07-03-PLAN.md -- CryptoPay battle test (VALD-02 through VALD-05)

### Phase 8: CI and Publish
**Goal**: Motif is published to npm with automated releases
**Depends on**: Phase 7
**Requirements**: DIST-04
**Success Criteria** (what must be TRUE):
  1. GitHub Actions triggers on tag and publishes to npm
  2. `npx motif-design@latest` installs from npm successfully
**Plans:** 2 plans

Plans:
- [x] 08-01-PLAN.md -- Pre-publish package preparation (DIST-04)
- [x] 08-02-PLAN.md -- GitHub repo, npm publishing, verification (DIST-04)

### Phase 8.1: Pre-Publish Integration Fixes (INSERTED)
**Goal**: Cross-phase integration gaps resolved before publishing
**Depends on**: Phase 8 Plan 01
**Success Criteria** (what must be TRUE):
  1. Vertical references resolve to correct installed paths
  2. CI workflow uses valid action versions
  3. Zero stale package name references
  4. init.md does not reference missing files
**Plans:** 1 plan

Plans:
- [x] 08.1-01-PLAN.md -- Fix vertical paths, CI versions, stale references

</details>

### v1.1 Icon Library Integration (In Progress)

**Milestone Goal:** Integrate established icon libraries into Motif's design system pipeline so composed screens use real, domain-appropriate icons instead of placeholders.

- [ ] **Phase 9: Foundation** - Icon library reference doc and icon size tokens
- [ ] **Phase 10: Vertical Migration** - Curated icon vocabularies for all 4 verticals
- [ ] **Phase 11: Pipeline Integration** - Architect and composer agent updates, ICON-CATALOG.md, token showcase
- [ ] **Phase 12: Enforcement and Validation** - Reviewer agent, aria-check hook, end-to-end verification

## Phase Details

### Phase 9: Foundation
**Goal**: A validated reference source for icon libraries exists and icon dimensions are expressed as design tokens -- every downstream phase reads from this foundation rather than inventing library metadata or hardcoding sizes
**Depends on**: Phase 8 / 8.1 (v1.0 complete; icon integration builds on the existing pipeline)
**Requirements**: IREF-01, IREF-02, IREF-03, ITOK-01, ITOK-02
**Success Criteria** (what must be TRUE):
  1. `icon-libraries.md` exists in `core/references/` with CDN URLs (version-pinned, never `@latest`), CSS class syntax, icon count, weight variants, and license for all 4 curated libraries (Phosphor, Lucide, Material Symbols, Tabler)
  2. Each vertical (fintech, health, SaaS, e-commerce) maps to a primary and secondary icon library in the domain affinity matrix within `icon-libraries.md`
  3. The selection algorithm is documented as a deterministic lookup (vertical + brand personality seed -> library + weight) with no ambiguity for the system architect agent
  4. Icon size tokens (`--icon-sm`, `--icon-md`, `--icon-lg`, `--icon-xl`, `--icon-2xl`) are defined in the token generation pipeline following the 8px-multiple scale (16/20/24/32/40px)
**Plans**: TBD

Plans:
- [ ] 09-01: TBD
- [ ] 09-02: TBD

### Phase 10: Vertical Migration
**Goal**: Every vertical has a pre-validated icon vocabulary so agents read concrete icon names from a lookup table instead of hallucinating them
**Depends on**: Phase 9 (vocabularies reference library naming conventions and CDN metadata from `icon-libraries.md`)
**Requirements**: IVOC-01, IVOC-02, IVOC-03, IVOC-04
**Success Criteria** (what must be TRUE):
  1. Fintech vertical has a curated icon vocabulary of 15-25 validated icon names organized by semantic category (navigation, finance, status, actions), with names confirmed to exist in the primary library (Phosphor)
  2. Health vertical has a curated icon vocabulary of 15-25 validated icon names with names confirmed to exist in its primary library (Material Symbols)
  3. SaaS vertical has a curated icon vocabulary of 15-25 validated icon names with names confirmed to exist in its primary library (Lucide)
  4. E-commerce vertical has a curated icon vocabulary of 15-25 validated icon names with names confirmed to exist in its primary library (Material Symbols)
  5. `grep -r '\[.*Icon' core/references/verticals/` returns zero matches -- all bracket-placeholder icon references have been replaced with real icon names
**Plans**: TBD

Plans:
- [ ] 10-01: TBD
- [ ] 10-02: TBD

### Phase 11: Pipeline Integration
**Goal**: The system architect selects an icon library during design system generation, the composer uses concrete icon names from a per-project catalog, and the token showcase renders real icons
**Depends on**: Phase 10 (agent enhancements reference vertical icon vocabularies; ICON-CATALOG.md draws from them)
**Requirements**: IPIP-01, IPIP-02, IPIP-03, IPIP-04, IPIP-05
**Success Criteria** (what must be TRUE):
  1. Running `/motif:system` on any vertical produces a DESIGN-SYSTEM.md that includes the selected icon library name, CDN link, and usage syntax in an iconography section
  2. Running `/motif:system` generates an `ICON-CATALOG.md` in `.planning/design/system/` with the vertical-specific icon mappings (semantic role -> concrete icon name)
  3. Running `/motif:compose` on a screen produces HTML that uses concrete icon class names from the selected library (no bracket placeholders, no invented names)
  4. The token showcase HTML includes a CDN link for the selected icon library and an iconography section showing the vertical's key icons at each size token
**Plans**: TBD

Plans:
- [ ] 11-01: TBD
- [ ] 11-02: TBD
- [ ] 11-03: TBD

### Phase 12: Enforcement and Validation
**Goal**: Icon usage is reviewed for consistency, accessibility is enforced for icon elements, and the entire icon pipeline is verified end-to-end
**Depends on**: Phase 11 (reviewer and hooks validate output that the pipeline produces)
**Requirements**: IENF-01, IENF-02
**Success Criteria** (what must be TRUE):
  1. The design reviewer agent checks that icon names in composed screens match the ICON-CATALOG.md and flags any names not in the catalog
  2. The design reviewer agent checks that icon choices are appropriate for the project's vertical (e.g., medical icons in a health app, not finance icons)
  3. The aria-check hook flags icon-only buttons missing `aria-label` and decorative icons missing `aria-hidden="true"`
  4. End-to-end: running the full pipeline (`/motif:system` then `/motif:compose` then `/motif:review`) on at least one vertical produces screens with rendered icons and zero icon-related review findings
**Plans**: TBD

Plans:
- [ ] 12-01: TBD
- [ ] 12-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 9 -> 10 -> 11 -> 12

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Agent Definitions | v1.0 | 3/3 | Complete | 2026-03-01 |
| 2. Templates | v1.0 | 2/2 | Complete | 2026-03-01 |
| 3. Installer | v1.0 | 3/3 | Complete | 2026-03-02 |
| 4. Rebrand and Distribution | v1.0 | 4/4 | Complete | 2026-03-02 |
| 5. Verticals | v1.0 | 3/3 | Complete | 2026-03-02 |
| 6. Hooks and Scripts | v1.0 | 3/3 | Complete | 2026-03-02 |
| 7. Validation | v1.0 | 3/3 | Complete | 2026-03-03 |
| 8. CI and Publish | v1.0 | 2/2 | Complete | 2026-03-04 |
| 8.1 Pre-Publish Fixes | v1.0 | 1/1 | Complete | 2026-03-03 |
| 9. Foundation | v1.1 | 0/TBD | Not started | - |
| 10. Vertical Migration | v1.1 | 0/TBD | Not started | - |
| 11. Pipeline Integration | v1.1 | 0/TBD | Not started | - |
| 12. Enforcement and Validation | v1.1 | 0/TBD | Not started | - |
