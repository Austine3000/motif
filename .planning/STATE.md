# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-09)

**Core value:** Domain-intelligent design delivered through fresh context — a fintech app must look like fintech, not meditation, and screen 5 must be as good as screen 1.
**Current focus:** v1.4 Cross-Platform App Builder — Phase 23 (Next.js Scaffolding and Web Composition)

## Current Position

Phase: 23 of 26 (Next.js Scaffolding and Web Composition)
Plan: 3 of 3 in current phase (COMPLETE)
Status: Phase Complete
Last activity: 2026-03-10 — Plan 23-03 complete (Composer Overlay and Platform Injection)

Progress: [████░░░░░░] 40% (v1.4)

## Performance Metrics

**Velocity:**
- Total plans completed: 56 (v1.0: 24, v1.1: 8, v1.2: 8, v1.3: 12, v1.4: 4)
- Average duration: ~2.4 min
- Total execution time: ~2 hours

**By Phase (v1.3 — most recent):**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 17. Context Resilience | 3/3 | 8min | 2.7min |
| 18. New Verticals | 3/3 | 12min | 4.0min |
| 19. Global CLI Core | 2/2 | 6min | 3.0min |
| 20. CLI Commands | 2/2 | 6min | 3.0min |
| 21. Package Source Sync | 2/2 | 4min | 2.0min |
| Phase 22 P01 | 3min | 2 tasks | 3 files |
| Phase 22 P02 | 3min | 2 tasks | 2 files |
| Phase 23 P01 | 1min | 2 tasks | 2 files |
| Phase 23 P02 | 3min | 2 tasks | 2 files |
| Phase 23 P03 | 3min | 2 tasks | 2 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [v1.4 roadmap]: Platform foundation first — everything depends on platform field and token transformer
- [v1.4 roadmap]: Next.js first to validate platform adapter pattern before harder platforms
- [v1.4 roadmap]: Auto-run after scaffolding — cannot start what is not scaffolded
- [v1.4 roadmap]: Expo/RN last — hardest platform (CSS-to-RN gaps), defer risk
- [v1.4 roadmap]: Vite grouped with static HTML and brownfield — reuses web-react infrastructure from Phase 23
- [v1.4 roadmap]: SCAF-01 (framework recommendation) in Phase 23 with Next.js — first user-facing scaffolding experience
- [v1.4 roadmap]: COMP-06 (cross-platform consistency) in Phase 26 — cannot verify until both web and mobile exist
- [Phase 22]: Framework registry is static JSON; platform enum: web-nextjs, web-vite, web-static, mobile-expo
- [Phase 22]: Colors category preserves text-/surface-/border- prefixes in token keys; only color- prefix stripped
- [Phase 22]: text-* disambiguation: suffix pattern matching (size suffixes = typography, all else = colors)
- [Phase 22]: Token transformer is non-blocking in pipeline; failure warns but does not stop design system generation
- [Phase 23]: Brownfield detection takes priority over keyword framework recommendation
- [Phase 23]: web-nextjs is default recommendation for ambiguous project descriptions
- [Phase 23]: Scaffold sequence: create-next-app -> shadcn init -> shadcn add -> Motif globals.css (order matters)
- [Phase 23]: Three-layer token bridge: Motif :root vars -> shadcn semantic mapping -> Tailwind @theme inline
- [Phase 23]: color-* tokens map directly in @theme; surface-/text-/border- tokens remap to --color-* namespace
- [Phase 23]: Platform overlay uses OVERRIDE semantics -- overlay rules take precedence over base composition rules
- [Phase 23]: HAS_OVERLAY conditional pattern preserves backward compatibility for web-static
- [Phase 23]: Server Component by default -- push use client to child components

### Pending Todos

None.

### Blockers/Concerns

- NativeWind v5 in preview (March 2026) — may need StyleSheet.create fallback for Expo+Tailwind path
- Windows spawn compatibility unverified — shell:true and npx.cmd patterns documented but not tested
- Next.js 16.1 App Router conventions still evolving — validate file placement before Phase 23 planning

## Session Continuity

Last session: 2026-03-10
Stopped at: Completed 23-03-PLAN.md (Phase 23 complete)
Resume file: None
