# Roadmap: Motif

## Milestones

- v1.0 Core Design System — Phases 1-8 (shipped 2026-03-04)
- v1.1 Icon Library Integration — Phases 9-12 (shipped 2026-03-04)
- v1.2 Brownfield Intelligence — Phases 13-16 (shipped 2026-03-06)
- v1.3 Global Reach — Phases 17-20 (in progress)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

<details>
<summary>v1.0 Core Design System (Phases 1-8) — SHIPPED 2026-03-04</summary>

- [x] Phase 1: Agent Definitions (3/3 plans) — completed 2026-03-01
- [x] Phase 2: Templates (2/2 plans) — completed 2026-03-01
- [x] Phase 3: Installer (3/3 plans) — completed 2026-03-02
- [x] Phase 4: Rebrand and Distribution (4/4 plans) — completed 2026-03-02
- [x] Phase 5: Verticals (3/3 plans) — completed 2026-03-02
- [x] Phase 6: Hooks and Scripts (3/3 plans) — completed 2026-03-02
- [x] Phase 7: Validation (3/3 plans) — completed 2026-03-03
- [x] Phase 8: CI and Publish (2/2 plans) — completed 2026-03-04
- [x] Phase 8.1: Pre-Publish Fixes (1/1 plan) — completed 2026-03-03

See: `.planning/milestones/v1.0-ROADMAP.md`

</details>

<details>
<summary>v1.1 Icon Library Integration (Phases 9-12) — SHIPPED 2026-03-04</summary>

- [x] Phase 9: Foundation (1/1 plan) — completed 2026-03-04
- [x] Phase 10: Vertical Migration (2/2 plans) — completed 2026-03-04
- [x] Phase 11: Pipeline Integration (3/3 plans) — completed 2026-03-04
- [x] Phase 12: Enforcement and Validation (2/2 plans) — completed 2026-03-04

See: `.planning/milestones/v1.1-ROADMAP.md`

</details>

<details>
<summary>v1.2 Brownfield Intelligence (Phases 13-16) — SHIPPED 2026-03-06</summary>

- [x] Phase 13: Scan Infrastructure (2/2 plans) — completed 2026-03-05
- [x] Phase 14: Token and System Integration (3/3 plans) — completed 2026-03-05
- [x] Phase 15: Compose Integration (2/2 plans) — completed 2026-03-06
- [x] Phase 16: Validation and Hardening (2/2 plans) — completed 2026-03-06

</details>

### v1.3 Global Reach (In Progress)

**Milestone Goal:** Make Motif installable once and usable everywhere — resilient state that survives context clears, global CLI for zero-friction setup, and complete vertical coverage across 8 domains.

- [x] Phase 17: Context Resilience — Every Motif workflow survives /clear and context compaction without losing state (completed 2026-03-09)
- [ ] Phase 18: New Verticals — Users can generate domain-intelligent designs for Social, Education, Marketplace, and DevTools projects
- [ ] Phase 19: Global CLI Core — Users can install Motif globally and scaffold it into any project with a single command
- [ ] Phase 20: CLI Commands and Vertical Discovery — Users can inspect, diagnose, update, and browse their Motif installation from the command line

## Phase Details

### Phase 17: Context Resilience
**Goal**: Every Motif workflow survives /clear and context compaction without losing progress or requiring manual re-orientation
**Depends on**: Phase 16 (v1.2 complete)
**Requirements**: CTXR-01, CTXR-02, CTXR-03, CTXR-04
**Success Criteria** (what must be TRUE):
  1. User can run `/clear` mid-workflow, invoke the next `/motif:*` command, and have the agent automatically know the current phase, vertical, and screen count without being told
  2. User can open STATE.md and see machine-parseable YAML frontmatter with phase, vertical, and stack fields that any script or hook can read reliably
  3. User can delete or corrupt STATE.md, run a `/motif:*` command, and have the system infer minimum progress from existing artifacts (tokens.css, COMPONENT-SPECS.md, screen files) rather than failing
  4. User sees a status line on every agent turn showing the current Motif phase and screen count (e.g., "Motif: COMPOSING | 3/5 screens")
**Plans:** 3 plans

Plans:
- [x] 17-01-PLAN.md — State infrastructure (motif-state.js utility, YAML template, state-machine docs)
- [x] 17-02-PLAN.md — SessionStart hook and CLAUDE.md state rule (three-layer defense)
- [x] 17-03-PLAN.md — Status line upgrade and workflow gate check updates

