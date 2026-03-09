# Roadmap: Motif

## Milestones

- v1.0 Core Design System — Phases 1-8 (shipped 2026-03-04)
- v1.1 Icon Library Integration — Phases 9-12 (shipped 2026-03-04)
- v1.2 Brownfield Intelligence — Phases 13-16 (shipped 2026-03-06)
- v1.3 Global Reach — Phases 17-21 (shipped 2026-03-09)
- v1.4 Cross-Platform App Builder — Phases 22-26 (in progress)

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

<details>
<summary>v1.3 Global Reach (Phases 17-21) — SHIPPED 2026-03-09</summary>

- [x] Phase 17: Context Resilience (3/3 plans) — completed 2026-03-09
- [x] Phase 18: New Verticals (3/3 plans) — completed 2026-03-09
- [x] Phase 19: Global CLI Core (2/2 plans) — completed 2026-03-09
- [x] Phase 20: CLI Commands and Vertical Discovery (2/2 plans) — completed 2026-03-09
- [x] Phase 21: Package Source Sync (2/2 plans) — completed 2026-03-09

</details>

### v1.4 Cross-Platform App Builder (In Progress)

**Milestone Goal:** Transform Motif from a design system generator into a full design-to-running-app pipeline — smart framework scaffolding, platform-aware component composition, and auto-run that takes users from zero to seeing their app running.

- [x] Phase 22: Platform Foundation (2/2 plans) — completed 2026-03-09
- [x] Phase 23: Next.js Scaffolding and Web Composition (3/3 plans) — completed 2026-03-10
- [ ] Phase 24: Vite, Static, and Brownfield — Vite/React scaffolding, static HTML preservation, and brownfield framework detection for web projects
- [ ] Phase 25: Auto-Run — Dev server launch, ready detection, browser opening, and process cleanup after composition
- [ ] Phase 26: Expo and React Native — Mobile scaffolding, React Native component output, and cross-platform design consistency

## Phase Details

### Phase 22: Platform Foundation
**Goal**: Users select a target platform during init, and Motif's design system pipeline automatically produces platform-appropriate token files alongside the canonical tokens.css
**Depends on**: Phase 21 (v1.3 complete)
**Requirements**: PLAT-01, PLAT-02, PLAT-03, PLAT-04
**Success Criteria** (what must be TRUE):
  1. User can run `/motif:init`, select a platform (web-nextjs, web-vite, web-static, mobile-expo), and see that choice persisted in STATE.md across `/clear`
  2. After design system generation, user finds platform-specific token files (tokens.ts for React web, tokens.native.ts for React Native) alongside tokens.css, with values matching exactly
  3. User can inspect the framework registry and see complete mappings for each platform: scaffolding commands, file conventions, component patterns, and dev server commands
  4. Token files are deterministically generated from tokens.css by a script — never LLM-generated, never drifting from the source of truth
**Plans**: 2 plans

Plans:
- [x] 22-01: Platform field in STATE.md, init flow updates, framework registry reference
- [x] 22-02: Token transformer script, design system pipeline integration

### Phase 23: Next.js Scaffolding and Web Composition
**Goal**: Users can go from `/motif:init` to a real Next.js project with composed screens that are actual JSX components using Tailwind utility classes and shadcn/ui primitives
**Depends on**: Phase 22
**Requirements**: SCAF-01, SCAF-02, SCAF-07, PLAT-05, COMP-01, COMP-05, COMP-07
**Success Criteria** (what must be TRUE):
  1. User runs `/motif:init`, answers what they are building, and receives a framework recommendation (Next.js for SSR apps, Vite for SPAs, Expo for mobile) with the ability to override
  2. User scaffolds a Next.js project that is immediately runnable (`npm run dev` works) with App Router structure, TypeScript, Tailwind CSS, and shadcn/ui installed and configured with Motif's design tokens
  3. User runs `/motif:compose` and gets real Next.js page components (proper imports, next/font, next/image, "use client" where needed, App Router file conventions) instead of raw HTML files
  4. Composed components use Tailwind utility classes (bg-primary, text-lg) and shadcn/ui primitives (Button, Card, Input) rather than inline styles or raw HTML elements
  5. A tailwind.config.ts file extends Tailwind's theme with all Motif design tokens (colors, spacing, typography, radii, shadows) as semantic classes
**Plans**: 3 plans

Plans:
- [x] 23-01-PLAN.md — Framework recommendation logic in init, registry shadcn config
- [x] 23-02-PLAN.md — Tailwind config generator script (tokens.css to globals.css bridge)
- [x] 23-03-PLAN.md — Composer platform overlay (composer-nextjs.md), orchestrator injection

