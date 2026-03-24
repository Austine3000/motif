# Roadmap: Motif

## Milestones

- v1.0 Core Design System — Phases 1-8 (shipped 2026-03-04)
- v1.1 Icon Library Integration — Phases 9-12 (shipped 2026-03-04)
- v1.2 Brownfield Intelligence — Phases 13-16 (shipped 2026-03-06)
- v1.3 Global Reach — Phases 17-21 (shipped 2026-03-09)
- v1.4 Cross-Platform App Builder — Phases 22-28 (shipped 2026-03-24)
- v1.5 Batch Compose — Phases 29-32 (in progress)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

<details>
<summary>v1.0 Core Design System (Phases 1-8) — SHIPPED 2026-03-04</summary>

- [x] Phase 1: Agent Definitions (3/3 plans) — completed 2026-03-01
- [x] Phase 2: Templates (2/2 plans) — completed 2026-03-01
- [x] Phase 3: Installer (3/4 plans) — completed 2026-03-02; gap-closure plan 03-04 added 2026-03-12
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

<details>
<summary>v1.3 Global Reach (Phases 17-21) — SHIPPED 2026-03-09</summary>

- [x] Phase 17: Context Resilience (3/3 plans) — completed 2026-03-09
- [x] Phase 18: New Verticals (3/3 plans) — completed 2026-03-09
- [x] Phase 19: Global CLI Core (2/2 plans) — completed 2026-03-09
- [x] Phase 20: CLI Commands and Vertical Discovery (2/2 plans) — completed 2026-03-09
- [x] Phase 21: Package Source Sync (2/2 plans) — completed 2026-03-09

</details>

<details>
<summary>v1.4 Cross-Platform App Builder (Phases 22-28) — SHIPPED 2026-03-24</summary>

- [x] Phase 22: Platform Foundation (2/2 plans) — completed 2026-03-09
- [x] Phase 23: Next.js Scaffolding and Web Composition (3/3 plans) — completed 2026-03-10
- [x] Phase 24: Vite, Static, and Brownfield (2/2 plans) — completed 2026-03-11
- [x] Phase 25: Auto-Run (2/2 plans) — completed 2026-03-12
- [x] Phase 26: Expo and React Native (3/3 plans) — completed 2026-03-12
- [x] Phase 27: Next.js Scaffold Execution (1/1 plan) — completed 2026-03-24
- [x] Phase 28: Auto-Run Cleanup and Validation (1/1 plan) — completed 2026-03-24

</details>

### v1.5 Batch Compose (In Progress)

**Milestone Goal:** Compose multiple screens in a single command with parallel execution, progress reporting, and automatic review — eliminating the tedium of running `/motif:compose` once per screen.

- [x] Phase 29: Core Batch Orchestration — Parallel multi-screen composition with wave-based dispatch, orchestrator-owned commits, and failure isolation (completed 2026-03-24)
- [ ] Phase 30: Progress Reporting and Batch Manifest — Per-screen status output, batch summary, and persistent BATCH-RESULT.md for cross-session reference
- [ ] Phase 31: Auto-Review Integration — Automatic review after batch completion, gated auto-run on review pass
- [ ] Phase 32: Reliability Enhancements — Batch resume after `/clear`, smart screen ordering, configurable concurrency

## Phase Details

### Phase 29: Core Batch Orchestration
**Goal**: Users can compose multiple screens in one command and get correct, atomic git history with isolated failure handling — the architectural foundation for all batch features
**Depends on**: Phase 28 (v1.4 complete)
**Requirements**: BATCH-01, BATCH-02, BATCH-03, BATCH-04, BATCH-05, REL-01
**Success Criteria** (what must be TRUE):
  1. User runs `/motif:compose login dashboard settings` and all three screens are composed in parallel, each in a fresh agent context, without interfering with each other
  2. User runs `/motif:compose --all` and every screen in STATE.md with status `planned` is composed without the user naming each one
  3. Git history shows one clean commit per screen (authored by orchestrator, not subagents) with correct `design(compose):` prefix and attribution — no index.lock errors, no interleaved commits
  4. If 2 of 5 screens fail during a batch, the 3 successful screens are committed and STATE.md reflects accurate per-screen status (composed vs failed) — failures do not block successes
  5. User can set concurrency cap via command argument (e.g., `/motif:compose --all --concurrency 2`) and observe waves dispatched at the specified parallelism
