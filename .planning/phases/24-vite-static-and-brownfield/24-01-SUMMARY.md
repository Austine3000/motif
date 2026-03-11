---
phase: 24-vite-static-and-brownfield
plan: 01
subsystem: scaffolding
tags: [vite, react-router, tailwind, registry, brownfield]
requires:
  - phase: 23-nextjs-scaffolding-and-web-composition
    provides: Next.js scaffold/materialization patterns and overlay integration baseline
provides:
  - Phase 24 fixture harness with quick/full target checks
  - Shared registry-driven scaffold/materialization runner
  - Declarative web-vite scaffold contract with router/bootstrap/runtime destinations
  - Post-system scaffold hook gated by greenfield vs brownfield state
  - Vite-specific compose overlay for React Router output semantics
affects: [24-02, motif-init, motif-system, motif-compose]
tech-stack:
  added: [node:child_process spawnSync scaffold runner]
  patterns: [registry-driven scaffold execution, contract-owned file materialization, overlay-specific composition]
key-files:
  created:
    - .claude/get-motif/scripts/phase24-fixture-check.js
    - .claude/get-motif/scripts/scaffold-project.js
    - .claude/get-motif/references/composer-vite.md
    - .claude/get-motif/fixtures/phase24/next-app/package.json
    - .claude/get-motif/fixtures/phase24/vite-app/package.json
    - .claude/get-motif/fixtures/phase24/vite-app/vite.config.ts
    - .claude/get-motif/fixtures/phase24/expo-app/package.json
    - .claude/get-motif/fixtures/phase24/expo-app/app.json
    - .claude/get-motif/fixtures/phase24/react-ambiguous/package.json
  modified:
    - .claude/get-motif/references/framework-registry.json
    - .claude/get-motif/workflows/generate-system.md
key-decisions:
  - "Scaffold execution stays registry-driven via shared scaffold-project.js instead of embedding platform shell logic in generate-system.md"
  - "web-vite contract materializes project-local tokens/globals outputs and route bootstrap files to avoid runtime imports from .planning/"
patterns-established:
  - "Contract-owned file writes: scaffold runner only writes files declared by registry ownership metadata"
  - "Post-system scaffold hook: run scaffold/materialization after token/globals generation with brownfield scan gating"
requirements-completed: [SCAF-03, COMP-02]
duration: 5 min
completed: 2026-03-11
---

# Phase 24 Plan 01: Vite Scaffold + Overlay Summary

**Registry-driven Vite scaffold materialization now generates router-ready runtime files and compose-screen can enforce React Router TSX output through a dedicated Vite overlay.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-11T22:58:51+01:00
- **Completed:** 2026-03-11T23:04:08+01:00
- **Tasks:** 3
- **Files modified:** 11

## Accomplishments
- Added the Phase 24 fixture harness and baseline Next/Vite/Expo/ambiguous React fixtures for quick/full verification.
- Implemented shared `scaffold-project.js` that executes registry scaffold flows, generated-structure flows, template materialization, and project-local design artifact copying with owned-file protections.
- Expanded the `web-vite` registry contract for router bootstrap, Tailwind bridge runtime wiring, owned runtime files, and explicit scaffold sequence.
- Hooked scaffold execution into `generate-system.md` as a post-token step with greenfield/brownfield gating.
- Added `composer-vite.md` with Vite-specific file placement/import/styling/routing and anti-Next constraints.

## Task Commits

Each task was committed atomically:

1. **Task 1: Wave 0 fixture harness + baseline fixtures** - `e506b0b` (feat)
2. **Task 2: Shared scaffold runner + Vite registry contract** - `82fff99` (feat)
3. **Task 3: generate-system scaffold hook + Vite overlay** - `35b856d` (feat)

## Files Created/Modified
- `.claude/get-motif/scripts/phase24-fixture-check.js` - Quick/full fixture harness with target checks for Vite/static/brownfield assertions.
- `.claude/get-motif/fixtures/phase24/*` - Minimal detection fixtures for Next.js, Vite, Expo, and ambiguous React.
- `.claude/get-motif/scripts/scaffold-project.js` - Reusable scaffold/materialization executor with registry contract ownership safeguards.
- `.claude/get-motif/references/framework-registry.json` - Expanded `web-vite` contract with scaffold sequence, router conventions, runtime destinations, and materialization templates/artifact mapping.
- `.claude/get-motif/workflows/generate-system.md` - Added post-generation scaffold/materialization orchestration step with brownfield skip behavior.
- `.claude/get-motif/references/composer-vite.md` - New Vite + React Router overlay with anti-Next and anti-slop rules.

## Decisions Made
- Kept scaffold/materialization logic centralized in `scaffold-project.js` and declarative in the registry to remain reusable for additional platforms.
- Encoded Vite runtime file ownership and artifact destinations in registry metadata so reruns preserve non-owned user files.
- Placed scaffold execution after token/globals generation to ensure runtime CSS/token assets exist before materialization.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 24-01 outputs are complete and verified through fixture targets and contract checks.
- Phase 24-02 can now build on the Wave 0 harness plus shared scaffold runner to finish static destination behavior and brownfield adoption hardening.

## Self-Check: PASSED

- Summary file exists at `.planning/phases/24-vite-static-and-brownfield/24-01-SUMMARY.md`.
- Task commits verified: `e506b0b`, `82fff99`, `35b856d`.