### Phase 18: New Verticals
**Goal**: Users can generate domain-intelligent designs for Social, Education, Marketplace, and DevTools projects with the same quality and completeness as existing verticals
**Depends on**: Phase 16 (v1.2 complete — no dependency on Phase 17; can be parallelized)
**Requirements**: VERT-01, VERT-02, VERT-03, VERT-04, VERT-05, VERT-06
**Success Criteria** (what must be TRUE):
  1. User can select "social" as their vertical during `/motif:init` and receive a complete design system with Social-specific palettes, typography, components, spacing, and interaction patterns
  2. User can select "education", "marketplace", or "devtools" as their vertical and receive the same completeness — each vertical has full design intelligence including palettes, typography, components, spacing, interaction patterns, and accessibility guidance
  3. User can see icon vocabulary entries for each new vertical mapped across all 4 icon libraries (Lucide, Phosphor, Material Symbols, Tabler) in the generated ICON-CATALOG.md
  4. User can receive domain-specific empty states, error states, and loading state patterns appropriate to each vertical (e.g., "no messages yet" for Social, "no courses enrolled" for Education)
  5. Each new vertical file validates against the same template structure as existing verticals (consistent section headings, token naming, palette tables, component specs)
**Plans:** 3 plans

Plans:
- [ ] 18-01-PLAN.md — Social and Education vertical reference files
- [ ] 18-02-PLAN.md — Marketplace and DevTools vertical reference files
- [ ] 18-03-PLAN.md — Integration point updates (icon-libraries.md, gap-analyzer.js, init.md)

### Phase 19: Global CLI Core
**Goal**: Users can install Motif once globally and scaffold it into any project without needing npx or per-project npm install
**Depends on**: Phase 17, Phase 18
**Requirements**: GCLI-01, GCLI-02, GCLI-06
**Success Criteria** (what must be TRUE):
  1. User can run `npm install -g motif-design` and have a `motif` command available system-wide
  2. User can run `motif init` from any project directory and have Motif scaffolded into that project (commands, workflows, agents, hooks, CLAUDE.md injection) without needing npx or a local install
  3. User can still use `npx motif-design@latest` as before — the global install does not break the existing npx path
  4. The installer detects project root correctly (walks up to find .git/ or package.json) and refuses to install from non-project directories with a clear error
**Plans**: TBD

Plans:
- [ ] 19-01: TBD
- [ ] 19-02: TBD

### Phase 20: CLI Commands and Vertical Discovery
**Goal**: Users can inspect, diagnose, update, and browse their Motif installation entirely from the command line
**Depends on**: Phase 19
**Requirements**: GCLI-03, GCLI-04, GCLI-05, VERT-07
**Success Criteria** (what must be TRUE):
  1. User can run `motif status` and see the installed version, current workflow phase, and number of screens composed for the current project
  2. User can run `motif update` and have project files synced from a newer global package version, with downgrade protection that refuses to overwrite newer files without --force
  3. User can run `motif doctor` and receive a diagnostic report checking file integrity (all expected files present), hook configuration (CLAUDE.md entries correct), and version consistency (global vs project)
  4. User can run `motif list` and see all available verticals (all 8) with short descriptions, so they know their options before running init
**Plans**: TBD

Plans:
- [ ] 20-01: TBD
- [ ] 20-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 17 → 18 → 19 → 20
(Note: Phases 17 and 18 have no mutual dependency and can be parallelized)

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
| 9. Foundation | v1.1 | 1/1 | Complete | 2026-03-04 |
| 10. Vertical Migration | v1.1 | 2/2 | Complete | 2026-03-04 |
| 11. Pipeline Integration | v1.1 | 3/3 | Complete | 2026-03-04 |
| 12. Enforcement and Validation | v1.1 | 2/2 | Complete | 2026-03-04 |
| 13. Scan Infrastructure | v1.2 | 2/2 | Complete | 2026-03-05 |
| 14. Token and System Integration | v1.2 | 3/3 | Complete | 2026-03-05 |
| 15. Compose Integration | v1.2 | 2/2 | Complete | 2026-03-06 |
| 16. Validation and Hardening | v1.2 | 2/2 | Complete | 2026-03-06 |
| 17. Context Resilience | v1.3 | 3/3 | Complete | 2026-03-09 |
| 18. New Verticals | v1.3 | 0/3 | Not started | - |
| 19. Global CLI Core | v1.3 | 0/TBD | Not started | - |
| 20. CLI Commands and Vertical Discovery | v1.3 | 0/TBD | Not started | - |