### Phase 24: Vite, Static, and Brownfield
**Goal**: Users building lightweight web apps or landing pages get the same scaffolding and composition quality as Next.js, and users with existing framework projects skip scaffolding entirely
**Depends on**: Phase 23 (reuses web-react composition infrastructure)
**Requirements**: SCAF-03, SCAF-05, SCAF-06, COMP-02, COMP-04
**Success Criteria** (what must be TRUE):
  1. User scaffolds a Vite/React project that is immediately runnable (`npm run dev` works) with React Router, TypeScript, and Tailwind CSS configured
  2. User runs `/motif:compose` on a Vite project and gets React components with proper imports and React Router conventions (not Next.js App Router conventions)
  3. User scaffolds a static HTML landing page project and gets a minimal structure with design tokens linked, openable directly in a browser
  4. User runs `/motif:init` in a directory with an existing Next.js/Vite/Expo project and Motif detects the framework, skips scaffolding, and adopts the existing platform automatically
**Plans**: 2 plans

Plans:
- [ ] 24-01: Vite scaffolding, composer-vite.md overlay, Vite-specific JSX output
- [ ] 24-02: Static HTML scaffolding, brownfield detection logic (SCAF-06)

### Phase 25: Auto-Run
**Goal**: After composition, users see their app running in the browser with a single command — Motif handles dev server launch, ready detection, and cleanup
**Depends on**: Phase 23 (needs a scaffolded, composable project to run)
**Requirements**: ARUN-01, ARUN-02, ARUN-03, ARUN-04
**Success Criteria** (what must be TRUE):
  1. User is offered the option to auto-run after `/motif:compose` completes, and the dev server starts as a background process without blocking the terminal
  2. Browser opens automatically only after the dev server is ready (detected via stdout parsing for framework-specific ready messages like "Ready on http://localhost:3000")
  3. User can see tracked dev server PIDs, and zombie processes are cleaned up on exit, SIGINT, and SIGTERM — no orphaned servers locking ports
  4. Browser/simulator opening works on macOS (open), Linux (xdg-open), and Windows (cmd start) with zero npm dependencies
**Plans**: 2 plans

Plans:
- [ ] 25-01: Auto-run script (dev server launch, stdout ready detection, browser opening)
- [ ] 25-02: PID tracking, cleanup handlers, port conflict resolution

### Phase 26: Expo and React Native
**Goal**: Users building mobile apps get the same zero-to-running experience as web — Expo scaffolding, React Native component output, and consistent design language across platforms
**Depends on**: Phase 22 (token transformer), Phase 24 (brownfield detection pattern)
**Requirements**: SCAF-04, COMP-03, COMP-06
**Success Criteria** (what must be TRUE):
  1. User scaffolds an Expo/React Native project that is immediately runnable (`npx expo start --web` works) with TypeScript and Expo SDK configured
  2. User runs `/motif:compose` on an Expo project and gets React Native components using View, Text, ScrollView, StyleSheet.create — no CSS, no div/span, no className
  3. Composed mobile screens produce visually consistent results with their web counterparts — same color palette, same typography scale, same spacing rhythm, same component patterns adapted to native primitives
  4. Unsupported CSS properties (grid, box-shadow, pseudo-elements, position:fixed) are handled explicitly with inline TODO comments — never silently dropped
**Plans**: 2 plans

Plans:
- [ ] 26-01: Expo scaffolding via create-expo-app, tokens.native.ts verification
- [ ] 26-02: Composer-rn.md overlay, React Native component output, CSS-to-RN property matrix
- [ ] 26-03: Cross-platform consistency validation, COMP-06 verification

## Progress

**Execution Order:**
Phases execute in numeric order: 22 → 23 → 24 → 25 → 26
(Note: Phase 24 and Phase 25 have no mutual dependency and could be parallelized after Phase 23)
(Note: Phase 26 depends on Phase 22 directly but benefits from Phase 24's brownfield pattern)

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
| 18. New Verticals | v1.3 | 3/3 | Complete | 2026-03-09 |
| 19. Global CLI Core | v1.3 | 2/2 | Complete | 2026-03-09 |
| 20. CLI Commands and Vertical Discovery | v1.3 | 2/2 | Complete | 2026-03-09 |
| 21. Package Source Sync | v1.3 | 2/2 | Complete | 2026-03-09 |
| 22. Platform Foundation | v1.4 | 2/2 | Complete | 2026-03-09 |
| 23. Next.js Scaffolding and Web Composition | v1.4 | 3/3 | Complete | 2026-03-10 |
| 24. Vite, Static, and Brownfield | v1.4 | 0/TBD | Not started | - |
| 25. Auto-Run | v1.4 | 0/TBD | Not started | - |
| 26. Expo and React Native | v1.4 | 0/TBD | Not started | - |
