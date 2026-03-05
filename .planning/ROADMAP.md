# Roadmap: Motif

## Milestones

- v1.0 Core Design System — Phases 1-8 (shipped 2026-03-04)
- v1.1 Icon Library Integration — Phases 9-12 (shipped 2026-03-04)
- v1.2 Brownfield Intelligence — Phases 13-16 (in progress)

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

### v1.2 Brownfield Intelligence (In Progress)

**Milestone Goal:** Make Motif's entire pipeline project-aware — scan existing codebases, present findings to the user for decisions, and output properly decomposed components that integrate with existing project conventions.

- [x] Phase 13: Scan Infrastructure - Users can scan an existing project and review confirmed findings — completed 2026-03-05
- [x] Phase 14: Token and System Integration - Users can have their existing design tokens detected, choose a merge strategy, and see what components are missing — completed 2026-03-05
- [ ] Phase 15: Compose Integration - Users can receive decomposed, project-aware screen output written to their actual directories
- [ ] Phase 16: Validation and Hardening - Users can trust that decomposed output is validated, atomically committed, and rollback-safe

## Phase Details

### Phase 13: Scan Infrastructure
**Goal**: Users can scan an existing project and review confirmed findings about its structure, components, and conventions before any generation happens
**Depends on**: Phase 12 (v1.1 complete)
**Requirements**: SCAN-01, SCAN-02, SCAN-04, SCAN-05
**Success Criteria** (what must be TRUE):
  1. User can run `/motif:scan` on an existing project and receive a structured report of framework, directory layout, CSS approach, and naming conventions
  2. User can see a catalog of existing components found in the project with file paths and export names
  3. User can review and confirm or correct all scan findings before any downstream generation uses them
  4. User can see extracted conventions from existing components (recurring patterns like border-radius values, spacing scales, shadow usage)
  5. Existing greenfield workflow (`/motif:init` without prior scan) continues to work unchanged
**Plans**: 2 plans

Plans:
- [x] 13-01-PLAN.md — Build core project scanner script (framework, CSS, structure, components, conventions)
- [x] 13-02-PLAN.md — Create /motif:scan command, scan workflow, init integration, state machine update

### Phase 14: Token and System Integration
**Goal**: Users can have their existing design tokens detected and merged with Motif's system, and see a gap analysis of which components already exist versus what the vertical needs
**Depends on**: Phase 13
**Requirements**: TOKN-01, TOKN-02, TOKN-03, SCAN-03
**Success Criteria** (what must be TRUE):
  1. User can see existing CSS custom properties or Tailwind config tokens detected and presented from their project
  2. User can choose a token strategy (adopt existing, merge with Motif, or start fresh) through a single top-level decision
  3. User can receive a selective token overlay that fills gaps in their existing tokens without overwriting what they already have
  4. User can see a gap analysis comparing their existing components against the vertical-required components, showing what needs to be generated versus what already exists
**Plans**: 3 plans

Plans:
- [x] 14-01-PLAN.md — Build token extractor script and integrate into scan workflow
- [x] 14-02-PLAN.md — Build component gap analysis script
- [x] 14-03-PLAN.md — Wire brownfield mode into system generator workflow, agent, and context engine

### Phase 15: Compose Integration
**Goal**: Users can receive decomposed screen compositions that reuse existing project components and are written to the project's actual directories following its conventions
**Depends on**: Phase 14
**Requirements**: COMP-01, COMP-02, COMP-03
**Success Criteria** (what must be TRUE):
  1. User can receive screen output decomposed into one component per file, each in its own file with proper imports
  2. User can have composed files written to the project's actual source directories (e.g., `src/components/`, `src/app/`) instead of only `.planning/design/screens/`
  3. User can have existing project components imported and reused in new compositions instead of being recreated from scratch
  4. Composed output follows the project's detected naming conventions, file structure, and framework patterns
**Plans**: 2 plans

Plans:
- [ ] 15-01-PLAN.md — Update context engine, summary template, and state machine for decomposed composition
- [ ] 15-02-PLAN.md — Add decomposition, project-directory placement, and component reuse to compose workflow

### Phase 16: Validation and Hardening
**Goal**: Users can trust that all decomposed output passes validation checks and is committed atomically with automatic rollback on failure
**Depends on**: Phase 15
**Requirements**: COMP-04
**Success Criteria** (what must be TRUE):
  1. User can have all decomposed files from a composition committed atomically in a single git commit
  2. User can have the commit automatically rolled back if any post-decomposition validation check fails (import cycles, naming conflicts, missing props)
  3. Stale scan artifacts are detected before composition, preventing ghost component references from outdated scans
**Plans**: TBD

Plans:
- [ ] 16-01: TBD
- [ ] 16-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 13 → 14 → 15 → 16

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
| 15. Compose Integration | v1.2 | 0/2 | Not started | - |
| 16. Validation and Hardening | v1.2 | 0/TBD | Not started | - |