**Plans**: 2 plans

Plans:
- [x] 29-01-PLAN.md — Atomic batch state update command (batch-update-screens in motif-state.js)
- [x] 29-02-PLAN.md — Batch orchestration in compose-screen.md (argument parsing, wave dispatch, deferred commits, failure isolation)

### Phase 30: Progress Reporting and Batch Manifest
**Goal**: Users see clear, real-time feedback as screens compose and get a persistent summary they can reference after the batch finishes
**Depends on**: Phase 29
**Requirements**: PROG-01, PROG-02, PROG-03
**Success Criteria** (what must be TRUE):
  1. As each screen completes, the user sees its name, pass/fail status, and duration printed to output — no silent waiting
  2. After all screens complete, a batch summary table is displayed showing total screens, succeeded count, failed count, and total duration
  3. A BATCH-RESULT.md file exists in `.planning/design/` after every batch, containing the per-screen results and timestamps — readable in a new session after `/clear`
**Plans**: 1 plan

Plans:
- [ ] 30-01-PLAN.md — Progress reporting with timing, summary table, and BATCH-RESULT.md manifest

### Phase 31: Auto-Review Integration
**Goal**: Users get automatic design review across all composed screens after a batch completes, with auto-run gated on review results
**Depends on**: Phase 30 (needs accurate pass/fail results before offering review)
**Requirements**: REV-01, REV-02
**Success Criteria** (what must be TRUE):
  1. After a batch compose completes successfully, Motif automatically triggers `/motif:review` across all screens that were just composed — the user does not need to run review manually
  2. Auto-run (dev server launch) is only offered if the review passes or the user explicitly overrides — a failed review blocks auto-run with a clear explanation of what failed
**Plans**: TBD

Plans:
- [ ] 31-01: TBD

### Phase 32: Reliability Enhancements
**Goal**: Users can resume interrupted batches and get better composition quality through smart screen ordering
**Depends on**: Phase 29 (uses batch state infrastructure)
**Requirements**: REL-02, REL-03
**Success Criteria** (what must be TRUE):
  1. After a `/clear` mid-batch, running `/motif:compose --all` reads STATE.md and resumes from only the incomplete screens — already-composed screens are not re-composed
  2. Foundational screens (layout, navigation, shared components) are automatically placed in earlier waves, and feature screens that depend on them compose in later waves with access to the foundation screen summaries
**Plans**: TBD

Plans:
- [ ] 32-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 29 -> 30 -> 31 -> 32
(Note: Phase 32 depends on Phase 29 directly and could potentially run after Phase 29, but benefits from Phase 30's manifest)

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Agent Definitions | v1.0 | 3/3 | Complete | 2026-03-01 |
| 2. Templates | v1.0 | 2/2 | Complete | 2026-03-01 |
| 3. Installer | v1.0 | 3/4 | Gap Closure Planned | 2026-03-02 |
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
| 18. New Verticals | v1.3 | 3/3 | Complete | 2026-03-09 |
| 19. Global CLI Core | v1.3 | 2/2 | Complete | 2026-03-09 |
| 20. CLI Commands and Vertical Discovery | v1.3 | 2/2 | Complete | 2026-03-09 |
| 21. Package Source Sync | v1.3 | 2/2 | Complete | 2026-03-09 |
| 22. Platform Foundation | v1.4 | 2/2 | Complete | 2026-03-09 |
| 23. Next.js Scaffolding and Web Composition | v1.4 | 3/3 | Complete | 2026-03-10 |
| 24. Vite, Static, and Brownfield | v1.4 | 2/2 | Complete | 2026-03-11 |
| 25. Auto-Run | v1.4 | 2/2 | Complete | 2026-03-12 |
| 26. Expo and React Native | v1.4 | 3/3 | Complete | 2026-03-12 |
| 27. Next.js Scaffold Execution | v1.4 | 1/1 | Complete | 2026-03-24 |
| 28. Auto-Run Cleanup and Validation | v1.4 | 1/1 | Complete | 2026-03-24 |
| 29. Core Batch Orchestration | v1.5 | 2/2 | Complete | 2026-03-24 |
| 30. Progress Reporting and Batch Manifest | v1.5 | 0/1 | Not started | - |
| 31. Auto-Review Integration | v1.5 | 0/TBD | Not started | - |
| 32. Reliability Enhancements | v1.5 | 0/TBD | Not started | - |
